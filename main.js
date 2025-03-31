const {
  app,
  BrowserWindow,
  ipcMain,
  screen,
  Tray,
  Menu,
  globalShortcut,
} = require("electron")
const path = require("node:path")
const fs = require("node:fs")
const os = require("node:os")
const https = require("node:https")

// Keep references
let mainWindow = null
let tray = null
let quickAddWindow = null
let isQuitting = false // Flag to prevent hiding on actual quit
let appSettings = {
  // Store settings received from renderer
  runInTray: false,
  quickAddShortcut: "CommandOrControl+Shift+N", // Store shortcut setting, initialize with default
}
let currentShortcut = null // Track the currently registered shortcut

const DEFAULT_SHORTCUT = "CommandOrControl+Shift+N" // Define default shortcut

// --- Main Window Creation ---
function createWindow() {
  const primaryDisplay = screen.getPrimaryDisplay()
  const screenDimensions = primaryDisplay.size

  mainWindow = new BrowserWindow({
    // Assign to global mainWindow
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
    show: false, // Don't show immediately
  })

  mainWindow.loadFile("index.html")

  // Send screen dimensions once ready
  mainWindow.webContents.on("did-finish-load", () => {
    mainWindow.webContents.send("screen-dimensions", screenDimensions)
    // Show window gracefully when ready
    mainWindow.show()
  })

  // --- Modified Close/Minimize Behavior ---
  mainWindow.on("close", (event) => {
    // If tray mode is ON and we are NOT explicitly quitting
    if (appSettings.runInTray && !isQuitting) {
      event.preventDefault() // Prevent the window from closing
      mainWindow.hide() // Hide the window instead
      if (process.platform === "darwin") {
        app.dock?.hide() // Hide from Dock on macOS
      }
      console.log("Main window hidden to tray.")
    } else {
      // Allow default close behavior (quits app unless macOS)
      mainWindow = null // Dereference window object
    }
  })

  mainWindow.on("minimize", (event) => {
    // Optional: Hide on minimize when in tray mode
    if (appSettings.runInTray && process.platform !== "darwin") {
      // Don't hide on minimize on Mac typically
      event.preventDefault()
      mainWindow.hide()
      console.log("Main window hidden to tray on minimize.")
    }
  })

  mainWindow.on("closed", () => {
    // Dereference the window object (important for GC)
    mainWindow = null
    // If not running in tray, closing main window quits the app (except macOS)
    if (!appSettings.runInTray && process.platform !== "darwin") {
      app.quit()
    }
  })

  // mainWindow.webContents.openDevTools(); // Uncomment for debugging
}

// --- Tray Icon Creation ---
function createTray() {
  if (tray) {
    console.log("Tray already exists.")
    return // Avoid creating multiple trays
  }
  // Create icon using path relative to project root
  const iconPath = path.join(__dirname, "icon.png") // Ensure you have icon.png
  if (!fs.existsSync(iconPath)) {
    console.error("Tray icon not found at:", iconPath)
    // Consider creating a default icon programmatically or skipping tray
    return
  }

  tray = new Tray(iconPath)

  const contextMenu = Menu.buildFromTemplate([
    { label: "Show App", click: () => showMainWindow() },
    { type: "separator" },
    {
      label: "Quit",
      click: () => {
        isQuitting = true // Set flag
        app.quit() // Trigger quit sequence
      },
    },
  ])

  tray.setToolTip("Todo Wallpaper App")
  tray.setContextMenu(contextMenu)

  // Show window on single click (Windows/Linux) or double click (macOS debatable)
  tray.on("click", () => {
    showMainWindow()
  })
  console.log("System tray icon created.")
}

// --- Remove Tray Icon ---
function destroyTray() {
  if (tray) {
    tray.destroy()
    tray = null
    console.log("System tray icon destroyed.")
  }
}

// --- Show Main Window ---
function showMainWindow() {
  if (mainWindow && !mainWindow.isDestroyed()) {
    // Check if destroyed
    mainWindow.show()
    mainWindow.focus()
    if (process.platform === "darwin") {
      app.dock?.show() // Show in Dock on macOS
    }
  } else {
    // If main window was closed/destroyed, recreate it
    console.log("Main window not available, recreating...")
    createWindow()
  }
}

