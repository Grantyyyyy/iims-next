/**
 * Unit Conversion System Tests
 * 
 * Tests for unit conversion helpers used in chemical distribution feature.
 * Includes both unit tests for specific examples and property-based tests
 * for universal correctness properties.
 */

import { describe, it } from 'node:test'
import assert from 'node:assert'
import fc from 'fast-check'
import {
  convertToBaseUnit,
  convertFromBaseUnit,
  determineBaseUnit,
  formatVolume,
  CONVERSION_FACTORS
} from '../unit-conversion'

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
  toBeLessThan: (expected: number) => assert.ok(actual < expected, `Expected ${actual} to be less than ${expected}`)
})

describe('Unit Conversion System', () => {
  describe('CONVERSION_FACTORS', () => {
    it('should export conversion factors constant', () => {
      expect(CONVERSION_FACTORS).toBeDefined()
      expect(CONVERSION_FACTORS['GAL']).toBe(3785.41)
      expect(CONVERSION_FACTORS['L']).toBe(1000)
      expect(CONVERSION_FACTORS['ML']).toBe(1)
      expect(CONVERSION_FACTORS['KG']).toBe(1000)
      expect(CONVERSION_FACTORS['G']).toBe(1)
    })
  })

  describe('convertToBaseUnit', () => {
    describe('liquid unit conversions', () => {
      it('should convert GAL to ML correctly', () => {
        // Requirement 1.1: GAL to ML conversion
        expect(convertToBaseUnit(1, 'GAL')).toBe(3785.41)
        expect(convertToBaseUnit(0.5, 'GAL')).toBe(1892.705)
        expect(convertToBaseUnit(2, 'GAL')).toBe(7570.82)
      })

      it('should convert L to ML correctly', () => {
        // Requirement 1.2: L to ML conversion
        expect(convertToBaseUnit(1, 'L')).toBe(1000)
        expect(convertToBaseUnit(2.5, 'L')).toBe(2500)
        expect(convertToBaseUnit(0.1, 'L')).toBe(100)
      })

      it('should not convert ML (base unit)', () => {
        // Requirement 1.4: Base unit ML should not be converted
        expect(convertToBaseUnit(100, 'ML')).toBe(100)
        expect(convertToBaseUnit(1500.5, 'ML')).toBe(1500.5)
      })
    })

    describe('solid unit conversions', () => {
      it('should convert KG to G correctly', () => {
        // Requirement 1.3: KG to G conversion
        expect(convertToBaseUnit(1, 'KG')).toBe(1000)
        expect(convertToBaseUnit(2.5, 'KG')).toBe(2500)
        expect(convertToBaseUnit(0.5, 'KG')).toBe(500)
      })

      it('should not convert G (base unit)', () => {
        // Requirement 1.4: Base unit G should not be converted
        expect(convertToBaseUnit(500, 'G')).toBe(500)
        expect(convertToBaseUnit(1250.75, 'G')).toBe(1250.75)
      })
    })

    describe('edge cases', () => {
      it('should handle zero amount', () => {
        expect(convertToBaseUnit(0, 'GAL')).toBe(0)
        expect(convertToBaseUnit(0, 'L')).toBe(0)
        expect(convertToBaseUnit(0, 'KG')).toBe(0)
      })

      it('should handle very small amounts', () => {
        expect(convertToBaseUnit(0.001, 'GAL')).toBeCloseTo(3.78541, 5)
        expect(convertToBaseUnit(0.001, 'L')).toBe(1)
      })

      it('should handle very large amounts', () => {
        expect(convertToBaseUnit(1000, 'GAL')).toBe(3785410)
        expect(convertToBaseUnit(10000, 'L')).toBe(10000000)
      })

      it('should handle unknown units by using factor 1', () => {
        expect(convertToBaseUnit(100, 'UNKNOWN')).toBe(100)
      })
    })

    describe('precision', () => {
      it('should maintain precision to two decimal places', () => {
        // Requirement 1.8: Maintain precision to two decimal places
        const result = convertToBaseUnit(0.5, 'GAL')
        expect(result).toBeCloseTo(1892.71, 2)
      })

      it('should preserve decimal precision in calculations', () => {
        const result = convertToBaseUnit(1.5, 'L')
        expect(result).toBe(1500)
      })
    })
  })

  describe('determineBaseUnit', () => {
    it('should return ML for liquid units', () => {
      // Requirement 1.5: Determine base unit as ML for liquids
      expect(determineBaseUnit('GAL')).toBe('ML')
      expect(determineBaseUnit('L')).toBe('ML')
      expect(determineBaseUnit('ML')).toBe('ML')
    })

    it('should return G for solid units', () => {
      // Requirement 1.6: Determine base unit as G for solids
      expect(determineBaseUnit('KG')).toBe('G')
      expect(determineBaseUnit('G')).toBe('G')
    })

    it('should default to G for unknown units', () => {
      expect(determineBaseUnit('UNKNOWN')).toBe('G')
      expect(determineBaseUnit('OZ')).toBe('G')
    })
  })

  describe('formatVolume', () => {
    describe('base unit only display', () => {
      it('should format base unit with comma separators', () => {
        // Requirement 14.1: Format as "[amount] [unit]"
        // Requirement 14.3: Use comma separators for thousands
        expect(formatVolume(18927, 'ML')).toBe('18,927 ML')
        expect(formatVolume(1500, 'G')).toBe('1,500 G')
      })

      it('should format with up to two decimal places', () => {
        // Requirement 14.4: Display up to two decimal places
        expect(formatVolume(1892.71, 'ML')).toBe('1,892.71 ML')
        expect(formatVolume(1500.5, 'G')).toBe('1,500.5 G')
      })

      it('should remove trailing zeros', () => {
        // Requirement 14.4: Remove trailing zeros
        expect(formatVolume(1500.0, 'ML')).toBe('1,500 ML')
        expect(formatVolume(100.10, 'G')).toBe('100.1 G')
      })

      it('should handle whole numbers', () => {
        expect(formatVolume(1000, 'ML')).toBe('1,000 ML')
        expect(formatVolume(500, 'G')).toBe('500 G')
      })
    })

    describe('display with unit conversion', () => {
      it('should format with original unit when different from base', () => {
        // Requirement 14.2: Format as "[base_amount] [base_unit] ([original_amount] [original_unit])"
        expect(formatVolume(1892.71, 'ML', 0.5, 'GAL')).toBe('1,892.71 ML (0.5 GAL)')
        expect(formatVolume(2000, 'ML', 2, 'L')).toBe('2,000 ML (2 L)')
        expect(formatVolume(1000, 'G', 1, 'KG')).toBe('1,000 G (1 KG)')
      })

      it('should not show parentheses when original unit equals base unit', () => {
        // Requirement 14.5: Display only base amount when units match
        expect(formatVolume(1500, 'ML', 1500, 'ML')).toBe('1,500 ML')
        expect(formatVolume(500, 'G', 500, 'G')).toBe('500 G')
      })

      it('should format both amounts with comma separators', () => {
        expect(formatVolume(18927.05, 'ML', 5, 'GAL')).toBe('18,927.05 ML (5 GAL)')
      })

      it('should handle decimal places in both amounts', () => {
        expect(formatVolume(1892.71, 'ML', 0.5, 'GAL')).toBe('1,892.71 ML (0.5 GAL)')
        expect(formatVolume(2500.5, 'G', 2.5, 'KG')).toBe('2,500.5 G (2.5 KG)')
      })
    })

    describe('edge cases', () => {
      it('should handle zero values', () => {
        expect(formatVolume(0, 'ML')).toBe('0 ML')
        expect(formatVolume(0, 'ML', 0, 'GAL')).toBe('0 ML (0 GAL)')
      })

      it('should handle very large numbers', () => {
        expect(formatVolume(1000000, 'ML')).toBe('1,000,000 ML')
        expect(formatVolume(3785410, 'ML', 1000, 'GAL')).toBe('3,785,410 ML (1,000 GAL)')
      })

      it('should handle very small decimal numbers', () => {
        expect(formatVolume(0.01, 'ML')).toBe('0.01 ML')
        expect(formatVolume(0.5, 'G')).toBe('0.5 G')
      })

      it('should handle undefined original amount', () => {
        expect(formatVolume(1500, 'ML', undefined, 'GAL')).toBe('1,500 ML')
      })

      it('should handle undefined original unit', () => {
        expect(formatVolume(1500, 'ML', 1500, undefined)).toBe('1,500 ML')
      })
    })
  })

  describe('integration scenarios', () => {
    it('should handle complete conversion workflow for GAL to ML', () => {
      // Requirements 1.1, 1.5, 1.7, 14.2
      const originalAmount = 0.5
      const originalUnit = 'GAL'

      const baseAmount = convertToBaseUnit(originalAmount, originalUnit)
      const baseUnit = determineBaseUnit(originalUnit)
      const display = formatVolume(baseAmount, baseUnit, originalAmount, originalUnit)

      expect(baseAmount).toBeCloseTo(1892.71, 2)
      expect(baseUnit).toBe('ML')
      expect(display).toBe('1,892.71 ML (0.5 GAL)')
    })

    it('should handle complete conversion workflow for L to ML', () => {
      // Requirements 1.2, 1.5, 1.7, 14.2
      const originalAmount = 2
      const originalUnit = 'L'

      const baseAmount = convertToBaseUnit(originalAmount, originalUnit)
      const baseUnit = determineBaseUnit(originalUnit)
      const display = formatVolume(baseAmount, baseUnit, originalAmount, originalUnit)

      expect(baseAmount).toBe(2000)
      expect(baseUnit).toBe('ML')
      expect(display).toBe('2,000 ML (2 L)')
    })

    it('should handle complete conversion workflow for KG to G', () => {
      // Requirements 1.3, 1.6, 1.7, 14.2
      const originalAmount = 1.5
      const originalUnit = 'KG'

      const baseAmount = convertToBaseUnit(originalAmount, originalUnit)
      const baseUnit = determineBaseUnit(originalUnit)
      const display = formatVolume(baseAmount, baseUnit, originalAmount, originalUnit)

      expect(baseAmount).toBe(1500)
      expect(baseUnit).toBe('G')
      expect(display).toBe('1,500 G (1.5 KG)')
    })

    it('should handle base unit input without conversion', () => {
      // Requirements 1.4, 14.5
      const originalAmount = 1500
      const originalUnit = 'ML'

      const baseAmount = convertToBaseUnit(originalAmount, originalUnit)
      const baseUnit = determineBaseUnit(originalUnit)
      const display = formatVolume(baseAmount, baseUnit, originalAmount, originalUnit)

      expect(baseAmount).toBe(1500)
      expect(baseUnit).toBe('ML')
      expect(display).toBe('1,500 ML')
    })
  })

  describe('Property-Based Tests', () => {
    describe('Property 1: Unit Conversion Correctness', () => {
      /**
       * **Validates: Requirements 1.1, 1.2, 1.3, 1.4, 1.8**
       * 
       * For any amount and valid unit (GAL, L, ML, KG, G), converting to base unit 
       * and then back to the original unit should preserve the physical quantity 
       * within acceptable precision (0.01 units).
       */
      it('should preserve quantity when converting to base unit and back', () => {
        fc.assert(
          fc.property(
            fc.float({ min: Math.fround(0.01), max: Math.fround(10000), noNaN: true }),
            fc.constantFrom('GAL', 'L', 'ML', 'KG', 'G'),
            (amount, unit) => {
              // Convert to base unit
              const baseAmount = convertToBaseUnit(amount, unit)
              const baseUnit = determineBaseUnit(unit)

              // Convert back to original unit
              const backConverted = convertFromBaseUnit(baseAmount, baseUnit, unit)

              // Should be equal within 0.01 precision
              const difference = Math.abs(backConverted - amount)
              expect(difference).toBeLessThan(0.01)
            }
          ),
          { numRuns: 100 }
        )
      })

      it('should handle edge case: zero amount', () => {
        fc.assert(
          fc.property(
            fc.constantFrom('GAL', 'L', 'ML', 'KG', 'G'),
            (unit) => {
              const baseAmount = convertToBaseUnit(0, unit)
              const baseUnit = determineBaseUnit(unit)
              const backConverted = convertFromBaseUnit(baseAmount, baseUnit, unit)

              expect(backConverted).toBe(0)
            }
          ),
          { numRuns: 100 }
        )
      })

      it('should maintain precision for very small amounts', () => {
        fc.assert(
          fc.property(
            fc.float({ min: Math.fround(0.01), max: Math.fround(1), noNaN: true }),
            fc.constantFrom('GAL', 'L', 'ML', 'KG', 'G'),
            (amount, unit) => {
              const baseAmount = convertToBaseUnit(amount, unit)
              const baseUnit = determineBaseUnit(unit)
              const backConverted = convertFromBaseUnit(baseAmount, baseUnit, unit)

              const difference = Math.abs(backConverted - amount)
              expect(difference).toBeLessThan(0.01)
            }
          ),
          { numRuns: 100 }
        )
      })

      it('should maintain precision for very large amounts', () => {
        fc.assert(
          fc.property(
            fc.float({ min: Math.fround(1000), max: Math.fround(10000), noNaN: true }),
            fc.constantFrom('GAL', 'L', 'ML', 'KG', 'G'),
            (amount, unit) => {
              const baseAmount = convertToBaseUnit(amount, unit)
              const baseUnit = determineBaseUnit(unit)
              const backConverted = convertFromBaseUnit(baseAmount, baseUnit, unit)

              const difference = Math.abs(backConverted - amount)
              expect(difference).toBeLessThan(0.01)
            }
          ),
          { numRuns: 100 }
        )
      })

      it('should preserve quantity for base units (no conversion)', () => {
        fc.assert(
          fc.property(
            fc.float({ min: Math.fround(0.01), max: Math.fround(10000), noNaN: true }),
            fc.constantFrom('ML', 'G'),
            (amount, unit) => {
              const baseAmount = convertToBaseUnit(amount, unit)
              const baseUnit = determineBaseUnit(unit)
              const backConverted = convertFromBaseUnit(baseAmount, baseUnit, unit)

              // For base units, should be exactly equal
              expect(backConverted).toBe(amount)
            }
          ),
          { numRuns: 100 }
        )
      })

      it('should correctly convert between all liquid units', () => {
        fc.assert(
          fc.property(
            fc.float({ min: Math.fround(0.01), max: Math.fround(10000), noNaN: true }),
            fc.constantFrom('GAL', 'L', 'ML'),
            (amount, unit) => {
              const baseAmount = convertToBaseUnit(amount, unit)
              const baseUnit = determineBaseUnit(unit)

              // Base unit should always be ML for liquids
              expect(baseUnit).toBe('ML')

              // Convert back should preserve quantity
              const backConverted = convertFromBaseUnit(baseAmount, baseUnit, unit)
              const difference = Math.abs(backConverted - amount)
              expect(difference).toBeLessThan(0.01)
            }
          ),
          { numRuns: 100 }
        )
      })

      it('should correctly convert between all solid units', () => {
        fc.assert(
          fc.property(
            fc.float({ min: Math.fround(0.01), max: Math.fround(10000), noNaN: true }),
            fc.constantFrom('KG', 'G'),
            (amount, unit) => {
              const baseAmount = convertToBaseUnit(amount, unit)
              const baseUnit = determineBaseUnit(unit)

              // Base unit should always be G for solids
              expect(baseUnit).toBe('G')

              // Convert back should preserve quantity
              const backConverted = convertFromBaseUnit(baseAmount, baseUnit, unit)
              const difference = Math.abs(backConverted - amount)
              expect(difference).toBeLessThan(0.01)
            }
          ),
          { numRuns: 100 }
        )
      })
    })

    describe('Property 2: Base Unit Determination', () => {
      /**
       * **Validates: Requirements 1.5, 1.6**
       * 
       * For any unit in the set {GAL, L, ML}, the determined base unit should be ML.
       * For any unit in the set {KG, G}, the determined base unit should be G.
       */
      it('should return ML for all liquid units', () => {
        fc.assert(
          fc.property(
            fc.constantFrom('GAL', 'L', 'ML'),
            (unit) => {
              const baseUnit = determineBaseUnit(unit)
              expect(baseUnit).toBe('ML')
            }
          ),
          { numRuns: 100 }
        )
      })

      it('should return G for all solid units', () => {
        fc.assert(
          fc.property(
            fc.constantFrom('KG', 'G'),
            (unit) => {
              const baseUnit = determineBaseUnit(unit)
              expect(baseUnit).toBe('G')
            }
          ),
          { numRuns: 100 }
        )
      })

      it('should consistently determine base unit for any valid unit', () => {
        fc.assert(
          fc.property(
            fc.constantFrom('GAL', 'L', 'ML', 'KG', 'G'),
            (unit) => {
              const baseUnit = determineBaseUnit(unit)

              // Base unit must be either ML or G
              const isValidBaseUnit = baseUnit === 'ML' || baseUnit === 'G'
              assert.ok(isValidBaseUnit, `Base unit must be ML or G, got ${baseUnit}`)

              // Liquid units should map to ML
              if (['GAL', 'L', 'ML'].includes(unit)) {
                expect(baseUnit).toBe('ML')
              }

              // Solid units should map to G
              if (['KG', 'G'].includes(unit)) {
                expect(baseUnit).toBe('G')
              }
            }
          ),
          { numRuns: 100 }
        )
      })

      it('should be idempotent - calling multiple times returns same result', () => {
        fc.assert(
          fc.property(
            fc.constantFrom('GAL', 'L', 'ML', 'KG', 'G'),
            (unit) => {
              const firstCall = determineBaseUnit(unit)
              const secondCall = determineBaseUnit(unit)
              const thirdCall = determineBaseUnit(unit)

              expect(secondCall).toBe(firstCall)
              expect(thirdCall).toBe(firstCall)
            }
          ),
          { numRuns: 100 }
        )
      })

      it('should determine base unit independent of amount', () => {
        fc.assert(
          fc.property(
            fc.constantFrom('GAL', 'L', 'ML', 'KG', 'G'),
            fc.float({ min: Math.fround(0.01), max: Math.fround(10000), noNaN: true }),
            (unit, amount) => {
              // Base unit determination should not depend on amount
              const baseUnit = determineBaseUnit(unit)

              // Verify by converting and checking consistency
              const baseAmount = convertToBaseUnit(amount, unit)
              const determinedBaseUnit = determineBaseUnit(unit)

              expect(determinedBaseUnit).toBe(baseUnit)
            }
          ),
          { numRuns: 100 }
        )
      })
    })
  })
})
