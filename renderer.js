// renderer.js
// Use import for ES Modules
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
// ... (Keep all DOM element references) ...
const applyWallpaperBtn = document.getElementById("apply-wallpaper-btn")
const openAppSettingsModalBtn = document.getElementById(
  "open-app-settings-modal-btn"
)
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
const clearActiveBtn = document.getElementById("clear-active-btn")
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
  /* ... keep ... */ title: document.getElementById("wallpaper-title-input"),
  textColorPickerEl: document.getElementById("text-color-picker"),
  textColorHex: document.getElementById("text-color-hex"),
  fontSize: document.getElementById("font-size"),
  fontWeight: document.getElementById("font-weight-select"),
  listStyle: document.getElementById("list-style-select"),
  overallOpacity: document.getElementById("overall-opacity"),
  overallOpacityValue: document.getElementById("overall-opacity-value"),
  textPosition: document.getElementById("text-position"),
  textAlign: document.getElementById("text-align-select"),
  offsetX: document.getElementById("offset-x"),
  offsetY: document.getElementById("offset-y"),
  titleSpacing: document.getElementById("title-spacing-input"),
  itemSpacing: document.getElementById("item-spacing-input"),
  maxItems: document.getElementById("max-items-input"),
  columnGap: document.getElementById("column-gap-input"),
  textBackgroundEnable: document.getElementById("text-background-enable"), // Checkbox
  textBackgroundControls: document.getElementById("text-background-controls"),
  textBgColorPickerEl: document.getElementById("text-bg-color-picker"),
  textBgColorHex: document.getElementById("text-bg-color-hex"),
  textPanelOpacity: document.getElementById("text-panel-opacity"),
  textPanelOpacityValue: document.getElementById("text-panel-opacity-value"),
  textBgPaddingInline: document.getElementById("text-bg-padding-inline"),
  textBgPaddingBlock: document.getElementById("text-bg-padding-block"),
  textBgBorderRadius: document.getElementById("text-bg-border-radius"),
  textBgBorderRadiusValue: document.getElementById(
    "text-bg-border-radius-value"
  ),
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
const appSettingsModal = document.getElementById("app-settings-modal")
const appSettingsModalCloseBtn = document.getElementById(
  "app-settings-modal-close-btn"
)
const appSettingsModalDoneBtn = document.getElementById(
  "app-settings-modal-done-btn"
)
const appSettingsForm = document.getElementById("app-settings-form")
const modalRunInTrayCheckbox = document.getElementById(
  "modal-run-in-tray-checkbox"
)
const modalShortcutGroup = document.getElementById("modal-shortcut-group")
const modalCurrentShortcutDisplay = document.getElementById(
  "modal-current-shortcut-display"
)
const modalChangeShortcutBtn = document.getElementById(
  "modal-change-shortcut-btn"
)
const modalQuickAddTranslucentGroup = document.getElementById(
  "modal-quick-add-translucent-group"
)
const modalQuickAddTranslucentCheckbox = document.getElementById(
  "modal-quick-add-translucent-checkbox"
)
const modalAutoApplyCheckbox = document.getElementById(
  "modal-auto-apply-checkbox"
)
const updateNotificationArea = document.getElementById(
  "update-notification-area"
)
const updateMessage = document.getElementById("update-message")
const restartButton = document.getElementById("restart-button")
const recordInstructions = recordShortcutModal?.querySelector(
  ".record-instructions"
)
const canvas = document.getElementById("image-canvas")
const ctx = canvas.getContext("2d")
const toastContainer = document.getElementById("toast-container")

// --- Application State ---
let state = JSON.parse(JSON.stringify(initialState))

// ... (Keep rest of state vars) ...
let isRecordingShortcut = false
let pressedKeys = new Set()
let currentRecordedString = ""
let lastMainKeyPressed = null
let systemFontsCache = []
let textColorPickr = null
let bgColorPickr = null
let textBgColorPickr = null
let textBorderColorPickr = null

// *** Debounced function for preview generation + auto-apply ***
const DEBOUNCE_DELAY = 300 // Milliseconds to wait after user stops interacting
const debouncedGenerateAndApply = utils.debounce(() => {
  console.log("Debounced action triggered")
  generateTodoImageAndUpdatePreview() // Generate the preview
  maybeAutoApplyWallpaper() // Check if wallpaper should be applied
}, DEBOUNCE_DELAY)

