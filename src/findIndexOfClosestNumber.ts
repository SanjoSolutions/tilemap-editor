export function findIndexOfClosestNumber(
  numbers: number[],
  value: number,
): number {
  let closestIndex = 0
  let closestDistance = Math.abs(numbers[closestIndex] - value)
  for (let index = 1; index < numbers.length; index++) {
    const distance = Math.abs(numbers[index] - value)
    if (distance < closestDistance) {
      closestDistance = distance
      closestIndex = index
    }
  }
  return closestIndex
}
