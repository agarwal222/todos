// renderer.js
import {
  initialState,
  DEFAULT_FONT,
  DEFAULT_WEIGHT,
  DEFAULT_TEXT_COLOR,
  DEFAULT_BG_COLOR,
  DEFAULT_SHORTCUT,
  DEFAULT_TEXT_BG_COLOR,
  DEFAULT_TEXT_BORDER_COLOR,
  DEFAULT_OVERALL_OPACITY,
  DEFAULT_PANEL_OPACITY,
} from "./state.js"
import * as utils from "./utils.js" // Import all utils

// --- DOM Elements ---
// (Keep all DOM element references as they were)
const applyWallpaperBtn = document.getElementById("apply-wallpaper-btn")
const toggleSettingsBtn = document.getElementById("toggle-settings-btn")
const settingsIconOpen = document.getElementById("settings-icon-open")
const settingsIconClose = document.getElementById("settings-icon-close")
const todoListUl = document.getElementById("todo-list")
const completedTodoListUl = document.getElementById("completed-todo-list")
const completedHeader = document.querySelector(".completed-header")
const completedListContainer = document.querySelector(
  ".completed-list-container"
)
const clearCompletedBtn = document.getElementById("clear-completed-btn")
const settingsColumn = document.getElementById("settings-column")
const previewContainer = document.getElementById("preview-container")
const previewLoader = document.getElementById("preview-loader")
const previewAreaImg = document.getElementById("preview-area")
const minimizeBtn = document.getElementById("minimize-btn")
const maximizeRestoreBtn = document.getElementById("maximize-restore-btn")
const maximizeIcon = maximizeRestoreBtn?.querySelector(".icon-maximize")
const restoreIcon = maximizeRestoreBtn?.querySelector(".icon-restore")
const closeBtn = document.getElementById("close-btn")
const settingsInputs = {
  /* ... (keep existing settings inputs) ... */
  title: document.getElementById("wallpaper-title-input"),
  textColorPickerEl: document.getElementById("text-color-picker"),
  textColorHex: document.getElementById("text-color-hex"),
  fontSize: document.getElementById("font-size"),
  fontWeight: document.getElementById("font-weight-select"),
  listStyle: document.getElementById("list-style-select"),
  overallOpacity: document.getElementById("overall-opacity"),
  textPosition: document.getElementById("text-position"),
  textAlign: document.getElementById("text-align-select"),
  offsetX: document.getElementById("offset-x"),
  offsetY: document.getElementById("offset-y"),
  titleSpacing: document.getElementById("title-spacing-input"),
  itemSpacing: document.getElementById("item-spacing-input"),
  maxItems: document.getElementById("max-items-input"),
  columnGap: document.getElementById("column-gap-input"),
  textBackgroundEnable: document.getElementById("text-background-enable"),
  textBackgroundControls: document.getElementById("text-background-controls"),
  textBgColorPickerEl: document.getElementById("text-bg-color-picker"),
  textBgColorHex: document.getElementById("text-bg-color-hex"),
  textPanelOpacity: document.getElementById("text-panel-opacity"),
  textBgPaddingInline: document.getElementById("text-bg-padding-inline"),
  textBgPaddingBlock: document.getElementById("text-bg-padding-block"),
  textBgBorderRadius: document.getElementById("text-bg-border-radius"),
  textBorderColorPickerEl: document.getElementById("text-border-color-picker"),
  textBorderColorHex: document.getElementById("text-border-color-hex"),
  textBgBorderWidth: document.getElementById("text-bg-border-width"),
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
  quickAddTranslucentCheckbox: document.getElementById(
    "quick-add-translucent-checkbox"
  ),
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
const editTodoModal = document.getElementById("edit-todo-modal")
const editModalCloseBtn = document.getElementById("edit-modal-close-btn")
const editModalCancelBtn = document.getElementById("edit-modal-cancel-btn")
const editTodoForm = document.getElementById("edit-todo-form")
const modalEditInput = document.getElementById("modal-edit-input")
const editTodoIdInput = document.getElementById("edit-todo-id")
const recordShortcutModal = document.getElementById("record-shortcut-modal")
const recordModalCloseBtn = document.getElementById("record-modal-close-btn")
const shortcutDisplayArea = document.getElementById("shortcut-display-area")
const recordCancelBtn = document.getElementById("record-cancel-btn")
const recordSaveBtn = document.getElementById("record-save-btn")
const updateNotificationArea = document.getElementById(
  "update-notification-area"
)
const updateMessage = document.getElementById("update-message")
const restartButton = document.getElementById("restart-button")
const recordInstructions = recordShortcutModal.querySelector(
  ".record-instructions"
)
const canvas = document.getElementById("image-canvas")
const ctx = canvas.getContext("2d")
const toastContainer = document.getElementById("toast-container")

// --- Application State ---
// Start with a deep copy of the initial state structure
// This 'state' variable will be mutated directly throughout this file
let state = JSON.parse(JSON.stringify(initialState))

let isRecordingShortcut = false
let pressedKeys = new Set()
let currentRecordedString = ""
let lastMainKeyPressed = null
let systemFontsCache = []
let textColorPickr = null
let bgColorPickr = null
let textBgColorPickr = null
let textBorderColorPickr = null

// --- Initialization ---
async function initialize() {
  console.log("Initializing Renderer...")
  const dims = window.electronAPI.getScreenDimensions()
  if (dims?.width && dims?.height) {
    state.screenWidth = dims.width
    state.screenHeight = dims.height
  } else {
    console.warn("Could not get screen dimensions sync, using defaults.")
  }
  setCanvasAndPreviewSize(state.screenWidth, state.screenHeight)

  loadState() // Load saved state, potentially overriding defaults
  await populateSystemFonts()
  setupAutoUpdaterListeners()
  initializeColorPickers()
  applyStateToUI() // Apply the potentially loaded state to the UI
  previewContainer.classList.remove("loaded")

  console.log("Sending loaded settings to main process:", {
    runInTray: state.runInTray,
    quickAddShortcut: state.quickAddShortcut,
    quickAddTranslucent: state.quickAddTranslucent,
  })
  window.electronAPI.sendRendererSettingsLoaded({
    runInTray: state.runInTray,
    quickAddShortcut: state.quickAddShortcut,
    quickAddTranslucent: state.quickAddTranslucent,
  })

  let fontLoadPromise = Promise.resolve()
  try {
    if (state.fontSource === "google" && state.googleFontName) {
      fontLoadPromise = loadAndApplyGoogleFont(state.googleFontName, false)
    } else if (state.fontSource === "system" && state.systemFontFamily) {
      state.activeFontFamily = state.systemFontFamily
      updateFontStatus("loaded", state.activeFontFamily)
    } else {
      // Ensure default state if loaded state is inconsistent
      state.activeFontFamily = DEFAULT_FONT
      state.fontSource = "default"
      state.systemFontFamily = ""
      state.googleFontName = ""
      updateFontStatus("idle", DEFAULT_FONT)
    }
  } catch (err) {
    console.warn("Initial font setup/load failed:", err)
    state.activeFontFamily = DEFAULT_FONT
    state.fontSource = "default"
    applyStateToUI() // Re-apply potentially corrected state
    updateFontStatus("error", DEFAULT_FONT, "Initial load failed")
  }

  renderTodoList() // Render initial list

  // Generate initial preview after font loading attempt finishes
  fontLoadPromise
    .catch((err) => console.warn("Font loading promise rejected:", err))
    .finally(() => {
      generateTodoImageAndUpdatePreview()
    })

  setupEventListeners()
  initializeCollapsibleSections()

  // Setup IPC listeners
  window.electronAPI.onAddTaskAndApply(handleQuickAddTaskAndApply)
  window.electronAPI.onShortcutError(handleShortcutError)
  window.electronAPI.onGetTodosRequest(() => {
    if (window.electronAPI?.sendTodosResponse)
      window.electronAPI.sendTodosResponse(state.todos)
  })
  window.electronAPI.onWindowStateChange(handleWindowStateChange)
  window.electronAPI.onForceSettingUpdate(handleForcedSettingUpdate)
  window.electronAPI.onPerformTaskToggle((taskId) => {
    console.log(`Renderer received toggle request for task ID: ${taskId}`)
    toggleDone(taskId)
    renderTodoList()
    saveState()
    generateTodoImageAndUpdatePreview()
      .then(() => handleApplyWallpaper())
      .catch((err) => {
        console.error("Error applying wallpaper after toggle:", err)
        utils.showToast(toastContainer, "Error applying wallpaper.", "error")
      })
  })
  window.electronAPI.onPerformTaskDelete((taskId) => {
    console.log(`Renderer received delete request for task ID: ${taskId}`)
    deleteTodo(taskId)
    renderTodoList()
    saveState()
    generateTodoImageAndUpdatePreview()
      .then(() => handleApplyWallpaper())
      .catch((err) => {
        console.error("Error applying wallpaper after delete:", err)
        utils.showToast(toastContainer, "Error applying wallpaper.", "error")
      })
  })

  const platform = window.electronAPI.getPlatform()
  document.body.dataset.platform = platform
  console.log("Renderer initialized on platform:", platform)
}

// --- Set Canvas & Preview Size ---
function setCanvasAndPreviewSize(width, height) {
  canvas.width = width
  canvas.height = height
  if (previewContainer) {
    previewContainer.style.setProperty(
      "--preview-aspect-ratio",
      `${width}/${height}`
    )
  }
}

// --- Populate System Fonts ---
async function populateSystemFonts() {
  try {
    systemFontsCache = await window.electronAPI.getSystemFonts()
    settingsInputs.systemFontSelect.innerHTML = ""
    if (!systemFontsCache || systemFontsCache.length === 0) {
      const o = document.createElement("option")
      o.value = ""
      o.textContent = "No fonts found"
      o.disabled = true
      settingsInputs.systemFontSelect.appendChild(o)
      return
    }
    const d = document.createElement("option")
    d.value = ""
    d.textContent = "Select System Font..."
    settingsInputs.systemFontSelect.appendChild(d)
    systemFontsCache.forEach((f) => {
      const o = document.createElement("option")
      o.value = f
      o.textContent = f
      settingsInputs.systemFontSelect.appendChild(o)
    })
  } catch (e) {
    console.error("Error fetching system fonts:", e)
    settingsInputs.systemFontSelect.innerHTML =
      '<option value="" disabled selected>Error loading fonts</option>'
  }
}

// --- Initialize Color Pickers ---
function initializeColorPickers() {
  const options = (elId, defaultColor, stateProp) => ({
    el: settingsInputs[elId],
    theme: "nano",
    defaultRepresentation: "HEXA",
    default: state[stateProp] || defaultColor, // Use current state or default
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
  })

  const onSave = (prop, hexInputId) => (color, instance) => {
    const newColor = color.toHEXA().toString()
    if (state[prop] !== newColor) {
      state[prop] = newColor
      settingsInputs[hexInputId].value = newColor
      settingsInputs[hexInputId].classList.remove("invalid")
      generateTodoImageAndUpdatePreview()
      saveState()
    }
    instance.hide()
  }

  const onChange = (hexInputId) => (color, source, instance) => {
    settingsInputs[hexInputId].value = color.toHEXA().toString()
    settingsInputs[hexInputId].classList.remove("invalid") // Remove invalid state on valid change
  }
  const onShow = (hexInputId) => (color, instance) => {
    // Ensure input matches picker on show
    settingsInputs[hexInputId].value = instance.getColor().toHEXA().toString()
    settingsInputs[hexInputId].classList.remove("invalid")
  }

  // Create Pickr instances
  textColorPickr = Pickr.create(
    options("textColorPickerEl", DEFAULT_TEXT_COLOR, "textColor")
  )
    .on("save", onSave("textColor", "textColorHex"))
    .on("change", onChange("textColorHex"))
    .on("show", onShow("textColorHex"))

  bgColorPickr = Pickr.create(
    options("bgColorPickerEl", DEFAULT_BG_COLOR, "bgColor")
  )
    .on("save", onSave("bgColor", "bgColorHex"))
    .on("change", onChange("bgColorHex"))
    .on("show", onShow("bgColorHex"))

  textBgColorPickr = Pickr.create(
    options("textBgColorPickerEl", DEFAULT_TEXT_BG_COLOR, "textBackgroundColor")
  )
    .on("save", onSave("textBackgroundColor", "textBgColorHex"))
    .on("change", onChange("textBgColorHex"))
    .on("show", onShow("textBgColorHex"))

  textBorderColorPickr = Pickr.create(
    options(
      "textBorderColorPickerEl",
      DEFAULT_TEXT_BORDER_COLOR,
      "textBackgroundBorderColor"
    )
  )
    .on("save", onSave("textBackgroundBorderColor", "textBorderColorHex"))
    .on("change", onChange("textBorderColorHex"))
    .on("show", onShow("textBorderColorHex"))
}

// --- UI Update Helpers ---
function updateShortcutInputVisibility() {
  const isTrayEnabled = state.runInTray
  if (settingsInputs.shortcutDisplayGroup) {
    settingsInputs.shortcutDisplayGroup.classList.toggle(
      "hidden",
      !isTrayEnabled
    )
  }
  const translucencyGroup =
    settingsInputs.quickAddTranslucentCheckbox?.closest(".input-group")
  if (translucencyGroup) {
    translucencyGroup.classList.toggle("hidden", !isTrayEnabled)
  }
}

function updateTextBackgroundControlsVisibility() {
  settingsInputs.textBackgroundControls?.classList.toggle(
    "hidden",
    !state.textBackgroundEnabled
  )
}

// --- Apply State to UI ---
function applyStateToUI() {
  settingsInputs.title.value = state.title
  settingsInputs.fontSize.value = state.fontSize
  settingsInputs.fontWeight.value = state.fontWeight
  settingsInputs.listStyle.value = state.listStyle
  settingsInputs.overallOpacity.value = state.overallOpacity
  settingsInputs.textPosition.value = state.textPosition
  settingsInputs.textAlign.value = state.textAlign
  settingsInputs.offsetX.value = state.offsetX
  settingsInputs.offsetY.value = state.offsetY
  settingsInputs.titleSpacing.value = state.titleBottomMargin
  settingsInputs.itemSpacing.value = state.itemSpacing
  settingsInputs.maxItems.value = state.maxItemsPerColumn
  settingsInputs.columnGap.value = state.columnGap

  // Text Background
  settingsInputs.textBackgroundEnable.checked = state.textBackgroundEnabled
  settingsInputs.textPanelOpacity.value = state.textPanelOpacity
  settingsInputs.textBgPaddingInline.value = state.textBackgroundPaddingInline
  settingsInputs.textBgPaddingBlock.value = state.textBackgroundPaddingBlock
  settingsInputs.textBgBorderRadius.value = state.textBackgroundBorderRadius
  settingsInputs.textBgBorderWidth.value = state.textBackgroundBorderWidth

  // Font
  settingsInputs.googleFontName.value = state.googleFontName || ""
  settingsInputs.fontSourceDefault.checked = state.fontSource === "default"
  settingsInputs.fontSourceSystem.checked = state.fontSource === "system"
  settingsInputs.fontSourceGoogle.checked = state.fontSource === "google"
  if (state.fontSource === "system" && state.systemFontFamily) {
    settingsInputs.systemFontSelect.value = state.systemFontFamily
  } else {
    settingsInputs.systemFontSelect.value = "" // Reset if not system or no font selected
  }

  // Wallpaper Background
  settingsInputs.bgTypeColor.checked = state.backgroundType === "color"
  settingsInputs.bgTypeImage.checked = state.backgroundType === "image"
  settingsInputs.imageFilenameSpan.textContent =
    state.backgroundImageName || "No file chosen"

  // Pickr Colors & Hex Inputs
  if (textColorPickr)
    textColorPickr.setColor(state.textColor || DEFAULT_TEXT_COLOR, true)
  settingsInputs.textColorHex.value = state.textColor || DEFAULT_TEXT_COLOR
  settingsInputs.textColorHex.classList.remove("invalid")

  if (bgColorPickr)
    bgColorPickr.setColor(state.bgColor || DEFAULT_BG_COLOR, true)
  settingsInputs.bgColorHex.value = state.bgColor || DEFAULT_BG_COLOR
  settingsInputs.bgColorHex.classList.remove("invalid")

  if (textBgColorPickr)
    textBgColorPickr.setColor(
      state.textBackgroundColor || DEFAULT_TEXT_BG_COLOR,
      true
    )
  settingsInputs.textBgColorHex.value =
    state.textBackgroundColor || DEFAULT_TEXT_BG_COLOR
  settingsInputs.textBgColorHex.classList.remove("invalid")

  if (textBorderColorPickr)
    textBorderColorPickr.setColor(
      state.textBackgroundBorderColor || DEFAULT_TEXT_BORDER_COLOR,
      true
    )
  settingsInputs.textBorderColorHex.value =
    state.textBackgroundBorderColor || DEFAULT_TEXT_BORDER_COLOR
  settingsInputs.textBorderColorHex.classList.remove("invalid")

  // App Behavior
  if (settingsInputs.runInTrayCheckbox)
    settingsInputs.runInTrayCheckbox.checked = state.runInTray
  if (settingsInputs.quickAddTranslucentCheckbox)
    settingsInputs.quickAddTranslucentCheckbox.checked =
      state.quickAddTranslucent
  if (settingsInputs.currentShortcutDisplay)
    settingsInputs.currentShortcutDisplay.textContent = utils.formatAccelerator(
      state.quickAddShortcut || DEFAULT_SHORTCUT
    )

  // Update visibility of conditional controls
  updateFontControlsVisibility()
  updateFontStatus(
    state.customFontStatus,
    state.activeFontFamily,
    state.customFontError
  )
  updateBackgroundControlsVisibility()
  updateShortcutInputVisibility()
  updateTextBackgroundControlsVisibility()

  // Settings Panel Collapse State
  settingsColumn.dataset.collapsed = state.settingsCollapsed
  updateToggleIcons(state.settingsCollapsed)
}

// --- State Management ---
function saveState() {
  try {
    // Create a plain object copy of the state for saving
    const stateToSave = { ...state }
    // Optional: remove transient state like lastGeneratedImageDataUrl if not needed
    // delete stateToSave.lastGeneratedImageDataUrl;
    localStorage.setItem("visidoState", JSON.stringify(stateToSave))
  } catch (e) {
    console.error("Save State Error:", e)
    utils.showToast(toastContainer, "Error saving settings.", "error")
  }
}

function loadState() {
  try {
    const savedState = localStorage.getItem("visidoState")
    const platform = window.electronAPI?.getPlatform() || "win32"
    const platformDefaultTranslucent = platform === "darwin"

    if (savedState) {
      const parsedState = JSON.parse(savedState)

      // Keep current screen dimensions
      const currentScreenDims = {
        screenWidth: state.screenWidth,
        screenHeight: state.screenHeight,
      }

      // Merge saved state with initial state structure to ensure all keys exist
      // and apply defaults for potentially missing keys in older saves
      state = {
        ...initialState, // Start with defaults
        ...parsedState, // Overwrite with saved values
        quickAddTranslucent:
          typeof parsedState.quickAddTranslucent === "boolean"
            ? parsedState.quickAddTranslucent
            : platformDefaultTranslucent, // Handle default platform translucency
        ...currentScreenDims, // Ensure screen dims are current
        // Reset transient state
        customFontStatus: "idle",
        customFontError: null,
        lastGeneratedImageDataUrl: null, // Don't load generated image from state
        // Ensure todos have context property
        todos: Array.isArray(parsedState.todos)
          ? parsedState.todos.map((t) => ({ ...t, context: t.context || "" }))
          : [],
      }

      // Logic to set active font based on loaded source
      if (state.fontSource === "system" && state.systemFontFamily) {
        state.activeFontFamily = state.systemFontFamily
      } else if (state.fontSource === "google" && state.googleFontName) {
        // Font will be loaded in initialize(), set family name for now
        state.activeFontFamily = state.googleFontName
      } else {
        // Default back to Inter if source is invalid or font missing
        state.fontSource = "default"
        state.activeFontFamily = DEFAULT_FONT
        state.systemFontFamily = ""
        state.googleFontName = ""
      }

      console.log("Loaded state:", state)
    } else {
      // No saved state, ensure platform default translucency is set
      state = {
        ...initialState,
        quickAddTranslucent: platformDefaultTranslucent,
        screenWidth: state.screenWidth, // Keep initial screen dims
        screenHeight: state.screenHeight,
      }
      console.log("No saved state found, using defaults.")
    }
  } catch (e) {
    console.error("Load State Error:", e)
    utils.showToast(toastContainer, "Error loading saved settings.", "error")
    // Fallback to initial state in case of error
    const platform = window.electronAPI?.getPlatform() || "win32"
    state = { ...initialState, quickAddTranslucent: platform === "darwin" }
  }
}

// --- Event Handlers ---

function handleGlobalKeyDown(event) {
  if (!addTodoModal.classList.contains("hidden")) {
    if (event.key === "Escape") closeModal()
  } else if (!editTodoModal.classList.contains("hidden")) {
    if (event.key === "Escape") closeEditModal()
  } // Close edit modal on Esc
  else if (isRecordingShortcut) {
    if (event.key === "Escape") closeRecordShortcutModal()
  } else {
    if ((event.ctrlKey || event.metaKey) && event.key === "n") {
      event.preventDefault()
      openModal()
    }
    if (event.altKey && event.key === "s") {
      event.preventDefault()
      handleToggleSettings()
    }
  }
}

function handleHexInputChange(event) {
  const input = event.target
  const value = input.value.trim()
  let pickrInstance = null
  let stateProp = null

  switch (input.id) {
    case "text-color-hex":
      pickrInstance = textColorPickr
      stateProp = "textColor"
      break
    case "bg-color-hex":
      pickrInstance = bgColorPickr
      stateProp = "bgColor"
      break
    case "text-bg-color-hex":
      pickrInstance = textBgColorPickr
      stateProp = "textBackgroundColor"
      break
    case "text-border-color-hex":
      pickrInstance = textBorderColorPickr
      stateProp = "textBackgroundBorderColor"
      break
  }

  if (utils.isValidHexColor(value)) {
    input.classList.remove("invalid")
    if (pickrInstance) {
      pickrInstance.setColor(value, true) // Update picker silently
    }
    // Update state only if different to avoid unnecessary redraws/saves
    if (state[stateProp] !== value) {
      state[stateProp] = value
      generateTodoImageAndUpdatePreview()
      saveState()
    }
  } else {
    input.classList.add("invalid")
  }
}

function handleSettingChange(event) {
  const target = event.target
  let requiresRegeneration = true // Assume regeneration needed unless specified otherwise
  let needsIpcUpdate = false

  const id = target.id
  const value = target.type === "checkbox" ? target.checked : target.value
  const key = target.name || id // Use name attribute for radios

  // Ignore color inputs handled by handleHexInputChange and pickers
  if (id.endsWith("-hex") || id.endsWith("-picker") || !key) return

  let stateChanged = false

  if (key === "font-source") {
    if (target.checked && state.fontSource !== value) {
      state.fontSource = value
      stateChanged = true
      requiresRegeneration = false // Font change itself doesn't regen until loaded/selected

      if (value === "default") {
        state.activeFontFamily = DEFAULT_FONT
        updateFontStatus("idle", DEFAULT_FONT)
        state.systemFontFamily = "" // Clear other sources
        state.googleFontName = ""
        requiresRegeneration = true // Regenerate with default font
      } else if (value === "system") {
        const selectedSystemFont = settingsInputs.systemFontSelect.value
        if (selectedSystemFont) {
          state.activeFontFamily = selectedSystemFont
          state.systemFontFamily = selectedSystemFont // Store selection
          updateFontStatus("loaded", selectedSystemFont)
          requiresRegeneration = true // Regenerate with new system font
        } else {
          state.activeFontFamily = DEFAULT_FONT // Fallback if no selection yet
          state.systemFontFamily = ""
          updateFontStatus("idle", DEFAULT_FONT)
        }
        state.googleFontName = "" // Clear other source
      } else if (value === "google") {
        state.systemFontFamily = "" // Clear other source
        // Don't change active font yet, requires load button press
        if (state.googleFontName && state.customFontStatus === "loaded") {
          updateFontStatus("loaded", state.activeFontFamily) // Reflect already loaded
        } else {
          updateFontStatus("idle", state.googleFontName || DEFAULT_FONT) // Show placeholder
          state.customFontStatus = "idle"
        }
      }
      updateFontControlsVisibility()
    }
  } else if (key === "bg-type") {
    if (target.checked && state.backgroundType !== value) {
      state.backgroundType = value
      stateChanged = true
      updateBackgroundControlsVisibility()
      // Regeneration happens immediately for background type change
    }
  } else {
    // Map element IDs/names to state properties
    const idToStateMap = {
      "wallpaper-title-input": "title",
      "font-size": "fontSize",
      "font-weight-select": "fontWeight",
      "list-style-select": "listStyle",
      "overall-opacity": "overallOpacity",
      "text-position": "textPosition",
      "text-align-select": "textAlign",
      "offset-x": "offsetX",
      "offset-y": "offsetY",
      "title-spacing-input": "titleBottomMargin",
      "item-spacing-input": "itemSpacing",
      "max-items-input": "maxItemsPerColumn",
      "column-gap-input": "columnGap",
      "text-background-enable": "textBackgroundEnabled",
      "text-panel-opacity": "textPanelOpacity",
      "text-bg-padding-inline": "textBackgroundPaddingInline",
      "text-bg-padding-block": "textBackgroundPaddingBlock",
      "text-bg-border-radius": "textBackgroundBorderRadius",
      "text-bg-border-width": "textBackgroundBorderWidth",
      "system-font-select": "systemFontFamily",
      "google-font-name": "googleFontName",
      "run-in-tray-checkbox": "runInTray",
      "quick-add-translucent-checkbox": "quickAddTranslucent",
    }
    const propertyName = idToStateMap[id]

    if (propertyName && state.hasOwnProperty(propertyName)) {
      const oldValue = state[propertyName]
      let newValue = value

      // Type coercion/validation
      if (target.type === "number") {
        newValue = parseFloat(value)
        if (isNaN(newValue)) newValue = 0 // Default to 0 if invalid number
        if (target.min !== "" && newValue < parseFloat(target.min))
          newValue = parseFloat(target.min)
        if (target.max !== "" && newValue > parseFloat(target.max))
          newValue = parseFloat(target.max)
        const step = target.getAttribute("step")
        if (!step || step === "1") {
          // Round if step is 1 or not defined
          newValue = Math.round(newValue)
        }
      } else if (target.type === "checkbox") {
        newValue = target.checked
      }

      if (oldValue !== newValue) {
        state[propertyName] = newValue
        stateChanged = true

        // Handle side effects and determine if regeneration/IPC needed
        if (propertyName === "runInTray") {
          needsIpcUpdate = true
          updateShortcutInputVisibility()
          requiresRegeneration = false
        } else if (propertyName === "quickAddTranslucent") {
          needsIpcUpdate = true
          requiresRegeneration = false
        } else if (propertyName === "textBackgroundEnabled") {
          updateTextBackgroundControlsVisibility()
        } else if (
          propertyName === "systemFontFamily" &&
          state.fontSource === "system"
        ) {
          if (newValue) {
            // Font selected
            state.activeFontFamily = newValue
            updateFontStatus("loaded", newValue)
            // Requires regeneration
          } else {
            // Font deselected
            state.activeFontFamily = DEFAULT_FONT
            updateFontStatus("idle", DEFAULT_FONT)
            requiresRegeneration = false // Don't regen if no font selected
          }
        } else if (propertyName === "googleFontName") {
          // Reset status if name changes after loading/error
          if (
            state.customFontStatus === "loaded" ||
            state.customFontStatus === "error"
          ) {
            updateFontStatus("idle", state.activeFontFamily)
            state.customFontStatus = "idle"
          }
          requiresRegeneration = false
        }

        // List of properties that *don't* require immediate image regeneration
        const nonRegenProps = [
          "runInTray",
          "quickAddTranslucent",
          "googleFontName",
        ]
        // If system font source active, but selection is cleared, don't regen
        if (
          propertyName === "systemFontFamily" &&
          state.fontSource === "system" &&
          !newValue
        ) {
          requiresRegeneration = false
        }
        if (nonRegenProps.includes(propertyName)) {
          requiresRegeneration = false
        }
      }
    } else {
      console.warn(
        `State property not found or unmapped for element ID/name: ${id}`
      )
    }
  }

  // Perform actions if state actually changed
  if (stateChanged) {
    if (requiresRegeneration) {
      generateTodoImageAndUpdatePreview()
    }
    saveState() // Save on any meaningful change
    if (needsIpcUpdate) {
      console.log("Renderer: Sending updated settings to main:", {
        runInTray: state.runInTray,
        quickAddShortcut: state.quickAddShortcut,
        quickAddTranslucent: state.quickAddTranslucent,
      })
      window.electronAPI.updateSettings({
        runInTray: state.runInTray,
        quickAddShortcut: state.quickAddShortcut,
        quickAddTranslucent: state.quickAddTranslucent,
      })
    }
  }
}

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

  // Settings Inputs Listener (delegated slightly differently)
  settingsColumn.addEventListener("input", handleSettingChange) // Use input for text/numbers
  settingsColumn.addEventListener("change", handleSettingChange) // Use change for select/checkbox/radio

  // Specific listeners for hex inputs
  settingsInputs.textColorHex.addEventListener("input", handleHexInputChange)
  settingsInputs.bgColorHex.addEventListener("input", handleHexInputChange)
  settingsInputs.textBgColorHex.addEventListener("input", handleHexInputChange)
  settingsInputs.textBorderColorHex.addEventListener(
    "input",
    handleHexInputChange
  )

  // Button listeners
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

  // Todo List Click Delegation (Handles toggle, edit, delete)
  const todoColumn = document.querySelector(".column-todos")
  if (todoColumn) todoColumn.addEventListener("click", handleListClick)

  // Add Task Modal
  openAddTodoModalBtn.addEventListener("click", openModal)
  modalCloseBtn.addEventListener("click", closeModal)
  modalCancelBtn.addEventListener("click", closeModal)
  addTodoForm.addEventListener("submit", handleModalSubmit)
  addTodoModal.addEventListener("click", (e) => {
    if (e.target === addTodoModal) closeModal()
  })

  // Edit Task Modal
  editModalCloseBtn.addEventListener("click", closeEditModal)
  editModalCancelBtn.addEventListener("click", closeEditModal)
  editTodoForm.addEventListener("submit", handleEditModalSubmit)
  editTodoModal.addEventListener("click", (e) => {
    if (e.target === editTodoModal) closeEditModal()
  })

  // Record Shortcut Modal
  recordModalCloseBtn.addEventListener("click", closeRecordShortcutModal)
  recordCancelBtn.addEventListener("click", closeRecordShortcutModal)
  recordSaveBtn.addEventListener("click", handleSaveShortcut)
  recordShortcutModal.addEventListener("click", (e) => {
    if (e.target === recordShortcutModal) closeRecordShortcutModal()
  })

  // Clear Completed Button
  if (clearCompletedBtn)
    clearCompletedBtn.addEventListener("click", handleClearCompleted)

  // Global Key Listener
  document.addEventListener("keydown", handleGlobalKeyDown)

  // Settings Section Toggles
  settingsColumn.addEventListener("click", (e) => {
    const t = e.target.closest(".setting-section-toggle")
    if (t) handleSettingToggleClick(t)
  })
  console.log("Event listeners setup complete.")
}

