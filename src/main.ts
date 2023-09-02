import * as bootstrap from "bootstrap"
import { App } from "./App.js"
import type { Area } from "./Area.js"
import type { CellArea } from "./CellArea.js"
import type { CellPosition } from "./CellPosition.js"
import type { MultiLayerTile } from "./MultiLayerTile.js"
import type { Position } from "./Position.js"
import type { Tile } from "./Tile.js"
import { TileLayer } from "./TileLayer.js"
import { TileMap } from "./TileMap.js"
import { areDifferent } from "./areDifferent.js"

if (window.IS_DEVELOPMENT) {
  new EventSource("/esbuild").addEventListener("change", () =>
    location.reload(),
  )
}

const app = new App()
let tileSets: Record<number, HTMLImageElement> = {}
const $level = document.querySelector(".level") as HTMLInputElement

{
  const levelSerialized = localStorage.getItem("level")
  if (levelSerialized) {
    const level = parseInt(levelSerialized, 10)
    if (level) {
      app.level.next(level)
    }
  }
}

app.level.subscribe(function (level) {
  $level.value = String(level)
  localStorage.setItem("level", String(level))
  renderTileMap()
})

const isGridShownSerialized = localStorage.getItem("isGridShown")
let isModalOpen: boolean = false
const menuIconBar = document.querySelector(
  ".menu-icon-bar-main",
) as HTMLDivElement
const penToolButton = menuIconBar.querySelector(
  ".pen-tool-button",
) as HTMLButtonElement
const areaToolButton = menuIconBar.querySelector(
  ".area-tool-button",
) as HTMLButtonElement
const fillToolButton = menuIconBar.querySelector(
  ".fill-tool-button",
) as HTMLButtonElement
const selectionToolButton = menuIconBar.querySelector(
  ".selection-tool-button",
) as HTMLButtonElement
const $selectedArea = document.querySelector(".selected-area") as HTMLDivElement
changeTool("pen")
let renderOnlyCurrentLevel: boolean = false

let isGridShown: boolean = isGridShownSerialized
  ? JSON.parse(isGridShownSerialized)
  : true

$level.addEventListener("change", function (event) {
  app.level.next(Number((event.target as HTMLInputElement).value))
})

const $sidebar = document.querySelector(".sidebar") as HTMLDivElement

{
  const sideBarWidth = localStorage.getItem("sidebarWidth")
  if (sideBarWidth) {
    $sidebar.style.flexBasis = sideBarWidth
  }
}

{
  let offset: number | null = null
  const $sliderDragArea = document.querySelector(
    ".slider__drag-area",
  ) as HTMLDivElement
  let isSliding = false
  $sliderDragArea.addEventListener("pointerdown", function (event) {
    event.preventDefault()
    isSliding = true
    offset = event.offsetX - (17 - 1) / 2
  })
  window.addEventListener("pointermove", function (event) {
    if (isSliding) {
      event.preventDefault()
      $sidebar.style.flexBasis = event.clientX - offset! + "px"
    }
  })
  window.addEventListener("pointerup", function () {
    isSliding = false
    offset = null
    localStorage.setItem("sidebarWidth", $sidebar.style.flexBasis)
  })
}

const $tileHover = document.querySelector(".tile-hover") as HTMLDivElement
const $tileSet = document.querySelector(".tile-set") as HTMLImageElement
$tileSet.addEventListener("pointermove", function (event) {
  $tileHover.style.display = "block"
  $tileHover.style.left =
    adjustToStep(event.offsetX, app.tileMap.value.tileSize.width) + "px"
  $tileHover.style.top =
    adjustToStep(event.offsetY, app.tileMap.value.tileSize.height) + "px"
})

const $tileSelected = document.querySelector(".tile-selected") as HTMLDivElement

let isPointerDownInTileSet = false

$tileSet.addEventListener("pointerdown", function (event) {
  event.preventDefault()
  isPointerDownInTileSet = true
  selectTile(event)
})

$tileSet.addEventListener("pointermove", function (event) {
  if (isPointerDownInTileSet) {
    expandSelectTiles(event)
  }
})

$tileSet.addEventListener("mouseleave", function () {
  $tileHover.style.display = "none"
})

let firstPoint: Point | null = null

function selectTile(event) {
  selectTileSetTile(event.offsetX, event.offsetY)
}

export function selectTileSetTile(x: number, y: number): void {
  x = adjustToStep(x, app.tileMap.value.tileSize.width)
  y = adjustToStep(y, app.tileMap.value.tileSize.height)
  firstPoint = {
    x,
    y,
  }
  app.selectedTileSetTiles.next({
    x,
    y,
    width: app.tileMap.value.tileSize.width,
    height: app.tileMap.value.tileSize.height,
  })
  $tileSelected.style.display = "block"
  $tileSelected.style.left = app.selectedTileSetTiles.value.x + "px"
  $tileSelected.style.top = app.selectedTileSetTiles.value.y + "px"
  $tileSelected.style.width = app.selectedTileSetTiles.value.width + "px"
  $tileSelected.style.height = app.selectedTileSetTiles.value.height + "px"
}

function expandSelectTiles(event) {
  if (firstPoint) {
    const x = adjustToStep(event.offsetX, app.tileMap.value.tileSize.width)
    const y = adjustToStep(event.offsetY, app.tileMap.value.tileSize.height)
    app.selectedTileSetTiles.next({
      x: Math.min(firstPoint.x, x),
      y: Math.min(firstPoint.y, y),
      width: Math.abs(x - firstPoint.x) + app.tileMap.value.tileSize.width,
      height: Math.abs(y - firstPoint.y) + app.tileMap.value.tileSize.height,
    })
    $tileSelected.style.left = app.selectedTileSetTiles.value.x + "px"
    $tileSelected.style.top = app.selectedTileSetTiles.value.y + "px"
    $tileSelected.style.width = app.selectedTileSetTiles.value.width + "px"
    $tileSelected.style.height = app.selectedTileSetTiles.value.height + "px"
  } else {
    throw new Error("firstPoint is null.")
  }
}

window.addEventListener("pointerup", function () {
  isPointerDownInTileSet = false
})

function adjustToStep(value, step) {
  return Math.floor(value / step) * step
}

const $canvas = document.querySelector(".tile-map") as HTMLCanvasElement
const context = $canvas.getContext("2d")

let previewTiles = null

const DEFAULT_TILE_WIDTH = 32
const DEFAULT_TILE_HEIGHT = 32
const DEFAULT_MAP_WIDTH = 16
const DEFAULT_MAP_HEIGHT = 16
const tileMapSerialized = localStorage.getItem("tileMap")
app.tileMap.next(
  tileMapSerialized
    ? migrateTileMap(parseJSONTileMap(tileMapSerialized))
    : await createTileMap({
        width: DEFAULT_MAP_WIDTH,
        height: DEFAULT_MAP_HEIGHT,
      }),
)

for (const [id, tileSet] of Object.entries(app.tileMap.value.tileSets)) {
  createImageFromDataURL(tileSet.content).then((image) => {
    tileSets[Number(id)] = image as HTMLImageElement
    renderTileMap()
  })
}

