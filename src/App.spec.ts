import { App } from "./App.js"
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
})
