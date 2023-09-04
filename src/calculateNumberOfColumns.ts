export function calculateNumberOfColumns(
  width: bigint,
  tileWidth: number,
): bigint {
  return width / BigInt(tileWidth)
}