const $tileSetSelect = document.getElementById(
  "tileSetSelect",
) as HTMLSelectElement

function addOptionToTileSetSelect(id, tileSet) {
  const option = document.createElement("option")
  option.value = id
  option.textContent = tileSet.name
  $tileSetSelect.appendChild(option)
}

$tileSetSelect.innerHTML = ""
for (const [id, tileSet] of Object.entries(app.tileMap.value.tileSets)) {
  addOptionToTileSetSelect(id, tileSet)
}

{
  const selectedTileSetSerialized = localStorage.getItem("selectedTileSet")
  const selectedTileSetID = selectedTileSetSerialized
    ? parseInt(selectedTileSetSerialized, 10)
    : 0
  selectTileSet(selectedTileSetID)
}

function migrateTileMap(tileMap: TileMap): TileMap {
  if (!tileMap.tileSets) {
    tileMap.tileSets = {}
    tileMap.tileSets[0] = {
      name: "tileset.png",
      content: localStorage.getItem("tileSetUrl") || "",
    }
  }

  if (!tileMap.tiles[0].tiles[0]?.hasOwnProperty("tileSet")) {
    for (const levelTileMap of tileMap.tiles) {
      for (const tile of levelTileMap.tiles) {
        if (tile) {
          tile.tileSet = 0
        }
      }
    }
  }

  return tileMap
}

$canvas.width = app.tileMap.value.size.width
$canvas.height = app.tileMap.value.size.height

$tileHover.style.width = app.tileMap.value.tileSize.width + "px"
$tileHover.style.height = app.tileMap.value.tileSize.height + "px"

$tileSelected.style.width = app.tileMap.value.tileSize.width + "px"
$tileSelected.style.height = app.tileMap.value.tileSize.height + "px"

renderGrid()

if (tileMapSerialized) {
  if ($tileSet.complete) {
    renderTileMap()
  } else {
    $tileSet.addEventListener("load", function () {
      renderTileMap()
    })
  }
}

function retrieveTile(position: Position): MultiLayerTile {
  const row =
    adjustToStep(position.y, app.tileMap.value.tileSize.height) /
    app.tileMap.value.tileSize.height
  const column =
    adjustToStep(position.x, app.tileMap.value.tileSize.width) /
    app.tileMap.value.tileSize.width
  return retrieveTile2({ row, column })
}

function retrieveTile2(position: CellPosition): MultiLayerTile {
  return app.tileMap.value.tiles.map((tileLayer) =>
    tileLayer ? tileLayer.retrieveTile(position) : null,
  )
}

let firstPointTileMap: Point | null = null
let selectedTilesInTileMap: Area | null = null
let isPointerDownInTileMap: boolean = false

$canvas.addEventListener("pointerdown", function (event) {
  event.preventDefault()
  doPointerDownOnTileMap(convertEventToPosition(event))
})

function convertEventToPosition(event: PointerEvent): Position {
  return {
    x: event.offsetX,
    y: event.offsetY,
  }
}

export function useToolAt(x, y): void {
  if (app.activeTool.value === "pen") {
  }
}

function doPointerDownOnTileMap(point: Point): void {
  isPointerDownInTileMap = true

  if (!isInPasteMode) {
    if (app.activeTool.value === "fill") {
      fill(point)
    } else {
      selectTileInTileMap(point)

      if (app.selectedTileSetTiles.value) {
        if (app.activeTool.value === "pen") {
          setTiles(point)
        }
      }
    }
  }
}

function previewFill(point: Point): void {
  doAFillMethod(point, function (tile, selectedTile) {
    const replacements: MultiLayerTile = []
    replacements[app.level.value] = selectedTile
    renderTile(
      {
        x: tile.column * app.tileMap.value.tileSize.width,
        y: tile.row * app.tileMap.value.tileSize.height,
      },
      replacements,
    )
  })
}

function fill(point: Point): void {
  backUpMap()
  doAFillMethod(point, function (tile, selectedTile) {
    setTileOnCurrentLevel(tile, selectedTile)
  })
  renderTileMap()
  saveTileMap()
}

const backups: TileMap[] = []

function backUpMap() {
  backups.push(app.tileMap.value.copy())
}

function doAFillMethod(position: Position, fn) {
  const origin = {
    row:
      adjustToStep(position.y, app.tileMap.value.tileSize.height) /
      app.tileMap.value.tileSize.height,
    column:
      adjustToStep(position.x, app.tileMap.value.tileSize.width) /
      app.tileMap.value.tileSize.width,
  }

  const originTileBeforeFill = retrieveTile2(origin)[app.level.value]

  const selectedTile = {
    x: app.selectedTileSetTiles.value.x,
    y: app.selectedTileSetTiles.value.y,
    tileSet: retrieveSelectedTileSetID(),
  }

  const visitedTiles = new Set()

  function setAsVisited(tile) {
    const index = calculateIndex(tile)
    visitedTiles.add(index)
  }

  function hasNotBeenVisited(tile) {
    const index = calculateIndex(tile)
    return !visitedTiles.has(index)
  }

  let nextTiles = [origin]

  do {
    const tiles = nextTiles
    nextTiles = []
    for (const tile of tiles) {
      if (hasNotBeenVisited(tile)) {
        fn(tile, selectedTile)
        setAsVisited(tile)
        const neighbors = retrieveNeighborsWithSetTile(
          tile,
          originTileBeforeFill,
        ).filter(hasNotBeenVisited)
        nextTiles.push(...neighbors)
      }
    }
  } while (nextTiles.length >= 1)
}

function retrieveNeighborsWithSetTile(tile, setTile) {
  return retrieveNeighbors(tile).filter((tile) => isTileSetTo(tile, setTile))
}

function retrieveNeighbors(tile) {
  const neighbors: CellPosition[] = []
  if (tile.row >= 1) {
    neighbors.push({
      row: tile.row - 1,
      column: tile.column,
    })
  }
  const numberOfColumns =
    app.tileMap.value.size.width / app.tileMap.value.tileSize.width
  if (tile.column < numberOfColumns - 1) {
    neighbors.push({
      row: tile.row,
      column: tile.column + 1,
    })
  }
  const numberOfRows =
    app.tileMap.value.size.height / app.tileMap.value.tileSize.height
  if (tile.row < numberOfRows - 1) {
    neighbors.push({
      row: tile.row + 1,
      column: tile.column,
    })
  }
  if (tile.column >= 1) {
    neighbors.push({
      row: tile.row,
      column: tile.column - 1,
    })
  }
  return neighbors
}

function isTileSetTo(tile, setTile) {
  const a = retrieveTile2(tile)
  const b = a ? a[app.level.value] ?? null : null
  return (
    (!b && !setTile) || (b && setTile && b.x === setTile.x && b.y === setTile.y)
  )
}

function selectTileInTileMap({ x, y }: Position): void {
  x = adjustToStep(x, app.tileMap.value.tileSize.width)
  y = adjustToStep(y, app.tileMap.value.tileSize.height)
  firstPointTileMap = {
    x,
    y,
  }

  selectedTilesInTileMap = {
    x,
    y,
    width: app.tileMap.value.tileSize.width,
    height: app.tileMap.value.tileSize.height,
  }

  if (app.activeTool.value === "selection") {
    updateSelectedArea()
  }
}

