import { createTileFixture } from "./testing/createTileFixture.js"
import { TileLayer } from "./TileLayer.js"
describe("TileLayer", () => {
  describe("setTile", () => {
    it("sets a tile", () => {
      const tileLayer = new TileLayer()
      const tile = createTileFixture()
      tileLayer.setTile({ row: 0n, column: 0n }, tile)
      expect(tileLayer.retrieveTile({ row: 0n, column: 0n })).toBe(tile)
    })
  })

  describe("removeTile", () => {
    it("removes a tile", () => {
      const tileLayer = new TileLayer()
      const tile = createTileFixture()
      tileLayer.setTile({ row: 0n, column: 0n }, tile)
      tileLayer.removeTile({ row: 0n, column: 0n })
      expect(tileLayer.retrieveTile({ row: 0n, column: 0n })).toBe(null)
    })
  })

  describe("retrieveTile", () => {
    it("retrieves a tile", () => {
      const tileLayer = new TileLayer()
      const tile = createTileFixture()
      tileLayer.setTile({ row: 0n, column: 0n }, tile)
      expect(tileLayer.retrieveTile({ row: 0n, column: 0n })).toBe(tile)
    })
  })

  describe("retrieveArea", () => {
    it("retrieves an area", () => {
      const tileLayer = new TileLayer()
      const tile = createTileFixture()
      tileLayer.setTile({ row: 0n, column: 0n }, tile)
      const areaTileLayer = tileLayer.retrieveArea({
        from: { row: 0n, column: 0n },
        to: { row: 0n, column: 0n },
      })
      expect(areaTileLayer.retrieveTile({ row: 0n, column: 0n })).toBe(tile)
    })
  })

  describe("copy", () => {
    it("copies a tile layer", () => {
      const tileLayer = new TileLayer()
      const tile = createTileFixture()
      tileLayer.setTile({ row: 0n, column: 0n }, tile)
      const copy = tileLayer.copy()
      expect(copy.retrieveTile({ row: 0n, column: 0n })).toBe(tile)
    })
  })

  describe("entries", () => {
    it("is a generator function which returns entry by entry", () => {
      const tileLayer = new TileLayer()
      const tile1 = createTileFixture()
      const tile2 = createTileFixture()
      tileLayer.setTile({ row: 0n, column: 0n }, tile1)
      tileLayer.setTile({ row: 1n, column: 1n }, tile2)
      const entries = [...tileLayer.entries()]
      expect(entries).toEqual([
        [{ row: 0n, column: 0n }, tile1],
        [{ row: 1n, column: 1n }, tile2],
      ])
    })
  })
})
