'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { requirePermission } from '@/lib/permissions'

// ============================================================================
// TypeScript Interfaces
// ============================================================================

export interface UsageRecordWithRelations {
  id: number
  chemicalBatchId: number
  usedById: number | null
  subjectId: number | null
  roomId: number | null
  quantityUsed: number
  quantityRequested: number
  unit: string | null
  purpose: string | null
  dateUsed: Date
  recordedById: number
  chemicalBatch: {
    id: number
    batchNumber: string
    chemical: {
      id: number
      name: string
      unit: string | null
    }
  }
  usedBy: {
    id: number
    firstName: string | null
    lastName: string | null
  } | null
  subject: {
    id: number
    code: string
    name: string
  } | null
  room: {
    id: number
    name: string
    location: string
  } | null
  recordedBy: {
    id: number
    firstName: string | null
    lastName: string | null
  }
}

export interface BatchDeduction {
  batchId: number
  batchNumber: string
  currentRemaining: number
  toDeduct: number
  afterDeduction: number
  purchaseDate: Date | null
}

export interface UsageFormData {
  chemicalId: number | null
  quantity: number | null
  subjectId: number | null
  roomId: number | null
  purpose: string
  usedById: number | null  // null for internal usage
}

export interface FilterState {
  search: string
  subjectId: number | null
  roomId: number | null
  dateFrom: Date | null
  dateTo: Date | null
  page: number
}

// ============================================================================
// Server Actions
// ============================================================================

/**
 * Fetch paginated usage records with optional filters
 * Returns records in reverse chronological order with related data
 */
export async function getUsageRecords(filters?: {
  search?: string
  subjectId?: number
  roomId?: number
  dateFrom?: Date
  dateTo?: Date
  page?: number
  pageSize?: number
}): Promise<{
  records: UsageRecordWithRelations[]
  totalCount: number
  totalPages: number
}> {
  await requirePermission('manage:chemicals')
  
  // Validate date range: max 1 year (365 days)
  if (filters?.dateFrom && filters?.dateTo) {
    const daysDiff = Math.floor((filters.dateTo.getTime() - filters.dateFrom.getTime()) / (1000 * 60 * 60 * 24))
    if (daysDiff > 365) {
      throw new Error('Date range cannot exceed 1 year')
    }
  }
  
  const page = filters?.page || 1
  const pageSize = filters?.pageSize || 15
  
  const where = {
    ...(filters?.search && {
      chemicalBatch: {
        chemical: {
          name: { contains: filters.search, mode: 'insensitive' as const }
        }
      }
    }),
    ...(filters?.subjectId && { subjectId: filters.subjectId }),
    ...(filters?.roomId && { roomId: filters.roomId }),
    ...(filters?.dateFrom && filters?.dateTo && {
      dateUsed: {
        gte: filters.dateFrom,
        lte: filters.dateTo
      }
    })
  }
  
  const [records, totalCount] = await Promise.all([
    prisma.chemicalUsageRecord.findMany({
      where,
      include: {
        chemicalBatch: {
          include: {
            chemical: true
          }
        },
        usedBy: true,
        subject: true,
        room: true,
        recordedBy: true
      },
      orderBy: { dateUsed: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize
    }),
    prisma.chemicalUsageRecord.count({ where })
  ])
  
  const totalPages = Math.ceil(totalCount / pageSize)
  
  return {
    records: records as UsageRecordWithRelations[],
    totalCount,
    totalPages
  }
}

/**
 * Calculate total available stock for a chemical
 * Sums remainingVolume from all non-expired batches
 */
export async function getAvailableStock(chemicalId: number): Promise<{
  availableStock: number
  unit: string | null
}> {
  await requirePermission('manage:chemicals')
  
  const chemical = await prisma.chemical.findUnique({
    where: { id: chemicalId },
    select: { unit: true }
  })
  
  if (!chemical) {
    return { availableStock: 0, unit: null }
  }
  
  const batches = await prisma.chemicalBatch.findMany({
    where: {
      chemicalId,
      remainingVolume: { gt: 0 },
      OR: [
        { expiryDate: null },
        { expiryDate: { gte: new Date() } }
      ]
    },
    select: { remainingVolume: true }
  })
  
  const availableStock = batches.reduce((sum, b) => sum + b.remainingVolume, 0)
  
  return { availableStock, unit: chemical.unit }
}

/**
 * Get detailed stock information including batch details and warnings
 */
export async function getStockDetails(chemicalId: number): Promise<{
  availableStock: number
  unit: string | null
  reorderLevel: number
  activeBatchCount: number
  batches: Array<{
    id: number
    batchNumber: string
    remainingVolume: number
    expiryDate: Date | null
    isExpiringSoon: boolean
  }>
  warnings: Array<{
    type: 'no_stock' | 'low_stock' | 'expiring_soon'
    message: string
  }>
}> {
  await requirePermission('manage:chemicals')
  
  const chemical = await prisma.chemical.findUnique({
    where: { id: chemicalId },
    select: { 
      unit: true,
      reorderLevel: true,
      volume: true
    }
  })
  
  if (!chemical) {
    return {
      availableStock: 0,
      unit: null,
      reorderLevel: 0,
      activeBatchCount: 0,
      batches: [],
      warnings: [{ type: 'no_stock', message: 'Chemical not found' }]
    }
  }
  
  const now = new Date()
  const thirtyDaysFromNow = new Date()
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)
  
  // Get all active batches (non-expired with remaining volume)
  const batches = await prisma.chemicalBatch.findMany({
    where: {
      chemicalId,
      remainingVolume: { gt: 0 },
      OR: [
        { expiryDate: null },
        { expiryDate: { gte: now } }
      ]
    },
    select: {
      id: true,
      batchNumber: true,
      remainingVolume: true,
      expiryDate: true
    },
    orderBy: { purchaseDate: 'asc' }
  })
  
  const availableStock = batches.reduce((sum, b) => sum + b.remainingVolume, 0)
  const activeBatchCount = batches.length
  
  // Check for batches expiring soon
  const batchesWithWarnings = batches.map(batch => ({
    ...batch,
    isExpiringSoon: batch.expiryDate !== null && batch.expiryDate <= thirtyDaysFromNow
  }))
  
  // Generate warnings
  const warnings: Array<{
    type: 'no_stock' | 'low_stock' | 'expiring_soon'
    message: string
  }> = []
  
  if (availableStock === 0) {
    warnings.push({
      type: 'no_stock',
      message: 'No stock available — all batches expired or exhausted'
    })
  } else if (availableStock <= chemical.reorderLevel) {
    warnings.push({
      type: 'low_stock',
      message: `Low stock — only ${availableStock} ${chemical.unit || 'units'} remaining`
    })
  }
  
  const expiringSoonBatches = batchesWithWarnings.filter(b => b.isExpiringSoon)
  if (expiringSoonBatches.length > 0) {
    warnings.push({
      type: 'expiring_soon',
      message: 'Batch expiring soon — will be used first in FIFO order'
    })
  }
  
  return {
    availableStock,
    unit: chemical.unit,
    reorderLevel: chemical.reorderLevel,
    activeBatchCount,
    batches: batchesWithWarnings,
    warnings
  }
}

