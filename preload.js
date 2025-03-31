const { contextBridge, ipcRenderer } = require("electron")

let screenDimensions = null // Cache dimensions received from main

// Listen for screen dimensions sent from main process on load
ipcRenderer.on("screen-dimensions", (event, dimensions) => {
  console.log("Preload received screen dimensions:", dimensions)
  screenDimensions = dimensions
  // Optionally, notify the renderer that dimensions are ready if needed immediately
  // window.postMessage({ type: 'SCREEN_DIMENSIONS_READY', payload: dimensions }, '*');
})

contextBridge.exposeInMainWorld("electronAPI", {
  // Wallpaper update function
  updateWallpaper: (imageDataUrl) =>
    ipcRenderer.invoke("update-wallpaper", imageDataUrl),

  // Function to request screen dimensions (returns cached value or null)
  // Made async to potentially wait if called before 'screen-dimensions' event fires (though unlikely with current setup)
  getScreenDimensions: async () => {
    if (screenDimensions) {
      return screenDimensions
    }
    // Basic fallback/wait mechanism (might need refinement if race condition occurs)
    return new Promise((resolve) => {
      const checkInterval = setInterval(() => {
        if (screenDimensions) {
          clearInterval(checkInterval)
          resolve(screenDimensions)
        }
      }, 50)
      // Timeout after a short period
      setTimeout(() => {
        clearInterval(checkInterval)
        resolve(null) // Indicate failure after timeout
      }, 1000)
    })
  },

  // Function to request loading font details from main process
  loadGoogleFont: (fontUrl) => ipcRenderer.invoke("load-google-font", fontUrl),
})

console.log("Preload script loaded.")