function updateSelectedArea() {
  $selectedArea.style.display = "block"
  $selectedArea.style.left = selectedTilesInTileMap.x + "px"
  $selectedArea.style.top = selectedTilesInTileMap.y + "px"
  $selectedArea.style.width = selectedTilesInTileMap.width + "px"
  $selectedArea.style.height = selectedTilesInTileMap.height + "px"
}

function preview9SliceMade() {
  renderTileMap()

  do9SliceMethodWithSelectedTiles(function ({ row, column }, tile) {
    context.drawImage(
      $tileSet,
      tile.x,
      tile.y,
      app.tileMap.value.tileSize.width,
      app.tileMap.value.tileSize.height,
      selectedTilesInTileMap.x + column * app.tileMap.value.tileSize.width,
      selectedTilesInTileMap.y + row * app.tileMap.value.tileSize.height,
      app.tileMap.value.tileSize.width,
      app.tileMap.value.tileSize.height,
    )
  })
}

function previewArea() {
  renderTileMap()

  const numberOfRows =
    app.selectedTileSetTiles.value.height / app.tileMap.value.tileSize.height
  const numberOfColumns =
    app.selectedTileSetTiles.value.width / app.tileMap.value.tileSize.width
  doSomethingWithSelectedTilesInTileMap(function ({ row, column }) {
    context.drawImage(
      $tileSet,
      app.selectedTileSetTiles.value.x +
        (column % numberOfColumns) * app.tileMap.value.tileSize.width,
      app.selectedTileSetTiles.value.y +
        (row % numberOfRows) * app.tileMap.value.tileSize.height,
      app.tileMap.value.tileSize.width,
      app.tileMap.value.tileSize.height,
      selectedTilesInTileMap.x + column * app.tileMap.value.tileSize.width,
      selectedTilesInTileMap.y + row * app.tileMap.value.tileSize.height,
      app.tileMap.value.tileSize.width,
      app.tileMap.value.tileSize.height,
    )
  })
}

let lastPointerPosition: Point | null = null

$canvas.addEventListener("pointermove", function (event) {
  lastPointerPosition = convertEventToPosition(event)

  if (isPointerDownInTileMap) {
    if (app.activeTool.value === "area") {
      if (app.selectedTileSetTiles.value) {
        expandSelectTilesInTileMap(event)
        if (seemsThat9SliceIsSelected()) {
          preview9SliceMade()
          renderGrid()
        } else {
          previewArea()
          renderGrid()
        }
      }
    } else if (app.activeTool.value === "pen") {
      if (app.selectedTileSetTiles.value) {
        setTiles(lastPointerPosition)
        renderGrid()
      }
    } else if (app.activeTool.value === "selection") {
      expandSelectTilesInTileMap(event)
      updateSelectedArea()
    }
  } else if (isInPasteMode) {
    renderTileMap()
    previewPaste()
  } else if (app.selectedTileSetTiles.value) {
    if (app.activeTool.value === "pen") {
      const previousPreviewTiles = previewTiles
      previewTiles = {
        x: adjustToStep(event.offsetX, app.tileMap.value.tileSize.width),
        y: adjustToStep(event.offsetY, app.tileMap.value.tileSize.height),
        width: app.selectedTileSetTiles.value.width,
        height: app.selectedTileSetTiles.value.height,
      }
      if (
        !previousPreviewTiles ||
        areDifferent(previousPreviewTiles, previewTiles)
      ) {
        if (previousPreviewTiles) {
          renderTiles(previousPreviewTiles)
        }
        renderPreviewTiles()
        renderGrid()
      }
    } else if (app.activeTool.value === "area") {
      const previousPreviewTiles = previewTiles
      previewTiles = {
        x: adjustToStep(event.offsetX, app.tileMap.value.tileSize.width),
        y: adjustToStep(event.offsetY, app.tileMap.value.tileSize.height),
        width: app.tileMap.value.tileSize.width,
        height: app.tileMap.value.tileSize.height,
      }
      if (
        !previousPreviewTiles ||
        areDifferent(previousPreviewTiles, previewTiles)
      ) {
        if (previousPreviewTiles) {
          renderTiles(previousPreviewTiles)
        }
        renderPreviewTiles()
        renderGrid()
      }
    } else if (app.activeTool.value === "fill") {
      renderTileMap()
      previewFill(convertEventToPosition(event))
      renderGrid()
    }
  }
})

function expandSelectTilesInTileMap(event) {
  const x = adjustToStep(event.offsetX, app.tileMap.value.tileSize.width)
  const y = adjustToStep(event.offsetY, app.tileMap.value.tileSize.height)
  selectedTilesInTileMap = {
    x: Math.min(firstPointTileMap.x, x),
    y: Math.min(firstPointTileMap.y, y),
    width: Math.abs(x - firstPointTileMap.x) + app.tileMap.value.tileSize.width,
    height:
      Math.abs(y - firstPointTileMap.y) + app.tileMap.value.tileSize.height,
  }
}

function seemsThat9SliceIsSelected() {
  return (
    app.selectedTileSetTiles.value.width ===
      3 * app.tileMap.value.tileSize.height &&
    app.selectedTileSetTiles.value.height ===
      3 * app.tileMap.value.tileSize.height
  )
}

$canvas.addEventListener("mouseleave", function () {
  previewTiles = null
  renderTileMap()
})

window.addEventListener("pointerup", function () {
  const wasPointerDownInTileMap = isPointerDownInTileMap

  isPointerDownInTileMap = false

  if (wasPointerDownInTileMap) {
    if (app.activeTool.value === "area") {
      if (seemsThat9SliceIsSelected()) {
        setTilesWith9SliceMethod()
      } else {
        area()
      }
    }
  }

  firstPointTileMap = null
  if (app.activeTool.value !== "selection") {
    selectedTilesInTileMap = null
  }
})

$canvas.addEventListener("pointerup", function (event) {
  if (isInPasteMode) {
    paste(event)
  }
})

function putSelectedTilesOnMap() {
  setTiles(firstPointTileMap)
}

function area() {
  backUpMap()

  const numberOfRows =
    app.selectedTileSetTiles.value.height / app.tileMap.value.tileSize.height
  const numberOfColumns =
    app.selectedTileSetTiles.value.width / app.tileMap.value.tileSize.width
  const baseRow = selectedTilesInTileMap.y / app.tileMap.value.tileSize.height
  const baseColumn = selectedTilesInTileMap.x / app.tileMap.value.tileSize.width
  doSomethingWithSelectedTilesInTileMap(function ({ row, column }) {
    const selectedTile = {
      x:
        app.selectedTileSetTiles.value.x +
        (column % numberOfColumns) * app.tileMap.value.tileSize.width,
      y:
        app.selectedTileSetTiles.value.y +
        (row % numberOfRows) * app.tileMap.value.tileSize.height,
      tileSet: retrieveSelectedTileSetID(),
    }
    setTileOnCurrentLevel(
      { row: baseRow + row, column: baseColumn + column },
      selectedTile,
    )
  })
  renderTileMap()
  saveTileMap()
}

