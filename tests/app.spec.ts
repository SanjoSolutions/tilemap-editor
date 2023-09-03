import { expect, test, type Locator, type Page } from "@playwright/test"
import type { CellPosition } from "../src/CellPosition.js"
import type { Position } from "../src/Position.js"

test.describe("pen tool", () => {
  test("can draw a single selected tile", async ({ page }) => {
    await goToApp(page)
    await selectFirstTile(page)
    await page.locator(".pen-tool-button").click()
    const tileMap = retrieveTileMap(page)
    await tileMap.click({ position: { x: 0.5 * 32, y: 0.5 * 32 } })
    await expect(tileMap).toHaveScreenshot()
  })
})

test.describe("area tool", () => {
  test("can draw area", async ({ page }) => {
    await goToApp(page)
    await selectFirstTile(page)
    drawArea(
      page,
      {
        row: 0n,
        column: 0n,
      },
      {
        row: 1n,
        column: 1n,
      },
    )
    const tileMap = retrieveTileMap(page)
    await expect(tileMap).toHaveScreenshot()
  })
})

test.describe("fill tool", () => {
  test("can fill", async ({ page }) => {
    await goToApp(page)
    await page.getByRole("button", { name: "format_color_fill" }).click()
    await selectFirstTile(page)
    const tileMap = retrieveTileMap(page)
    await tileMap.click({
      position: convertCellPositionToAbsolutePosition({ row: 0n, column: 0n }),
    })
    await expect(tileMap).toHaveScreenshot()
  })
})

test.describe("cut and paste", () => {
  test("can cut and paste", async ({ page }) => {
    await goToApp(page)
    await selectFirstTile(page)
    await drawArea(
      page,
      {
        row: 0n,
        column: 0n,
      },
      {
        row: 1n,
        column: 1n,
      },
    )
    await selectArea(
      page,
      {
        row: 0n,
        column: 0n,
      },
      {
        row: 1n,
        column: 1n,
      },
    )
    await page.locator("body").press("Control+x")
    await page.locator("body").press("Control+v")
    await clickOnTile(page, { row: 0n, column: 2n })
    const tileMap = retrieveTileMap(page)
    await expect(tileMap).toHaveScreenshot()
  })
})

async function goToApp(page: Page): Promise<void> {
  await page.goto("http://localhost:8000")
}

async function selectFirstTile(page: Page): Promise<void> {
  await page.locator(".tile-set").click({
    position: convertCellPositionToAbsolutePosition({ row: 0n, column: 0n }),
  })
}

async function drawArea(
  page: Page,
  from: CellPosition,
  to: CellPosition,
): Promise<void> {
  await page.getByRole("button", { name: "rectangle" }).click()
  await dragOverArea(page, from, to)
}

async function selectArea(
  page: Page,
  from: CellPosition,
  to: CellPosition,
): Promise<void> {
  await page.getByRole("button", { name: "select" }).click()
  await dragOverArea(page, from, to)
}

async function dragOverArea(
  page: Page,
  from: CellPosition,
  to: CellPosition,
): Promise<void> {
  const tileMap = page.locator(".tile-map")
  await tileMap.hover({
    position: convertCellPositionToAbsolutePosition(from),
  })
  await page.mouse.down()
  await tileMap.hover({
    position: convertCellPositionToAbsolutePosition(to),
  })
  await page.mouse.up()
}

function retrieveTileMap(page: Page): Locator {
  return page.locator(".tile-map")
}

async function clickOnTile(page: Page, position: CellPosition): Promise<void> {
  const tileMap = retrieveTileMap(page)
  await tileMap.click({
    position: convertCellPositionToAbsolutePosition(position),
  })
}

function convertCellPositionToAbsolutePosition(
  position: CellPosition,
): Position {
  return {
    x: Number(position.column * 32n + BigInt(0.5 * 32)),
    y: Number(position.row * 32n + BigInt(0.5 * 32)),
  }
}
