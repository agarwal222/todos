// preload.js
const { contextBridge, ipcRenderer } = require("electron")

let screenDimensions = null // Cache dimensions received from main

// Listen for screen dimensions sent from main process on load
ipcRenderer.on("screen-dimensions", (event, dimensions) => {
  console.log("Preload received screen dimensions:", dimensions)
  screenDimensions = dimensions
})

// --- Expose APIs to Renderers ---
try {
  // Add try-catch for debugging preload issues
  contextBridge.exposeInMainWorld("electronAPI", {
    // == APIs for Main Window Renderer ==
    updateWallpaper: (imageDataUrl) =>
      ipcRenderer.invoke("update-wallpaper", imageDataUrl),
    getScreenDimensions: () => {
      if (!screenDimensions)
        console.warn("Preload: getScreenDimensions called early.")
      return screenDimensions
    },
    loadGoogleFont: (fontUrl) =>
      ipcRenderer.invoke("load-google-font", fontUrl),
    updateSettings: (settings) => ipcRenderer.send("update-settings", settings),
    onAddTaskAndApply: (callback) => {
      const channel = "add-task-and-apply"
      const listener = (event, taskText) => callback(taskText)
      ipcRenderer.on(channel, listener)
      return () => ipcRenderer.removeListener(channel, listener)
    },
    onShortcutError: (callback) => {
      const channel = "shortcut-error"
      const listener = (event, errorMessage) => callback(errorMessage)
      ipcRenderer.on(channel, listener)
      return () => ipcRenderer.removeListener(channel, listener)
    },
    onGetTodosRequest: (callback) => {
      const channel = "get-todos-request"
      const listener = () => callback()
      ipcRenderer.on(channel, listener)
      return () => ipcRenderer.removeListener(channel, listener)
    },
    sendTodosResponse: (todos) => {
      ipcRenderer.send("current-todos-response", todos)
    },
    // *** Window Controls ***
    minimizeWindow: () => {
      console.log("Preload: Sending window-minimize")
      ipcRenderer.send("window-minimize")
    },
    maximizeRestoreWindow: () => {
      console.log("Preload: Sending window-maximize-restore")
      ipcRenderer.send("window-maximize-restore")
    },
    closeWindow: () => {
      console.log("Preload: Sending window-close")
      ipcRenderer.send("window-close")
    },
    // *** Listen for Window State Changes from Main ***
    onWindowStateChange: (callback) => {
      const channel = "window-state-changed"
      const listener = (event, state) => callback(state) // state is { isMaximized, isFullScreen }
      ipcRenderer.on(channel, listener)
      return () => ipcRenderer.removeListener(channel, listener)
    },
    // *** Expose Platform ***
    getPlatform: () => process.platform,

    // == APIs for Quick Add Renderer ==
    sendTaskToMain: (taskText) =>
      ipcRenderer.send("add-task-from-overlay", taskText),
    closeQuickAddWindow: () => ipcRenderer.send("close-quick-add"),
    onInitialTodos: (callback) => {
      const channel = "initial-todos"
      const listener = (event, todos) => callback(todos)
      ipcRenderer.on(channel, listener)
      return () => ipcRenderer.removeListener(channel, listener)
    },
    requestTodosForOverlay: () => {
      ipcRenderer.send("quick-add-ready-for-todos")
    },
  })

  console.log("Preload script finished exposing API successfully.")
} catch (error) {
  console.error("Error in preload script:", error)
}
