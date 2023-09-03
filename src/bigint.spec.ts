import { abs, halfOfCeiled, max, min } from "./bigint.js"
describe("min", () => {
  it("returns the smaller of two values", () => {
    expect(min(1n, 2n)).toBe(1n)
    expect(min(2n, 1n)).toBe(1n)
  })
})

describe("max", () => {
  it("returns the larger of two values", () => {
    expect(max(1n, 2n)).toBe(2n)
    expect(max(2n, 1n)).toBe(2n)
  })
})

describe("abs", () => {
  it("returns the absolute value of a number", () => {
    expect(abs(1n)).toBe(1n)
    expect(abs(-1n)).toBe(1n)
  })
})

describe("halfOfCeiled", () => {
  it("halves the value and ceiles it", () => {
    expect(halfOfCeiled(1n)).toBe(1n)
    expect(halfOfCeiled(2n)).toBe(1n)
    expect(halfOfCeiled(3n)).toBe(2n)
    expect(halfOfCeiled(4n)).toBe(2n)
  })
})
