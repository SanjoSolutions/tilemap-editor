import type { CellArea } from "./CellArea.js"
export function areCellAreasDifferent(a: CellArea, b: CellArea): boolean {
  return (
    a.row !== b.row ||
    a.column !== b.column ||
    a.width !== b.width ||
    a.height !== b.height
  )
}
