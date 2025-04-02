// renderer.js
// Pickr is globally available via script tag in index.html

// --- DOM Elements ---
const applyWallpaperBtn = document.getElementById("apply-wallpaper-btn")
const toggleSettingsBtn = document.getElementById("toggle-settings-btn")
const settingsIconOpen = document.getElementById("settings-icon-open")
const settingsIconClose = document.getElementById("settings-icon-close")
const todoListUl = document.getElementById("todo-list")
const completedTodoListUl = document.getElementById("completed-todo-list")
const completedTitle = document.querySelector(".completed-title")
const completedListContainer = document.querySelector(
  ".completed-list-container"
)
const settingsColumn = document.getElementById("settings-column")
const previewContainer = document.getElementById("preview-container") // Container for loader state
const previewLoader = document.getElementById("preview-loader") // Loader element
const previewAreaImg = document.getElementById("preview-area")
const minimizeBtn = document.getElementById("minimize-btn")
const maximizeRestoreBtn = document.getElementById("maximize-restore-btn")
const maximizeIcon = maximizeRestoreBtn?.querySelector(".icon-maximize")
const restoreIcon = maximizeRestoreBtn?.querySelector(".icon-restore")
const closeBtn = document.getElementById("close-btn")
const settingsInputs = {
  title: document.getElementById("wallpaper-title-input"),
  textColorPickerEl: document.getElementById("text-color-picker"),
  textColorHex: document.getElementById("text-color-hex"),
  fontSize: document.getElementById("font-size"),
  fontWeight: document.getElementById("font-weight-select"),
  listStyle: document.getElementById("list-style-select"),
  textPosition: document.getElementById("text-position"),
  textAlign: document.getElementById("text-align-select"),
  offsetX: document.getElementById("offset-x"),
  offsetY: document.getElementById("offset-y"),
  titleSpacing: document.getElementById("title-spacing-input"),
  itemSpacing: document.getElementById("item-spacing-input"),
  maxItems: document.getElementById("max-items-input"),
  columnGap: document.getElementById("column-gap-input"),
  fontSourceDefault: document.getElementById("font-source-default"),
  fontSourceSystem: document.getElementById("font-source-system"),
  fontSourceGoogle: document.getElementById("font-source-google"),
  systemFontControls: document.getElementById("system-font-controls"),
  systemFontSelect: document.getElementById("system-font-select"),
  googleFontControls: document.getElementById("google-font-controls"),
  googleFontName: document.getElementById("google-font-name"),
  loadFontBtn: document.getElementById("load-font-btn"),
  fontStatus: document.getElementById("font-status"),
  bgTypeColor: document.getElementById("bg-type-color"),
  bgTypeImage: document.getElementById("bg-type-image"),
  bgColorControls: document.getElementById("bg-color-controls"),
  bgColorPickerEl: document.getElementById("bg-color-picker"),
  bgColorHex: document.getElementById("bg-color-hex"),
  bgImageControls: document.getElementById("bg-image-controls"),
  chooseImageBtn: document.getElementById("choose-image-btn"),
  clearImageBtn: document.getElementById("clear-image-btn"),
  imageFileInput: document.getElementById("image-file-input"),
  imageFilenameSpan: document.getElementById("image-filename"),
  runInTrayCheckbox: document.getElementById("run-in-tray-checkbox"),
  shortcutDisplayGroup: document.querySelector(".shortcut-display-group"),
  currentShortcutDisplay: document.getElementById("current-shortcut-display"),
  changeShortcutBtn: document.getElementById("change-shortcut-btn"),
}
const openAddTodoModalBtn = document.getElementById("open-add-todo-modal-btn")
const addTodoModal = document.getElementById("add-todo-modal")
const modalCloseBtn = document.getElementById("modal-close-btn")
const modalCancelBtn = document.getElementById("modal-cancel-btn")
const addTodoForm = document.getElementById("add-todo-form")
const modalTodoInput = document.getElementById("modal-todo-input")
const recordShortcutModal = document.getElementById("record-shortcut-modal")
const recordModalCloseBtn = document.getElementById("record-modal-close-btn")
const shortcutDisplayArea = document.getElementById("shortcut-display-area")
const recordCancelBtn = document.getElementById("record-cancel-btn")
const recordSaveBtn = document.getElementById("record-save-btn")
const recordInstructions = recordShortcutModal.querySelector(
  ".record-instructions"
)
const canvas = document.getElementById("image-canvas")
const ctx = canvas.getContext("2d")

// --- Application State ---
const DEFAULT_FONT = "Inter"
const DEFAULT_WEIGHT = "400"
const DEFAULT_TEXT_COLOR = "#f3f4f6"
const DEFAULT_BG_COLOR = "#111827"
const DEFAULT_SHORTCUT = "CommandOrControl+Shift+N"
let state = {
  todos: [],
  title: "My Tasks",
  listStyle: "bullet",
  fontSource: "default",
  systemFontFamily: "",
  googleFontName: "",
  activeFontFamily: DEFAULT_FONT,
  fontWeight: DEFAULT_WEIGHT,
  customFontStatus: "idle",
  customFontError: null,
  backgroundType: "color",
  bgColor: DEFAULT_BG_COLOR,
  backgroundImageDataUrl: null,
  backgroundImageName: null,
  textColor: DEFAULT_TEXT_COLOR,
  textPosition: "top-left",
  fontSize: 48,
  textAlign: "left",
  offsetX: 0,
  offsetY: 0,
  titleBottomMargin: 40,
  itemSpacing: 20,
  maxItemsPerColumn: 10,
  columnGap: 50,
  lastGeneratedImageDataUrl: null,
  settingsCollapsed: false,
  runInTray: false,
  quickAddShortcut: DEFAULT_SHORTCUT,
  screenWidth: 1920,
  screenHeight: 1080,
}
let isRecordingShortcut = false
let pressedKeys = new Set()
let currentRecordedString = ""
let lastMainKeyPressed = null
let systemFontsCache = []
let textColorPickr = null
let bgColorPickr = null

// --- Initialization ---
async function initialize() {
  console.log("Initializing Renderer...")
  const dimensions = window.electronAPI.getScreenDimensions()
  if (dimensions?.width && dimensions?.height) {
    state.screenWidth = dimensions.width
    state.screenHeight = dimensions.height
  } else {
    console.warn("Could not get screen dimensions sync, using defaults.")
  }
  setCanvasAndPreviewSize(state.screenWidth, state.screenHeight)
  loadState()

  await populateSystemFonts()
  initializeColorPickers()
  applyStateToUI()

  // Ensure preview container starts in loading state
  previewContainer.classList.remove("loaded")

  window.electronAPI.updateSettings({
    runInTray: state.runInTray,
    quickAddShortcut: state.quickAddShortcut,
  })

  let fontLoadPromise = Promise.resolve()
  try {
    if (state.fontSource === "google" && state.googleFontName) {
      fontLoadPromise = loadAndApplyGoogleFont(state.googleFontName, false)
    } else if (state.fontSource === "system" && state.systemFontFamily) {
      state.activeFontFamily = state.systemFontFamily
      updateFontStatus("loaded", state.activeFontFamily)
    } else {
      state.activeFontFamily = DEFAULT_FONT
      state.fontSource = "default"
      updateFontStatus("idle", DEFAULT_FONT)
    }
  } catch (err) {
    console.warn("Initial font setup/load failed:", err)
    state.activeFontFamily = DEFAULT_FONT
    state.fontSource = "default"
    applyStateToUI()
    updateFontStatus("error", DEFAULT_FONT, "Initial load failed")
  }

  renderTodoList()

  fontLoadPromise
    .catch((err) => console.warn("Font loading rejected:", err))
    .finally(() => {
      // Generate first preview AFTER font attempt
      generateTodoImageAndUpdatePreview()
    })

  setupEventListeners()
  initializeCollapsibleSections()
  window.electronAPI.onAddTaskAndApply(handleQuickAddTaskAndApply)
  window.electronAPI.onShortcutError(handleShortcutError)
  window.electronAPI.onGetTodosRequest(() => {
    if (window.electronAPI?.sendTodosResponse)
      window.electronAPI.sendTodosResponse(state.todos)
  })
  window.electronAPI.onWindowStateChange(handleWindowStateChange)
  const platform = window.electronAPI.getPlatform()
  document.body.dataset.platform = platform
  console.log("Renderer initialized on platform:", platform)
}

