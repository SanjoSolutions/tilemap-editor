export interface CellPosition {
  row: bigint
  column: bigint
}

export function createCellPositionKey(position: CellPosition) {
  return `${position.row}_${position.column}`
}