function setTilesWith9SliceMethod() {
  backUpMap()

  const baseRow =
    adjustToStep(selectedTilesInTileMap.y, app.tileMap.value.tileSize.height) /
    app.tileMap.value.tileSize.height
  const baseColumn =
    adjustToStep(selectedTilesInTileMap.x, app.tileMap.value.tileSize.width) /
    app.tileMap.value.tileSize.width

  do9SliceMethodWithSelectedTiles(function ({ row, column }, tile) {
    setTileOnCurrentLevel(
      {
        row: baseRow + row,
        column: baseColumn + column,
      },
      tile,
    )
  })

  saveTileMap()
}

function doSomethingWithSelectedTilesInTileMap(fn) {
  const numberOfRows = calculateNumberOfRows(selectedTilesInTileMap.height)
  const numberOfColumns = calculateNumberOfColumns(selectedTilesInTileMap.width)

  for (let row = 0; row < numberOfRows; row++) {
    for (let column = 0; column < numberOfColumns; column++) {
      fn({ row, column })
    }
  }
}

function do9SliceMethodWithSelectedTiles(fn) {
  const numberOfRows = calculateNumberOfRows(selectedTilesInTileMap.height)
  const numberOfColumns = calculateNumberOfColumns(selectedTilesInTileMap.width)

  doSomethingWithSelectedTilesInTileMap(function ({ row, column }) {
    let selectedTilesX
    let selectedTilesY

    if (row === 0 && column === 0) {
      selectedTilesX = app.selectedTileSetTiles.value.x
      selectedTilesY = app.selectedTileSetTiles.value.y
    } else if (row === 0 && column === numberOfColumns - 1) {
      ;(selectedTilesX =
        app.selectedTileSetTiles.value.x +
        2 * app.tileMap.value.tileSize.width),
        (selectedTilesY = app.selectedTileSetTiles.value.y)
    } else if (row === numberOfRows - 1 && column === numberOfColumns - 1) {
      selectedTilesX =
        app.selectedTileSetTiles.value.x + 2 * app.tileMap.value.tileSize.width
      selectedTilesY =
        app.selectedTileSetTiles.value.y + 2 * app.tileMap.value.tileSize.height
    } else if (row === numberOfRows - 1 && column === 0) {
      selectedTilesX = app.selectedTileSetTiles.value.x
      selectedTilesY =
        app.selectedTileSetTiles.value.y + 2 * app.tileMap.value.tileSize.height
    } else if (row === 0) {
      selectedTilesX =
        app.selectedTileSetTiles.value.x + 1 * app.tileMap.value.tileSize.width
      selectedTilesY = app.selectedTileSetTiles.value.y
    } else if (row === numberOfRows - 1) {
      selectedTilesX =
        app.selectedTileSetTiles.value.x + 1 * app.tileMap.value.tileSize.width
      selectedTilesY =
        app.selectedTileSetTiles.value.y + 2 * app.tileMap.value.tileSize.height
    } else if (column === 0) {
      selectedTilesX = app.selectedTileSetTiles.value.x
      selectedTilesY =
        app.selectedTileSetTiles.value.y + 1 * app.tileMap.value.tileSize.height
    } else if (column === numberOfColumns - 1) {
      selectedTilesX =
        app.selectedTileSetTiles.value.x + 2 * app.tileMap.value.tileSize.width
      selectedTilesY =
        app.selectedTileSetTiles.value.y + 1 * app.tileMap.value.tileSize.height
    } else {
      selectedTilesX =
        app.selectedTileSetTiles.value.x + 1 * app.tileMap.value.tileSize.width
      selectedTilesY =
        app.selectedTileSetTiles.value.y + 1 * app.tileMap.value.tileSize.height
    }

    fn(
      { row, column },
      {
        x: selectedTilesX,
        y: selectedTilesY,
        tileSet: retrieveSelectedTileSetID(),
      },
    )
  })
}

function calculateNumberOfRows(height) {
  return height / app.tileMap.value.tileSize.height
}

function calculateNumberOfColumns(width) {
  return width / app.tileMap.value.tileSize.width
}

const toggleGridButton = menuIconBar.querySelector(".toggle-grid-button")

function updateToggleGridButton() {
  if (isGridShown) {
    toggleGridButton.classList.add("active")
  } else {
    toggleGridButton.classList.remove("active")
  }
}

updateToggleGridButton()

function toggleGrid() {
  isGridShown = !isGridShown
  updateToggleGridButton()
  localStorage.setItem("isGridShown", isGridShown)
  renderTileMap()
}

toggleGridButton.addEventListener("click", toggleGrid)

function updateToolButtonStates() {
  updatePenToolButton()
  updateAreaToolButton()
  updateFillToolButton()
  updateSelectionToolButton()
}

function updateToolButton(button, tool) {
  if (app.activeTool.value === tool) {
    button.classList.add("active")
  } else {
    button.classList.remove("active")
  }
}

function activatePenTool() {
  changeTool("pen")
}

export const selectPenTool = activatePenTool

penToolButton.addEventListener("click", activatePenTool)

function updatePenToolButton() {
  updateToolButton(penToolButton, "pen")
}

function activateAreaTool() {
  changeTool("area")
}

areaToolButton.addEventListener("click", activateAreaTool)

function updateAreaToolButton() {
  updateToolButton(areaToolButton, "area")
}

function activateFillTool() {
  changeTool("fill")
}

fillToolButton.addEventListener("click", activateFillTool)

function updateFillToolButton() {
  updateToolButton(fillToolButton, "fill")
}

function activateSelectTool() {
  changeTool("selection")
}

function changeTool(tool) {
  if (tool !== app.activeTool.value) {
    app.activeTool.next(tool)
    updateToolButtonStates()
    $selectedArea.style.display = "none"
  }
}

selectionToolButton.addEventListener("click", activateSelectTool)

function updateSelectionToolButton() {
  updateToolButton(selectionToolButton, "selection")
}

updateToolButtonStates()

const renderOnlyCurrentLevelButton = document.querySelector(
  ".render-only-current-level-button",
)

function toggleRenderOnlyCurrentLevel() {
  renderOnlyCurrentLevel = !renderOnlyCurrentLevel
  updateRenderOnlyCurrentLevelButton()
  renderTileMap()
}

renderOnlyCurrentLevelButton.addEventListener(
  "click",
  toggleRenderOnlyCurrentLevel,
)

function updateRenderOnlyCurrentLevelButton() {
  if (renderOnlyCurrentLevel) {
    renderOnlyCurrentLevelButton.classList.add("active")
  } else {
    renderOnlyCurrentLevelButton.classList.remove("active")
  }
}

const saveTileMap = debounce(function () {
  localStorage.setItem("tileMap", JSON.stringify(app.tileMap.value))
})

const $tileMapSettingsModal = document.querySelector("#tilemapSettings")
const tileMapSettingsModal = new bootstrap.Modal($tileMapSettingsModal)