// --- Set Canvas & Preview Size ---
function setCanvasAndPreviewSize(width, height) {
  canvas.width = width
  canvas.height = height
  if (previewContainer)
    previewContainer.style.setProperty(
      "--preview-aspect-ratio",
      `${width}/${height}`
    )
}

// --- Populate System Fonts ---
async function populateSystemFonts() {
  try {
    systemFontsCache = await window.electronAPI.getSystemFonts()
    settingsInputs.systemFontSelect.innerHTML = ""

    if (!systemFontsCache || systemFontsCache.length === 0) {
      const option = document.createElement("option")
      option.value = ""
      option.textContent = "No fonts found"
      option.disabled = true
      settingsInputs.systemFontSelect.appendChild(option)
      return
    }

    const defaultOption = document.createElement("option")
    defaultOption.value = ""
    defaultOption.textContent = "Select System Font..."
    settingsInputs.systemFontSelect.appendChild(defaultOption)

    systemFontsCache.forEach((font) => {
      const option = document.createElement("option")
      option.value = font
      option.textContent = font
      settingsInputs.systemFontSelect.appendChild(option)
    })
  } catch (error) {
    console.error("Error fetching system fonts:", error)
    settingsInputs.systemFontSelect.innerHTML =
      '<option value="" disabled selected>Error loading fonts</option>'
  }
}

// --- Initialize Color Pickers ---
function initializeColorPickers() {
  const pickrOptions = {
    el: null,
    theme: "nano",
    defaultRepresentation: "HEXA",
    default: "#ffffff",
    position: "bottom-start",
    components: {
      preview: true,
      opacity: true,
      hue: true,
      interaction: {
        hex: true,
        rgba: false,
        hsla: false,
        hsva: false,
        cmyk: false,
        input: true,
        clear: false,
        cancel: false,
        save: true,
      },
    },
  }

  textColorPickr = Pickr.create({
    ...pickrOptions,
    el: settingsInputs.textColorPickerEl,
    default: state.textColor || DEFAULT_TEXT_COLOR,
  })
    .on("save", (color, instance) => {
      const newColor = color.toHEXA().toString()
      if (state.textColor !== newColor) {
        state.textColor = newColor
        settingsInputs.textColorHex.value = newColor
        settingsInputs.textColorHex.classList.remove("invalid")
        generateTodoImageAndUpdatePreview()
        saveState()
      }
      instance.hide()
    })
    .on("change", (color, source, instance) => {
      settingsInputs.textColorHex.value = color.toHEXA().toString()
      settingsInputs.textColorHex.classList.remove("invalid")
    })
    .on("show", (color, instance) => {
      settingsInputs.textColorHex.value = instance
        .getColor()
        .toHEXA()
        .toString()
      settingsInputs.textColorHex.classList.remove("invalid")
    })

  bgColorPickr = Pickr.create({
    ...pickrOptions,
    el: settingsInputs.bgColorPickerEl,
    default: state.bgColor || DEFAULT_BG_COLOR,
  })
    .on("save", (color, instance) => {
      const newColor = color.toHEXA().toString()
      if (state.bgColor !== newColor) {
        state.bgColor = newColor
        settingsInputs.bgColorHex.value = newColor
        settingsInputs.bgColorHex.classList.remove("invalid")
        generateTodoImageAndUpdatePreview()
        saveState()
      }
      instance.hide()
    })
    .on("change", (color, source, instance) => {
      settingsInputs.bgColorHex.value = color.toHEXA().toString()
      settingsInputs.bgColorHex.classList.remove("invalid")
    })
    .on("show", (color, instance) => {
      settingsInputs.bgColorHex.value = instance.getColor().toHEXA().toString()
      settingsInputs.bgColorHex.classList.remove("invalid")
    })
}

// --- Helper function moved UP ---
function updateShortcutInputVisibility() {
  if (settingsInputs.shortcutDisplayGroup)
    settingsInputs.shortcutDisplayGroup.classList.toggle(
      "hidden",
      !state.runInTray
    )
}

// --- Apply State to UI ---
function applyStateToUI() {
  settingsInputs.title.value = state.title
  settingsInputs.fontSize.value = state.fontSize
  settingsInputs.fontWeight.value = state.fontWeight
  settingsInputs.listStyle.value = state.listStyle
  settingsInputs.textPosition.value = state.textPosition
  settingsInputs.textAlign.value = state.textAlign
  settingsInputs.offsetX.value = state.offsetX
  settingsInputs.offsetY.value = state.offsetY
  settingsInputs.titleSpacing.value = state.titleBottomMargin
  settingsInputs.itemSpacing.value = state.itemSpacing
  settingsInputs.maxItems.value = state.maxItemsPerColumn
  settingsInputs.columnGap.value = state.columnGap
  settingsInputs.googleFontName.value = state.googleFontName || ""
  settingsInputs.fontSourceDefault.checked = state.fontSource === "default"
  settingsInputs.fontSourceSystem.checked = state.fontSource === "system"
  settingsInputs.fontSourceGoogle.checked = state.fontSource === "google"
  settingsInputs.bgTypeColor.checked = state.backgroundType === "color"
  settingsInputs.bgTypeImage.checked = state.backgroundType === "image"
  settingsInputs.imageFilenameSpan.textContent =
    state.backgroundImageName || "No file chosen"

  if (textColorPickr)
    textColorPickr.setColor(state.textColor || DEFAULT_TEXT_COLOR, true)
  settingsInputs.textColorHex.value = state.textColor || DEFAULT_TEXT_COLOR
  settingsInputs.textColorHex.classList.remove("invalid")
  if (bgColorPickr)
    bgColorPickr.setColor(state.bgColor || DEFAULT_BG_COLOR, true)
  settingsInputs.bgColorHex.value = state.bgColor || DEFAULT_BG_COLOR
  settingsInputs.bgColorHex.classList.remove("invalid")

  if (state.fontSource === "system" && state.systemFontFamily) {
    settingsInputs.systemFontSelect.value = state.systemFontFamily
  } else {
    settingsInputs.systemFontSelect.value = ""
  }

  if (settingsInputs.runInTrayCheckbox)
    settingsInputs.runInTrayCheckbox.checked = state.runInTray
  if (settingsInputs.currentShortcutDisplay)
    settingsInputs.currentShortcutDisplay.textContent = formatAccelerator(
      state.quickAddShortcut || DEFAULT_SHORTCUT
    )
  else console.warn("#current-shortcut-display not found")

  updateFontControlsVisibility()
  updateFontStatus(
    state.customFontStatus,
    state.activeFontFamily,
    state.customFontError
  )
  updateBackgroundControlsVisibility()
  updateShortcutInputVisibility()
  settingsColumn.dataset.collapsed = state.settingsCollapsed
  updateToggleIcons(state.settingsCollapsed)
}

// ===========================================================
//  EVENT HANDLERS AND HELPERS
// ===========================================================

// --- Event Handlers ---
// Helper to validate hex color codes
function isValidHexColor(hex) {
  if (!hex) return false
  const hexRegex = /^#([0-9A-F]{3,4}|[0-9A-F]{6}|[0-9A-F]{8})$/i
  return hexRegex.test(hex)
}

// Handler for Hex Input Changes
function handleHexInputChange(event) {
  const input = event.target
  const value = input.value.trim()
  let pickrInstance = null
  let stateProp = null
  if (input.id === "text-color-hex") {
    pickrInstance = textColorPickr
    stateProp = "textColor"
  } else if (input.id === "bg-color-hex") {
    pickrInstance = bgColorPickr
    stateProp = "bgColor"
  }
  if (isValidHexColor(value)) {
    input.classList.remove("invalid")
    if (pickrInstance) {
      pickrInstance.setColor(value, true)
    }
    if (state[stateProp] !== value) {
      state[stateProp] = value
      generateTodoImageAndUpdatePreview()
      saveState()
    }
  } else {
    input.classList.add("invalid")
  }
}

