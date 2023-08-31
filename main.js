import { XMLParser } from 'fast-xml-parser'
import * as path from 'node:path'

if (window.IS_DEVELOPMENT) {
  new EventSource('/esbuild').addEventListener('change', () =>
    location.reload()
  )
}

const levelSerialized = localStorage.getItem('level')
const DEFAULT_LEVEL = 0
let level = levelSerialized
  ? JSON.parse(levelSerialized) ?? DEFAULT_LEVEL
  : DEFAULT_LEVEL
const isGridShownSerialized = localStorage.getItem('isGridShown')
let activeTool = null
let isModalOpen = false
const menuIconBar = document.querySelector('.menu-icon-bar-main')
const penToolButton = menuIconBar.querySelector('.pen-tool-button')
const areaToolButton = menuIconBar.querySelector('.area-tool-button')
const fillToolButton = menuIconBar.querySelector('.fill-tool-button')
const selectionToolButton = menuIconBar.querySelector('.selection-tool-button')
const $selectedArea = document.querySelector('.selected-area')
changeTool('pen')
let renderOnlyCurrentLevel = false

let isGridShown = isGridShownSerialized
  ? JSON.parse(isGridShownSerialized)
  : true

const $level = document.querySelector('.level')
$level.value = level

$level.addEventListener('change', function (event) {
  level = Number(event.target.value)
  localStorage.setItem('level', level)
  renderTileMap()
})

const $sidebar = document.querySelector('.sidebar')

{
  const sideBarWidth = localStorage.getItem('sidebarWidth')
  if (sideBarWidth) {
    $sidebar.style.flexBasis = sideBarWidth
  }
}

{
  let offset = null
  const $sliderDragArea = document.querySelector('.slider__drag-area')
  let isSliding = false
  $sliderDragArea.addEventListener('pointerdown', function (event) {
    event.preventDefault()
    isSliding = true
    offset = event.offsetX - (17 - 1) / 2
  })
  window.addEventListener('pointermove', function (event) {
    if (isSliding) {
      event.preventDefault()
      $sidebar.style.flexBasis = event.clientX - offset + 'px'
    }
  })
  window.addEventListener('pointerup', function () {
    isSliding = false
    offset = null
    localStorage.setItem('sidebarWidth', $sidebar.style.flexBasis)
  })
}

const $tileHover = document.querySelector('.tile-hover')
const $tileSet = document.querySelector('.tile-set')
$tileSet.addEventListener('pointermove', function (event) {
  $tileHover.style.display = 'block'
  $tileHover.style.left =
    adjustToStep(event.offsetX, tileMap.tileSize.width) + 'px'
  $tileHover.style.top =
    adjustToStep(event.offsetY, tileMap.tileSize.height) + 'px'
})

const $tileSelected = document.querySelector('.tile-selected')

let isPointerDownInTileSet = false

$tileSet.addEventListener('pointerdown', function (event) {
  event.preventDefault()
  isPointerDownInTileSet = true
  selectTile(event)
})

$tileSet.addEventListener('pointermove', function (event) {
  if (isPointerDownInTileSet) {
    expandSelectTiles(event)
  }
})

$tileSet.addEventListener('mouseleave', function () {
  $tileHover.style.display = 'none'
})

let firstPoint = null
let selectedTiles = null

function selectTile(event) {
  const x = adjustToStep(event.offsetX, tileMap.tileSize.width)
  const y = adjustToStep(event.offsetY, tileMap.tileSize.height)
  firstPoint = {
    x,
    y,
  }
  selectedTiles = {
    x,
    y,
    width: tileMap.tileSize.width,
    height: tileMap.tileSize.height,
  }
  $tileSelected.style.display = 'block'
  $tileSelected.style.left = selectedTiles.x + 'px'
  $tileSelected.style.top = selectedTiles.y + 'px'
  $tileSelected.style.width = selectedTiles.width + 'px'
  $tileSelected.style.height = selectedTiles.height + 'px'
}

function expandSelectTiles(event) {
  const x = adjustToStep(event.offsetX, tileMap.tileSize.width)
  const y = adjustToStep(event.offsetY, tileMap.tileSize.height)
  selectedTiles = {
    x: Math.min(firstPoint.x, x),
    y: Math.min(firstPoint.y, y),
    width: Math.abs(x - firstPoint.x) + tileMap.tileSize.width,
    height: Math.abs(y - firstPoint.y) + tileMap.tileSize.height,
  }
  $tileSelected.style.left = selectedTiles.x + 'px'
  $tileSelected.style.top = selectedTiles.y + 'px'
  $tileSelected.style.width = selectedTiles.width + 'px'
  $tileSelected.style.height = selectedTiles.height + 'px'
}

window.addEventListener('pointerup', function () {
  isPointerDownInTileSet = false
})

function adjustToStep(value, step) {
  return Math.floor(value / step) * step
}

const $canvas = document.querySelector('.tile-map')
const context = $canvas.getContext('2d')

let previewTiles = null

const DEFAULT_TILE_WIDTH = 32
const DEFAULT_TILE_HEIGHT = 32
const DEFAULT_MAP_WIDTH = 16
const DEFAULT_MAP_HEIGHT = 16
const tileMapSerialized = localStorage.getItem('tileMap')
let tileMap = tileMapSerialized
  ? migrateTileMap(JSON.parse(tileMapSerialized))
  : createTileMap({ width: DEFAULT_MAP_WIDTH, height: DEFAULT_MAP_HEIGHT })

let tileSets = {}

for (const [id, tileSet] of Object.entries(tileMap.tileSets)) {
  createImageFromDataURL(tileSet.content).then(image => {
    tileSets[id] = image
    renderTileMap()
  })
}

const $tileSetSelect = document.getElementById('tileSetSelect')

