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
  Notification,
  nativeImage,
} = require("electron")
const path = require("node:path")
const fs = require("node:fs").promises // Use promises version of fs
const fsSync = require("node:fs") // Use synchronous version for existsSync check
const os = require("node:os")
const https = require("node:https") // Ensure https is required
const fontList = require("font-list")
const log = require("electron-log")
const { autoUpdater } = require("electron-updater")

// --- Configure Logging ---
log.transports.file.level = "info"
log.transports.console.level = "info"
autoUpdater.logger = log
log.info("App starting...")

// --- State File Path ---
const STATE_FILE_NAME = "visidoState.json"
const BACKGROUND_IMAGE_FILE_NAME = "visidoBackground.png" // Fixed name for background
let stateFilePath = ""
let backgroundImagePath = "" // Will be set in whenReady

// --- Single Instance Lock ---
const gotTheLock = app.requestSingleInstanceLock()
if (!gotTheLock) {
  log.warn("Another instance is already running. Quitting this instance.")
  app.quit()
} else {
  app.on("second-instance", (event, commandLine, workingDirectory) => {
    log.info("Second instance detected. Focusing main window.")
    if (mainWindow) {
      if (!mainWindow.isVisible()) {
        log.info("Main window was hidden, showing...")
        showMainWindow()
      } else if (mainWindow.isMinimized()) {
        log.info("Main window was minimized, restoring...")
        mainWindow.restore()
      }
      log.info("Focusing main window.")
      mainWindow.focus()
    } else {
      log.warn(
        "Main window was null when second instance detected. Recreating..."
      )
      createWindow()
    }
  })

  // --- Global State ---
  let mainWindow = null
  let tray = null
  let quickAddWindow = null
  let isQuitting = false
  const DEFAULT_SHORTCUT = "CommandOrControl+Shift+Q"
  let appSettings = {
    runInTray: false,
    quickAddShortcut: DEFAULT_SHORTCUT,
    quickAddTranslucent: process.platform === "darwin",
  }
  let currentShortcut = null
  let rendererSettingsLoaded = false

  // --- Constants ---
  const QUICK_ADD_SOLID_BG = "#2E2E30"
  const QUICK_ADD_VIBRANCY_FALLBACK_BG = "rgba(46, 46, 48, 0.9)"
  const QUICK_ADD_MIN_HEIGHT = 100
  const QUICK_ADD_MAX_HEIGHT_FACTOR = 1.5
  const INITIAL_SETUP_DELAY = 300

  // --- Helper Functions ---
  function getAssetPath(assetName) {
    if (app.isPackaged) {
      return path.join(process.resourcesPath, assetName)
    } else {
      return path.join(__dirname, "assets", assetName)
    }
  }

  // *** Google Font Helper Functions (Defined at Top Level - CORRECTED PLACEMENT) ***
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
          log.info(`Google Font CSS request status: ${res.statusCode}`)
          if (
            res.statusCode >= 300 &&
            res.statusCode < 400 &&
            res.headers.location
          ) {
            log.info(`Following redirect to: ${res.headers.location}`)
            return fetchGoogleFontCSS(res.headers.location)
              .then(resolve)
              .catch(reject)
          }
          if (res.statusCode !== 200) {
            res.resume()
            return reject(
              new Error(
                `Failed to fetch Google Font CSS. Status Code: ${res.statusCode}`
              )
            )
          }
          let data = ""
          res.setEncoding("utf8")
          res.on("data", (c) => (data += c))
          res.on("end", () => resolve(data))
        })
        .on("error", (e) => {
          log.error(`Google Font CSS request error: ${e.message}`)
          reject(new Error(`Network error fetching font CSS: ${e.message}`))
        })
    })
  }

  function fetchFontData(url) {
    return new Promise((resolve, reject) => {
      https
        .get(url, (res) => {
          log.info(
            `Google Font data request status: ${res.statusCode} for ${url}`
          )
          if (
            res.statusCode >= 300 &&
            res.statusCode < 400 &&
            res.headers.location
          ) {
            log.info(`Following font data redirect to: ${res.headers.location}`)
            return fetchFontData(res.headers.location)
              .then(resolve)
              .catch(reject)
          }
          if (res.statusCode !== 200) {
            res.resume()
            return reject(
              new Error(
                `Failed to fetch font data. Status Code: ${res.statusCode}`
              )
            )
          }
          const data = []
          res.on("data", (c) => data.push(c))
          res.on("end", () => resolve(Buffer.concat(data).toString("base64")))
        })
        .on("error", (e) => {
          log.error(`Google Font data request error: ${e.message}`)
          reject(new Error(`Network error fetching font data: ${e.message}`))
        })
    })
  }
  // *** End Google Font Helper Functions ***

  // --- Main Window Creation ---
  function createWindow() {
    if (mainWindow && !mainWindow.isDestroyed()) {
      log.warn(
        "createWindow called but mainWindow already exists. Focusing existing."
      )
      mainWindow.focus()
      return
    }
    log.info("Creating main browser window...")
    const primaryDisplay = screen.getPrimaryDisplay()
    const screenDimensions = primaryDisplay.size
    const mainIconName = process.platform === "win32" ? "icon.ico" : "icon.png"
    const mainIconPath = getAssetPath(mainIconName)
    log.info(`Using main window icon path: ${mainIconPath}`)
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
      icon: fsSync.existsSync(mainIconPath) ? mainIconPath : undefined,
    })
    if (!fsSync.existsSync(mainIconPath)) {
      log.warn(
        `Main window icon file not found at expected location: ${mainIconPath}`
      )
    }
    mainWindow.loadFile("index.html")
    mainWindow.webContents.on("did-finish-load", () => {
      log.info("Main window finished loading.")
      mainWindow.webContents.send("screen-dimensions", screenDimensions)
      mainWindow.webContents.send("window-state-changed", {
        isMaximized: mainWindow.isMaximized(),
        isFullScreen: mainWindow.isFullScreen(),
      })
      mainWindow.show()
      log.info("Checking for updates...")
      autoUpdater.checkForUpdatesAndNotify()
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
      log.info(
        `Main window close requested. RunInTray: ${appSettings.runInTray}, IsQuitting: ${isQuitting}`
      )
      if (appSettings.runInTray && !isQuitting) {
        event.preventDefault()
        mainWindow.hide()
        if (process.platform === "darwin") app.dock?.hide()
        log.info("Main window hidden to tray on close.")
      } else {
        log.info("Main window closing normally (or quitting).")
        mainWindow = null
      }
    })
    mainWindow.on("minimize", (event) => {
      if (appSettings.runInTray && process.platform !== "darwin") {
        event.preventDefault()
        mainWindow.hide()
        log.info("Main window hidden to tray on minimize (non-macOS).")
      }
    })
    mainWindow.on("closed", () => {
      log.info("Main window instance closed event fired.")
      mainWindow = null
    })
  }

  // --- Tray Icon Creation ---
  function createTray() {
    if (tray) {
      log.warn("Tray already exists.")
      return true
    }
    log.info("Creating system tray icon...")
    const iconName =
      process.platform === "win32" ? "icon.ico" : "iconTemplate.png"
    const iconPath = getAssetPath(iconName)
    const fallbackIconPath = getAssetPath("icon.png")
    let finalIconPath = iconPath
    log.info(`Attempting to load tray icon from primary path: ${iconPath}`)
    if (!fsSync.existsSync(iconPath)) {
      log.warn(
        `Primary icon (${iconName}) not found at ${iconPath}. Attempting fallback: ${fallbackIconPath}`
      )
      if (fsSync.existsSync(fallbackIconPath)) {
        finalIconPath = fallbackIconPath
        log.info(`Using fallback tray icon: ${finalIconPath}`)
      } else {
        log.error(
          `Critical: Neither primary (${iconPath}) nor fallback (${fallbackIconPath}) tray icons found.`
        )
        dialog.showErrorBox(
          "Tray Icon Error",
          `Could not find the tray icon file.\nExpected at: ${iconPath}\nor: ${fallbackIconPath}`
        )
        return false
      }
    } else {
      log.info(`Found primary tray icon: ${finalIconPath}`)
    }
    try {
      const image = nativeImage.createFromPath(finalIconPath)
      if (image.isEmpty()) {
        throw new Error(
          `Failed to create nativeImage from path (image might be corrupted or invalid): ${finalIconPath}`
        )
      }
      log.info(`Successfully created nativeImage from ${finalIconPath}`)
      tray = new Tray(image)
      log.info(`Tray object successfully created.`)
      if (process.platform === "darwin") tray.setIgnoreDoubleClickEvents(true)
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
      log.info(`System tray icon created and configured successfully.`)
      return true
    } catch (err) {
      log.error("Tray icon creation failed:", err)
      log.error(`Error details: ${err.message} \nStack: ${err.stack}`)
      dialog.showErrorBox(
        "Tray Setup Error",
        `Failed to create the system tray icon: ${err.message}`
      )
      tray = null
      return false
    }
  }
  function destroyTray() {
    if (tray) {
      if (!tray.isDestroyed()) {
        tray.destroy()
      }
      tray = null
      log.info("System tray icon destroyed.")
    }
  }
  function showMainWindow() {
    if (mainWindow && !mainWindow.isDestroyed()) {
      if (!mainWindow.isVisible()) {
        mainWindow.show()
      }
      if (mainWindow.isMinimized()) {
        mainWindow.restore()
      }
      mainWindow.focus()
      if (process.platform === "darwin") app.dock?.show()
      log.info("Showing/focusing existing main window.")
    } else {
      log.info("Main window not available, recreating...")
      createWindow()
    }
  }

  // --- Global Shortcut ---
  function registerGlobalShortcut(shortcutToRegister) {
    unregisterCurrentShortcut()
    if (!shortcutToRegister) {
      log.warn("Attempted to register an empty shortcut.")
      return false
    }
    log.info(`Attempting to register shortcut: ${shortcutToRegister}`)
    let success = false
    try {
      const ret = globalShortcut.register(shortcutToRegister, () => {
        log.info(`Shortcut ${shortcutToRegister} pressed`)
        createOrShowQuickAddWindow()
      })
      if (!ret) {
        const errorMsg = `Failed to register shortcut: ${shortcutToRegister}. It might be in use by another application.`
        log.error(errorMsg)
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send("shortcut-error", errorMsg)
        }
        appSettings.runInTray = false
        currentShortcut = null
        destroyTray()
        if (process.platform === "darwin") app.dock?.show()
        if (
          mainWindow &&
          !mainWindow.isDestroyed() &&
          !mainWindow.isVisible()
        ) {
          showMainWindow()
        }
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send("force-setting-update", {
            runInTray: false,
          })
        }
        success = false
      } else {
        log.info("Global shortcut registered:", shortcutToRegister)
        currentShortcut = shortcutToRegister
        success = true
      }
    } catch (error) {
      const errorMsg = `Error registering shortcut: ${shortcutToRegister}. ${error.message}`
      log.error(errorMsg, error)
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send("shortcut-error", errorMsg)
      }
      appSettings.runInTray = false
      currentShortcut = null
      destroyTray()
      if (process.platform === "darwin") app.dock?.show()
      if (mainWindow && !mainWindow.isDestroyed() && !mainWindow.isVisible()) {
        showMainWindow()
      }
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send("force-setting-update", {
          runInTray: false,
        })
      }
      success = false
    }
    return success
  }
  function unregisterCurrentShortcut() {
    if (currentShortcut) {
      const shortcutToUnregister = currentShortcut
      log.info(`Unregistering shortcut: ${shortcutToUnregister}`)
      if (globalShortcut.isRegistered(shortcutToUnregister)) {
        globalShortcut.unregister(shortcutToUnregister)
        log.info(`Successfully unregistered ${shortcutToUnregister}`)
      } else {
        log.warn(
          `Shortcut ${shortcutToUnregister} was tracked but not registered according to OS during unregister attempt.`
        )
      }
      currentShortcut = null
    }
  }

  // --- Quick Add Window Creation ---
  function createOrShowQuickAddWindow() {
    if (quickAddWindow && !quickAddWindow.isDestroyed()) {
      log.info("Quick Add window already exists, focusing.")
      quickAddWindow.focus()
      return
    }
    if (!mainWindow || mainWindow.isDestroyed()) {
      log.error(
        "Cannot open Quick Add: Main application window is not available to provide tasks."
      )
      showMainWindow()
      if (!mainWindow || mainWindow.isDestroyed()) {
        dialog.showErrorBox(
          "Error",
          "Visido main window is not running. Please start the main application first."
        )
      }
      return
    }
    log.info("Creating new Quick Add window.")
    const primaryDisplay = screen.getPrimaryDisplay()
    const { width: screenWidth } = primaryDisplay.size
    const winWidth = 600
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
        transparent = true
        log.info("Using macOS vibrancy for Quick Add window.")
      } else {
        bgColor = QUICK_ADD_VIBRANCY_FALLBACK_BG
        transparent = true
        log.info(
          "Using fallback transparency for Quick Add window (Win/Linux)."
        )
      }
    } else {
      log.info("Using solid background for Quick Add window.")
    }
    const quickAddIconPath = getAssetPath("icon.png")
    log.info(`Using Quick Add window icon path: ${quickAddIconPath}`)
    let windowOptions = {
      width: winWidth,
      height: initialHeight,
      minHeight: QUICK_ADD_MIN_HEIGHT,
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
        devTools: !app.isPackaged,
      },
      transparent: transparent,
      backgroundColor: bgColor,
      ...(vibrancyType && { vibrancy: vibrancyType }),
      useContentSize: true,
      icon: fsSync.existsSync(quickAddIconPath) ? quickAddIconPath : undefined,
    }
    quickAddWindow = new BrowserWindow(windowOptions)
    if (!fsSync.existsSync(quickAddIconPath)) {
      log.warn(
        `Quick Add window icon file not found at expected location: ${quickAddIconPath}`
      )
    }
    quickAddWindow.loadFile(path.join(__dirname, "quick-add.html"))
    let todosForQuickAdd = null
    let quickAddWindowReady = false
    const responseListener = (event, todos) => {
      log.info("Received current todos response from main window.")
      todosForQuickAdd = todos
      if (
        quickAddWindowReady &&
        quickAddWindow &&
        !quickAddWindow.isDestroyed()
      ) {
        log.info("Quick Add window is ready, sending initial todos.")
        quickAddWindow.webContents.send("initial-todos", todosForQuickAdd)
      } else {
        log.warn(
          "Quick Add window received todos but wasn't ready or was destroyed."
        )
      }
      ipcMain.removeListener("current-todos-response", responseListener)
    }
    ipcMain.once("current-todos-response", responseListener)
    const requestTimeout = setTimeout(() => {
      if (
        ipcMain.listeners("current-todos-response").includes(responseListener)
      ) {
        log.warn("Timeout waiting for todos from main window for Quick Add.")
        ipcMain.removeListener("current-todos-response", responseListener)
        if (
          quickAddWindow &&
          !quickAddWindow.isDestroyed() &&
          quickAddWindowReady
        ) {
          quickAddWindow.webContents.send("initial-todos", [])
        }
      }
    }, 3000)
    log.info("Requesting current todos from main window for Quick Add.")
    mainWindow.webContents.send("get-todos-request")
    quickAddWindow.webContents.on("did-finish-load", () => {
      log.info("Quick Add window finished loading content.")
      quickAddWindowReady = true
      if (
        todosForQuickAdd !== null &&
        quickAddWindow &&
        !quickAddWindow.isDestroyed()
      ) {
        log.info("Quick Add window loaded, sending pre-received todos.")
        quickAddWindow.webContents.send("initial-todos", todosForQuickAdd)
      }
      quickAddWindow.webContents.send("quickadd-settings", {
        translucent: appSettings.quickAddTranslucent,
      })
    })
    quickAddWindow.on("blur", () => {
      log.info("Quick Add window lost focus, closing.")
      if (quickAddWindow && !quickAddWindow.isDestroyed())
        quickAddWindow.close()
    })
    quickAddWindow.on("closed", () => {
      log.info("Quick Add window closed event.")
      clearTimeout(requestTimeout)
      ipcMain.removeListener("current-todos-response", responseListener)
      quickAddWindow = null
    })
  }

  // --- IPC Handlers ---
  ipcMain.handle("load-state", async () => {
    log.info(`Attempting to load state from: ${stateFilePath}`)
    try {
      const data = await fs.readFile(stateFilePath, "utf-8")
      const parsedState = JSON.parse(data)
      log.info("State loaded successfully from file.")
      return parsedState
    } catch (error) {
      if (error.code === "ENOENT") {
        log.warn(`State file not found at ${stateFilePath}. Will use defaults.`)
      } else {
        log.error(
          `Error reading or parsing state file at ${stateFilePath}:`,
          error
        )
      }
      return null
    }
  })
  ipcMain.on("save-state", async (event, stateData) => {
    if (!stateFilePath) {
      log.error("Cannot save state: stateFilePath not initialized.")
      return
    }
    log.info(`Attempting to save state to: ${stateFilePath}`)
    try {
      const stateString = JSON.stringify(stateData, null, 2)
      await fs.writeFile(stateFilePath, stateString, "utf-8")
      log.info("State saved successfully.")
    } catch (error) {
      log.error(`Error writing state file to ${stateFilePath}:`, error)
    }
  })
  ipcMain.handle("save-background-image", async (event, imageDataUrl) => {
    if (!backgroundImagePath) {
      log.error("Cannot save background: path not initialized.")
      return { success: false, error: "Background image path not set." }
    }
    log.info("Saving background image to:", backgroundImagePath)
    try {
      const base64Data = imageDataUrl.replace(/^data:image\/png;base64,/, "")
      await fs.writeFile(backgroundImagePath, base64Data, "base64")
      log.info("Background image saved successfully.")
      return { success: true }
    } catch (error) {
      log.error("Error saving background image:", error)
      return { success: false, error: error.message }
    }
  })
  ipcMain.handle("load-background-image", async () => {
    if (!backgroundImagePath) {
      log.error("Cannot load background: path not initialized.")
      return null
    }
    log.info("Loading background image from:", backgroundImagePath)
    try {
      const imageBuffer = await fs.readFile(backgroundImagePath)
      const mimeType = "image/png"
      const base64 = imageBuffer.toString("base64")
      log.info("Background image loaded successfully.")
      return `data:${mimeType};base64,${base64}`
    } catch (error) {
      if (error.code === "ENOENT") {
        log.warn("Background image file not found:", backgroundImagePath)
      } else {
        log.error("Error loading background image:", error)
      }
      return null
    }
  })
  ipcMain.handle("clear-background-image", async () => {
    if (!backgroundImagePath) {
      log.error("Cannot clear background: path not initialized.")
      return { success: false, error: "Background image path not set." }
    }
    log.info("Clearing background image:", backgroundImagePath)
    try {
      await fs.unlink(backgroundImagePath)
      log.info("Background image cleared successfully.")
      return { success: true }
    } catch (error) {
      if (error.code === "ENOENT") {
        log.warn(
          "Attempted to clear background image, but file already gone:",
          backgroundImagePath
        )
        return { success: true }
      } else {
        log.error("Error clearing background image:", error)
        return { success: false, error: error.message }
      }
    }
  })
  ipcMain.once("renderer-settings-loaded", (event, loadedSettings) => {
    log.info("Received initial settings from renderer:", loadedSettings)
    rendererSettingsLoaded = true
    appSettings = {
      ...appSettings,
      ...loadedSettings,
      runInTray: !!loadedSettings.runInTray,
      quickAddTranslucent: !!loadedSettings.quickAddTranslucent,
      quickAddShortcut: loadedSettings.quickAddShortcut || DEFAULT_SHORTCUT,
    }
    log.info("Main process appSettings updated from renderer:", appSettings)
    if (appSettings.runInTray) {
      log.info(
        "Initial settings: Run in Tray enabled. Setting up after delay..."
      )
      setTimeout(() => {
        if (!appSettings.runInTray) {
          log.info(
            "Initial setup: Tray mode was disabled before delay completed. Skipping setup."
          )
          return
        }
        log.info("Initial setup: Executing delayed tray/shortcut setup.")
        const trayCreated = createTray()
        if (trayCreated) {
          const shortcutRegistered = registerGlobalShortcut(
            appSettings.quickAddShortcut
          )
          if (shortcutRegistered) {
            if (process.platform === "darwin") {
            }
            log.info("Tray and shortcut setup complete (initial).")
          } else {
            log.error(
              "Failed to register shortcut during initial setup. Tray mode disabled."
            )
            destroyTray()
            appSettings.runInTray = false
            if (mainWindow && !mainWindow.isDestroyed()) {
              mainWindow.webContents.send("force-setting-update", {
                runInTray: false,
              })
            }
          }
        } else {
          log.error(
            "Failed to create tray during initial setup. Tray mode disabled."
          )
          appSettings.runInTray = false
          if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send("force-setting-update", {
              runInTray: false,
            })
          }
        }
      }, INITIAL_SETUP_DELAY)
    } else {
      log.info("Initial settings: Run in Tray disabled.")
      if (process.platform === "darwin") {
        app.dock?.show()
      }
    }
  })
  ipcMain.handle("get-screen-dimensions", () => screen.getPrimaryDisplay().size)
  ipcMain.handle("get-system-fonts", async () => {
    try {
      log.info("Fetching system fonts...")
      const fonts = await fontList.getFonts({ disableQuoting: true })
      log.info(`Found ${fonts.length} raw system fonts.`)
      const filteredFonts = fonts.filter(
        (font) =>
          !/System|UI|Display|Emoji|Icons|Symbols|Logo|Brands|Private|Wingdings|Webdings/i.test(
            font
          ) &&
          !/^\./.test(font) &&
          font.trim() !== ""
      )
      const uniqueFonts = [...new Set(filteredFonts)].sort((a, b) =>
        a.localeCompare(b)
      )
      log.info(`Returning ${uniqueFonts.length} filtered system fonts.`)
      return uniqueFonts
    } catch (error) {
      log.error("Failed to get system fonts:", error)
      return []
    }
  })
  ipcMain.handle(
    "load-google-font-by-name",
    async (event, { fontName, fontWeight }) => {
      if (!fontName) {
        log.warn("Attempted to load Google Font with no name.")
        return { success: false, error: "Font name is required." }
      }
      log.info(
        `Loading Google Font: ${fontName}, Weight: ${
          fontWeight || "default (400/700)"
        }`
      )
      const requestedWeight = fontWeight || "400"
      const weightsToRequest = [
        ...new Set([requestedWeight, "400", "700"]),
      ].join(";")
      const formattedName = fontName.replace(/ /g, "+")
      const fontUrl = `https://fonts.googleapis.com/css2?family=${formattedName}:wght@${weightsToRequest}&display=swap`
      log.info(`Fetching CSS from: ${fontUrl}`)
      try {
        const cssContent = await fetchGoogleFontCSS(fontUrl)
        log.info("Successfully fetched Google Font CSS content.")
        const fontFaceRegex =
          /@font-face\s*{[^{}]*?font-family:\s*['"]?([^;'"]+)['"]?[^{}]*?font-weight:\s*(\d+)[^{}]*?url\((https:\/\/fonts\.gstatic\.com\/s\/[^)]+\.(?:woff2|woff))\)[^{}]*?}/gs
        let match
        const availableFonts = []
        while ((match = fontFaceRegex.exec(cssContent)) !== null) {
          availableFonts.push({
            family: match[1],
            weight: match[2],
            url: match[3],
            format: match[3].endsWith(".woff2") ? "woff2" : "woff",
          })
        }
        if (availableFonts.length === 0) {
          log.error(
            `Could not parse any font faces from CSS for ${fontName}. CSS Content: ${cssContent.substring(
              0,
              500
            )}...`
          )
          return {
            success: false,
            error: `Could not find font variations for "${fontName}" on Google Fonts.`,
          }
        }
        log.info(`Parsed ${availableFonts.length} font variations from CSS.`)
        let bestMatch = availableFonts.find((f) => f.weight === requestedWeight)
        if (!bestMatch) {
          log.warn(
            `Requested weight ${requestedWeight} not found. Trying weight 400.`
          )
          bestMatch = availableFonts.find((f) => f.weight === "400")
        }
        if (!bestMatch) {
          log.warn(
            `Weight 400 not found either. Using the first available font: ${availableFonts[0].family} ${availableFonts[0].weight}`
          )
          bestMatch = availableFonts[0]
        }
        log.info(
          `Selected font variation: ${bestMatch.family} ${bestMatch.weight} (${bestMatch.format}) from ${bestMatch.url}`
        )
        const fontData = await fetchFontData(bestMatch.url)
        const mimeType =
          bestMatch.format === "woff" ? "font/woff" : "font/woff2"
        log.info(
          `Successfully fetched font data (${fontData.length} base64 chars).`
        )
        return {
          success: true,
          fontFamily: bestMatch.family,
          fontWeight: bestMatch.weight,
          fontDataUrl: `data:${mimeType};base64,${fontData}`,
        }
      } catch (error) {
        log.error("Main: Google Font load error:", error)
        return {
          success: false,
          error: error.message || "Failed to load font from Google.",
        }
      }
    }
  )
  ipcMain.handle("update-wallpaper", async (event, imageDataUrl) => {
    log.info("Main: Updating wallpaper...")
    let tempFilePath = null
    try {
      const { setWallpaper } = await import("wallpaper")
      log.info("Wallpaper module imported successfully.")
      const tempDir = os.tmpdir()
      tempFilePath = path.join(tempDir, `visido-wallpaper-${Date.now()}.png`)
      const base64Data = imageDataUrl.replace(/^data:image\/png;base64,/, "")
      const imageBuffer = Buffer.from(base64Data, "base64")
      await fs.mkdir(tempDir, { recursive: true })
      log.info("Main: Writing temp wallpaper file to:", tempFilePath)
      await fs.writeFile(tempFilePath, imageBuffer)
      log.info(`Main: Temp file size: ${imageBuffer.length} bytes`)
      log.info("Main: Calling setWallpaper with path:", tempFilePath)
      await setWallpaper(tempFilePath, { scale: "auto" })
      log.info("Main: Wallpaper set command issued successfully.")
      setTimeout(() => {
        if (tempFilePath && fsSync.existsSync(tempFilePath)) {
          fsSync.unlink(tempFilePath, (err) => {
            if (err) log.error("Error deleting temp wallpaper file:", err)
            else log.info("Main: Deleted temp wallpaper file:", tempFilePath)
          })
        }
      }, 10000)
      return { success: true }
    } catch (error) {
      log.error("Main: Failed to set wallpaper. Full Error:", error)
      log.error(`Error details: ${error.message} \nStack: ${error.stack}`)
      let errorMessage = "Unknown error setting wallpaper"
      if (error instanceof Error && error.message) {
        errorMessage = error.message
        if (
          errorMessage.includes("EPERM") ||
          errorMessage.includes("access denied")
        ) {
          errorMessage = "Permission denied. Try running as administrator?"
        } else if (
          errorMessage.includes("screen") ||
          errorMessage.includes("display")
        ) {
          errorMessage = "Could not detect screen or set wallpaper for it."
        } else if (errorMessage.includes("wallpaper.node")) {
          errorMessage = "Internal wallpaper module error."
        }
      } else if (typeof error === "string") {
        errorMessage = error
      }
      return { success: false, error: errorMessage }
    }
  })
  ipcMain.on("update-settings", (event, settings) => {
    log.info("Main received settings update request from renderer:", settings)
    if (!rendererSettingsLoaded) {
      log.warn(
        "Ignoring settings update, initial renderer settings not yet loaded."
      )
      return
    }
    const previousSettings = { ...appSettings }
    let stateChanged = false
    let trayModeChanged = false
    let shortcutChanged = false
    let translucencyChanged = false
    if (
      typeof settings.runInTray === "boolean" &&
      appSettings.runInTray !== settings.runInTray
    ) {
      appSettings.runInTray = settings.runInTray
      stateChanged = true
      trayModeChanged = true
      log.info(`RunInTray setting changed to: ${appSettings.runInTray}`)
    }
    if (
      typeof settings.quickAddTranslucent === "boolean" &&
      appSettings.quickAddTranslucent !== settings.quickAddTranslucent
    ) {
      appSettings.quickAddTranslucent = settings.quickAddTranslucent
      stateChanged = true
      translucencyChanged = true
      log.info(
        `QuickAddTranslucent setting changed to: ${appSettings.quickAddTranslucent}`
      )
    }
    if (
      typeof settings.quickAddShortcut === "string" &&
      settings.quickAddShortcut &&
      appSettings.quickAddShortcut !== settings.quickAddShortcut
    ) {
      appSettings.quickAddShortcut = settings.quickAddShortcut
      stateChanged = true
      shortcutChanged = true
      log.info(
        `QuickAddShortcut setting changed to: ${appSettings.quickAddShortcut}`
      )
    } else if (
      settings.hasOwnProperty("quickAddShortcut") &&
      !settings.quickAddShortcut
    ) {
      if (appSettings.quickAddShortcut !== DEFAULT_SHORTCUT) {
        appSettings.quickAddShortcut = DEFAULT_SHORTCUT
        stateChanged = true
        shortcutChanged = true
        log.warn(
          "Received empty shortcut, reverting to default:",
          DEFAULT_SHORTCUT
        )
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send("force-setting-update", {
            quickAddShortcut: DEFAULT_SHORTCUT,
          })
        }
      }
    }
    if (!stateChanged) {
      log.info(
        "No relevant settings changed, nothing to update in main process."
      )
      return
    }
    log.info("Applying updated app settings:", appSettings)
    if (trayModeChanged) {
      if (appSettings.runInTray) {
        log.info("Enabling tray mode via settings update.")
        const trayCreated = createTray()
        if (trayCreated) {
          const shortcutRegistered = registerGlobalShortcut(
            appSettings.quickAddShortcut
          )
          if (shortcutRegistered) {
            if (process.platform === "darwin") app.dock?.hide()
            log.info("Tray mode enabled successfully.")
          } else {
            log.error(
              "Shortcut registration failed during tray enable. Reverting tray mode."
            )
          }
        } else {
          log.error(
            "Failed to create tray icon when enabling via settings. Reverting tray mode."
          )
          appSettings.runInTray = false
          if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send("force-setting-update", {
              runInTray: false,
            })
          }
        }
      } else {
        log.info("Disabling tray mode via settings update.")
        unregisterCurrentShortcut()
        destroyTray()
        if (process.platform === "darwin") app.dock?.show()
        if (
          mainWindow &&
          !mainWindow.isDestroyed() &&
          !mainWindow.isVisible()
        ) {
          showMainWindow()
        }
        log.info("Tray mode disabled successfully.")
      }
    } else if (appSettings.runInTray && shortcutChanged) {
      log.info(
        `Shortcut changed while tray enabled. Re-registering new shortcut: ${appSettings.quickAddShortcut}`
      )
      const shortcutRegistered = registerGlobalShortcut(
        appSettings.quickAddShortcut
      )
      if (!shortcutRegistered) {
        log.warn("Shortcut re-registration failed. Forcing tray mode off.")
      } else {
        log.info("Shortcut successfully re-registered.")
      }
    } else if (!appSettings.runInTray && currentShortcut) {
      log.info("Tray mode is off, ensuring shortcut is unregistered.")
      unregisterCurrentShortcut()
    }
    if (
      translucencyChanged &&
      quickAddWindow &&
      !quickAddWindow.isDestroyed()
    ) {
      log.info(
        "Quick Add translucency setting changed, closing current Quick Add window to apply on next open."
      )
      quickAddWindow.close()
    }
  })
  ipcMain.on(
    "setting-update-error",
    (event, { setting, error, fallbackValue }) => {
      log.warn(
        `Renderer reported setting update failed for '${setting}': ${error}. Falling back to ${fallbackValue}`
      )
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send("force-setting-update", {
          [setting]: fallbackValue,
        })
      }
      if (appSettings.hasOwnProperty(setting)) {
        log.info(
          `Updating main process setting '${setting}' to fallback value: ${fallbackValue}`
        )
        appSettings[setting] = fallbackValue
        if (setting === "runInTray") {
          if (!fallbackValue) {
            unregisterCurrentShortcut()
            destroyTray()
            if (process.platform === "darwin") app.dock?.show()
            log.info("Tray mode forced off due to renderer setting error.")
          } else {
            log.warn(
              "Tray mode forced ON due to renderer error. Attempting to enable tray."
            )
            const trayCreated = createTray()
            if (
              !trayCreated ||
              !registerGlobalShortcut(appSettings.quickAddShortcut)
            ) {
              log.error(
                "Failed to enable tray/shortcut after fallback. Forcing tray mode off again."
              )
              appSettings.runInTray = false
              destroyTray()
              if (process.platform === "darwin") app.dock?.show()
              if (mainWindow && !mainWindow.isDestroyed()) {
                mainWindow.webContents.send("force-setting-update", {
                  runInTray: false,
                })
              }
            }
          }
        } else if (setting === "quickAddShortcut" && appSettings.runInTray) {
          log.warn(
            "Attempting to re-register shortcut with fallback value after renderer error."
          )
          if (!registerGlobalShortcut(appSettings.quickAddShortcut)) {
            log.error(
              "Failed to register fallback shortcut. Forcing tray mode off."
            )
            appSettings.runInTray = false
            destroyTray()
            if (process.platform === "darwin") app.dock?.show()
            if (mainWindow && !mainWindow.isDestroyed()) {
              mainWindow.webContents.send("force-setting-update", {
                runInTray: false,
              })
            }
          }
        } else if (setting === "quickAddTranslucent") {
          if (quickAddWindow && !quickAddWindow.isDestroyed()) {
            log.info(
              "Closing Quick Add window due to translucency setting fallback."
            )
            quickAddWindow.close()
          }
        }
      }
    }
  )
  ipcMain.on("add-task-from-overlay", (event, taskText) => {
    log.info("Main received task from quick add overlay:", taskText)
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send("add-task-and-apply", taskText)
    } else {
      log.warn("Main window not available to add task from overlay.")
    }
    if (quickAddWindow && !quickAddWindow.isDestroyed()) {
      log.info("Closing Quick Add window after task submission.")
      quickAddWindow.close()
    }
  })
  ipcMain.on("close-quick-add", () => {
    if (quickAddWindow && !quickAddWindow.isDestroyed()) {
      log.info("Received request to close Quick Add window.")
      quickAddWindow.close()
    }
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
    const win = BrowserWindow.fromWebContents(event.sender)
    if (win && mainWindow && win.id === mainWindow.id) {
      log.info(
        `IPC 'window-close' received for main window (ID: ${win.id}). Initiating close sequence.`
      )
      win.close()
    } else if (win) {
      log.warn(
        `IPC 'window-close' received for unexpected window (ID: ${win.id}), closing it directly.`
      )
      win.close()
    } else {
      log.warn("IPC 'window-close' received but sender window not found.")
    }
  })
  ipcMain.on("resize-quick-add", (event, { height }) => {
    if (quickAddWindow && !quickAddWindow.isDestroyed()) {
      try {
        const currentBounds = quickAddWindow.getBounds()
        const primaryDisplay = screen.getPrimaryDisplay()
        const maxHeight = Math.round(primaryDisplay.workArea.height * 0.6)
        const newHeight = Math.max(
          QUICK_ADD_MIN_HEIGHT,
          Math.min(Math.round(height), maxHeight)
        )
        log.info(
          `Resizing Quick Add window to height: ${newHeight} (requested: ${height}, max: ${maxHeight})`
        )
        if (newHeight !== currentBounds.height) {
          quickAddWindow.setSize(currentBounds.width, newHeight, false)
        }
        if (!quickAddWindow.isVisible()) {
          log.info(
            "Showing and focusing Quick Add window after resize calculation."
          )
          quickAddWindow.show()
          quickAddWindow.focus()
        }
      } catch (err) {
        log.error("Failed to resize quick add window:", err)
      }
    } else {
      log.warn(
        "Resize requested for non-existent or destroyed Quick Add window."
      )
    }
  })
  ipcMain.on("restart_app", () => {
    log.info("Restarting app to install update...")
    isQuitting = true
    autoUpdater.quitAndInstall()
  })
  ipcMain.on("quick-add-toggle-task", (event, taskId) => {
    log.info(`Received toggle request for task ID ${taskId} from Quick Add`)
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send("perform-task-toggle", taskId)
    } else {
      log.warn(`Main window not available to toggle task ID ${taskId}`)
    }
    if (quickAddWindow && !quickAddWindow.isDestroyed()) {
      log.info("Closing Quick Add after toggle action.")
      quickAddWindow.close()
    }
  })
  ipcMain.on("quick-add-delete-task", (event, taskId) => {
    log.info(`Received delete request for task ID ${taskId} from Quick Add`)
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send("perform-task-delete", taskId)
    } else {
      log.warn(`Main window not available to delete task ID ${taskId}`)
    }
    if (quickAddWindow && !quickAddWindow.isDestroyed()) {
      log.info("Closing Quick Add after delete action.")
      quickAddWindow.close()
    }
  })

  // --- App Lifecycle ---
  app.whenReady().then(() => {
    log.info("App is ready.")
    const userDataPath = app.getPath("userData")
    stateFilePath = path.join(userDataPath, STATE_FILE_NAME)
    backgroundImagePath = path.join(userDataPath, BACKGROUND_IMAGE_FILE_NAME)
    log.info(`User data path: ${userDataPath}`)
    log.info(`State file path set to: ${stateFilePath}`)
    log.info(`Background image path set to: ${backgroundImagePath}`)
    createWindow()
    app.on("activate", () => {
      log.info("App activated.")
      if (BrowserWindow.getAllWindows().length === 0) {
        log.info("App activated with no windows open, creating main window.")
        createWindow()
      } else if (mainWindow && !mainWindow.isDestroyed()) {
        log.info("App activated, ensuring main window is visible and focused.")
        showMainWindow()
      } else if (mainWindow && mainWindow.isDestroyed()) {
        log.warn(
          "App activated, main window was destroyed, creating a new one."
        )
        createWindow()
      } else {
        log.warn(
          "App activated, mainWindow is null but other windows exist. Creating new main window."
        )
        createWindow()
      }
    })
  })
  app.on("window-all-closed", () => {
    log.info("All windows closed event received.")
    if (process.platform === "darwin" && appSettings.runInTray) {
      log.info("App running in tray (macOS), keeping alive.")
    } else {
      log.info(
        "Quitting app because all windows closed (or not macOS/not in tray)."
      )
      app.quit()
    }
  })
  app.on("before-quit", () => {
    log.info("App before-quit event triggered.")
    isQuitting = true
    unregisterCurrentShortcut()
  })
  app.on("will-quit", () => {
    log.info("App will-quit event triggered. Final cleanup.")
    unregisterCurrentShortcut()
    globalShortcut.unregisterAll()
    destroyTray()
    log.info("Exiting.")
  })

  // --- Auto Updater Event Listeners ---
  autoUpdater.on("checking-for-update", () => {
    log.info("Checking for update...")
    if (mainWindow && !mainWindow.isDestroyed())
      mainWindow.webContents.send("checking_for_update")
  })
  autoUpdater.on("update-available", (info) => {
    log.info("Update available.", info)
    if (mainWindow && !mainWindow.isDestroyed())
      mainWindow.webContents.send("update_available", info)
  })
  autoUpdater.on("update-not-available", (info) => {
    log.info("Update not available.", info)
    if (mainWindow && !mainWindow.isDestroyed())
      mainWindow.webContents.send("update_not_available", info)
  })
  autoUpdater.on("error", (err) => {
    log.error("Error in auto-updater.", err)
    if (mainWindow && !mainWindow.isDestroyed())
      mainWindow.webContents.send("update_error", err.message)
  })
  autoUpdater.on("download-progress", (progressObj) => {
    let log_message = `Download speed: ${Math.round(
      progressObj.bytesPerSecond / 1024
    )} KB/s - Downloaded ${progressObj.percent.toFixed(2)}% (${(
      progressObj.transferred /
      1024 /
      1024
    ).toFixed(2)}MB / ${(progressObj.total / 1024 / 1024).toFixed(2)}MB)`
    log.info(log_message)
    if (mainWindow && !mainWindow.isDestroyed())
      mainWindow.webContents.send("download_progress", progressObj)
  })
  autoUpdater.on("update-downloaded", (info) => {
    log.info("Update downloaded.", info)
    if (mainWindow && !mainWindow.isDestroyed())
      mainWindow.webContents.send("update_downloaded", info)
    const notificationIconPath = getAssetPath("icon.png")
    log.info(`Using notification icon path: ${notificationIconPath}`)
    new Notification({
      title: "Visido Update Ready",
      body: "A new version has been downloaded. Restart the application to apply the update.",
      icon: fsSync.existsSync(notificationIconPath)
        ? notificationIconPath
        : undefined,
    }).show()
  })
} // End single instance lock 'else'