function setupAutoUpdaterListeners() {
  window.electronAPI.onUpdateAvailable((i) => {
    console.log("Update available:", i)
    showUpdateMessage(`Update v${i.version} available. Downloading...`)
    if (restartButton) restartButton.style.display = "none"
  })
  window.electronAPI.onUpdateDownloaded((i) => {
    console.log("Update downloaded:", i)
    showUpdateMessage(`Update v${i.version} downloaded. Restart to install.`)
    if (restartButton) restartButton.style.display = "inline-flex"
  })
  window.electronAPI.onUpdateError((e) => {
    console.error("Update error:", e)
    showUpdateMessage(`Error checking for updates: ${e}`)
    if (restartButton) restartButton.style.display = "none"
    setTimeout(hideUpdateMessage, 8000)
  })
  window.electronAPI.onDownloadProgress((p) => {
    console.log(`Download progress: ${p.percent}%`)
    showUpdateMessage(`Downloading update: ${Math.round(p.percent)}%`)
  })
  if (restartButton) {
    restartButton.addEventListener("click", () => {
      console.log("Restart button clicked")
      window.electronAPI.restartApp()
    })
  }
}

function showUpdateMessage(message) {
  if (updateNotificationArea && updateMessage) {
    updateMessage.textContent = message
    updateNotificationArea.classList.remove("hidden", "hiding")
    updateNotificationArea.classList.add("visible")
  }
}

