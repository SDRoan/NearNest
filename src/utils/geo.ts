/**
 * Round latitude/longitude to 3 decimal places (~100m precision).
 * Used for coarse location storage for privacy.
 */
export function roundTo3Decimals(n: number): number {
  return Math.round(n * 1000) / 1000;
}
