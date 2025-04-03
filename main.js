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
  nativeImage, // Import nativeImage
} = require("electron")
const path = require("node:path")
const fs = require("node:fs")
const os = require("node:os")
const https = require("node:https")
const fontList = require("font-list")
const log = require("electron-log")
const { autoUpdater } = require("electron-updater")

// --- Configure Logging ---
log.transports.file.level = "info"
log.transports.console.level = "info"
autoUpdater.logger = log
log.info("App starting...")

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
    const assetsPath = app.isPackaged
      ? path.join(process.resourcesPath, "app/assets")
      : path.join(__dirname, "assets")
    const iconName =
      process.platform === "win32" ? "icon.ico" : "iconTemplate.png"
    const primaryIconPath = path.join(assetsPath, iconName)
    const fallbackIconPath = path.join(assetsPath, "icon.png")
    let finalIconPath = null
    let usedFallback = false
    log.info(`Attempting to find tray icon at primary: ${primaryIconPath}`)
    if (fs.existsSync(primaryIconPath)) {
      finalIconPath = primaryIconPath
      log.info(`Using primary tray icon path: ${finalIconPath}`)
    } else {
      log.warn(
        `Primary icon not found. Attempting fallback: ${fallbackIconPath}`
      )
      if (fs.existsSync(fallbackIconPath)) {
        finalIconPath = fallbackIconPath
        usedFallback = true
        log.info(`Using fallback tray icon path: ${finalIconPath}`)
      } else {
        log.error(`Neither primary nor fallback tray icons found.`)
        return false
      }
    }
    try {
      const image = nativeImage.createFromPath(finalIconPath)
      if (image.isEmpty()) {
        throw new Error(
          `Failed to create nativeImage from path: ${finalIconPath}`
        )
      }
      tray = new Tray(image)
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
      log.info(
        `System tray icon created successfully${
          usedFallback ? " (using fallback)" : ""
        }.`
      )
      return true
    } catch (err) {
      log.error(
        "Tray icon creation failed (nativeImage or Tray constructor):",
        err
      )
      tray = null
      return false
    }
  }
  function destroyTray() {
    if (tray) {
      tray.destroy()
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
        const errorMsg = `Failed to register shortcut: ${shortcutToRegister}. It might be in use.`
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
      quickAddWindow.focus()
      return
    }
    if (!mainWindow || mainWindow.isDestroyed()) {
      log.error(
        "Cannot open Quick Add: Main application window is not available."
      )
      dialog.showErrorBox("Error", "Main application window is not available.")
      return
    }
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
      } else {
        bgColor = QUICK_ADD_VIBRANCY_FALLBACK_BG
        transparent = true
      }
    }
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
        devTools: false,
      },
      transparent: transparent,
      backgroundColor: bgColor,
      ...(vibrancyType && { vibrancy: vibrancyType }),
      useContentSize: true,
    }
    quickAddWindow = new BrowserWindow(windowOptions)
    quickAddWindow.loadFile(path.join(__dirname, "quick-add.html"))
    let todosForQuickAdd = null
    let quickAddWindowReady = false
    const responseListener = (event, todos) => {
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
    }
    ipcMain.once("current-todos-response", responseListener)
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
      quickAddWindow = null
    })
  }

  // --- IPC Handlers ---
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
              app.dock?.hide()
            }
            log.info(
              "Tray and shortcut setup complete (initial). Window remains visible."
            )
          } else {
            log.error("Failed to register shortcut during initial setup.")
            if (mainWindow && !mainWindow.isDestroyed()) {
              mainWindow.webContents.send("force-setting-update", {
                runInTray: false,
              })
            }
          }
        } else {
          log.error("Failed to create tray during initial setup.")
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
      const weightsToRequest = [
        ...new Set([requestedWeight, "400", "700"]),
      ].join(";")
      const formattedName = fontName.replace(/ /g, "+")
      const fontUrl = `https://fonts.googleapis.com/css2?family=${formattedName}:wght@${weightsToRequest}&display=swap`
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
          log.warn(
            `Requested weight ${requestedWeight} not found, using ${bestMatch.weight}`
          )
        }
        const fontData = await fetchFontData(bestMatch.url)
        const mimeType =
          bestMatch.format === "woff" ? "font/woff" : "font/woff2"
        return {
          success: true,
          fontFamily: bestMatch.family,
          fontWeight: bestMatch.weight,
          fontDataUrl: `data:${mimeType};base64,${fontData}`,
        }
      } catch (error) {
        log.error("Main: Google Font load error:", error)
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
            return reject(
              new Error(`Failed CSS fetch: Status ${res.statusCode}`)
            )
          }
          let data = ""
          res.on("data", (c) => (data += c))
          res.on("end", () => resolve(data))
        })
        .on("error", (e) =>
          reject(new Error(`CSS Request Error: ${e.message}`))
        )
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
            return fetchFontData(res.headers.location)
              .then(resolve)
              .catch(reject)
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
        .on("error", (e) =>
          reject(new Error(`Font Request Error: ${e.message}`))
        )
    })
  }
  ipcMain.handle("update-wallpaper", async (event, imageDataUrl) => {
    log.info("Main: Updating wallpaper...")
    let tempFilePath = null
    try {
      const { setWallpaper } = await import("wallpaper")
      const tempDir = os.tmpdir()
      tempFilePath = path.join(tempDir, `visido-wallpaper-${Date.now()}.png`)
      const base64Data = imageDataUrl.replace(/^data:image\/png;base64,/, "")
      const imageBuffer = Buffer.from(base64Data, "base64")
      await fs.promises.mkdir(tempDir, { recursive: true })
      log.info("Main: Writing temp wallpaper file to:", tempFilePath)
      await fs.promises.writeFile(tempFilePath, imageBuffer)
      log.info("Main: Calling setWallpaper with path:", tempFilePath)
      await setWallpaper(tempFilePath, { scale: "auto" })
      log.info("Main: Wallpaper set command issued successfully.")
      setTimeout(() => {
        if (tempFilePath) {
          fs.unlink(tempFilePath, (err) => {
            if (err) log.error("Error deleting temp wallpaper file:", err)
            else log.info("Main: Deleted temp wallpaper file:", tempFilePath)
          })
        }
      }, 10000)
      return { success: true }
    } catch (error) {
      log.error("Main: Failed to set wallpaper. Full Error:", error)
      let errorMessage = "Unknown error setting wallpaper"
      if (error instanceof Error && error.message) {
        errorMessage = error.message
        if (
          errorMessage.includes("EPERM") ||
          errorMessage.includes("access denied")
        ) {
          errorMessage = "Permission denied. Try running as administrator?"
        } else if (errorMessage.includes("screen")) {
          errorMessage = "Could not detect screen or set wallpaper for it."
        }
      } else if (typeof error === "string") {
        errorMessage = error
      }
      return { success: false, error: errorMessage }
    }
  })
  ipcMain.on("update-settings", (event, settings) => {
    log.info("Main received settings update request:", settings)
    if (!rendererSettingsLoaded) {
      log.warn("Ignoring settings update, initial load incomplete.")
      return
    }
    const previousSettings = { ...appSettings }
    let stateChanged = false
    if (
      typeof settings.runInTray === "boolean" &&
      appSettings.runInTray !== settings.runInTray
    ) {
      appSettings.runInTray = settings.runInTray
      stateChanged = true
    }
    if (
      typeof settings.quickAddTranslucent === "boolean" &&
      appSettings.quickAddTranslucent !== settings.quickAddTranslucent
    ) {
      appSettings.quickAddTranslucent = settings.quickAddTranslucent
      stateChanged = true
    }
    if (
      typeof settings.quickAddShortcut === "string" &&
      settings.quickAddShortcut &&
      appSettings.quickAddShortcut !== settings.quickAddShortcut
    ) {
      appSettings.quickAddShortcut = settings.quickAddShortcut
      stateChanged = true
    } else if (
      settings.hasOwnProperty("quickAddShortcut") &&
      !settings.quickAddShortcut
    ) {
      if (appSettings.quickAddShortcut !== DEFAULT_SHORTCUT) {
        appSettings.quickAddShortcut = DEFAULT_SHORTCUT
        stateChanged = true
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send("force-setting-update", {
            quickAddShortcut: DEFAULT_SHORTCUT,
          })
        }
      }
    }
    if (!stateChanged) {
      log.info("No relevant settings changed.")
      return
    }
    log.info("App settings potentially updated:", appSettings)
    const trayModeChanged = previousSettings.runInTray !== appSettings.runInTray
    const shortcutChanged =
      previousSettings.quickAddShortcut !== appSettings.quickAddShortcut
    const translucencyChanged =
      previousSettings.quickAddTranslucent !== appSettings.quickAddTranslucent
    if (trayModeChanged) {
      if (appSettings.runInTray) {
        log.info("Enabling tray mode via settings.")
        const trayCreated = createTray()
        if (trayCreated) {
          const shortcutRegistered = registerGlobalShortcut(
            appSettings.quickAddShortcut
          )
          if (shortcutRegistered) {
            if (process.platform === "darwin") app.dock?.hide()
          } else {
            log.warn(
              "Shortcut registration failed during tray enable, state reverted by register function."
            )
            if (mainWindow && !mainWindow.isDestroyed()) {
              mainWindow.webContents.send("force-setting-update", {
                runInTray: false,
              })
            }
          }
        } else {
          log.error("Failed to create tray icon when enabling via settings.")
          appSettings.runInTray = false
          if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send("force-setting-update", {
              runInTray: false,
            })
          }
        }
      } else {
        log.info("Disabling tray mode via settings.")
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
      }
    } else if (appSettings.runInTray && shortcutChanged) {
      log.info(`Shortcut changed while tray enabled, re-registering.`)
      const shortcutRegistered = registerGlobalShortcut(
        appSettings.quickAddShortcut
      )
      if (!shortcutRegistered) {
        log.warn("Shortcut re-registration failed, forcing tray mode off.")
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send("force-setting-update", {
            runInTray: false,
          })
        }
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
        "Quick Add translucency setting changed, closing current quick add window."
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
        if (setting === "quickAddShortcut" && appSettings.runInTray) {
          log.warn(
            "Attempting to re-register shortcut with fallback value after renderer error."
          )
          registerGlobalShortcut(appSettings.quickAddShortcut)
          if (!currentShortcut && appSettings.runInTray) {
            appSettings.runInTray = false
            destroyTray()
            if (process.platform === "darwin") app.dock?.show()
            mainWindow.webContents.send("force-setting-update", {
              runInTray: false,
            })
          }
        } else if (setting === "runInTray" && !fallbackValue) {
          unregisterCurrentShortcut()
          destroyTray()
          if (process.platform === "darwin") app.dock?.show()
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
    const win = BrowserWindow.fromWebContents(event.sender)
    if (win && win.id === mainWindow?.id) {
      log.info(`IPC 'window-close' received for main window (ID: ${win.id})`)
      win.close()
    } else if (win) {
      log.warn(
        `IPC 'window-close' received for unexpected window (ID: ${win.id}), closing it.`
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
        const maxHeight = Math.round(
          primaryDisplay.workArea.height * QUICK_ADD_MAX_HEIGHT_FACTOR
        )
        const newHeight = Math.max(
          QUICK_ADD_MIN_HEIGHT,
          Math.min(Math.round(height), maxHeight)
        )
        log.info(
          `Resizing Quick Add window to height: ${newHeight} (requested: ${height})`
        )
        quickAddWindow.setSize(currentBounds.width, newHeight, false)
        if (!quickAddWindow.isVisible()) {
          log.info("Showing and focusing Quick Add window after resize.")
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
    autoUpdater.quitAndInstall()
  })
  ipcMain.on("quick-add-toggle-task", (event, taskId) => {
    log.info(`Received toggle request for task ID ${taskId} from Quick Add`)
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send("perform-task-toggle", taskId)
    } else {
      log.warn(`Main window not available to toggle task ID ${taskId}`)
    }
  })
  ipcMain.on("quick-add-delete-task", (event, taskId) => {
    log.info(`Received delete request for task ID ${taskId} from Quick Add`)
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send("perform-task-delete", taskId)
    } else {
      log.warn(`Main window not available to delete task ID ${taskId}`)
    }
  })

  // --- App Lifecycle ---
  app.whenReady().then(() => {
    log.info("App is ready.")
    createWindow()
    app.on("activate", () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        log.info("App activated with no windows open, creating main window.")
        createWindow()
      } else if (mainWindow) {
        log.info("App activated, ensuring main window is visible and focused.")
        showMainWindow()
      }
    })
  })
  app.on("window-all-closed", () => {
    log.info("All windows closed event received.")
    if (process.platform !== "darwin") {
      log.info("Non-macOS platform detected, quitting app.")
      app.quit()
    } else if (!appSettings.runInTray) {
      log.info("macOS, not in tray mode. Quitting.")
      app.quit()
    } else {
      log.info("App running in tray (macOS), keeping alive.")
    }
  })
  app.on("before-quit", () => {
    log.info("App before-quit event triggered.")
    isQuitting = true
    unregisterCurrentShortcut()
    globalShortcut.unregisterAll()
  })
  app.on("will-quit", () => {
    log.info("App will-quit event triggered. Final cleanup.")
    destroyTray()
    log.info("Exiting.")
  })

  // --- Auto Updater Event Listeners ---
  autoUpdater.on("update-available", (info) => {
    log.info("Update available.", info)
    if (mainWindow && !mainWindow.isDestroyed())
      mainWindow.webContents.send("update_available", info)
  })
  autoUpdater.on("update-not-available", (info) => {
    log.info("Update not available.", info)
  })
  autoUpdater.on("error", (err) => {
    log.error("Error in auto-updater.", err)
    if (mainWindow && !mainWindow.isDestroyed())
      mainWindow.webContents.send("update_error", err.message)
  })
  autoUpdater.on("download-progress", (progressObj) => {
    let log_message =
      "Download speed: " +
      progressObj.bytesPerSecond +
      " - Downloaded " +
      progressObj.percent +
      "% (" +
      progressObj.transferred +
      "/" +
      progressObj.total +
      ")"
    log.info(log_message)
    if (mainWindow && !mainWindow.isDestroyed())
      mainWindow.webContents.send("download_progress", progressObj)
  })
  autoUpdater.on("update-downloaded", (info) => {
    log.info("Update downloaded.", info)
    if (mainWindow && !mainWindow.isDestroyed())
      mainWindow.webContents.send("update_downloaded", info)
    new Notification({
      title: "Visido Update Ready",
      body: "A new version has been downloaded. Restart the application to apply the update.",
    }).show()
  })
} // End single instance lock 'else'