// --- Global Shortcut ---
function registerGlobalShortcut() {
  const shortcutToRegister = appSettings.quickAddShortcut || DEFAULT_SHORTCUT // Use stored or default

  // Unregister previous shortcut if it exists and is different
  if (currentShortcut && currentShortcut !== shortcutToRegister) {
    unregisterCurrentShortcut()
  }

  // Only register if not already registered with the *same* accelerator
  if (globalShortcut.isRegistered(shortcutToRegister)) {
    console.warn(
      `Shortcut ${shortcutToRegister} is already registered (likely by this app). Skipping.`
    )
    if (!currentShortcut) currentShortcut = shortcutToRegister // Ensure currentShortcut is set if already registered
    return
  }

  console.log(`Attempting to register shortcut: ${shortcutToRegister}`)
  const ret = globalShortcut.register(shortcutToRegister, () => {
    console.log(`Shortcut ${shortcutToRegister} pressed`)
    createOrShowQuickAddWindow()
  })

  if (!ret) {
    console.error("Failed to register global shortcut:", shortcutToRegister)
    // Notify user in the main window if possible
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send(
        "shortcut-error",
        `Failed to register shortcut: ${shortcutToRegister}. It might be in use by another application.`
      )
    }
    currentShortcut = null // Mark as not registered
  } else {
    console.log("Global shortcut registered:", shortcutToRegister)
    currentShortcut = shortcutToRegister // Store the successfully registered shortcut
  }
}

// Unregister only the *currently active* shortcut known to this app
function unregisterCurrentShortcut() {
  if (currentShortcut && globalShortcut.isRegistered(currentShortcut)) {
    globalShortcut.unregister(currentShortcut)
    console.log("Global shortcut unregistered:", currentShortcut)
  } else if (currentShortcut) {
    console.log(
      "Attempted to unregister shortcut, but it was not registered:",
      currentShortcut
    )
  }
  currentShortcut = null // Reset current shortcut tracker
}

// --- Quick Add Window ---
// Modified to handle IPC for getting todos
function createOrShowQuickAddWindow() {
  if (quickAddWindow && !quickAddWindow.isDestroyed()) {
    console.log("Quick Add window already open. Focusing.")
    quickAddWindow.focus()
    return
  }

  // Check if main window exists to request todos from
  if (!mainWindow || mainWindow.isDestroyed()) {
    console.error("Cannot open Quick Add: Main window not available.")
    // Maybe show an error message or just don't open
    return
  }

  const primaryDisplay = screen.getPrimaryDisplay()
  const { width: screenWidth, height: screenHeight } = primaryDisplay.size
  const winWidth = 500 // Wider for lists
  const winHeight = 400 // Taller for lists

  quickAddWindow = new BrowserWindow({
    width: winWidth,
    height: winHeight,
    x: Math.round(screenWidth / 2 - winWidth / 2),
    y: Math.round(screenHeight * 0.15), // Slightly higher start
    frame: false,
    resizable: false,
    movable: true,
    skipTaskbar: true,
    alwaysOnTop: true,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      devTools: false,
    },
  })

  quickAddWindow.loadFile(path.join(__dirname, "quick-add.html"))

  // Variable to store todos fetched from main window
  let todosForQuickAdd = null

  // 1. Listen for the response from the main window renderer
  const responseListener = (event, todos) => {
    console.log("Main: Received current-todos-response from main window.")
    todosForQuickAdd = todos // Store the received todos

    // 3. If quickAddWindow is ready, send todos to it. Otherwise wait for did-finish-load
    if (
      quickAddWindow &&
      !quickAddWindow.isDestroyed() &&
      quickAddWindow.webContents.isLoading() === false
    ) {
      console.log("Main: Sending initial-todos to quick add window now.")
      quickAddWindow.webContents.send("initial-todos", todosForQuickAdd)
    }
  }
  ipcMain.once("current-todos-response", responseListener) // Use once to avoid memory leaks

  // 2. Request todos from main window *after* quickAddWindow is created
  console.log("Main: Sending get-todos-request to main window.")
  mainWindow.webContents.send("get-todos-request")

  // 4. Handle case where quick add finishes loading *before* todos response arrives
  quickAddWindow.webContents.on("did-finish-load", () => {
    console.log("Main: Quick Add finished loading.")
    // If we already received the todos, send them now
    if (todosForQuickAdd !== null) {
      console.log("Main: Sending initial-todos to quick add window after load.")
      quickAddWindow.webContents.send("initial-todos", todosForQuickAdd)
    }
    // Otherwise, the 'current-todos-response' listener will send them when they arrive
  })

  quickAddWindow.once("ready-to-show", () => {
    quickAddWindow.show()
  })

  quickAddWindow.on("blur", () => {
    if (quickAddWindow && !quickAddWindow.isDestroyed()) {
      console.log("Quick Add window lost focus, closing.")
      quickAddWindow.close() // Use close instead of destroy directly
    }
  })

  quickAddWindow.on("closed", () => {
    console.log("Quick Add window closed.")
    ipcMain.removeListener("current-todos-response", responseListener) // Clean up listener
    quickAddWindow = null // Allow garbage collection
  })
}

