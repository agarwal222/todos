const { app, BrowserWindow, ipcMain, screen } = require("electron") // Added screen
const path = require("node:path")
const fs = require("node:fs")
const os = require("node:os")
const https = require("node:https") // For fetching Google Fonts CSS

// Keep reference to mainWindow
let mainWindow

function createWindow() {
  // Get primary screen dimensions *before* creating the window
  const primaryDisplay = screen.getPrimaryDisplay()
  const screenDimensions = primaryDisplay.size // { width, height }

  mainWindow = new BrowserWindow({
    // Assign to global mainWindow
    width: 1280, // Start with a reasonable window size
    height: 800,
    minWidth: 900, // Set min width to accommodate 3 columns generally
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
    // titleBarStyle: 'hidden', // REMOVED - Restore native title bar
    // trafficLightPosition: { x: 15, y: 15 }, // REMOVED - Only relevant with hidden title bar
  })

  mainWindow.loadFile("index.html")

  // Send screen dimensions to renderer once the window is ready
  mainWindow.webContents.on("did-finish-load", () => {
    mainWindow.webContents.send("screen-dimensions", screenDimensions)
  })

  // Optional: Open DevTools (Uncomment for debugging)
  // mainWindow.webContents.openDevTools();
}

// --- IPC Handlers ---

// Get Screen Dimensions (Alternative if needed, but sending on load is simpler)
ipcMain.handle("get-screen-dimensions", () => {
  const primaryDisplay = screen.getPrimaryDisplay()
  return primaryDisplay.size
})

// Load Google Font Details
ipcMain.handle("load-google-font", async (event, fontUrl) => {
  if (!fontUrl || !fontUrl.startsWith("https://fonts.googleapis.com/css")) {
    return { success: false, error: "Invalid Google Fonts URL format." }
  }

  console.log("Main: Received request to load font URL:", fontUrl)

  try {
    const cssContent = await fetchGoogleFontCSS(fontUrl)
    // Basic parsing - find font-family and the first woff2 url
    const fontFamilyMatch = cssContent.match(
      /font-family:\s*['"]?([^;'"]+)['"]?;/
    )
    // More robust regex for WOFF2 URL extraction
    const woff2UrlMatch = cssContent.match(
      /url\((https:\/\/fonts\.gstatic\.com\/s\/[^)]+\.woff2)\)/
    )

    if (!fontFamilyMatch || !woff2UrlMatch) {
      console.error(
        "Main: Could not parse font-family or woff2 URL from CSS. CSS Content:",
        cssContent
      )
      // Attempt to find WOFF URL as fallback
      const woffUrlMatch = cssContent.match(
        /url\((https:\/\/fonts\.gstatic\.com\/s\/[^)]+\.woff)\)/
      )
      if (fontFamilyMatch && woffUrlMatch) {
        console.log("Main: Found WOFF fallback URL.")
        const fontFamily = fontFamilyMatch[1]
        const woffUrl = woffUrlMatch[1]
        const fontData = await fetchFontData(woffUrl)
        console.log(
          `Main: Fetched WOFF font data for ${fontFamily} (length: ${fontData.length})`
        )
        return {
          success: true,
          fontFamily: fontFamily,
          fontDataUrl: `data:font/woff;base64,${fontData}`, // Return Base64 Data URL for WOFF
        }
      }
      // If still no match
      return {
        success: false,
        error:
          "Could not parse font details (WOFF2 or WOFF) from Google Fonts CSS.",
      }
    }

    const fontFamily = fontFamilyMatch[1]
    const woff2Url = woff2UrlMatch[1]
    console.log(
      `Main: Parsed font family: ${fontFamily}, WOFF2 URL: ${woff2Url}`
    )

    // Fetch the font file data as Base64
    const fontData = await fetchFontData(woff2Url)
    console.log(
      `Main: Fetched WOFF2 font data for ${fontFamily} (length: ${fontData.length})`
    )

    return {
      success: true,
      fontFamily: fontFamily,
      fontDataUrl: `data:font/woff2;base64,${fontData}`, // Return Base64 Data URL
    }
  } catch (error) {
    console.error("Main: Error loading Google Font:", error)
    return { success: false, error: error.message || "Failed to load font." }
  }
})

// Helper: Fetch Google Font CSS
function fetchGoogleFontCSS(url) {
  return new Promise((resolve, reject) => {
    // Google often requires a realistic user agent
    const options = {
      headers: {
        // Use a common user agent string
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36",
      },
    }
    https
      .get(url, options, (res) => {
        if (res.statusCode !== 200) {
          // Follow redirects if necessary (basic implementation)
          if (res.statusCode === 301 || res.statusCode === 302) {
            console.log(
              "Main: Following redirect for CSS URL:",
              res.headers.location
            )
            return fetchGoogleFontCSS(res.headers.location)
              .then(resolve)
              .catch(reject)
          }
          return reject(
            new Error(`Failed to get CSS: Status Code ${res.statusCode}`)
          )
        }
        let data = ""
        res.on("data", (chunk) => {
          data += chunk
        })
        res.on("end", () => resolve(data))
      })
      .on("error", (e) => {
        reject(new Error(`HTTPS request error for CSS: ${e.message}`))
      })
  })
}

// Helper: Fetch Font Data (WOFF/WOFF2) as Base64
function fetchFontData(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        // No special headers needed usually
        if (res.statusCode !== 200) {
          if (res.statusCode === 301 || res.statusCode === 302) {
            console.log(
              "Main: Following redirect for Font URL:",
              res.headers.location
            )
            return fetchFontData(res.headers.location)
              .then(resolve)
              .catch(reject)
          }
          return reject(
            new Error(`Failed to get font file: Status Code ${res.statusCode}`)
          )
        }
        const dataChunks = []
        res.on("data", (chunk) => {
          dataChunks.push(chunk)
        })
        res.on("end", () => {
          const buffer = Buffer.concat(dataChunks)
          resolve(buffer.toString("base64")) // Resolve with Base64 string
        })
      })
      .on("error", (e) => {
        reject(new Error(`HTTPS request error for font file: ${e.message}`))
      })
  })
}

// Update Wallpaper
ipcMain.handle("update-wallpaper", async (event, imageDataUrl) => {
  console.log("Main process received request to update wallpaper.")
  try {
    // Dynamically import wallpaper only when needed
    const { setWallpaper } = await import("wallpaper")
    const tempDir = os.tmpdir()
    const tempFilePath = path.join(tempDir, `todo-wallpaper-${Date.now()}.png`)
    const base64Data = imageDataUrl.replace(/^data:image\/png;base64,/, "")
    const imageBuffer = Buffer.from(base64Data, "base64")

    await fs.promises.writeFile(tempFilePath, imageBuffer)
    console.log("Temporary image saved to:", tempFilePath)
    await setWallpaper(tempFilePath)
    console.log("Wallpaper set successfully.")

    setTimeout(() => {
      fs.unlink(tempFilePath, (err) => {
        if (err) console.error("Error deleting temp file:", err)
        else console.log("Temp file deleted:", tempFilePath)
      })
    }, 5000)

    return { success: true }
  } catch (error) {
    console.error("Failed to set wallpaper:", error)
    return { success: false, error: error.message }
  }
})

// --- App Lifecycle ---
app.whenReady().then(() => {
  createWindow()
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit()
})
