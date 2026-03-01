/**
 * Unit Conversion System for Chemical Distribution
 * 
 * Handles automatic conversion between bulk units (GAL, L, KG) and base units (ML, G)
 * for accurate inventory tracking and distribution calculations.
 */

/**
 * Conversion factors from various units to base units
 * - GAL to ML: 3785.41
 * - L to ML: 1000
 * - ML to ML: 1 (no conversion)
 * - KG to G: 1000
 * - G to G: 1 (no conversion)
 */
export const CONVERSION_FACTORS: Record<string, number> = {
  'GAL': 3785.41,
  'L': 1000,
  'ML': 1,
  'KG': 1000,
  'G': 1
}

/**
 * Converts an amount from any unit to its base unit equivalent
 * 
 * @param amount - The quantity to convert
 * @param unit - The source unit (GAL, L, ML, KG, or G)
 * @returns The amount converted to base unit (ML for liquids, G for solids)
 * 
 * @example
 * convertToBaseUnit(0.5, 'GAL') // Returns 1892.705 (0.5 * 3785.41)
 * convertToBaseUnit(2, 'L') // Returns 2000 (2 * 1000)
 * convertToBaseUnit(100, 'ML') // Returns 100 (no conversion)
 */
export function convertToBaseUnit(amount: number, unit: string): number {
  const factor = CONVERSION_FACTORS[unit] || 1
  return amount * factor
}

/**
 * Determines the base unit for a given unit type
 * 
 * @param unit - The source unit (GAL, L, ML, KG, or G)
 * @returns 'ML' for liquid units (GAL, L, ML) or 'G' for solid units (KG, G)
 * 
 * @example
 * determineBaseUnit('GAL') // Returns 'ML'
 * determineBaseUnit('L') // Returns 'ML'
 * determineBaseUnit('KG') // Returns 'G'
 */
export function determineBaseUnit(unit: string): 'ML' | 'G' {
  const liquidUnits = ['GAL', 'L', 'ML']
  return liquidUnits.includes(unit) ? 'ML' : 'G'
}

/**
 * Converts an amount from base unit back to a target unit
 * 
 * @param baseAmount - The quantity in base unit (ML or G)
 * @param baseUnit - The base unit (ML or G)
 * @param targetUnit - The target unit to convert to (GAL, L, ML, KG, or G)
 * @returns The amount converted to target unit
 * 
 * @example
 * convertFromBaseUnit(1892.71, 'ML', 'GAL') // Returns ~0.5 (1892.71 / 3785.41)
 * convertFromBaseUnit(2000, 'ML', 'L') // Returns 2 (2000 / 1000)
 * convertFromBaseUnit(100, 'ML', 'ML') // Returns 100 (no conversion)
 */
export function convertFromBaseUnit(baseAmount: number, baseUnit: string, targetUnit: string): number {
  const factor = CONVERSION_FACTORS[targetUnit] || 1
  return baseAmount / factor
}

/**
 * Formats volume for consistent display across the application
 * 
 * Formats numbers with comma separators for thousands and up to 2 decimal places
 * (trailing zeros removed). When original unit differs from base unit, displays
 * both values for clarity.
 * 
 * @param baseAmount - The amount in base unit
 * @param baseUnit - The base unit (ML or G)
 * @param originalAmount - Optional original amount before conversion
 * @param originalUnit - Optional original unit before conversion
 * @returns Formatted string for display
 * 
 * @example
 * formatVolume(18927, 'ML') // Returns "18,927 ML"
 * formatVolume(1892.71, 'ML', 0.5, 'GAL') // Returns "1,892.71 ML (0.5 GAL)"
 * formatVolume(2000, 'ML', 2, 'L') // Returns "2,000 ML (2 L)"
 * formatVolume(1500.50, 'G') // Returns "1,500.5 G" (trailing zero removed)
 */
export function formatVolume(
  baseAmount: number,
  baseUnit: string,
  originalAmount?: number,
  originalUnit?: string
): string {
  const formatted = baseAmount.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  })
  
  if (originalAmount !== undefined && originalUnit && originalUnit !== baseUnit) {
    const originalFormatted = originalAmount.toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    })
    return `${formatted} ${baseUnit} (${originalFormatted} ${originalUnit})`
  }
  
  return `${formatted} ${baseUnit}`
}