/**
 * Generate a preview of how FIFO deduction will be applied across batches
 * Does not modify the database
 */
export async function generateBatchPreview(
  chemicalId: number,
  quantityRequested: number
): Promise<{
  batches: BatchDeduction[]
  totalDeducted: number
  isValid: boolean
  error?: string
}> {
  await requirePermission('manage:chemicals')
  
  const batches = await prisma.chemicalBatch.findMany({
    where: {
      chemicalId,
      remainingVolume: { gt: 0 },
      OR: [
        { expiryDate: null },
        { expiryDate: { gte: new Date() } }
      ]
    },
    orderBy: { purchaseDate: 'asc' }
  })
  
  const totalAvailable = batches.reduce((sum, b) => sum + b.remainingVolume, 0)
  
  if (totalAvailable < quantityRequested) {
    return {
      batches: [],
      totalDeducted: 0,
      isValid: false,
      error: `Insufficient stock. Available: ${totalAvailable}, Requested: ${quantityRequested}`
    }
  }
  
  const preview: BatchDeduction[] = []
  let remaining = quantityRequested
  
  for (const batch of batches) {
    if (remaining <= 0) break
    
    const deduction = Math.min(batch.remainingVolume, remaining)
    preview.push({
      batchId: batch.id,
      batchNumber: batch.batchNumber,
      currentRemaining: batch.remainingVolume,
      toDeduct: deduction,
      afterDeduction: batch.remainingVolume - deduction,
      purchaseDate: batch.purchaseDate
    })
    
    remaining -= deduction
  }
  
  return {
    batches: preview,
    totalDeducted: quantityRequested,
    isValid: true
  }
}

