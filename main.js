// main.js
const {
  app,
  BrowserWindow,
  ipcMain,
  screen,
  Tray,
  Menu,
  globalShortcut,
  dialog,
} = require("electron")
const path = require("node:path")
const fs = require("node:fs")
const os = require("node:os")
const https = require("node:https")
const fontList = require("font-list")

// Keep references
let mainWindow = null
let tray = null
let quickAddWindow = null
let isQuitting = false
let appSettings = {
  runInTray: false,
  quickAddShortcut: "CommandOrControl+Shift+N",
  quickAddTranslucent: process.platform === "darwin",
}
let currentShortcut = null

const DEFAULT_SHORTCUT = "CommandOrControl+Shift+N"
const QUICK_ADD_SOLID_BG = "#2E2E30"
const QUICK_ADD_VIBRANCY_FALLBACK_BG = "rgba(46, 46, 48, 0.9)"
const QUICK_ADD_MIN_HEIGHT = 100 // Minimum height for the window
const QUICK_ADD_MAX_HEIGHT_FACTOR = 1.5 // Allow window to be up to 1.5x screen height (should be clamped by screen size anyway)

// --- Main Window Creation ---
// ... (createWindow remains the same) ...
function createWindow() {
  const primaryDisplay = screen.getPrimaryDisplay()
  const screenDimensions = primaryDisplay.size
  const titleBarOverlayOptions =
    process.platform === "darwin"
      ? { height: 30 }
      : { color: "#00000000", symbolColor: "#a0a0a0", height: 30 }
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
    show: false,
    frame: false,
    backgroundColor: "#111827",
  })
  mainWindow.loadFile("index.html")
  mainWindow.webContents.on("did-finish-load", () => {
    mainWindow.webContents.send("screen-dimensions", screenDimensions)
    mainWindow.webContents.send("window-state-changed", {
      isMaximized: mainWindow.isMaximized(),
      isFullScreen: mainWindow.isFullScreen(),
    })
    setTimeout(() => {
      if (mainWindow && !mainWindow.isDestroyed())
        mainWindow.webContents.send("initial-settings", appSettings)
    }, 100)
    mainWindow.show()
  })
  mainWindow.on("maximize", () => {
    if (mainWindow && !mainWindow.isDestroyed())
      mainWindow.webContents.send("window-state-changed", {
        isMaximized: true,
        isFullScreen: mainWindow.isFullScreen(),
      })
  })
  mainWindow.on("unmaximize", () => {
    if (mainWindow && !mainWindow.isDestroyed())
      mainWindow.webContents.send("window-state-changed", {
        isMaximized: false,
        isFullScreen: mainWindow.isFullScreen(),
      })
  })
  mainWindow.on("enter-full-screen", () => {
    if (mainWindow && !mainWindow.isDestroyed())
      mainWindow.webContents.send("window-state-changed", {
        isMaximized: mainWindow.isMaximized(),
        isFullScreen: true,
      })
  })
  mainWindow.on("leave-full-screen", () => {
    if (mainWindow && !mainWindow.isDestroyed())
      mainWindow.webContents.send("window-state-changed", {
        isMaximized: mainWindow.isMaximized(),
        isFullScreen: false,
      })
  })
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
    if (!appSettings.runInTray || process.platform !== "darwin") {
      app.quit()
    }
  }) /* mainWindow.webContents.openDevTools(); */
}