function addOptionToTileSetSelect(id, tileSet) {
  const option = document.createElement('option')
  option.value = id
  option.textContent = tileSet.name
  $tileSetSelect.appendChild(option)
}

$tileSetSelect.innerHTML = ''
for (const [id, tileSet] of Object.entries(tileMap.tileSets)) {
  addOptionToTileSetSelect(id, tileSet)
}

{
  const selectedTileSetSerialized = localStorage.getItem('selectedTileSet')
  if (selectedTileSetSerialized) {
    const selectedTileSetID = parseInt(selectedTileSetSerialized, 10)
    selectTileSet(selectedTileSetID)
  }
}

function migrateTileMap(tileMap) {
  if (!tileMap.tileSets) {
    tileMap.tileSets = {}
    tileMap.tileSets[0] = {
      name: 'tileset.png',
      content: localStorage.getItem('tileSetUrl'),
    }
  }

  if (!tileMap.tiles[0][0].hasOwnProperty('tileSet')) {
    for (const levelTileMap of tileMap.tiles) {
      for (const tile of levelTileMap) {
        if (tile) {
          tile.tileSet = 0
        }
      }
    }
  }

  return tileMap
}

$canvas.width = tileMap.size.width
$canvas.height = tileMap.size.height

$tileHover.style.width = tileMap.tileSize.width + 'px'
$tileHover.style.height = tileMap.tileSize.height + 'px'

$tileSelected.style.width = tileMap.tileSize.width + 'px'
$tileSelected.style.height = tileMap.tileSize.height + 'px'

renderGrid()

if (tileMapSerialized) {
  if ($tileSet.complete) {
    renderTileMap()
  } else {
    $tileSet.addEventListener('load', function () {
      renderTileMap()
    })
  }
}

function retrieveTile(position) {
  const row = position.y / tileMap.tileSize.height
  const column = position.x / tileMap.tileSize.width
  return retrieveTile2({ row, column })
}

function retrieveTile2({ row, column }) {
  const index = calculateIndex({ row, column })
  return tileMap.tiles.map(levelTileMap =>
    levelTileMap ? levelTileMap[index] : null
  )
}

let firstPointTileMap = null
let selectedTilesInTileMap = null
let isPointerDownInTileMap = false

$canvas.addEventListener('pointerdown', function (event) {
  event.preventDefault()
  isPointerDownInTileMap = true

  if (activeTool === 'fill') {
    fill(event)
  } else {
    selectTileInTileMap(event)

    if (selectedTiles) {
      if (activeTool === 'pen') {
        setTiles(event)
      }
    }
  }
})

function previewFill(event) {
  doAFillMethod(event, function (tile, selectedTile) {
    const replacements = []
    replacements[level] = selectedTile
    renderTile(
      {
        x: tile.column * tileMap.tileSize.width,
        y: tile.row * tileMap.tileSize.height,
      },
      replacements
    )
  })
}

function fill(event) {
  backUpMap()
  doAFillMethod(event, function (tile, selectedTile) {
    setTileOnCurrentLevel(tile, selectedTile)
  })
  renderTileMap()
  saveTileMap()
}

const backups = []

function backUpMap() {
  backups.push(copyMap(tileMap))
}

function copyMap(tileMap) {
  return {
    size: { ...tileMap.size },
    tileSize: { ...tileMap.tileSize },
    tiles: tileMap.tiles.map(tiles => Array.from(tiles)),
  }
}

function doAFillMethod(event, fn) {
  const origin = {
    row:
      adjustToStep(event.offsetY, tileMap.tileSize.height) /
      tileMap.tileSize.height,
    column:
      adjustToStep(event.offsetX, tileMap.tileSize.width) /
      tileMap.tileSize.width,
  }

  const originTileBeforeFill = retrieveTile2(origin)[level]

  const selectedTile = {
    x: selectedTiles.x,
    y: selectedTiles.y,
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
          originTileBeforeFill
        ).filter(hasNotBeenVisited)
        nextTiles.push(...neighbors)
      }
    }
  } while (nextTiles.length >= 1)
}

function retrieveNeighborsWithSetTile(tile, setTile) {
  return retrieveNeighbors(tile).filter(tile => isTileSetTo(tile, setTile))
}

function retrieveNeighbors(tile) {
  const neighbors = []
  if (tile.row >= 1) {
    neighbors.push({
      row: tile.row - 1,
      column: tile.column,
    })
  }
  const numberOfColumns = tileMap.size.width / tileMap.tileSize.width
  if (tile.column < numberOfColumns - 1) {
    neighbors.push({
      row: tile.row,
      column: tile.column + 1,
    })
  }
  const numberOfRows = tileMap.size.height / tileMap.tileSize.height
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
  const b = a ? a[level] ?? null : null
  return (
    (!b && !setTile) || (b && setTile && b.x === setTile.x && b.y === setTile.y)
  )
}

function selectTileInTileMap(event) {
  const x = adjustToStep(event.offsetX, tileMap.tileSize.width)
  const y = adjustToStep(event.offsetY, tileMap.tileSize.height)
  firstPointTileMap = {
    x,
    y,
  }

  selectedTilesInTileMap = {
    x,
    y,
    width: tileMap.tileSize.width,
    height: tileMap.tileSize.height,
  }

  if (activeTool === 'selection') {
    updateSelectedArea()
  }
}

function updateSelectedArea() {
  $selectedArea.style.display = 'block'
  $selectedArea.style.left = selectedTilesInTileMap.x + 'px'
  $selectedArea.style.top = selectedTilesInTileMap.y + 'px'
  $selectedArea.style.width = selectedTilesInTileMap.width + 'px'
  $selectedArea.style.height = selectedTilesInTileMap.height + 'px'
}

