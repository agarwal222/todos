const {
  app,
  BrowserWindow,
  ipcMain,
  screen,
  Tray,
  Menu,
  globalShortcut,
} = require("electron") // Added Tray, Menu, globalShortcut
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
    if (appSettings.runInTray && !isQuitting) {
      event.preventDefault()
      mainWindow.hide()
      if (process.platform === "darwin") app.dock?.hide()
      console.log("Main window hidden to tray.")
    } else {
      mainWindow = null
    }
  })

  mainWindow.on("minimize", (event) => {
    if (appSettings.runInTray && process.platform !== "darwin") {
      event.preventDefault()
      mainWindow.hide()
      console.log("Main window hidden to tray on minimize.")
    }
  })

  mainWindow.on("closed", () => {
    mainWindow = null
    if (!appSettings.runInTray && process.platform !== "darwin") {
      app.quit()
    }
  })

  // mainWindow.webContents.openDevTools(); // Uncomment for debugging
}

// --- Tray Icon Creation ---
function createTray() {
  if (tray) return
  const iconPath = path.join(__dirname, "icon.png")
  if (!fs.existsSync(iconPath)) {
    console.error("Tray icon not found:", iconPath)
    return
  }
  tray = new Tray(iconPath)
  const contextMenu = Menu.buildFromTemplate([
    { label: "Show App", click: () => showMainWindow() },
    { type: "separator" },
    {
      label: "Quit",
      click: () => {
        isQuitting = true
        app.quit()
      },
    },
  ])
  tray.setToolTip("Todo Wallpaper App")
  tray.setContextMenu(contextMenu)
  tray.on("click", () => showMainWindow())
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
    mainWindow.show()
    mainWindow.focus()
    if (process.platform === "darwin") app.dock?.show()
  } else {
    console.log("Main window not available, recreating...")
    createWindow()
  }
}

// --- Global Shortcut ---
function registerGlobalShortcut() {
  const shortcutToRegister = appSettings.quickAddShortcut || DEFAULT_SHORTCUT
  if (currentShortcut && currentShortcut !== shortcutToRegister)
    unregisterCurrentShortcut()
  if (globalShortcut.isRegistered(shortcutToRegister)) {
    console.warn(`Shortcut ${shortcutToRegister} already registered. Skipping.`)
    if (!currentShortcut) currentShortcut = shortcutToRegister
    return
  }
  console.log(`Attempting to register shortcut: ${shortcutToRegister}`)
  const ret = globalShortcut.register(
    shortcutToRegister,
    createOrShowQuickAddWindow
  )
  if (!ret) {
    console.error("Failed to register global shortcut:", shortcutToRegister)
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send(
        "shortcut-error",
        `Failed to register shortcut: ${shortcutToRegister}. In use?`
      )
    }
    currentShortcut = null
  } else {
    console.log("Global shortcut registered:", shortcutToRegister)
    currentShortcut = shortcutToRegister
  }
}

function unregisterCurrentShortcut() {
  if (currentShortcut && globalShortcut.isRegistered(currentShortcut)) {
    globalShortcut.unregister(currentShortcut)
    console.log("Global shortcut unregistered:", currentShortcut)
  }
  currentShortcut = null
}

