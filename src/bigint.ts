export function min(a: bigint, b: bigint): bigint {
  return a < b ? a : b
}

export function max(a: bigint, b: bigint): bigint {
  return a > b ? a : b
}

export function abs(value: bigint): bigint {
  return value < 0 ? -value : value
}

export function halfOfCeiled(value: bigint): bigint {
  return (value + 1n) / 2n
}