function hideUpdateMessage() {
  if (updateNotificationArea) {
    updateNotificationArea.classList.remove("visible")
    updateNotificationArea.classList.add("hiding")
    setTimeout(() => {
      if (
        updateNotificationArea &&
        !updateNotificationArea.classList.contains("visible")
      ) {
        updateNotificationArea.classList.add("hidden")
        updateNotificationArea.classList.remove("hiding")
        if (restartButton) restartButton.style.display = "none"
      }
    }, 500)
  }
}

// --- Todo Management ---
function addTodo(text) {
  const trimmedText = text.trim()
  if (trimmedText) {
    state.todos.push({
      id: Date.now(),
      text: trimmedText,
      context: "",
      done: false,
    })
    return true // Indicate success
  }
  return false // Indicate failure (empty task)
}

function deleteTodo(id) {
  state.todos = state.todos.filter((todo) => todo.id !== id)
}

function toggleDone(id) {
  const todo = state.todos.find((t) => t.id === id)
  if (todo) todo.done = !todo.done
}

// --- UI Rendering ---
function renderTodoList() {
  todoListUl.innerHTML = ""
  completedTodoListUl.innerHTML = ""
  if (!Array.isArray(state.todos)) state.todos = []

  const activeTodos = state.todos.filter((t) => !t.done)
  const completedTodos = state.todos.filter((t) => t.done)

  // Active Tasks
  if (activeTodos.length === 0) {
    todoListUl.innerHTML = `<li class="empty-list-message">No active tasks!</li>`
  } else {
    activeTodos.forEach((t) => todoListUl.appendChild(createTodoElement(t)))
  }

  // Completed Tasks Section Visibility
  const hasCompleted = completedTodos.length > 0
  completedHeader.classList.toggle("hidden", !hasCompleted)
  completedListContainer.classList.toggle("hidden", !hasCompleted)
  if (clearCompletedBtn)
    clearCompletedBtn.style.display = hasCompleted ? "inline-flex" : "none" // Show/hide clear button

  if (hasCompleted) {
    completedTodos.forEach((t) =>
      completedTodoListUl.appendChild(createTodoElement(t))
    )
  }

  addContextInputListeners() // Re-attach listeners after rendering
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
  const d = document.createElement("div")
  d.className = "task-details"
  const s = document.createElement("span")
  s.textContent = todo.text
  s.classList.add("todo-text")
  const ci = document.createElement("input")
  ci.type = "text"
  ci.classList.add("context-input")
  ci.placeholder = "Add context..."
  ci.value = todo.context || ""
  ci.dataset.id = todo.id
  ci.maxLength = utils.CONTEXT_MAX_LENGTH // Use constant from utils
  d.appendChild(s)
  d.appendChild(ci)
  const ab = document.createElement("div")
  ab.className = "task-actions"
  const eb = document.createElement("button")
  eb.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" width="14" height="14"><path d="M13.488 2.513a1.75 1.75 0 0 0-2.475 0L3.763 9.763a1.75 1.75 0 0 0-.44 1.06l-.663 3.18a.75.75 0 0 0 .914.914l3.18-.662a1.75 1.75 0 0 0 1.06-.44l7.25-7.25a1.75 1.75 0 0 0 0-2.475ZM4.753 10.61l6.875-6.875 1.118 1.118-6.875 6.875-1.528.318.41-1.964.001-.002Z"></path></svg>`
  eb.className = "button button-ghost button-icon edit-btn"
  eb.title = "Edit Task"
  eb.setAttribute("aria-label", "Edit task")
  const db = document.createElement("button")
  db.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" width="14" height="14"><path fill-rule="evenodd" d="M5 3.25V4H2.75a.75.75 0 0 0 0 1.5h.3l.815 8.15A1.5 1.5 0 0 0 5.357 15h5.285a1.5 1.5 0 0 0 1.493-1.35l.815-8.15h.3a.75.75 0 0 0 0-1.5H11v-.75A2.25 2.25 0 0 0 8.75 1h-1.5A2.25 2.25 0 0 0 5 3.25Zm2.25-.75a.75.75 0 0 0-.75.75V4h3v-.75a.75.75 0 0 0-.75-.75h-1.5ZM6.05 6a.75.75 0 0 1 .787.713l.275 5.5a.75.75 0 0 1-1.498.075l-.275-5.5A.75.75 0 0 1 6.05 6Zm3.9 0a.75.75 0 0 1 .712.787l-.275 5.5a.75.75 0 0 1-1.498-.075l.275-5.5a.75.75 0 0 1 .786-.711Z" clip-rule="evenodd" /></svg>`
  db.className = "button button-ghost button-icon delete-btn"
  db.title = "Delete Task"
  db.setAttribute("aria-label", "Delete task")
  ab.appendChild(eb)
  ab.appendChild(db)
  li.appendChild(cb)
  li.appendChild(d)
  li.appendChild(ab)
  return li
}

