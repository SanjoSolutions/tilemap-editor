import type { CellPosition } from "./CellPosition.js"
import type { MultiLayerTile } from "./MultiLayerTile.js"
import { Size } from "./Size.js"
import { TileLayer } from "./TileLayer.js"
import { TileSet } from "./TileSet.js"
import { TileSetID } from "./TileSetID.js"

const DEFAULT_WIDTH = 0
const DEFAULT_HEIGHT = 0

export class TileMap {
  size: Size = {
    width: DEFAULT_WIDTH,
    height: DEFAULT_HEIGHT,
  }
  tileSize: Size = {
    width: 0,
    height: 0,
  }
  tileSets: Record<TileSetID, TileSet> = {}
  // TODO: Make tiles reactive
  tiles: TileLayer[] = [
    new TileLayer({ width: DEFAULT_WIDTH, height: DEFAULT_HEIGHT }),
  ]

  resize({ width, height }: Size) {
    const oldNumberOfRows = Math.ceil(this.size.height / this.tileSize.height)
    const oldNumberOfColumns = Math.ceil(this.size.width / this.tileSize.width)
    const numberOfRows = Math.ceil(height / this.tileSize.height)
    const numberOfColumns = Math.ceil(width / this.tileSize.width)

    this.tiles = this.tiles.map(function (oldTiles) {
      const updatedTiles = new TileLayer({
        width: numberOfColumns,
        height: numberOfRows,
      })
      for (let row = 0; row < Math.min(oldNumberOfRows, numberOfRows); row++) {
        for (
          let column = 0;
          column < Math.min(oldNumberOfColumns, numberOfColumns);
          column++
        ) {
          updatedTiles.setTile(
            { row, column },
            oldTiles.retrieveTile({ row, column }),
          )
        }
      }
      return updatedTiles
    })
    this.size.width = width
    this.size.height = height
  }

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
    copy.size = { ...this.size }
    copy.tileSize = { ...this.tileSize }
    copy.tileSets = { ...this.tileSets }
    copy.tiles = this.tiles.map((tileLayer) => tileLayer.copy())
    return copy
  }
}

export function createTileMapNullObject() {
  return new TileMap()
}
