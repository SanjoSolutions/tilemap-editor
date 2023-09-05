import type { Position } from "./Position.js"

export function addPositions(a: Position, b: Position): Position {
  return {
    x: a.x + b.x,
    y: a.y + b.y,
  }
}
