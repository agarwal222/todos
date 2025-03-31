// main.js
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
    // *** CRITICAL: Ensure this line is present and uncommented ***
    frame: false,
    // titleBarStyle: 'hidden', // Keep this commented out if using frame: false
    // titleBarOverlay: { }, // Keep this commented out if using frame: false
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
    console.error(
      "Tray icon not found at:",
      iconPath,
      "- Using default Electron icon as fallback."
    )
    // Consider using a default icon or notifying the user
    // tray = new Tray(nativeImage.createEmpty()); // Example: Creates an empty image
    // For now, we'll just proceed without setting the icon if missing
    tray = new Tray(app.getAppPath() + "/icon.png") // Attempt anyway, might fail visually
  } else {
    tray = new Tray(iconPath)
  }

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
  // Important: Check if *any* app registered it. Electron cannot override other apps.
  if (globalShortcut.isRegistered(shortcutToRegister)) {
    // Check if *we* registered it. If currentShortcut matches, we are good.
    if (currentShortcut === shortcutToRegister) {
      console.log(
        `Shortcut ${shortcutToRegister} already registered by this app instance. Skipping.`
      )
      return
    } else {
      // If currentShortcut is different or null, it means another app has it.
      console.error(
        `Failed to register global shortcut: ${shortcutToRegister}. It is already in use by another application.`
      )
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send(
          "shortcut-error",
          `Failed to register shortcut: ${shortcutToRegister}. It is in use by another application.`
        )
      }
      currentShortcut = null // Mark as not registered *by us*
      return // Cannot register it
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
    // This case means Electron thinks it's registered by us, but the OS disagrees. Log it.
    console.warn(
      "Attempted to unregister shortcut, but OS reported it was not registered:",
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
    // Optionally, inform the user via a dialog or simply don't open
    // dialog.showErrorBox("Error", "Main application window is not available.");
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
    ipcMain.removeListener("current-todos-response", responseListener) // Clean up listener

    // 3. If quickAddWindow is ready, send todos to it.
    if (
      quickAddWindow &&
      !quickAddWindow.isDestroyed() &&
      quickAddWindow.webContents.isLoading() === false
    ) {
      console.log("Main: Sending initial-todos to quick add window now.")
      quickAddWindow.webContents.send("initial-todos", todosForQuickAdd)
    }
  }
  ipcMain.once("current-todos-response", responseListener) // Use once

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
      quickAddWindow.close()
    }
  })

  quickAddWindow.on("closed", () => {
    console.log("Quick Add window closed.")
    ipcMain.removeListener("current-todos-response", responseListener) // Ensure cleanup
    quickAddWindow = null
  })
}

// --- IPC Handlers ---

ipcMain.handle("get-screen-dimensions", () => screen.getPrimaryDisplay().size)

ipcMain.handle("load-google-font", async (event, fontUrl) => {
  if (!fontUrl || !fontUrl.startsWith("https://fonts.googleapis.com/css")) {
    return { success: false, error: "Invalid Google Fonts URL format." }
  }
  console.log("Main: Loading font URL:", fontUrl)
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
    console.error("Main: Font load error:", error)
    return { success: false, error: error.message || "Failed font load." }
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
  console.log("Main: Updating wallpaper...")
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

  if (appSettings.runInTray) {
    if (trayModeChanged) createTray()
    if (trayModeChanged || shortcutChanged) registerGlobalShortcut() // Register if mode enabled or shortcut changed
    if (trayModeChanged && process.platform === "darwin") app.dock?.hide()
  } else if (!appSettings.runInTray && trayModeChanged) {
    // Only act if it *was* enabled
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
  win?.close() // Triggers the 'close' event handler
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
  // Quit logic based on tray mode and platform
  if (!appSettings.runInTray || process.platform !== "darwin") {
    if (process.platform !== "darwin" || !appSettings.runInTray) {
      app.quit()
    }
  } else {
    console.log("Main window closed, app in tray.")
  }
})

app.on("before-quit", () => {
  isQuitting = true
})
app.on("will-quit", () => {
  console.log("App quitting...")
  unregisterCurrentShortcut()
  destroyTray()
}) // Use specific unregister