function preview9SliceMade() {
  renderTileMap()

  do9SliceMethodWithSelectedTiles(function ({ row, column }, tile) {
    context.drawImage(
      $tileSet,
      tile.x,
      tile.y,
      tileMap.tileSize.width,
      tileMap.tileSize.height,
      selectedTilesInTileMap.x + column * tileMap.tileSize.width,
      selectedTilesInTileMap.y + row * tileMap.tileSize.height,
      tileMap.tileSize.width,
      tileMap.tileSize.height
    )
  })
}

function previewArea() {
  renderTileMap()

  const numberOfRows = selectedTiles.height / tileMap.tileSize.height
  const numberOfColumns = selectedTiles.width / tileMap.tileSize.width
  doSomethingWithSelectedTilesInTileMap(function ({ row, column }) {
    context.drawImage(
      $tileSet,
      selectedTiles.x + (column % numberOfColumns) * tileMap.tileSize.width,
      selectedTiles.y + (row % numberOfRows) * tileMap.tileSize.height,
      tileMap.tileSize.width,
      tileMap.tileSize.height,
      selectedTilesInTileMap.x + column * tileMap.tileSize.width,
      selectedTilesInTileMap.y + row * tileMap.tileSize.height,
      tileMap.tileSize.width,
      tileMap.tileSize.height
    )
  })
}

let lastPointerPosition = null

