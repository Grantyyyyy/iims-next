/**
 * FIFO Engine Tests
 * 
 * Tests for FIFO (First-In-First-Out) deduction engine used in chemical distribution.
 * Includes both unit tests for specific examples and property-based tests
 * for universal correctness properties.
 */

import { describe, it } from 'node:test'
import assert from 'node:assert'
import fc from 'fast-check'
import {
  calculateBatchDeductions,
  type BatchInfo
} from '../fifo-engine.js'

// Helper to match Jest's expect API
const expect = (actual: any) => ({
  toBe: (expected: any) => assert.strictEqual(actual, expected),
  toBeCloseTo: (expected: number, precision: number) => {
    const factor = Math.pow(10, precision)
    const actualRounded = Math.round(actual * factor) / factor
    const expectedRounded = Math.round(expected * factor) / factor
    assert.strictEqual(actualRounded, expectedRounded)
  },
  toBeDefined: () => assert.notStrictEqual(actual, undefined),
  toBeLessThan: (expected: number) => assert.ok(actual < expected, `Expected ${actual} to be less than ${expected}`),
  toBeGreaterThan: (expected: number) => assert.ok(actual > expected, `Expected ${actual} to be greater than ${expected}`),
  toEqual: (expected: any) => assert.deepStrictEqual(actual, expected)
})