// --- Initialization ---
async function initialize() {
  /* ... */ console.log("Initializing Renderer...")
  const dims = window.electronAPI.getScreenDimensions()
  if (dims?.width && dims?.height) {
    state.screenWidth = dims.width
    state.screenHeight = dims.height
  } else {
    console.warn("Could not get screen dimensions sync, using defaults.")
  }
  setCanvasAndPreviewSize(state.screenWidth, state.screenHeight)
  await loadState()
  await populateSystemFonts()
  setupAutoUpdaterListeners()
  initializeColorPickers()
  applyStateToUI()
  if (previewContainer) previewContainer.classList.remove("loaded")
  let imageLoadPromise = Promise.resolve()
  if (state.backgroundType === "image" && state.backgroundImageName) {
    console.log(
      "Attempting to load persistent background image:",
      state.backgroundImageName
    )
    imageLoadPromise = window.electronAPI
      .loadBackgroundImage()
      .then((dataUrl) => {
        if (dataUrl) {
          console.log("Successfully loaded background image data.")
          state.backgroundImageDataUrl = dataUrl
        } else {
          console.warn(
            "Failed to load background image data from main process. Resetting to color background."
          )
          utils.showToast(
            toastContainer,
            `Could not load image "${state.backgroundImageName}". Resetting background.`,
            "warning"
          )
          state.backgroundType = "color"
          state.backgroundImageName = null
          state.backgroundImageDataUrl = null
          applyStateToUI()
          saveState()
        }
      })
      .catch((err) => {
        console.error("Error loading background image via IPC:", err)
        utils.showToast(
          toastContainer,
          "Error loading background image.",
          "error"
        )
        state.backgroundType = "color"
        state.backgroundImageName = null
        state.backgroundImageDataUrl = null
        applyStateToUI()
        saveState()
      })
  }
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
      state.systemFontFamily = ""
      state.googleFontName = ""
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
  Promise.all([imageLoadPromise, fontLoadPromise])
    .catch((err) => console.warn("Font/Image loading promise rejected:", err))
    .finally(() => {
      generateTodoImageAndUpdatePreview()
    })
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
  setupEventListeners()
  initializeCollapsibleSections()
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
    debouncedGenerateAndApply()
  })
  window.electronAPI.onPerformTaskDelete((taskId) => {
    console.log(`Renderer received delete request for task ID: ${taskId}`)
    deleteTodo(taskId)
    renderTodoList()
    saveState()
    debouncedGenerateAndApply()
  })
  const platform = window.electronAPI.getPlatform()
  document.body.dataset.platform = platform
  console.log("Renderer initialized on platform:", platform)
}
// --- Set Canvas & Preview Size ---
function setCanvasAndPreviewSize(width, height) {
  /* ... */ canvas.width = width
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
  /* ... */ try {
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
  /* ... */ const options = (elId, defaultColor, stateProp) => ({
    el: settingsInputs[elId],
    theme: "nano",
    defaultRepresentation: "HEXA",
    default: state[stateProp] || defaultColor,
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
      saveState()
      debouncedGenerateAndApply()
    }
    instance.hide()
  }
  const onChange = (hexInputId) => (color, source, instance) => {
    settingsInputs[hexInputId].value = color.toHEXA().toString()
    settingsInputs[hexInputId].classList.remove("invalid")
  }
  const onShow = (hexInputId) => (color, instance) => {
    settingsInputs[hexInputId].value = instance.getColor().toHEXA().toString()
    settingsInputs[hexInputId].classList.remove("invalid")
  }
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
  /* ... */ const isTrayEnabled = state.runInTray
  if (modalShortcutGroup) {
    modalShortcutGroup.classList.toggle("hidden", !isTrayEnabled)
  }
  if (modalQuickAddTranslucentGroup) {
    modalQuickAddTranslucentGroup.classList.toggle("hidden", !isTrayEnabled)
  }
}
function updateTextBackgroundControlsVisibility() {
  /* ... */ settingsInputs.textBackgroundControls?.classList.toggle(
    "hidden",
    !state.textBackgroundEnabled
  )
}
// --- Apply State to UI ---
function applyStateToUI() {
  /* ... */ settingsInputs.title.value = state.title
  settingsInputs.fontSize.value = state.fontSize
  settingsInputs.fontWeight.value = state.fontWeight
  settingsInputs.listStyle.value = state.listStyle
  settingsInputs.overallOpacity.value = state.overallOpacity
  settingsInputs.textPanelOpacity.value = state.textPanelOpacity
  settingsInputs.textBgBorderRadius.value = state.textBackgroundBorderRadius
  settingsInputs.textPosition.value = state.textPosition
  settingsInputs.textAlign.value = state.textAlign
  settingsInputs.offsetX.value = state.offsetX
  settingsInputs.offsetY.value = state.offsetY
  settingsInputs.titleSpacing.value = state.titleBottomMargin
  settingsInputs.itemSpacing.value = state.itemSpacing
  settingsInputs.maxItems.value = state.maxItemsPerColumn
  settingsInputs.columnGap.value = state.columnGap
  settingsInputs.textBackgroundEnable.checked = state.textBackgroundEnabled
  settingsInputs.textBgPaddingInline.value = state.textBackgroundPaddingInline
  settingsInputs.textBgPaddingBlock.value = state.textBackgroundPaddingBlock
  settingsInputs.textBgBorderWidth.value = state.textBackgroundBorderWidth
  settingsInputs.googleFontName.value = state.googleFontName || ""
  settingsInputs.fontSourceDefault.checked = state.fontSource === "default"
  settingsInputs.fontSourceSystem.checked = state.fontSource === "system"
  settingsInputs.fontSourceGoogle.checked = state.fontSource === "google"
  if (state.fontSource === "system" && state.systemFontFamily) {
    settingsInputs.systemFontSelect.value = state.systemFontFamily
  } else {
    settingsInputs.systemFontSelect.value = ""
  }
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
  if (modalRunInTrayCheckbox) modalRunInTrayCheckbox.checked = state.runInTray
  if (modalQuickAddTranslucentCheckbox)
    modalQuickAddTranslucentCheckbox.checked = state.quickAddTranslucent
  if (modalCurrentShortcutDisplay)
    modalCurrentShortcutDisplay.textContent = utils.formatAccelerator(
      state.quickAddShortcut || DEFAULT_SHORTCUT
    )
  if (modalAutoApplyCheckbox)
    modalAutoApplyCheckbox.checked = state.autoApplyWallpaper
  updateFontControlsVisibility()
  updateFontStatus(
    state.customFontStatus,
    state.activeFontFamily,
    state.customFontError
  )
  updateBackgroundControlsVisibility()
  updateShortcutInputVisibility()
  updateTextBackgroundControlsVisibility()
  settingsColumn.dataset.collapsed = state.settingsCollapsed
  updateToggleIcons(state.settingsCollapsed)
}
// --- State Management ---
function saveState() {
  /* ... */ try {
    const stateToSave = { ...state }
    delete stateToSave.backgroundImageDataUrl
    delete stateToSave.lastGeneratedImageDataUrl
    delete stateToSave.customFontStatus
    delete stateToSave.customFontError
    window.electronAPI.saveState(stateToSave)
  } catch (e) {
    console.error("Save State Error (preparing state):", e)
    utils.showToast(
      toastContainer,
      "Error preparing settings to save.",
      "error"
    )
  }
}
async function loadState() {
  /* ... */ try {
    const loadedStateFromFile = await window.electronAPI.loadState()
    const platform = window.electronAPI?.getPlatform() || "win32"
    const platformDefaultTranslucent = platform === "darwin"
    if (loadedStateFromFile) {
      console.log("Received state from main process:", loadedStateFromFile)
      const currentScreenDims = {
        screenWidth: state.screenWidth,
        screenHeight: state.screenHeight,
      }
      state = {
        ...initialState,
        ...loadedStateFromFile,
        autoApplyWallpaper:
          typeof loadedStateFromFile.autoApplyWallpaper === "boolean"
            ? loadedStateFromFile.autoApplyWallpaper
            : false,
        quickAddTranslucent:
          typeof loadedStateFromFile.quickAddTranslucent === "boolean"
            ? loadedStateFromFile.quickAddTranslucent
            : platformDefaultTranslucent,
        ...currentScreenDims,
        customFontStatus: "idle",
        customFontError: null,
        lastGeneratedImageDataUrl: null,
        backgroundImageDataUrl: null,
        todos: Array.isArray(loadedStateFromFile.todos)
          ? loadedStateFromFile.todos.map((t) => ({
              ...t,
              context: t.context || "",
            }))
          : [],
      }
      if (state.fontSource === "system" && state.systemFontFamily) {
        state.activeFontFamily = state.systemFontFamily
      } else if (state.fontSource === "google" && state.googleFontName) {
        state.activeFontFamily = state.googleFontName
      } else {
        state.fontSource = "default"
        state.activeFontFamily = DEFAULT_FONT
        state.systemFontFamily = ""
        state.googleFontName = ""
      }
      console.log("Final state after loading and merging:", state)
    } else {
      state = {
        ...initialState,
        autoApplyWallpaper: false,
        quickAddTranslucent: platformDefaultTranslucent,
        screenWidth: state.screenWidth,
        screenHeight: state.screenHeight,
      }
      console.log("No valid state file found, using defaults.")
    }
  } catch (e) {
    console.error("Load State Error (requesting state):", e)
    utils.showToast(toastContainer, "Error loading settings.", "error")
    const platform = window.electronAPI?.getPlatform() || "win32"
    state = {
      ...initialState,
      autoApplyWallpaper: false,
      quickAddTranslucent: platform === "darwin",
    }
  }
}

// --- Event Handlers ---
function handleGlobalKeyDown(event) {
  /* ... */ if (!addTodoModal.classList.contains("hidden")) {
    if (event.key === "Escape") closeModal()
  } else if (!editTodoModal.classList.contains("hidden")) {
    if (event.key === "Escape") closeEditModal()
  } else if (!appSettingsModal.classList.contains("hidden")) {
    if (event.key === "Escape") closeAppSettingsModal()
  } else if (isRecordingShortcut) {
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
  /* ... */ const input = event.target
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
      pickrInstance.setColor(value, true)
    }
    if (state[stateProp] !== value) {
      state[stateProp] = value
      saveState()
      debouncedGenerateAndApply()
    }
  } else {
    input.classList.add("invalid")
  }
}