function handleContextChange(event) {
  const input = event.target
  if (!input.classList.contains("context-input")) return
  const id = parseInt(input.dataset.id, 10)
  const todo = state.todos.find((t) => t.id === id)
  if (todo) {
    let newContext = input.value
    // Use constant from utils
    if (newContext.length > utils.CONTEXT_MAX_LENGTH) {
      newContext = newContext.substring(0, utils.CONTEXT_MAX_LENGTH)
      input.value = newContext // Update input value if truncated
    }
    if (todo.context !== newContext) {
      todo.context = newContext
      console.log(`Context updated for ID ${id}: "${newContext}"`)
      saveState()
      generateTodoImageAndUpdatePreview() // Regenerate preview on context change
    }
  }
}

function addContextInputListeners() {
  // Ensure listeners are attached to both lists
  todoListUl.removeEventListener("input", handleContextChange)
  todoListUl.addEventListener("input", handleContextChange)
  completedTodoListUl.removeEventListener("input", handleContextChange)
  completedTodoListUl.addEventListener("input", handleContextChange)
}

// --- Wallpaper Generation ---
async function generateTodoImageAndUpdatePreview() {
  // Destructure needed state props
  const {
    title,
    listStyle,
    activeFontFamily,
    fontWeight,
    backgroundType,
    bgColor,
    backgroundImageDataUrl,
    textColor,
    overallOpacity,
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
    textBackgroundEnabled,
    textBackgroundColor,
    textBackgroundPaddingInline,
    textBackgroundPaddingBlock,
    textBackgroundBorderWidth,
    textBackgroundBorderColor,
    textPanelOpacity,
    textBackgroundBorderRadius,
  } = state

  if (!ctx || !canvas) {
    console.error("Canvas context not available.")
    return Promise.reject("Canvas context unavailable.")
  }
  // Ensure canvas size matches current state
  if (canvas.width !== screenWidth || canvas.height !== screenHeight) {
    setCanvasAndPreviewSize(screenWidth, screenHeight)
  }

  const currentActiveFont = activeFontFamily || DEFAULT_FONT
  const itemFontSize = parseInt(fontSize, 10) || 48
  // Filter active todos directly here
  const linesToDraw = todos
    .filter((t) => !t.done)
    .map((t) => ({ text: t.text, context: t.context || "", done: false }))
  const padding = Math.max(60, itemFontSize * 1.5) // Dynamic padding based on font size
  const titleSpacing = parseInt(titleBottomMargin, 10) || 40
  const spacingBetweenItems = parseInt(itemSpacing, 10) || 20
  const maxItems = Math.max(1, parseInt(maxItemsPerColumn, 10) || 10)
  const colGap = Math.max(0, parseInt(columnGap, 10) || 50)
  const titleFontSize = Math.round(itemFontSize * 1.2)
  const contextFontSize = Math.round(itemFontSize * 0.6)
  const contextTopMargin = Math.round(spacingBetweenItems * 0.3) // Context margin based on item spacing

  previewContainer.classList.remove("loaded") // Show loader

  try {
    ctx.clearRect(0, 0, screenWidth, screenHeight)

    // Draw Background (using utils)
    if (backgroundType === "image" && backgroundImageDataUrl) {
      try {
        const img = await utils.loadImage(backgroundImageDataUrl)
        utils.drawBackgroundImage(ctx, img, screenWidth, screenHeight)
      } catch (e) {
        console.error("Background Image Error:", e)
        utils.drawBackgroundColor(ctx, bgColor, screenWidth, screenHeight) // Fallback color
      }
    } else {
      utils.drawBackgroundColor(ctx, bgColor, screenWidth, screenHeight)
    }

    // Calculate Text Block Dimensions (using utils)
    const textBlockMetrics = utils.calculateTextBlockDimensions(ctx, {
      title,
      fontName: currentActiveFont,
      fontWeight,
      titleFontSize,
      itemFontSize,
      contextFontSize,
      contextTopMargin,
      titleSpacing,
      itemSpacing: spacingBetweenItems,
      lines: linesToDraw,
      maxItemsPerColumn: maxItems,
      columnGap: colGap,
      listStyle,
    })

    // Calculate Start Position (using utils)
    const { startX: textStartX, startY: textStartY } =
      utils.calculateTextStartPositionMultiCol(
        screenWidth,
        screenHeight,
        padding,
        textBlockMetrics.titleHeight,
        textBlockMetrics.maxColumnItemHeight,
        titleSpacing,
        spacingBetweenItems,
        maxItems,
        linesToDraw.length,
        textPosition,
        offsetX,
        offsetY,
        textBlockMetrics
      )

    // Apply Overall Opacity
    const originalAlpha = ctx.globalAlpha
    ctx.globalAlpha = Math.max(0, Math.min(1, overallOpacity))

    // Draw Text Background Panel (if enabled, using utils)
    if (textBackgroundEnabled) {
      utils.drawTextBackgroundPanel(ctx, {
        x: textStartX,
        y: textStartY,
        width: textBlockMetrics.overallWidth,
        height: textBlockMetrics.overallHeight,
        paddingInline: textBackgroundPaddingInline,
        paddingBlock: textBackgroundPaddingBlock,
        bgColor: textBackgroundColor,
        opacity: textPanelOpacity,
        borderColor: textBackgroundBorderColor,
        borderWidth: textBackgroundBorderWidth,
        borderRadius: textBackgroundBorderRadius,
        textAlign: textAlign,
      })
    }

    // Draw Text Elements (using utils)
    utils.drawTextElementsMultiCol(ctx, {
      title,
      textColor,
      textAlign,
      fontName: currentActiveFont,
      fontWeight,
      titleFontSize,
      itemFontSize,
      contextFontSize,
      contextTopMargin,
      titleSpacing,
      itemSpacing: spacingBetweenItems,
      lines: linesToDraw,
      startX: textStartX,
      startY: textStartY,
      listStyle,
      maxItemsPerColumn: maxItems,
      columnGap: colGap,
    })

    // Restore global alpha
    ctx.globalAlpha = originalAlpha

    // Update the preview image element
    updatePreviewImage()
  } catch (err) {
    console.error("Error during image generation process:", err)
    updatePreviewImage() // Still try to update (might show blank or old image)
    throw err // Re-throw for potential upstream handling
  }
}

