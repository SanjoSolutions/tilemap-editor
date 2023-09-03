import { areCellAreasDifferent } from "./areCellAreasDifferent.js"
describe("areCellAreasDifferent", () => {
  it("returns true when the cell areas are different", () => {
    expect(
      areCellAreasDifferent(
        { row: 0n, column: 0n, width: 1n, height: 1n },
        { row: 1n, column: 0n, width: 1n, height: 1n },
      ),
    ).toBe(true)
  })

  it("returns false when the cell areas are the same", () => {
    expect(
      areCellAreasDifferent(
        { row: 0n, column: 0n, width: 1n, height: 1n },
        { row: 0n, column: 0n, width: 1n, height: 1n },
      ),
    ).toBe(false)
  })
})