// --- IPC Handlers ---

ipcMain.handle("get-screen-dimensions", () => {
  const primaryDisplay = screen.getPrimaryDisplay()
  return primaryDisplay.size
})

ipcMain.handle("load-google-font", async (event, fontUrl) => {
  if (!fontUrl || !fontUrl.startsWith("https://fonts.googleapis.com/css")) {
    return { success: false, error: "Invalid Google Fonts URL format." }
  }
  console.log("Main: Received request to load font URL:", fontUrl)
  try {
    const cssContent = await fetchGoogleFontCSS(fontUrl)
    const fontFamilyMatch = cssContent.match(
      /font-family:\s*['"]?([^;'"]+)['"]?;/
    )
    const woff2UrlMatch = cssContent.match(
      /url\((https:\/\/fonts\.gstatic\.com\/s\/[^)]+\.woff2)\)/
    )

    if (!fontFamilyMatch || !woff2UrlMatch) {
      console.error("Main: Could not parse font-family or woff2 URL from CSS.")
      const woffUrlMatch = cssContent.match(
        /url\((https:\/\/fonts\.gstatic\.com\/s\/[^)]+\.woff)\)/
      )
      if (fontFamilyMatch && woffUrlMatch) {
        console.log("Main: Found WOFF fallback URL.")
        const fontFamily = fontFamilyMatch[1]
        const woffUrl = woffUrlMatch[1]
        const fontData = await fetchFontData(woffUrl)
        return {
          success: true,
          fontFamily: fontFamily,
          fontDataUrl: `data:font/woff;base64,${fontData}`,
        }
      }
      return {
        success: false,
        error:
          "Could not parse font details (WOFF2 or WOFF) from Google Fonts CSS.",
      }
    }

    const fontFamily = fontFamilyMatch[1]
    const woff2Url = woff2UrlMatch[1]
    const fontData = await fetchFontData(woff2Url)
    return {
      success: true,
      fontFamily: fontFamily,
      fontDataUrl: `data:font/woff2;base64,${fontData}`,
    }
  } catch (error) {
    console.error("Main: Error loading Google Font:", error)
    return { success: false, error: error.message || "Failed to load font." }
  }
})

// Helper: Fetch Google Font CSS
function fetchGoogleFontCSS(url) {
  return new Promise((resolve, reject) => {
    const options = {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36",
      },
    }
    https
      .get(url, options, (res) => {
        if (res.statusCode !== 200) {
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
      .on("error", (e) =>
        reject(new Error(`HTTPS request error for CSS: ${e.message}`))
      )
  })
}

// Helper: Fetch Font Data (WOFF/WOFF2) as Base64
function fetchFontData(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
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
        res.on("end", () =>
          resolve(Buffer.concat(dataChunks).toString("base64"))
        )
      })
      .on("error", (e) =>
        reject(new Error(`HTTPS request error for font file: ${e.message}`))
      )
  })
}

