import { areTilesDifferent } from "./areTilesDifferent.js"
describe("areTilesDifferent", () => {
  describe("returns true when the tiles are different", () => {
    it("returns true when the x coordinate is different", () => {
      const tile1 = { x: 0, y: 0, tileSet: 0 }
      const tile2 = { x: 1, y: 0, tileSet: 0 }
      expect(areTilesDifferent(tile1, tile2)).toBe(true)
    })

    it("returns true when the y coordinate is different", () => {
      const tile1 = { x: 0, y: 0, tileSet: 0 }
      const tile2 = { x: 0, y: 1, tileSet: 0 }
      expect(areTilesDifferent(tile1, tile2)).toBe(true)
    })

    it("returns true when tileSet is different", () => {
      const tile1 = { x: 0, y: 0, tileSet: 0 }
      const tile2 = { x: 0, y: 0, tileSet: 1 }
      expect(areTilesDifferent(tile1, tile2)).toBe(true)
    })
  })

  it("returns false when tiles are the same", () => {
    const tile1 = { x: 0, y: 0, tileSet: 0 }
    const tile2 = { x: 0, y: 0, tileSet: 0 }
    expect(areTilesDifferent(tile1, tile2)).toBe(false)
  })
})