/**
 * Execute FIFO deduction transaction
 * Creates multiple ChemicalUsageRecord entries (one per batch)
 * Updates batch remainingVolume and recalculates chemical total volume
 */
export async function recordChemicalUsage(data: {
  chemicalId: number
  quantityUsed: number
  subjectId: number
  roomId: number
  purpose: string
  usedById: number | null  // null for internal usage
}): Promise<{
  success: boolean
  error?: string
  warning?: 'out_of_stock' | 'low_stock'
  chemicalName?: string
  remaining?: number
  unit?: string | null
}> {
  const auth = await requirePermission('manage:chemicals')
  const recordedById = auth.user.id
  
  try {
    let warningInfo: {
      warning?: 'out_of_stock' | 'low_stock'
      chemicalName?: string
      remaining?: number
      unit?: string | null
    } = {}
    
    await prisma.$transaction(async (tx) => {
      // Step 1: Fetch eligible batches (FIFO order)
      const batches = await tx.chemicalBatch.findMany({
        where: {
          chemicalId: data.chemicalId,
          remainingVolume: { gt: 0 },
          OR: [
            { expiryDate: null },
            { expiryDate: { gte: new Date() } }
          ]
        },
        include: {
          chemical: true
        },
        orderBy: { purchaseDate: 'asc' }
      })
      
      // Step 2: Validate availability
      const totalAvailable = batches.reduce((sum, b) => sum + b.remainingVolume, 0)
      if (totalAvailable < data.quantityUsed) {
        throw new Error(`Insufficient stock. Available: ${totalAvailable}, Requested: ${data.quantityUsed}`)
      }
      
      // Step 3: Deduct from batches
      let remaining = data.quantityUsed
      for (const batch of batches) {
        if (remaining <= 0) break
        
        const deduction = Math.min(batch.remainingVolume, remaining)
        
        // Create usage record
        await tx.chemicalUsageRecord.create({
          data: {
            chemicalBatchId: batch.id,
            quantityUsed: deduction,
            quantityRequested: data.quantityUsed,
            unit: batch.chemical?.unit,
            subjectId: data.subjectId,
            roomId: data.roomId,
            purpose: data.purpose,
            usedById: data.usedById,
            recordedById: recordedById
          }
        })
        
        // Update batch
        await tx.chemicalBatch.update({
          where: { id: batch.id },
          data: { remainingVolume: batch.remainingVolume - deduction }
        })
        
        remaining -= deduction
      }
      
      // Step 4: Recalculate chemical volume
      const updatedBatches = await tx.chemicalBatch.findMany({
        where: {
          chemicalId: data.chemicalId,
          OR: [
            { expiryDate: null },
            { expiryDate: { gte: new Date() } }
          ]
        }
      })
      
      const newVolume = updatedBatches.reduce((sum, b) => sum + b.remainingVolume, 0)
      
      const chemical = await tx.chemical.update({
        where: { id: data.chemicalId },
        data: { volume: newVolume },
        select: {
          name: true,
          unit: true,
          reorderLevel: true,
          volume: true
        }
      })
      
      // Step 5: Check post-usage warnings
      if (newVolume === 0) {
        warningInfo = {
          warning: 'out_of_stock',
          chemicalName: chemical.name
        }
      } else if (newVolume <= chemical.reorderLevel) {
        warningInfo = {
          warning: 'low_stock',
          chemicalName: chemical.name,
          remaining: newVolume,
          unit: chemical.unit
        }
      }
    })
    
    revalidatePath('/labtech/usage')
    revalidatePath('/labtech/chemicals')
    revalidatePath('/labtech/chemicals/[id]')
    revalidatePath('/labtech/records')
    
    return { success: true, ...warningInfo }
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to record usage' }
  }
}

/**
 * Calculate summary statistics based on current filters
 */