function showEditMapDialog() {
  tileMapSettingsModal.show()
}

$tileMapSettingsModal.addEventListener("show.bs.modal", function () {
  $tileMapSettingsModal.querySelector("#tilemapSettingsWidth").value =
    app.tileMap.value.size.width / app.tileMap.value.tileSize.width
  $tileMapSettingsModal.querySelector("#tilemapSettingsHeight").value =
    app.tileMap.value.size.height / app.tileMap.value.tileSize.height
})

$tileMapSettingsModal.addEventListener("shown.bs.modal", function () {
  const $width = $tileMapSettingsModal.querySelector("#tilemapSettingsWidth")
  $width.focus()
  $width.select()
})

$tileMapSettingsModal
  .querySelector("#tilemapSettingsForm")
  .addEventListener("submit", function (event) {
    event.preventDefault()

    const formData = new FormData(event.target)

    const width = parseInt(formData.get("width"), 10)
    const height = parseInt(formData.get("height"), 10)

    resizeMap({
      width: width * app.tileMap.value.tileSize.width,
      height: height * app.tileMap.value.tileSize.height,
    })

    $canvas.width = app.tileMap.value.size.width
    $canvas.height = app.tileMap.value.size.height

    renderTileMap()

    saveTileMap()

    tileMapSettingsModal.hide()
  })

{
  const $newTileMapModal = document.querySelector("#newTileMap")
  const newTileMapModal = new bootstrap.Modal($newTileMapModal)

  function openCreateNewMapDialog() {
    newTileMapModal.show()
  }

  $newTileMapModal.addEventListener("show.bs.modal", function () {
    $newTileMapModal.querySelector("#newTileMapWidth").value = DEFAULT_MAP_WIDTH
    $newTileMapModal.querySelector("#newTileMapHeight").value =
      DEFAULT_MAP_HEIGHT
  })

  $newTileMapModal.addEventListener("shown.bs.modal", function () {
    const $width = $newTileMapModal.querySelector("#newTileMapWidth")
    $width.focus()
    $width.select()
  })

  $newTileMapModal
    .querySelector("#newTileMapForm")
    .addEventListener("submit", async function (event) {
      event.preventDefault()

      const formData = new FormData(event.target)

      const width = parseInt(formData.get("width"), 10)
      const height = parseInt(formData.get("height"), 10)

      app.tileMap.next(
        await createTileMap({
          width,
          height,
        }),
      )

      $canvas.width = app.tileMap.value.size.width
      $canvas.height = app.tileMap.value.size.height

      localStorage.removeItem("openFileName")

      renderTileMap()

      saveTileMap()

      newTileMapModal.hide()
    })
}

async function createTileMap({ width, height }) {
  const tileMap = new TileMap()
  tileMap.size = {
    width: width * DEFAULT_TILE_WIDTH,
    height: height * DEFAULT_TILE_HEIGHT,
  }
  tileMap.tileSize = {
    width: DEFAULT_TILE_WIDTH,
    height: DEFAULT_TILE_HEIGHT,
  }
  tileMap.tileSets[0] = {
    name: "tileset.png",
    content: await loadFileAsDataUrl("tileset.png"),
  }
  tileMap.tiles[0] = new TileLayer({ width, height })
  return tileMap
}

async function loadFileAsDataUrl(url: string): Promise<string> {
  const response = await fetch(url)
  const blob = await response.blob()
  const fileReader = new FileReader()
  return new Promise((resolve, onError) => {
    fileReader.onload = () => {
      resolve(fileReader.result as string)
    }
    fileReader.onerror = onError
    fileReader.readAsDataURL(blob)
  })
}

function resizeMap(size: Size): void {
  backUpMap()
  app.resizeTileMap(size)
}

function setTiles({ x, y }: Point) {
  backUpMap()

  const baseX = adjustToStep(x, app.tileMap.value.tileSize.width)
  const baseY = adjustToStep(y, app.tileMap.value.tileSize.height)

  let somethingHasChanged = false
  for (
    let y = 0;
    y < app.selectedTileSetTiles.value.height;
    y += app.tileMap.value.tileSize.height
  ) {
    for (
      let x = 0;
      x < app.selectedTileSetTiles.value.width;
      x += app.tileMap.value.tileSize.width
    ) {
      const row = (baseY + y) / app.tileMap.value.tileSize.height
      const column = (baseX + x) / app.tileMap.value.tileSize.width

      const tile = {
        x: app.selectedTileSetTiles.value.x + x,
        y: app.selectedTileSetTiles.value.y + y,
        tileSet: retrieveSelectedTileSetID(),
      }

      const hasTileBeenSet = setTileOnCurrentLevel({ row, column }, tile)
      somethingHasChanged = somethingHasChanged || hasTileBeenSet

      const position = { x: baseX + x, y: baseY + y }
      renderTile(position)
    }
  }
  if (somethingHasChanged) {
    renderGrid()
    saveTileMap()
  } else {
    backups.pop()
  }
}

function calculateIndex({ row, column }) {
  return (
    row *
      Math.ceil(
        app.tileMap.value.size.width / app.tileMap.value.tileSize.width,
      ) +
    column
  )
}

function setTileOnCurrentLevel(position: CellPosition, tile: Tile) {
  return app.currentLevelTileLayer.setTile(position, tile)
}

function setTile(position: CellPosition, tile: Tile, level: number) {
  return app.tileMap.value.tiles[level].setTile(position, tile)
}

function renderTiles(area) {
  for (
    let y = area.y;
    y < area.y + area.height;
    y += app.tileMap.value.tileSize.height
  ) {
    for (
      let x = area.x;
      x < area.x + area.width;
      x += app.tileMap.value.tileSize.width
    ) {
      renderTile({
        x,
        y,
      })
    }
  }
}

function renderTile(position: Position, replacements?: MultiLayerTile) {
  const tile = retrieveTile(position)
  context.clearRect(
    position.x,
    position.y,
    app.tileMap.value.tileSize.width,
    app.tileMap.value.tileSize.height,
  )
  if (tile) {
    context.save()
    function a(level2: number) {
      const tileOnLayer =
        replacements && replacements[level2]
          ? replacements[level2]
          : tile[level2]
      if (tileOnLayer) {
        context.globalAlpha = level2 > app.level.value ? 0.4 : 1
        const image =
          typeof tileOnLayer.tileSet === "number"
            ? tileSets[tileOnLayer.tileSet]
            : $tileSet
        if (image) {
          context.drawImage(
            image,
            tileOnLayer.x,
            tileOnLayer.y,
            app.tileMap.value.tileSize.width,
            app.tileMap.value.tileSize.height,
            position.x,
            position.y,
            app.tileMap.value.tileSize.width,
            app.tileMap.value.tileSize.height,
          )
        }
      }
    }
    if (renderOnlyCurrentLevel) {
      a(app.level.value)
    } else {
      for (
        let level2 = 0;
        level2 <= Math.max(tile.length - 1, app.level.value);
        level2++
      ) {
        a(level2)
      }
    }
    context.restore()
  } else {
    renderEmptyTile(position)
  }
}