// Update Wallpaper
ipcMain.handle("update-wallpaper", async (event, imageDataUrl) => {
  console.log("Main: Updating wallpaper...") // Shortened log
  try {
    const { setWallpaper } = await import("wallpaper")
    const tempDir = os.tmpdir()
    const tempFilePath = path.join(tempDir, `todo-wallpaper-${Date.now()}.png`)
    const base64Data = imageDataUrl.replace(/^data:image\/png;base64,/, "")
    const imageBuffer = Buffer.from(base64Data, "base64")
    await fs.promises.writeFile(tempFilePath, imageBuffer)
    await setWallpaper(tempFilePath)
    console.log("Main: Wallpaper set successfully.")
    setTimeout(
      () =>
        fs.unlink(tempFilePath, (err) => {
          if (err) console.error("Error deleting temp file:", err)
        }),
      5000
    )
    return { success: true }
  } catch (error) {
    console.error("Main: Failed to set wallpaper:", error)
    return { success: false, error: error.message }
  }
})

// Listen for settings changes from main renderer
ipcMain.on("update-settings", (event, settings) => {
  console.log("Main received settings update:", settings)
  const trayModeChanged = appSettings.runInTray !== settings.runInTray
  const newShortcut = settings.quickAddShortcut || DEFAULT_SHORTCUT
  const shortcutChanged = appSettings.quickAddShortcut !== newShortcut
  appSettings = { ...appSettings, ...settings, quickAddShortcut: newShortcut }

  if (appSettings.runInTray && (trayModeChanged || shortcutChanged)) {
    if (trayModeChanged) createTray()
    registerGlobalShortcut()
    if (trayModeChanged && process.platform === "darwin") app.dock?.hide()
  } else if (!appSettings.runInTray && trayModeChanged) {
    destroyTray()
    unregisterCurrentShortcut()
    if (process.platform === "darwin") app.dock?.show()
    if (mainWindow && !mainWindow.isDestroyed() && !mainWindow.isVisible())
      showMainWindow()
  }
})

// Listen for task from quick add renderer
ipcMain.on("add-task-from-overlay", (event, taskText) => {
  console.log("Main received task from overlay:", taskText)
  // *** Send ONE message to renderer to add AND apply ***
  if (mainWindow && !mainWindow.isDestroyed()) {
    console.log("Sending add-task-and-apply to main window renderer...")
    mainWindow.webContents.send("add-task-and-apply", taskText) // Use the new channel name
  } else {
    console.warn("Main window not available to receive task.")
  }
  // Close the quick add window after sending
  if (quickAddWindow && !quickAddWindow.isDestroyed()) {
    quickAddWindow.close()
  }
})

// Listen for close request from quick add renderer
ipcMain.on("close-quick-add", () => {
  if (quickAddWindow && !quickAddWindow.isDestroyed()) {
    quickAddWindow.close()
  }
})

// --- App Lifecycle ---
app.whenReady().then(() => {
  createWindow() // Create main window first

  app.on("activate", () => {
    // macOS specific
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    } else if (
      mainWindow &&
      !mainWindow.isDestroyed() &&
      !mainWindow.isVisible()
    ) {
      // Check if destroyed
      showMainWindow()
    }
  })
})

app.on("window-all-closed", () => {
  // Only quit if NOT in tray mode OR if explicitly quitting (isQuitting flag)
  // On macOS, default is not to quit when windows close, so only quit if not in tray mode
  if (!appSettings.runInTray) {
    if (process.platform !== "darwin") {
      app.quit()
    }
  } else {
    console.log("Main window closed, but app running in tray.")
  }
})

app.on("before-quit", () => {
  console.log("App is about to quit...")
  isQuitting = true // Set flag explicitly before quit sequence starts
})

app.on("will-quit", () => {
  console.log("App will quit now.")
  // Clean up resources just before exiting
  unregisterGlobalShortcut() // Use the function that unregisters all known shortcuts by this app instance
  destroyTray()
})
