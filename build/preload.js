const { contextBridge, ipcRenderer } = require("electron");
contextBridge.exposeInMainWorld("electronAPI", {
  onNewGame(callback) {
    return ipcRenderer.on("new-game", (event, value) => callback(value));
  }
});