// --- Quick Add Window ---
function createOrShowQuickAddWindow() {
  if (quickAddWindow && !quickAddWindow.isDestroyed()) {
    quickAddWindow.focus()
    return
  }
  const primaryDisplay = screen.getPrimaryDisplay()
  const { width: screenWidth, height: screenHeight } = primaryDisplay.size
  const winWidth = 400,
    winHeight = 130
  quickAddWindow = new BrowserWindow({
    width: winWidth,
    height: winHeight,
    x: Math.round(screenWidth / 2 - winWidth / 2),
    y: Math.round(screenHeight * 0.2),
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
  quickAddWindow.once("ready-to-show", () => quickAddWindow.show())
  quickAddWindow.on("blur", () => {
    if (quickAddWindow && !quickAddWindow.isDestroyed()) quickAddWindow.close()
  })
  quickAddWindow.on("closed", () => {
    quickAddWindow = null
  })
}

// --- IPC Handlers ---

ipcMain.handle("get-screen-dimensions", () => screen.getPrimaryDisplay().size)

ipcMain.handle("load-google-font", async (event, fontUrl) => {
  // ... (keep font loading logic as is) ...
  if (!fontUrl || !fontUrl.startsWith("https://fonts.googleapis.com/css")) {
    return { success: false, error: "Invalid Google Fonts URL format." }
  }
  try {
    const cssContent = await fetchGoogleFontCSS(fontUrl)
    const fontFamilyMatch = cssContent.match(
      /font-family:\s*['"]?([^;'"]+)['"]?;/
    )
    const woff2UrlMatch = cssContent.match(
      /url\((https:\/\/fonts\.gstatic\.com\/s\/[^)]+\.woff2)\)/
    )
    if (!fontFamilyMatch || !woff2UrlMatch) {
      const woffUrlMatch = cssContent.match(
        /url\((https:\/\/fonts\.gstatic\.com\/s\/[^)]+\.woff)\)/
      )
      if (fontFamilyMatch && woffUrlMatch) {
        const fontData = await fetchFontData(woffUrlMatch[1])
        return {
          success: true,
          fontFamily: fontFamilyMatch[1],
          fontDataUrl: `data:font/woff;base64,${fontData}`,
        }
      }
      return {
        success: false,
        error: "Could not parse font details (WOFF2 or WOFF).",
      }
    }
    const fontData = await fetchFontData(woff2UrlMatch[1])
    return {
      success: true,
      fontFamily: fontFamilyMatch[1],
      fontDataUrl: `data:font/woff2;base64,${fontData}`,
    }
  } catch (error) {
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
        /* ... handle redirects, errors, data ... */
        if (res.statusCode !== 200) {
          if (res.statusCode === 301 || res.statusCode === 302) {
            return fetchGoogleFontCSS(res.headers.location)
              .then(resolve)
              .catch(reject)
          }
          return reject(new Error(`Failed CSS fetch: Status ${res.statusCode}`))
        }
        let data = ""
        res.on("data", (c) => (data += c))
        res.on("end", () => resolve(data))
      })
      .on("error", (e) => reject(new Error(`CSS Request Error: ${e.message}`)))
  })
}
// Helper: Fetch Font Data
function fetchFontData(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        /* ... handle redirects, errors, data ... */
        if (res.statusCode !== 200) {
          if (res.statusCode === 301 || res.statusCode === 302) {
            return fetchFontData(res.headers.location)
              .then(resolve)
              .catch(reject)
          }
          return reject(
            new Error(`Failed font fetch: Status ${res.statusCode}`)
          )
        }
        const data = []
        res.on("data", (c) => data.push(c))
        res.on("end", () => resolve(Buffer.concat(data).toString("base64")))
      })
      .on("error", (e) => reject(new Error(`Font Request Error: ${e.message}`)))
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
  createWindow()
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
    else if (mainWindow && !mainWindow.isDestroyed() && !mainWindow.isVisible())
      showMainWindow()
  })
})

app.on("window-all-closed", () => {
  if (!appSettings.runInTray || process.platform !== "darwin") {
    // Quit if not in tray mode, OR if on macOS (where closing last window doesn't quit by default)
    // This behavior might need adjustment based on desired macOS tray interaction
    if (process.platform !== "darwin") {
      app.quit()
    } else if (!appSettings.runInTray) {
      // On macOS, only quit if not in tray mode AND last window closed
      app.quit()
    }
  } else {
    console.log("Main window closed, but app running in tray.")
  }
})

app.on("will-quit", () => {
  console.log("App quitting...")
  isQuitting = true
  unregisterGlobalShortcut() // Unregister all shortcuts on quit
  destroyTray()
})
