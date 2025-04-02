// preload.js
const { contextBridge, ipcRenderer } = require("electron")

let screenDimensions = null

ipcRenderer.on("screen-dimensions", (event, dimensions) => {
  console.log("Preload received screen dimensions:", dimensions)
  screenDimensions = dimensions
})

// Listen for initial settings from main process for main window
// We might need this if main needs to push settings on launch
// ipcRenderer.on("initial-settings", (event, settings) => {
//   console.log("Preload received initial settings:", settings);
//   // Potentially store or forward these if needed immediately by renderer on load
// });

contextBridge.exposeInMainWorld("electronAPI", {
  // == APIs for Main Window Renderer ==
  updateWallpaper: (imageDataUrl) =>
    ipcRenderer.invoke("update-wallpaper", imageDataUrl),
  getScreenDimensions: () => screenDimensions,
  getSystemFonts: () => ipcRenderer.invoke("get-system-fonts"),
  loadGoogleFontByName: (fontName, fontWeight) =>
    ipcRenderer.invoke("load-google-font-by-name", { fontName, fontWeight }),
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
  minimizeWindow: () => {
    ipcRenderer.send("window-minimize")
  },
  maximizeRestoreWindow: () => {
    ipcRenderer.send("window-maximize-restore")
  },
  closeWindow: () => {
    ipcRenderer.send("window-close")
  },
  onWindowStateChange: (callback) => {
    const channel = "window-state-changed"
    const listener = (event, state) => callback(state)
    ipcRenderer.on(channel, listener)
    return () => ipcRenderer.removeListener(channel, listener)
  },
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
  // ** NEW: Listener for Quick Add Settings **
  onQuickAddSettings: (callback) => {
    const channel = "quickadd-settings"
    const listener = (event, settings) => callback(settings)
    ipcRenderer.on(channel, listener)
    return () => ipcRenderer.removeListener(channel, listener)
  },
  // Removed requestTodosForOverlay - main handles the flow now
})

console.log("Preload script finished exposing API successfully.")
