import { BehaviorSubject } from "rxjs"
import type { Area } from "./Area.js"
import type { Level } from "./Level.js"
import type { TileMap } from "./TileMap.js"
import { createTileMapNullObject } from "./TileMap.js"
import type { Tool } from "./Tool.js"

export class App {
  activeTool = new BehaviorSubject<Tool | null>(null)
  _level = new BehaviorSubject<Level>(0)
  selectedTileSetTiles = new BehaviorSubject<Area | null>(null)
  tileMap = new BehaviorSubject<TileMap>(createTileMapNullObject())
  isDragModeEnabled = new BehaviorSubject<boolean>(false)

  set level(level: Level) {
    if (level >= 0) {
      this._level.next(level)
    } else {
      throw new Error("Only levels greater than or equal to 0 are supported.")
    }
  }

  get level(): BehaviorSubject<Level> {
    return this._level
  }

  get currentLevelTileLayer() {
    return this.tileMap.value.tiles[this._level.value]
  }

  incrementLevel() {
    this._level.next(this._level.value + 1)
  }

  decrementLevel() {
    if (this._level.value > 0) {
      this._level.next(this._level.value - 1)
    }
  }

  selectPenTool() {}
  selectTileSetTile() {}
  useToolAt() {}
}