// Main Setting Change Handler
function handleSettingChange(event) {
  const target = event.target
  let settingChanged = false,
    requiresRegeneration = true,
    requiresSave = true,
    needsIpcUpdate = false
  const id = target.id
  let value = target.type === "checkbox" ? target.checked : target.value
  const key = target.name || id
  if (id.endsWith("-hex") || id.endsWith("-picker")) return
  switch (key) {
    case "font-source":
      if (target.checked) {
        value = target.value
        if (state.fontSource !== value) {
          state.fontSource = value
          settingChanged = true
          updateFontControlsVisibility()
          if (value === "default") {
            state.activeFontFamily = DEFAULT_FONT
            updateFontStatus("idle", DEFAULT_FONT)
            state.systemFontFamily = ""
            state.googleFontName = ""
          } else if (value === "system") {
            const selectedSystemFont = settingsInputs.systemFontSelect.value
            if (selectedSystemFont) {
              state.activeFontFamily = selectedSystemFont
              state.systemFontFamily = selectedSystemFont
              updateFontStatus("loaded", selectedSystemFont)
            } else {
              state.activeFontFamily = DEFAULT_FONT
              state.systemFontFamily = ""
              updateFontStatus("idle", DEFAULT_FONT)
              requiresRegeneration = false
            }
            state.googleFontName = ""
          } else if (value === "google") {
            state.systemFontFamily = ""
            requiresRegeneration = false
            if (state.googleFontName && state.customFontStatus === "loaded") {
              updateFontStatus("loaded", state.activeFontFamily)
            } else {
              updateFontStatus("idle", state.googleFontName || DEFAULT_FONT)
            }
          }
        } else {
          settingChanged = false
          requiresRegeneration = false
          requiresSave = false
        }
      }
      break
    case "bg-type":
      if (target.checked) {
        value = target.value
        if (state.backgroundType !== value) {
          state.backgroundType = value
          settingChanged = true
          updateBackgroundControlsVisibility()
        } else {
          settingChanged = false
          requiresRegeneration = false
          requiresSave = false
        }
      }
      break
    case "run-in-tray-checkbox":
      if (id === "run-in-tray-checkbox") {
        if (state.runInTray !== value) {
          state.runInTray = value
          settingChanged = true
          requiresRegeneration = false
          needsIpcUpdate = true
          updateShortcutInputVisibility()
        } else {
          settingChanged = false
          requiresRegeneration = false
          requiresSave = false
        }
      } else {
        requiresRegeneration = false
        settingChanged = false
        requiresSave = false
      }
      break
    default:
      switch (id) {
        case "wallpaper-title-input":
          state.title = value
          settingChanged = true
          break
        case "font-size":
          state.fontSize = parseInt(value, 10) || 48
          settingChanged = true
          break
        case "font-weight-select":
          state.fontWeight = value
          settingChanged = true
          break
        case "list-style-select":
          state.listStyle = value
          settingChanged = true
          break
        case "text-position":
          state.textPosition = value
          settingChanged = true
          break
        case "text-align-select":
          state.textAlign = value
          settingChanged = true
          break
        case "offset-x":
          state.offsetX = parseInt(value, 10) || 0
          settingChanged = true
          break
        case "offset-y":
          state.offsetY = parseInt(value, 10) || 0
          settingChanged = true
          break
        case "title-spacing-input":
          state.titleBottomMargin = parseInt(value, 10) || 0
          settingChanged = true
          break
        case "item-spacing-input":
          state.itemSpacing = parseInt(value, 10) || 0
          settingChanged = true
          break
        case "max-items-input":
          state.maxItemsPerColumn = Math.max(1, parseInt(value, 10) || 10)
          settingChanged = true
          break
        case "column-gap-input":
          state.columnGap = Math.max(0, parseInt(value, 10) || 50)
          settingChanged = true
          break
        case "system-font-select":
          if (state.fontSource === "system") {
            if (value) {
              state.activeFontFamily = value
              state.systemFontFamily = value
              settingChanged = true
              updateFontStatus("loaded", value)
            } else {
              state.activeFontFamily = DEFAULT_FONT
              state.systemFontFamily = ""
              settingChanged = true
              updateFontStatus("idle", DEFAULT_FONT)
            }
          } else {
            state.systemFontFamily = value
            settingChanged = true
            requiresRegeneration = false
          }
          break
        case "google-font-name":
          if (state.googleFontName !== value.trim()) {
            state.googleFontName = value.trim()
            settingChanged = true
            requiresRegeneration = false
            if (
              state.customFontStatus === "loaded" ||
              state.customFontStatus === "error"
            ) {
              updateFontStatus("idle", state.activeFontFamily)
              state.customFontStatus = "idle"
            }
          } else {
            settingChanged = false
            requiresRegeneration = false
            requiresSave = false
          }
          break
        default:
          requiresRegeneration = false
          settingChanged = false
          requiresSave = false
          break
      }
      break
  }
  if (settingChanged) {
    if (requiresRegeneration) generateTodoImageAndUpdatePreview()
    if (requiresSave) saveState()
    if (needsIpcUpdate && id === "run-in-tray-checkbox")
      window.electronAPI.updateSettings({
        runInTray: state.runInTray,
        quickAddShortcut: state.quickAddShortcut,
      })
  }
}

// --- Setup Event Listeners (Function Definition) ---
function setupEventListeners() {
  console.log("Setting up event listeners...")
  applyWallpaperBtn.addEventListener("click", handleApplyWallpaper)
  toggleSettingsBtn.addEventListener("click", handleToggleSettings)

  if (minimizeBtn)
    minimizeBtn.addEventListener("click", () =>
      window.electronAPI.minimizeWindow()
    )
  if (maximizeRestoreBtn)
    maximizeRestoreBtn.addEventListener("click", () =>
      window.electronAPI.maximizeRestoreWindow()
    )
  if (closeBtn)
    closeBtn.addEventListener("click", () => window.electronAPI.closeWindow())

  Object.keys(settingsInputs).forEach((key) => {
    const input = settingsInputs[key]
    if (
      input &&
      (input.tagName === "INPUT" || input.tagName === "SELECT") &&
      input.type !== "file" &&
      input.type !== "button" &&
      !input.classList.contains("button") &&
      !input.id.endsWith("-picker") &&
      !input.id.endsWith("-hex") &&
      !input.id.endsWith("-controls") &&
      input.id !== "font-status" &&
      input.id !== "image-filename" &&
      input.id !== "load-font-btn" &&
      input.id !== "choose-image-btn" &&
      input.id !== "clear-image-btn" &&
      input.id !== "change-shortcut-btn" &&
      input.id !== "current-shortcut-display"
    ) {
      const eventType =
        input.tagName === "SELECT" ||
        input.type === "radio" ||
        input.type === "checkbox"
          ? "change"
          : "input"
      input.addEventListener(eventType, handleSettingChange)
    } else if (
      input &&
      (input.id === "system-font-select" || input.id === "google-font-name")
    ) {
      const eventType = input.tagName === "SELECT" ? "change" : "input"
      input.addEventListener(eventType, handleSettingChange)
    }
  })

  settingsInputs.textColorHex.addEventListener("input", handleHexInputChange)
  settingsInputs.bgColorHex.addEventListener("input", handleHexInputChange)

  if (settingsInputs.changeShortcutBtn)
    settingsInputs.changeShortcutBtn.addEventListener(
      "click",
      openRecordShortcutModal
    )
  settingsInputs.loadFontBtn.addEventListener("click", handleLoadFontClick)
  settingsInputs.chooseImageBtn.addEventListener("click", () =>
    settingsInputs.imageFileInput.click()
  )
  settingsInputs.clearImageBtn.addEventListener("click", handleClearImage)
  settingsInputs.imageFileInput.addEventListener(
    "change",
    handleImageFileSelect
  )

  const todoColumn = document.querySelector(".column-todos")
  if (todoColumn) todoColumn.addEventListener("click", handleListClick)

  openAddTodoModalBtn.addEventListener("click", openModal)
  modalCloseBtn.addEventListener("click", closeModal)
  modalCancelBtn.addEventListener("click", closeModal)
  addTodoForm.addEventListener("submit", handleModalSubmit)
  addTodoModal.addEventListener("click", (e) => {
    if (e.target === addTodoModal) closeModal()
  })
  recordModalCloseBtn.addEventListener("click", closeRecordShortcutModal)
  recordCancelBtn.addEventListener("click", closeRecordShortcutModal)
  recordSaveBtn.addEventListener("click", handleSaveShortcut)
  recordShortcutModal.addEventListener("click", (e) => {
    if (e.target === recordShortcutModal) closeRecordShortcutModal()
  })
  document.addEventListener("keydown", handleGlobalKeyDown)
  settingsColumn.addEventListener("click", (e) => {
    const t = e.target.closest(".setting-section-toggle")
    if (t) handleSettingToggleClick(t)
  })
  console.log("Event listeners setup complete.")
}

