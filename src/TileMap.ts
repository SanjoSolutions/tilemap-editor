import type { CellPosition } from "./CellPosition.js"
import type { MultiLayerTile } from "./MultiLayerTile.js"
import type { Size } from "./Size.js"
import { TileLayer } from "./TileLayer.js"
import type { TileSet } from "./TileSet.js"
import type { TileSetID } from "./TileSetID.js"

interface RawObjectTileMap {
  tileSize: Size
  tileSets: Record<TileSetID, TileSet>
  tiles: TileLayer[]
}

export class TileMap {
  tileSize: Size = {
    width: 32,
    height: 32,
  }
  tileSets: Record<TileSetID, TileSet> = {}
  // TODO: Make tiles reactive
  tiles: TileLayer[] = [new TileLayer()]

  static fromRawObject(rawObject: RawObjectTileMap) {
    const tileMap = new TileMap()
    tileMap.tileSize = { ...rawObject.tileSize }
    tileMap.tileSets = Object.fromEntries(
      Object.entries(rawObject.tileSets).map(([id, tileSet]) => [
        id,
        { ...tileSet },
      ]),
    )
    tileMap.tiles = rawObject.tiles.map((rawTileLayer) => {
      const tileLayer = new TileLayer()
      if (rawTileLayer) {
        tileLayer.tiles = rawTileLayer.tiles
      }
      return tileLayer
    })
    return tileMap
  }

  setMultiLayerTile(
    { row, column }: CellPosition,
    multiLayerTile: MultiLayerTile,
  ): boolean {
    let hasSomethingChanged = false
    for (let level = 0; level < multiLayerTile.length; level++) {
      const tile = multiLayerTile[level]
      const tileLayer = this.tiles[level]
      let hasChanged
      if (tile) {
        hasChanged = tileLayer.setTile({ row, column }, tile)
      } else {
        hasChanged = Boolean(tileLayer.retrieveTile({ row, column }))
        tileLayer.removeTile({ row, column })
      }
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
