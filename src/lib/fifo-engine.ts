/**
 * FIFO (First-In-First-Out) Deduction Engine for Chemical Distribution
 * 
 * Automatically deducts chemicals from the oldest non-expired batches first,
 * ensuring chemicals are used before expiration and inventory remains accurate.
 */

import { Prisma } from '@prisma/client'

/**
 * Type for Prisma transaction client
 */
type PrismaTransaction = Omit<
  typeof import('@/lib/prisma').default,
  '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
>

/**
 * Batch information for deduction calculations
 */
export interface BatchInfo {
  id: number
  batchNumber: string
  remainingVolume: number
  expiryDate: Date | null
}

/**
 * Deduction result for a single batch
 */
export interface BatchDeduction {
  batchNumber: string
  expiryDate: Date | null
  amountToDeduct: number
  willDeplete: boolean
}

/**
 * Result of a FIFO deduction operation
 */
export interface DeductionResult {
  success: boolean
  error?: string
}

/**
 * Calculates which batches would be affected by a distribution (for preview)
 * 
 * This is a pure function that performs FIFO calculation without database writes.
 * Used for real-time preview of batch deductions before confirming distribution.
 * 
 * @param batches - Array of available batches with remaining volume
 * @param amountInBaseUnit - Amount to deduct in base unit (ML or G)
 * @returns Array of batch deductions showing which batches will be affected
 * 
 * @example
 * const batches = [
 *   { id: 1, batchNumber: 'B001', remainingVolume: 1000, expiryDate: new Date('2025-12-31') },
 *   { id: 2, batchNumber: 'B002', remainingVolume: 500, expiryDate: new Date('2025-11-30') }
 * ]
 * const deductions = calculateBatchDeductions(batches, 1200)
 * // Returns:
 * // [
 * //   { batchNumber: 'B001', expiryDate: ..., amountToDeduct: 1000, willDeplete: true },
 * //   { batchNumber: 'B002', expiryDate: ..., amountToDeduct: 200, willDeplete: false }
 * // ]
 */
export function calculateBatchDeductions(
  batches: BatchInfo[],
  amountInBaseUnit: number
): BatchDeduction[] {
  const deductions: BatchDeduction[] = []
  let remaining = amountInBaseUnit

  for (const batch of batches) {
    if (remaining <= 0) break

    const deductAmount = Math.min(batch.remainingVolume, remaining)
    deductions.push({
      batchNumber: batch.batchNumber,
      expiryDate: batch.expiryDate,
      amountToDeduct: deductAmount,
      willDeplete: deductAmount === batch.remainingVolume
    })

    remaining -= deductAmount
  }

  return deductions
}

/**
 * Deducts chemical amount from batches using FIFO logic within a transaction
 * 
 * This function performs the actual database updates to deduct chemicals from
 * batches in FIFO order (oldest first). It ensures:
 * - Only non-expired batches are used (expiryDate > current date)
 * - Batches are processed in purchaseDate ascending order
 * - No batch remainingVolume goes below zero
 * - Insufficient stock is detected before any changes
 * - All operations are atomic within the provided transaction
 * 
 * @param chemicalId - ID of the chemical to deduct from
 * @param amountInBaseUnit - Amount to deduct in base unit (ML or G)
 * @param tx - Prisma transaction client for atomic operations
 * @returns Result object with success status and optional error message
 * 
 * @example
 * await prisma.$transaction(async (tx) => {
 *   const result = await deductFromBatches(1, 1500, tx)
 *   if (!result.success) {
 *     throw new Error(result.error)
 *   }
 *   // Continue with other transaction operations...
 * })
 */
export async function deductFromBatches(
  chemicalId: number,
  amountInBaseUnit: number,
  tx: PrismaTransaction
): Promise<DeductionResult> {
  // Query non-expired batches ordered by purchaseDate ASC (FIFO)
  const batches = await tx.chemicalBatch.findMany({
    where: {
      chemicalId,
      remainingVolume: { gt: 0 },
      OR: [
        { expiryDate: null },
        { expiryDate: { gt: new Date() } }
      ]
    },
    orderBy: { purchaseDate: 'asc' }
  })

  // Calculate total available volume
  const totalAvailable = batches.reduce((sum, b) => sum + b.remainingVolume, 0)

  // Check for insufficient stock
  if (totalAvailable < amountInBaseUnit) {
    return {
      success: false,
      error: `Insufficient stock. Available: ${totalAvailable.toFixed(2)}, Requested: ${amountInBaseUnit.toFixed(2)}`
    }
  }

  // Deduct from batches in FIFO order
  let remaining = amountInBaseUnit
  for (const batch of batches) {
    if (remaining <= 0) break

    const deductAmount = Math.min(batch.remainingVolume, remaining)
    await tx.chemicalBatch.update({
      where: { id: batch.id },
      data: { remainingVolume: batch.remainingVolume - deductAmount }
    })

    remaining -= deductAmount
  }

  return { success: true }
}
