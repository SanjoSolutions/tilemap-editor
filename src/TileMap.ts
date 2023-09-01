import { Size } from "./Size.js"
import { TileLayer } from "./TileLayer.js"
import { TileSet } from "./TileSet.js"
import { TileSetID } from "./TileSetID.js"
export interface TileMap {
  size: Size
  tileSize: Size
  tileSets: Record<TileSetID, TileSet>
  tiles: TileLayer[]
}
