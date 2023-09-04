import type { App } from "../App.js"
import type { CellPosition } from "../CellPosition.js"
import type { Tile } from "../Tile.js"

export function expectTileAt(
  app: App,
  position: CellPosition,
  tile: Tile,
): void {
  expect(app.currentLevelTileLayer.retrieveTile(position)).toEqual(tile)
}