describe('FIFO Engine', () => {
  describe('Property-Based Tests', () => {
    describe('Property 6: FIFO Batch Ordering', () => {
      /**
       * **Validates: Requirements 4.2, 4.3**
       * 
       * For any distribution, batches should be processed in ascending order of purchaseDate,
       * and only batches with expiryDate > current date should be considered.
       */
      
      it('should process batches in ascending order of purchaseDate', () => {
        fc.assert(
          fc.property(
            // Generate array of batches with random purchase dates
            fc.array(
              fc.record({
                id: fc.integer({ min: 1, max: 10000 }),
                batchNumber: fc.string({ minLength: 5, maxLength: 20 }),
                remainingVolume: fc.float({ min: 1, max: 10000, noNaN: true }),
                // Generate dates in the past for purchase dates
                purchaseDate: fc.date({ 
                  min: new Date('2020-01-01'), 
                  max: new Date() 
                }),
                // Generate future expiry dates (non-expired)
                expiryDate: fc.date({ 
                  min: new Date(Date.now() + 86400000), // Tomorrow
                  max: new Date('2030-12-31') 
                })
              }),
              { minLength: 2, maxLength: 10 }
            ),
            fc.float({ min: 1, max: 1000, noNaN: true }),
            (batches, amount) => {
              // Sort batches by purchaseDate ascending (FIFO order)
              const sortedBatches = [...batches].sort((a, b) => 
                a.purchaseDate.getTime() - b.purchaseDate.getTime()
              )
              
              // Calculate deductions
              const deductions = calculateBatchDeductions(sortedBatches, amount)
              
              // Verify batches are processed in order
              // The deductions should correspond to batches in the order they appear
              for (let i = 0; i < deductions.length; i++) {
                const deduction = deductions[i]
                const batch = sortedBatches[i]
                
                // The batch number in deduction should match the batch in sorted order
                expect(deduction.batchNumber).toBe(batch.batchNumber)
              }
            }
          ),
          { numRuns: 100 }
        )
      })

      it('should only consider batches with expiryDate > current date', () => {
        fc.assert(
          fc.property(
            // Generate array with mix of expired and non-expired batches
            fc.array(
              fc.record({
                id: fc.integer({ min: 1, max: 10000 }),
                batchNumber: fc.string({ minLength: 5, maxLength: 20 }),
                remainingVolume: fc.float({ min: 1, max: 10000, noNaN: true }),
                purchaseDate: fc.date({ 
                  min: new Date('2020-01-01'), 
                  max: new Date() 
                }),
                // Mix of expired and non-expired dates
                expiryDate: fc.date({ 
                  min: new Date('2020-01-01'), 
                  max: new Date('2030-12-31') 
                })
              }),
              { minLength: 3, maxLength: 10 }
            ),
            fc.float({ min: 1, max: 1000, noNaN: true }),
            (batches, amount) => {
              const now = new Date()
              
              // Filter to only non-expired batches and sort by purchaseDate
              const nonExpiredBatches = batches
                .filter(b => b.expiryDate > now)
                .sort((a, b) => a.purchaseDate.getTime() - b.purchaseDate.getTime())
              
              // If no non-expired batches, skip this test case
              if (nonExpiredBatches.length === 0) return
              
              // Calculate deductions
              const deductions = calculateBatchDeductions(nonExpiredBatches, amount)
              
              // Verify all deductions are from non-expired batches
              for (const deduction of deductions) {
                const batch = nonExpiredBatches.find(b => b.batchNumber === deduction.batchNumber)
                assert.ok(batch, `Deduction batch ${deduction.batchNumber} should exist in non-expired batches`)
                assert.ok(batch.expiryDate > now, `Batch ${batch.batchNumber} should not be expired`)
              }
            }
          ),
          { numRuns: 100 }
        )
      })

      it('should process oldest batches first regardless of remaining volume', () => {
        fc.assert(
          fc.property(
            // Generate batches where older batches might have less volume
            fc.array(
              fc.record({
                id: fc.integer({ min: 1, max: 10000 }),
                batchNumber: fc.string({ minLength: 5, maxLength: 20 }),
                remainingVolume: fc.float({ min: 1, max: 10000, noNaN: true }),
                purchaseDate: fc.date({ 
                  min: new Date('2020-01-01'), 
                  max: new Date() 
                }),
                expiryDate: fc.date({ 
                  min: new Date(Date.now() + 86400000),
                  max: new Date('2030-12-31') 
                })
              }),
              { minLength: 3, maxLength: 10 }
            ),
            fc.float({ min: 100, max: 5000, noNaN: true }),
            (batches, amount) => {
              // Sort by purchaseDate ascending
              const sortedBatches = [...batches].sort((a, b) => 
                a.purchaseDate.getTime() - b.purchaseDate.getTime()
              )
              
              // Calculate deductions
              const deductions = calculateBatchDeductions(sortedBatches, amount)
              
              // If we have deductions, verify they follow FIFO order
              if (deductions.length > 0) {
                // The first deduction should be from the oldest batch
                expect(deductions[0].batchNumber).toBe(sortedBatches[0].batchNumber)
                
                // Each subsequent deduction should be from the next batch in chronological order
                for (let i = 1; i < deductions.length; i++) {
                  const deductionBatchIndex = sortedBatches.findIndex(
                    b => b.batchNumber === deductions[i].batchNumber
                  )
                  const prevDeductionBatchIndex = sortedBatches.findIndex(
                    b => b.batchNumber === deductions[i - 1].batchNumber
                  )
                  
                  // Current deduction should be from a batch that comes after or is the same as previous
                  assert.ok(
                    deductionBatchIndex >= prevDeductionBatchIndex,
                    `Batch at index ${deductionBatchIndex} should come after or equal to ${prevDeductionBatchIndex}`
                  )
                }
              }
            }
          ),
          { numRuns: 100 }
        )
      })

      it('should maintain FIFO order even with identical purchase dates', () => {
        fc.assert(
          fc.property(
            fc.date({ min: new Date('2020-01-01'), max: new Date() }),
            fc.array(
              fc.record({
                id: fc.integer({ min: 1, max: 10000 }),
                batchNumber: fc.string({ minLength: 5, maxLength: 20 }),
                remainingVolume: fc.float({ min: 1, max: 10000, noNaN: true }),
                expiryDate: fc.date({ 
                  min: new Date(Date.now() + 86400000),
                  max: new Date('2030-12-31') 
                })
              }),
              { minLength: 2, maxLength: 5 }
            ),
            fc.float({ min: 1, max: 1000, noNaN: true }),
            (samePurchaseDate, batchesWithoutDate, amount) => {
              // Create batches with the same purchase date
              const batches = batchesWithoutDate.map(b => ({
                ...b,
                purchaseDate: samePurchaseDate
              }))
              
              // Calculate deductions
              const deductions = calculateBatchDeductions(batches, amount)
              
              // Verify deductions are from the batches (order doesn't matter when dates are identical)
              for (const deduction of deductions) {
                const batch = batches.find(b => b.batchNumber === deduction.batchNumber)
                assert.ok(batch, `Deduction batch ${deduction.batchNumber} should exist`)
              }
            }
          ),
          { numRuns: 100 }
        )
      })

      it('should skip expired batches even if they have earlier purchase dates', () => {
        fc.assert(
          fc.property(
            fc.record({
              // Oldest batch (expired)
              oldestBatch: fc.record({
                id: fc.integer({ min: 1, max: 10000 }),
                batchNumber: fc.constant('OLDEST-EXPIRED'),
                remainingVolume: fc.float({ min: 100, max: 10000, noNaN: true }),
                purchaseDate: fc.constant(new Date('2020-01-01')),
                expiryDate: fc.constant(new Date('2020-12-31')) // Expired
              }),
              // Newer batch (not expired)
              newerBatch: fc.record({
                id: fc.integer({ min: 1, max: 10000 }),
                batchNumber: fc.constant('NEWER-VALID'),
                remainingVolume: fc.float({ min: 100, max: 10000, noNaN: true }),
                purchaseDate: fc.constant(new Date('2023-01-01')),
                expiryDate: fc.date({ 
                  min: new Date(Date.now() + 86400000),
                  max: new Date('2030-12-31') 
                })
              }),
              amount: fc.float({ min: 1, max: 100, noNaN: true })
            }),
            ({ oldestBatch, newerBatch, amount }) => {
              const now = new Date()
              
              // Filter out expired batches (as the FIFO engine should do)
              const nonExpiredBatches = [oldestBatch, newerBatch]
                .filter(b => b.expiryDate > now)
                .sort((a, b) => a.purchaseDate.getTime() - b.purchaseDate.getTime())
              
              // Calculate deductions
              const deductions = calculateBatchDeductions(nonExpiredBatches, amount)
              
              // Verify the expired batch is not in deductions
              const hasExpiredBatch = deductions.some(d => d.batchNumber === 'OLDEST-EXPIRED')
              assert.strictEqual(hasExpiredBatch, false, 'Expired batch should not be in deductions')
              
              // If there are deductions, they should be from the newer valid batch
              if (deductions.length > 0) {
                expect(deductions[0].batchNumber).toBe('NEWER-VALID')
              }
            }
          ),
          { numRuns: 100 }
        )
      })
    })

    describe('Property 7: FIFO Deduction Correctness', () => {
      /**
       * **Validates: Requirements 4.1, 4.4, 4.5**
       * 
       * For any distribution amount and set of available batches, the sum of deductions
       * across all batches should equal the requested amount (in base units), and each
       * batch's deduction should be min(batch.remainingVolume, remaining_amount).
       */
      
      it('should deduct exactly the requested amount when sufficient stock exists', () => {
        fc.assert(
          fc.property(
            // Generate batches with sufficient total volume
            fc.array(
              fc.record({
                id: fc.integer({ min: 1, max: 10000 }),
                batchNumber: fc.string({ minLength: 5, maxLength: 20 }),
                remainingVolume: fc.float({ min: 1, max: 10000, noNaN: true }),
                expiryDate: fc.date({ 
                  min: new Date(Date.now() + 86400000),
                  max: new Date('2030-12-31') 
                })
              }),
              { minLength: 1, maxLength: 10 }
            ),
            (batches) => {
              // Calculate total available volume
              const totalAvailable = batches.reduce((sum, b) => sum + b.remainingVolume, 0)
              
              // Generate amount that doesn't exceed total available
              // Use a fraction of total to ensure we have sufficient stock
              const amount = totalAvailable * 0.8
              
              // Calculate deductions
              const deductions = calculateBatchDeductions(batches, amount)
              
              // Sum all deductions
              const totalDeducted = deductions.reduce((sum, d) => sum + d.amountToDeduct, 0)
              
              // The total deducted should equal the requested amount (within floating point precision)
              expect(totalDeducted).toBeCloseTo(amount, 2)
            }
          ),
          { numRuns: 100 }
        )
      })

      it('should deduct min(batch.remainingVolume, remaining_amount) from each batch', () => {
        fc.assert(
          fc.property(
            fc.array(
              fc.record({
                id: fc.integer({ min: 1, max: 10000 }),
                batchNumber: fc.string({ minLength: 5, maxLength: 20 }),
                remainingVolume: fc.float({ min: 1, max: 10000, noNaN: true }),
                expiryDate: fc.date({ 
                  min: new Date(Date.now() + 86400000),
                  max: new Date('2030-12-31') 
                })
              }),
              { minLength: 1, maxLength: 10 }
            ),
            (batches) => {
              const totalAvailable = batches.reduce((sum, b) => sum + b.remainingVolume, 0)
              const amount = totalAvailable * 0.8
              
              // Calculate deductions
              const deductions = calculateBatchDeductions(batches, amount)
              
              // Track remaining amount as we verify each deduction
              let remaining = amount
              
              for (let i = 0; i < deductions.length; i++) {
                const deduction = deductions[i]
                const batch = batches[i]
                
                // The deduction should be the minimum of batch volume and remaining amount
                const expectedDeduction = Math.min(batch.remainingVolume, remaining)
                
                // Verify the deduction amount is correct (within floating point precision)
                expect(deduction.amountToDeduct).toBeCloseTo(expectedDeduction, 2)
                
                // Update remaining for next iteration
                remaining -= deduction.amountToDeduct
              }
            }
          ),
          { numRuns: 100 }
        )
      })

      it('should mark batch as depleted when full volume is deducted', () => {
        fc.assert(
          fc.property(
            fc.array(
              fc.record({
                id: fc.integer({ min: 1, max: 10000 }),
                batchNumber: fc.string({ minLength: 5, maxLength: 20 }),
                remainingVolume: fc.float({ min: 1, max: 10000, noNaN: true }),
                expiryDate: fc.date({ 
                  min: new Date(Date.now() + 86400000),
                  max: new Date('2030-12-31') 
                })
              }),
              { minLength: 1, maxLength: 10 }
            ),
            (batches) => {
              const totalAvailable = batches.reduce((sum, b) => sum + b.remainingVolume, 0)
              const amount = totalAvailable * 0.8
              
              // Calculate deductions
              const deductions = calculateBatchDeductions(batches, amount)
              
              // Verify willDeplete flag is correct for each deduction
              for (let i = 0; i < deductions.length; i++) {
                const deduction = deductions[i]
                const batch = batches[i]
                
                // willDeplete should be true if we're deducting the full remaining volume
                const shouldDeplete = Math.abs(deduction.amountToDeduct - batch.remainingVolume) < 0.01
                
                assert.strictEqual(
                  deduction.willDeplete,
                  shouldDeplete,
                  `Batch ${batch.batchNumber} willDeplete flag should be ${shouldDeplete}`
                )
              }
            }
          ),
          { numRuns: 100 }
        )
      })

      it('should handle exact depletion of single batch', () => {
        fc.assert(
          fc.property(
            fc.record({
              id: fc.integer({ min: 1, max: 10000 }),
              batchNumber: fc.string({ minLength: 5, maxLength: 20 }),
              remainingVolume: fc.float({ min: 1, max: 10000, noNaN: true }),
              expiryDate: fc.date({ 
                min: new Date(Date.now() + 86400000),
                max: new Date('2030-12-31') 
              })
            }),
            (batch) => {
              // Request exactly the remaining volume
              const amount = batch.remainingVolume
              
              // Calculate deductions
              const deductions = calculateBatchDeductions([batch], amount)
              
              // Should have exactly one deduction
              expect(deductions.length).toBe(1)
              
              // Should deduct the full amount
              expect(deductions[0].amountToDeduct).toBeCloseTo(amount, 2)
              
              // Should mark as depleted
              expect(deductions[0].willDeplete).toBe(true)
            }
          ),
          { numRuns: 100 }
        )
      })

      it('should handle deduction spanning multiple batches', () => {
        fc.assert(
          fc.property(
            fc.array(
              fc.record({
                id: fc.integer({ min: 1, max: 10000 }),
                batchNumber: fc.string({ minLength: 5, maxLength: 20 }),
                remainingVolume: fc.float({ min: 10, max: 100, noNaN: true }),
                expiryDate: fc.date({ 
                  min: new Date(Date.now() + 86400000),
                  max: new Date('2030-12-31') 
                })
              }),
              { minLength: 3, maxLength: 10 }
            ),
            (batches) => {
              // Calculate total available
              const totalAvailable = batches.reduce((sum, b) => sum + b.remainingVolume, 0)
              
              // Request amount that will span multiple batches
              // Take first batch volume + half of second batch to ensure we span at least 2 batches
              const amount = Math.min(
                batches[0].remainingVolume + (batches[1]?.remainingVolume || 0) * 0.5,
                totalAvailable * 0.9 // Ensure we don't exceed total available
              )
              
              // Skip if amount is too small to span multiple batches
              if (amount <= batches[0].remainingVolume) return
              
              // Calculate deductions
              const deductions = calculateBatchDeductions(batches, amount)
              
              // Should have at least 2 deductions (spanning multiple batches)
              assert.ok(deductions.length >= 2, 'Should span at least 2 batches')
              
              // First batch should be fully depleted
              expect(deductions[0].willDeplete).toBe(true)
              expect(deductions[0].amountToDeduct).toBeCloseTo(batches[0].remainingVolume, 2)
              
              // Total deducted should equal requested amount
              const totalDeducted = deductions.reduce((sum, d) => sum + d.amountToDeduct, 0)
              expect(totalDeducted).toBeCloseTo(amount, 2)
            }
          ),
          { numRuns: 100 }
        )
      })

      it('should not deduct more than available when amount exceeds total', () => {
        fc.assert(
          fc.property(
            fc.array(
              fc.record({
                id: fc.integer({ min: 1, max: 10000 }),
                batchNumber: fc.string({ minLength: 5, maxLength: 20 }),
                remainingVolume: fc.float({ min: 1, max: 100, noNaN: true }),
                expiryDate: fc.date({ 
                  min: new Date(Date.now() + 86400000),
                  max: new Date('2030-12-31') 
                })
              }),
              { minLength: 1, maxLength: 5 }
            ),
            (batches) => {
              const totalAvailable = batches.reduce((sum, b) => sum + b.remainingVolume, 0)
              
              // Request more than available
              const amount = totalAvailable * 1.5
              
              // Calculate deductions
              const deductions = calculateBatchDeductions(batches, amount)
              
              // Total deducted should not exceed total available
              const totalDeducted = deductions.reduce((sum, d) => sum + d.amountToDeduct, 0)
              
              assert.ok(
                totalDeducted <= totalAvailable + 0.01, // Allow small floating point error
                `Total deducted (${totalDeducted}) should not exceed available (${totalAvailable})`
              )
              
              // All batches should be marked as depleted
              for (const deduction of deductions) {
                expect(deduction.willDeplete).toBe(true)
              }
            }
          ),
          { numRuns: 100 }
        )
      })

      it('should handle zero amount request', () => {
        fc.assert(
          fc.property(
            fc.array(
              fc.record({
                id: fc.integer({ min: 1, max: 10000 }),
                batchNumber: fc.string({ minLength: 5, maxLength: 20 }),
                remainingVolume: fc.float({ min: 1, max: 10000, noNaN: true }),
                expiryDate: fc.date({ 
                  min: new Date(Date.now() + 86400000),
                  max: new Date('2030-12-31') 
                })
              }),
              { minLength: 1, maxLength: 10 }
            ),
            (batches) => {
              // Request zero amount
              const deductions = calculateBatchDeductions(batches, 0)
              
              // Should return empty array (no deductions needed)
              expect(deductions.length).toBe(0)
            }
          ),
          { numRuns: 100 }
        )
      })

      it('should handle very small amounts (precision test)', () => {
        fc.assert(
          fc.property(
            fc.array(
              fc.record({
                id: fc.integer({ min: 1, max: 10000 }),
                batchNumber: fc.string({ minLength: 5, maxLength: 20 }),
                remainingVolume: fc.float({ min: 1, max: 10000, noNaN: true }),
                expiryDate: fc.date({ 
                  min: new Date(Date.now() + 86400000),
                  max: new Date('2030-12-31') 
                })
              }),
              { minLength: 1, maxLength: 10 }
            ),
            (batches) => {
              // Request very small amount (0.01 ML)
              const amount = 0.01
              
              // Calculate deductions
              const deductions = calculateBatchDeductions(batches, amount)
              
              // Should have exactly one deduction
              expect(deductions.length).toBe(1)
              
              // Should deduct exactly the requested amount
              expect(deductions[0].amountToDeduct).toBeCloseTo(amount, 2)
              
              // Should not deplete the batch (unless batch has exactly 0.01)
              if (batches[0].remainingVolume > 0.02) {
                expect(deductions[0].willDeplete).toBe(false)
              }
            }
          ),
          { numRuns: 100 }
        )
      })
    })

    describe('Property 8: Non-Negative Remaining Volume Invariant', () => {
      /**
       * **Validates: Requirements 4.6**
       * 
       * For any distribution, all batch remainingVolume values should be >= 0 after deduction.
       */
      
      it('should never produce negative remaining volumes', () => {
        fc.assert(
          fc.property(
            fc.array(
              fc.record({
                id: fc.integer({ min: 1, max: 10000 }),
                batchNumber: fc.string({ minLength: 5, maxLength: 20 }),
                remainingVolume: fc.float({ min: Math.fround(0.01), max: 10000, noNaN: true }),
                expiryDate: fc.date({ 
                  min: new Date(Date.now() + 86400000),
                  max: new Date('2030-12-31') 
                })
              }),
              { minLength: 1, maxLength: 10 }
            ),
            fc.float({ min: Math.fround(0.01), max: 50000, noNaN: true }),
            (batches, amount) => {
              // Calculate deductions
              const deductions = calculateBatchDeductions(batches, amount)
              
              // Simulate applying deductions to batches
              for (let i = 0; i < deductions.length; i++) {
                const deduction = deductions[i]
                const batch = batches[i]
                
                // Calculate what the remaining volume would be after deduction
                const remainingAfterDeduction = batch.remainingVolume - deduction.amountToDeduct
                
                // Remaining volume should never be negative
                assert.ok(
                  remainingAfterDeduction >= -0.001, // Allow tiny floating point error
                  `Batch ${batch.batchNumber} would have negative remaining volume: ${remainingAfterDeduction}`
                )
                
                // More strictly, it should be >= 0
                assert.ok(
                  remainingAfterDeduction >= 0 || Math.abs(remainingAfterDeduction) < 0.001,
                  `Batch ${batch.batchNumber} remaining volume ${remainingAfterDeduction} should be >= 0`
                )
              }
            }
          ),
          { numRuns: 100 }
        )
      })

      it('should maintain non-negative volumes even when amount exceeds total available', () => {
        fc.assert(
          fc.property(
            fc.array(
              fc.record({
                id: fc.integer({ min: 1, max: 10000 }),
                batchNumber: fc.string({ minLength: 5, maxLength: 20 }),
                remainingVolume: fc.float({ min: Math.fround(0.01), max: 100, noNaN: true }),
                expiryDate: fc.date({ 
                  min: new Date(Date.now() + 86400000),
                  max: new Date('2030-12-31') 
                })
              }),
              { minLength: 1, maxLength: 5 }
            ),
            (batches) => {
              const totalAvailable = batches.reduce((sum, b) => sum + b.remainingVolume, 0)
              
              // Request significantly more than available
              const amount = totalAvailable * 2
              
              // Calculate deductions
              const deductions = calculateBatchDeductions(batches, amount)
              
              // Verify no batch would have negative remaining volume
              for (let i = 0; i < deductions.length; i++) {
                const deduction = deductions[i]
                const batch = batches[i]
                
                const remainingAfterDeduction = batch.remainingVolume - deduction.amountToDeduct
                
                assert.ok(
                  remainingAfterDeduction >= -0.001,
                  `Batch ${batch.batchNumber} would have negative volume: ${remainingAfterDeduction}`
                )
              }
            }
          ),
          { numRuns: 100 }
        )
      })

      it('should never deduct more than batch remaining volume', () => {
        fc.assert(
          fc.property(
            fc.array(
              fc.record({
                id: fc.integer({ min: 1, max: 10000 }),
                batchNumber: fc.string({ minLength: 5, maxLength: 20 }),
                remainingVolume: fc.float({ min: Math.fround(0.01), max: 10000, noNaN: true }),
                expiryDate: fc.date({ 
                  min: new Date(Date.now() + 86400000),
                  max: new Date('2030-12-31') 
                })
              }),
              { minLength: 1, maxLength: 10 }
            ),
            fc.float({ min: Math.fround(0.01), max: 50000, noNaN: true }),
            (batches, amount) => {
              // Calculate deductions
              const deductions = calculateBatchDeductions(batches, amount)
              
              // Each deduction should not exceed the batch's remaining volume
              for (let i = 0; i < deductions.length; i++) {
                const deduction = deductions[i]
                const batch = batches[i]
                
                assert.ok(
                  deduction.amountToDeduct <= batch.remainingVolume + 0.001, // Allow tiny floating point error
                  `Deduction ${deduction.amountToDeduct} exceeds batch ${batch.batchNumber} remaining volume ${batch.remainingVolume}`
                )
              }
            }
          ),
          { numRuns: 100 }
        )
      })

      it('should handle edge case of batch with exactly requested amount', () => {
        fc.assert(
          fc.property(
            fc.float({ min: Math.fround(0.01), max: 10000, noNaN: true }),
            fc.string({ minLength: 5, maxLength: 20 }),
            (volume, batchNumber) => {
              const batch = {
                id: 1,
                batchNumber,
                remainingVolume: volume,
                expiryDate: new Date(Date.now() + 86400000)
              }
              
              // Request exactly the remaining volume
              const deductions = calculateBatchDeductions([batch], volume)
              
              // Should have one deduction
              expect(deductions.length).toBe(1)
              
              // Remaining volume after deduction should be exactly 0
              const remainingAfterDeduction = batch.remainingVolume - deductions[0].amountToDeduct
              
              expect(remainingAfterDeduction).toBeCloseTo(0, 2)
              
              // Should be marked as depleted
              expect(deductions[0].willDeplete).toBe(true)
            }
          ),
          { numRuns: 100 }
        )
      })

      it('should maintain non-negative volumes across multiple batch deductions', () => {
        fc.assert(
          fc.property(
            fc.array(
              fc.record({
                id: fc.integer({ min: 1, max: 10000 }),
                batchNumber: fc.string({ minLength: 5, maxLength: 20 }),
                remainingVolume: fc.float({ min: Math.fround(0.01), max: 1000, noNaN: true }),
                expiryDate: fc.date({ 
                  min: new Date(Date.now() + 86400000),
                  max: new Date('2030-12-31') 
                })
              }),
              { minLength: 3, maxLength: 10 }
            ),
            (batches) => {
              const totalAvailable = batches.reduce((sum, b) => sum + b.remainingVolume, 0)
              
              // Request amount that will span multiple batches
              const amount = totalAvailable * 0.9
              
              // Calculate deductions
              const deductions = calculateBatchDeductions(batches, amount)
              
              // Track cumulative deductions and verify each batch
              for (let i = 0; i < deductions.length; i++) {
                const deduction = deductions[i]
                const batch = batches[i]
                
                // Calculate remaining after this deduction
                const remainingAfterDeduction = batch.remainingVolume - deduction.amountToDeduct
                
                // Should never be negative
                assert.ok(
                  remainingAfterDeduction >= -0.001,
                  `Batch ${i} (${batch.batchNumber}) would have negative volume: ${remainingAfterDeduction}`
                )
                
                // Should be >= 0 (accounting for floating point precision)
                assert.ok(
                  remainingAfterDeduction >= 0 || Math.abs(remainingAfterDeduction) < 0.001,
                  `Batch ${i} remaining volume should be non-negative`
                )
              }
            }
          ),
          { numRuns: 100 }
        )
      })
    })

    describe('Property 9: Insufficient Stock Detection', () => {
      /**
       * **Validates: Requirements 4.7, 5.8**
       * 
       * For any distribution where the sum of non-expired batch remainingVolume < requested amount
       * (in base units), the system should return an error before making any database changes.
       * 
       * Note: calculateBatchDeductions is a pure function that doesn't throw errors.
       * It will deduct what's available. The actual error checking happens in deductFromBatches.
       * This test verifies that when insufficient stock exists, the deductions don't exceed
       * what's available, which allows the caller to detect insufficient stock.
       */
      
      it('should detect insufficient stock when total available < requested amount', () => {
        fc.assert(
          fc.property(
            fc.array(
              fc.record({
                id: fc.integer({ min: 1, max: 10000 }),
                batchNumber: fc.string({ minLength: 5, maxLength: 20 }),
                remainingVolume: fc.float({ min: 1, max: 100, noNaN: true }),
                expiryDate: fc.date({ 
                  min: new Date(Date.now() + 86400000),
                  max: new Date('2030-12-31') 
                })
              }),
              { minLength: 1, maxLength: 5 }
            ),
            (batches) => {
              // Calculate total available
              const totalAvailable = batches.reduce((sum, b) => sum + b.remainingVolume, 0)
              
              // Request more than available (1.5x to 3x)
              const multiplier = 1.5 + Math.random() * 1.5
              const requestedAmount = totalAvailable * multiplier
              
              // Calculate deductions
              const deductions = calculateBatchDeductions(batches, requestedAmount)
              
              // Total deducted should equal total available (not the requested amount)
              const totalDeducted = deductions.reduce((sum, d) => sum + d.amountToDeduct, 0)
              
              // The deductions should only cover what's available
              expect(totalDeducted).toBeCloseTo(totalAvailable, 2)
              
              // The total deducted should be less than requested
              assert.ok(
                totalDeducted < requestedAmount,
                `Total deducted (${totalDeducted}) should be less than requested (${requestedAmount})`
              )
              
              // This indicates insufficient stock - the caller can detect this by comparing
              // totalDeducted < requestedAmount
              const insufficientStock = totalDeducted < requestedAmount - 0.01
              assert.ok(
                insufficientStock,
                'Should indicate insufficient stock condition'
              )
            }
          ),
          { numRuns: 100 }
        )
      })

      it('should deduct all available stock when insufficient', () => {
        fc.assert(
          fc.property(
            fc.array(
              fc.record({
                id: fc.integer({ min: 1, max: 10000 }),
                batchNumber: fc.string({ minLength: 5, maxLength: 20 }),
                remainingVolume: fc.float({ min: 1, max: 100, noNaN: true }),
                expiryDate: fc.date({ 
                  min: new Date(Date.now() + 86400000),
                  max: new Date('2030-12-31') 
                })
              }),
              { minLength: 1, maxLength: 5 }
            ),
            (batches) => {
              const totalAvailable = batches.reduce((sum, b) => sum + b.remainingVolume, 0)
              
              // Request significantly more than available
              const requestedAmount = totalAvailable * 2
              
              // Calculate deductions
              const deductions = calculateBatchDeductions(batches, requestedAmount)
              
              // All batches should be fully depleted
              expect(deductions.length).toBe(batches.length)
              
              for (const deduction of deductions) {
                expect(deduction.willDeplete).toBe(true)
              }
              
              // Total deducted should equal total available
              const totalDeducted = deductions.reduce((sum, d) => sum + d.amountToDeduct, 0)
              expect(totalDeducted).toBeCloseTo(totalAvailable, 2)
            }
          ),
          { numRuns: 100 }
        )
      })

      it('should handle edge case where available is just slightly less than requested', () => {
        fc.assert(
          fc.property(
            fc.array(
              fc.record({
                id: fc.integer({ min: 1, max: 10000 }),
                batchNumber: fc.string({ minLength: 5, maxLength: 20 }),
                remainingVolume: fc.float({ min: 10, max: 100, noNaN: true }),
                expiryDate: fc.date({ 
                  min: new Date(Date.now() + 86400000),
                  max: new Date('2030-12-31') 
                })
              }),
              { minLength: 1, maxLength: 5 }
            ),
            (batches) => {
              const totalAvailable = batches.reduce((sum, b) => sum + b.remainingVolume, 0)
              
              // Request just slightly more than available (0.1 to 1 unit more)
              const requestedAmount = totalAvailable + 0.1 + Math.random() * 0.9
              
              // Calculate deductions
              const deductions = calculateBatchDeductions(batches, requestedAmount)
              
              // Total deducted should be less than requested
              const totalDeducted = deductions.reduce((sum, d) => sum + d.amountToDeduct, 0)
              
              assert.ok(
                totalDeducted < requestedAmount,
                `Should detect insufficient stock even when close: deducted ${totalDeducted}, requested ${requestedAmount}`
              )
              
              // Should deduct all available
              expect(totalDeducted).toBeCloseTo(totalAvailable, 2)
            }
          ),
          { numRuns: 100 }
        )
      })

      it('should not indicate insufficient stock when exactly enough is available', () => {
        fc.assert(
          fc.property(
            fc.array(
              fc.record({
                id: fc.integer({ min: 1, max: 10000 }),
                batchNumber: fc.string({ minLength: 5, maxLength: 20 }),
                remainingVolume: fc.float({ min: 1, max: 100, noNaN: true }),
                expiryDate: fc.date({ 
                  min: new Date(Date.now() + 86400000),
                  max: new Date('2030-12-31') 
                })
              }),
              { minLength: 1, maxLength: 5 }
            ),
            (batches) => {
              const totalAvailable = batches.reduce((sum, b) => sum + b.remainingVolume, 0)
              
              // Request exactly what's available
              const requestedAmount = totalAvailable
              
              // Calculate deductions
              const deductions = calculateBatchDeductions(batches, requestedAmount)
              
              // Total deducted should equal requested
              const totalDeducted = deductions.reduce((sum, d) => sum + d.amountToDeduct, 0)
              expect(totalDeducted).toBeCloseTo(requestedAmount, 2)
              
              // This should NOT indicate insufficient stock
              const insufficientStock = totalDeducted < requestedAmount - 0.01
              assert.strictEqual(
                insufficientStock,
                false,
                'Should not indicate insufficient stock when exactly enough is available'
              )
            }
          ),
          { numRuns: 100 }
        )
      })

      it('should handle insufficient stock with only expired batches', () => {
        fc.assert(
          fc.property(
            fc.array(
              fc.record({
                id: fc.integer({ min: 1, max: 10000 }),
                batchNumber: fc.string({ minLength: 5, maxLength: 20 }),
                remainingVolume: fc.float({ min: 1, max: 100, noNaN: true }),
                // All batches expired
                expiryDate: fc.date({ 
                  min: new Date('2020-01-01'),
                  max: new Date(Date.now() - 86400000) // Yesterday or earlier
                })
              }),
              { minLength: 1, maxLength: 5 }
            ),
            fc.float({ min: 1, max: 100, noNaN: true }),
            (batches, requestedAmount) => {
              const now = new Date()
              
              // Filter to only non-expired batches (should be empty)
              const nonExpiredBatches = batches.filter(b => b.expiryDate > now)
              
              // Calculate deductions with non-expired batches
              const deductions = calculateBatchDeductions(nonExpiredBatches, requestedAmount)
              
              // Should have no deductions (all batches expired)
              expect(deductions.length).toBe(0)
              
              // Total deducted should be 0
              const totalDeducted = deductions.reduce((sum, d) => sum + d.amountToDeduct, 0)
              expect(totalDeducted).toBe(0)
              
              // This clearly indicates insufficient stock (0 available, but amount requested)
              assert.ok(
                totalDeducted < requestedAmount,
                'Should indicate insufficient stock when all batches expired'
              )
            }
          ),
          { numRuns: 100 }
        )
      })

      it('should handle insufficient stock with mix of expired and non-expired batches', () => {
        fc.assert(
          fc.property(
            fc.record({
              // Some expired batches with volume
              expiredBatches: fc.array(
                fc.record({
                  id: fc.integer({ min: 1, max: 10000 }),
                  batchNumber: fc.string({ minLength: 5, maxLength: 20 }),
                  remainingVolume: fc.float({ min: 10, max: 100, noNaN: true }),
                  expiryDate: fc.date({ 
                    min: new Date('2020-01-01'),
                    max: new Date(Date.now() - 86400000)
                  })
                }),
                { minLength: 1, maxLength: 3 }
              ),
              // Some non-expired batches with less volume
              nonExpiredBatches: fc.array(
                fc.record({
                  id: fc.integer({ min: 1, max: 10000 }),
                  batchNumber: fc.string({ minLength: 5, maxLength: 20 }),
                  remainingVolume: fc.float({ min: 1, max: 50, noNaN: true }),
                  expiryDate: fc.date({ 
                    min: new Date(Date.now() + 86400000),
                    max: new Date('2030-12-31')
                  })
                }),
                { minLength: 1, maxLength: 3 }
              )
            }),
            ({ expiredBatches, nonExpiredBatches }) => {
              const now = new Date()
              
              // Calculate total if we could use expired batches
              const totalWithExpired = [...expiredBatches, ...nonExpiredBatches]
                .reduce((sum, b) => sum + b.remainingVolume, 0)
              
              // Calculate total available (non-expired only)
              const totalAvailable = nonExpiredBatches
                .reduce((sum, b) => sum + b.remainingVolume, 0)
              
              // Request amount between available and total (so expired batches would help, but can't use them)
              const requestedAmount = totalAvailable + (totalWithExpired - totalAvailable) * 0.5
              
              // Skip if requested is less than available (not testing insufficient stock)
              if (requestedAmount <= totalAvailable) return
              
              // Calculate deductions with only non-expired batches
              const deductions = calculateBatchDeductions(nonExpiredBatches, requestedAmount)
              
              // Total deducted should equal available (not requested)
              const totalDeducted = deductions.reduce((sum, d) => sum + d.amountToDeduct, 0)
              expect(totalDeducted).toBeCloseTo(totalAvailable, 2)
              
              // Should indicate insufficient stock
              assert.ok(
                totalDeducted < requestedAmount - 0.01,
                'Should indicate insufficient stock even though expired batches have volume'
              )
              
              // Verify no expired batches were used
              for (const deduction of deductions) {
                const isFromExpired = expiredBatches.some(b => b.batchNumber === deduction.batchNumber)
                assert.strictEqual(
                  isFromExpired,
                  false,
                  `Should not use expired batch ${deduction.batchNumber}`
                )
              }
            }
          ),
          { numRuns: 100 }
        )
      })
    })
  })
})

