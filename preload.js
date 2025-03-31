const { contextBridge, ipcRenderer } = require("electron")

contextBridge.exposeInMainWorld("electronAPI", {
  // Expose a function callable from the renderer (renderer.js)
  // that sends the image data to the main process
  updateWallpaper: (imageDataUrl) =>
    ipcRenderer.invoke("update-wallpaper", imageDataUrl),
})

console.log("Preload script loaded.")
