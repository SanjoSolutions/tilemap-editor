import type { CellPosition } from "./CellPosition.js"
import type { MultiLayerTile } from "./MultiLayerTile.js"
import type { Size } from "./Size.js"
import { TileLayer } from "./TileLayer.js"
import type { TileSet } from "./TileSet.js"
import type { TileSetID } from "./TileSetID.js"

export class TileMap {
  tileSize: Size = {
    width: 0,
    height: 0,
  }
  tileSets: Record<TileSetID, TileSet> = {}
  // TODO: Make tiles reactive
  tiles: TileLayer[] = [new TileLayer()]

  setMultiLayerTile(
    { row, column }: CellPosition,
    multiLayerTile: MultiLayerTile,
  ): boolean {
    let hasSomethingChanged = false
    for (let level = 0; level < multiLayerTile.length; level++) {
      const tile = multiLayerTile[level]
      const hasChanged = this.tiles[level].setTile({ row, column }, tile)
      hasSomethingChanged ||= hasChanged
    }

    return hasSomethingChanged
  }

  copy() {
    const copy = new TileMap()
    copy.tileSize = { ...this.tileSize }
    copy.tileSets = { ...this.tileSets }
    copy.tiles = this.tiles.map((tileLayer) => tileLayer.copy())
    return copy
  }
}

export function createTileMapNullObject() {
  return new TileMap()
}