function updatePreviewImage() {
  try {
    state.lastGeneratedImageDataUrl = canvas.toDataURL("image/png")
    previewAreaImg.onload = () => {
      previewContainer.classList.add("loaded") // Hide loader on successful load
    }
    previewAreaImg.onerror = () => {
      console.error("Preview image failed to load from data URL.")
      previewContainer.classList.remove("loaded") // Ensure loader is visible on error
      previewAreaImg.src = "" // Clear broken src
      if (previewLoader) previewLoader.textContent = "Preview Error"
    }
    previewAreaImg.src = state.lastGeneratedImageDataUrl
  } catch (e) {
    console.error("Preview Gen Error (canvas.toDataURL or setting src):", e)
    previewContainer.classList.remove("loaded")
    previewAreaImg.src = ""
    state.lastGeneratedImageDataUrl = null // Invalidate data URL
    if (previewLoader) previewLoader.textContent = "Generation Error"
  }
}

// --- Font Handling ---
async function handleLoadFontClick() {
  const fontName = settingsInputs.googleFontName.value.trim()
  if (!fontName) {
    updateFontStatus("error", state.activeFontFamily, "Enter Google Font name")
    utils.showToast(toastContainer, "Please enter a Google Font name.", "error")
    return
  }
  await loadAndApplyGoogleFont(fontName, true) // Save state after loading
}

