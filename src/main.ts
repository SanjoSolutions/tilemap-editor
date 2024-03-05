import { app, BrowserWindow, globalShortcut, Menu, shell } from "electron"
import path from "path"

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require("electron-squirrel-startup")) {
  app.quit()
}

const isMac = process.platform === "darwin"

const createWindow = () => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
    },
  })

  // and load the index.html of the app.
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL)

    // Open the DevTools.
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(
      path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`),
    )
  }

  const menu = Menu.buildFromTemplate([
    ...(isMac
      ? [
          {
            label: app.name,
            submenu: [
              {
                role: "about",
              },
              { type: "separator" },
              { role: "services" },
              { type: "separator" },
              { role: "hide" },
              { role: "hideOthers" },
              { role: "unhide" },
              { type: "separator" },
              { role: "quit" },
            ],
          },
        ]
      : []),
    {
      label: "File",
      submenu: [
        {
          label: "New game",
          accelerator: "CommandOrControl+N",
          click() {
            newGame()
          },
        },
        isMac ? { role: "close" } : { role: "quit" },
      ],
    },
    {
      label: "Edit",
      submenu: [
        {
          label: "Undo",
          accelerator: "CommandOrControl+Z",
          click() {
            undo()
          },
        },
        // { role: "redo" }, // TODO: Implement
        { type: "separator" },
        {
          label: "Cut",
          accelerator: "CommandOrControl+X",
          registerAccelerator: false,
          click() {
            cut()
          },
        },
        {
          label: "Copy",
          accelerator: "CommandOrControl+C",
          registerAccelerator: false,
          click() {
            copy()
          },
        },
        {
          label: "Paste",
          accelerator: "CommandOrControl+V",
          registerAccelerator: false,
          click() {
            paste()
          },
        },
        // { role: "delete" }, // TODO: Implement
      ],
    },
    ...(MAIN_WINDOW_VITE_DEV_SERVER_URL
      ? [
          {
            label: "View",
            submenu: [
              { role: "reload" },
              { role: "forceReload" },
              { role: "toggleDevTools" },
              { type: "separator" },
              { role: "resetZoom" },
              { role: "zoomIn" },
              { role: "zoomOut" },
              { type: "separator" },
              { role: "togglefullscreen" },
            ],
          },
        ]
      : []),
    { role: "windowMenu" },
    {
      label: "Give feedback",
      async click() {
        await shell.openExternal(
          "https://github.com/SanjoSolutions/tilemap-editor/issues/new",
        )
      },
    },
    {
      label: "Donate",
      async click() {
        await shell.openExternal(
          "https://www.paypal.com/donate/?hosted_button_id=H7Q46GUS9N3NC",
        )
      },
    },
    ...(isMac
      ? []
      : [
          {
            role: "help",
            submenu: [
              {
                role: "about",
              },
            ],
          },
        ]),
  ])
  Menu.setApplicationMenu(menu)

  function newGame() {
    mainWindow.webContents.send("new-game")
  }

  function undo() {
    mainWindow.webContents.send("undo")
  }

  function cut() {
    mainWindow.webContents.send("cut")
  }

  function copy() {
    mainWindow.webContents.send("copy")
  }

  function paste() {
    mainWindow.webContents.send("paste")
  }

  globalShortcut.register("CommandOrControl+N", newGame)
  globalShortcut.register("CommandOrControl+Z", undo)
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on("ready", createWindow)

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit()
  }
})

app.on("activate", () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