// MODIFIED: handleVisualSettingChange uses debounce for sliders
function handleVisualSettingChange(event) {
  const target = event.target
  const id = target.id
  const value = target.type === "checkbox" ? target.checked : target.value
  const key = target.name || id
  let stateChanged = false
  let requiresImmediateRegeneration = false
  let isSlider = target.type === "range"
  const eventType = event.type

  // Handle immediate changes (radios, selects, checkboxes) first
  if (key === "font-source") {
    if (target.checked && state.fontSource !== value) {
      state.fontSource = value
      stateChanged = true
      requiresImmediateRegeneration = false
      if (value === "default") {
        state.activeFontFamily = DEFAULT_FONT
        updateFontStatus("idle", DEFAULT_FONT)
        state.systemFontFamily = ""
        state.googleFontName = ""
        requiresImmediateRegeneration = true
      } else if (value === "system") {
        const selectedSystemFont = settingsInputs.systemFontSelect.value
        if (selectedSystemFont) {
          state.activeFontFamily = selectedSystemFont
          state.systemFontFamily = selectedSystemFont
          updateFontStatus("loaded", selectedSystemFont)
          requiresImmediateRegeneration = true
        } else {
          state.activeFontFamily = DEFAULT_FONT
          state.systemFontFamily = ""
          updateFontStatus("idle", DEFAULT_FONT)
        }
        state.googleFontName = ""
      } else if (value === "google") {
        state.systemFontFamily = ""
        if (state.googleFontName && state.customFontStatus === "loaded") {
          updateFontStatus("loaded", state.activeFontFamily)
        } else {
          updateFontStatus("idle", state.googleFontName || DEFAULT_FONT)
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
      requiresImmediateRegeneration = true
    }
  } else if (id.endsWith("-hex") || id.endsWith("-picker")) {
    return
  } else {
    // Handle text, number, range, select, checkbox (non-radio)
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
    }
    const propertyName = idToStateMap[id]
    if (propertyName && state.hasOwnProperty(propertyName)) {
      const oldValue = state[propertyName]
      let newValue = value
      if (target.type === "number" || target.type === "range") {
        newValue = parseFloat(value)
        if (isNaN(newValue)) newValue = 0
        if (target.min !== "" && newValue < parseFloat(target.min))
          newValue = parseFloat(target.min)
        if (target.max !== "" && newValue > parseFloat(target.max))
          newValue = parseFloat(target.max)
        if (target.type === "number") {
          const step = target.getAttribute("step")
          if (!step || step === "1") {
            newValue = Math.round(newValue)
          }
        } else if (
          isSlider &&
          (target.step === "0.01" || target.step === "0.05")
        ) {
          newValue = parseFloat(newValue.toFixed(2))
        } /* Keep precision for float sliders */
      } else if (target.type === "checkbox") {
        newValue = target.checked
      }

      if (oldValue !== newValue) {
        state[propertyName] = newValue
        stateChanged = true
        // Update slider value display immediately on input
        if (isSlider && eventType === "input") {
          const valueSpan = document.getElementById(`${id}-value`)
          if (valueSpan) {
            valueSpan.textContent =
              target.step && (target.step === "0.01" || target.step === "0.05")
                ? newValue.toFixed(2)
                : newValue.toFixed(0)
          }
          requiresImmediateRegeneration = false // No regen on slider drag
        } else if (propertyName === "textBackgroundEnabled") {
          // This is a checkbox, handled by 'change'
          updateTextBackgroundControlsVisibility()
          requiresImmediateRegeneration = true // Requires regen
        } else if (
          propertyName === "systemFontFamily" &&
          state.fontSource === "system"
        ) {
          // This is a select, handled by 'change'
          if (newValue) {
            state.activeFontFamily = newValue
            updateFontStatus("loaded", newValue)
          } else {
            state.activeFontFamily = DEFAULT_FONT
            updateFontStatus("idle", DEFAULT_FONT)
            requiresImmediateRegeneration = false
          }
          requiresImmediateRegeneration = true // Requires regen on selection
        } else if (propertyName === "googleFontName") {
          // This is text input, defer regen
          if (
            state.customFontStatus === "loaded" ||
            state.customFontStatus === "error"
          ) {
            updateFontStatus("idle", state.activeFontFamily)
            state.customFontStatus = "idle"
          }
          requiresImmediateRegeneration = false
        }

        // Assume other simple inputs (selects, checkboxes not handled above) require immediate regen on change
        if (!isSlider && eventType === "change") {
          requiresImmediateRegeneration = true
        }
        // Text/number input events defer regeneration
        if (
          eventType === "input" &&
          !isSlider &&
          (target.type === "text" || target.type === "number")
        ) {
          requiresImmediateRegeneration = false
        }
      }
    } else {
      console.warn(
        `Visual Setting: State property not found or unmapped for element ID/name: ${id}`
      )
    }
  }

  // Save state if changed
  if (stateChanged) {
    saveState()
    // Trigger regeneration/apply only if needed
    if (requiresImmediateRegeneration) {
      console.log(
        `Regenerating preview immediately due to '${eventType}' event on '${id}'`
      )
      debouncedGenerateAndApply() // Use debounced version even for immediate changes to avoid rapid fire
    } else if (isSlider && eventType === "input") {
      // Already updated span, now call debounced function to handle final update after delay
      debouncedGenerateAndApply()
    }
    // Text/Number inputs handled by handleInputBlurOrEnter
  }
}

function handleInputBlurOrEnter(event) {
  /* ... */ if (event.type === "keydown" && event.key !== "Enter") return
  const target = event.target
  if (
    target.tagName === "INPUT" &&
    (target.type === "text" ||
      target.type === "number" ||
      target.classList.contains("input-hex"))
  ) {
    console.log(
      `Triggering preview update due to ${event.type} on ${target.id}`
    )
    debouncedGenerateAndApply()
    /* Use debounced version */ if (event.type === "keydown" && target.blur)
      target.blur()
  }
}
function handleAppSettingChange(event) {
  /* ... */ const target = event.target
  if (!target || (target.type !== "checkbox" && target.type !== "button"))
    return
  const id = target.id
  let stateChanged = false
  let needsIpcUpdate = false
  let propertyName = null
  let newValue = null
  switch (id) {
    case "modal-run-in-tray-checkbox":
      propertyName = "runInTray"
      newValue = target.checked
      needsIpcUpdate = true
      updateShortcutInputVisibility()
      break
    case "modal-quick-add-translucent-checkbox":
      propertyName = "quickAddTranslucent"
      newValue = target.checked
      needsIpcUpdate = true
      break
    case "modal-auto-apply-checkbox":
      propertyName = "autoApplyWallpaper"
      newValue = target.checked
      break
  }
  if (
    propertyName &&
    state.hasOwnProperty(propertyName) &&
    state[propertyName] !== newValue
  ) {
    state[propertyName] = newValue
    stateChanged = true
  }
  if (stateChanged) {
    saveState()
    if (needsIpcUpdate) {
      console.log("Renderer: Sending updated app settings to main:", {
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
    applyStateToUI()
  }
}
function setupEventListeners() {
  /* ... (Keep event listener setup, including separate input/change for sliders) ... */ console.log(
    "Setting up event listeners..."
  )
  applyWallpaperBtn.addEventListener("click", handleApplyWallpaper)
  openAppSettingsModalBtn.addEventListener("click", openAppSettingsModal)
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
  const visualSettingsContainer = document.getElementById("settings-column")
  visualSettingsContainer.addEventListener("change", handleVisualSettingChange)
  visualSettingsContainer.addEventListener("input", handleVisualSettingChange)
  const textNumHexInputs = visualSettingsContainer.querySelectorAll(
    'input[type="text"], input[type="number"], .input-hex'
  )
  textNumHexInputs.forEach((input) => {
    input.addEventListener("blur", handleInputBlurOrEnter)
    input.addEventListener("keydown", handleInputBlurOrEnter)
  })
  settingsInputs.textColorHex.addEventListener("input", handleHexInputChange)
  settingsInputs.bgColorHex.addEventListener("input", handleHexInputChange)
  settingsInputs.textBgColorHex.addEventListener("input", handleHexInputChange)
  settingsInputs.textBorderColorHex.addEventListener(
    "input",
    handleHexInputChange
  )
  visualSettingsContainer.addEventListener("click", handleStepperClick)
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
  editModalCloseBtn.addEventListener("click", closeEditModal)
  editModalCancelBtn.addEventListener("click", closeEditModal)
  editTodoForm.addEventListener("submit", handleEditModalSubmit)
  editTodoModal.addEventListener("click", (e) => {
    if (e.target === editTodoModal) closeEditModal()
  })
  recordModalCloseBtn.addEventListener("click", closeRecordShortcutModal)
  recordCancelBtn.addEventListener("click", closeRecordShortcutModal)
  recordSaveBtn.addEventListener("click", handleSaveShortcut)
  recordShortcutModal.addEventListener("click", (e) => {
    if (e.target === recordShortcutModal) closeRecordShortcutModal()
  })
  appSettingsModalCloseBtn.addEventListener("click", closeAppSettingsModal)
  appSettingsModalDoneBtn.addEventListener("click", closeAppSettingsModal)
  appSettingsModal.addEventListener("click", (e) => {
    if (e.target === appSettingsModal) closeAppSettingsModal()
  })
  appSettingsForm.addEventListener("change", handleAppSettingChange)
  if (modalChangeShortcutBtn) {
    modalChangeShortcutBtn.addEventListener("click", () => {
      if (appSettingsModal) {
        appSettingsModal.classList.add("modal-temporarily-hidden")
      }
      openRecordShortcutModal()
    })
  }
  if (clearCompletedBtn)
    clearCompletedBtn.addEventListener("click", handleClearCompleted)
  if (clearActiveBtn)
    clearActiveBtn.addEventListener("click", handleClearActive)
  document.addEventListener("keydown", handleGlobalKeyDown)
  settingsColumn.addEventListener("click", (e) => {
    const t = e.target.closest(".setting-section-toggle")
    if (t) handleSettingToggleClick(t)
  })
  console.log("Event listeners setup complete.")
}

// --- Auto-Apply Logic ---
async function maybeAutoApplyWallpaper() {
  /* ... */ console.log(
    "maybeAutoApplyWallpaper called. Auto-apply enabled:",
    state.autoApplyWallpaper
  )
  try {
    await generateTodoImageAndUpdatePreview()
    if (state.autoApplyWallpaper) {
      console.log("Auto-applying wallpaper...")
      await handleApplyWallpaper()
    } else {
      console.log("Auto-apply disabled, preview updated.")
    }
  } catch (error) {
    console.error("Error during maybeAutoApplyWallpaper:", error)
    utils.showToast(
      toastContainer,
      "Error updating preview/wallpaper.",
      "error"
    )
  }
}
// --- Auto Updater Listeners ---
function setupAutoUpdaterListeners() {
  /* ... */ window.electronAPI.onUpdateAvailable((i) => {
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
  /* ... */ if (updateNotificationArea && updateMessage) {
    updateMessage.textContent = message
    updateNotificationArea.classList.remove("hidden", "hiding")
    updateNotificationArea.classList.add("visible")
  }
}
function hideUpdateMessage() {
  /* ... */ if (updateNotificationArea) {
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
  /* ... */ const t = text.trim()
  if (t) {
    state.todos.push({ id: Date.now(), text: t, context: "", done: false })
    return true
  }
  return false
}
function deleteTodo(id) {
  /* ... */ state.todos = state.todos.filter((t) => t.id !== id)
}
function toggleDone(id) {
  /* ... */ const t = state.todos.find((t) => t.id === id)
  if (t) t.done = !t.done
}
// --- UI Rendering ---
function renderTodoList() {
  /* ... */ todoListUl.innerHTML = ""
  completedTodoListUl.innerHTML = ""
  if (!Array.isArray(state.todos)) state.todos = []
  const activeTodos = state.todos.filter((t) => !t.done)
  const completedTodos = state.todos.filter((t) => t.done)
  if (activeTodos.length === 0) {
    todoListUl.innerHTML = `<li class="empty-list-message">No active tasks!</li>`
  } else {
    activeTodos.forEach((t) => todoListUl.appendChild(createTodoElement(t)))
  }
  const hasCompleted = completedTodos.length > 0
  completedHeader.classList.toggle("hidden", !hasCompleted)
  completedListContainer.classList.toggle("hidden", !hasCompleted)
  if (clearCompletedBtn)
    clearCompletedBtn.style.display = hasCompleted ? "inline-flex" : "none"
  if (clearActiveBtn)
    clearActiveBtn.style.display =
      activeTodos.length > 0 ? "inline-flex" : "none"
  if (hasCompleted) {
    completedTodos.forEach((t) =>
      completedTodoListUl.appendChild(createTodoElement(t))
    )
  }
  addContextInputListeners()
}
function createTodoElement(todo) {
  /* ... */ const li = document.createElement("li")
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
  ci.maxLength = utils.CONTEXT_MAX_LENGTH
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
  /* ... */ const i = event.target
  if (!i.classList.contains("context-input")) return
  const id = parseInt(i.dataset.id, 10)
  const t = state.todos.find((t) => t.id === id)
  if (t) {
    let nc = i.value
    if (nc.length > utils.CONTEXT_MAX_LENGTH) {
      nc = nc.substring(0, utils.CONTEXT_MAX_LENGTH)
      i.value = nc
    }
    if (t.context !== nc) {
      t.context = nc
      console.log(`Context state updated for ID ${id}: "${nc}"`)
      saveState()
    }
  }
}
function handleContextBlurOrEnter(event) {
  /* ... */ if (event.type === "keydown" && event.key !== "Enter") return
  const target = event.target
  if (target.classList.contains("context-input")) {
    console.log(
      `Triggering preview update due to ${event.type} on context input ${target.dataset.id}`
    )
    debouncedGenerateAndApply()
    /* Use debounce */ if (event.type === "keydown") {
      target.blur()
    }
  }
}
function addContextInputListeners() {
  /* ... */ const allInputs = [
    ...todoListUl.querySelectorAll(".context-input"),
    ...completedTodoListUl.querySelectorAll(".context-input"),
  ]
  allInputs.forEach((input) => {
    input.removeEventListener("input", handleContextChange)
    input.removeEventListener("blur", handleContextBlurOrEnter)
    input.removeEventListener("keydown", handleContextBlurOrEnter)
    input.addEventListener("input", handleContextChange)
    input.addEventListener("blur", handleContextBlurOrEnter)
    input.addEventListener("keydown", handleContextBlurOrEnter)
  })
}
// --- Wallpaper Generation ---
async function generateTodoImageAndUpdatePreview() {
  /* ... (Keep existing, check lines.length) ... */ const {
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
  if (canvas.width !== screenWidth || canvas.height !== screenHeight) {
    setCanvasAndPreviewSize(screenWidth, screenHeight)
  }
  const currentActiveFont = activeFontFamily || DEFAULT_FONT
  const itemFontSize = parseInt(fontSize, 10) || 48
  const linesToDraw = todos
    .filter((t) => !t.done)
    .map((t) => ({ text: t.text, context: t.context || "", done: false }))
  const padding = Math.max(60, itemFontSize * 1.5)
  const titleSpacing = parseInt(titleBottomMargin, 10) || 40
  const spacingBetweenItems = parseInt(itemSpacing, 10) || 20
  const maxItems = Math.max(1, parseInt(maxItemsPerColumn, 10) || 10)
  const colGap = Math.max(0, parseInt(columnGap, 10) || 50)
  const titleFontSize = Math.round(itemFontSize * 1.2)
  const contextFontSize = Math.round(itemFontSize * 0.6)
  const contextTopMargin = Math.round(spacingBetweenItems * 0.3)
  previewContainer.classList.remove("loaded")
  try {
    ctx.clearRect(0, 0, screenWidth, screenHeight)
    if (backgroundType === "image" && state.backgroundImageDataUrl) {
      try {
        const img = await utils.loadImage(state.backgroundImageDataUrl)
        utils.drawBackgroundImage(ctx, img, screenWidth, screenHeight)
      } catch (e) {
        console.error("Background Image Error:", e)
        utils.drawBackgroundColor(ctx, bgColor, screenWidth, screenHeight)
      }
    } else {
      utils.drawBackgroundColor(ctx, bgColor, screenWidth, screenHeight)
    }
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
    const originalAlpha = ctx.globalAlpha
    ctx.globalAlpha = Math.max(0, Math.min(1, overallOpacity))
    if (textBackgroundEnabled && linesToDraw.length > 0) {
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
    if (linesToDraw.length > 0) {
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
    }
    ctx.globalAlpha = originalAlpha
    updatePreviewImage()
  } catch (err) {
    console.error("Error during image generation process:", err)
    updatePreviewImage()
    throw err
  }
}
function updatePreviewImage() {
  /* ... */ try {
    state.lastGeneratedImageDataUrl = canvas.toDataURL("image/png")
    previewAreaImg.onload = () => {
      previewContainer.classList.add("loaded")
    }
    previewAreaImg.onerror = () => {
      console.error("Preview image failed to load from data URL.")
      previewContainer.classList.remove("loaded")
      previewAreaImg.src = ""
      if (previewLoader) previewLoader.textContent = "Preview Error"
    }
    previewAreaImg.src = state.lastGeneratedImageDataUrl
  } catch (e) {
    console.error("Preview Gen Error (canvas.toDataURL or setting src):", e)
    previewContainer.classList.remove("loaded")
    previewAreaImg.src = ""
    state.lastGeneratedImageDataUrl = null
    if (previewLoader) previewLoader.textContent = "Generation Error"
  }
}
// --- Font Handling ---
async function handleLoadFontClick() {
  /* ... */ const n = settingsInputs.googleFontName.value.trim()
  if (!n) {
    updateFontStatus("error", state.activeFontFamily, "Enter Google Font name")
    utils.showToast(toastContainer, "Please enter a Google Font name.", "error")
    return
  }
  await loadAndApplyGoogleFont(n, true)
}
async function loadAndApplyGoogleFont(fontName, shouldSaveState = true) {
  /* ... */ updateFontStatus("loading", state.activeFontFamily)
  try {
    const w = state.fontWeight || DEFAULT_WEIGHT
    const r = await window.electronAPI.loadGoogleFontByName(fontName, w)
    if (r.success && r.fontFamily && r.fontDataUrl) {
      const af = r.fontFamily
      const aw = r.fontWeight
      const ff = new FontFace(af, `url(${r.fontDataUrl})`, { weight: aw })
      await ff.load()
      document.fonts.add(ff)
      await document.fonts.ready
      console.log(`Font loaded and added: ${af} ${aw}`)
      state.activeFontFamily = af
      state.googleFontName = fontName
      state.customFontStatus = "loaded"
      state.customFontError = null
      updateFontStatus("loaded", af)
      utils.showToast(toastContainer, `Font "${af}" loaded!`, "success")
      generateTodoImageAndUpdatePreview()
      if (shouldSaveState) saveState()
      maybeAutoApplyWallpaper()
    } else {
      throw new Error(
        r.error ||
          `Could not load font "${fontName}". Check spelling and availability.`
      )
    }
  } catch (e) {
    console.error("Google Font Load Error:", e)
    state.customFontStatus = "error"
    state.customFontError = e.message
    updateFontStatus("error", state.activeFontFamily, e.message)
    utils.showToast(toastContainer, `Error loading font: ${e.message}`, "error")
  }
}
function updateFontControlsVisibility() {
  /* ... */ const s = state.fontSource
  settingsInputs.systemFontControls.classList.toggle("hidden", s !== "system")
  settingsInputs.googleFontControls.classList.toggle("hidden", s !== "google")
}
function updateFontStatus(status, displayFontFamily, error = null) {
  /* ... */ state.customFontStatus = status
  state.customFontError = error
  let statusText = ""
  settingsInputs.fontStatus.className = "font-status-display"
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
        statusText = `Active: ${displayFontFamily || DEFAULT_FONT}`
      }
      settingsInputs.loadFontBtn.disabled = state.fontSource !== "google"
      break
  }
  settingsInputs.fontStatus.textContent = statusText
  settingsInputs.fontStatus.title = error || statusText
}
// --- Settings Panel ---
function handleToggleSettings() {
  /* ... */ state.settingsCollapsed = !state.settingsCollapsed
  settingsColumn.dataset.collapsed = state.settingsCollapsed
  updateToggleIcons(state.settingsCollapsed)
  saveState()
}
function updateToggleIcons(isCollapsed) {
  /* ... */ settingsIconOpen.classList.toggle("hidden", !isCollapsed)
  settingsIconClose.classList.toggle("hidden", isCollapsed)
  toggleSettingsBtn.title = isCollapsed
    ? "Open Visual Settings (Alt+S)"
    : "Close Visual Settings (Alt+S)"
  toggleSettingsBtn.setAttribute("aria-expanded", !isCollapsed)
}
// --- List Interaction ---
function handleListClick(event) {
  /* ... */ const target = event.target
  const li = target.closest(".todo-item")
  if (!li || !li.dataset.id) return
  const id = parseInt(li.dataset.id, 10)
  if (
    target.classList.contains("toggle-done") ||
    target.classList.contains("todo-text")
  ) {
    toggleDone(id)
    renderTodoList()
    saveState()
    debouncedGenerateAndApply()
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
          renderTodoList()
        }
      },
      { once: true }
    )
    setTimeout(() => {
      if (
        li.parentNode === todoListUl ||
        li.parentNode === completedTodoListUl
      ) {
        renderTodoList()
      }
    }, 350)
    saveState()
    debouncedGenerateAndApply()
  }
}
// --- Modal Functions ---
function openModal() {
  /* ... */ addTodoModal.classList.remove("hidden")
  setTimeout(() => modalTodoInput.focus(), 50)
}
function closeModal() {
  /* ... */ addTodoModal.classList.add("hidden")
  modalTodoInput.value = ""
}
function handleModalSubmit(event) {
  /* ... */ event.preventDefault()
  const text = modalTodoInput.value
  if (addTodo(text)) {
    renderTodoList()
    saveState()
    closeModal()
    debouncedGenerateAndApply()
  } else {
    modalTodoInput.focus()
    modalTodoInput.classList.add("shake-animation")
    setTimeout(() => modalTodoInput.classList.remove("shake-animation"), 500)
  }
}
function openEditModal(id) {
  /* ... */ const todo = state.todos.find((t) => t.id === id)
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
  /* ... */ editTodoModal.classList.add("hidden")
  modalEditInput.value = ""
  editTodoIdInput.value = ""
}
function handleEditModalSubmit(event) {
  /* ... */ event.preventDefault()
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
      utils.showToast(toastContainer, "Task updated!", "success")
      debouncedGenerateAndApply()
    } else {
      utils.showToast(toastContainer, "No changes detected.", "info")
    }
  } else {
    console.error("Could not find todo to save edit for ID:", id)
    utils.showToast(toastContainer, "Error updating task.", "error")
  }
  closeEditModal()
}
function openRecordShortcutModal() {
  /* ... */ isRecordingShortcut = true
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
  /* ... */ isRecordingShortcut = false
  recordShortcutModal.classList.add("hidden")
  document.removeEventListener("keydown", handleShortcutKeyDown, true)
  document.removeEventListener("keyup", handleShortcutKeyUp, true)
  if (appSettingsModal) {
    appSettingsModal.classList.remove("modal-temporarily-hidden")
  }
}
function openAppSettingsModal() {
  /* ... */ applyStateToUI()
  updateShortcutInputVisibility()
  appSettingsModal.classList.remove("hidden")
}
function closeAppSettingsModal() {
  /* ... */ appSettingsModal.classList.add("hidden")
}
// --- Clear Tasks ---
function handleClearCompleted() {
  /* ... */ const completedCount = state.todos.filter((t) => t.done).length
  if (completedCount === 0) {
    utils.showToast(toastContainer, "No completed tasks to clear.", "info")
    return
  }
  state.todos = state.todos.filter((t) => !t.done)
  renderTodoList()
  saveState()
  utils.showToast(
    toastContainer,
    `${completedCount} completed task${completedCount > 1 ? "s" : ""} cleared.`,
    "success"
  )
  debouncedGenerateAndApply()
}
function handleClearActive() {
  /* ... */ const activeCount = state.todos.filter((t) => !t.done).length
  if (activeCount === 0) {
    utils.showToast(toastContainer, "No active tasks to clear.", "info")
    return
  }
  if (
    !window.confirm(
      `Are you sure you want to delete ${activeCount} active task(s)? This cannot be undone.`
    )
  ) {
    return
  }
  state.todos = state.todos.filter((t) => t.done)
  renderTodoList()
  saveState()
  utils.showToast(
    toastContainer,
    `${activeCount} active task${activeCount > 1 ? "s" : ""} cleared.`,
    "success"
  )
  debouncedGenerateAndApply()
}
// --- Shortcut Recording ---
function handleShortcutKeyDown(event) {
  /* ... */ if (!isRecordingShortcut) return
  event.preventDefault()
  event.stopPropagation()
  const key = event.key
  const code = event.code
  const isModifier =
    ["Control", "Shift", "Alt", "Meta", "ContextMenu"].includes(key) ||
    code.startsWith("Control") ||
    code.startsWith("Shift") ||
    code.startsWith("Alt") ||
    code.startsWith("Meta")
  if (!isModifier) {
    if (!lastMainKeyPressed) {
      pressedKeys.clear()
      if (event.ctrlKey) pressedKeys.add("Control")
      if (event.shiftKey) pressedKeys.add("Shift")
      if (event.altKey) pressedKeys.add("Alt")
      if (event.metaKey) pressedKeys.add("Meta")
      pressedKeys.add(key)
      lastMainKeyPressed = key
      currentRecordedString = utils.buildAcceleratorString(pressedKeys)
      const isValid = utils.isValidAccelerator(currentRecordedString)
      updateRecordShortcutDisplay(
        null,
        utils.buildAcceleratorStringParts(pressedKeys)
      )
      recordSaveBtn.disabled = !isValid
      if (!isValid) {
        updateRecordShortcutDisplay(
          "Modifier needed!",
          utils.buildAcceleratorStringParts(pressedKeys)
        )
        currentRecordedString = ""
        lastMainKeyPressed = null
        pressedKeys.clear()
        recordSaveBtn.disabled = true
      }
    }
  } else {
    if (!lastMainKeyPressed) {
      pressedKeys.add(key)
      updateRecordShortcutDisplay(
        "Press main key...",
        utils.buildAcceleratorStringParts(pressedKeys)
      )
    }
  }
}
function handleShortcutKeyUp(event) {
  /* ... */ if (!isRecordingShortcut) return
  const key = event.key
  if (["Control", "Shift", "Alt", "Meta"].includes(key)) {
    pressedKeys.delete(key)
    if (!lastMainKeyPressed) {
      updateRecordShortcutDisplay(
        "Press main key...",
        utils.buildAcceleratorStringParts(pressedKeys)
      )
    }
  }
}
function updateRecordShortcutDisplay(message = null, parts = []) {
  /* ... */ shortcutDisplayArea.innerHTML = ""
  if (message) {
    const messageSpan = document.createElement("span")
    messageSpan.textContent = message
    shortcutDisplayArea.appendChild(messageSpan)
  }
  if (parts.length > 0) {
    parts.forEach((part) => {
      const keySpan = document.createElement("span")
      keySpan.className = "key-display"
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
      keySpan.textContent = utils.mapKeyForDisplay(part)
      shortcutDisplayArea.appendChild(keySpan)
    })
  } else if (!message) {
    shortcutDisplayArea.innerHTML = "<span>Press keys...</span>"
  }
}
function handleSaveShortcut() {
  /* ... */ if (
    !currentRecordedString ||
    !utils.isValidAccelerator(currentRecordedString)
  ) {
    alert(
      "Invalid shortcut recorded. Please ensure you press a modifier (Ctrl, Alt, Shift, Cmd) plus another key."
    )
    recordSaveBtn.disabled = true
    updateRecordShortcutDisplay("Press keys...")
    return
  }
  if (currentRecordedString !== state.quickAddShortcut) {
    state.quickAddShortcut = currentRecordedString
    applyStateToUI()
    saveState()
    console.log(
      "Renderer: Sending updated shortcut to main:",
      state.quickAddShortcut
    )
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
  /* ... */ const isImage = state.backgroundType === "image"
  settingsInputs.bgColorControls.classList.toggle("hidden", isImage)
  settingsInputs.bgImageControls.classList.toggle("hidden", !isImage)
}
async function handleImageFileSelect(e) {
  /* ... */ const file = e.target.files[0]
  if (!file) return
  if (!file.type.startsWith("image/")) {
    alert("Invalid image file type. Please select a PNG, JPG, or WEBP image.")
    e.target.value = ""
    return
  }
  if (file.size > 15 * 1024 * 1024) {
    alert("Image file is too large (Max 15MB). Please choose a smaller image.")
    e.target.value = ""
    return
  }
  const reader = new FileReader()
  reader.onload = async (event) => {
    const imageDataUrl = event.target.result
    state.backgroundImageDataUrl = imageDataUrl
    state.backgroundImageName = file.name
    state.backgroundType = "image"
    settingsInputs.imageFilenameSpan.textContent = file.name
    applyStateToUI()
    try {
      console.log("Saving selected background image...")
      const saveResult = await window.electronAPI.saveBackgroundImage(
        imageDataUrl
      )
      if (!saveResult.success) {
        throw new Error(
          saveResult.error || "Failed to save background image file."
        )
      }
      console.log("Background image saved by main process.")
      generateTodoImageAndUpdatePreview()
      saveState()
      maybeAutoApplyWallpaper()
    } catch (error) {
      console.error("Error saving background image:", error)
      utils.showToast(
        toastContainer,
        `Error saving image: ${error.message}`,
        "error"
      )
      handleClearImage()
    }
  }
  reader.onerror = handleImageReadError
  reader.readAsDataURL(file)
}
async function handleClearImage() {
  /* ... */ const oldImageName = state.backgroundImageName
  state.backgroundImageDataUrl = null
  state.backgroundImageName = null
  state.backgroundType = "color"
  settingsInputs.imageFilenameSpan.textContent = "No file chosen"
  settingsInputs.imageFileInput.value = ""
  settingsInputs.bgTypeColor.checked = true
  updateBackgroundControlsVisibility()
  generateTodoImageAndUpdatePreview()
  saveState()
  if (oldImageName) {
    try {
      console.log("Requesting main process to clear saved background image...")
      await window.electronAPI.clearBackgroundImage()
      console.log("Cleared background image acknowledged by main process.")
    } catch (error) {
      console.error(
        "Error telling main process to clear background image:",
        error
      )
    }
  }
  maybeAutoApplyWallpaper()
}
function handleImageReadError(err) {
  /* ... */ console.error("FileReader error:", err)
  alert("Error reading the selected image file.")
  handleClearImage()
}
// --- Wallpaper Application ---
async function handleApplyWallpaper() {
  /* ... */ if (!state.lastGeneratedImageDataUrl) {
    console.warn("Apply Wallpaper: No image data generated yet. Generating...")
    try {
      await generateTodoImageAndUpdatePreview()
      if (!state.lastGeneratedImageDataUrl) {
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
  if (applyWallpaperBtn.disabled) return
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
    if (span) span.textContent = originalText
    applyWallpaperBtn.disabled = false
  }
}
// --- IPC Event Handlers ---
async function handleQuickAddTaskAndApply(taskText) {
  /* ... */ console.log("Renderer received task and apply trigger:", taskText)
  if (addTodo(taskText)) {
    renderTodoList()
    saveState()
    try {
      await generateTodoImageAndUpdatePreview()
      if (state.lastGeneratedImageDataUrl) {
        console.log("Applying wallpaper after quick add...")
        const b = applyWallpaperBtn.disabled
        applyWallpaperBtn.disabled = true
        try {
          await window.electronAPI.updateWallpaper(
            state.lastGeneratedImageDataUrl
          )
          console.log("Wallpaper updated successfully via Quick Add.")
        } catch (a) {
          console.error("Error applying wallpaper after quick add:", a)
          utils.showToast(
            toastContainer,
            `Quick Add Error: ${a.message}`,
            "error"
          )
        } finally {
          applyWallpaperBtn.disabled = b
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
    } catch (e) {
      console.error(
        "Error during image generation or application after quick add:",
        e
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
  /* ... */ console.error(
    "Renderer received Shortcut Error from main:",
    errorMessage
  )
  alert(
    `Shortcut Error:\n${errorMessage}\n\nPlease choose different keys or close the conflicting application.`
  )
  state.runInTray = false
  if (modalRunInTrayCheckbox) {
    modalRunInTrayCheckbox.checked = false
  }
  updateShortcutInputVisibility()
  saveState()
}
function handleForcedSettingUpdate(settingsToUpdate) {
  /* ... */ console.log(
    "Renderer received forced setting update from main:",
    settingsToUpdate
  )
  let sc = false
  for (const k in settingsToUpdate) {
    if (state.hasOwnProperty(k) && state[k] !== settingsToUpdate[k]) {
      console.log(
        `Forcing setting ${k} from ${state[k]} to ${settingsToUpdate[k]}`
      )
      state[k] = settingsToUpdate[k]
      sc = true
      if (k === "runInTray" && modalRunInTrayCheckbox) {
        modalRunInTrayCheckbox.checked = state.runInTray
      } else if (k === "quickAddShortcut" && modalCurrentShortcutDisplay) {
        modalCurrentShortcutDisplay.textContent = utils.formatAccelerator(
          state.quickAddShortcut || DEFAULT_SHORTCUT
        )
      } else if (
        k === "quickAddTranslucent" &&
        modalQuickAddTranslucentCheckbox
      ) {
        modalQuickAddTranslucentCheckbox.checked = state.quickAddTranslucent
      } else if (k === "autoApplyWallpaper" && modalAutoApplyCheckbox) {
        modalAutoApplyCheckbox.checked = state.autoApplyWallpaper
      }
    }
  }
  if (sc) {
    console.log("Applying forced state changes to UI and saving.")
    applyStateToUI()
    saveState()
  } else {
    console.log("No actual state changes needed from forced update.")
  }
}
function handleWindowStateChange({ isMaximized }) {
  /* ... */ console.log(
    "Renderer received window state change - Maximized:",
    isMaximized
  )
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
  /* ... */ const tBtns = settingsColumn.querySelectorAll(
    ".setting-section-toggle"
  )
  tBtns.forEach((button) => {
    const section = button.closest(".setting-section")
    const content = section.querySelector(".setting-section-content")
    const isCollapsedInitially = section.classList.contains("collapsed")
    button.setAttribute("aria-expanded", !isCollapsedInitially)
    if (content) {
      content.style.transition = "none"
      if (isCollapsedInitially) {
        content.style.maxHeight = "0"
        content.style.opacity = "0"
        content.style.visibility = "hidden"
        content.style.paddingTop = "0"
        content.style.paddingBottom = "0"
        content.style.marginTop = "0"
        content.style.marginBottom = "0"
      } else {
        content.style.maxHeight = null
        content.style.opacity = "1"
        content.style.visibility = "visible"
        content.style.paddingTop = ""
        content.style.paddingBottom = ""
        content.style.marginTop = ""
        content.style.marginBottom = ""
      }
      void content.offsetHeight
      content.style.transition = ""
    }
  })
}
function handleSettingToggleClick(button) {
  /* ... */ const section = button.closest(".setting-section")
  const content = section.querySelector(".setting-section-content")
  if (!section || !content) return
  section.classList.toggle("collapsed")
  const isCollapsed = section.classList.contains("collapsed")
  button.setAttribute("aria-expanded", !isCollapsed)
  if (isCollapsed) {
    content.style.maxHeight = content.scrollHeight + "px"
    requestAnimationFrame(() => {
      content.style.maxHeight = "0"
      content.style.opacity = "0"
      content.style.paddingTop = "0"
      content.style.paddingBottom = "0"
      content.style.marginTop = "0"
      content.style.marginBottom = "0"
      content.addEventListener(
        "transitionend",
        () => {
          if (section.classList.contains("collapsed")) {
            content.style.visibility = "hidden"
          }
        },
        { once: true }
      )
    })
  } else {
    content.style.visibility = "visible"
    content.style.paddingTop = ""
    content.style.paddingBottom = ""
    content.style.marginTop = ""
    content.style.marginBottom = ""
    requestAnimationFrame(() => {
      content.style.maxHeight = content.scrollHeight + "px"
      content.style.opacity = "1"
    })
    content.addEventListener(
      "transitionend",
      () => {
        if (!section.classList.contains("collapsed")) {
          content.style.maxHeight = null
        }
      },
      { once: true }
    )
  }
}

// --- Start the application ---
initialize()
