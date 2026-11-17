export function isNonNegativeInteger(value) {
  return Number.isInteger(value) && value >= 0 && value <= 2147483647;
}
