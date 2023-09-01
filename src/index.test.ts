describe("pen tool", function () {
  test("can draw a single selected tile", function () {
    document.body.innerHTML = `
    <nav class="app-navbar navbar navbar-expand-lg bg-body-tertiary">
      <div class="container-fluid">
        <a class="navbar-brand" href="#">Tilemap Editor</a>
        <button
          class="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarSupportedContent"
          aria-controls="navbarSupportedContent"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span class="navbar-toggler-icon"></span>
        </button>
        <div class="collapse navbar-collapse">
          <ul class="navbar-nav me-auto mb-2 mb-lg-0">
            <li class="nav-item dropdown">
              <a
                class="nav-link dropdown-toggle"
                href="#"
                role="button"
                data-bs-toggle="dropdown"
                aria-expanded="false"
              >
                File
              </a>
              <ul class="dropdown-menu">
                <li>
                  <a
                    id="showNewTileMapDialogButton"
                    class="dropdown-item"
                    href="#"
                    data-bs-toggle="modal"
                    data-bs-target="#newTileMap"
                    >New tilemap (Ctrl + Alt + N)</a
                  >
                </li>
                <li>
                  <a
                    id="showEditTileMapDialogButton"
                    class="dropdown-item"
                    href="#"
                    data-bs-toggle="modal"
                    data-bs-target="#tilemapSettings"
                    >Edit tilemap (Ctrl + E)</a
                  >
                </li>
                <li>
                  <a id="importFromFile" class="dropdown-item" href="#"
                    >Import from file (Ctrl + O)</a
                  >
                </li>
                <li>
                  <a id="exportToFile" class="dropdown-item" href="#"
                    >Export to file (Ctrl + S)</a
                  >
                </li>
              </ul>
            </li>
            <li class="nav-item dropdown">
              <a
                class="nav-link dropdown-toggle"
                href="#"
                role="button"
                data-bs-toggle="dropdown"
                aria-expanded="false"
              >
                Edit
              </a>
              <ul class="dropdown-menu">
                <li>
                  <a id="undo" class="dropdown-item" href="#"
                    >Undo (Ctrl + Z)</a
                  >
                </li>
              </ul>
            </li>
          </ul>
        </div>
      </div>
    </nav>
    <div class="app-container">
      <div class="sidebar">
        <div
          class="btn-toolbar menu-icon-bar menu-icon-bar-sidebar"
          role="toolbar"
          aria-label="Button toolbar"
        >
          <div class="input-group flex-grow-1">
            <select
              id="tileSetSelect"
              class="form-select flex-grow-1"
              aria-label="Tile set selection"
            ></select>
            <button
              id="addTileSet"
              class="btn btn-light"
              type="button"
              title="Add tile set"
            >
              <span class="material-symbols-outlined"> add </span>
            </button>
            <button
              id="removeTileSet"
              class="btn btn-light"
              type="button"
              title="Remove tile set"
            >
              <span class="material-symbols-outlined"> remove </span>
            </button>
            <button
              id="showEditTileSetDialogButton"
              type="button"
              class="btn btn-light"
              title="Edit tile set"
            >
              <span class="material-symbols-outlined"> edit </span>
            </button>
          </div>
        </div>
        <div class="tile-set-container">
          <img class="tile-set" alt="Tileset" />
          <div class="tile-hover" style="display: none"></div>
          <div class="tile-selected" style="display: none"></div>
        </div>
      </div>
      <div class="slider">
        <div class="slider__drag-area"></div>
      </div>
      <div class="main">
        <div
          class="btn-toolbar menu-icon-bar menu-icon-bar-main"
          role="toolbar"
          aria-label="Button toolbar"
        >
          <div class="btn-group me-2" role="group" aria-label="Tools">
            <button
              type="button"
              class="pen-tool-button btn btn-light"
              title="Pen tool (P)"
            >
              <span class="material-symbols-outlined"> ink_pen </span>
            </button>
            <button
              type="button"
              class="area-tool-button btn btn-light"
              title="Draw area tool (A)"
            >
              <span class="material-symbols-outlined"> rectangle </span>
            </button>
            <button
              type="button"
              class="fill-tool-button btn btn-light"
              title="Fill tool (F)"
            >
              <span class="material-symbols-outlined"> format_color_fill </span>
            </button>
            <button
              type="button"
              class="selection-tool-button btn btn-light"
              title="Selection tool (S)"
            >
              <span class="material-symbols-outlined"> select </span>
            </button>
          </div>

          <div class="btn-group me-2" role="group" aria-label="Options">
            <button
              type="button"
              class="toggle-grid-button btn btn-light"
              title="Toggle grid (G)"
            >
              <span class="material-symbols-outlined"> grid_on </span>
            </button>
            <button
              type="button"
              class="render-only-current-level-button btn btn-light"
              title="Render only current level (C)"
            >
              <span class="material-symbols-outlined">
                check_indeterminate_small
              </span>
            </button>
          </div>

          <div class="btn-group" role="group" aria-label="Options">
            <button
              id="toggleShowFullScreen"
              type="button"
              class="btn btn-light"
              title="Toggle show full-screen"
            >
              <span class="material-symbols-outlined"> fullscreen </span>
            </button>
          </div>
        </div>

        <div class="tile-map-container">
          <canvas class="tile-map" width="1024" height="1024"></canvas>
          <div class="selected-area" style="display: none"></div>
        </div>
        <input class="level" type="number" value="0" title="Level" min="0" />
      </div>
    </div>

    <div id="newTileMap" class="modal" tabindex="-1">
      <div class="modal-dialog">
        <div class="modal-content">
          <form id="newTileMapForm">
            <div class="modal-header">
              <h5 class="modal-title">New tilemap</h5>
              <button
                type="button"
                class="btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
              ></button>
            </div>
            <div class="modal-body">
              <label for="newTileMapWidth" class="form-label">Width</label>
              <input
                type="number"
                id="newTileMapWidth"
                name="width"
                class="form-control"
              />

              <label for="newTileMapHeight" class="form-label">Height</label>
              <input
                type="number"
                id="newTileMapHeight"
                name="height"
                class="form-control"
              />
            </div>
            <div class="modal-footer">
              <button
                type="button"
                class="btn btn-secondary"
                data-bs-dismiss="modal"
              >
                Cancel
              </button>
              <button type="submit" class="btn btn-primary">Create</button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <div id="tilemapSettings" class="modal" tabindex="-1">
      <div class="modal-dialog">
        <div class="modal-content">
          <form id="tilemapSettingsForm">
            <div class="modal-header">
              <h5 class="modal-title">Tilemap settings</h5>
              <button
                type="button"
                class="btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
              ></button>
            </div>
            <div class="modal-body">
              <label for="tilemapSettingsWidth" class="form-label">Width</label>
              <input
                type="number"
                id="tilemapSettingsWidth"
                name="width"
                class="form-control"
              />

              <label for="tilemapSettingsHeight" class="form-label"
                >Height</label
              >
              <input
                type="number"
                id="tilemapSettingsHeight"
                name="height"
                class="form-control"
              />
            </div>
            <div class="modal-footer">
              <button
                type="button"
                class="btn btn-secondary"
                data-bs-dismiss="modal"
              >
                Cancel
              </button>
              <button type="submit" class="btn btn-primary">Save</button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <div id="editTileSetModal" class="modal" tabindex="-1">
      <div class="modal-dialog">
        <div class="modal-content">
          <form id="editTileSetForm">
            <div class="modal-header">
              <h5 class="modal-title">Tile set</h5>
              <button
                type="button"
                class="btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
              ></button>
            </div>
            <div class="modal-body">
              <div class="mb-3">
                <label for="editTileSetFile" class="form-label">File</label>
                <input
                  type="file"
                  id="editTileSetFile"
                  name="file"
                  class="form-control"
                  aria-describedby="editTileSetFileHelpText"
                  accept="image/*"
                />
                <div id="editTileSetFileHelpText" class="form-text">
                  The file stays on your computer.
                </div>
              </div>

              <label for="editTileSetName" class="form-label">Name</label>
              <input
                type="text"
                id="editTileSetName"
                name="name"
                class="form-control"
              />
            </div>
            <div class="modal-footer">
              <button
                type="button"
                class="btn btn-secondary"
                data-bs-dismiss="modal"
              >
                Cancel
              </button>
              <button type="submit" class="btn btn-primary">Save</button>
            </div>
          </form>
        </div>
      </div>
    </div>`

    // const app = new App()
    // app.selectPenTool()
    // app.selectTileSetTile(0, 0)
    // app.useToolAt(0, 0)
    // expectTileAt(app, { row: 0, column: 0 }, { x: 0, y: 0, tileSet: 0 })
  })
})
