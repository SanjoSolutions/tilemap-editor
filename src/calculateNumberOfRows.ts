export function calculateNumberOfRows(
  height: bigint,
  tileHeight: number,
): bigint {
  return height / BigInt(tileHeight)
}