$canvas.addEventListener('pointermove', function (event) {
  lastPointerPosition = {
    x: event.offsetX,
    y: event.offsetY,
  }

  if (isPointerDownInTileMap) {
    if (activeTool === 'area') {
      if (selectedTiles) {
        expandSelectTilesInTileMap(event)
        if (seemsThat9SliceIsSelected()) {
          preview9SliceMade()
          renderGrid()
        } else {
          previewArea()
          renderGrid()
        }
      }
    } else if (activeTool === 'pen') {
      if (selectedTiles) {
        setTiles(event)
        renderGrid()
      }
    } else if (activeTool === 'selection') {
      expandSelectTilesInTileMap(event)
      updateSelectedArea()
    }
  } else if (isInPasteMode) {
    renderTileMap()
    previewPaste()
  } else if (selectedTiles) {
    if (activeTool === 'pen') {
      const previousPreviewTiles = previewTiles
      previewTiles = {
        x: adjustToStep(event.offsetX, tileMap.tileSize.width),
        y: adjustToStep(event.offsetY, tileMap.tileSize.height),
        width: selectedTiles.width,
        height: selectedTiles.height,
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
    } else if (activeTool === 'area') {
      const previousPreviewTiles = previewTiles
      previewTiles = {
        x: adjustToStep(event.offsetX, tileMap.tileSize.width),
        y: adjustToStep(event.offsetY, tileMap.tileSize.height),
        width: tileMap.tileSize.width,
        height: tileMap.tileSize.height,
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
    } else if (activeTool === 'fill') {
      renderTileMap()
      previewFill(event)
      renderGrid()
    }
  }
})

function expandSelectTilesInTileMap(event) {
  const x = adjustToStep(event.offsetX, tileMap.tileSize.width)
  const y = adjustToStep(event.offsetY, tileMap.tileSize.height)
  selectedTilesInTileMap = {
    x: Math.min(firstPointTileMap.x, x),
    y: Math.min(firstPointTileMap.y, y),
    width: Math.abs(x - firstPointTileMap.x) + tileMap.tileSize.width,
    height: Math.abs(y - firstPointTileMap.y) + tileMap.tileSize.height,
  }
}

function seemsThat9SliceIsSelected() {
  return (
    selectedTiles.width === 3 * tileMap.tileSize.height &&
    selectedTiles.height === 3 * tileMap.tileSize.height
  )
}

$canvas.addEventListener('mouseleave', function () {
  previewTiles = null
  renderTileMap()
})

window.addEventListener('pointerup', function () {
  const wasPointerDownInTileMap = isPointerDownInTileMap

  isPointerDownInTileMap = false

  if (wasPointerDownInTileMap) {
    if (activeTool === 'area') {
      if (seemsThat9SliceIsSelected()) {
        setTilesWith9SliceMethod()
      } else {
        area()
      }
    }
  }

  firstPointTileMap = null
  if (activeTool !== 'selection') {
    selectedTilesInTileMap = null
  }
})

$canvas.addEventListener('pointerup', function (event) {
  if (isInPasteMode) {
    paste(event)
  }
})

function putSelectedTilesOnMap() {
  setTiles({
    offsetX: firstPointTileMap.x,
    offsetY: firstPointTileMap.y,
  })
}

function area() {
  backUpMap()

  const numberOfRows = selectedTiles.height / tileMap.tileSize.height
  const numberOfColumns = selectedTiles.width / tileMap.tileSize.width
  const baseRow = selectedTilesInTileMap.y / tileMap.tileSize.height
  const baseColumn = selectedTilesInTileMap.x / tileMap.tileSize.width
  doSomethingWithSelectedTilesInTileMap(function ({ row, column }) {
    const selectedTile = {
      x: selectedTiles.x + (column % numberOfColumns) * tileMap.tileSize.width,
      y: selectedTiles.y + (row % numberOfRows) * tileMap.tileSize.height,
      tileSet: retrieveSelectedTileSetID(),
    }
    setTileOnCurrentLevel(
      { row: baseRow + row, column: baseColumn + column },
      selectedTile
    )
  })
  renderTileMap()
  saveTileMap()
}

function setTilesWith9SliceMethod() {
  backUpMap()

  const baseRow =
    adjustToStep(selectedTilesInTileMap.y, tileMap.tileSize.height) /
    tileMap.tileSize.height
  const baseColumn =
    adjustToStep(selectedTilesInTileMap.x, tileMap.tileSize.width) /
    tileMap.tileSize.width

  do9SliceMethodWithSelectedTiles(function ({ row, column }, tile) {
    setTileOnCurrentLevel(
      {
        row: baseRow + row,
        column: baseColumn + column,
      },
      tile
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
      selectedTilesX = selectedTiles.x
      selectedTilesY = selectedTiles.y
    } else if (row === 0 && column === numberOfColumns - 1) {
      ;(selectedTilesX = selectedTiles.x + 2 * tileMap.tileSize.width),
        (selectedTilesY = selectedTiles.y)
    } else if (row === numberOfRows - 1 && column === numberOfColumns - 1) {
      selectedTilesX = selectedTiles.x + 2 * tileMap.tileSize.width
      selectedTilesY = selectedTiles.y + 2 * tileMap.tileSize.height
    } else if (row === numberOfRows - 1 && column === 0) {
      selectedTilesX = selectedTiles.x
      selectedTilesY = selectedTiles.y + 2 * tileMap.tileSize.height
    } else if (row === 0) {
      selectedTilesX = selectedTiles.x + 1 * tileMap.tileSize.width
      selectedTilesY = selectedTiles.y
    } else if (row === numberOfRows - 1) {
      selectedTilesX = selectedTiles.x + 1 * tileMap.tileSize.width
      selectedTilesY = selectedTiles.y + 2 * tileMap.tileSize.height
    } else if (column === 0) {
      selectedTilesX = selectedTiles.x
      selectedTilesY = selectedTiles.y + 1 * tileMap.tileSize.height
    } else if (column === numberOfColumns - 1) {
      selectedTilesX = selectedTiles.x + 2 * tileMap.tileSize.width
      selectedTilesY = selectedTiles.y + 1 * tileMap.tileSize.height
    } else {
      selectedTilesX = selectedTiles.x + 1 * tileMap.tileSize.width
      selectedTilesY = selectedTiles.y + 1 * tileMap.tileSize.height
    }

    fn(
      { row, column },
      {
        x: selectedTilesX,
        y: selectedTilesY,
        tileSet: retrieveSelectedTileSetID(),
      }
    )
  })
}

function calculateNumberOfRows(height) {
  return height / tileMap.tileSize.height
}

function calculateNumberOfColumns(width) {
  return width / tileMap.tileSize.width
}

const toggleGridButton = menuIconBar.querySelector('.toggle-grid-button')

function updateToggleGridButton() {
  if (isGridShown) {
    toggleGridButton.classList.add('active')
  } else {
    toggleGridButton.classList.remove('active')
  }
}

updateToggleGridButton()

function toggleGrid() {
  isGridShown = !isGridShown
  updateToggleGridButton()
  localStorage.setItem('isGridShown', isGridShown)
  renderTileMap()
}

toggleGridButton.addEventListener('click', toggleGrid)

function updateToolButtonStates() {
  updatePenToolButton()
  updateAreaToolButton()
  updateFillToolButton()
  updateSelectionToolButton()
}

function updateToolButton(button, tool) {
  if (activeTool === tool) {
    button.classList.add('active')
  } else {
    button.classList.remove('active')
  }
}

function activatePenTool() {
  changeTool('pen')
}

penToolButton.addEventListener('click', activatePenTool)

function updatePenToolButton() {
  updateToolButton(penToolButton, 'pen')
}

function activateAreaTool() {
  changeTool('area')
}

areaToolButton.addEventListener('click', activateAreaTool)

function updateAreaToolButton() {
  updateToolButton(areaToolButton, 'area')
}

function activateFillTool() {
  changeTool('fill')
}

fillToolButton.addEventListener('click', activateFillTool)

function updateFillToolButton() {
  updateToolButton(fillToolButton, 'fill')
}

function activateSelectTool() {
  changeTool('selection')
}

function changeTool(tool) {
  if (tool !== activeTool) {
    activeTool = tool
    updateToolButtonStates()
    $selectedArea.style.display = 'none'
  }
}

selectionToolButton.addEventListener('click', activateSelectTool)

function updateSelectionToolButton() {
  updateToolButton(selectionToolButton, 'selection')
}

updateToolButtonStates()

const renderOnlyCurrentLevelButton = document.querySelector(
  '.render-only-current-level-button'
)

function toggleRenderOnlyCurrentLevel() {
  renderOnlyCurrentLevel = !renderOnlyCurrentLevel
  updateRenderOnlyCurrentLevelButton()
  renderTileMap()
}

renderOnlyCurrentLevelButton.addEventListener(
  'click',
  toggleRenderOnlyCurrentLevel
)

function updateRenderOnlyCurrentLevelButton() {
  if (renderOnlyCurrentLevel) {
    renderOnlyCurrentLevelButton.classList.add('active')
  } else {
    renderOnlyCurrentLevelButton.classList.remove('active')
  }
}

const saveTileMap = debounce(function () {
  localStorage.setItem('tileMap', JSON.stringify(tileMap))
})

const $tileMapSettingsModal = document.querySelector('#tilemapSettings')
const tileMapSettingsModal = new bootstrap.Modal($tileMapSettingsModal)

function showEditMapDialog() {
  tileMapSettingsModal.show()
}

$tileMapSettingsModal.addEventListener('show.bs.modal', function () {
  $tileMapSettingsModal.querySelector('#tilemapSettingsWidth').value =
    tileMap.size.width / tileMap.tileSize.width
  $tileMapSettingsModal.querySelector('#tilemapSettingsHeight').value =
    tileMap.size.height / tileMap.tileSize.height
})

$tileMapSettingsModal.addEventListener('shown.bs.modal', function () {
  const $width = $tileMapSettingsModal.querySelector('#tilemapSettingsWidth')
  $width.focus()
  $width.select()
})

$tileMapSettingsModal
  .querySelector('#tilemapSettingsForm')
  .addEventListener('submit', function (event) {
    event.preventDefault()

    const formData = new FormData(event.target)

    const width = parseInt(formData.get('width'), 10)
    const height = parseInt(formData.get('height'), 10)

    resizeMap({
      width: width * tileMap.tileSize.width,
      height: height * tileMap.tileSize.height,
    })

    $canvas.width = tileMap.size.width
    $canvas.height = tileMap.size.height

    renderTileMap()

    saveTileMap()

    tileMapSettingsModal.hide()
  })

{
  const $newTileMapModal = document.querySelector('#newTileMap')
  const newTileMapModal = new bootstrap.Modal($newTileMapModal)

  function openCreateNewMapDialog() {
    newTileMapModal.show()
  }

  $newTileMapModal.addEventListener('show.bs.modal', function () {
    $newTileMapModal.querySelector('#newTileMapWidth').value = DEFAULT_MAP_WIDTH
    $newTileMapModal.querySelector('#newTileMapHeight').value =
      DEFAULT_MAP_HEIGHT
  })

  $newTileMapModal.addEventListener('shown.bs.modal', function () {
    const $width = $newTileMapModal.querySelector('#newTileMapWidth')
    $width.focus()
    $width.select()
  })

  $newTileMapModal
    .querySelector('#newTileMapForm')
    .addEventListener('submit', function (event) {
      event.preventDefault()

      const formData = new FormData(event.target)

      const width = parseInt(formData.get('width'), 10)
      const height = parseInt(formData.get('height'), 10)

      tileMap = createTileMap({
        width,
        height,
      })

      $canvas.width = tileMap.size.width
      $canvas.height = tileMap.size.height

      localStorage.removeItem('openFileName')

      renderTileMap()

      saveTileMap()

      newTileMapModal.hide()
    })
}

function createTileMap({ width, height }) {
  return {
    size: {
      width: width * DEFAULT_TILE_WIDTH,
      height: height * DEFAULT_TILE_HEIGHT,
    },
    tileSize: {
      width: DEFAULT_TILE_WIDTH,
      height: DEFAULT_TILE_HEIGHT,
    },
    tileSets: {
      0: {
        name: 'tileset.png',
        content: null,
      },
    },
    tiles: [new Array(width * height)],
  }
}

function resizeMap({ width, height }) {
  backUpMap()

  const oldNumberOfRows = Math.ceil(
    tileMap.size.height / tileMap.tileSize.height
  )
  const oldNumberOfColumns = Math.ceil(
    tileMap.size.width / tileMap.tileSize.width
  )
  const numberOfRows = Math.ceil(height / tileMap.tileSize.height)
  const numberOfColumns = Math.ceil(width / tileMap.tileSize.width)
  tileMap.tiles = tileMap.tiles.map(function (oldTiles) {
    const updatedTiles = new Array(numberOfRows * numberOfColumns)
    for (let row = 0; row < Math.min(oldNumberOfRows, numberOfRows); row++) {
      const startIndex = row * oldNumberOfColumns
      for (
        let index = 0;
        index < Math.min(oldNumberOfColumns, numberOfColumns);
        index++
      ) {
        updatedTiles[row * numberOfColumns + index] =
          oldTiles[startIndex + index]
      }
    }
    return updatedTiles
  })
  tileMap.size.width = width
  tileMap.size.height = height
}

function setTiles(event) {
  backUpMap()

  const baseX = adjustToStep(event.offsetX, tileMap.tileSize.width)
  const baseY = adjustToStep(event.offsetY, tileMap.tileSize.height)

  let somethingHasChanged = false
  for (let y = 0; y < selectedTiles.height; y += tileMap.tileSize.height) {
    for (let x = 0; x < selectedTiles.width; x += tileMap.tileSize.width) {
      const row = (baseY + y) / tileMap.tileSize.height
      const column = (baseX + x) / tileMap.tileSize.width

      const tile = {
        x: selectedTiles.x + x,
        y: selectedTiles.y + y,
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
  return row * Math.ceil(tileMap.size.width / tileMap.tileSize.width) + column
}

function setTileOnCurrentLevel({ row, column }, tile) {
  return setTile({ row, column }, tile, level)
}

function setTile({ row, column }, tile, level) {
  const index = calculateIndex({ row, column })
  const previousTile = tileMap.tiles[level] && tileMap.tiles[level][index]
  if (!previousTile || areDifferent(previousTile, tile)) {
    if (!tileMap.tiles[level]) {
      tileMap.tiles[level] = new Array(
        retrieveNumberOfColumns(tileMap) * retrieveNumberOfRows(tileMap)
      )
    }
    tileMap.tiles[level][index] = tile
    return true
  } else {
    return false
  }
}

function setMultiLayerTile({ row, column }, multiLayerTile) {
  let hasSomethingChanged = false
  for (let level = 0; level < multiLayerTile.length; level++) {
    const tile = multiLayerTile[level]
    const hasChanged = setTile({ row, column }, tile, level)
    hasSomethingChanged ||= hasChanged
  }

  return hasSomethingChanged
}

function retrieveNumberOfRows(tileMap) {
  return Math.ceil(tileMap.size.height / tileMap.tileSize.height)
}

function retrieveNumberOfColumns(tileMap) {
  return Math.ceil(tileMap.size.width / tileMap.tileSize.width)
}

function renderTiles(area) {
  for (let y = area.y; y < area.y + area.height; y += tileMap.tileSize.height) {
    for (let x = area.x; x < area.x + area.width; x += tileMap.tileSize.width) {
      renderTile({
        x,
        y,
      })
    }
  }
}

function renderTile(position, replacements = null) {
  const tile = retrieveTile(position)
  context.clearRect(
    position.x,
    position.y,
    tileMap.tileSize.width,
    tileMap.tileSize.height
  )
  if (tile) {
    context.save()
    function a(level2) {
      const tileOnLayer =
        replacements && replacements[level2]
          ? replacements[level2]
          : tile[level2]
      if (tileOnLayer) {
        context.globalAlpha = level2 > level ? 0.4 : 1
        const image =
          typeof tileOnLayer.tileSet === 'number'
            ? tileSets[tileOnLayer.tileSet]
            : $tileSet
        if (image) {
          context.drawImage(
            image,
            tileOnLayer.x,
            tileOnLayer.y,
            tileMap.tileSize.width,
            tileMap.tileSize.height,
            position.x,
            position.y,
            tileMap.tileSize.width,
            tileMap.tileSize.height
          )
        }
      }
    }
    if (renderOnlyCurrentLevel) {
      a(level)
    } else {
      for (
        let level2 = 0;
        level2 <= Math.max(tile.length - 1, level);
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
  return new Promise(resolve => {
    const image = new Image()
    image.onload = function () {
      resolve(image)
    }
    image.src = dataURL
  })
}

function renderSelectedTiles(area, selectedTiles) {
  for (let y = 0; y < area.height; y += tileMap.tileSize.height) {
    for (let x = 0; x < area.width; x += tileMap.tileSize.width) {
      const replacements = []
      replacements[level] = {
        x: selectedTiles.x + x,
        y: selectedTiles.y + y,
      }
      renderTile(
        {
          x: area.x + x,
          y: area.y + y,
        },
        replacements
      )
    }
  }

  renderGrid()
}

function renderEmptyTile(position) {
  context.fillStyle = 'white'
  context.fillRect(
    position.x,
    position.y,
    tileMap.tileSize.width,
    tileMap.tileSize.height
  )
}

function areDifferent(a, b) {
  return (
    a.x !== b.x ||
    a.y !== b.y ||
    ((a.width || b.width) && a.width !== b.width) ||
    ((a.height || b.height) && a.height !== b.height)
  )
}

function renderPreviewTiles() {
  renderSelectedTiles(previewTiles, selectedTiles)
}

function renderTileMap() {
  for (let y = 0; y < tileMap.size.height; y += tileMap.tileSize.height) {
    for (let x = 0; x < tileMap.size.width; x += tileMap.tileSize.width) {
      renderTile({ x, y })
    }
  }

  renderGrid()
}

function renderGrid() {
  if (isGridShown) {
    context.fillStyle = 'black'

    for (
      let y = tileMap.tileSize.height;
      y < tileMap.size.height;
      y += tileMap.tileSize.height
    ) {
      context.fillRect(0, y - 1, tileMap.size.width, 2)
    }

    for (
      let x = tileMap.tileSize.width;
      x < tileMap.size.width;
      x += tileMap.tileSize.width
    ) {
      context.fillRect(x, 0, 2, tileMap.size.height)
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
    description: 'Map',
    accept: {
      'text/json': ['.json'],
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
          description: 'Map',
          accept: {
            'text/json': ['.json'],
            'application/xml': ['.tmx'],
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

    localStorage.setItem('openFileName', fileName)
    const file = await fileHandle.getFile()
    const content = await file.text()
    if (extension === '.json') {
      tileMap = parseJSONTileMap(content)
    } else if (extension === '.tmx') {
      tileMap = parseTiledTileMap(content)
    }
    level = tileMap.tiles.length - 1
    $level.value = level

    $canvas.width = tileMap.size.width
    $canvas.height = tileMap.size.height

    $tileHover.style.width = tileMap.tileSize.width + 'px'
    $tileHover.style.height = tileMap.tileSize.height + 'px'

    $tileSelected.style.width = tileMap.tileSize.width + 'px'
    $tileSelected.style.height = tileMap.tileSize.height + 'px'

    renderTileMap()

    saveTileMap()
  }
}

function parseJSONTileMap(content) {
  return JSON.parse(content)
}

function parseTiledTileMap(content) {
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '',
  })
  const data = parser.parse(content)
  debugger
  const map = data.map
  const tileMap = createTileMap({
    width: parseInt(map.width, 10),
    height: parseInt(map.height, 10),
  })
  tileMap.tiles = map.layer.map(function (layer) {
    layer.data['#text'].split(',').map(value => parseInt(value, 10))
  })
}

function parseTiledTileMapLayer(layer) {}

async function saveMap() {
  let handle
  try {
    handle = await window.showSaveFilePicker({
      ...filePickerBaseOptions,
      suggestedName: localStorage.getItem('openFileName') || 'map.json',
    })
  } catch (error) {
    if (error.code !== ABORT_ERROR) {
      throw error
    }
  }
  if (handle) {
    const stream = await handle.createWritable()
    await stream.write(JSON.stringify(tileMap, null, 2))
    await stream.close()
  }
}

window.addEventListener('keydown', function (event) {
  if (!isModalOpen) {
    if (isOnlyCtrlOrCmdModifierKeyPressed(event) && event.key === 'z') {
      event.preventDefault()
      undo()
    } else if (isOnlyCtrlOrCmdModifierKeyPressed(event) && event.key === 'c') {
      event.preventDefault()
      copy()
    } else if (isOnlyCtrlOrCmdModifierKeyPressed(event) && event.key === 'x') {
      event.preventDefault()
      cut()
    } else if (isOnlyCtrlOrCmdModifierKeyPressed(event) && event.key === 'v') {
      event.preventDefault()
      startPasting()
    } else if (
      isOnlyCtrlOrCmdModifierKeyPressed(event) &&
      event.code === 'ArrowUp'
    ) {
      event.preventDefault()
      incrementLevel()
    } else if (
      isOnlyCtrlOrCmdModifierKeyPressed(event) &&
      event.code === 'ArrowDown'
    ) {
      event.preventDefault()
      decrementLevel()
    } else if (isNoModifierKeyPressed(event) && event.key === 'f') {
      event.preventDefault()
      activateFillTool()
    } else if (isNoModifierKeyPressed(event) && event.key === 'p') {
      event.preventDefault()
      activatePenTool()
    } else if (isNoModifierKeyPressed(event) && event.key === 'a') {
      event.preventDefault()
      activateAreaTool()
    } else if (isNoModifierKeyPressed(event) && event.key === 's') {
      event.preventDefault()
      activateSelectTool()
    } else if (isNoModifierKeyPressed(event) && event.key === 'g') {
      event.preventDefault()
      toggleGrid()
    } else if (isNoModifierKeyPressed(event) && event.key === 'c') {
      event.preventDefault()
      toggleRenderOnlyCurrentLevel()
    } else if (isOnlyCtrlOrCmdModifierKeyPressed(event) && event.key === 'o') {
      event.preventDefault()
      loadTileMap()
    } else if (isOnlyCtrlOrCmdModifierKeyPressed(event) && event.key === 's') {
      event.preventDefault()
      saveMap()
    } else if (
      isOnlyCtrlOrCmdAndAltModifierKeyPressed(event) &&
      event.code === 'KeyN'
    ) {
      event.preventDefault()
      openCreateNewMapDialog()
    } else if (isOnlyCtrlOrCmdModifierKeyPressed(event) && event.key === 'e') {
      event.preventDefault()
      showEditMapDialog()
    } else if (event.code === 'Escape') {
      if (isInPasteMode) {
        event.preventDefault()
        isInPasteMode = false
        renderTileMap()
      }
    }
  }
})

const isOnMac = navigator.platform.indexOf('Mac') === 0

if (isOnMac) {
  const elementsWithShortcutInText = [
    document.getElementById('showNewTileMapDialogButton'),
    document.getElementById('showEditTileMapDialogButton'),
    document.getElementById('importFromFile'),
    document.getElementById('exportToFile'),
    document.getElementById('undo'),
  ]

  elementsWithShortcutInText.forEach(element => {
    element.textContent = element.textContent.replace(/Ctrl/g, 'Cmd')
  })

  const elementsWithShortcutInTitle = [
    document.getElementById('showLoadTileSetDialogButton'),
  ]

  elementsWithShortcutInTitle.forEach(element => {
    element.title = element.title.replace(/Ctrl/g, 'Cmd')
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

function incrementLevel() {
  setLevel(level + 1)
}

function decrementLevel() {
  if (level > 0) {
    setLevel(level - 1)
  }
}

function setLevel(value) {
  level = value
  $level.value = level
  renderTileMap()
}

function undo() {
  const lastBackup = backups.pop()
  if (lastBackup) {
    const oldTileMap = tileMap
    tileMap = lastBackup
    if (tileMap.size.width !== oldTileMap.size.width) {
      canvas.width = tileMap.size.width
    }
    if (tileMap.size.height !== oldTileMap.size.height) {
      canvas.height = tileMap.size.height
    }
    renderTileMap()
    saveTileMap()
  }
}

let copiedTiles = null
let copiedArea = null
let hasBeenCopiedForOneLevel = null
let isInPasteMode = false

function copy() {
  if (activeTool === 'selection') {
    copiedArea = determineCutArea()
    copiedTiles = new Array(tileMap.tiles.length)
    if (renderOnlyCurrentLevel) {
      copiedTiles = copyArea(tileMap.tiles[level], copiedArea)
      hasBeenCopiedForOneLevel = true
    } else {
      for (let level = 0; level < tileMap.tiles.length; level++) {
        copiedTiles[level] = copyArea(tileMap.tiles[level], copiedArea)
      }
      hasBeenCopiedForOneLevel = false
    }
  }
}

function cut() {
  if (activeTool === 'selection') {
    backUpMap()
    copiedArea = determineCutArea()
    copiedTiles = new Array(tileMap.tiles.length)
    if (renderOnlyCurrentLevel) {
      copiedTiles = copyArea(tileMap.tiles[level], copiedArea)
      hasBeenCopiedForOneLevel = true
      removeTiles(tileMap.tiles[level], copiedArea)
    } else {
      for (let level = 0; level < tileMap.tiles.length; level++) {
        copiedTiles[level] = copyArea(tileMap.tiles[level], copiedArea)
      }
      hasBeenCopiedForOneLevel = false
      removeTilesOnAllLevels(tileMap.tiles, copiedArea)
    }
    renderTileMap()
    saveTileMap()
  }
}

function determineCutArea() {
  return {
    from: {
      row: Math.ceil(selectedTilesInTileMap.y / tileMap.tileSize.height),
      column: Math.ceil(selectedTilesInTileMap.x / tileMap.tileSize.width),
    },
    to: {
      row: Math.ceil(
        (selectedTilesInTileMap.y + selectedTilesInTileMap.height) /
          tileMap.tileSize.height
      ),
      column: Math.ceil(
        (selectedTilesInTileMap.x + selectedTilesInTileMap.width) /
          tileMap.tileSize.width
      ),
    },
  }
}

function removeTilesOnAllLevels(tileLayers, area) {
  for (let level = 0; level < tileMap.tiles.length; level++) {
    removeTiles(tileMap.tiles[level], area)
  }
}

function removeTiles(tiles, area) {
  const numberOfRows = area.to.row - area.from.row
  const numberOfColumns = area.to.column - area.from.column
  const numberOfColumnsInTileMap = Math.ceil(
    tileMap.size.width / tileMap.tileSize.width
  )
  for (let rowOffset = 0; rowOffset < numberOfRows; rowOffset++) {
    for (let columnOffset = 0; columnOffset < numberOfColumns; columnOffset++) {
      const index =
        (area.from.row + rowOffset) * numberOfColumnsInTileMap +
        area.from.column +
        columnOffset
      tiles[index] = null
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
        setTile({ row, column }, copiedTile, level)
      }
    } else {
      setMultiLayerTile({ row, column }, copiedTile)
    }
  })

  isInPasteMode = false
  renderTileMap()
  saveTileMap()
}

function previewPaste() {
  doSomethingWithCopiedTiles(function ({ row, column }, cutTile) {
    const x = column * tileMap.tileSize.width
    const y = row * tileMap.tileSize.height
    if (hasBeenCopiedForOneLevel) {
      const replacements = []
      replacements[level] = cutTile
      renderTile({ x, y }, replacements)
    } else {
      renderTile({ x, y }, cutTile)
    }
  })

  renderGrid()
}

function doSomethingWithCopiedTiles(fn) {
  const numberOfRowsCut = copiedArea.to.row - copiedArea.from.row
  const numberOfColumnsCut = copiedArea.to.column - copiedArea.from.column
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
      const index = rowOffset * numberOfColumnsCut + columnOffset
      let copiedTile
      if (hasBeenCopiedForOneLevel) {
        copiedTile = copiedTiles[index]
      } else {
        copiedTile = new Array(copiedTiles.length)
        for (let level = 0; level < copiedTiles.length; level++) {
          copiedTile[level] = copiedTiles[level][index]
        }
      }

      const row = fromRow + rowOffset
      const column = fromColumn + columnOffset

      fn({ row, column }, copiedTile)
    }
  }
}

function determineRowFromCoordinate(y) {
  return adjustToStep(y, tileMap.tileSize.height) / tileMap.tileSize.height
}

function determineColumnFromCoordinate(x) {
  return adjustToStep(x, tileMap.tileSize.width) / tileMap.tileSize.width
}

function copyArea(tilesLayer, area) {
  const numberOfRows = area.to.row - area.from.row
  const numberOfColumns = area.to.column - area.from.column
  const tiles = new Array(numberOfRows * numberOfColumns)
  for (let row = 0; row < numberOfRows; row++) {
    const startIndex = row * numberOfColumns
    for (let column = 0; column < numberOfColumns; column++) {
      tiles[startIndex + column] =
        tilesLayer[
          (area.from.row + row) *
            Math.ceil(tileMap.size.width / tileMap.tileSize.width) +
            area.from.column +
            column
        ]
    }
  }
  return tiles
}

document
  .querySelector('#exportToFile')
  .addEventListener('click', function (event) {
    event.preventDefault()
    saveMap()
  })

document
  .querySelector('#importFromFile')
  .addEventListener('click', function (event) {
    event.preventDefault()
    loadTileMap()
  })

const $undo = document.querySelector('#undo')
$undo.addEventListener('click', function () {
  undo()
})

const showEditTileSetDialogButton = document.querySelector(
  '#showEditTileSetDialogButton'
)

async function loadTileSet() {
  return new Promise(async resolve => {
    let fileHandles
    try {
      fileHandles = await window.showOpenFilePicker({
        excludeAcceptAllOption: true,
        types: [
          {
            description: 'Image',
            accept: {
              'image/*': [
                '.apng',
                '.avif',
                '.gif',
                '.jpg',
                '.jpeg',
                '.jfif',
                '.pjpeg',
                '.pjp',
                '.png',
                '.svg',
                '.webp',
                '.bmp',
                '.tif',
                '.tiff',
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
  const $addTileSet = document.querySelector('#addTileSet')
  $addTileSet.addEventListener('click', function () {
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
  const id = determineNextID(tileMap.tileSets)
  tileMap.tileSets[id] = tileSet
  addOptionToTileSetSelect(id, tileSet)
  return id
}

function determineNextID(tileSets) {
  return Math.max(...Object.keys(tileSets).map(Number)) + 1
}

function selectTileSet(id) {
  $tileSetSelect.value = id
  const tileSet = tileMap.tileSets[id]
  $tileSet.src = tileSet.content
  localStorage.setItem('selectedTileSet', id)
}

function retrieveSelectedTileSetID() {
  return parseInt($tileSetSelect.value, 10)
}

$tileSetSelect.addEventListener('change', function () {
  selectTileSet(retrieveSelectedTileSetID())
})

{
  const $removeTileSet = document.querySelector('#removeTileSet')
  $removeTileSet.addEventListener('click', function () {
    removeTileSet($tileSetSelect.value)
  })
}

function removeTileSet(id) {
  delete tileMap.tileSets[id]
  $tileSetSelect.querySelector(`option[value="${id}"]`).remove()
  selectTileSet(parseInt($tileSetSelect.value, 10))
  saveTileMap()
}

{
  const $editTileSetModal = document.querySelector('#editTileSetModal')
  const editTileSetModal = new bootstrap.Modal($editTileSetModal)
  const $showEditTileSetDialogButton = document.querySelector(
    '#showEditTileSetDialogButton'
  )
  $showEditTileSetDialogButton.addEventListener('click', function () {
    editTileSetModal.show()
  })
  $editTileSetModal.addEventListener('show.bs.modal', function () {
    const id = $tileSetSelect.value
    const tileSet = tileMap.tileSets[id]
    $editTileSetModal.querySelector('#editTileSetName').value = tileSet.name
  })

  const $editTileSetForm = $editTileSetModal.querySelector('#editTileSetForm')
  $editTileSetForm.addEventListener('submit', function (event) {
    event.preventDefault()
    const id = $tileSetSelect.value
    const tileSet = tileMap.tileSets[id]
    const name = $editTileSetModal.querySelector('#editTileSetName').value
    tileSet.name = name
    $tileSetSelect.querySelector(`option[value="${id}"]`).textContent = name
    const fileReader = new FileReader()
    fileReader.onloadend = function () {
      tileSet.content = fileReader.result
      $tileSet.src = tileSet.content
      editTileSetModal.hide()
      saveTileMap()
    }
    const file = $editTileSetModal.querySelector('#editTileSetFile').files[0]
    fileReader.readAsDataURL(file)
  })
}

{
  document.body.addEventListener('shown.bs.modal', function () {
    isModalOpen = true
  })

  document.body.addEventListener('hidden.bs.modal', function () {
    isModalOpen = false
  })
}