async function createImageFromDataURL(dataURL) {
  return new Promise((resolve) => {
    const image = new Image()
    image.onload = function () {
      resolve(image)
    }
    image.src = dataURL
  })
}

function renderSelectedTiles(area, selectedTiles) {
  for (let y = 0; y < area.height; y += app.tileMap.value.tileSize.height) {
    for (let x = 0; x < area.width; x += app.tileMap.value.tileSize.width) {
      const replacements = []
      replacements[app.level.value] = {
        x: selectedTiles.x + x,
        y: selectedTiles.y + y,
      }
      renderTile(
        {
          x: area.x + x,
          y: area.y + y,
        },
        replacements,
      )
    }
  }

  renderGrid()
}

function renderEmptyTile(position) {
  context.fillStyle = "white"
  context.fillRect(
    position.x,
    position.y,
    app.tileMap.value.tileSize.width,
    app.tileMap.value.tileSize.height,
  )
}

function renderPreviewTiles() {
  renderSelectedTiles(previewTiles, app.selectedTileSetTiles.value)
}

function renderTileMap() {
  for (
    let y = 0;
    y < app.tileMap.value.size.height;
    y += app.tileMap.value.tileSize.height
  ) {
    for (
      let x = 0;
      x < app.tileMap.value.size.width;
      x += app.tileMap.value.tileSize.width
    ) {
      renderTile({ x, y })
    }
  }

  renderGrid()
}

function renderGrid() {
  if (isGridShown) {
    context.fillStyle = "black"

    for (
      let y = app.tileMap.value.tileSize.height;
      y < app.tileMap.value.size.height;
      y += app.tileMap.value.tileSize.height
    ) {
      context.fillRect(0, y - 1, app.tileMap.value.size.width, 2)
    }

    for (
      let x = app.tileMap.value.tileSize.width;
      x < app.tileMap.value.size.width;
      x += app.tileMap.value.tileSize.width
    ) {
      context.fillRect(x, 0, 2, app.tileMap.value.size.height)
    }
  }
}

function debounce(fn, delay = 1000) {
  let handler = null
  return function (...args) {
    if (handler) {
      clearTimeout(handler)
    }
    handler = setTimeout(() => {
      fn(...args)
    }, delay)
  }
}

const types = [
  {
    description: "Map",
    accept: {
      "text/json": [".json"],
    },
  },
]

const filePickerBaseOptions = {
  excludeAcceptAllOption: true,
  types,
}

const ABORT_ERROR = 20

async function loadTileMap() {
  let fileHandles
  try {
    fileHandles = await window.showOpenFilePicker({
      ...filePickerBaseOptions,
      types: [
        {
          description: "Map",
          accept: {
            "text/json": [".json"],
            // "application/xml": [".tmx"],
          },
        },
      ],
    })
  } catch (error) {
    if (error.code !== ABORT_ERROR) {
      throw error
    }
  }
  if (fileHandles) {
    const fileHandle = fileHandles[0]
    const fileName = fileHandle.name
    const extension = path.extname(fileName)

    localStorage.setItem("openFileName", fileName)
    const file = await fileHandle.getFile()
    const content = await file.text()
    if (extension === ".json") {
      app.tileMap.next(parseJSONTileMap(content))
    } else if (extension === ".tmx") {
      app.tileMap.next(parseTiledTileMap(content))
    }
    app.level.next(app.tileMap.value.tiles.length - 1)

    $canvas.width = app.tileMap.value.size.width
    $canvas.height = app.tileMap.value.size.height

    $tileHover.style.width = app.tileMap.value.tileSize.width + "px"
    $tileHover.style.height = app.tileMap.value.tileSize.height + "px"

    $tileSelected.style.width = app.tileMap.value.tileSize.width + "px"
    $tileSelected.style.height = app.tileMap.value.tileSize.height + "px"

    renderTileMap()

    saveTileMap()
  }
}

function parseJSONTileMap(content) {
  const tileMap = new TileMap()
  Object.assign(tileMap, JSON.parse(content))
  tileMap.tiles = tileMap.tiles.map((rawTileLayer) => {
    const tileLayer = new TileLayer(rawTileLayer.size)
    tileLayer.tiles = rawTileLayer.tiles
    return tileLayer
  })
  return tileMap
}

function parseTiledTileMap(content) {
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "",
  })
  const data = parser.parse(content)
  const map = data.map
  const tileMap = createTileMap({
    width: parseInt(map.width, 10),
    height: parseInt(map.height, 10),
  })
  app.tileMap.value.tiles = map.layer.map(function (layer) {
    layer.data["#text"].split(",").map((value) => parseInt(value, 10))
  })
}

function parseTiledTileMapLayer(layer) {}

async function saveMap() {
  let handle
  try {
    handle = await window.showSaveFilePicker({
      ...filePickerBaseOptions,
      suggestedName: localStorage.getItem("openFileName") || "map.json",
    })
  } catch (error) {
    if (error.code !== ABORT_ERROR) {
      throw error
    }
  }
  if (handle) {
    const stream = await handle.createWritable()
    await stream.write(JSON.stringify(app.tileMap.value, null, 2))
    await stream.close()
  }
}

window.addEventListener("keydown", function (event) {
  if (!isModalOpen) {
    if (isOnlyCtrlOrCmdModifierKeyPressed(event) && event.key === "z") {
      event.preventDefault()
      undo()
    } else if (isOnlyCtrlOrCmdModifierKeyPressed(event) && event.key === "c") {
      event.preventDefault()
      copy()
    } else if (isOnlyCtrlOrCmdModifierKeyPressed(event) && event.key === "x") {
      event.preventDefault()
      cut()
    } else if (isOnlyCtrlOrCmdModifierKeyPressed(event) && event.key === "v") {
      event.preventDefault()
      startPasting()
    } else if (
      isOnlyCtrlOrCmdModifierKeyPressed(event) &&
      event.code === "ArrowUp"
    ) {
      event.preventDefault()
      app.incrementLevel()
    } else if (
      isOnlyCtrlOrCmdModifierKeyPressed(event) &&
      event.code === "ArrowDown"
    ) {
      event.preventDefault()
      app.decrementLevel()
    } else if (isNoModifierKeyPressed(event) && event.key === "f") {
      event.preventDefault()
      activateFillTool()
    } else if (isNoModifierKeyPressed(event) && event.key === "p") {
      event.preventDefault()
      activatePenTool()
    } else if (isNoModifierKeyPressed(event) && event.key === "a") {
      event.preventDefault()
      activateAreaTool()
    } else if (isNoModifierKeyPressed(event) && event.key === "s") {
      event.preventDefault()
      activateSelectTool()
    } else if (isNoModifierKeyPressed(event) && event.key === "g") {
      event.preventDefault()
      toggleGrid()
    } else if (isNoModifierKeyPressed(event) && event.key === "c") {
      event.preventDefault()
      toggleRenderOnlyCurrentLevel()
    } else if (isOnlyCtrlOrCmdModifierKeyPressed(event) && event.key === "o") {
      event.preventDefault()
      loadTileMap()
    } else if (isOnlyCtrlOrCmdModifierKeyPressed(event) && event.key === "s") {
      event.preventDefault()
      saveMap()
    } else if (
      isOnlyCtrlOrCmdAndAltModifierKeyPressed(event) &&
      event.code === "KeyN"
    ) {
      event.preventDefault()
      openCreateNewMapDialog()
    } else if (isOnlyCtrlOrCmdModifierKeyPressed(event) && event.key === "e") {
      event.preventDefault()
      showEditMapDialog()
    } else if (event.code === "Escape") {
      if (isInPasteMode) {
        event.preventDefault()
        isInPasteMode = false
        renderTileMap()
      }
    }
  }
})

