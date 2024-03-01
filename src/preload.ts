// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

const { contextBridge, ipcRenderer } = require("electron")

contextBridge.exposeInMainWorld("electronAPI", {
  onNewGame(callback) {
    return ipcRenderer.on("new-game", (event, value) => callback(value))
  },
  onUndo(callback) {
    return ipcRenderer.on("undo", (event, value) => callback(value))
  },
  onCut(callback) {
    return ipcRenderer.on("cut", (event, value) => callback(value))
  },
  onCopy(callback) {
    return ipcRenderer.on("copy", (event, value) => callback(value))
  },
  onPaste(callback) {
    return ipcRenderer.on("paste", (event, value) => callback(value))
  },
})
