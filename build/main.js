"use strict";
const electron = require("electron");
const path = require("path");
if (require("electron-squirrel-startup")) {
  electron.app.quit();
}
const isMac = process.platform === "darwin";
const createWindow = () => {
  const mainWindow = new electron.BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, "preload.js")
    }
  });
  {
    mainWindow.loadURL("http://localhost:5173");
    mainWindow.webContents.openDevTools();
  }
  const menu = electron.Menu.buildFromTemplate([
    ...isMac ? [
      {
        label: electron.app.name,
        submenu: [
          {
            role: "about"
          },
          { type: "separator" },
          { role: "services" },
          { type: "separator" },
          { role: "hide" },
          { role: "hideOthers" },
          { role: "unhide" },
          { type: "separator" },
          { role: "quit" }
        ]
      }
    ] : [],
    {
      label: "File",
      submenu: [
        {
          label: `New game (${isMac ? "Cmd + N" : "Ctrl + N"})`,
          click() {
            mainWindow.webContents.send("new-game");
          }
        },
        isMac ? { role: "close" } : { role: "quit" }
      ]
    },
    {
      label: "Edit",
      submenu: [
        { role: "undo" },
        // { role: "redo" }, // TODO: Implement
        { type: "separator" },
        { role: "cut" },
        { role: "copy" },
        { role: "paste" }
        // { role: "delete" }, // TODO: Implement
      ]
    },
    ...[
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
          { role: "togglefullscreen" }
        ]
      }
    ],
    { role: "windowMenu" },
    {
      label: "Give feedback",
      async click() {
        await electron.shell.openExternal("https://github.com/SanjoSolutions/tilemap-editor/issues/new");
      }
    },
    {
      label: "Donate",
      async click() {
        await electron.shell.openExternal("https://www.paypal.com/donate/?hosted_button_id=H7Q46GUS9N3NC");
      }
    }
  ]);
  electron.Menu.setApplicationMenu(menu);
};
electron.app.on("ready", createWindow);
electron.app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    electron.app.quit();
  }
});
electron.app.on("activate", () => {
  if (electron.BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
