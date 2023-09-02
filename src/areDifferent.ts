import type { Tile } from "./Tile.js"
export function areDifferent(a: Tile, b: Tile) {
  return a.x !== b.x || a.y !== b.y || a.tileSet !== b.tileSet
}
