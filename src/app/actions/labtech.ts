'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import prisma from '@/lib/prisma'
import { requirePermission } from '@/lib/permissions'
import { convertToBaseUnit, determineBaseUnit } from '@/lib/unit-conversion'
import { deductFromBatches, calculateBatchDeductions } from '@/lib/fifo-engine'

// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------

const distributeChemicalSchema = z.object({
  chemicalId: z.number().int().positive(),
  recipientId: z.number().int().positive(),
  amount: z.number().positive('Amount must be greater than zero'),
  unit: z.enum(['GAL', 'L', 'ML', 'KG', 'G']),
  subject: z.string().min(1, 'Subject is required'),
  room: z.string().min(1, 'Room is required'),
  purpose: z.string().min(1, 'Purpose is required'),
})

const previewDistributionSchema = z.object({
  chemicalId: z.number().int().positive(),
  amount: z.number().positive('Amount must be greater than zero'),
  unit: z.enum(['GAL', 'L', 'ML', 'KG', 'G']),
})

const getRecentDistributionSchema = z.object({
  chemicalId: z.number().int().positive(),
  recipientId: z.number().int().positive(),
})

const distributeMultipleChemicalsSchema = z.object({
  recipientId: z.number().int().positive(),
  subject: z.string().min(1, 'Subject is required'),
  room: z.string().min(1, 'Room is required'),
  purpose: z.string().min(1, 'Purpose is required'),
  items: z.array(z.object({
    id: z.number().int().positive(),
    quantity: z.number().positive('Quantity must be greater than zero'),
    unit: z.enum(['GAL', 'L', 'ML', 'KG', 'G']),
  })).min(1, 'At least one item is required'),
})

// ---------------------------------------------------------------------------
// Actions
// ---------------------------------------------------------------------------

/**
 * Search for STAFF users by name
 * 
 * Filters users with STAFF role and returns matching results with department info.
 * Used by RecipientSelector component for chemical distribution.
 * 
 * @param query - Search term to match against first name or last name
 * @returns Array of STAFF users with department information
 */