const isOnMac = navigator.platform.indexOf("Mac") === 0

if (isOnMac) {
  const elementsWithShortcutInText = [
    document.getElementById("showNewTileMapDialogButton"),
    document.getElementById("showEditTileMapDialogButton"),
    document.getElementById("importFromFile"),
    document.getElementById("exportToFile"),
    document.getElementById("undo"),
  ]

  elementsWithShortcutInText.forEach((element) => {
    element.textContent = element.textContent.replace(/Ctrl/g, "Cmd")
  })
}

function isOnlyCtrlOrCmdModifierKeyPressed(event) {
  return (
    isCtrlOrCmdModifierKeyPressed(event) && !event.shiftKey && !event.altKey
  )
}

function isOnlyCtrlOrCmdAndAltModifierKeyPressed(event) {
  return isCtrlOrCmdModifierKeyPressed(event) && !event.shiftKey && event.altKey
}

function isCtrlOrCmdModifierKeyPressed(event) {
  return isOnMac ? event.metaKey : event.ctrlKey
}

function isNoModifierKeyPressed(event) {
  return !event.ctrlKey && !event.shiftKey && !event.altKey && !event.metaKey
}

function undo() {
  const lastBackup = backups.pop()
  if (lastBackup) {
    const oldTileMap = app.tileMap.value
    app.tileMap.next(lastBackup)
    if (app.tileMap.value.size.width !== oldTileMap.size.width) {
      $canvas.width = app.tileMap.value.size.width
    }
    if (app.tileMap.value.size.height !== oldTileMap.size.height) {
      $canvas.height = app.tileMap.value.size.height
    }
    renderTileMap()
    saveTileMap()
  }
}

let copiedTiles: TileLayer | TileLayer[] | null = null
let copiedArea: FromToArea | null = null
let hasBeenCopiedForOneLevel: boolean | null = null
let isInPasteMode: boolean = false

function copy() {
  if (app.activeTool.value === "selection") {
    copiedArea = determineCutArea()
    copiedTiles = new Array(app.tileMap.value.tiles.length)
    if (renderOnlyCurrentLevel) {
      copiedTiles = copyArea(
        app.tileMap.value.tiles[app.level.value],
        copiedArea,
      )
      hasBeenCopiedForOneLevel = true
    } else {
      for (let level = 0; level < app.tileMap.value.tiles.length; level++) {
        copiedTiles[level] = copyArea(
          app.tileMap.value.tiles[level],
          copiedArea,
        )
      }
      hasBeenCopiedForOneLevel = false
    }
  }
}

function cut() {
  if (app.activeTool.value === "selection") {
    backUpMap()
    copiedArea = determineCutArea()
    if (renderOnlyCurrentLevel) {
      copiedTiles = copyArea(app.currentLevelTileLayer, copiedArea)
      hasBeenCopiedForOneLevel = true
      removeTiles(app.tileMap.value.tiles[app.level.value], copiedArea)
    } else {
      copiedTiles = new Array(app.tileMap.value.tiles.length)
      for (let level = 0; level < app.tileMap.value.tiles.length; level++) {
        copiedTiles[level] = copyArea(
          app.tileMap.value.tiles[level],
          copiedArea,
        )
      }
      hasBeenCopiedForOneLevel = false
      removeTilesOnAllLevels(app.tileMap.value.tiles, copiedArea)
    }
    renderTileMap()
    saveTileMap()
  }
}

function determineCutArea(): CellArea {
  return {
    from: {
      row: Math.floor(
        selectedTilesInTileMap.y / app.tileMap.value.tileSize.height,
      ),
      column: Math.floor(
        selectedTilesInTileMap.x / app.tileMap.value.tileSize.width,
      ),
    },
    to: {
      row:
        Math.floor(
          (selectedTilesInTileMap.y + selectedTilesInTileMap.height) /
            app.tileMap.value.tileSize.height,
        ) - 1,
      column:
        Math.floor(
          (selectedTilesInTileMap.x + selectedTilesInTileMap.width) /
            app.tileMap.value.tileSize.width,
        ) - 1,
    },
  }
}

function removeTilesOnAllLevels(tileLayers: TileLayer[], area: CellArea): void {
  for (let level = 0; level < tileLayers.length; level++) {
    removeTiles(tileLayers[level], area)
  }
}

function removeTiles(tileLayer: TileLayer, area: CellArea): void {
  for (let row = area.from.row; row <= area.to.row; row++) {
    for (let column = area.from.column; column <= area.to.column; column++) {
      tileLayer.removeTile({ row, column })
    }
  }
}

function startPasting() {
  if (copiedTiles && copiedArea) {
    isInPasteMode = true

    previewPaste()
  }
}

function paste(event) {
  backUpMap()

  doSomethingWithCopiedTiles(function ({ row, column }, copiedTile) {
    if (hasBeenCopiedForOneLevel) {
      if (copiedTile) {
        setTile({ row, column }, copiedTile, app.level.value)
      }
    } else {
      app.tileMap.value.setMultiLayerTile({ row, column }, copiedTile)
    }
  })

  isInPasteMode = false
  renderTileMap()
  saveTileMap()
}

function previewPaste() {
  doSomethingWithCopiedTiles(function (
    { row, column }: CellPosition,
    cutTile: MultiLayerTile | Tile,
  ) {
    const x = column * app.tileMap.value.tileSize.width
    const y = row * app.tileMap.value.tileSize.height
    if (hasBeenCopiedForOneLevel) {
      const replacements: MultiLayerTile = []
      replacements[app.level.value] = cutTile as Tile
      renderTile({ x, y }, replacements)
    } else {
      renderTile({ x, y }, cutTile as MultiLayerTile)
    }
  })

  renderGrid()
}

