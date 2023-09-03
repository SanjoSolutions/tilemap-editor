import type { Tile } from "./Tile.js"
export function areTilesDifferent(a: Tile, b: Tile): boolean {
  return a.x !== b.x || a.y !== b.y || a.tileSet !== b.tileSet
}
