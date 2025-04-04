// preload.js
const { contextBridge, ipcRenderer } = require("electron")

let screenDimensions = null

ipcRenderer.on("screen-dimensions", (event, dimensions) => {
  screenDimensions = dimensions
})

contextBridge.exposeInMainWorld("electronAPI", {
  // --- State Persistence ---
  loadState: () => ipcRenderer.invoke("load-state"),
  saveState: (stateData) => ipcRenderer.send("save-state", stateData),
  // --- Background Image Persistence ---
  saveBackgroundImage: (imageDataUrl) =>
    ipcRenderer.invoke("save-background-image", imageDataUrl),
  loadBackgroundImage: () => ipcRenderer.invoke("load-background-image"),
  clearBackgroundImage: () => ipcRenderer.invoke("clear-background-image"),

  // == APIs for Main Window Renderer ==
  updateWallpaper: (imageDataUrl) =>
    ipcRenderer.invoke("update-wallpaper", imageDataUrl),
  getScreenDimensions: () => screenDimensions,
  getSystemFonts: () => ipcRenderer.invoke("get-system-fonts"),
  loadGoogleFontByName: (fontName, fontWeight) =>
    ipcRenderer.invoke("load-google-font-by-name", { fontName, fontWeight }),
  updateSettings: (settings) => ipcRenderer.send("update-settings", settings),
  sendRendererSettingsLoaded: (settings) => {
    ipcRenderer.send("renderer-settings-loaded", settings)
  },
  onAddTaskAndApply: (callback) => {
    const channel = "add-task-and-apply"
    const listener = (event, taskText) => callback(taskText)
    ipcRenderer.on(channel, listener)
    return () => ipcRenderer.removeListener(channel, listener)
  },
  onShortcutError: (callback) => {
    const channel = "shortcut-error"
    const listener = (event, errorMessage) => callback(errorMessage)
    ipcRenderer.on(channel, listener)
    return () => ipcRenderer.removeListener(channel, listener)
  },
  onGetTodosRequest: (callback) => {
    const channel = "get-todos-request"
    const listener = () => callback()
    ipcRenderer.on(channel, listener)
    return () => ipcRenderer.removeListener(channel, listener)
  },
  sendTodosResponse: (todos) => {
    ipcRenderer.send("current-todos-response", todos)
  },
  minimizeWindow: () => {
    ipcRenderer.send("window-minimize")
  },
  maximizeRestoreWindow: () => {
    ipcRenderer.send("window-maximize-restore")
  },
  closeWindow: () => {
    ipcRenderer.send("window-close")
  },
  onWindowStateChange: (callback) => {
    const channel = "window-state-changed"
    const listener = (event, state) => callback(state)
    ipcRenderer.on(channel, listener)
    return () => ipcRenderer.removeListener(channel, listener)
  },
  getPlatform: () => process.platform,
  onForceSettingUpdate: (callback) => {
    const channel = "force-setting-update"
    const listener = (event, settingsToUpdate) => callback(settingsToUpdate)
    ipcRenderer.on(channel, listener)
    return () => ipcRenderer.removeListener(channel, listener)
  },
  onPerformTaskToggle: (callback) => {
    const channel = "perform-task-toggle"
    const listener = (event, taskId) => callback(taskId)
    ipcRenderer.on(channel, listener)
    return () => ipcRenderer.removeListener(channel, listener)
  },
  onPerformTaskDelete: (callback) => {
    const channel = "perform-task-delete"
    const listener = (event, taskId) => callback(taskId)
    ipcRenderer.on(channel, listener)
    return () => ipcRenderer.removeListener(channel, listener)
  },
  getAppVersion: () => ipcRenderer.invoke("get-app-version"), // <<< NEW

  // == APIs for Quick Add Renderer ==
  sendTaskToMain: (taskText) =>
    ipcRenderer.send("add-task-from-overlay", taskText),
  closeQuickAddWindow: () => ipcRenderer.send("close-quick-add"),
  onInitialTodos: (callback) => {
    const channel = "initial-todos"
    const listener = (event, todos) => callback(todos)
    ipcRenderer.on(channel, listener)
    return () => ipcRenderer.removeListener(channel, listener)
  },
  onQuickAddSettings: (callback) => {
    const channel = "quickadd-settings"
    const listener = (event, settings) => callback(settings)
    ipcRenderer.on(channel, listener)
    return () => ipcRenderer.removeListener(channel, listener)
  },
  resizeQuickAdd: (height) => ipcRenderer.send("resize-quick-add", { height }),
  sendQuickAddToggleTask: (taskId) =>
    ipcRenderer.send("quick-add-toggle-task", taskId),
  sendQuickAddDeleteTask: (taskId) =>
    ipcRenderer.send("quick-add-delete-task", taskId),

  // == Auto Updater APIs ==
  checkForUpdates: () => ipcRenderer.send("check-for-updates"), // <<< NEW
  onUpdateStatusMessage: (callback) => {
    // <<< NEW listener for status
    const channel = "update-status-message"
    ipcRenderer.on(
      channel,
      (event, message, isChecking, isError, isAvailable) =>
        callback(message, isChecking, isError, isAvailable)
    )
    return () => ipcRenderer.removeAllListeners(channel)
  },
  onUpdateAvailable: (callback) => {
    const channel = "update_available"
    ipcRenderer.on(channel, (event, ...args) => callback(...args))
    return () => ipcRenderer.removeAllListeners(channel)
  },
  onUpdateDownloaded: (callback) => {
    const channel = "update_downloaded"
    ipcRenderer.on(channel, (event, ...args) => callback(...args))
    return () => ipcRenderer.removeAllListeners(channel)
  },
  onUpdateError: (callback) => {
    // Still keep this for the main bottom bar notification
    const channel = "update_error"
    ipcRenderer.on(channel, (event, ...args) => callback(...args))
    return () => ipcRenderer.removeAllListeners(channel)
  },
  onDownloadProgress: (callback) => {
    // Keep for bottom bar
    const channel = "download_progress"
    ipcRenderer.on(channel, (event, ...args) => callback(...args))
    return () => ipcRenderer.removeAllListeners(channel)
  },
  restartApp: () => ipcRenderer.send("restart_app"),
})

console.log("Preload script finished exposing API successfully.")
