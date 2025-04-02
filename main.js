// main.js
const {
  app,
  BrowserWindow,
  ipcMain,
  screen,
  Tray,
  Menu,
  globalShortcut,
  dialog, // Added for potential error messages
} = require("electron")
const path = require("node:path")
const fs = require("node:fs")
const os = require("node:os")
const https = require("node:https")
const fontList = require("font-list") // Added font-list

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
    frame: false,
  })

  mainWindow.loadFile("index.html")

  // Send screen dimensions and initial window state once ready
  mainWindow.webContents.on("did-finish-load", () => {
    mainWindow.webContents.send("screen-dimensions", screenDimensions)
    mainWindow.webContents.send("window-state-changed", {
      isMaximized: mainWindow.isMaximized(),
      isFullScreen: mainWindow.isFullScreen(),
    })
    mainWindow.show()
  })

  // --- Send state changes to renderer ---
  mainWindow.on("maximize", () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send("window-state-changed", {
        isMaximized: true,
        isFullScreen: mainWindow.isFullScreen(),
      })
    }
  })
  mainWindow.on("unmaximize", () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send("window-state-changed", {
        isMaximized: false,
        isFullScreen: mainWindow.isFullScreen(),
      })
    }
  })
  mainWindow.on("enter-full-screen", () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send("window-state-changed", {
        isMaximized: mainWindow.isMaximized(),
        isFullScreen: true,
      })
    }
  })
  mainWindow.on("leave-full-screen", () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send("window-state-changed", {
        isMaximized: mainWindow.isMaximized(),
        isFullScreen: false,
      })
    }
  })

  // --- Modified Close/Minimize Behavior ---
  mainWindow.on("close", (event) => {
    if (appSettings.runInTray && !isQuitting) {
      event.preventDefault()
      mainWindow.hide()
      if (process.platform === "darwin") {
        app.dock?.hide()
      }
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
  if (tray) {
    console.log("Tray already exists.")
    return
  }
  const iconName =
    process.platform === "win32" ? "icon.ico" : "iconTemplate.png" // Use template icon on Mac
  const iconPath = path.join(__dirname, "assets", iconName)

  if (!fs.existsSync(iconPath)) {
    console.error(
      "Tray icon not found at:",
      iconPath,
      "- Tray creation might fail visually."
    )
    // Attempt to create anyway, might use default or be invisible
    try {
      tray = new Tray(path.join(__dirname, "assets", "icon.png")) // Fallback generic png
    } catch (err) {
      console.error("Fallback tray icon creation failed:", err)
      return // Exit if cannot create tray
    }
  } else {
    tray = new Tray(iconPath)
  }

  // macOS specific: ensure template image works correctly
  if (process.platform === "darwin") {
    tray.setImage(iconPath) // Set the template image
    tray.setIgnoreDoubleClickEvents(true) // Use single click on Mac too
  }

  const contextMenu = Menu.buildFromTemplate([
    { label: "Show Visido", click: () => showMainWindow() },
    { type: "separator" },
    {
      label: "Quit Visido",
      click: () => {
        isQuitting = true
        app.quit()
      },
    },
  ])

  tray.setToolTip("Visido - Wallpaper Tasks")
  tray.setContextMenu(contextMenu)

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
    mainWindow.show()
    mainWindow.focus()
    if (process.platform === "darwin") {
      app.dock?.show()
    }
  } else {
    console.log("Main window not available, recreating...")
    createWindow()
  }
}

// --- Global Shortcut ---
function registerGlobalShortcut() {
  const shortcutToRegister = appSettings.quickAddShortcut || DEFAULT_SHORTCUT

  if (currentShortcut && currentShortcut !== shortcutToRegister) {
    unregisterCurrentShortcut()
  }

  if (globalShortcut.isRegistered(shortcutToRegister)) {
    if (currentShortcut === shortcutToRegister) {
      console.log(
        `Shortcut ${shortcutToRegister} already registered by this app instance. Skipping.`
      )
      return
    } else {
      console.error(
        `Failed to register global shortcut: ${shortcutToRegister}. It is already in use by another application.`
      )
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send(
          "shortcut-error",
          `Failed to register shortcut: ${shortcutToRegister}. It is in use by another application.`
        )
      }
      currentShortcut = null
      return
    }
  }

  console.log(`Attempting to register shortcut: ${shortcutToRegister}`)
  const ret = globalShortcut.register(shortcutToRegister, () => {
    console.log(`Shortcut ${shortcutToRegister} pressed`)
    createOrShowQuickAddWindow()
  })

  if (!ret) {
    console.error(
      "Failed to register global shortcut:",
      shortcutToRegister,
      "(Unknown reason, possibly invalid format or system issue)"
    )
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send(
        "shortcut-error",
        `Failed to register shortcut: ${shortcutToRegister}. Invalid format or system issue.`
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
  } else if (currentShortcut) {
    console.warn(
      "Attempted to unregister shortcut, but OS reported it was not registered:",
      currentShortcut
    )
  }
  currentShortcut = null
}

// --- Quick Add Window ---
function createOrShowQuickAddWindow() {
  if (quickAddWindow && !quickAddWindow.isDestroyed()) {
    console.log("Quick Add window already open. Focusing.")
    quickAddWindow.focus()
    return
  }

  if (!mainWindow || mainWindow.isDestroyed()) {
    console.error("Cannot open Quick Add: Main window not available.")
    dialog.showErrorBox("Error", "Main application window is not available.")
    return
  }

  const primaryDisplay = screen.getPrimaryDisplay()
  const { width: screenWidth, height: screenHeight } = primaryDisplay.size
  const winWidth = 500
  const winHeight = 400

  quickAddWindow = new BrowserWindow({
    width: winWidth,
    height: winHeight,
    x: Math.round(screenWidth / 2 - winWidth / 2),
    y: Math.round(screenHeight * 0.15),
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
    visualEffectState: "active", // Mac vibrancy
    backgroundColor: "#00000000", // Transparent background for vibrancy
    ...(process.platform === "darwin" && { vibrancy: "under-window" }), // macOS vibrancy
  })

  // More aggressive transparency on Windows if needed (may cause issues)
  // if (process.platform === 'win32') {
  //   quickAddWindow.setOpacity(0.95); // Slight transparency
  // }

  quickAddWindow.loadFile(path.join(__dirname, "quick-add.html"))

  let todosForQuickAdd = null
  let quickAddWindowReady = false // Flag to track if quickAddWindow finished loading

  const responseListener = (event, todos) => {
    console.log("Main: Received current-todos-response from main window.")
    todosForQuickAdd = todos
    ipcMain.removeListener("current-todos-response", responseListener)

    if (
      quickAddWindowReady &&
      quickAddWindow &&
      !quickAddWindow.isDestroyed()
    ) {
      console.log("Main: Sending initial-todos to quick add window now.")
      quickAddWindow.webContents.send("initial-todos", todosForQuickAdd)
    }
  }
  ipcMain.once("current-todos-response", responseListener)

  console.log("Main: Sending get-todos-request to main window.")
  mainWindow.webContents.send("get-todos-request")

  quickAddWindow.webContents.on("did-finish-load", () => {
    console.log("Main: Quick Add finished loading.")
    quickAddWindowReady = true // Set flag
    if (todosForQuickAdd !== null) {
      console.log("Main: Sending initial-todos to quick add window after load.")
      quickAddWindow.webContents.send("initial-todos", todosForQuickAdd)
    }
    quickAddWindow.show() // Show after content is loaded
  })

  // Removed ready-to-show listener as we now show on did-finish-load

  quickAddWindow.on("blur", () => {
    if (quickAddWindow && !quickAddWindow.isDestroyed()) {
      console.log("Quick Add window lost focus, closing.")
      quickAddWindow.close()
    }
  })

  quickAddWindow.on("closed", () => {
    console.log("Quick Add window closed.")
    ipcMain.removeListener("current-todos-response", responseListener)
    quickAddWindow = null
  })
}

// --- IPC Handlers ---

ipcMain.handle("get-screen-dimensions", () => screen.getPrimaryDisplay().size)

// ** NEW: Get System Fonts **
ipcMain.handle("get-system-fonts", async () => {
  try {
    const fonts = await fontList.getFonts({ disableQuoting: true })
    // Basic filtering for common system/UI fonts that might not be desirable
    const filteredFonts = fonts.filter(
      (font) =>
        !/System|UI|Display|Emoji|Icons|Symbols|Logo|Brands|Private|Wingdings|Webdings/i.test(
          font
        ) && !/^\./.test(font) // Remove hidden fonts starting with '.'
    )
    return [...new Set(filteredFonts)].sort() // Remove duplicates and sort
  } catch (error) {
    console.error("Failed to get system fonts:", error)
    return []
  }
})

// ** UPDATED: Load Google Font By Name **
ipcMain.handle(
  "load-google-font-by-name",
  async (event, { fontName, fontWeight }) => {
    if (!fontName) {
      return { success: false, error: "Font name is required." }
    }
    const requestedWeight = fontWeight || "400"
    // Request multiple weights: requested, 400 (regular), 700 (bold) for flexibility
    const weightsToRequest = [...new Set([requestedWeight, "400", "700"])].join(
      ";"
    )
    const formattedName = fontName.replace(/ /g, "+")
    const fontUrl = `https://fonts.googleapis.com/css2?family=${formattedName}:wght@${weightsToRequest}&display=swap`

    console.log("Main: Loading Google Font CSS from:", fontUrl)
    try {
      const cssContent = await fetchGoogleFontCSS(fontUrl)
      // console.log("CSS Content:", cssContent); // Debugging

      // Regex to find font-family and woff2 url within @font-face blocks, capturing weight
      const fontFaceRegex =
        /@font-face\s*{[^{}]*?font-family:\s*['"]?([^;'"]+)['"]?[^{}]*?font-weight:\s*(\d+)[^{}]*?url\((https:\/\/fonts\.gstatic\.com\/s\/[^)]+\.woff2)\)[^{}]*?}/gs
      let match
      const availableFonts = []

      while ((match = fontFaceRegex.exec(cssContent)) !== null) {
        availableFonts.push({
          family: match[1],
          weight: match[2],
          url: match[3],
        })
      }

      // console.log("Available Fonts Parsed:", availableFonts); // Debugging

      if (availableFonts.length === 0) {
        // Fallback for WOFF (less common now)
        const woffRegex =
          /@font-face\s*{[^{}]*?font-family:\s*['"]?([^;'"]+)['"]?[^{}]*?font-weight:\s*(\d+)[^{}]*?url\((https:\/\/fonts\.gstatic\.com\/s\/[^)]+\.woff)\)[^{}]*?}/gs
        while ((match = woffRegex.exec(cssContent)) !== null) {
          availableFonts.push({
            family: match[1],
            weight: match[2],
            url: match[3],
            format: "woff", // Indicate format
          })
        }
        // console.log("Available WOFF Fonts Parsed:", availableFonts); // Debugging
      }

      if (availableFonts.length === 0) {
        return { success: false, error: "Could not parse font details." }
      }

      // Find the best match for the requested weight
      let bestMatch = availableFonts.find((f) => f.weight === requestedWeight)
      if (!bestMatch) {
        // Fallback to 400 or the first available if 400 isn't there
        bestMatch =
          availableFonts.find((f) => f.weight === "400") || availableFonts[0]
        console.warn(
          `Requested weight ${requestedWeight} not found, using ${bestMatch.weight}`
        )
      }

      console.log("Best font match:", bestMatch)
      const fontData = await fetchFontData(bestMatch.url)
      const mimeType = bestMatch.format === "woff" ? "font/woff" : "font/woff2"

      return {
        success: true,
        fontFamily: bestMatch.family, // Return the actual family name from CSS
        fontWeight: bestMatch.weight, // Return the actual loaded weight
        fontDataUrl: `data:${mimeType};base64,${fontData}`,
      }
    } catch (error) {
      console.error("Main: Google Font load error:", error)
      return { success: false, error: error.message || "Failed font load." }
    }
  }
)