export async function getUsageSummaryStats(filters?: {
  search?: string
  subjectId?: number
  roomId?: number
  dateFrom?: Date
  dateTo?: Date
}): Promise<{
  totalUsageCount: number
  totalVolumeToday: number
  mostUsedChemical: string | null
}> {
  await requirePermission('manage:chemicals')
  
  // Validate date range: max 1 year (365 days)
  if (filters?.dateFrom && filters?.dateTo) {
    const daysDiff = Math.floor((filters.dateTo.getTime() - filters.dateFrom.getTime()) / (1000 * 60 * 60 * 24))
    if (daysDiff > 365) {
      throw new Error('Date range cannot exceed 1 year')
    }
  }
  
  const where = {
    ...(filters?.search && {
      chemicalBatch: {
        chemical: {
          name: { contains: filters.search, mode: 'insensitive' as const }
        }
      }
    }),
    ...(filters?.subjectId && { subjectId: filters.subjectId }),
    ...(filters?.roomId && { roomId: filters.roomId }),
    ...(filters?.dateFrom && filters?.dateTo && {
      dateUsed: {
        gte: filters.dateFrom,
        lte: filters.dateTo
      }
    })
  }
  
  // Total usage count
  const totalUsageCount = await prisma.chemicalUsageRecord.count({ where })
  
  // Total volume used today
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)
  
  const todayRecords = await prisma.chemicalUsageRecord.findMany({
    where: {
      dateUsed: {
        gte: today,
        lt: tomorrow
      }
    },
    select: { quantityUsed: true }
  })
  
  const totalVolumeToday = todayRecords.reduce((sum, r) => sum + r.quantityUsed, 0)
  
  // Most used chemical
  const chemicalUsage = await prisma.chemicalUsageRecord.groupBy({
    by: ['chemicalBatchId'],
    _sum: {
      quantityUsed: true
    },
    orderBy: {
      _sum: {
        quantityUsed: 'desc'
      }
    },
    take: 1
  })
  
  let mostUsedChemical: string | null = null
  if (chemicalUsage.length > 0) {
    const batch = await prisma.chemicalBatch.findUnique({
      where: { id: chemicalUsage[0].chemicalBatchId },
      include: { chemical: true }
    })
    mostUsedChemical = batch?.chemical.name || null
  }
  
  return {
    totalUsageCount,
    totalVolumeToday,
    mostUsedChemical
  }
}

/**
 * Generate CSV data for filtered usage records
 */
export async function exportUsageToCSV(filters?: {
  search?: string
  subjectId?: number
  roomId?: number
  dateFrom?: Date
  dateTo?: Date
}): Promise<{
  success: boolean
  csvData?: string
  filename?: string
  error?: string
}> {
  await requirePermission('manage:chemicals')
  
  try {
    // Validate date range: max 1 year (365 days)
    if (filters?.dateFrom && filters?.dateTo) {
      const daysDiff = Math.floor((filters.dateTo.getTime() - filters.dateFrom.getTime()) / (1000 * 60 * 60 * 24))
      if (daysDiff > 365) {
        throw new Error('Date range cannot exceed 1 year')
      }
    }
    
    const where = {
      ...(filters?.search && {
        chemicalBatch: {
          chemical: {
            name: { contains: filters.search, mode: 'insensitive' as const }
          }
        }
      }),
      ...(filters?.subjectId && { subjectId: filters.subjectId }),
      ...(filters?.roomId && { roomId: filters.roomId }),
      ...(filters?.dateFrom && filters?.dateTo && {
        dateUsed: {
          gte: filters.dateFrom,
          lte: filters.dateTo
        }
      })
    }
    
    const records = await prisma.chemicalUsageRecord.findMany({
      where,
      include: {
        chemicalBatch: {
          include: {
            chemical: true
          }
        },
        usedBy: true,
        subject: true,
        room: true
      },
      orderBy: { dateUsed: 'desc' }
    })
    
    // CSV header
    const headers = [
      'Date Used',
      'Chemical Name',
      'Batch Number',
      'Quantity Used',
      'Unit',
      'Used By',
      'Subject Code',
      'Room Name',
      'Purpose'
    ]
    
    // CSV rows
    const rows = records.map(record => {
      const dateUsed = record.dateUsed.toISOString().replace('T', ' ').substring(0, 19)
      const chemicalName = record.chemicalBatch.chemical.name
      const batchNumber = record.chemicalBatch.batchNumber
      const quantityUsed = record.quantityUsed.toString()
      const unit = record.unit || ''
      const usedBy = record.usedBy 
        ? `${record.usedBy.firstName || ''} ${record.usedBy.lastName || ''}`.trim()
        : 'Internal'
      const subjectCode = record.subject?.code || ''
      const roomName = record.room?.name || ''
      const purpose = record.purpose || ''
      
      // Escape CSV special characters
      const escapeCSV = (value: string) => {
        if (value.includes(',') || value.includes('"') || value.includes('\n')) {
          return `"${value.replace(/"/g, '""')}"`
        }
        return value
      }
      
      return [
        dateUsed,
        escapeCSV(chemicalName),
        escapeCSV(batchNumber),
        quantityUsed,
        escapeCSV(unit),
        escapeCSV(usedBy),
        escapeCSV(subjectCode),
        escapeCSV(roomName),
        escapeCSV(purpose)
      ].join(',')
    })
    
    const csvData = [headers.join(','), ...rows].join('\n')
    const filename = `chemical-usage-${new Date().toISOString().split('T')[0]}.csv`
    
    return {
      success: true,
      csvData,
      filename
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to export CSV'
    }
  }
}

