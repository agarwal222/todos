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
const applyWallpaperBtn = document.getElementById("apply-wallpaper-btn")
const applyBtnIconDefault = applyWallpaperBtn?.querySelector(".icon-default")
const applyBtnTextDefault = applyWallpaperBtn?.querySelector(
  ".button-text-default"
)
const applyBtnTextLoading = applyWallpaperBtn?.querySelector(
  ".button-text-loading"
)
const applyBtnTextSuccess = applyWallpaperBtn?.querySelector(
  ".button-text-success"
)
const toggleTodosVisibilityBtn = document.getElementById(
  "toggle-todos-visibility-btn"
)
const todosVisibleIcon = document.getElementById("todos-visible-icon")
const todosHiddenIcon = document.getElementById("todos-hidden-icon")
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
  title: document.getElementById("wallpaper-title-input"),
  textColorPickerEl: document.getElementById("text-color-picker"),
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
  textBackgroundEnable: document.getElementById("text-background-enable"),
  textBackgroundControls: document.getElementById("text-background-controls"),
  textBgColorPickerEl: document.getElementById("text-bg-color-picker"),
  textPanelOpacity: document.getElementById("text-panel-opacity"),
  textPanelOpacityValue: document.getElementById("text-panel-opacity-value"),
  textBgPaddingInline: document.getElementById("text-bg-padding-inline"),
  textBgPaddingBlock: document.getElementById("text-bg-padding-block"),
  textBgBorderRadius: document.getElementById("text-bg-border-radius"),
  textBgBorderRadiusValue: document.getElementById(
    "text-bg-border-radius-value"
  ),
  textBorderColorPickerEl: document.getElementById("text-border-color-picker"),
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
const wallpaperStoragePathDisplay = document.getElementById(
  "wallpaper-storage-path-display"
)
const updateStatusDisplay = document.getElementById("update-status-display")
const checkForUpdatesBtn = document.getElementById("check-for-updates-btn")
const modalPreviewQualityLow = document.getElementById(
  "modal-preview-quality-low"
)
const modalPreviewQualityMedium = document.getElementById(
  "modal-preview-quality-medium"
)
const modalPreviewQualityHigh = document.getElementById(
  "modal-preview-quality-high"
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
let currentAppVersion = "?.?.?"

// Transient state
let isRecordingShortcut = false
let pressedKeys = new Set()
let currentRecordedString = ""
let lastMainKeyPressed = null
let systemFontsCache = []
let textColorPickr = null
let bgColorPickr = null
let textBgColorPickr = null
let textBorderColorPickr = null
let applyButtonTimeout = null
let isApplyingWallpaper = false

// *** Debounced function ***
const DEBOUNCE_DELAY = 300
const debouncedGenerateAndApply = utils.debounce(() => {
  console.log("Debounced action triggered for preview/apply")
  generateTodoImageAndUpdatePreview()
    .then(() => {
      maybeAutoApplyWallpaper()
    })
    .catch((err) => {
      console.error("Error during debounced generation:", err)
      utils.showToast(toastContainer, "Error updating preview.", "error")
    })
}, DEBOUNCE_DELAY)

// --- Initialization ---
async function initialize() {
  console.log("Initializing Renderer...")
  try {
    currentAppVersion = await window.electronAPI.getAppVersion()
    console.log("App Version:", currentAppVersion)
  } catch (err) {
    console.error("Failed to get app version:", err)
  }
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
          state.backgroundImageDataUrl = dataUrl
        } else {
          console.warn("Failed to load background image data. Resetting.")
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
    if (state.fontSource === "google" && state.googleFontName)
      fontLoadPromise = loadAndApplyGoogleFont(state.googleFontName, false)
    else if (state.fontSource === "system" && state.systemFontFamily) {
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
    console.warn("Initial font setup failed:", err)
    state.activeFontFamily = DEFAULT_FONT
    state.fontSource = "default"
    applyStateToUI()
    updateFontStatus("error", DEFAULT_FONT, "Initial load failed")
  }
  renderTodoList()
  Promise.all([imageLoadPromise, fontLoadPromise])
    .catch((err) => console.warn("Init promise rejected:", err))
    .finally(() => {
      generateTodoImageAndUpdatePreview()
    })
  console.log("Sending loaded settings to main:", {
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
    console.log(`Renderer received toggle for task ID: ${taskId}`)
    toggleDone(taskId)
    renderTodoList()
    saveState()
    debouncedGenerateAndApply()
  })
  window.electronAPI.onPerformTaskDelete((taskId) => {
    console.log(`Renderer received delete for task ID: ${taskId}`)
    deleteTodo(taskId)
    renderTodoList()
    saveState()
    debouncedGenerateAndApply()
  })
  window.electronAPI.onUpdateStatusMessage(handleUpdateStatusMessage)
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
    default: state[stateProp] || defaultColor,
    position: "bottom-start",
    components: {
      preview: true,
      opacity: true,
      hue: true,
      interaction: {
        hex: true,
        rgba: true,
        input: true,
        clear: false,
        cancel: false,
        save: true,
      },
    },
  })
  const onSave = (prop) => (color, instance) => {
    const newColor = color.toHEXA().toString()
    if (state[prop] !== newColor) {
      state[prop] = newColor
      saveState()
      debouncedGenerateAndApply()
    }
    instance.hide()
  }
  textColorPickr = Pickr.create(
    options("textColorPickerEl", DEFAULT_TEXT_COLOR, "textColor")
  ).on("save", onSave("textColor"))
  bgColorPickr = Pickr.create(
    options("bgColorPickerEl", DEFAULT_BG_COLOR, "bgColor")
  ).on("save", onSave("bgColor"))
  textBgColorPickr = Pickr.create(
    options("textBgColorPickerEl", DEFAULT_TEXT_BG_COLOR, "textBackgroundColor")
  ).on("save", onSave("textBackgroundColor"))
  textBorderColorPickr = Pickr.create(
    options(
      "textBorderColorPickerEl",
      DEFAULT_TEXT_BORDER_COLOR,
      "textBackgroundBorderColor"
    )
  ).on("save", onSave("textBackgroundBorderColor"))
}
// --- UI Update Helpers ---
function updateShortcutInputVisibility() {
  const isTrayEnabled = state.runInTray
  if (modalShortcutGroup)
    modalShortcutGroup.classList.toggle("hidden", !isTrayEnabled)
  if (modalQuickAddTranslucentGroup)
    modalQuickAddTranslucentGroup.classList.toggle("hidden", !isTrayEnabled)
}
function updateTextBackgroundControlsVisibility() {
  settingsInputs.textBackgroundControls?.classList.toggle(
    "hidden",
    !state.textBackgroundEnabled
  )
}
function updateTodosVisibilityToggleIcon() {
  if (toggleTodosVisibilityBtn && todosVisibleIcon && todosHiddenIcon) {
    const showTodos = state.showTodosOnWallpaper
    todosVisibleIcon.classList.toggle("hidden", !showTodos)
    todosHiddenIcon.classList.toggle("hidden", showTodos)
    toggleTodosVisibilityBtn.setAttribute("aria-pressed", showTodos)
    toggleTodosVisibilityBtn.title = showTodos
      ? "Hide Todos on Wallpaper"
      : "Show Todos on Wallpaper"
  }
}
// --- Apply State to UI ---
function applyStateToUI() {
  settingsInputs.title.value = state.title
  settingsInputs.fontSize.value = state.fontSize
  settingsInputs.fontWeight.value = state.fontWeight
  settingsInputs.listStyle.value = state.listStyle
  settingsInputs.overallOpacity.value = state.overallOpacity
  settingsInputs.overallOpacityValue.textContent = parseFloat(
    state.overallOpacity
  ).toFixed(2)
  settingsInputs.textPanelOpacity.value = state.textPanelOpacity
  settingsInputs.textPanelOpacityValue.textContent = parseFloat(
    state.textPanelOpacity
  ).toFixed(2)
  settingsInputs.textBgBorderRadius.value = state.textBackgroundBorderRadius
  settingsInputs.textBgBorderRadiusValue.textContent =
    state.textBackgroundBorderRadius
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
  if (state.fontSource === "system" && state.systemFontFamily)
    settingsInputs.systemFontSelect.value = state.systemFontFamily
  else settingsInputs.systemFontSelect.value = ""
  settingsInputs.bgTypeColor.checked = state.backgroundType === "color"
  settingsInputs.bgTypeImage.checked = state.backgroundType === "image"
  settingsInputs.imageFilenameSpan.textContent =
    state.backgroundImageName || "No file chosen"
  if (modalPreviewQualityLow)
    modalPreviewQualityLow.checked = state.previewQuality === "low"
  if (modalPreviewQualityMedium)
    modalPreviewQualityMedium.checked = state.previewQuality === "medium"
  if (modalPreviewQualityHigh)
    modalPreviewQualityHigh.checked = state.previewQuality === "high" // Apply to modal radios
  if (textColorPickr)
    textColorPickr.setColor(state.textColor || DEFAULT_TEXT_COLOR, true)
  if (bgColorPickr)
    bgColorPickr.setColor(state.bgColor || DEFAULT_BG_COLOR, true)
  if (textBgColorPickr)
    textBgColorPickr.setColor(
      state.textBackgroundColor || DEFAULT_TEXT_BG_COLOR,
      true
    )
  if (textBorderColorPickr)
    textBorderColorPickr.setColor(
      state.textBackgroundBorderColor || DEFAULT_TEXT_BORDER_COLOR,
      true
    )
  if (modalRunInTrayCheckbox) modalRunInTrayCheckbox.checked = state.runInTray
  if (modalQuickAddTranslucentCheckbox)
    modalQuickAddTranslucentCheckbox.checked = state.quickAddTranslucent
  if (modalCurrentShortcutDisplay)
    modalCurrentShortcutDisplay.textContent = utils.formatAccelerator(
      state.quickAddShortcut || DEFAULT_SHORTCUT
    )
  if (modalAutoApplyCheckbox)
    modalAutoApplyCheckbox.checked = state.autoApplyWallpaper
  updateTodosVisibilityToggleIcon()
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
  try {
    const stateToSave = { ...state }
    delete stateToSave.backgroundImageDataUrl
    delete stateToSave.lastGeneratedImageDataUrl
    delete stateToSave.customFontStatus
    delete stateToSave.customFontError
    window.electronAPI.saveState(stateToSave)
  } catch (e) {
    console.error("Save State Error:", e)
    utils.showToast(toastContainer, "Error saving settings.", "error")
  }
}
async function loadState() {
  try {
    const loadedStateFromFile = await window.electronAPI.loadState()
    const platform = window.electronAPI?.getPlatform() || "win32"
    const platformDefaultTranslucent = platform === "darwin"
    if (loadedStateFromFile) {
      const currentScreenDims = {
        screenWidth: state.screenWidth,
        screenHeight: state.screenHeight,
      }
      state = {
        ...initialState,
        ...loadedStateFromFile,
        showTodosOnWallpaper:
          typeof loadedStateFromFile.showTodosOnWallpaper === "boolean"
            ? loadedStateFromFile.showTodosOnWallpaper
            : true,
        previewQuality: ["low", "medium", "high"].includes(
          loadedStateFromFile.previewQuality
        )
          ? loadedStateFromFile.previewQuality
          : "medium",
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
      if (state.fontSource === "system" && state.systemFontFamily)
        state.activeFontFamily = state.systemFontFamily
      else if (state.fontSource === "google" && state.googleFontName)
        state.activeFontFamily = state.googleFontName
      else {
        state.fontSource = "default"
        state.activeFontFamily = DEFAULT_FONT
        state.systemFontFamily = ""
        state.googleFontName = ""
      }
      console.log("Final state after loading:", state)
    } else {
      state = {
        ...initialState,
        autoApplyWallpaper: false,
        quickAddTranslucent: platformDefaultTranslucent,
        screenWidth: state.screenWidth,
        screenHeight: state.screenHeight,
        showTodosOnWallpaper: true,
      }
      console.log("No state file found, using defaults.")
    }
  } catch (e) {
    console.error("Load State Error:", e)
    utils.showToast(toastContainer, "Error loading settings.", "error")
    const platform = window.electronAPI?.getPlatform() || "win32"
    state = {
      ...initialState,
      autoApplyWallpaper: false,
      quickAddTranslucent: platform === "darwin",
      showTodosOnWallpaper: true,
    }
  }
}
// --- Event Handlers ---
function handleGlobalKeyDown(event) {
  if (!addTodoModal.classList.contains("hidden")) {
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
function handleVisualSettingChange(event) {
  const target = event.target
  const id = target.id
  const value = target.type === "checkbox" ? target.checked : target.value
  const key = target.name || id
  let stateChanged = false
  let requiresImmediateRegeneration = false
  let requiresUiUpdate = false
  let isSlider = target.type === "range"
  const eventType = event.type
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
    "font-source": "fontSource",
    "bg-type": "backgroundType" /* Removed previewQuality */,
  }
  const propertyName = idToStateMap[key]
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
        if (!step || step === "1") newValue = Math.round(newValue)
      } else if (
        isSlider &&
        !(target.step && (target.step === "0.01" || target.step === "0.05"))
      )
        newValue = Math.round(newValue)
      else if (isSlider) newValue = parseFloat(newValue.toFixed(2))
    }
    if (oldValue !== newValue && (target.type !== "radio" || target.checked)) {
      console.log(
        `State change: ${propertyName} from ${oldValue} to ${newValue}`
      )
      state[propertyName] = newValue
      stateChanged = true
      switch (propertyName) {
        case "textBackgroundEnabled":
          requiresUiUpdate = true
          requiresImmediateRegeneration = true
          break
        case "fontSource":
          requiresUiUpdate = true
          requiresImmediateRegeneration = false
          if (value === "default") {
            state.activeFontFamily = DEFAULT_FONT
            updateFontStatus("idle", DEFAULT_FONT)
            state.systemFontFamily = ""
            state.googleFontName = ""
            requiresImmediateRegeneration = true
          } else if (value === "system") {
            const sel = settingsInputs.systemFontSelect.value
            if (sel) {
              state.activeFontFamily = sel
              state.systemFontFamily = sel
              updateFontStatus("loaded", sel)
              requiresImmediateRegeneration = true
            } else {
              state.activeFontFamily = DEFAULT_FONT
              state.systemFontFamily = ""
              updateFontStatus("idle", DEFAULT_FONT)
            }
            state.googleFontName = ""
          } else if (value === "google") {
            state.systemFontFamily = ""
            if (state.googleFontName && state.customFontStatus === "loaded")
              updateFontStatus("loaded", state.activeFontFamily)
            else {
              updateFontStatus("idle", state.googleFontName || DEFAULT_FONT)
              state.customFontStatus = "idle"
            }
            requiresImmediateRegeneration =
              state.googleFontName && state.customFontStatus === "loaded"
          }
          break
        case "backgroundType":
          requiresUiUpdate = true
          requiresImmediateRegeneration = true
          break
        case "fontWeight":
        case "listStyle":
        case "fontSize":
        case "textColor":
        case "overallOpacity":
        case "textPosition":
        case "textAlign":
        case "offsetX":
        case "offsetY":
        case "titleBottomMargin":
        case "itemSpacing":
        case "maxItemsPerColumn":
        case "columnGap":
        case "textBackgroundColor":
        case "textPanelOpacity":
        case "textBackgroundPaddingInline":
        case "textBackgroundPaddingBlock":
        case "textBackgroundBorderRadius":
        case "textBackgroundBorderWidth":
        case "textBackgroundBorderColor":
          if (!isSlider || eventType === "change")
            requiresImmediateRegeneration = true
          else if (isSlider && eventType === "input") {
            const valueSpan = document.getElementById(`${id}-value`)
            if (valueSpan)
              valueSpan.textContent =
                target.step &&
                (target.step === "0.01" || target.step === "0.05")
                  ? newValue.toFixed(2)
                  : newValue.toFixed(0)
            requiresImmediateRegeneration = false
          }
          break
        case "systemFontFamily":
          if (state.fontSource === "system") {
            if (newValue) {
              state.activeFontFamily = newValue
              updateFontStatus("loaded", newValue)
            } else {
              state.activeFontFamily = DEFAULT_FONT
              updateFontStatus("idle", DEFAULT_FONT)
              requiresImmediateRegeneration = false
            }
            requiresImmediateRegeneration = true
          }
          break
        case "googleFontName":
          if (
            state.customFontStatus === "loaded" ||
            state.customFontStatus === "error"
          ) {
            updateFontStatus("idle", state.activeFontFamily)
            state.customFontStatus = "idle"
          }
          requiresImmediateRegeneration = false
          break
        default:
          console.warn(`Unhandled property: ${propertyName}`)
          requiresImmediateRegeneration = true
          break
      }
    }
  } else if (key !== "modal-preview-quality") {
    // Ignore the modal radios here
    console.warn(
      `Visual Setting: State property not found or unmapped for: ${key}`
    )
  }
  if (stateChanged) {
    saveState()
    if (requiresUiUpdate) {
      console.log("Triggering UI update...")
      if (propertyName === "textBackgroundEnabled")
        updateTextBackgroundControlsVisibility()
      if (propertyName === "fontSource") updateFontControlsVisibility()
      if (propertyName === "backgroundType")
        updateBackgroundControlsVisibility()
    }
    if (requiresImmediateRegeneration || (isSlider && eventType === "input")) {
      console.log(
        `Triggering debounce (immediate: ${requiresImmediateRegeneration}, sliderInput: ${
          isSlider && eventType === "input"
        })...`
      )
      debouncedGenerateAndApply()
    }
  }
}
function handleAppSettingChange(event) {
  const target = event.target
  if (!target) return
  const id = target.id
  const value = target.type === "checkbox" ? target.checked : target.value
  const key = target.name || id
  let stateChanged = false
  let needsIpcUpdate = false
  let propertyName = null
  let newValue = value
  switch (key) {
    case "modal-run-in-tray-checkbox":
      propertyName = "runInTray"
      needsIpcUpdate = true
      updateShortcutInputVisibility()
      break
    case "modal-quick-add-translucent-checkbox":
      propertyName = "quickAddTranslucent"
      needsIpcUpdate = true
      break
    case "modal-auto-apply-checkbox":
      propertyName = "autoApplyWallpaper"
      break
    case "modal-preview-quality":
      if (target.checked) {
        propertyName = "previewQuality"
        console.log(`Preview quality changed to: ${newValue}`)
        debouncedGenerateAndApply()
      }
      break // Handle modal radios
  }
  if (
    propertyName &&
    state.hasOwnProperty(propertyName) &&
    state[propertyName] !== newValue
  ) {
    if (target.type !== "radio" || target.checked) {
      state[propertyName] = newValue
      stateChanged = true
    }
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
    } /* applyStateToUI(); // No need usually, radios/checkboxes update visually */
  }
}
function handleInputBlurOrEnter(event) {
  if (event.type === "keydown" && event.key !== "Enter") return
  const target = event.target
  if (
    target.closest(".column-settings") &&
    target.tagName === "INPUT" &&
    (target.type === "text" || target.type === "number")
  ) {
    console.log(
      `Triggering preview update due to ${event.type} on ${target.id}`
    )
    debouncedGenerateAndApply()
    if (event.type === "keydown" && target.blur) target.blur()
  }
}
function handleToggleTodosVisibility() {
  state.showTodosOnWallpaper = !state.showTodosOnWallpaper
  updateTodosVisibilityToggleIcon()
  saveState()
  debouncedGenerateAndApply()
}
function handleCheckForUpdatesClick() {
  if (checkForUpdatesBtn && !checkForUpdatesBtn.disabled) {
    console.log("Manual check for updates requested.")
    window.electronAPI.checkForUpdates()
    handleUpdateStatusMessage("Checking for updates...", true)
  }
}
function setupEventListeners() {
  console.log("Setting up event listeners...")
  applyWallpaperBtn.addEventListener("click", handleApplyWallpaper)
  toggleTodosVisibilityBtn.addEventListener(
    "click",
    handleToggleTodosVisibility
  )
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
  const textNumInputs = visualSettingsContainer.querySelectorAll(
    'input[type="text"], input[type="number"]'
  )
  textNumInputs.forEach((input) => {
    input.addEventListener("blur", handleInputBlurOrEnter)
    input.addEventListener("keydown", handleInputBlurOrEnter)
  })
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
  appSettingsForm.addEventListener("change", handleAppSettingChange) // This now handles modal radios too
  if (modalChangeShortcutBtn) {
    modalChangeShortcutBtn.addEventListener("click", () => {
      if (appSettingsModal)
        appSettingsModal.classList.add("modal-temporarily-hidden")
      openRecordShortcutModal()
    })
  }
  if (checkForUpdatesBtn)
    checkForUpdatesBtn.addEventListener("click", handleCheckForUpdatesClick)
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
  console.log(
    `Maybe Auto Apply: Auto=${state.autoApplyWallpaper}, Applying=${isApplyingWallpaper}`
  )
  if (state.autoApplyWallpaper && !isApplyingWallpaper) {
    console.log("Auto-applying wallpaper...")
    await handleApplyWallpaper()
  } else if (state.autoApplyWallpaper && isApplyingWallpaper)
    console.log(
      "Auto-apply skipped: Wallpaper application already in progress."
    )
  else console.log("Auto-apply disabled or apply in progress, preview updated.")
}
// --- Auto Updater Listeners ---
function setupAutoUpdaterListeners() {
  window.electronAPI.onUpdateAvailable((i) => {
    console.log("Update available (bar):", i)
    showUpdateMessage(`Update v${i.version} available. Downloading...`)
    if (restartButton) restartButton.style.display = "none"
  })
  window.electronAPI.onUpdateDownloaded((i) => {
    console.log("Update downloaded (bar):", i)
    showUpdateMessage(`Update v${i.version} downloaded. Restart to install.`)
    if (restartButton) restartButton.style.display = "inline-flex"
  })
  window.electronAPI.onUpdateError((e) => {
    console.error("Update error (bar):", e)
    showUpdateMessage(`Error checking for updates: ${e}`)
    if (restartButton) restartButton.style.display = "none"
    setTimeout(hideUpdateMessage, 8000)
  })
  window.electronAPI.onDownloadProgress((p) => {
    showUpdateMessage(`Downloading update: ${Math.round(p.percent)}%`)
  })
  if (restartButton) {
    restartButton.addEventListener("click", () => {
      console.log("Restart clicked")
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
function handleUpdateStatusMessage(
  message,
  isChecking = false,
  isError = false,
  isAvailable = false
) {
  if (!updateStatusDisplay || !checkForUpdatesBtn) return
  updateStatusDisplay.textContent = message
  updateStatusDisplay.classList.remove("update-available", "update-error")
  if (isAvailable) updateStatusDisplay.classList.add("update-available")
  else if (isError) updateStatusDisplay.classList.add("update-error")
  checkForUpdatesBtn.disabled = isChecking
  checkForUpdatesBtn.textContent = isChecking ? "Checking..." : "Check Now"
}
// --- Todo Management ---
function addTodo(text) {
  const t = text.trim()
  if (t) {
    state.todos.push({ id: Date.now(), text: t, context: "", done: false })
    return true
  }
  return false
}
function deleteTodo(id) {
  state.todos = state.todos.filter((t) => t.id !== id)
}
function toggleDone(id) {
  const t = state.todos.find((t) => t.id === id)
  if (t) t.done = !t.done
}
// --- UI Rendering ---
function renderTodoList() {
  todoListUl.innerHTML = ""
  completedTodoListUl.innerHTML = ""
  if (!Array.isArray(state.todos)) state.todos = []
  const activeTodos = state.todos.filter((t) => !t.done)
  const completedTodos = state.todos.filter((t) => t.done)
  if (activeTodos.length === 0)
    todoListUl.innerHTML = `<li class="empty-list-message">No active tasks!</li>`
  else activeTodos.forEach((t) => todoListUl.appendChild(createTodoElement(t)))
  const hasCompleted = completedTodos.length > 0
  completedHeader.classList.toggle("hidden", !hasCompleted)
  completedListContainer.classList.toggle("hidden", !hasCompleted)
  if (clearCompletedBtn)
    clearCompletedBtn.style.display = hasCompleted ? "inline-flex" : "none"
  if (clearActiveBtn)
    clearActiveBtn.style.display =
      activeTodos.length > 0 ? "inline-flex" : "none"
  if (hasCompleted)
    completedTodos.forEach((t) =>
      completedTodoListUl.appendChild(createTodoElement(t))
    )
  addContextInputListeners()
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
  ci.maxLength = utils.CONTEXT_MAX_LENGTH
  d.appendChild(s)
  d.appendChild(ci)
  const ab = document.createElement("div")
  ab.className = "task-actions"
  const eb = document.createElement("button")
  eb.innerHTML = `<span class="material-symbols-outlined">edit</span>`
  eb.className = "button button-ghost button-icon edit-btn"
  eb.title = "Edit Task"
  eb.setAttribute("aria-label", "Edit task")
  const db = document.createElement("button")
  db.innerHTML = `<span class="material-symbols-outlined">delete</span>`
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
    if (newContext.length > utils.CONTEXT_MAX_LENGTH) {
      newContext = newContext.substring(0, utils.CONTEXT_MAX_LENGTH)
      input.value = newContext
    }
    if (todo.context !== newContext) {
      todo.context = newContext
      console.log(`Context updated: "${newContext}"`)
      saveState()
    }
  }
}
function handleContextBlurOrEnter(event) {
  if (event.type === "keydown" && event.key !== "Enter") return
  const target = event.target
  if (target.classList.contains("context-input")) {
    console.log(`Context blur/enter trigger`)
    debouncedGenerateAndApply()
    if (event.type === "keydown") target.blur()
  }
}
function addContextInputListeners() {
  const allInputs = [
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
    showTodosOnWallpaper,
    previewQuality,
  } = state
  if (!ctx || !canvas) {
    console.error("Canvas context unavailable.")
    return Promise.reject("Canvas context unavailable.")
  }
  if (canvas.width !== screenWidth || canvas.height !== screenHeight)
    setCanvasAndPreviewSize(screenWidth, screenHeight)
  const currentActiveFont = activeFontFamily || DEFAULT_FONT
  const itemFontSize = parseInt(fontSize, 10) || 48
  const linesToDraw = showTodosOnWallpaper
    ? todos
        .filter((t) => !t.done)
        .map((t) => ({ text: t.text, context: t.context || "", done: false }))
    : []
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
        console.error("BG Image Error:", e)
        utils.drawBackgroundColor(ctx, bgColor, screenWidth, screenHeight)
      }
    } else utils.drawBackgroundColor(ctx, bgColor, screenWidth, screenHeight)
    if (showTodosOnWallpaper && (linesToDraw.length > 0 || title)) {
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
          textPosition,
          offsetX,
          offsetY,
          textBlockMetrics,
          textAlign
        )
      const originalAlpha = ctx.globalAlpha
      ctx.globalAlpha = Math.max(0, Math.min(1, overallOpacity))
      if (
        textBackgroundEnabled &&
        (textBlockMetrics.overallWidth > 0 ||
          textBlockMetrics.overallHeight > 0)
      ) {
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
        })
      }
      if (
        textBlockMetrics.overallWidth > 0 ||
        textBlockMetrics.overallHeight > 0
      ) {
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
          maxColumnWidth: textBlockMetrics.maxColumnWidth,
        })
      }
      ctx.globalAlpha = originalAlpha
    }
    try {
      state.lastGeneratedImageDataUrl = canvas.toDataURL("image/png")
      console.log("High-quality PNG stored.")
    } catch (e) {
      console.error("Error generating PNG:", e)
      state.lastGeneratedImageDataUrl = null
    }
    updatePreviewImage(previewQuality)
  } catch (err) {
    console.error("Error generating image:", err)
    updatePreviewImage(previewQuality)
    throw err
  }
}
function updatePreviewImage(quality = "medium") {
  if (!canvas || !previewAreaImg || !previewContainer || !previewLoader) {
    console.error("updatePreviewImage: Required DOM elements not found.")
    return
  }
  let previewDataUrl = null
  let format = "image/jpeg"
  let qualityValue = 0.75
  switch (quality) {
    case "low":
      qualityValue = 0.5
      break
    case "medium":
      qualityValue = 0.75
      break
    case "high":
      format = "image/png"
      qualityValue = undefined
      break
    default:
      console.warn(`Unknown preview quality: ${quality}. Using medium.`)
      qualityValue = 0.75
      format = "image/jpeg"
      break
  }
  try {
    const qualityLogValue = qualityValue === undefined ? "N/A" : qualityValue
    console.log(
      `Generating preview with format: ${format}, quality: ${qualityLogValue}`
    )
    previewDataUrl = canvas.toDataURL(format, qualityValue)
    previewAreaImg.onload = () => {
      previewContainer.classList.add("loaded")
    }
    previewAreaImg.onerror = () => {
      console.error("Preview image failed to load from data URL.")
      previewContainer.classList.remove("loaded")
      previewAreaImg.src = ""
      previewLoader.textContent = "Preview Error"
    }
    previewAreaImg.src = previewDataUrl
  } catch (e) {
    const qualityLogValue = qualityValue === undefined ? "N/A" : qualityValue
    console.error(`Preview Gen Error (${format} ${qualityLogValue}):`, e)
    previewContainer.classList.remove("loaded")
    previewAreaImg.src = ""
    previewLoader.textContent = "Generation Error"
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
      console.log(`Font loaded: ${actualFontFamily} ${actualWeight}`)
      state.activeFontFamily = actualFontFamily
      state.googleFontName = fontName
      state.customFontStatus = "loaded"
      state.customFontError = null
      updateFontStatus("loaded", actualFontFamily)
      utils.showToast(
        toastContainer,
        `Font "${actualFontFamily}" loaded!`,
        "success"
      )
      generateTodoImageAndUpdatePreview()
      if (shouldSaveState) saveState()
      maybeAutoApplyWallpaper()
    } else {
      throw new Error(result.error || `Could not load font "${fontName}".`)
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
      if (state.fontSource === "default")
        statusText = `Default: ${DEFAULT_FONT}`
      else if (state.fontSource === "system")
        statusText = state.systemFontFamily
          ? `System: ${state.systemFontFamily}`
          : `System: (Select Font)`
      else if (state.fontSource === "google")
        statusText = state.googleFontName
          ? `Google: ${state.googleFontName} (Load)`
          : `Google: (Enter Name)`
      else statusText = `Active: ${displayFontFamily || DEFAULT_FONT}`
      settingsInputs.loadFontBtn.disabled = state.fontSource !== "google"
      break
  }
  settingsInputs.fontStatus.textContent = statusText
  settingsInputs.fontStatus.title = error || statusText
}
// --- Settings Panel ---
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
    ? "Open Visual Settings (Alt+S)"
    : "Close Visual Settings (Alt+S)"
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
    saveState()
    debouncedGenerateAndApply()
  } else if (target.closest(".edit-btn")) openEditModal(id)
  else if (target.closest(".delete-btn")) {
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
    setTimeout(() => {
      if (li.parentNode === todoListUl || li.parentNode === completedTodoListUl)
        renderTodoList()
    }, 350)
    saveState()
    debouncedGenerateAndApply()
  }
}
// --- Modal Functions ---
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
  const todo = state.todos.find((t) => t.id === id)
  if (!todo) {
    console.error("Cannot find todo to edit:", id)
    utils.showToast(toastContainer, "Error finding task.", "error")
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
    console.error("Invalid ID in edit modal.")
    utils.showToast(toastContainer, "Error saving edit.", "error")
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
    } else utils.showToast(toastContainer, "No changes.", "info")
  } else {
    console.error("Could not find todo to save:", id)
    utils.showToast(toastContainer, "Error updating task.", "error")
  }
  closeEditModal()
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
  if (appSettingsModal)
    appSettingsModal.classList.remove("modal-temporarily-hidden")
}
async function openAppSettingsModal() {
  applyStateToUI()
  updateShortcutInputVisibility()
  handleUpdateStatusMessage(`Current Version: v${currentAppVersion}`)
  if (wallpaperStoragePathDisplay) {
    wallpaperStoragePathDisplay.textContent = "Fetching path..."
    try {
      const persistentPath =
        await window.electronAPI.getPersistentWallpaperPath()
      wallpaperStoragePathDisplay.textContent =
        persistentPath || "Error: Path not configured"
      wallpaperStoragePathDisplay.title = persistentPath || ""
    } catch (error) {
      console.error("Failed to get persistent wallpaper path:", error)
      wallpaperStoragePathDisplay.textContent = "Error fetching path"
      wallpaperStoragePathDisplay.title = error.message || "IPC Error"
    }
  }
  appSettingsModal.classList.remove("hidden")
}
function closeAppSettingsModal() {
  appSettingsModal.classList.add("hidden")
}
// --- Clear Tasks ---
function handleClearCompleted() {
  const count = state.todos.filter((t) => t.done).length
  if (count === 0) {
    utils.showToast(toastContainer, "No completed tasks.", "info")
    return
  }
  state.todos = state.todos.filter((t) => !t.done)
  renderTodoList()
  saveState()
  utils.showToast(
    toastContainer,
    `${count} task${count > 1 ? "s" : ""} cleared.`,
    "success"
  )
  debouncedGenerateAndApply()
}
function handleClearActive() {
  const count = state.todos.filter((t) => !t.done).length
  if (count === 0) {
    utils.showToast(toastContainer, "No active tasks.", "info")
    return
  }
  if (!window.confirm(`Delete ${count} active task(s)?`)) return
  state.todos = state.todos.filter((t) => t.done)
  renderTodoList()
  saveState()
  utils.showToast(
    toastContainer,
    `${count} task${count > 1 ? "s" : ""} cleared.`,
    "success"
  )
  debouncedGenerateAndApply()
}
// --- Shortcut Recording ---
function handleShortcutKeyDown(event) {
  if (!isRecordingShortcut) return
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
  if (!isRecordingShortcut) return
  const key = event.key
  if (["Control", "Shift", "Alt", "Meta"].includes(key)) {
    pressedKeys.delete(key)
    if (!lastMainKeyPressed)
      updateRecordShortcutDisplay(
        "Press main key...",
        utils.buildAcceleratorStringParts(pressedKeys)
      )
  }
}
function updateRecordShortcutDisplay(message = null, parts = []) {
  shortcutDisplayArea.innerHTML = ""
  if (message) {
    const span = document.createElement("span")
    span.textContent = message
    shortcutDisplayArea.appendChild(span)
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
      )
        keySpan.classList.add("modifier")
      keySpan.textContent = utils.mapKeyForDisplay(part)
      shortcutDisplayArea.appendChild(keySpan)
    })
  } else if (!message)
    shortcutDisplayArea.innerHTML = "<span>Press keys...</span>"
}
function handleSaveShortcut() {
  if (
    !currentRecordedString ||
    !utils.isValidAccelerator(currentRecordedString)
  ) {
    alert("Invalid shortcut. Modifier (Ctrl, Alt, Shift, Cmd) + key required.")
    recordSaveBtn.disabled = true
    updateRecordShortcutDisplay("Press keys...")
    return
  }
  if (currentRecordedString !== state.quickAddShortcut) {
    state.quickAddShortcut = currentRecordedString
    applyStateToUI()
    saveState()
    console.log("Sending updated shortcut:", state.quickAddShortcut)
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
  } else utils.showToast(toastContainer, "Shortcut unchanged.", "info")
  closeRecordShortcutModal()
}
// --- Background Image Handling ---
function updateBackgroundControlsVisibility() {
  const isImage = state.backgroundType === "image"
  settingsInputs.bgColorControls.classList.toggle("hidden", isImage)
  settingsInputs.bgImageControls.classList.toggle("hidden", !isImage)
}
async function handleImageFileSelect(e) {
  const file = e.target.files[0]
  if (!file) return
  if (!file.type.startsWith("image/")) {
    alert("Invalid image type.")
    e.target.value = ""
    return
  }
  if (file.size > 15 * 1024 * 1024) {
    alert("Image too large (Max 15MB).")
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
      console.log("Saving background image...")
      const saveResult = await window.electronAPI.saveBackgroundImage(
        imageDataUrl
      )
      if (!saveResult.success)
        throw new Error(saveResult.error || "Failed to save image.")
      console.log("Background saved.")
      generateTodoImageAndUpdatePreview()
      saveState()
      maybeAutoApplyWallpaper()
    } catch (error) {
      console.error("Error saving image:", error)
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
  const oldImageName = state.backgroundImageName
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
      console.log("Clearing saved image...")
      await window.electronAPI.clearBackgroundImage()
      console.log("Saved image cleared.")
    } catch (error) {
      console.error("Error clearing saved image:", error)
    }
  }
  maybeAutoApplyWallpaper()
}
function handleImageReadError(err) {
  console.error("FileReader error:", err)
  alert("Error reading image file.")
  handleClearImage()
}
// --- Wallpaper Application ---
async function handleApplyWallpaper() {
  if (applyButtonTimeout) {
    clearTimeout(applyButtonTimeout)
    applyButtonTimeout = null
  }
  if (!state.lastGeneratedImageDataUrl) {
    console.warn("Apply: High-quality image needed. Generating first...")
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
        `Image generation failed: ${genErr.message}`,
        "error"
      )
      return
    }
  }
  if (applyWallpaperBtn.disabled) return
  isApplyingWallpaper = true
  applyWallpaperBtn.disabled = true
  applyBtnIconDefault?.classList.add("hidden")
  applyBtnTextDefault?.classList.add("hidden")
  applyBtnTextSuccess?.classList.add("hidden")
  applyBtnTextLoading?.classList.remove("hidden")
  console.log("Applying high-quality wallpaper...")
  try {
    const dataUrl = state.lastGeneratedImageDataUrl
    const result = await window.electronAPI.updateWallpaper(dataUrl)
    if (result?.success) {
      console.log("Wallpaper applied.")
      applyBtnTextLoading?.classList.add("hidden")
      applyBtnTextSuccess?.classList.remove("hidden")
      utils.showToast(toastContainer, "Wallpaper applied!", "success")
      applyButtonTimeout = setTimeout(() => {
        resetApplyButtonState()
        isApplyingWallpaper = false
      }, 2000)
    } else {
      throw new Error(result?.error || "Unknown error")
    }
  } catch (err) {
    console.error("Wallpaper apply failed:", err)
    utils.showToast(toastContainer, `Apply failed: ${err.message}`, "error")
    resetApplyButtonState()
    isApplyingWallpaper = false
  }
}
// --- Apply Button State Reset ---
function resetApplyButtonState() {
  if (applyButtonTimeout) {
    clearTimeout(applyButtonTimeout)
    applyButtonTimeout = null
  }
  if (applyWallpaperBtn) {
    applyBtnTextLoading?.classList.add("hidden")
    applyBtnTextSuccess?.classList.add("hidden")
    applyBtnIconDefault?.classList.remove("hidden")
    applyBtnTextDefault?.classList.remove("hidden")
    applyWallpaperBtn.disabled = false
    console.log("Apply button state reset.")
  }
}
// --- IPC Event Handlers ---
async function handleQuickAddTaskAndApply(taskText) {
  console.log("Quick Add task:", taskText)
  if (addTodo(taskText)) {
    renderTodoList()
    saveState()
    try {
      await generateTodoImageAndUpdatePreview()
      if (state.autoApplyWallpaper && !isApplyingWallpaper) {
        console.log("Applying wallpaper after quick add...")
        await handleApplyWallpaper()
      } else if (state.autoApplyWallpaper && isApplyingWallpaper) {
        console.log(
          "Skipping auto-apply after quick add: apply already in progress."
        )
      } else
        console.log("Auto-apply disabled or apply in progress after quick add.")
    } catch (e) {
      console.error("Error in Quick Add generation/application:", e)
      utils.showToast(toastContainer, "Error applying Quick Add.", "error")
    }
  }
}
function handleShortcutError(errorMessage) {
  console.error("Shortcut Error:", errorMessage)
  alert(
    `Shortcut Error:\n${errorMessage}\n\nPlease choose different keys or close conflicting application.`
  )
  state.runInTray = false
  if (modalRunInTrayCheckbox) modalRunInTrayCheckbox.checked = false
  updateShortcutInputVisibility()
  saveState()
}
function handleForcedSettingUpdate(settingsToUpdate) {
  console.log("Forced setting update:", settingsToUpdate)
  let stateChanged = false
  for (const k in settingsToUpdate) {
    if (state.hasOwnProperty(k) && state[k] !== settingsToUpdate[k]) {
      console.log(`Forcing ${k}: ${state[k]} -> ${settingsToUpdate[k]}`)
      state[k] = settingsToUpdate[k]
      stateChanged = true
      if (k === "runInTray" && modalRunInTrayCheckbox)
        modalRunInTrayCheckbox.checked = state.runInTray
      else if (k === "quickAddShortcut" && modalCurrentShortcutDisplay)
        modalCurrentShortcutDisplay.textContent = utils.formatAccelerator(
          state.quickAddShortcut || DEFAULT_SHORTCUT
        )
      else if (k === "quickAddTranslucent" && modalQuickAddTranslucentCheckbox)
        modalQuickAddTranslucentCheckbox.checked = state.quickAddTranslucent
      else if (k === "autoApplyWallpaper" && modalAutoApplyCheckbox)
        modalAutoApplyCheckbox.checked = state.autoApplyWallpaper
    }
  }
  if (stateChanged) {
    console.log("Applying forced state & saving.")
    applyStateToUI()
    saveState()
  } else console.log("No forced changes needed.")
}
function handleWindowStateChange({ isMaximized }) {
  console.log("Window Maximized:", isMaximized)
  document.body.classList.toggle("maximized", isMaximized)
  if (maximizeRestoreBtn && maximizeIcon && restoreIcon) {
    maximizeRestoreBtn.title = isMaximized ? "Restore" : "Maximize"
    maximizeRestoreBtn.setAttribute(
      "aria-label",
      isMaximized ? "Restore" : "Maximize"
    )
    maximizeIcon.classList.toggle("hidden", isMaximized)
    restoreIcon.classList.toggle("hidden", !isMaximized)
  } else console.warn("Cannot find max/restore elements.")
}
// --- Collapsible Settings Sections ---
function initializeCollapsibleSections() {
  const tBtns = settingsColumn.querySelectorAll(".setting-section-toggle")
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
  const section = button.closest(".setting-section")
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
          if (section.classList.contains("collapsed"))
            content.style.visibility = "hidden"
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
        if (!section.classList.contains("collapsed"))
          content.style.maxHeight = null
      },
      { once: true }
    )
  }
}

// --- Start the application ---
initialize()
