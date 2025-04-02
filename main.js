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
  // Optional: You could show a dialog here, but focusing the existing window is standard.
  // dialog.showErrorBox('Visido Already Running', 'Another instance of Visido is already running.');
  app.quit()
} else {
  app.on("second-instance", (event, commandLine, workingDirectory) => {
    // Someone tried to run a second instance, we should focus our window.
    log.info("Second instance detected. Focusing main window.")
    if (mainWindow) {
      if (!mainWindow.isVisible()) {
        log.info("Main window was hidden, showing...")
        showMainWindow() // Use our function to handle showing/recreating if needed
      } else if (mainWindow.isMinimized()) {
        log.info("Main window was minimized, restoring...")
        mainWindow.restore()
      }
      log.info("Focusing main window.")
      mainWindow.focus()
    } else {
      // If mainWindow is somehow null, try creating it again.
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
  const DEFAULT_SHORTCUT = "CommandOrControl+Shift+Slash"

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
    // Prevent creating multiple main windows if called again unnecessarily
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

    // Window state change listeners
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

    // Close/Minimize handlers
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
      mainWindow = null // Important to allow app to quit correctly
    })
    // mainWindow.webContents.openDevTools();
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
    const iconPath = path.join(__dirname, "assets", iconName)
    try {
      tray = new Tray(iconPath)
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
      log.info("System tray icon created successfully.")
      return true
    } catch (err) {
      log.error("Tray icon creation failed:", err)
      // Fallback logic removed for brevity, assume it works or fails clearly
      return false
    }
  }

  // --- Remove Tray Icon ---
  function destroyTray() {
    if (tray) {
      tray.destroy()
      tray = null
      log.info("System tray icon destroyed.")
    }
  }

  // --- Show Main Window ---
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

  // --- Quick Add Window Creation (remains the same) ---
  function createOrShowQuickAddWindow() {
    /* ... function content ... */
  }
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
    const winHeight = 480
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
      height: winHeight,
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

  // Other IPC handlers...
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
      /* ... font loading ... */
    }
  )
  function fetchGoogleFontCSS(url) {
    /* ... fetch ... */
  }
  function fetchFontData(url) {
    /* ... fetch ... */
  }
  ipcMain.handle("update-wallpaper", async (event, imageDataUrl) => {
    /* ... update wallpaper ... */
  })
  ipcMain.on("update-settings", (event, settings) => {
    /* ... update settings handler ... */
  }) // No changes needed here from previous step
  ipcMain.on(
    "setting-update-error",
    (event, { setting, error, fallbackValue }) => {
      /* ... error handler ... */
    }
  ) // No changes needed here
  ipcMain.on("add-task-from-overlay", (event, taskText) => {
    log.info("Main received task from quick add overlay:", taskText)
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send("add-task-and-apply", taskText)
    } else {
      log.warn("Main window not available to add task from overlay.")
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
    /* ... resize handler ... */
  })
  ipcMain.on("restart_app", () => {
    log.info("Restarting app to install update...")
    autoUpdater.quitAndInstall()
  })

  // --- App Lifecycle ---
  app.whenReady().then(() => {
    log.info("App is ready.")
    // Create the initial window *inside* the 'else' block of the instance lock check
    // or call it from here if the lock was acquired.
    createWindow()

    app.on("activate", () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        log.info("App activated with no windows open, creating main window.")
        createWindow()
      } else if (mainWindow) {
        // Use showMainWindow to handle visibility/focus
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
    } // No need to hide dock here, close handler does it
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
} // End of the 'else' block for the single instance lock