/**
 * Fetch recent usage history for a specific chemical
 * Used for display on chemical detail page
 */
export async function getChemicalUsageHistory(
  chemicalId: number,
  limit: number = 10
): Promise<UsageRecordWithRelations[]> {
  await requirePermission('manage:chemicals')
  
  const records = await prisma.chemicalUsageRecord.findMany({
    where: {
      chemicalBatch: {
        chemicalId
      }
    },
    include: {
      chemicalBatch: {
        include: {
          chemical: true
        }
      },
      usedBy: true,
      subject: true,
      room: true,
      recordedBy: true
    },
    orderBy: { dateUsed: 'desc' },
    take: limit
  })
  
  return records as UsageRecordWithRelations[]
}

/**
 * Fetch all subjects for dropdown selection
 */
export async function getSubjects() {
  await requirePermission('manage:chemicals')
  
  const subjects = await prisma.subject.findMany({
    orderBy: { code: 'asc' }
  })
  
  return subjects
}

/**
 * Fetch all rooms for dropdown selection
 */
export async function getRooms() {
  await requirePermission('manage:chemicals')
  
  const rooms = await prisma.room.findMany({
    orderBy: { name: 'asc' }
  })
  
  return rooms
}

/**
 * Fetch all active users for "used by" selection
 */
export async function getUsers() {
  await requirePermission('manage:chemicals')
  
  const users = await prisma.user.findMany({
    where: {
      isActive: true
    },
    select: {
      id: true,
      username: true,
      firstName: true,
      lastName: true,
      email: true
    },
    orderBy: { username: 'asc' }
  })
  
  return users
}

/**
 * Search chemicals by name for usage recording
 * Returns chemicals with available stock information
 */
export async function searchChemicals(query: string): Promise<{
  id: number
  name: string
  unit: string | null
  volume: number
  reorderLevel: number
}[]> {
  await requirePermission('manage:chemicals')
  
  if (!query || query.length < 2) {
    return []
  }
  
  const chemicals = await prisma.chemical.findMany({
    where: {
      deletedAt: null,
      name: { contains: query }
    },
    select: {
      id: true,
      name: true,
      unit: true,
      volume: true,
      reorderLevel: true
    },
    orderBy: { name: 'asc' },
    take: 10  // Limit results for performance
  })
  
  return chemicals
}

/**
 * Search subjects by name or code for usage recording
 * Returns subjects matching the search query
 */
export async function searchSubjects(query: string): Promise<{
  id: number
  code: string
  name: string
}[]> {
  await requirePermission('manage:chemicals')
  
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
    take: 10  // Limit results for performance
  })
  
  return subjects
}

/**
 * Search rooms by name or location for usage recording
 * Returns rooms matching the search query
 */
export async function searchRooms(query: string): Promise<{
  id: number
  name: string
  location: string
}[]> {
  await requirePermission('manage:chemicals')
  
  if (!query || query.length < 2) {
    return []
  }
  
  const rooms = await prisma.room.findMany({
    where: {
      OR: [
        { name: { contains: query } },
        { location: { contains: query } }
      ]
    },
    select: {
      id: true,
      name: true,
      location: true
    },
    orderBy: { name: 'asc' },
    take: 10  // Limit results for performance
  })
  
  return rooms
}

/**
 * Search users by name for usage recording
 * Returns STAFF role users only matching the search query
 */
export async function searchUsers(query: string): Promise<{
  id: number
  firstName: string | null
  lastName: string | null
  username: string
}[]> {
  await requirePermission('manage:chemicals')
  
  if (!query || query.length < 2) {
    return []
  }
  
  const users = await prisma.user.findMany({
    where: {
      isActive: true,
      roles: {
        some: {
          role: {
            name: 'STAFF'
          }
        }
      },
      OR: [
        { firstName: { contains: query } },
        { lastName: { contains: query } },
        { username: { contains: query } }
      ]
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      username: true
    },
    orderBy: { firstName: 'asc' },
    take: 10  // Limit results for performance
  })
  
  return users
}