// --- Tray Icon Creation ---
// ... (createTray remains the same) ...
function createTray() {
  if (tray) return
  const iconName =
    process.platform === "win32" ? "icon.ico" : "iconTemplate.png"
  const iconPath = path.join(__dirname, "assets", iconName)
  try {
    tray = new Tray(iconPath)
    if (process.platform === "darwin") tray.setIgnoreDoubleClickEvents(true)
  } catch (err) {
    console.error("Tray icon creation failed:", err)
    try {
      const fallbackPath = path.join(__dirname, "assets", "icon.png")
      if (fs.existsSync(fallbackPath)) {
        tray = new Tray(fallbackPath)
        console.log("Used fallback tray icon.")
      } else {
        console.error("Fallback tray icon not found.")
        return
      }
    } catch (fallbackErr) {
      console.error("Fallback tray icon creation also failed:", fallbackErr)
      return
    }
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
  tray.on("click", () => showMainWindow())
  console.log("System tray icon created.")
}

// --- Remove Tray Icon ---
// ... (destroyTray remains the same) ...
function destroyTray() {
  if (tray) {
    tray.destroy()
    tray = null
    console.log("System tray icon destroyed.")
  }
}

// --- Show Main Window ---
// ... (showMainWindow remains the same) ...
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
// ... (registerGlobalShortcut, unregisterCurrentShortcut remain the same) ...
function registerGlobalShortcut() {
  const shortcutToRegister = appSettings.quickAddShortcut || DEFAULT_SHORTCUT
  if (currentShortcut && currentShortcut !== shortcutToRegister)
    unregisterCurrentShortcut()
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
      if (mainWindow && !mainWindow.isDestroyed())
        mainWindow.webContents.send(
          "shortcut-error",
          `Failed to register shortcut: ${shortcutToRegister}. It is in use by another application.`
        )
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
      "(Unknown reason)"
    )
    if (mainWindow && !mainWindow.isDestroyed())
      mainWindow.webContents.send(
        "shortcut-error",
        `Failed to register shortcut: ${shortcutToRegister}.`
      )
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
    quickAddWindow.focus()
    return
  }
  if (!mainWindow || mainWindow.isDestroyed()) {
    dialog.showErrorBox("Error", "Main application window is not available.")
    return
  }

  const primaryDisplay = screen.getPrimaryDisplay()
  const { width: screenWidth, height: screenHeight } = primaryDisplay.size // Get screen height
  const winWidth = 600
  // Start with a minimal height, renderer will tell us the correct height
  const initialHeight = QUICK_ADD_MIN_HEIGHT
  const isMac = process.platform === "darwin"
  const useTranslucency = appSettings.quickAddTranslucent
  let bgColor = QUICK_ADD_SOLID_BG
  let transparent = false
  let vibrancyType = null

  if (useTranslucency) {
    if (isMac) {
      bgColor = "#00000000"
      vibrancyType = "hud"
    } else {
      bgColor = QUICK_ADD_VIBRANCY_FALLBACK_BG
      transparent = true
    }
  }

  let windowOptions = {
    width: winWidth,
    height: initialHeight, // Start small
    x: Math.round(screenWidth / 2 - winWidth / 2),
    y: Math.round(
      primaryDisplay.workArea.y + primaryDisplay.workArea.height * 0.15
    ),
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
    transparent: transparent,
    backgroundColor: bgColor,
    ...(vibrancyType && { vibrancy: vibrancyType }),
    useContentSize: true, // Make height relative to content area
  }

  quickAddWindow = new BrowserWindow(windowOptions)
  quickAddWindow.loadFile(path.join(__dirname, "quick-add.html"))

  let todosForQuickAdd = null
  let quickAddWindowReady = false
  const responseListener = (event, todos) => {
    todosForQuickAdd = todos
    ipcMain.removeListener("current-todos-response", responseListener)
    if (
      quickAddWindowReady &&
      quickAddWindow &&
      !quickAddWindow.isDestroyed()
    ) {
      quickAddWindow.webContents.send("initial-todos", todosForQuickAdd)
    }
  }
  ipcMain.once("current-todos-response", responseListener)
  mainWindow.webContents.send("get-todos-request")

  quickAddWindow.webContents.on("did-finish-load", () => {
    quickAddWindowReady = true
    if (todosForQuickAdd !== null) {
      quickAddWindow.webContents.send("initial-todos", todosForQuickAdd)
    }
    quickAddWindow.webContents.send("quickadd-settings", {
      translucent: appSettings.quickAddTranslucent,
    })
    // Don't show yet, wait for resize IPC
    // quickAddWindow.show();
  })
  quickAddWindow.on("blur", () => {
    if (quickAddWindow && !quickAddWindow.isDestroyed()) quickAddWindow.close()
  })
  quickAddWindow.on("closed", () => {
    ipcMain.removeListener("current-todos-response", responseListener)
    quickAddWindow = null
  })
}

