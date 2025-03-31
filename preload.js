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
  getScreenDimensions: async () => {
    if (screenDimensions) return screenDimensions
    // Basic fallback/wait mechanism
    return new Promise((resolve) => {
      let checks = 0
      const maxChecks = 20
      const checkInterval = setInterval(() => {
        checks++
        if (screenDimensions || checks > maxChecks) {
          clearInterval(checkInterval)
          resolve(screenDimensions)
        }
      }, 50)
    })
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

  // == APIs for Quick Add Renderer ==
  sendTaskToMain: (taskText) =>
    ipcRenderer.send("add-task-from-overlay", taskText),
  closeQuickAddWindow: () => ipcRenderer.send("close-quick-add"),
})

console.log("Preload script loaded.")
