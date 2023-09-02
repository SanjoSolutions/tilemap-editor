import { areDifferent } from "./areDifferent.js"
import type { CellPosition } from "./CellPosition.js"
import type { Size } from "./Size.js"
import { Tile } from "./Tile.js"

export class TileLayer {
  size: Size
  tiles: (Tile | null)[]

  constructor(size: Size) {
    this.size = size
    this.tiles = new Array(size.width * size.height)
  }

  setTile({ row, column }: CellPosition, tile: Tile): boolean {
    const index = this.calculateIndex({ row, column })
    const previousTile = this.tiles[index]
    if (!previousTile || areDifferent(previousTile, tile)) {
      this.tiles[index] = tile
      return true
    } else {
      return false
    }
  }

  removeTile({ row, column }: CellPosition): void {
    const index = this.calculateIndex({ row, column })
    this.tiles[index] = null
  }

  retrieveTile({ row, column }: CellPosition): Tile | null {
    const index = this.calculateIndex({ row, column })
    return this.tiles[index]
  }

  private calculateIndex({ row, column }: CellPosition): number {
    return row * this.size.width + column
  }

  copy(): TileLayer {
    const copy = new TileLayer({ ...this.size })
    copy.tiles = [...this.tiles]
    return copy
  }
}