// --- IPC Handlers ---
// ... (get-screen-dimensions, get-system-fonts, font loading helpers, update-wallpaper remain the same) ...
ipcMain.handle("get-screen-dimensions", () => screen.getPrimaryDisplay().size)
ipcMain.handle("get-system-fonts", async () => {
  try {
    const fonts = await fontList.getFonts({ disableQuoting: true })
    const filteredFonts = fonts.filter(
      (font) =>
        !/System|UI|Display|Emoji|Icons|Symbols|Logo|Brands|Private|Wingdings|Webdings/i.test(
          font
        ) && !/^\./.test(font)
    )
    return [...new Set(filteredFonts)].sort()
  } catch (error) {
    console.error("Failed to get system fonts:", error)
    return []
  }
})
ipcMain.handle(
  "load-google-font-by-name",
  async (event, { fontName, fontWeight }) => {
    if (!fontName) return { success: false, error: "Font name is required." }
    const requestedWeight = fontWeight || "400"
    const weightsToRequest = [...new Set([requestedWeight, "400", "700"])].join(
      ";"
    )
    const formattedName = fontName.replace(/ /g, "+")
    const fontUrl = `https://fonts.googleapis.com/css2?family=${formattedName}:wght@${weightsToRequest}&display=swap`
    console.log("Main: Loading Google Font CSS from:", fontUrl)
    try {
      const cssContent = await fetchGoogleFontCSS(fontUrl)
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
      if (availableFonts.length === 0) {
        const woffRegex =
          /@font-face\s*{[^{}]*?font-family:\s*['"]?([^;'"]+)['"]?[^{}]*?font-weight:\s*(\d+)[^{}]*?url\((https:\/\/fonts\.gstatic\.com\/s\/[^)]+\.woff)\)[^{}]*?}/gs
        while ((match = woffRegex.exec(cssContent)) !== null) {
          availableFonts.push({
            family: match[1],
            weight: match[2],
            url: match[3],
            format: "woff",
          })
        }
      }
      if (availableFonts.length === 0)
        return { success: false, error: "Could not parse font details." }
      let bestMatch = availableFonts.find((f) => f.weight === requestedWeight)
      if (!bestMatch) {
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
        fontFamily: bestMatch.family,
        fontWeight: bestMatch.weight,
        fontDataUrl: `data:${mimeType};base64,${fontData}`,
      }
    } catch (error) {
      console.error("Main: Google Font load error:", error)
      return { success: false, error: error.message || "Failed font load." }
    }
  }
)
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
function fetchFontData(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        if (
          res.statusCode >= 300 &&
          res.statusCode < 400 &&
          res.headers.location
        ) {
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
ipcMain.handle("update-wallpaper", async (event, imageDataUrl) => {
  console.log("Main: Updating wallpaper...")
  try {
    const { setWallpaper } = await import("wallpaper")
    const tempDir = os.tmpdir()
    const tempFilePath = path.join(
      tempDir,
      `visido-wallpaper-${Date.now()}.png`
    )
    const base64Data = imageDataUrl.replace(/^data:image\/png;base64,/, "")
    const imageBuffer = Buffer.from(base64Data, "base64")
    await fs.promises.mkdir(tempDir, { recursive: true })
    await fs.promises.writeFile(tempFilePath, imageBuffer)
    console.log("Main: Wrote temp wallpaper file to:", tempFilePath)
    await setWallpaper(tempFilePath, { scale: "auto" })
    console.log("Main: Wallpaper set command issued.")
    setTimeout(() => {
      fs.unlink(tempFilePath, (err) => {
        if (err) console.error("Error deleting temp wallpaper file:", err)
        else console.log("Main: Deleted temp wallpaper file:", tempFilePath)
      })
    }, 10000)
    return { success: true }
  } catch (error) {
    console.error("Main: Failed to set wallpaper:", error)
    return { success: false, error: error.message }
  }
})
ipcMain.on("update-settings", (event, settings) => {
  console.log("Main received settings update:", settings)
  const trayModeChanged =
    typeof settings.runInTray === "boolean" &&
    appSettings.runInTray !== settings.runInTray
  const newShortcut =
    settings.quickAddShortcut ||
    appSettings.quickAddShortcut ||
    DEFAULT_SHORTCUT
  const shortcutChanged = newShortcut !== appSettings.quickAddShortcut
  const translucencyChanged =
    typeof settings.quickAddTranslucent === "boolean" &&
    appSettings.quickAddTranslucent !== settings.quickAddTranslucent
  appSettings = { ...appSettings, ...settings, quickAddShortcut: newShortcut }
  if (trayModeChanged) {
    if (appSettings.runInTray) {
      createTray()
      registerGlobalShortcut()
      if (process.platform === "darwin") app.dock?.hide()
    } else {
      destroyTray()
      unregisterCurrentShortcut()
      if (process.platform === "darwin") app.dock?.show()
      if (mainWindow && !mainWindow.isDestroyed() && !mainWindow.isVisible())
        showMainWindow()
    }
  } else if (appSettings.runInTray && shortcutChanged) {
    registerGlobalShortcut()
  }
  if (translucencyChanged && quickAddWindow && !quickAddWindow.isDestroyed()) {
    console.log("Quick Add translucency changed, closing current window.")
    quickAddWindow.close()
  }
})
ipcMain.on(
  "setting-update-error",
  (event, { setting, error, fallbackValue }) => {
    console.warn(
      `Setting update failed for '${setting}': ${error}. Falling back to ${fallbackValue}`
    )
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send("force-setting-update", {
        [setting]: fallbackValue,
      })
    }
  }
)
ipcMain.on("add-task-from-overlay", (event, taskText) => {
  console.log("Main received task from overlay:", taskText)
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send("add-task-and-apply", taskText)
  } else {
    console.warn("Main window not available for task.")
  }
  if (quickAddWindow && !quickAddWindow.isDestroyed()) quickAddWindow.close()
})
ipcMain.on("close-quick-add", () => {
  if (quickAddWindow && !quickAddWindow.isDestroyed()) quickAddWindow.close()
})
ipcMain.on("window-minimize", (event) => {
  BrowserWindow.fromWebContents(event.sender)?.minimize()
})
ipcMain.on("window-maximize-restore", (event) => {
  const win = BrowserWindow.fromWebContents(event.sender)
  if (win) {
    if (win.isMaximized()) win.unmaximize()
    else win.maximize()
  }
})
ipcMain.on("window-close", (event) => {
  BrowserWindow.fromWebContents(event.sender)?.close()
})

// ** NEW: Listen for resize request from Quick Add **
ipcMain.on("resize-quick-add", (event, { height }) => {
  if (quickAddWindow && !quickAddWindow.isDestroyed()) {
    try {
      const currentBounds = quickAddWindow.getBounds()
      const maxHeight = Math.round(
        screen.getPrimaryDisplay().workArea.height * QUICK_ADD_MAX_HEIGHT_FACTOR
      ) // Max height constraint
      const newHeight = Math.max(
        QUICK_ADD_MIN_HEIGHT,
        Math.min(Math.round(height), maxHeight)
      ) // Clamp height

      console.log(`Resizing Quick Add window to height: ${newHeight}`)
      quickAddWindow.setSize(currentBounds.width, newHeight, false) // Resize (no animation)

      // Only show *after* the first resize attempt
      if (!quickAddWindow.isVisible()) {
        quickAddWindow.show()
        quickAddWindow.focus() // Ensure it gets focus
      }
    } catch (err) {
      console.error("Failed to resize quick add window:", err)
    }
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