export async function searchStaffUsers(query: string) {
  await requirePermission('view:chemicals')

  if (!query || query.length < 2) {
    return []
  }

  try {
    return await prisma.user.findMany({
      where: {
        roles: { some: { role: { name: 'STAFF' } } },
        isActive: true,
        OR: [
          { firstName: { contains: query } },
          { lastName: { contains: query } }
        ]
      },
      take: 8,
      include: {
        department: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: [
        { firstName: 'asc' },
        { lastName: 'asc' }
      ]
    })
  } catch (error) {
    console.error('Error searching staff users:', error)
    return []
  }
}

/**
 * Search for rooms with optional department filtering
 * 
 * Filters rooms by search query and optionally by department ID.
 * Used by RoomSelector component for chemical distribution.
 * When departmentId is provided, only rooms from that department are returned.
 * 
 * @param query - Search term to match against room name or location
 * @param departmentId - Optional department ID to filter rooms
 * @returns Array of rooms with department information
 */
export async function searchRooms(query: string, departmentId?: number | null) {
  await requirePermission('view:chemicals')

  if (!query || query.length < 2) {
    return []
  }

  try {
    return await prisma.room.findMany({
      where: {
        ...(departmentId && { departmentId }),
        OR: [
          { name: { contains: query } },
          { location: { contains: query } }
        ]
      },
      include: {
        department: {
          select: {
            id: true,
            name: true
          }
        }
      },
      take: 10,
      orderBy: { name: 'asc' }
    })
  } catch (error) {
    console.error('Error searching rooms:', error)
    return []
  }
}

/**
 * Distribute chemical from inventory to a STAFF user
 * 
 * Performs complete distribution operation within an atomic transaction:
 * - Validates user has 'manage:chemicals' permission
 * - Validates recipient has STAFF role
 * - Validates amount > 0
 * - Converts amount to base unit
 * - Executes FIFO deduction within Prisma transaction
 * - Creates ChemicalUsageRecord with isDistribution=true
 * - Updates Chemical total volume
 * - Returns success with optional stock warnings
 */
export async function distributeChemical(data: {
  chemicalId: number
  recipientId: number
  amount: number
  unit: string
  subject: string
  room: string
  purpose: string
}) {
  try {
    // Validate user has 'manage:chemicals' permission
    const { roles, user: currentUser } = await requirePermission('manage:chemicals')

    if (roles.includes('DEAN')) {
      return { success: false, error: 'Dean role does not have permission to perform this action.' }
    }

    // Validate input data
    const validated = distributeChemicalSchema.safeParse(data)
    if (!validated.success) {
      return {
        success: false,
        error: validated.error.issues[0]?.message || 'Invalid input data'
      }
    }

    const { chemicalId, recipientId, amount, unit, subject, room, purpose } = validated.data

    // Validate recipient has STAFF role
    const recipient = await prisma.user.findUnique({
      where: { id: recipientId },
      include: {
        roles: {
          include: {
            role: true
          }
        }
      }
    })

    if (!recipient) {
      return {
        success: false,
        error: 'Recipient not found'
      }
    }

    const recipientRoles = recipient.roles.map(ur => ur.role.name)
    if (!recipientRoles.includes('STAFF')) {
      return {
        success: false,
        error: 'Recipient must have STAFF role'
      }
    }

    // Verify chemical exists
    const chemical = await prisma.chemical.findUnique({
      where: { id: chemicalId },
      select: {
        id: true,
        name: true,
        volume: true,
        reorderLevel: true
      }
    })

    if (!chemical) {
      return {
        success: false,
        error: 'Chemical not found'
      }
    }

    // Convert amount to base unit
    const amountInBaseUnit = convertToBaseUnit(amount, unit)

    // Execute distribution within transaction
    const result = await prisma.$transaction(async (tx) => {
      // Deduct from batches using FIFO
      const deductionResult = await deductFromBatches(chemicalId, amountInBaseUnit, tx)

      if (!deductionResult.success) {
        throw new Error(deductionResult.error || 'Failed to deduct from batches')
      }

      // Get the first batch for the usage record (we need a chemicalBatchId)
      // Since FIFO deducts from multiple batches, we'll use the first affected batch
      const firstBatch = await tx.chemicalBatch.findFirst({
        where: {
          chemicalId,
          remainingVolume: { gte: 0 },
          expiryDate: { gt: new Date() }
        },
        orderBy: { purchaseDate: 'asc' }
      })

      if (!firstBatch) {
        throw new Error('No valid batch found for usage record')
      }

      // Parse subject and room IDs
      const subjectId = parseInt(subject)
      const roomId = parseInt(room)

      // Create ChemicalUsageRecord with isDistribution=true
      await (tx.chemicalUsageRecord as any).create({
        data: {
          chemicalBatchId: firstBatch.id,
          recipientId,
          isDistribution: true,
          distributedAmount: amount,
          distributedUnit: unit,
          quantityUsed: amountInBaseUnit,
          quantityRequested: amountInBaseUnit,
          unit: (firstBatch as any).baseUnit,
          subjectId: isNaN(subjectId) ? null : subjectId,
          roomId: isNaN(roomId) ? null : roomId,
          purpose,
          recordedById: currentUser.id,
          dateUsed: new Date()
        }
      })

      // Update Chemical total volume
      // Calculate new total volume from all non-expired batches
      const batches = await tx.chemicalBatch.findMany({
        where: {
          chemicalId,
          OR: [
            { expiryDate: null },
            { expiryDate: { gt: new Date() } }
          ]
        },
        select: {
          remainingVolume: true
        }
      })

      const newTotalVolume = batches.reduce((sum, batch) => sum + batch.remainingVolume, 0)

      await tx.chemical.update({
        where: { id: chemicalId },
        data: { volume: newTotalVolume }
      })

      return { newTotalVolume }
    })

    // Revalidate paths
    revalidatePath('/labtech/chemicals')
    revalidatePath(`/labtech/chemicals/${chemicalId}`)
    revalidatePath('/labtech/usage')
    revalidatePath('/labtech/records')

    // Generate stock warnings
    let warning: string | undefined

    if (result.newTotalVolume === 0) {
      warning = 'Chemical is now out of stock'
    } else if (result.newTotalVolume <= chemical.reorderLevel) {
      warning = `Low stock warning: ${result.newTotalVolume.toFixed(2)} remaining (reorder level: ${chemical.reorderLevel})`
    }

    return {
      success: true,
      warning
    }

  } catch (error) {
    console.error('Distribution error:', error)

    // Return user-friendly error message
    if (error instanceof Error) {
      return {
        success: false,
        error: error.message
      }
    }

    return {
      success: false,
      error: 'An error occurred while processing the distribution. Please try again.'
    }
  }
}

/**
 * Distribute multiple chemicals in a single transaction
 * 
 * Takes an array of chemicals from a cart and processes them all at once:
 * - Validates all items have positive quantity
 * - Executes all deductions within a single atomic Prisma transaction
 * - Groups all resulting usage records under a common sessionId
 * - Updates total volumes for all affected chemicals
 */
export async function distributeMultipleChemicals(data: {
  recipientId: number
  subject: string
  room: string
  purpose: string
  items: Array<{
    id: number
    quantity: number
    unit: string
  }>
}) {
  try {
    // Validate permission
    const { roles, user: currentUser } = await requirePermission('manage:chemicals')

    if (roles.includes('DEAN')) {
      return { success: false, error: 'Dean role does not have permission to perform this action.' }
    }

    // Validate input data
    const validated = distributeMultipleChemicalsSchema.safeParse(data)
    if (!validated.success) {
      return {
        success: false,
        error: validated.error.issues[0]?.message || 'Invalid input data'
      }
    }

    const { recipientId, subject, room, purpose, items } = validated.data

    // Generate a session ID for grouping
    const sessionId = `dist_session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`

    // Validate recipient has STAFF role
    const recipient = await prisma.user.findUnique({
      where: { id: recipientId },
      include: {
        roles: {
          include: {
            role: true
          }
        }
      }
    })

    if (!recipient) {
      return {
        success: false,
        error: 'Recipient not found'
      }
    }

    const recipientRoles = recipient.roles.map(ur => ur.role.name)
    if (!recipientRoles.includes('STAFF')) {
      return {
        success: false,
        error: 'Recipient must have STAFF role'
      }
    }

    // Parse subject and room IDs
    const subjectId = parseInt(subject)
    const roomId = parseInt(room)

    // Execute all distributions within one transaction
    await prisma.$transaction(async (tx) => {
      for (const item of items) {
        const amountInBaseUnit = convertToBaseUnit(item.quantity, item.unit)

        // 1. Deduct from batches using FIFO
        const deductionResult = await deductFromBatches(item.id, amountInBaseUnit, tx)
        if (!deductionResult.success) {
          // This will rollback the entire transaction
          throw new Error(`Insufficient stock for chemical ID ${item.id}: ${deductionResult.error}`)
        }

        // 2. Get a batch for record linking (use the first non-expired batch)
        const firstBatch = await tx.chemicalBatch.findFirst({
          where: {
            chemicalId: item.id,
            remainingVolume: { gte: 0 },
            OR: [
              { expiryDate: null },
              { expiryDate: { gt: new Date() } }
            ]
          },
          orderBy: { purchaseDate: 'asc' }
        })

        if (!firstBatch) {
          throw new Error(`No valid batch found for chemical ID ${item.id}`)
        }

        // 3. Create ChemicalUsageRecord with sessionId
        await (tx.chemicalUsageRecord as any).create({
          data: {
            chemicalBatchId: firstBatch.id,
            recipientId,
            isDistribution: true,
            distributedAmount: item.quantity,
            distributedUnit: item.unit,
            quantityUsed: amountInBaseUnit,
            quantityRequested: amountInBaseUnit,
            unit: (firstBatch as any).baseUnit,
            subjectId: isNaN(subjectId) ? null : subjectId,
            roomId: isNaN(roomId) ? null : roomId,
            purpose,
            recordedById: currentUser.id,
            sessionId,
            dateUsed: new Date()
          }
        })

        // 4. Update Chemical total volume
        const batches = await tx.chemicalBatch.findMany({
          where: {
            chemicalId: item.id,
            OR: [
              { expiryDate: null },
              { expiryDate: { gt: new Date() } }
            ]
          },
          select: {
            remainingVolume: true
          }
        })

        const newTotalVolume = batches.reduce((sum, batch) => sum + batch.remainingVolume, 0)

        await tx.chemical.update({
          where: { id: item.id },
          data: { volume: newTotalVolume }
        })
      }
    })

    // Revalidate paths
    revalidatePath('/labtech/chemicals')
    revalidatePath('/labtech/records')
    revalidatePath('/labtech/usage')

    return {
      success: true,
      sessionId
    }

  } catch (error) {
    console.error('Multi-distribution error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An error occurred during multi-chemical distribution'
    }
  }
}

/**
 * Preview distribution to show which batches will be affected
 * 
 * Calculates FIFO deductions without writing to database, providing real-time
 * preview of which batches will be affected by a distribution. This allows
 * Labtech personnel to verify the deduction before confirming.
 * 
 * @param data - Preview request with chemicalId, amount, and unit
 * @returns Preview data with affected batches or insufficient stock error
 */
export async function previewDistribution(data: {
  chemicalId: number
  amount: number
  unit: string
}) {
  try {
    // Validate input data
    const validated = previewDistributionSchema.safeParse(data)
    if (!validated.success) {
      return {
        success: false,
        error: validated.error.issues[0]?.message || 'Invalid input data'
      }
    }

    const { chemicalId, amount, unit } = validated.data

    // Convert amount to base unit
    const amountInBaseUnit = convertToBaseUnit(amount, unit)
    const baseUnit = determineBaseUnit(unit)

    // Query non-expired batches ordered by purchaseDate (FIFO)
    const batches = await prisma.chemicalBatch.findMany({
      where: {
        chemicalId,
        remainingVolume: { gt: 0 },
        OR: [
          { expiryDate: null },
          { expiryDate: { gt: new Date() } }
        ]
      },
      orderBy: { purchaseDate: 'asc' },
      select: {
        id: true,
        batchNumber: true,
        remainingVolume: true,
        expiryDate: true
      }
    })

    // Calculate total available volume
    const totalAvailable = batches.reduce((sum, b) => sum + b.remainingVolume, 0)

    // Check for insufficient stock
    if (totalAvailable < amountInBaseUnit) {
      return {
        success: false,
        error: `Insufficient stock. Available: ${totalAvailable.toFixed(2)} ${baseUnit}, Requested: ${amountInBaseUnit.toFixed(2)} ${baseUnit}`
      }
    }

    // Calculate batch deductions using FIFO logic
    const deductions = calculateBatchDeductions(batches, amountInBaseUnit)

    // Convert deduction amounts back to display unit
    const conversionFactor = amountInBaseUnit / amount
    const previewBatches = deductions.map(deduction => ({
      batchNumber: deduction.batchNumber,
      expiryDate: deduction.expiryDate,
      amountToDeduct: deduction.amountToDeduct / conversionFactor,
      unit: unit,
      willDeplete: deduction.willDeplete
    }))

    return {
      success: true,
      batches: previewBatches
    }

  } catch (error) {
    console.error('Preview distribution error:', error)

    if (error instanceof Error) {
      return {
        success: false,
        error: error.message
      }
    }

    return {
      success: false,
      error: 'An error occurred while calculating the preview. Please try again.'
    }
  }
}

/**
 * Check for recent distributions of the same chemical to a recipient
 * 
 * Queries ChemicalUsageRecord for distributions of the specified chemical
 * to the specified recipient within the last 30 days. Returns the most
 * recent distribution if found, enabling the UI to display warnings about
 * potential duplicate distributions.
 * 
 * @param data - Request with chemicalId and recipientId
 * @returns Recent distribution data if found, or found: false
 */
export async function getRecentDistribution(data: {
  chemicalId: number
  recipientId: number
}) {
  try {
    // Validate input data
    const validated = getRecentDistributionSchema.safeParse(data)
    if (!validated.success) {
      return {
        found: false,
        error: validated.error.issues[0]?.message || 'Invalid input data'
      }
    }

    const { chemicalId, recipientId } = validated.data

    // Calculate date 30 days ago
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    // Query for recent distributions
    const recentDistribution = await (prisma.chemicalUsageRecord as any).findFirst({
      where: {
        chemicalBatch: {
          chemicalId
        },
        recipientId,
        isDistribution: true,
        dateUsed: {
          gte: thirtyDaysAgo
        }
      },
      orderBy: {
        dateUsed: 'desc'
      },
      include: {
        recipient: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      }
    })

    // If no recent distribution found, return found: false
    if (!recentDistribution) {
      return {
        found: false
      }
    }

    // Format recipient name
    const recipientName = `${recentDistribution.recipient?.firstName || ''} ${recentDistribution.recipient?.lastName || ''}`.trim()

    // Return formatted distribution data
    return {
      found: true,
      distribution: {
        recipientName,
        amount: recentDistribution.distributedAmount || recentDistribution.quantityUsed,
        unit: recentDistribution.distributedUnit || recentDistribution.unit || 'ML',
        date: recentDistribution.dateUsed
      }
    }

  } catch (error) {
    console.error('Get recent distribution error:', error)

    return {
      found: false,
      error: error instanceof Error ? error.message : 'An error occurred while checking for recent distributions'
    }
  }
}

/**
 * Get distribution history for a chemical
 * 
 * Retrieves all distribution records for a specific chemical, sorted by date descending.
 * Used to display distribution history on the chemical detail page.
 * 
 * @param chemicalId - ID of the chemical
 * @param limit - Optional limit on number of records to return (default: 10)
 * @returns Array of distribution records with recipient, amount, date, and metadata
 */
export async function getChemicalDistributionHistory(chemicalId: number, limit: number = 10) {
  await requirePermission('view:chemicals')

  try {
    const distributions = await (prisma.chemicalUsageRecord as any).findMany({
      where: {
        chemicalBatch: {
          chemicalId
        },
        isDistribution: true
      },
      orderBy: {
        dateUsed: 'desc'
      },
      take: limit,
      include: {
        recipient: {
          select: {
            firstName: true,
            lastName: true,
            username: true
          }
        },
        subject: {
          select: {
            code: true,
            name: true
          }
        },
        room: {
          select: {
            name: true
          }
        }
      }
    })

    return distributions.map((dist: any) => ({
      id: dist.id,
      recipientName: dist.recipient
        ? `${dist.recipient.firstName || ''} ${dist.recipient.lastName || ''}`.trim() || dist.recipient.username
        : 'Unknown',
      amount: dist.distributedAmount || dist.quantityUsed,
      unit: dist.distributedUnit || dist.unit || 'ML',
      date: dist.dateUsed,
      subject: dist.subject?.code || 'N/A',
      room: dist.room?.name || 'N/A',
      purpose: dist.purpose || 'N/A'
    }))
  } catch (error) {
    console.error('Get chemical distribution history error:', error)
    return []
  }
}

/**
 * Search for subjects by name or code
 * 
 * Filters subjects matching the search query and returns results.
 * Used by SubjectSelector component for chemical distribution.
 * 
 * @param query - Search term to match against subject name or code
 * @returns Array of subjects with id, code, and name
 */
export async function searchSubjects(query: string) {
  await requirePermission('view:chemicals')

  if (!query || query.length < 2) {
    return []
  }

  const subjects = await prisma.subject.findMany({
    where: {
      OR: [
        { name: { contains: query } },
        { code: { contains: query } }
      ]
    },
    select: {
      id: true,
      code: true,
      name: true
    },
    orderBy: { code: 'asc' },
    take: 10
  })

  return subjects
}