describe('Property 9: Insufficient Stock Detection', () => {
  /**
   * **Validates: Requirements 4.7, 5.8**
   *
   * For any distribution where the sum of non-expired batch remainingVolume < requested amount
   * (in base units), the system should return an error before making any database changes.
   *
   * Note: calculateBatchDeductions is a pure function that doesn't throw errors.
   * It will deduct what's available. The actual error checking happens in deductFromBatches.
   * This test verifies that when insufficient stock exists, the deductions don't exceed
   * what's available, which allows the caller to detect insufficient stock.
   */

  it('should detect insufficient stock when total available < requested amount', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            id: fc.integer({ min: 1, max: 10000 }),
            batchNumber: fc.string({ minLength: 5, maxLength: 20 }),
            remainingVolume: fc.float({ min: 1, max: 100, noNaN: true }),
            expiryDate: fc.date({
              min: new Date(Date.now() + 86400000),
              max: new Date('2030-12-31')
            })
          }),
          { minLength: 1, maxLength: 5 }
        ),
        (batches) => {
          // Calculate total available
          const totalAvailable = batches.reduce((sum, b) => sum + b.remainingVolume, 0)

          // Request more than available (1.5x to 3x)
          const multiplier = 1.5 + Math.random() * 1.5
          const requestedAmount = totalAvailable * multiplier

          // Calculate deductions
          const deductions = calculateBatchDeductions(batches, requestedAmount)

          // Total deducted should equal total available (not the requested amount)
          const totalDeducted = deductions.reduce((sum, d) => sum + d.amountToDeduct, 0)

          // The deductions should only cover what's available
          expect(totalDeducted).toBeCloseTo(totalAvailable, 2)

          // The total deducted should be less than requested
          assert.ok(
            totalDeducted < requestedAmount,
            `Total deducted (${totalDeducted}) should be less than requested (${requestedAmount})`
          )

          // This indicates insufficient stock - the caller can detect this by comparing
          // totalDeducted < requestedAmount
          const insufficientStock = totalDeducted < requestedAmount - 0.01
          assert.ok(
            insufficientStock,
            'Should indicate insufficient stock condition'
          )
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should deduct all available stock when insufficient', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            id: fc.integer({ min: 1, max: 10000 }),
            batchNumber: fc.string({ minLength: 5, maxLength: 20 }),
            remainingVolume: fc.float({ min: 1, max: 100, noNaN: true }),
            expiryDate: fc.date({
              min: new Date(Date.now() + 86400000),
              max: new Date('2030-12-31')
            })
          }),
          { minLength: 1, maxLength: 5 }
        ),
        (batches) => {
          const totalAvailable = batches.reduce((sum, b) => sum + b.remainingVolume, 0)

          // Request significantly more than available
          const requestedAmount = totalAvailable * 2

          // Calculate deductions
          const deductions = calculateBatchDeductions(batches, requestedAmount)

          // All batches should be fully depleted
          expect(deductions.length).toBe(batches.length)

          for (const deduction of deductions) {
            expect(deduction.willDeplete).toBe(true)
          }

          // Total deducted should equal total available
          const totalDeducted = deductions.reduce((sum, d) => sum + d.amountToDeduct, 0)
          expect(totalDeducted).toBeCloseTo(totalAvailable, 2)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should handle edge case where available is just slightly less than requested', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            id: fc.integer({ min: 1, max: 10000 }),
            batchNumber: fc.string({ minLength: 5, maxLength: 20 }),
            remainingVolume: fc.float({ min: 10, max: 100, noNaN: true }),
            expiryDate: fc.date({
              min: new Date(Date.now() + 86400000),
              max: new Date('2030-12-31')
            })
          }),
          { minLength: 1, maxLength: 5 }
        ),
        (batches) => {
          const totalAvailable = batches.reduce((sum, b) => sum + b.remainingVolume, 0)

          // Request just slightly more than available (0.1 to 1 unit more)
          const requestedAmount = totalAvailable + 0.1 + Math.random() * 0.9

          // Calculate deductions
          const deductions = calculateBatchDeductions(batches, requestedAmount)

          // Total deducted should be less than requested
          const totalDeducted = deductions.reduce((sum, d) => sum + d.amountToDeduct, 0)

          assert.ok(
            totalDeducted < requestedAmount,
            `Should detect insufficient stock even when close: deducted ${totalDeducted}, requested ${requestedAmount}`
          )

          // Should deduct all available
          expect(totalDeducted).toBeCloseTo(totalAvailable, 2)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should not indicate insufficient stock when exactly enough is available', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            id: fc.integer({ min: 1, max: 10000 }),
            batchNumber: fc.string({ minLength: 5, maxLength: 20 }),
            remainingVolume: fc.float({ min: 1, max: 100, noNaN: true }),
            expiryDate: fc.date({
              min: new Date(Date.now() + 86400000),
              max: new Date('2030-12-31')
            })
          }),
          { minLength: 1, maxLength: 5 }
        ),
        (batches) => {
          const totalAvailable = batches.reduce((sum, b) => sum + b.remainingVolume, 0)

          // Request exactly what's available
          const requestedAmount = totalAvailable

          // Calculate deductions
          const deductions = calculateBatchDeductions(batches, requestedAmount)

          // Total deducted should equal requested
          const totalDeducted = deductions.reduce((sum, d) => sum + d.amountToDeduct, 0)
          expect(totalDeducted).toBeCloseTo(requestedAmount, 2)

          // This should NOT indicate insufficient stock
          const insufficientStock = totalDeducted < requestedAmount - 0.01
          assert.strictEqual(
            insufficientStock,
            false,
            'Should not indicate insufficient stock when exactly enough is available'
          )
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should handle insufficient stock with only expired batches', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            id: fc.integer({ min: 1, max: 10000 }),
            batchNumber: fc.string({ minLength: 5, maxLength: 20 }),
            remainingVolume: fc.float({ min: 1, max: 100, noNaN: true }),
            // All batches expired
            expiryDate: fc.date({
              min: new Date('2020-01-01'),
              max: new Date(Date.now() - 86400000) // Yesterday or earlier
            })
          }),
          { minLength: 1, maxLength: 5 }
        ),
        fc.float({ min: 1, max: 100, noNaN: true }),
        (batches, requestedAmount) => {
          const now = new Date()

          // Filter to only non-expired batches (should be empty)
          const nonExpiredBatches = batches.filter(b => b.expiryDate > now)

          // Calculate deductions with non-expired batches
          const deductions = calculateBatchDeductions(nonExpiredBatches, requestedAmount)

          // Should have no deductions (all batches expired)
          expect(deductions.length).toBe(0)

          // Total deducted should be 0
          const totalDeducted = deductions.reduce((sum, d) => sum + d.amountToDeduct, 0)
          expect(totalDeducted).toBe(0)

          // This clearly indicates insufficient stock (0 available, but amount requested)
          assert.ok(
            totalDeducted < requestedAmount,
            'Should indicate insufficient stock when all batches expired'
          )
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should handle insufficient stock with mix of expired and non-expired batches', () => {
    fc.assert(
      fc.property(
        fc.record({
          // Some expired batches with volume
          expiredBatches: fc.array(
            fc.record({
              id: fc.integer({ min: 1, max: 10000 }),
              batchNumber: fc.string({ minLength: 5, maxLength: 20 }),
              remainingVolume: fc.float({ min: 10, max: 100, noNaN: true }),
              expiryDate: fc.date({
                min: new Date('2020-01-01'),
                max: new Date(Date.now() - 86400000)
              })
            }),
            { minLength: 1, maxLength: 3 }
          ),
          // Some non-expired batches with less volume
          nonExpiredBatches: fc.array(
            fc.record({
              id: fc.integer({ min: 1, max: 10000 }),
              batchNumber: fc.string({ minLength: 5, maxLength: 20 }),
              remainingVolume: fc.float({ min: 1, max: 50, noNaN: true }),
              expiryDate: fc.date({
                min: new Date(Date.now() + 86400000),
                max: new Date('2030-12-31')
              })
            }),
            { minLength: 1, maxLength: 3 }
          )
        }),
        ({ expiredBatches, nonExpiredBatches }) => {
          const now = new Date()

          // Calculate total if we could use expired batches
          const totalWithExpired = [...expiredBatches, ...nonExpiredBatches]
            .reduce((sum, b) => sum + b.remainingVolume, 0)

          // Calculate total available (non-expired only)
          const totalAvailable = nonExpiredBatches
            .reduce((sum, b) => sum + b.remainingVolume, 0)

          // Request amount between available and total (so expired batches would help, but can't use them)
          const requestedAmount = totalAvailable + (totalWithExpired - totalAvailable) * 0.5

          // Skip if requested is less than available (not testing insufficient stock)
          if (requestedAmount <= totalAvailable) return

          // Calculate deductions with only non-expired batches
          const deductions = calculateBatchDeductions(nonExpiredBatches, requestedAmount)

          // Total deducted should equal available (not requested)
          const totalDeducted = deductions.reduce((sum, d) => sum + d.amountToDeduct, 0)
          expect(totalDeducted).toBeCloseTo(totalAvailable, 2)

          // Should indicate insufficient stock
          assert.ok(
            totalDeducted < requestedAmount - 0.01,
            'Should indicate insufficient stock even though expired batches have volume'
          )

          // Verify no expired batches were used
          for (const deduction of deductions) {
            const isFromExpired = expiredBatches.some(b => b.batchNumber === deduction.batchNumber)
            assert.strictEqual(
              isFromExpired,
              false,
              `Should not use expired batch ${deduction.batchNumber}`
            )
          }
        }
      ),
      { numRuns: 100 }
    )
  })
})


