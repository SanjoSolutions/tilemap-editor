import { App } from "./App.js"
import { expectTileAt } from "./testing/expectTileAt.js"
import { createAppFixture } from "./tests/createAppFixture.js"

describe("App", () => {
  describe("incrementLevel", () => {
    it("increments the level", () => {
      const app = new App()
      app.incrementLevel()
      expect(app.level.value).toEqual(1)
    })
  })

  describe("decrementLevel", () => {
    it("decrements the level when at or above 1", () => {
      const app = new App()
      app.incrementLevel()
      app.decrementLevel()
      expect(app.level.value).toEqual(0)
    })

    describe("when the level is 0 and decrementLevel is called", () => {
      test("level stays at 0", () => {
        const app = new App()
        app.decrementLevel()
        expect(app.level.value).toEqual(0)
      })
    })
  })

  describe("pen tool", function () {
    test("can draw a single selected tile", function () {
      const app = createAppFixture()
      app.selectPenTool()
      app.selectTileSetTile(0, 0)
      app.useToolAt(0n, 0n)
      expectTileAt(app, { row: 0n, column: 0n }, { x: 0, y: 0, tileSet: 0 })
    })
  })

  describe("currentLevelTileLayer", () => {
    it("returns a tile layer after the level has been incremented", () => {
      const app = new App()
      app.incrementLevel()
      expect(app.currentLevelTileLayer).toBeDefined()
    })

    it("returns a tile layer after the level has been set to a higher level", () => {
      const app = new App()
      app.level = 1
      expect(app.currentLevelTileLayer).toBeDefined()
    })
  })

  describe("zoomOut", () => {
    it("zooms out from 1 to 0.9", () => {
      const app = new App()
      app.scale.next(1)
      app.zoomOut()
      expect(app.scale.value).toEqual(0.9)
    })

    it("zooms out from 0.9 to 0.8", () => {
      const app = new App()
      app.scale.next(0.9)
      app.zoomOut()
      expect(app.scale.value).toEqual(0.8)
    })

    it("zooms out from 0.8 to 0.75", () => {
      const app = new App()
      app.scale.next(0.8)
      app.zoomOut()
      expect(app.scale.value).toEqual(0.75)
    })

    it("zooms out from 0.75 to 0.67", () => {
      const app = new App()
      app.scale.next(0.75)
      app.zoomOut()
      expect(app.scale.value).toEqual(0.67)
    })

    it("zooms out from 0.67 to 0.50", () => {
      const app = new App()
      app.scale.next(0.67)
      app.zoomOut()
      expect(app.scale.value).toEqual(0.5)
    })
  })
})
