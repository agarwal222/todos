const { app, BrowserWindow, ipcMain } = require("electron")
const path = require("node:path")
const fs = require("node:fs")
const os = require("node:os")
// const { setWallpaper } = require("wallpaper")

// Basic security considerations (disable nodeIntegration, enable contextIsolation)
function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true, // Recommended for security
      nodeIntegration: false, // Recommended for security
    },
  })

  mainWindow.loadFile("index.html")

  // Optional: Open DevTools
  // mainWindow.webContents.openDevTools();
}

app.whenReady().then(() => {
  createWindow()

  app.on("activate", () => {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on("window-all-closed", () => {
  // Quit when all windows are closed, except on macOS.
  if (process.platform !== "darwin") app.quit()
})

// --- Wallpaper Logic ---
// Listen for the 'update-wallpaper' message from the renderer process
ipcMain.handle("update-wallpaper", async (event, imageDataUrl) => {
  console.log("Main process received request to update wallpaper.")
  try {
    const { setWallpaper } = await import("wallpaper")
    // 1. Create a temporary file path
    const tempDir = os.tmpdir()
    const tempFilePath = path.join(tempDir, `todo-wallpaper-${Date.now()}.png`)

    // 2. Convert Data URL to buffer (remove the header 'data:image/png;base64,')
    const base64Data = imageDataUrl.replace(/^data:image\/png;base64,/, "")
    const imageBuffer = Buffer.from(base64Data, "base64")

    // 3. Write the buffer to the temporary file
    await fs.promises.writeFile(tempFilePath, imageBuffer)
    console.log("Temporary image saved to:", tempFilePath)

    // 4. Set the wallpaper using the temporary file path
    await setWallpaper(tempFilePath)
    console.log("Wallpaper set successfully.")

    // 5. (Optional but recommended) Clean up the temporary file after a delay
    setTimeout(() => {
      fs.unlink(tempFilePath, (err) => {
        if (err) console.error("Error deleting temp file:", err)
        else console.log("Temp file deleted:", tempFilePath)
      })
    }, 5000) // Delay to ensure wallpaper process is finished

    return { success: true }
  } catch (error) {
    console.error("Failed to set wallpaper:", error)
    return { success: false, error: error.message }
  }
})