// Helper: Fetch Google Font CSS (handles redirects)
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
        if (
          res.statusCode >= 300 &&
          res.statusCode < 400 &&
          res.headers.location
        ) {
          console.log("Following redirect to:", res.headers.location)
          return fetchGoogleFontCSS(res.headers.location)
            .then(resolve)
            .catch(reject)
        }
        if (res.statusCode !== 200) {
          return reject(new Error(`Failed CSS fetch: Status ${res.statusCode}`))
        }
        let data = ""
        res.on("data", (c) => (data += c))
        res.on("end", () => resolve(data))
      })
      .on("error", (e) => reject(new Error(`CSS Request Error: ${e.message}`)))
  })
}

// Helper: Fetch Font Data (handles redirects)
function fetchFontData(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        if (
          res.statusCode >= 300 &&
          res.statusCode < 400 &&
          res.headers.location
        ) {
          console.log(
            "Following redirect for font data to:",
            res.headers.location
          )
          return fetchFontData(res.headers.location).then(resolve).catch(reject)
        }
        if (res.statusCode !== 200) {
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
  console.log("Main: Updating wallpaper...")
  try {
    // Dynamic import for ESM module 'wallpaper'
    const { setWallpaper } = await import("wallpaper")
    const tempDir = os.tmpdir()
    const tempFilePath = path.join(
      tempDir,
      `visido-wallpaper-${Date.now()}.png`
    )
    const base64Data = imageDataUrl.replace(/^data:image\/png;base64,/, "")
    const imageBuffer = Buffer.from(base64Data, "base64")

    // Ensure temp directory exists (though os.tmpdir() usually does)
    await fs.promises.mkdir(tempDir, { recursive: true })

    await fs.promises.writeFile(tempFilePath, imageBuffer)
    console.log("Main: Wrote temp wallpaper file to:", tempFilePath)

    await setWallpaper(tempFilePath, {
      scale: "auto", // Let the library decide best scale
      // screen: 'all' // Or specify a screen if needed
    })

    console.log("Main: Wallpaper set command issued.")

    // Cleanup the temp file after a short delay
    setTimeout(() => {
      fs.unlink(tempFilePath, (err) => {
        if (err) console.error("Error deleting temp wallpaper file:", err)
        else console.log("Main: Deleted temp wallpaper file:", tempFilePath)
      })
    }, 10000) // Increased delay slightly

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

  if (appSettings.runInTray) {
    if (trayModeChanged) createTray()
    if (trayModeChanged || shortcutChanged) registerGlobalShortcut()
    if (trayModeChanged && process.platform === "darwin") app.dock?.hide()
  } else if (!appSettings.runInTray && trayModeChanged) {
    destroyTray()
    unregisterCurrentShortcut()
    if (process.platform === "darwin") app.dock?.show()
    if (mainWindow && !mainWindow.isDestroyed() && !mainWindow.isVisible())
      showMainWindow()
  } else if (appSettings.runInTray && shortcutChanged) {
    // Handle shortcut changes even if tray mode didn't change
    registerGlobalShortcut()
  }
})

// Listen for task from quick add renderer
ipcMain.on("add-task-from-overlay", (event, taskText) => {
  console.log("Main received task from overlay:", taskText)
  if (mainWindow && !mainWindow.isDestroyed()) {
    console.log("Sending add-task-and-apply to main window renderer...")
    mainWindow.webContents.send("add-task-and-apply", taskText)
  } else {
    console.warn("Main window not available for task.")
  }
  if (quickAddWindow && !quickAddWindow.isDestroyed()) quickAddWindow.close()
})

// Listen for close request from quick add renderer
ipcMain.on("close-quick-add", () => {
  if (quickAddWindow && !quickAddWindow.isDestroyed()) quickAddWindow.close()
})

// Handle Window Control Actions from Renderer
ipcMain.on("window-minimize", (event) => {
  const win = BrowserWindow.fromWebContents(event.sender)
  console.log("Main: Received minimize request")
  win?.minimize()
})

ipcMain.on("window-maximize-restore", (event) => {
  const win = BrowserWindow.fromWebContents(event.sender)
  console.log("Main: Received maximize/restore request")
  if (win) {
    if (win.isMaximized()) win.unmaximize()
    else win.maximize()
  }
})

ipcMain.on("window-close", (event) => {
  const win = BrowserWindow.fromWebContents(event.sender)
  console.log("Main: Received close request")
  win?.close()
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
    app.quit()
  } else {
    console.log("Main window closed, app running in tray.")
  }
})

app.on("before-quit", () => {
  isQuitting = true
})

app.on("will-quit", () => {
  console.log("App quitting...")
  unregisterCurrentShortcut()
  destroyTray()
})
