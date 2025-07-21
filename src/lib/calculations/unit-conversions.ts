/**
 * Unit conversion utilities for the proposal system
 */

export type Unit = 'SF' | 'LF' | 'EACH' | 'LOT' | 'TUBES' | 'SHEETS';

/**
 * Convert square feet to linear feet (assuming 4' height)
 */
export function squareFeetToLinearFeet(
  squareFeet: number,
  height: number = 4
): number {
  return squareFeet / height;
}

/**
 * Convert linear feet to square feet (assuming 4' height)
 */
export function linearFeetToSquareFeet(
  linearFeet: number,
  height: number = 4
): number {
  return linearFeet * height;
}

/**
 * Convert square feet to sheets (assuming 4' x 8' sheets)
 */
export function squareFeetToSheets(
  squareFeet: number,
  sheetWidth: number = 4,
  sheetHeight: number = 8
): number {
  const sheetArea = sheetWidth * sheetHeight;
  return Math.ceil(squareFeet / sheetArea);
}

/**
 * Convert sheets to square feet (assuming 4' x 8' sheets)
 */
export function sheetsToSquareFeet(
  sheets: number,
  sheetWidth: number = 4,
  sheetHeight: number = 8
): number {
  return sheets * sheetWidth * sheetHeight;
}

/**
 * Get conversion factor between units
 */
export function getConversionFactor(fromUnit: Unit, toUnit: Unit): number {
  const conversions: Record<string, Record<string, number>> = {
    SF: {
      LF: 0.25, // 1 SF = 0.25 LF (assuming 4' height)
      SHEETS: 0.03125, // 1 SF = 0.03125 sheets (assuming 4' x 8' sheets)
    },
    LF: {
      SF: 4, // 1 LF = 4 SF (assuming 4' height)
      SHEETS: 0.125, // 1 LF = 0.125 sheets (assuming 4' x 8' sheets)
    },
    SHEETS: {
      SF: 32, // 1 sheet = 32 SF (assuming 4' x 8' sheets)
      LF: 8, // 1 sheet = 8 LF (assuming 4' x 8' sheets)
    },
  };

  if (fromUnit === toUnit) return 1;

  return conversions[fromUnit]?.[toUnit] || 1;
}

/**
 * Convert quantity from one unit to another
 */
export function convertQuantity(
  quantity: number,
  fromUnit: Unit,
  toUnit: Unit
): number {
  const factor = getConversionFactor(fromUnit, toUnit);
  return quantity * factor;
}

/**
 * Validate if a conversion is possible
 */
export function canConvert(fromUnit: Unit, toUnit: Unit): boolean {
  if (fromUnit === toUnit) return true;

  const convertibleUnits: Record<Unit, Unit[]> = {
    SF: ['LF', 'SHEETS'],
    LF: ['SF', 'SHEETS'],
    SHEETS: ['SF', 'LF'],
    EACH: ['EACH'],
    LOT: ['LOT'],
    TUBES: ['TUBES'],
  };

  return convertibleUnits[fromUnit]?.includes(toUnit) || false;
}