function doSomethingWithCopiedTiles(fn) {
  const numberOfRowsCut = copiedArea.to.row - copiedArea.from.row + 1
  const numberOfColumnsCut = copiedArea.to.column - copiedArea.from.column + 1
  const fromRow =
    determineRowFromCoordinate(lastPointerPosition.y) -
    (Math.ceil(0.5 * numberOfRowsCut) - 1)
  const fromColumn =
    determineColumnFromCoordinate(lastPointerPosition.x) -
    (Math.ceil(0.5 * numberOfColumnsCut) - 1)
  for (let rowOffset = 0; rowOffset < numberOfRowsCut; rowOffset++) {
    for (
      let columnOffset = 0;
      columnOffset < numberOfColumnsCut;
      columnOffset++
    ) {
      let copiedTile
      if (hasBeenCopiedForOneLevel) {
        copiedTile = (copiedTiles as TileLayer).retrieveTile({
          row: rowOffset,
          column: columnOffset,
        })
      } else {
        copiedTile = new Array((copiedTiles as TileLayer[]).length)
        for (
          let level = 0;
          level < (copiedTiles as TileLayer[]).length;
          level++
        ) {
          copiedTile[level] = (copiedTiles as TileLayer[])[level].retrieveTile({
            row: rowOffset,
            column: columnOffset,
          })
        }
      }

      const row = fromRow + rowOffset
      const column = fromColumn + columnOffset

      fn({ row, column }, copiedTile)
    }
  }
}

function determineRowFromCoordinate(y) {
  return (
    adjustToStep(y, app.tileMap.value.tileSize.height) /
    app.tileMap.value.tileSize.height
  )
}

function determineColumnFromCoordinate(x) {
  return (
    adjustToStep(x, app.tileMap.value.tileSize.width) /
    app.tileMap.value.tileSize.width
  )
}

function copyArea(tileLayer: TileLayer, area: CellArea): TileLayer {
  const size = {
    width: area.to.column - area.from.column + 1,
    height: area.to.row - area.from.row + 1,
  }
  const areaTileLayer = new TileLayer(size)
  for (let row = 0; row < size.height; row++) {
    for (let column = 0; column < size.width; column++) {
      areaTileLayer.setTile(
        { row, column },
        tileLayer.retrieveTile({
          row: area.from.row + row,
          column: area.from.column + column,
        }),
      )
    }
  }
  return areaTileLayer
}

;(
  document.querySelector("#exportToFile") as HTMLButtonElement
).addEventListener("click", function (event) {
  event.preventDefault()
  saveMap()
})
;(
  document.querySelector("#importFromFile") as HTMLButtonElement
).addEventListener("click", function (event) {
  event.preventDefault()
  loadTileMap()
})

const $undo = document.querySelector("#undo") as HTMLAnchorElement
$undo.addEventListener("click", function () {
  undo()
})

const showEditTileSetDialogButton = document.querySelector(
  "#showEditTileSetDialogButton",
)

async function loadTileSet() {
  return new Promise(async (resolve) => {
    let fileHandles
    try {
      fileHandles = await window.showOpenFilePicker({
        excludeAcceptAllOption: true,
        types: [
          {
            description: "Image",
            accept: {
              "image/*": [
                ".apng",
                ".avif",
                ".gif",
                ".jpg",
                ".jpeg",
                ".jfif",
                ".pjpeg",
                ".pjp",
                ".png",
                ".svg",
                ".webp",
                ".bmp",
                ".tif",
                ".tiff",
              ],
            },
          },
        ],
      })
    } catch (error) {
      if (error.code !== ABORT_ERROR) {
        throw error
      }
    }
    if (fileHandles) {
      const fileHandle = fileHandles[0]
      const file = await fileHandle.getFile()
      const fileReader = new FileReader()
      fileReader.onloadend = function () {
        const url = fileReader.result
        const tileSet = {
          name: fileHandle.name,
          content: url,
        }
        resolve(tileSet)
      }
      fileReader.readAsDataURL(file)
    }
  })
}

{
  const $addTileSet = document.querySelector("#addTileSet") as HTMLButtonElement
  $addTileSet.addEventListener("click", function () {
    showAddTileSetDialog()
  })
}

async function showAddTileSetDialog() {
  const tileSet = await loadTileSet()
  const id = addTileSet(tileSet)
  selectTileSet(id)
  saveTileMap()
}

function addTileSet(tileSet) {
  const id = determineNextID(app.tileMap.value.tileSets)
  // TODO: Make tileSets reactive
  app.tileMap.value.tileSets[id] = tileSet
  addOptionToTileSetSelect(id, tileSet)
  return id
}

function determineNextID(tileSets) {
  return Math.max(...Object.keys(tileSets).map(Number)) + 1
}

function selectTileSet(id) {
  $tileSetSelect.value = id
  const tileSet = app.tileMap.value.tileSets[id]
  $tileSet.src = tileSet.content
  localStorage.setItem("selectedTileSet", id)
}

function retrieveSelectedTileSetID() {
  return parseInt($tileSetSelect.value, 10)
}

$tileSetSelect.addEventListener("change", function () {
  selectTileSet(retrieveSelectedTileSetID())
})

{
  const $removeTileSet = document.querySelector(
    "#removeTileSet",
  ) as HTMLButtonElement
  $removeTileSet.addEventListener("click", function () {
    removeTileSet($tileSetSelect.value)
  })
}

function removeTileSet(id) {
  delete app.tileMap.value.tileSets[id]
  ;(
    $tileSetSelect.querySelector(`option[value="${id}"]`) as HTMLOptionElement
  ).remove()
  selectTileSet(parseInt($tileSetSelect.value, 10))
  saveTileMap()
}

{
  const $editTileSetModal = document.querySelector("#editTileSetModal")
  const editTileSetModal = new bootstrap.Modal($editTileSetModal)
  const $showEditTileSetDialogButton = document.querySelector(
    "#showEditTileSetDialogButton",
  )
  $showEditTileSetDialogButton.addEventListener("click", function () {
    editTileSetModal.show()
  })
  $editTileSetModal.addEventListener("show.bs.modal", function () {
    const id = $tileSetSelect.value
    const tileSet = app.tileMap.value.tileSets[id]
    $editTileSetModal.querySelector("#editTileSetName").value = tileSet.name
  })

  const $editTileSetForm = $editTileSetModal.querySelector("#editTileSetForm")
  $editTileSetForm.addEventListener("submit", function (event) {
    event.preventDefault()
    const id = $tileSetSelect.value
    const tileSet = app.tileMap.value.tileSets[id]
    const name = $editTileSetModal.querySelector("#editTileSetName").value
    tileSet.name = name
    $tileSetSelect.querySelector(`option[value="${id}"]`).textContent = name
    const fileReader = new FileReader()
    fileReader.onloadend = function () {
      tileSet.content = fileReader.result
      $tileSet.src = tileSet.content
      editTileSetModal.hide()
      saveTileMap()
    }
    const file = (
      $editTileSetModal.querySelector("#editTileSetFile") as HTMLInputElement
    ).files[0]
    fileReader.readAsDataURL(file)
  })
}

{
  document.body.addEventListener("shown.bs.modal", function () {
    isModalOpen = true
  })

  document.body.addEventListener("hidden.bs.modal", function () {
    isModalOpen = false
  })
}

function showMapFullScreen() {
  $sidebar.classList.add("d-none")
  ;(document.querySelector(".app-navbar") as HTMLElement).classList.add(
    "d-none",
  )
  ;(
    document.querySelector(".menu-icon-bar-main") as HTMLDivElement
  ).classList.add("d-none")
  ;(
    document.querySelector(
      "#toggleShowFullScreen material-symbols-outlined",
    ) as HTMLSpanElement
  ).textContent = "close_fullscreen"
}