async function loadAndApplyGoogleFont(fontName, shouldSaveState = true) {
  updateFontStatus("loading", state.activeFontFamily) // Indicate loading
  try {
    const fontWeight = state.fontWeight || DEFAULT_WEIGHT // Use current weight
    const result = await window.electronAPI.loadGoogleFontByName(
      fontName,
      fontWeight
    )

    if (result.success && result.fontFamily && result.fontDataUrl) {
      const actualFontFamily = result.fontFamily // Name returned by Google might differ
      const actualWeight = result.fontWeight // Actual weight loaded

      // Use FontFace API to load the font into the document
      const fontFace = new FontFace(
        actualFontFamily,
        `url(${result.fontDataUrl})`,
        { weight: actualWeight }
      )
      await fontFace.load() // Load the font data
      document.fonts.add(fontFace) // Add to document's font set
      await document.fonts.ready // Wait for font to be usable

      console.log(`Font loaded and added: ${actualFontFamily} ${actualWeight}`)

      // Update state
      state.activeFontFamily = actualFontFamily
      state.googleFontName = fontName // Store the requested name
      state.customFontStatus = "loaded"
      state.customFontError = null

      updateFontStatus("loaded", actualFontFamily)
      utils.showToast(
        toastContainer,
        `Font "${actualFontFamily}" loaded!`,
        "success"
      )
      generateTodoImageAndUpdatePreview() // Regenerate with new font
      if (shouldSaveState) saveState()
    } else {
      throw new Error(
        result.error ||
          `Could not load font "${fontName}". Check spelling and availability.`
      )
    }
  } catch (e) {
    console.error("Google Font Load Error:", e)
    state.customFontStatus = "error"
    state.customFontError = e.message
    updateFontStatus("error", state.activeFontFamily, e.message) // Show error status
    utils.showToast(toastContainer, `Error loading font: ${e.message}`, "error")
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
  state.customFontStatus = status // Keep track of the status
  state.customFontError = error // Store error message if any
  let statusText = ""
  settingsInputs.fontStatus.className = "font-status-display" // Reset classes

  switch (status) {
    case "loading":
      statusText = "Loading..."
      settingsInputs.fontStatus.classList.add("loading")
      settingsInputs.loadFontBtn.disabled = true
      break
    case "loaded":
      statusText = `Active: ${displayFontFamily || DEFAULT_FONT}`
      settingsInputs.fontStatus.classList.add("loaded")
      settingsInputs.loadFontBtn.disabled = false
      break
    case "error":
      statusText = `Error: ${error || "Unknown"}. Using: ${
        displayFontFamily || DEFAULT_FONT
      }`
      settingsInputs.fontStatus.classList.add("error")
      settingsInputs.loadFontBtn.disabled = false
      break
    case "idle":
    default:
      // Determine text based on selected source
      if (state.fontSource === "default") {
        statusText = `Default: ${DEFAULT_FONT}`
      } else if (state.fontSource === "system") {
        statusText = state.systemFontFamily
          ? `System: ${state.systemFontFamily}`
          : `System: (Select Font)`
      } else if (state.fontSource === "google") {
        statusText = state.googleFontName
          ? `Google: ${state.googleFontName} (Load)`
          : `Google: (Enter Name)`
      } else {
        // Should not happen, but fallback
        statusText = `Active: ${displayFontFamily || DEFAULT_FONT}`
      }
      settingsInputs.loadFontBtn.disabled = state.fontSource !== "google" // Only enable load for Google
      break
  }
  settingsInputs.fontStatus.textContent = statusText
  settingsInputs.fontStatus.title = error || statusText // Set title for tooltips/errors
}

// --- Settings Panel ---
function handleToggleSettings() {
  state.settingsCollapsed = !state.settingsCollapsed
  settingsColumn.dataset.collapsed = state.settingsCollapsed
  updateToggleIcons(state.settingsCollapsed)
  saveState() // Save collapsed state
}

function updateToggleIcons(isCollapsed) {
  settingsIconOpen.classList.toggle("hidden", !isCollapsed)
  settingsIconClose.classList.toggle("hidden", isCollapsed)
  toggleSettingsBtn.title = isCollapsed
    ? "Open Settings (Alt+S)"
    : "Close Settings (Alt+S)"
  toggleSettingsBtn.setAttribute("aria-expanded", !isCollapsed)
}

// --- List Interaction ---
function handleListClick(event) {
  const target = event.target
  const li = target.closest(".todo-item")
  if (!li || !li.dataset.id) return

  const id = parseInt(li.dataset.id, 10)

  if (
    target.classList.contains("toggle-done") ||
    target.classList.contains("todo-text")
  ) {
    toggleDone(id)
    renderTodoList()
    generateTodoImageAndUpdatePreview()
    saveState()
  } else if (target.closest(".edit-btn")) {
    openEditModal(id)
  } else if (target.closest(".delete-btn")) {
    deleteTodo(id)
    li.style.opacity = "0"
    li.style.transform = "translateX(-20px)"
    li.addEventListener(
      "transitionend",
      () => {
        if (
          li.parentNode === todoListUl ||
          li.parentNode === completedTodoListUl
        ) {
          renderTodoList() // Re-render after animation if still in list
        }
      },
      { once: true }
    )
    // Fallback if transition doesn't fire
    setTimeout(() => {
      if (
        li.parentNode === todoListUl ||
        li.parentNode === completedTodoListUl
      ) {
        renderTodoList()
      }
    }, 350)
    generateTodoImageAndUpdatePreview()
    saveState()
  }
}

// --- Add Task Modal ---
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
  const text = modalTodoInput.value
  if (addTodo(text)) {
    // Use the return value of addTodo
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

// --- Edit Task Modal ---
function openEditModal(id) {
  const todo = state.todos.find((t) => t.id === id)
  if (!todo) {
    console.error("Could not find todo to edit with ID:", id)
    utils.showToast(toastContainer, "Error finding task to edit.", "error")
    return
  }
  modalEditInput.value = todo.text
  editTodoIdInput.value = todo.id
  editTodoModal.classList.remove("hidden")
  setTimeout(() => modalEditInput.focus(), 50)
}

function closeEditModal() {
  editTodoModal.classList.add("hidden")
  modalEditInput.value = ""
  editTodoIdInput.value = ""
}

function handleEditModalSubmit(event) {
  event.preventDefault()
  const newText = modalEditInput.value.trim()
  const id = parseInt(editTodoIdInput.value, 10)

  if (!newText) {
    modalEditInput.focus()
    modalEditInput.classList.add("shake-animation")
    setTimeout(() => modalEditInput.classList.remove("shake-animation"), 500)
    return
  }
  if (isNaN(id)) {
    console.error("Invalid ID stored in edit modal.")
    utils.showToast(toastContainer, "Error saving task edit.", "error")
    closeEditModal()
    return
  }

  const todo = state.todos.find((t) => t.id === id)
  if (todo) {
    if (todo.text !== newText) {
      todo.text = newText
      renderTodoList()
      saveState()
      generateTodoImageAndUpdatePreview()
      utils.showToast(toastContainer, "Task updated!", "success")
    } else {
      utils.showToast(toastContainer, "No changes detected.", "info")
    }
  } else {
    console.error("Could not find todo to save edit for ID:", id)
    utils.showToast(toastContainer, "Error updating task.", "error")
  }
  closeEditModal()
}

// --- Clear Completed Tasks ---
function handleClearCompleted() {
  const completedCount = state.todos.filter((t) => t.done).length
  if (completedCount === 0) {
    utils.showToast(toastContainer, "No completed tasks to clear.", "info")
    return
  }

  // Optional: Add confirmation dialog later if desired
  // if (!confirm(`Are you sure you want to delete ${completedCount} completed task(s)?`)) return;

  state.todos = state.todos.filter((t) => !t.done) // Keep only non-done tasks
  renderTodoList() // Update UI
  saveState()
  generateTodoImageAndUpdatePreview() // Update wallpaper preview
  utils.showToast(
    toastContainer,
    `${completedCount} completed task${completedCount > 1 ? "s" : ""} cleared.`,
    "success"
  )
}

// --- Record Shortcut Modal ---
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

  const key = event.key
  const code = event.code // Use code for modifier detection consistency

  // Check if it's a modifier key
  const isModifier =
    ["Control", "Shift", "Alt", "Meta", "ContextMenu"].includes(key) ||
    code.startsWith("Control") ||
    code.startsWith("Shift") ||
    code.startsWith("Alt") ||
    code.startsWith("Meta")

  if (!isModifier) {
    // It's a main key
    if (!lastMainKeyPressed) {
      // Only capture the first main key pressed after modifiers
      pressedKeys.clear() // Start fresh for this combination attempt
      // Capture current state of modifiers
      if (event.ctrlKey) pressedKeys.add("Control")
      if (event.shiftKey) pressedKeys.add("Shift")
      if (event.altKey) pressedKeys.add("Alt")
      if (event.metaKey) pressedKeys.add("Meta") // Meta key (Cmd on Mac, Win on Windows)

      pressedKeys.add(key) // Add the main key
      lastMainKeyPressed = key

      currentRecordedString = utils.buildAcceleratorString(pressedKeys) // Build string using util
      const isValid = utils.isValidAccelerator(currentRecordedString) // Validate using util

      updateRecordShortcutDisplay(
        null,
        utils.buildAcceleratorStringParts(pressedKeys)
      ) // Display parts using util
      recordSaveBtn.disabled = !isValid

      if (isValid) {
        // Optional: Briefly show "Recorded!" before enabling save or auto-saving
        // updateRecordShortcutDisplay("Recorded!", utils.buildAcceleratorStringParts(null, currentRecordedString));
        // For now, just enable save
      } else {
        // Modifier was likely missing
        updateRecordShortcutDisplay(
          "Modifier needed!",
          utils.buildAcceleratorStringParts(pressedKeys)
        )
        // Reset for another try
        currentRecordedString = ""
        lastMainKeyPressed = null
        pressedKeys.clear()
        recordSaveBtn.disabled = true
      }
    }
    // Ignore subsequent non-modifier keys if one was already pressed
  } else {
    // It's a modifier key
    if (!lastMainKeyPressed) {
      // Only add modifier if no main key has been pressed yet
      pressedKeys.add(key)
      updateRecordShortcutDisplay(
        "Press main key...",
        utils.buildAcceleratorStringParts(pressedKeys)
      ) // Update display
    }
  }
}

function handleShortcutKeyUp(event) {
  if (!isRecordingShortcut) return
  const key = event.key

  // If a modifier key is released *before* the main key is pressed
  if (["Control", "Shift", "Alt", "Meta"].includes(key)) {
    pressedKeys.delete(key)
    if (!lastMainKeyPressed) {
      // Only update display if still waiting for main key
      updateRecordShortcutDisplay(
        "Press main key...",
        utils.buildAcceleratorStringParts(pressedKeys)
      )
    }
  }
  // Releasing the main key or any key *after* the main key was pressed doesn't change the recorded combo
  // The combo is fixed once a valid modifier + main key is down.
}

function updateRecordShortcutDisplay(message = null, parts = []) {
  shortcutDisplayArea.innerHTML = "" // Clear previous content

  if (message) {
    const messageSpan = document.createElement("span")
    messageSpan.textContent = message
    shortcutDisplayArea.appendChild(messageSpan)
  }

  if (parts.length > 0) {
    parts.forEach((part) => {
      const keySpan = document.createElement("span")
      keySpan.className = "key-display"
      // Check if it's a common modifier for styling
      if (
        [
          "CmdOrCtrl",
          "Alt",
          "Shift",
          "Super",
          "Ctrl",
          "Cmd",
          "Option",
        ].includes(part)
      ) {
        keySpan.classList.add("modifier")
      }
      keySpan.textContent = utils.mapKeyForDisplay(part) // Use util for display mapping
      shortcutDisplayArea.appendChild(keySpan)
    })
  } else if (!message) {
    // Default placeholder if no message and no parts
    shortcutDisplayArea.innerHTML = "<span>Press keys...</span>"
  }
}

function handleSaveShortcut() {
  if (
    !currentRecordedString ||
    !utils.isValidAccelerator(currentRecordedString)
  ) {
    alert(
      "Invalid shortcut recorded. Please ensure you press a modifier (Ctrl, Alt, Shift, Cmd) plus another key."
    )
    recordSaveBtn.disabled = true
    updateRecordShortcutDisplay("Press keys...") // Reset display
    return
  }

  if (currentRecordedString !== state.quickAddShortcut) {
    state.quickAddShortcut = currentRecordedString
    applyStateToUI() // Update the display in settings
    saveState()
    console.log(
      "Renderer: Sending updated shortcut to main:",
      state.quickAddShortcut
    )
    // Send update to main process
    window.electronAPI.updateSettings({
      runInTray: state.runInTray,
      quickAddShortcut: state.quickAddShortcut,
      quickAddTranslucent: state.quickAddTranslucent,
    })
    utils.showToast(
      toastContainer,
      `Shortcut saved: ${utils.formatAccelerator(currentRecordedString)}`,
      "success"
    )
  } else {
    utils.showToast(toastContainer, "Shortcut unchanged.", "info")
  }
  closeRecordShortcutModal()
}

// --- Background Image Handling ---
function updateBackgroundControlsVisibility() {
  const isImage = state.backgroundType === "image"
  settingsInputs.bgColorControls.classList.toggle("hidden", isImage)
  settingsInputs.bgImageControls.classList.toggle("hidden", !isImage)
}

function handleImageFileSelect(e) {
  const file = e.target.files[0]
  if (!file) return

  if (!file.type.startsWith("image/")) {
    alert("Invalid image file type. Please select a PNG, JPG, or WEBP image.")
    e.target.value = "" // Clear the input
    return
  }
  if (file.size > 15 * 1024 * 1024) {
    // 15MB limit
    alert("Image file is too large (Max 15MB). Please choose a smaller image.")
    e.target.value = "" // Clear the input
    return
  }

  const reader = new FileReader()
  reader.onload = (event) => {
    state.backgroundImageDataUrl = event.target.result
    state.backgroundImageName = file.name
    settingsInputs.imageFilenameSpan.textContent = file.name
    generateTodoImageAndUpdatePreview()
    saveState()
  }
  reader.onerror = handleImageReadError
  reader.readAsDataURL(file)
}

function handleClearImage() {
  state.backgroundImageDataUrl = null
  state.backgroundImageName = null
  settingsInputs.imageFilenameSpan.textContent = "No file chosen"
  settingsInputs.imageFileInput.value = "" // Clear file input
  // Optionally switch back to color background type
  state.backgroundType = "color"
  settingsInputs.bgTypeColor.checked = true
  updateBackgroundControlsVisibility()
  generateTodoImageAndUpdatePreview()
  saveState()
}

function handleImageReadError(err) {
  console.error("FileReader error:", err)
  alert("Error reading the selected image file.")
  handleClearImage() // Reset image state on error
}

// --- Wallpaper Application ---
async function handleApplyWallpaper() {
  if (!state.lastGeneratedImageDataUrl) {
    console.warn("Apply Wallpaper: No image data generated yet. Generating...")
    try {
      await generateTodoImageAndUpdatePreview()
      if (!state.lastGeneratedImageDataUrl) {
        // Check again after generation attempt
        utils.showToast(
          toastContainer,
          "Could not generate wallpaper image.",
          "error"
        )
        return
      }
    } catch (genErr) {
      utils.showToast(
        toastContainer,
        `Failed to generate image: ${genErr.message}`,
        "error"
      )
      return
    }
  }

  if (applyWallpaperBtn.disabled) return // Prevent double-clicks

  applyWallpaperBtn.disabled = true
  const span = applyWallpaperBtn.querySelector("span")
  const originalText = span ? span.textContent : "Apply Wallpaper"
  if (span) span.textContent = "Applying..."
  console.log("Applying wallpaper...")

  try {
    const dataUrl = state.lastGeneratedImageDataUrl
    const result = await window.electronAPI.updateWallpaper(dataUrl)
    if (result?.success) {
      console.log("Wallpaper update successful.")
      if (span) span.textContent = "Applied!"
      utils.showToast(
        toastContainer,
        "Wallpaper applied successfully!",
        "success"
      )
      setTimeout(() => {
        // Reset button text after a delay
        if (applyWallpaperBtn.disabled && span?.textContent === "Applied!") {
          if (span) span.textContent = originalText
          applyWallpaperBtn.disabled = false
        }
      }, 2000)
    } else {
      throw new Error(result?.error || "Unknown error setting wallpaper")
    }
  } catch (err) {
    console.error("Wallpaper update failed:", err)
    utils.showToast(
      toastContainer,
      `Failed to apply wallpaper: ${err.message}`,
      "error"
    )
    if (span) span.textContent = originalText // Reset button text on error
    applyWallpaperBtn.disabled = false
  }
}

// --- IPC Event Handlers ---
async function handleQuickAddTaskAndApply(taskText) {
  console.log("Renderer received task and apply trigger:", taskText)
  if (addTodo(taskText)) {
    renderTodoList()
    saveState()
    try {
      await generateTodoImageAndUpdatePreview()
      if (state.lastGeneratedImageDataUrl) {
        console.log("Applying wallpaper after quick add...")
        // Call handleApplyWallpaper but don't necessarily show toast unless error
        const applyBtnState = applyWallpaperBtn.disabled // Preserve button state
        applyWallpaperBtn.disabled = true // Prevent manual click during auto-apply
        try {
          await window.electronAPI.updateWallpaper(
            state.lastGeneratedImageDataUrl
          )
          console.log("Wallpaper updated successfully via Quick Add.")
        } catch (applyErr) {
          console.error("Error applying wallpaper after quick add:", applyErr)
          utils.showToast(
            toastContainer,
            `Quick Add Error: ${applyErr.message}`,
            "error"
          )
        } finally {
          applyWallpaperBtn.disabled = applyBtnState // Restore original button state
        }
      } else {
        console.error(
          "Failed to generate image after quick add, cannot apply wallpaper."
        )
        utils.showToast(
          toastContainer,
          "Failed to generate image for wallpaper.",
          "error"
        )
      }
    } catch (err) {
      console.error(
        "Error during image generation or application after quick add:",
        err
      )
      utils.showToast(
        toastContainer,
        "Error applying wallpaper after Quick Add.",
        "error"
      )
    }
  }
}

function handleShortcutError(errorMessage) {
  console.error("Renderer received Shortcut Error from main:", errorMessage)
  alert(
    `Shortcut Error:\n${errorMessage}\n\nPlease choose different keys or close the conflicting application.`
  )
  // Revert tray state in UI and save
  state.runInTray = false
  if (settingsInputs.runInTrayCheckbox) {
    settingsInputs.runInTrayCheckbox.checked = false
  }
  updateShortcutInputVisibility()
  saveState()
  // Note: Main process should also revert its state based on registration failure
}

function handleForcedSettingUpdate(settingsToUpdate) {
  console.log(
    "Renderer received forced setting update from main:",
    settingsToUpdate
  )
  let stateChanged = false
  for (const key in settingsToUpdate) {
    if (state.hasOwnProperty(key) && state[key] !== settingsToUpdate[key]) {
      console.log(
        `Forcing setting ${key} from ${state[key]} to ${settingsToUpdate[key]}`
      )
      state[key] = settingsToUpdate[key]
      stateChanged = true
      // Update corresponding UI elements immediately
      if (key === "runInTray" && settingsInputs.runInTrayCheckbox) {
        settingsInputs.runInTrayCheckbox.checked = state.runInTray
      } else if (
        key === "quickAddShortcut" &&
        settingsInputs.currentShortcutDisplay
      ) {
        settingsInputs.currentShortcutDisplay.textContent =
          utils.formatAccelerator(state.quickAddShortcut || DEFAULT_SHORTCUT)
      } else if (
        key === "quickAddTranslucent" &&
        settingsInputs.quickAddTranslucentCheckbox
      ) {
        settingsInputs.quickAddTranslucentCheckbox.checked =
          state.quickAddTranslucent
      }
      // Add more UI updates here if needed for other forced settings
    }
  }
  if (stateChanged) {
    console.log("Applying forced state changes to UI and saving.")
    updateShortcutInputVisibility() // Update dependent visibility
    updateFontControlsVisibility() // etc.
    saveState() // Save the corrected state
  } else {
    console.log("No actual state changes needed from forced update.")
  }
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

// --- Collapsible Settings Sections ---
function initializeCollapsibleSections() {
  const toggleButtons = settingsColumn.querySelectorAll(
    ".setting-section-toggle"
  )
  toggleButtons.forEach((button) => {
    const section = button.closest(".setting-section")
    const content = section.querySelector(".setting-section-content")
    const isCollapsedInitially = section.classList.contains("collapsed") // Check initial state if set by CSS/HTML

    button.setAttribute("aria-expanded", !isCollapsedInitially)

    if (content) {
      // Set initial state without transition
      content.style.transition = "none"
      if (isCollapsedInitially) {
        content.style.maxHeight = "0"
        content.style.opacity = "0"
        content.style.visibility = "hidden"
        content.style.paddingTop = "0" // Collapse padding
        content.style.paddingBottom = "0"
        content.style.marginTop = "0" // Collapse margin
        content.style.marginBottom = "0"
      } else {
        // Ensure it's fully expanded if not collapsed initially
        content.style.maxHeight = null // Use null for auto height
        content.style.opacity = "1"
        content.style.visibility = "visible"
        content.style.paddingTop = "" // Restore padding
        content.style.paddingBottom = ""
        content.style.marginTop = "" // Restore margin
        content.style.marginBottom = ""
      }
      // Force reflow to apply styles immediately
      void content.offsetHeight
      // Restore transition
      content.style.transition = ""
    }
  })
}

function handleSettingToggleClick(button) {
  const section = button.closest(".setting-section")
  const content = section.querySelector(".setting-section-content")
  if (!section || !content) return

  section.classList.toggle("collapsed")
  const isCollapsed = section.classList.contains("collapsed")
  button.setAttribute("aria-expanded", !isCollapsed)

  if (isCollapsed) {
    // Start closing: set maxHeight to current height, then transition to 0
    content.style.maxHeight = content.scrollHeight + "px"
    // Use requestAnimationFrame to ensure the initial maxHeight is applied before transitioning
    requestAnimationFrame(() => {
      content.style.maxHeight = "0"
      content.style.opacity = "0"
      content.style.paddingTop = "0"
      content.style.paddingBottom = "0"
      content.style.marginTop = "0"
      content.style.marginBottom = "0"
      // Set visibility after transition ends
      content.addEventListener(
        "transitionend",
        () => {
          if (section.classList.contains("collapsed")) {
            // Check again in case it was re-opened quickly
            content.style.visibility = "hidden"
          }
        },
        { once: true }
      )
    })
  } else {
    // Start opening: set visibility, then transition maxHeight and opacity
    content.style.visibility = "visible"
    content.style.paddingTop = "" // Restore padding/margin before calculating height
    content.style.paddingBottom = ""
    content.style.marginTop = ""
    content.style.marginBottom = ""
    // Use timeout to allow visibility change before starting transition
    requestAnimationFrame(() => {
      content.style.maxHeight = content.scrollHeight + "px"
      content.style.opacity = "1"
    })

    // Optional: Remove maxHeight after transition to allow dynamic content resizing
    content.addEventListener(
      "transitionend",
      () => {
        if (!section.classList.contains("collapsed")) {
          // Check if still open
          content.style.maxHeight = null // Use null for auto height
        }
      },
      { once: true }
    )
  }
}

// --- Start the application ---
initialize()
