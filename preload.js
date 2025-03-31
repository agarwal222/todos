const { contextBridge, ipcRenderer } = require("electron")

let screenDimensions = null // Cache dimensions received from main

// Listen for screen dimensions sent from main process on load
ipcRenderer.on("screen-dimensions", (event, dimensions) => {
  console.log("Preload received screen dimensions:", dimensions)
  screenDimensions = dimensions
})

// --- Expose APIs to Renderers ---
contextBridge.exposeInMainWorld("electronAPI", {
  // == APIs for Main Window Renderer ==
  updateWallpaper: (imageDataUrl) =>
    ipcRenderer.invoke("update-wallpaper", imageDataUrl),

  // Function to get screen dimensions (returns cached value or null)
  // *** CHANGED: Made synchronous - relies on main sending before it's needed ***
  getScreenDimensions: () => {
    if (!screenDimensions) {
      // This warning might appear if called extremely early, but generally shouldn't happen.
      console.warn(
        "Preload: getScreenDimensions called before dimensions were received from main."
      )
    }
    return screenDimensions // Return cached value (or null if not ready yet)
  },

  loadGoogleFont: (fontUrl) => ipcRenderer.invoke("load-google-font", fontUrl),
  updateSettings: (settings) => ipcRenderer.send("update-settings", settings), // Send settings TO main

  // Listen for task FROM main AND trigger auto-apply (Changed channel name)
  onAddTaskAndApply: (callback) => {
    const channel = "add-task-and-apply"
    const listener = (event, taskText) => callback(taskText)
    ipcRenderer.on(channel, listener)
    // Return cleanup function
    return () => ipcRenderer.removeListener(channel, listener)
  },

  // Listen for shortcut registration errors FROM main
  onShortcutError: (callback) => {
    const channel = "shortcut-error"
    const listener = (event, errorMessage) => callback(errorMessage)
    ipcRenderer.on(channel, listener)
    return () => ipcRenderer.removeListener(channel, listener)
  },

  // *** NEW: Listen for request from Main to get todos ***
  onGetTodosRequest: (callback) => {
    const channel = "get-todos-request"
    // No need for args here, just trigger the callback
    const listener = () => callback()
    ipcRenderer.on(channel, listener)
    return () => ipcRenderer.removeListener(channel, listener)
  },
  // *** NEW: Send todos response back to Main ***
  sendTodosResponse: (todos) => {
    ipcRenderer.send("current-todos-response", todos)
  },

  // == APIs for Quick Add Renderer ==
  sendTaskToMain: (taskText) =>
    ipcRenderer.send("add-task-from-overlay", taskText),
  closeQuickAddWindow: () => ipcRenderer.send("close-quick-add"),
  // *** NEW: Listen for initial todos FROM Main ***
  onInitialTodos: (callback) => {
    const channel = "initial-todos"
    const listener = (event, todos) => callback(todos)
    ipcRenderer.on(channel, listener)
    return () => ipcRenderer.removeListener(channel, listener)
  },
  // *** NEW: Tell main process we're ready for todos ***
  requestTodosForOverlay: () => {
    ipcRenderer.send("quick-add-ready-for-todos")
  },
})

console.log("Preload script loaded.")