// --- Rest of the functions (State Management, Todo CRUD, UI Rendering, Image Gen, etc.) remain the same as the previous correct version ---
// ... (Keep all the functions from loadState down to initialize()) ...
// --- State Management (load/save) - Remains the same ---
function saveState() {
  try {
    const stateToSave = {
      todos: state.todos,
      title: state.title,
      listStyle: state.listStyle,
      fontSource: state.fontSource,
      systemFontFamily: state.systemFontFamily,
      googleFontName: state.googleFontName,
      fontWeight: state.fontWeight,
      backgroundType: state.backgroundType,
      bgColor: state.bgColor,
      backgroundImageDataUrl: state.backgroundImageDataUrl,
      backgroundImageName: state.backgroundImageName,
      textColor: state.textColor,
      textPosition: state.textPosition,
      fontSize: state.fontSize,
      textAlign: state.textAlign,
      offsetX: state.offsetX,
      offsetY: state.offsetY,
      titleBottomMargin: state.titleBottomMargin,
      itemSpacing: state.itemSpacing,
      maxItemsPerColumn: state.maxItemsPerColumn,
      columnGap: state.columnGap,
      settingsCollapsed: state.settingsCollapsed,
      runInTray: state.runInTray,
      quickAddShortcut: state.quickAddShortcut,
    }
    localStorage.setItem("visidoState", JSON.stringify(stateToSave))
  } catch (e) {
    console.error("Save State Error:", e)
  }
}
function loadState() {
  try {
    const savedState = localStorage.getItem("visidoState")
    if (savedState) {
      const parsedState = JSON.parse(savedState)
      const currentScreenDims = {
        screenWidth: state.screenWidth,
        screenHeight: state.screenHeight,
      }
      const defaults = {
        titleBottomMargin: 40,
        itemSpacing: 20,
        maxItemsPerColumn: 10,
        columnGap: 50,
        fontWeight: DEFAULT_WEIGHT,
        quickAddShortcut: DEFAULT_SHORTCUT,
        runInTray: false,
        settingsCollapsed: false,
        fontSource: "default",
        systemFontFamily: "",
        googleFontName: "",
        textColor: DEFAULT_TEXT_COLOR,
        bgColor: DEFAULT_BG_COLOR,
      }
      state = {
        ...state,
        ...defaults,
        ...parsedState,
        ...currentScreenDims,
        todos: Array.isArray(parsedState.todos) ? parsedState.todos : [],
        settingsCollapsed:
          typeof parsedState.settingsCollapsed === "boolean"
            ? parsedState.settingsCollapsed
            : defaults.settingsCollapsed,
        runInTray:
          typeof parsedState.runInTray === "boolean"
            ? parsedState.runInTray
            : defaults.runInTray,
        fontSize:
          typeof parsedState.fontSize === "number" ? parsedState.fontSize : 48,
        fontWeight:
          typeof parsedState.fontWeight === "string" &&
          ["300", "400", "500", "600", "700"].includes(parsedState.fontWeight)
            ? parsedState.fontWeight
            : defaults.fontWeight,
        offsetX:
          typeof parsedState.offsetX === "number" ? parsedState.offsetX : 0,
        offsetY:
          typeof parsedState.offsetY === "number" ? parsedState.offsetY : 0,
        titleBottomMargin:
          typeof parsedState.titleBottomMargin === "number"
            ? parsedState.titleBottomMargin
            : defaults.titleBottomMargin,
        itemSpacing:
          typeof parsedState.itemSpacing === "number"
            ? parsedState.itemSpacing
            : defaults.itemSpacing,
        maxItemsPerColumn:
          typeof parsedState.maxItemsPerColumn === "number" &&
          parsedState.maxItemsPerColumn >= 1
            ? parsedState.maxItemsPerColumn
            : defaults.maxItemsPerColumn,
        columnGap:
          typeof parsedState.columnGap === "number"
            ? parsedState.columnGap
            : defaults.columnGap,
        quickAddShortcut:
          parsedState.quickAddShortcut || defaults.quickAddShortcut,
        customFontStatus: "idle",
        customFontError: null,
      }
      if (state.fontSource === "system" && state.systemFontFamily) {
        state.activeFontFamily = state.systemFontFamily
      } else if (state.fontSource === "google" && state.googleFontName) {
        state.activeFontFamily = state.googleFontName
      } else {
        state.fontSource = "default"
        state.activeFontFamily = DEFAULT_FONT
      }
    } else {
      state = {
        ...state,
        todos: [],
        title: "My Tasks",
        listStyle: "bullet",
        fontSource: "default",
        systemFontFamily: "",
        googleFontName: "",
        activeFontFamily: DEFAULT_FONT,
        fontWeight: DEFAULT_WEIGHT,
        customFontStatus: "idle",
        customFontError: null,
        backgroundType: "color",
        bgColor: DEFAULT_BG_COLOR,
        backgroundImageDataUrl: null,
        backgroundImageName: null,
        textColor: DEFAULT_TEXT_COLOR,
        textPosition: "top-left",
        fontSize: 48,
        textAlign: "left",
        offsetX: 0,
        offsetY: 0,
        titleBottomMargin: 40,
        itemSpacing: 20,
        maxItemsPerColumn: 10,
        columnGap: 50,
        lastGeneratedImageDataUrl: null,
        settingsCollapsed: false,
        runInTray: false,
        quickAddShortcut: DEFAULT_SHORTCUT,
      }
      console.log("No saved state found, using defaults.")
    }
  } catch (e) {
    console.error("Load State Error:", e)
    state = {
      ...state,
      todos: [],
      title: "My Tasks",
      fontSource: "default",
      activeFontFamily: DEFAULT_FONT,
      fontWeight: DEFAULT_WEIGHT,
      quickAddShortcut: DEFAULT_SHORTCUT,
      textColor: DEFAULT_TEXT_COLOR,
      bgColor: DEFAULT_BG_COLOR,
    }
  }
}
function addTodo(text) {
  const t = text.trim()
  if (t) {
    state.todos.push({ id: Date.now(), text: t, done: false })
    return true
  }
  return false
}
function deleteTodo(id) {
  state.todos = state.todos.filter((todo) => todo.id !== id)
}
function toggleDone(id) {
  const t = state.todos.find((t) => t.id === id)
  if (t) t.done = !t.done
}
function renderTodoList() {
  todoListUl.innerHTML = ""
  completedTodoListUl.innerHTML = ""
  if (!Array.isArray(state.todos)) state.todos = []
  const activeTodos = state.todos.filter((t) => !t.done)
  const completedTodos = state.todos.filter((t) => t.done)
  if (activeTodos.length === 0)
    todoListUl.innerHTML = `<li class="empty-list-message">No active tasks!</li>`
  else activeTodos.forEach((t) => todoListUl.appendChild(createTodoElement(t)))
  completedTitle.classList.toggle("hidden", completedTodos.length === 0)
  completedListContainer.classList.toggle("hidden", completedTodos.length === 0)
  if (completedTodos.length === 0)
    completedTodoListUl.innerHTML = `<li class="empty-list-message">No completed tasks.</li>`
  else
    completedTodos.forEach((t) =>
      completedTodoListUl.appendChild(createTodoElement(t))
    )
}
function createTodoElement(todo) {
  const li = document.createElement("li")
  li.className = "todo-item"
  li.dataset.id = todo.id
  if (todo.done) li.classList.add("done")
  const cb = document.createElement("input")
  cb.type = "checkbox"
  cb.checked = todo.done
  cb.classList.add("toggle-done")
  cb.setAttribute("aria-label", `Mark task ${todo.done ? "not done" : "done"}`)
  const span = document.createElement("span")
  span.textContent = todo.text
  span.classList.add("todo-text")
  const btn = document.createElement("button")
  btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" width="14" height="14"><path fill-rule="evenodd" d="M5 3.25V4H2.75a.75.75 0 0 0 0 1.5h.3l.815 8.15A1.5 1.5 0 0 0 5.357 15h5.285a1.5 1.5 0 0 0 1.493-1.35l.815-8.15h.3a.75.75 0 0 0 0-1.5H11v-.75A2.25 2.25 0 0 0 8.75 1h-1.5A2.25 2.25 0 0 0 5 3.25Zm2.25-.75a.75.75 0 0 0-.75.75V4h3v-.75a.75.75 0 0 0-.75-.75h-1.5ZM6.05 6a.75.75 0 0 1 .787.713l.275 5.5a.75.75 0 0 1-1.498.075l-.275-5.5A.75.75 0 0 1 6.05 6Zm3.9 0a.75.75 0 0 1 .712.787l-.275 5.5a.75.75 0 0 1-1.498-.075l.275-5.5a.75.75 0 0 1 .786-.711Z" clip-rule="evenodd" /></svg>`
  btn.className = "button button-ghost button-icon delete-btn"
  btn.title = "Delete Task"
  btn.setAttribute("aria-label", "Delete task")
  li.appendChild(cb)
  li.appendChild(span)
  li.appendChild(btn)
  return li
}
async function generateTodoImageAndUpdatePreview() {
  const {
    title,
    listStyle,
    activeFontFamily,
    fontWeight,
    backgroundType,
    bgColor,
    backgroundImageDataUrl,
    textColor,
    textAlign,
    textPosition,
    fontSize,
    offsetX,
    offsetY,
    titleBottomMargin,
    itemSpacing,
    maxItemsPerColumn,
    columnGap,
    todos,
    screenWidth,
    screenHeight,
  } = state
  if (!ctx || !canvas) {
    console.error("Canvas context not available.")
    return Promise.reject("Canvas context unavailable.")
  }
  if (canvas.width !== screenWidth || canvas.height !== screenHeight)
    setCanvasAndPreviewSize(screenWidth, screenHeight)
  const currentActiveFont = activeFontFamily || DEFAULT_FONT
  const itemFontSize = parseInt(fontSize, 10) || 48
  const linesToDraw = todos
    .filter((t) => !t.done)
    .map((t) => ({ text: t.text, done: false }))
  const padding = Math.max(60, itemFontSize * 1.5)
  const titleSpacing = parseInt(titleBottomMargin, 10) || 40
  const spacingBetweenItems = parseInt(itemSpacing, 10) || 20
  const maxItems = Math.max(1, parseInt(maxItemsPerColumn, 10) || 10)
  const colGap = Math.max(0, parseInt(columnGap, 10) || 50)
  const titleFontSize = Math.round(itemFontSize * 1.2)
  previewContainer.classList.remove("loaded")
  /* Show loader */ return Promise.resolve()
    .then(() => {
      ctx.clearRect(0, 0, screenWidth, screenHeight)
      if (backgroundType === "image" && backgroundImageDataUrl) {
        return loadImage(backgroundImageDataUrl)
          .then((img) =>
            drawBackgroundImage(ctx, img, screenWidth, screenHeight)
          )
          .catch((e) => {
            console.error("BG Image Error:", e)
            drawBackgroundColor(ctx, bgColor, screenWidth, screenHeight)
          })
      } else {
        drawBackgroundColor(ctx, bgColor, screenWidth, screenHeight)
      }
    })
    .then(() => {
      const { startX, startY } = calculateTextStartPositionMultiCol(
        screenWidth,
        screenHeight,
        padding,
        titleFontSize,
        itemFontSize,
        titleSpacing,
        spacingBetweenItems,
        maxItems,
        linesToDraw.length,
        textPosition,
        offsetX,
        offsetY
      )
      drawTextElementsMultiCol(ctx, {
        title,
        textColor,
        textAlign,
        fontName: currentActiveFont,
        fontWeight,
        titleFontSize,
        itemFontSize,
        titleSpacing,
        itemSpacing: spacingBetweenItems,
        lines: linesToDraw,
        startX,
        startY,
        listStyle,
        maxItemsPerColumn: maxItems,
        columnGap: colGap,
      })
      updatePreviewImage()
    })
    .catch((err) => {
      console.error("Error during image generation process:", err)
      updatePreviewImage()
      /* Still update to maybe show broken state */ throw err
    })
}
function loadImage(src) {
  return new Promise((resolve, reject) => {
    const i = new Image()
    i.onload = () => resolve(i)
    i.onerror = (e) => reject(new Error(`Image load error: ${e?.message || e}`))
    i.src = src
  })
}
function drawBackgroundColor(ctx, color, w, h) {
  ctx.fillStyle = color
  ctx.fillRect(0, 0, w, h)
}
function drawBackgroundImage(ctx, img, cw, ch) {
  const iAR = img.width / img.height
  const cAR = cw / ch
  let dw, dh, dx, dy
  if (iAR >= cAR) {
    dh = ch
    dw = dh * iAR
    dx = (cw - dw) / 2
    dy = 0
  } else {
    dw = cw
    dh = dw / iAR
    dx = 0
    dy = (ch - dh) / 2
  }
  ctx.drawImage(img, dx, dy, dw, dh)
}
function calculateTextStartPositionMultiCol(
  cw,
  ch,
  p,
  tfz,
  ifz,
  titleSpacing,
  itemSpacing,
  maxItems,
  lineCount,
  pos,
  ox,
  oy
) {
  let sx, sy
  let itemsInFirstCol = Math.min(lineCount, maxItems)
  let requiredHeight = tfz + titleSpacing
  if (itemsInFirstCol > 0) {
    requiredHeight +=
      itemsInFirstCol * ifz + (itemsInFirstCol - 1) * itemSpacing
  }
  switch (pos) {
    case "top-left":
      sx = p
      sy = p
      break
    case "top-center":
      sx = cw / 2
      sy = p
      break
    case "top-right":
      sx = cw - p
      sy = p
      break
    case "center-left":
      sx = p
      sy = Math.max(p, ch / 2 - requiredHeight / 2)
      break
    case "center":
      sx = cw / 2
      sy = Math.max(p, ch / 2 - requiredHeight / 2)
      break
    case "bottom-left":
      sx = p
      sy = ch - p - requiredHeight
      break
    case "bottom-center":
      sx = cw / 2
      sy = ch - p - requiredHeight
      break
    case "bottom-right":
      sx = cw - p
      sy = ch - p - requiredHeight
      break
    default:
      sx = p
      sy = p
      break
  }
  sy = Math.max(p, sy)
  if (sy + requiredHeight > ch - p) sy = ch - p - requiredHeight
  sy = Math.max(p, sy)
  return { startX: sx + ox, startY: sy + oy, requiredHeight }
}
function drawTextElementsMultiCol(ctx, p) {
  const {
    title,
    textColor,
    textAlign,
    fontName,
    fontWeight,
    titleFontSize,
    itemFontSize,
    titleSpacing,
    itemSpacing,
    lines,
    startX,
    startY,
    listStyle,
    maxItemsPerColumn,
    columnGap,
  } = p
  ctx.textAlign = textAlign
  ctx.textBaseline = "top"
  ctx.shadowColor = "rgba(0,0,0,0.4)"
  ctx.shadowBlur = 6
  ctx.shadowOffsetX = 1
  ctx.shadowOffsetY = 2
  let currentX = startX,
    currentY = startY,
    columnWidth = 0
  ctx.fillStyle = textColor
  const titleWeight = Math.max(parseInt(fontWeight, 10) || 400, 600)
  const tfs = `${titleWeight} ${titleFontSize}px "${fontName}"`,
    ftfs = `${titleWeight} ${titleFontSize}px ${DEFAULT_FONT}`
  let titleWidth = 0
  try {
    ctx.font = tfs
    titleWidth = ctx.measureText(title).width
    ctx.fillText(title, startX, currentY)
  } catch (e) {
    console.warn(`Failed to draw title with font ${fontName}. Falling back.`, e)
    ctx.font = ftfs
    titleWidth = ctx.measureText(title).width
    ctx.fillText(title, startX, currentY)
  }
  columnWidth = Math.max(columnWidth, titleWidth)
  currentY += titleFontSize + titleSpacing
  let initialItemY = currentY
  const itemWeight = parseInt(fontWeight, 10) || 400
  const ifs = `${itemWeight} ${itemFontSize}px "${fontName}"`,
    fifs = `${itemWeight} ${itemFontSize}px ${DEFAULT_FONT}`
  lines.forEach((item, idx) => {
    if (idx > 0 && idx % maxItemsPerColumn === 0) {
      currentX += columnWidth + columnGap
      currentY = initialItemY
      columnWidth = 0
    }
    let prefix
    switch (listStyle) {
      case "dash":
        prefix = "- "
        break
      case "number":
        prefix = `${idx + 1}. `
        break
      default:
        prefix = "• "
        break
    }
    const itxt = `${prefix}${item.text}`
    ctx.fillStyle = textColor
    ctx.globalAlpha = 1.0
    let itemWidth = 0
    try {
      ctx.font = ifs
      itemWidth = ctx.measureText(itxt).width
      ctx.fillText(itxt, currentX, currentY)
    } catch (e) {
      console.warn(
        `Failed to draw item with font ${fontName}. Falling back.`,
        e
      )
      ctx.font = fifs
      itemWidth = ctx.measureText(itxt).width
      ctx.fillText(itxt, currentX, currentY)
    }
    columnWidth = Math.max(columnWidth, itemWidth)
    ctx.globalAlpha = 1.0
    currentY += itemFontSize + itemSpacing
  })
  ctx.shadowColor = "transparent"
  ctx.shadowBlur = 0
  ctx.shadowOffsetX = 0
  ctx.shadowOffsetY = 0
}
function updatePreviewImage() {
  try {
    state.lastGeneratedImageDataUrl = canvas.toDataURL("image/png")
    // Add listeners BEFORE setting src
    previewAreaImg.onload = () => {
      console.log("Preview image loaded successfully.")
      previewContainer.classList.add("loaded") // Hide loader, show image
    }
    previewAreaImg.onerror = () => {
      console.error("Preview image failed to load from data URL.")
      previewContainer.classList.remove("loaded") // Keep loader visible on error
      previewAreaImg.src = "" // Clear potentially broken src
      // Optionally update loader text
      if (previewLoader) previewLoader.textContent = "Preview Error"
    }
    previewAreaImg.src = state.lastGeneratedImageDataUrl // Set src AFTER listeners
  } catch (e) {
    console.error("Preview Gen Error (canvas.toDataURL or setting src):", e)
    previewContainer.classList.remove("loaded") // Keep loader visible
    previewAreaImg.src = ""
    state.lastGeneratedImageDataUrl = null
    if (previewLoader) previewLoader.textContent = "Generation Error"
  }
}
async function handleLoadFontClick() {
  const fontName = settingsInputs.googleFontName.value.trim()
  if (!fontName) {
    updateFontStatus("error", state.activeFontFamily, "Enter Google Font name")
    return
  }
  await loadAndApplyGoogleFont(fontName, true)
}
async function loadAndApplyGoogleFont(fontName, shouldSaveState = true) {
  updateFontStatus("loading", state.activeFontFamily)
  try {
    const fontWeight = state.fontWeight || DEFAULT_WEIGHT
    const result = await window.electronAPI.loadGoogleFontByName(
      fontName,
      fontWeight
    )
    if (result.success && result.fontFamily && result.fontDataUrl) {
      const actualFontFamily = result.fontFamily
      const actualWeight = result.fontWeight
      const fontFace = new FontFace(
        actualFontFamily,
        `url(${result.fontDataUrl})`,
        { weight: actualWeight }
      )
      await fontFace.load()
      document.fonts.add(fontFace)
      await document.fonts.ready
      console.log(`Font loaded and added: ${actualFontFamily} ${actualWeight}`)
      state.activeFontFamily = actualFontFamily
      state.googleFontName = fontName
      state.customFontStatus = "loaded"
      state.customFontError = null
      updateFontStatus("loaded", actualFontFamily)
      generateTodoImageAndUpdatePreview()
      if (shouldSaveState) saveState()
    } else {
      throw new Error(result.error || "Failed details")
    }
  } catch (e) {
    console.error("Google Font Load Error:", e)
    state.customFontStatus = "error"
    state.customFontError = e.message
    updateFontStatus("error", state.activeFontFamily, e.message)
  }
}
function updateFontControlsVisibility() {
  const source = state.fontSource
  settingsInputs.systemFontControls.classList.toggle(
    "hidden",
    source !== "system"
  )
  settingsInputs.googleFontControls.classList.toggle(
    "hidden",
    source !== "google"
  )
}
function updateFontStatus(status, displayFontFamily, error = null) {
  state.customFontStatus = status
  state.customFontError = error
  let txt = ""
  settingsInputs.fontStatus.className = "font-status-display"
  switch (status) {
    case "loading":
      txt = "Loading..."
      settingsInputs.fontStatus.classList.add("loading")
      settingsInputs.loadFontBtn.disabled = true
      break
    case "loaded":
      txt = `Active: ${displayFontFamily || DEFAULT_FONT}`
      settingsInputs.fontStatus.classList.add("loaded")
      settingsInputs.loadFontBtn.disabled = false
      break
    case "error":
      txt = `Error: ${error || "Unknown"}. Using: ${
        displayFontFamily || DEFAULT_FONT
      }`
      settingsInputs.fontStatus.classList.add("error")
      settingsInputs.loadFontBtn.disabled = false
      break
    case "idle":
    default:
      if (state.fontSource === "default") {
        txt = `Default: ${DEFAULT_FONT}`
      } else if (state.fontSource === "system") {
        txt = state.systemFontFamily
          ? `System: ${state.systemFontFamily}`
          : `System: (Select Font)`
      } else if (state.fontSource === "google") {
        txt = state.googleFontName
          ? `Google: ${state.googleFontName} (Load)`
          : `Google: (Enter Name)`
      } else {
        txt = `Active: ${displayFontFamily || DEFAULT_FONT}`
      }
      settingsInputs.loadFontBtn.disabled = state.fontSource !== "google"
      break
  }
  settingsInputs.fontStatus.textContent = txt
  settingsInputs.fontStatus.title = error || txt
}
function handleToggleSettings() {
  state.settingsCollapsed = !state.settingsCollapsed
  settingsColumn.dataset.collapsed = state.settingsCollapsed
  updateToggleIcons(state.settingsCollapsed)
  saveState()
}
function updateToggleIcons(isCollapsed) {
  settingsIconOpen.classList.toggle("hidden", !isCollapsed)
  settingsIconClose.classList.toggle("hidden", isCollapsed)
  toggleSettingsBtn.title = isCollapsed
    ? "Open Settings (Alt+S)"
    : "Close Settings (Alt+S)"
  toggleSettingsBtn.setAttribute("aria-expanded", !isCollapsed)
}
function handleListClick(event) {
  const t = event.target,
    li = t.closest(".todo-item")
  if (!li || !li.dataset.id) return
  const id = parseInt(li.dataset.id, 10)
  if (
    t.classList.contains("toggle-done") ||
    t.classList.contains("todo-text")
  ) {
    toggleDone(id)
    renderTodoList()
    generateTodoImageAndUpdatePreview()
    saveState()
  } else if (t.closest(".delete-btn")) {
    deleteTodo(id)
    li.style.opacity = "0"
    li.style.transform = "translateX(-20px)"
    li.addEventListener(
      "transitionend",
      () => {
        if (
          li.parentNode === todoListUl ||
          li.parentNode === completedTodoListUl
        )
          renderTodoList()
      },
      { once: true }
    )
    generateTodoImageAndUpdatePreview()
    saveState()
  }
}
function openModal() {
  addTodoModal.classList.remove("hidden")
  setTimeout(() => modalTodoInput.focus(), 50)
}
function closeModal() {
  addTodoModal.classList.add("hidden")
  modalTodoInput.value = ""
}
function handleModalSubmit(event) {
  event.preventDefault()
  const txt = modalTodoInput.value
  if (addTodo(txt)) {
    renderTodoList()
    generateTodoImageAndUpdatePreview()
    saveState()
    closeModal()
  } else {
    modalTodoInput.focus()
    modalTodoInput.classList.add("shake-animation")
    setTimeout(() => modalTodoInput.classList.remove("shake-animation"), 500)
  }
}
function openRecordShortcutModal() {
  isRecordingShortcut = true
  pressedKeys.clear()
  lastMainKeyPressed = null
  currentRecordedString = ""
  updateRecordShortcutDisplay("Press keys...")
  recordSaveBtn.disabled = true
  recordShortcutModal.classList.remove("hidden")
  document.addEventListener("keydown", handleShortcutKeyDown, true)
  document.addEventListener("keyup", handleShortcutKeyUp, true)
}
function closeRecordShortcutModal() {
  isRecordingShortcut = false
  recordShortcutModal.classList.add("hidden")
  document.removeEventListener("keydown", handleShortcutKeyDown, true)
  document.removeEventListener("keyup", handleShortcutKeyUp, true)
}
function handleShortcutKeyDown(event) {
  if (!isRecordingShortcut) return
  event.preventDefault()
  event.stopPropagation()
  const key = event.key,
    code = event.code
  const isMod =
    ["Control", "Shift", "Alt", "Meta", "ContextMenu"].includes(key) ||
    code.startsWith("Control") ||
    code.startsWith("Shift") ||
    code.startsWith("Alt") ||
    code.startsWith("Meta")
  if (!isMod) {
    if (!lastMainKeyPressed) {
      pressedKeys.clear()
      if (event.ctrlKey) pressedKeys.add("Control")
      if (event.shiftKey) pressedKeys.add("Shift")
      if (event.altKey) pressedKeys.add("Alt")
      if (event.metaKey) pressedKeys.add("Meta")
      pressedKeys.add(key)
      lastMainKeyPressed = key
      currentRecordedString = buildAcceleratorString()
      const isValid = isValidAccelerator(currentRecordedString)
      updateRecordShortcutDisplay(null, buildAcceleratorStringParts())
      recordSaveBtn.disabled = !isValid
      if (isValid) {
        isRecordingShortcut = false
        document.removeEventListener("keydown", handleShortcutKeyDown, true)
        document.removeEventListener("keyup", handleShortcutKeyUp, true)
        updateRecordShortcutDisplay(
          "Recorded!",
          buildAcceleratorStringParts(true)
        )
      } else {
        updateRecordShortcutDisplay(
          "Modifier needed!",
          buildAcceleratorStringParts()
        )
        currentRecordedString = ""
        lastMainKeyPressed = null
        pressedKeys.clear()
      }
    }
  } else {
    if (!lastMainKeyPressed) {
      pressedKeys.add(key)
      updateRecordShortcutDisplay(
        "Press main key...",
        buildAcceleratorStringParts()
      )
    }
  }
}
function handleShortcutKeyUp(event) {
  if (!isRecordingShortcut) return
  const key = event.key
  if (isRecordingShortcut) {
    if (["Control", "Shift", "Alt", "Meta"].includes(key)) {
      pressedKeys.delete(key)
      if (!lastMainKeyPressed)
        updateRecordShortcutDisplay(
          "Press main key...",
          buildAcceleratorStringParts()
        )
    }
  }
}
function updateRecordShortcutDisplay(msg = null, parts = []) {
  shortcutDisplayArea.innerHTML = ""
  if (msg) {
    const s = document.createElement("span")
    s.textContent = msg
    shortcutDisplayArea.appendChild(s)
  }
  if (parts.length > 0) {
    parts.forEach((p) => {
      const s = document.createElement("span")
      s.className = "key-display"
      if (
        [
          "CmdOrCtrl",
          "Alt",
          "Shift",
          "Super",
          "Ctrl",
          "Cmd",
          "Option",
        ].includes(p)
      )
        s.classList.add("modifier")
      s.textContent = mapKeyForDisplay(p)
      shortcutDisplayArea.appendChild(s)
    })
  } else if (!msg) {
    shortcutDisplayArea.innerHTML = "<span>Press keys...</span>"
  }
}
function mapKeyForDisplay(k) {
  switch (k.toUpperCase()) {
    case "COMMANDORCONTROL":
    case "CMDORCTRL":
      return "Ctrl/Cmd"
    case "CONTROL":
      return "Ctrl"
    case "COMMAND":
    case "META":
      return "Cmd"
    case "OPTION":
    case "ALT":
      return "Alt"
    case "ARROWUP":
      return "Up"
    case "ARROWDOWN":
      return "Down"
    case "ARROWLEFT":
      return "Left"
    case "ARROWRIGHT":
      return "Right"
    case " ":
      return "Space"
    case "BACKQUOTE":
      return "`"
    case "MINUS":
      return "-"
    case "EQUAL":
      return "="
    case "BRACKETLEFT":
      return "["
    case "BRACKETRIGHT":
      return "]"
    case "BACKSLASH":
      return "\\"
    case "SEMICOLON":
      return ";"
    case "QUOTE":
      return "'"
    case "COMMA":
      return ","
    case "PERIOD":
      return "."
    case "SLASH":
      return "/"
    default:
      return k.length === 1 ? k.toUpperCase() : k
  }
}
function buildAcceleratorStringParts(useCurrentState = false) {
  const keySet = useCurrentState
    ? new Set(
        currentRecordedString
          .split("+")
          .map((p) =>
            p === "CmdOrCtrl"
              ? navigator.platform.toUpperCase().includes("MAC")
                ? "Meta"
                : "Control"
              : p
          )
      )
    : pressedKeys
  const m = [],
    k = []
  const isMac = navigator.platform.toUpperCase().includes("MAC")
  if (keySet.has("Control") || (keySet.has("CmdOrCtrl") && !isMac))
    m.push("Ctrl")
  if (keySet.has("Alt")) m.push("Alt")
  if (keySet.has("Shift")) m.push("Shift")
  if (keySet.has("Meta") || (keySet.has("CmdOrCtrl") && isMac)) m.push("Cmd")
  keySet.forEach((key) => {
    if (!["Control", "Shift", "Alt", "Meta", "CmdOrCtrl"].includes(key))
      k.push(mapKeyToAccelerator(key))
  })
  return [...m, ...k]
}
function buildAcceleratorString() {
  const m = [],
    k = []
  if (pressedKeys.has("Meta") || pressedKeys.has("Control"))
    m.push("CommandOrControl")
  if (pressedKeys.has("Alt")) m.push("Alt")
  if (pressedKeys.has("Shift")) m.push("Shift")
  pressedKeys.forEach((key) => {
    if (!["Control", "Shift", "Alt", "Meta"].includes(key))
      k.push(mapKeyToAccelerator(key))
  })
  return [...m, ...k].join("+")
}
function mapKeyToAccelerator(k) {
  switch (k.toUpperCase()) {
    case "ARROWUP":
      return "Up"
    case "ARROWDOWN":
      return "Down"
    case "ARROWLEFT":
      return "Left"
    case "ARROWRIGHT":
      return "Right"
    case " ":
      return "Space"
    case "ESCAPE":
      return "Esc"
    case "ENTER":
      return "Enter"
    case "TAB":
      return "Tab"
    case "F1":
    case "F2":
    case "F3":
    case "F4":
    case "F5":
    case "F6":
    case "F7":
    case "F8":
    case "F9":
    case "F10":
    case "F11":
    case "F12":
    case "F13":
    case "F14":
    case "F15":
    case "F16":
    case "F17":
    case "F18":
    case "F19":
    case "F20":
    case "F21":
    case "F22":
    case "F23":
    case "F24":
      return k.toUpperCase()
    case "`":
      return "`"
    case "~":
      return "~"
    case "!":
      return "!"
    case "@":
      return "@"
    case "#":
      return "#"
    case "$":
      return "$"
    case "%":
      return "%"
    case "^":
      return "^"
    case "&":
      return "&"
    case "*":
      return "*"
    case "(":
      return "("
    case ")":
      return ")"
    case "-":
      return "-"
    case "_":
      return "_"
    case "=":
      return "="
    case "+":
      return "+"
    case "[":
      return "["
    case "{":
      return "{"
    case "]":
      return "]"
    case "}":
      return "}"
    case "\\":
      return "\\"
    case "|":
      return "|"
    case ";":
      return ";"
    case ":":
      return ":"
    case "'":
      return "'"
    case '"':
      return '"'
    case ",":
      return ","
    case "<":
      return "<"
    case ".":
      return "."
    case ">":
      return ">"
    case "/":
      return "/"
    case "?":
      return "?"
    default:
      return k.length === 1 ? k.toUpperCase() : k
  }
}
function isValidAccelerator(accel) {
  if (!accel) return false
  const p = accel.split("+")
  if (p.length < 2) return false
  const hM = p.some((k) =>
    ["CommandOrControl", "Alt", "Shift", "Super"].includes(k)
  )
  const hK = p.some(
    (k) => !["CommandOrControl", "Alt", "Shift", "Super"].includes(k)
  )
  return hM && hK
}
function handleSaveShortcut() {
  if (!currentRecordedString || !isValidAccelerator(currentRecordedString)) {
    alert("Invalid shortcut.")
    recordSaveBtn.disabled = true
    return
  }
  if (currentRecordedString !== state.quickAddShortcut) {
    state.quickAddShortcut = currentRecordedString
    applyStateToUI()
    saveState()
    if (state.runInTray)
      window.electronAPI.updateSettings({
        runInTray: state.runInTray,
        quickAddShortcut: state.quickAddShortcut,
      })
  }
  closeRecordShortcutModal()
}
function updateBackgroundControlsVisibility() {
  const i = state.backgroundType === "image"
  settingsInputs.bgColorControls.classList.toggle("hidden", i)
  settingsInputs.bgImageControls.classList.toggle("hidden", !i)
}
function handleImageFileSelect(e) {
  const f = e.target.files[0]
  if (!f) return
  if (!f.type.startsWith("image/")) {
    alert("Invalid image.")
    return
  }
  if (f.size > 15 * 1024 * 1024) {
    alert("Image too large.")
    return
  }
  const r = new FileReader()
  r.onload = (e) => {
    state.backgroundImageDataUrl = e.target.result
    state.backgroundImageName = f.name
    settingsInputs.imageFilenameSpan.textContent = f.name
    generateTodoImageAndUpdatePreview()
    saveState()
  }
  r.onerror = handleImageReadError
  r.readAsDataURL(f)
}
function handleClearImage() {
  state.backgroundImageDataUrl = null
  state.backgroundImageName = null
  settingsInputs.imageFilenameSpan.textContent = "No file chosen"
  settingsInputs.imageFileInput.value = ""
  state.backgroundType = "color"
  settingsInputs.bgTypeColor.checked = true
  updateBackgroundControlsVisibility()
  generateTodoImageAndUpdatePreview()
  saveState()
}
function handleImageReadError(err) {
  console.error("FileReader error:", err)
  alert("Error reading image.")
  handleClearImage()
}
async function handleApplyWallpaper() {
  if (!state.lastGeneratedImageDataUrl) {
    console.warn("Apply Wallpaper: No image data.")
    return
  }
  if (
    applyWallpaperBtn.disabled &&
    applyWallpaperBtn.querySelector("span")?.textContent === "Applying..."
  )
    return
  applyWallpaperBtn.disabled = true
  const span = applyWallpaperBtn.querySelector("span")
  const ogTxt = span ? span.textContent : "Apply Wallpaper"
  if (span) span.textContent = "Applying..."
  console.log("Applying wallpaper...")
  try {
    const data = state.lastGeneratedImageDataUrl
    const result = await window.electronAPI.updateWallpaper(data)
    if (result?.success) {
      console.log("Wallpaper update successful.")
      if (span) span.textContent = "Applied!"
      setTimeout(() => {
        if (applyWallpaperBtn.disabled && span?.textContent === "Applied!") {
          if (span) span.textContent = ogTxt
          applyWallpaperBtn.disabled = false
        }
      }, 2000)
    } else {
      throw new Error(result?.error || "Unknown error")
    }
  } catch (err) {
    console.error("Wallpaper update failed:", err)
    alert(`Failed:\n${err.message}`)
    if (span) span.textContent = ogTxt
    applyWallpaperBtn.disabled = false
  }
}
async function handleQuickAddTaskAndApply(taskText) {
  console.log("Renderer received task and apply trigger:", taskText)
  if (addTodo(taskText)) {
    renderTodoList()
    saveState()
    try {
      await generateTodoImageAndUpdatePreview()
      if (state.lastGeneratedImageDataUrl) await handleApplyWallpaper()
      else console.error("Failed image gen for auto-apply.")
    } catch (err) {
      console.error("Error during auto-apply:", err)
    }
  }
}
function handleShortcutError(errorMessage) {
  console.error("Shortcut Error:", errorMessage)
  alert(`Shortcut Error:\n${errorMessage}\n\nPlease choose different keys.`)
  if (settingsInputs.runInTrayCheckbox)
    settingsInputs.runInTrayCheckbox.checked = false
  if (settingsInputs.currentShortcutDisplay)
    settingsInputs.currentShortcutDisplay.textContent = formatAccelerator(
      state.quickAddShortcut
    )
  state.runInTray = false
  updateShortcutInputVisibility()
  saveState()
  window.electronAPI.updateSettings({
    runInTray: false,
    quickAddShortcut: state.quickAddShortcut,
  })
}
function formatAccelerator(accelerator) {
  if (!accelerator) return ""
  const platform = window.electronAPI.getPlatform()
  let d = accelerator
  if (platform === "darwin") {
    d = d
      .replace(/CommandOrControl|CmdOrCtrl/g, "Cmd")
      .replace(/Control/g, "Ctrl")
      .replace(/Alt/g, "Option")
  } else {
    d = d.replace(/CommandOrControl|CmdOrCtrl|Command|Meta/g, "Ctrl")
  }
  return d.replace(/\+/g, " + ")
}
function handleWindowStateChange({ isMaximized }) {
  console.log("Renderer received window state change - Maximized:", isMaximized)
  document.body.classList.toggle("maximized", isMaximized)
  if (maximizeRestoreBtn && maximizeIcon && restoreIcon) {
    maximizeRestoreBtn.title = isMaximized ? "Restore" : "Maximize"
    maximizeRestoreBtn.setAttribute(
      "aria-label",
      isMaximized ? "Restore" : "Maximize"
    )
    maximizeIcon.classList.toggle("hidden", isMaximized)
    restoreIcon.classList.toggle("hidden", !isMaximized)
  } else {
    console.warn(
      "Could not find maximize/restore button or icons to update state."
    )
  }
}
function initializeCollapsibleSections() {
  const tBtns = settingsColumn.querySelectorAll(".setting-section-toggle")
  tBtns.forEach((b) => {
    const s = b.closest(".setting-section"),
      c = s.querySelector(".setting-section-content"),
      iC = s.classList.contains("collapsed")
    b.setAttribute("aria-expanded", !iC)
    if (c && iC) {
      c.style.transition = "none"
      c.style.maxHeight = "0"
      c.style.opacity = "0"
      c.style.visibility = "hidden"
      c.offsetHeight
      c.style.transition = ""
    } else if (c && !iC) {
      c.style.transition = "none"
      c.style.maxHeight = "none"
      const sh = c.scrollHeight
      c.style.maxHeight = sh + "px"
      c.offsetHeight
      c.style.transition = ""
    }
  })
}
function handleSettingToggleClick(button) {
  const s = button.closest(".setting-section"),
    c = s.querySelector(".setting-section-content")
  if (!s || !c) return
  s.classList.toggle("collapsed")
  const iC = s.classList.contains("collapsed")
  button.setAttribute("aria-expanded", !iC)
  if (iC) {
    c.style.maxHeight = c.scrollHeight + "px"
    requestAnimationFrame(() => {
      c.style.maxHeight = "0"
      c.style.opacity = "0"
    })
  } else {
    c.style.visibility = "visible"
    c.style.opacity = "1"
    requestAnimationFrame(() => {
      c.style.maxHeight = c.scrollHeight + "px"
    })
    c.addEventListener(
      "transitionend",
      () => {
        if (!s.classList.contains("collapsed")) c.style.maxHeight = "none"
      },
      { once: true }
    )
  }
}

// --- Start the application ---
initialize()
