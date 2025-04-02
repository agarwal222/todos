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
  quickAddTranslucent: process.platform === "darwin", // Default to true on Mac, false otherwise
}
let currentShortcut = null

const DEFAULT_SHORTCUT = "CommandOrControl+Shift+N"

// --- Main Window Creation ---
function createWindow() {
  const primaryDisplay = screen.getPrimaryDisplay()
  const screenDimensions = primaryDisplay.size

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
    titleBarStyle: "hidden", // Needed for frameless window controls space
    titleBarOverlay: {
      // Add minimal overlay for traffic lights space on Mac
      color: "#00000000", // Transparent
      symbolColor: "#a0a0a0", // Grey symbols
      height: 30, // Adjust as needed
    },
  })

  mainWindow.loadFile("index.html")

  mainWindow.webContents.on("did-finish-load", () => {
    mainWindow.webContents.send("screen-dimensions", screenDimensions)
    mainWindow.webContents.send("window-state-changed", {
      isMaximized: mainWindow.isMaximized(),
      isFullScreen: mainWindow.isFullScreen(),
    })
    // Send initial settings *after* renderer might have loaded its state
    setTimeout(() => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send("initial-settings", appSettings)
      }
    }, 100) // Small delay
    mainWindow.show()
  })

  // Window state change listeners... (remain the same)
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
  })

  // mainWindow.webContents.openDevTools();
}

// --- Tray Icon Creation ---
function createTray() {
  if (tray) return
  const iconName =
    process.platform === "win32" ? "icon.ico" : "iconTemplate.png"
  const iconPath = path.join(__dirname, "assets", iconName)

  try {
    tray = new Tray(iconPath)
    if (process.platform === "darwin") {
      tray.setIgnoreDoubleClickEvents(true) // Use single click on Mac too
    }
  } catch (err) {
    console.error("Tray icon creation failed:", err)
    // Try fallback if needed
    try {
      const fallbackPath = path.join(__dirname, "assets", "icon.png")
      if (fs.existsSync(fallbackPath)) {
        tray = new Tray(fallbackPath)
        console.log("Used fallback tray icon.")
      } else {
        console.error("Fallback tray icon not found.")
        return // Cannot create tray
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
  const { width: screenWidth } = primaryDisplay.size
  const winWidth = 600 // Wider for Spotlight look
  const winHeight = 450 // Adjusted height

  // Determine background/transparency based on setting and platform
  let windowOptions = {
    width: winWidth,
    height: winHeight,
    x: Math.round(screenWidth / 2 - winWidth / 2),
    y: Math.round(
      primaryDisplay.workArea.y + primaryDisplay.workArea.height * 0.15
    ), // Position relative to work area top
    frame: false,
    resizable: false, // Typically not resizable
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
  }

  if (appSettings.quickAddTranslucent) {
    if (process.platform === "darwin") {
      windowOptions.vibrancy = "hud" // Or 'fullscreen-ui', 'sidebar', etc.
      windowOptions.visualEffectState = "active"
      windowOptions.backgroundColor = "#00000000" // Fully transparent for vibrancy
    } else {
      // Fallback for Windows/Linux: semi-transparent dark background
      windowOptions.transparent = true // Required for semi-transparent BG on Win/Linux
      windowOptions.backgroundColor = "#1C1C1EBB" // Dark grey with alpha (adjust BB as needed)
      // Note: True transparency might have issues on some Linux DEs
    }
  } else {
    // Solid background if translucency is off
    windowOptions.backgroundColor = "#1C1C1E" // Solid dark grey
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
    // Send translucency setting to renderer if needed for styling
    quickAddWindow.webContents.send("quickadd-settings", {
      translucent: appSettings.quickAddTranslucent,
    })
    quickAddWindow.show()
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
  const wasTrayMode = appSettings.runInTray
  const trayModeChanged = appSettings.runInTray !== settings.runInTray
  const newShortcut = settings.quickAddShortcut || DEFAULT_SHORTCUT
  const shortcutChanged = appSettings.quickAddShortcut !== newShortcut
  const translucencyChanged =
    appSettings.quickAddTranslucent !== settings.quickAddTranslucent

  // Update all settings
  appSettings = { ...appSettings, ...settings }

  // Handle Tray Mode Changes
  if (trayModeChanged) {
    if (appSettings.runInTray) {
      createTray()
      registerGlobalShortcut() // Register shortcut when tray enabled
      if (process.platform === "darwin") app.dock?.hide()
    } else {
      destroyTray()
      unregisterCurrentShortcut() // Unregister shortcut when tray disabled
      if (process.platform === "darwin") app.dock?.show()
      if (mainWindow && !mainWindow.isDestroyed() && !mainWindow.isVisible()) {
        showMainWindow()
      }
    }
  } else if (appSettings.runInTray && shortcutChanged) {
    // If tray mode didn't change but shortcut did, re-register
    registerGlobalShortcut()
  }

  // If translucency changed, close and reopen quick add window next time it's triggered
  if (translucencyChanged && quickAddWindow && !quickAddWindow.isDestroyed()) {
    console.log("Quick Add translucency changed, will apply on next open.")
    quickAddWindow.close() // Close existing window
  }
})
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