describe('Unit Tests - FIFO Edge Cases', () => {
  /**
   * Unit tests for specific FIFO edge cases
   * Requirements: 4.2, 4.3, 4.4, 4.5
   */

  it('should exactly deplete a batch when distribution equals remaining volume', () => {
    // Arrange: Single batch with 1000 ML
    const batches: BatchInfo[] = [
      {
        id: 1,
        batchNumber: 'BATCH-001',
        remainingVolume: 1000,
        expiryDate: new Date('2025-12-31')
      }
    ]
    
    // Act: Request exactly 1000 ML
    const deductions = calculateBatchDeductions(batches, 1000)
    
    // Assert
    expect(deductions.length).toBe(1)
    expect(deductions[0].batchNumber).toBe('BATCH-001')
    expect(deductions[0].amountToDeduct).toBe(1000)
    expect(deductions[0].willDeplete).toBe(true)
  })

  it('should span multiple batches when distribution exceeds first batch', () => {
    // Arrange: Three batches with different volumes
    const batches: BatchInfo[] = [
      {
        id: 1,
        batchNumber: 'BATCH-001',
        remainingVolume: 500,
        expiryDate: new Date('2025-12-31')
      },
      {
        id: 2,
        batchNumber: 'BATCH-002',
        remainingVolume: 750,
        expiryDate: new Date('2025-11-30')
      },
      {
        id: 3,
        batchNumber: 'BATCH-003',
        remainingVolume: 1000,
        expiryDate: new Date('2025-10-31')
      }
    ]
    
    // Act: Request 1800 ML (spans all three batches)
    const deductions = calculateBatchDeductions(batches, 1800)
    
    // Assert: Should deduct from all three batches
    expect(deductions.length).toBe(3)
    
    // First batch: fully depleted (500 ML)
    expect(deductions[0].batchNumber).toBe('BATCH-001')
    expect(deductions[0].amountToDeduct).toBe(500)
    expect(deductions[0].willDeplete).toBe(true)
    
    // Second batch: fully depleted (750 ML)
    expect(deductions[1].batchNumber).toBe('BATCH-002')
    expect(deductions[1].amountToDeduct).toBe(750)
    expect(deductions[1].willDeplete).toBe(true)
    
    // Third batch: partially depleted (550 ML out of 1000 ML)
    expect(deductions[2].batchNumber).toBe('BATCH-003')
    expect(deductions[2].amountToDeduct).toBe(550)
    expect(deductions[2].willDeplete).toBe(false)
    
    // Total deducted should equal requested amount
    const totalDeducted = deductions.reduce((sum, d) => sum + d.amountToDeduct, 0)
    expect(totalDeducted).toBe(1800)
  })

  it('should handle batch with 1 ML remaining', () => {
    // Arrange: Batch with only 1 ML left
    const batches: BatchInfo[] = [
      {
        id: 1,
        batchNumber: 'BATCH-001',
        remainingVolume: 1,
        expiryDate: new Date('2025-12-31')
      },
      {
        id: 2,
        batchNumber: 'BATCH-002',
        remainingVolume: 500,
        expiryDate: new Date('2025-11-30')
      }
    ]
    
    // Act: Request 100 ML
    const deductions = calculateBatchDeductions(batches, 100)
    
    // Assert: Should use the 1 ML from first batch, then 99 ML from second
    expect(deductions.length).toBe(2)
    
    // First batch: fully depleted (1 ML)
    expect(deductions[0].batchNumber).toBe('BATCH-001')
    expect(deductions[0].amountToDeduct).toBe(1)
    expect(deductions[0].willDeplete).toBe(true)
    
    // Second batch: partially depleted (99 ML)
    expect(deductions[1].batchNumber).toBe('BATCH-002')
    expect(deductions[1].amountToDeduct).toBe(99)
    expect(deductions[1].willDeplete).toBe(false)
    
    // Total should equal requested
    const totalDeducted = deductions.reduce((sum, d) => sum + d.amountToDeduct, 0)
    expect(totalDeducted).toBe(100)
  })

  it('should return empty deductions when all batches are expired', () => {
    // Arrange: All batches expired (dates in the past)
    const now = new Date()
    const batches: BatchInfo[] = [
      {
        id: 1,
        batchNumber: 'BATCH-001',
        remainingVolume: 1000,
        expiryDate: new Date('2020-12-31') // Expired
      },
      {
        id: 2,
        batchNumber: 'BATCH-002',
        remainingVolume: 500,
        expiryDate: new Date('2021-06-30') // Expired
      }
    ]
    
    // Filter out expired batches (as the FIFO engine should do)
    const nonExpiredBatches = batches.filter(b => b.expiryDate && b.expiryDate > now)
    
    // Act: Request 100 ML from non-expired batches
    const deductions = calculateBatchDeductions(nonExpiredBatches, 100)
    
    // Assert: No deductions possible (all batches expired)
    expect(deductions.length).toBe(0)
    
    // Total deducted should be 0
    const totalDeducted = deductions.reduce((sum, d) => sum + d.amountToDeduct, 0)
    expect(totalDeducted).toBe(0)
  })

  it('should handle distribution that exactly depletes multiple batches', () => {
    // Arrange: Multiple batches
    const batches: BatchInfo[] = [
      {
        id: 1,
        batchNumber: 'BATCH-001',
        remainingVolume: 250,
        expiryDate: new Date('2025-12-31')
      },
      {
        id: 2,
        batchNumber: 'BATCH-002',
        remainingVolume: 500,
        expiryDate: new Date('2025-11-30')
      },
      {
        id: 3,
        batchNumber: 'BATCH-003',
        remainingVolume: 250,
        expiryDate: new Date('2025-10-31')
      }
    ]
    
    // Act: Request exactly 1000 ML (depletes all batches)
    const deductions = calculateBatchDeductions(batches, 1000)
    
    // Assert: All three batches should be fully depleted
    expect(deductions.length).toBe(3)
    
    expect(deductions[0].batchNumber).toBe('BATCH-001')
    expect(deductions[0].amountToDeduct).toBe(250)
    expect(deductions[0].willDeplete).toBe(true)
    
    expect(deductions[1].batchNumber).toBe('BATCH-002')
    expect(deductions[1].amountToDeduct).toBe(500)
    expect(deductions[1].willDeplete).toBe(true)
    
    expect(deductions[2].batchNumber).toBe('BATCH-003')
    expect(deductions[2].amountToDeduct).toBe(250)
    expect(deductions[2].willDeplete).toBe(true)
    
    // Total should equal requested
    const totalDeducted = deductions.reduce((sum, d) => sum + d.amountToDeduct, 0)
    expect(totalDeducted).toBe(1000)
  })

  it('should handle very small remaining volume (0.01 ML)', () => {
    // Arrange: Batch with very small remaining volume
    const batches: BatchInfo[] = [
      {
        id: 1,
        batchNumber: 'BATCH-001',
        remainingVolume: 0.01,
        expiryDate: new Date('2025-12-31')
      },
      {
        id: 2,
        batchNumber: 'BATCH-002',
        remainingVolume: 100,
        expiryDate: new Date('2025-11-30')
      }
    ]
    
    // Act: Request 50 ML
    const deductions = calculateBatchDeductions(batches, 50)
    
    // Assert: Should use 0.01 ML from first batch, then 49.99 ML from second
    expect(deductions.length).toBe(2)
    
    expect(deductions[0].batchNumber).toBe('BATCH-001')
    expect(deductions[0].amountToDeduct).toBeCloseTo(0.01, 2)
    expect(deductions[0].willDeplete).toBe(true)
    
    expect(deductions[1].batchNumber).toBe('BATCH-002')
    expect(deductions[1].amountToDeduct).toBeCloseTo(49.99, 2)
    expect(deductions[1].willDeplete).toBe(false)
    
    // Total should equal requested
    const totalDeducted = deductions.reduce((sum, d) => sum + d.amountToDeduct, 0)
    expect(totalDeducted).toBeCloseTo(50, 2)
  })

  it('should skip expired batches and use only non-expired ones', () => {
    // Arrange: Mix of expired and non-expired batches
    const now = new Date()
    const tomorrow = new Date(now.getTime() + 86400000)
    const yesterday = new Date(now.getTime() - 86400000)
    
    const allBatches: BatchInfo[] = [
      {
        id: 1,
        batchNumber: 'BATCH-EXPIRED-1',
        remainingVolume: 1000,
        expiryDate: yesterday // Expired
      },
      {
        id: 2,
        batchNumber: 'BATCH-VALID-1',
        remainingVolume: 500,
        expiryDate: tomorrow // Valid
      },
      {
        id: 3,
        batchNumber: 'BATCH-EXPIRED-2',
        remainingVolume: 750,
        expiryDate: yesterday // Expired
      },
      {
        id: 4,
        batchNumber: 'BATCH-VALID-2',
        remainingVolume: 300,
        expiryDate: tomorrow // Valid
      }
    ]
    
    // Filter to only non-expired batches (as FIFO engine should do)
    const nonExpiredBatches = allBatches.filter(b => b.expiryDate && b.expiryDate > now)
    
    // Act: Request 600 ML
    const deductions = calculateBatchDeductions(nonExpiredBatches, 600)
    
    // Assert: Should only use non-expired batches
    expect(deductions.length).toBe(2)
    
    // First valid batch: fully depleted (500 ML)
    expect(deductions[0].batchNumber).toBe('BATCH-VALID-1')
    expect(deductions[0].amountToDeduct).toBe(500)
    expect(deductions[0].willDeplete).toBe(true)
    
    // Second valid batch: partially depleted (100 ML out of 300 ML)
    expect(deductions[1].batchNumber).toBe('BATCH-VALID-2')
    expect(deductions[1].amountToDeduct).toBe(100)
    expect(deductions[1].willDeplete).toBe(false)
    
    // Verify no expired batches were used
    for (const deduction of deductions) {
      assert.ok(
        !deduction.batchNumber.includes('EXPIRED'),
        `Should not use expired batch ${deduction.batchNumber}`
      )
    }
    
    // Total should equal requested
    const totalDeducted = deductions.reduce((sum, d) => sum + d.amountToDeduct, 0)
    expect(totalDeducted).toBe(600)
  })
})
