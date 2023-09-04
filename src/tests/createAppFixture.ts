import { App } from "../App.js"
import { createTileMapFixture } from "./createTileMapFixture.js"
export function createAppFixture(): App {
  const app = new App()
  const tileMap = createTileMapFixture()
  app.tileMap.next(tileMap)
  return app
}
