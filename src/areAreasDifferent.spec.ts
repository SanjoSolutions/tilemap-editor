import { areAreasDifferent } from "./areAreasDifferent.js"

describe("areAreasDifferent", () => {
  it("returns true when the areas are different", () => {
    const area1 = {
      x: 0,
      y: 0,
      width: 1,
      height: 1,
    }
    const area2 = {
      x: 1,
      y: 0,
      width: 1,
      height: 1,
    }
    expect(areAreasDifferent(area1, area2)).toBe(true)
  })

  it("returns false when the areas are the same", () => {
    const area1 = {
      x: 0,
      y: 0,
      width: 1,
      height: 1,
    }
    const area2 = {
      x: 0,
      y: 0,
      width: 1,
      height: 1,
    }
    expect(areAreasDifferent(area1, area2)).toBe(false)
  })
})
