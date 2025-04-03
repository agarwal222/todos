// renderer.js
// Pickr is globally available via script tag in index.html

// --- Constants ---
const DEFAULT_FONT = "Inter"
const DEFAULT_WEIGHT = "400"
const DEFAULT_TEXT_COLOR = "#f3f4f6"
const DEFAULT_BG_COLOR = "#111827"
const DEFAULT_SHORTCUT = "CommandOrControl+Shift+Q"
const DEFAULT_TEXT_BG_COLOR = "rgba(0, 0, 0, 0.5)"
const DEFAULT_TEXT_BORDER_COLOR = "rgba(255, 255, 255, 0.1)"
const DEFAULT_OVERALL_OPACITY = 1.0
const DEFAULT_PANEL_OPACITY = 0.5
const CONTEXT_MAX_LENGTH = 100
const TOAST_DURATION = 3000

// --- DOM Elements ---
const applyWallpaperBtn = document.getElementById("apply-wallpaper-btn")
const toggleSettingsBtn = document.getElementById("toggle-settings-btn")
const settingsIconOpen = document.getElementById("settings-icon-open")
const settingsIconClose = document.getElementById("settings-icon-close")
const todoListUl = document.getElementById("todo-list")
const completedTodoListUl = document.getElementById("completed-todo-list")
const completedHeader = document.querySelector(".completed-header") // Get header div
const completedListContainer = document.querySelector(
  ".completed-list-container"
)
const clearCompletedBtn = document.getElementById("clear-completed-btn") // Get clear button
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
// Add Task Modal elements
const addTodoModal = document.getElementById("add-todo-modal")
const modalCloseBtn = document.getElementById("modal-close-btn")
const modalCancelBtn = document.getElementById("modal-cancel-btn")
const addTodoForm = document.getElementById("add-todo-form")
const modalTodoInput = document.getElementById("modal-todo-input")
// Edit Task Modal elements
const editTodoModal = document.getElementById("edit-todo-modal")
const editModalCloseBtn = document.getElementById("edit-modal-close-btn")
const editModalCancelBtn = document.getElementById("edit-modal-cancel-btn")
const editTodoForm = document.getElementById("edit-todo-form")
const modalEditInput = document.getElementById("modal-edit-input")
const editTodoIdInput = document.getElementById("edit-todo-id") // Hidden input for ID
// Record Shortcut Modal elements
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
let state = {
  /* ... (keep existing state properties) ... */ todos: [],
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
  overallOpacity: DEFAULT_OVERALL_OPACITY,
  textBackgroundEnabled: false,
  textBackgroundColor: DEFAULT_TEXT_BG_COLOR,
  textBackgroundPaddingInline: 15,
  textBackgroundPaddingBlock: 15,
  textBackgroundBorderWidth: 0,
  textBackgroundBorderColor: DEFAULT_TEXT_BORDER_COLOR,
  textPanelOpacity: DEFAULT_PANEL_OPACITY,
  textBackgroundBorderRadius: 5,
  settingsCollapsed: false,
  runInTray: false,
  quickAddShortcut: DEFAULT_SHORTCUT,
  quickAddTranslucent: false,
  lastGeneratedImageDataUrl: null,
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
let textBgColorPickr = null
let textBorderColorPickr = null

// --- Toast Notification Function ---
function showToast(message, type = "info", duration = TOAST_DURATION) {
  if (!toastContainer) {
    console.error("Toast container not found!")
    return
  }
  const t = document.createElement("div")
  t.className = `toast toast--${type}`
  t.setAttribute("role", "status")
  t.setAttribute("aria-live", "polite")
  const s = document.createElement("span")
  s.textContent = message
  t.appendChild(s)
  toastContainer.prepend(t)
  requestAnimationFrame(() => {
    t.classList.add("toast-visible")
  })
  const d = setTimeout(() => {
    t.classList.remove("toast-visible")
    t.classList.add("toast-exiting")
    t.addEventListener(
      "transitionend",
      () => {
        if (t.parentNode === toastContainer) {
          toastContainer.removeChild(t)
        }
      },
      { once: true }
    )
    setTimeout(() => {
      if (t.parentNode === toastContainer) {
        console.warn("Toast fallback removal triggered.")
        toastContainer.removeChild(t)
      }
    }, 500)
  }, duration)
  t.addEventListener(
    "click",
    () => {
      clearTimeout(d)
      t.classList.remove("toast-visible")
      t.classList.add("toast-exiting")
      t.addEventListener(
        "transitionend",
        () => {
          if (t.parentNode === toastContainer) {
            toastContainer.removeChild(t)
          }
        },
        { once: true }
      )
      setTimeout(() => {
        if (t.parentNode === toastContainer) toastContainer.removeChild(t)
      }, 500)
    },
    { once: true }
  )
}

// --- Initialization ---
async function initialize() {
  console.log("Initializing Renderer...")
  const d = window.electronAPI.getScreenDimensions()
  if (d?.width && d?.height) {
    state.screenWidth = d.width
    state.screenHeight = d.height
  } else {
    console.warn("Could not get screen dimensions sync, using defaults.")
  }
  setCanvasAndPreviewSize(state.screenWidth, state.screenHeight)
  loadState()
  await populateSystemFonts()
  setupAutoUpdaterListeners()
  initializeColorPickers()
  applyStateToUI()
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
  let f = Promise.resolve()
  try {
    if (state.fontSource === "google" && state.googleFontName) {
      f = loadAndApplyGoogleFont(state.googleFontName, false)
    } else if (state.fontSource === "system" && state.systemFontFamily) {
      state.activeFontFamily = state.systemFontFamily
      updateFontStatus("loaded", state.activeFontFamily)
    } else {
      state.activeFontFamily = DEFAULT_FONT
      state.fontSource = "default"
      updateFontStatus("idle", DEFAULT_FONT)
    }
  } catch (e) {
    console.warn("Initial font setup/load failed:", e)
    state.activeFontFamily = DEFAULT_FONT
    state.fontSource = "default"
    applyStateToUI()
    updateFontStatus("error", DEFAULT_FONT, "Initial load failed")
  }
  renderTodoList()
  f.catch((e) => console.warn("Font loading rejected:", e)).finally(() => {
    generateTodoImageAndUpdatePreview()
  })
  setupEventListeners() // Ensure this is called
  initializeCollapsibleSections()
  window.electronAPI.onAddTaskAndApply(handleQuickAddTaskAndApply)
  window.electronAPI.onShortcutError(handleShortcutError)
  window.electronAPI.onGetTodosRequest(() => {
    if (window.electronAPI?.sendTodosResponse)
      window.electronAPI.sendTodosResponse(state.todos)
  })
  window.electronAPI.onWindowStateChange(handleWindowStateChange)
  window.electronAPI.onForceSettingUpdate(handleForcedSettingUpdate)
  window.electronAPI.onPerformTaskToggle((t) => {
    console.log(`Renderer received toggle request for task ID: ${t}`)
    toggleDone(t)
    renderTodoList()
    saveState()
    generateTodoImageAndUpdatePreview()
      .then(() => handleApplyWallpaper())
      .catch((e) => {
        console.error("Error applying wallpaper after toggle:", e)
        showToast("Error applying wallpaper.", "error")
      })
  })
  window.electronAPI.onPerformTaskDelete((t) => {
    console.log(`Renderer received delete request for task ID: ${t}`)
    deleteTodo(t)
    renderTodoList()
    saveState()
    generateTodoImageAndUpdatePreview()
      .then(() => handleApplyWallpaper())
      .catch((e) => {
        console.error("Error applying wallpaper after delete:", e)
        showToast("Error applying wallpaper.", "error")
      })
  })
  const p = window.electronAPI.getPlatform()
  document.body.dataset.platform = p
  console.log("Renderer initialized on platform:", p)
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
  const o = (e, d, s) => ({
    el: settingsInputs[e],
    theme: "nano",
    defaultRepresentation: "HEXA",
    default: state[s] || d,
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
  const s = (p, h) => (c, i) => {
    const n = c.toHEXA().toString()
    if (state[p] !== n) {
      state[p] = n
      settingsInputs[h].value = n
      settingsInputs[h].classList.remove("invalid")
      generateTodoImageAndUpdatePreview()
      saveState()
    }
    i.hide()
  }
  const c = (h) => (c, s, i) => {
    settingsInputs[h].value = c.toHEXA().toString()
    settingsInputs[h].classList.remove("invalid")
  }
  const sh = (h) => (c, i) => {
    settingsInputs[h].value = i.getColor().toHEXA().toString()
    settingsInputs[h].classList.remove("invalid")
  }
  textColorPickr = Pickr.create(
    o("textColorPickerEl", DEFAULT_TEXT_COLOR, "textColor")
  )
    .on("save", s("textColor", "textColorHex"))
    .on("change", c("textColorHex"))
    .on("show", sh("textColorHex"))
  bgColorPickr = Pickr.create(o("bgColorPickerEl", DEFAULT_BG_COLOR, "bgColor"))
    .on("save", s("bgColor", "bgColorHex"))
    .on("change", c("bgColorHex"))
    .on("show", sh("bgColorHex"))
  textBgColorPickr = Pickr.create(
    o("textBgColorPickerEl", DEFAULT_TEXT_BG_COLOR, "textBackgroundColor")
  )
    .on("save", s("textBackgroundColor", "textBgColorHex"))
    .on("change", c("textBgColorHex"))
    .on("show", sh("textBgColorHex"))
  textBorderColorPickr = Pickr.create(
    o(
      "textBorderColorPickerEl",
      DEFAULT_TEXT_BORDER_COLOR,
      "textBackgroundBorderColor"
    )
  )
    .on("save", s("textBackgroundBorderColor", "textBorderColorHex"))
    .on("change", c("textBorderColorHex"))
    .on("show", sh("textBorderColorHex"))
}

// --- Helper functions ---
function updateShortcutInputVisibility() {
  const i = state.runInTray
  if (settingsInputs.shortcutDisplayGroup) {
    settingsInputs.shortcutDisplayGroup.classList.toggle("hidden", !i)
  }
  const t = settingsInputs.quickAddTranslucentCheckbox?.closest(".input-group")
  if (t) {
    t.classList.toggle("hidden", !i)
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
  settingsInputs.textBackgroundEnable.checked = state.textBackgroundEnabled
  settingsInputs.textPanelOpacity.value = state.textPanelOpacity
  settingsInputs.textBgPaddingInline.value = state.textBackgroundPaddingInline
  settingsInputs.textBgPaddingBlock.value = state.textBackgroundPaddingBlock
  settingsInputs.textBgBorderRadius.value = state.textBackgroundBorderRadius
  settingsInputs.textBgBorderWidth.value = state.textBackgroundBorderWidth
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
  if (state.fontSource === "system" && state.systemFontFamily) {
    settingsInputs.systemFontSelect.value = state.systemFontFamily
  } else {
    settingsInputs.systemFontSelect.value = ""
  }
  if (settingsInputs.runInTrayCheckbox)
    settingsInputs.runInTrayCheckbox.checked = state.runInTray
  if (settingsInputs.quickAddTranslucentCheckbox)
    settingsInputs.quickAddTranslucentCheckbox.checked =
      state.quickAddTranslucent
  if (settingsInputs.currentShortcutDisplay)
    settingsInputs.currentShortcutDisplay.textContent = formatAccelerator(
      state.quickAddShortcut || DEFAULT_SHORTCUT
    )
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
    const s = {
      todos: state.todos.map((t) => ({
        id: t.id,
        text: t.text,
        context: t.context || "",
        done: t.done,
      })),
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
      overallOpacity: state.overallOpacity,
      textPosition: state.textPosition,
      fontSize: state.fontSize,
      textAlign: state.textAlign,
      offsetX: state.offsetX,
      offsetY: state.offsetY,
      titleBottomMargin: state.titleBottomMargin,
      itemSpacing: state.itemSpacing,
      maxItemsPerColumn: state.maxItemsPerColumn,
      columnGap: state.columnGap,
      textBackgroundEnabled: state.textBackgroundEnabled,
      textBackgroundColor: state.textBackgroundColor,
      textBackgroundPaddingInline: state.textBackgroundPaddingInline,
      textBackgroundPaddingBlock: state.textBackgroundPaddingBlock,
      textBackgroundBorderWidth: state.textBackgroundBorderWidth,
      textBackgroundBorderColor: state.textBackgroundBorderColor,
      textPanelOpacity: state.textPanelOpacity,
      textBackgroundBorderRadius: state.textBackgroundBorderRadius,
      settingsCollapsed: state.settingsCollapsed,
      runInTray: state.runInTray,
      quickAddShortcut: state.quickAddShortcut,
      quickAddTranslucent: state.quickAddTranslucent,
    }
    localStorage.setItem("visidoState", JSON.stringify(s))
  } catch (e) {
    console.error("Save State Error:", e)
  }
}
function loadState() {
  try {
    const s = localStorage.getItem("visidoState")
    const p = window.electronAPI?.getPlatform() || "win32"
    const pd = p === "darwin"
    if (s) {
      const ps = JSON.parse(s)
      const cs = {
        screenWidth: state.screenWidth,
        screenHeight: state.screenHeight,
      }
      const d = {
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
        quickAddTranslucent: pd,
        overallOpacity: DEFAULT_OVERALL_OPACITY,
        textBackgroundEnabled: false,
        textBackgroundColor: DEFAULT_TEXT_BG_COLOR,
        textBackgroundPaddingInline: 15,
        textBackgroundPaddingBlock: 15,
        textBackgroundBorderWidth: 0,
        textBackgroundBorderColor: DEFAULT_TEXT_BORDER_COLOR,
        textPanelOpacity: DEFAULT_PANEL_OPACITY,
        textBackgroundBorderRadius: 5,
      }
      state = {
        ...state,
        ...d,
        ...ps,
        ...cs,
        todos: Array.isArray(ps.todos)
          ? ps.todos.map((t) => ({ ...t, context: t.context || "" }))
          : [],
        settingsCollapsed:
          typeof ps.settingsCollapsed === "boolean"
            ? ps.settingsCollapsed
            : d.settingsCollapsed,
        runInTray:
          typeof ps.runInTray === "boolean" ? ps.runInTray : d.runInTray,
        quickAddTranslucent:
          typeof ps.quickAddTranslucent === "boolean"
            ? ps.quickAddTranslucent
            : pd,
        fontSize: typeof ps.fontSize === "number" ? ps.fontSize : 48,
        fontWeight:
          typeof ps.fontWeight === "string" &&
          ["300", "400", "500", "600", "700"].includes(ps.fontWeight)
            ? ps.fontWeight
            : d.fontWeight,
        offsetX: typeof ps.offsetX === "number" ? ps.offsetX : 0,
        offsetY: typeof ps.offsetY === "number" ? ps.offsetY : 0,
        titleBottomMargin:
          typeof ps.titleBottomMargin === "number"
            ? ps.titleBottomMargin
            : d.titleBottomMargin,
        itemSpacing:
          typeof ps.itemSpacing === "number" ? ps.itemSpacing : d.itemSpacing,
        maxItemsPerColumn:
          typeof ps.maxItemsPerColumn === "number" && ps.maxItemsPerColumn >= 1
            ? ps.maxItemsPerColumn
            : d.maxItemsPerColumn,
        columnGap:
          typeof ps.columnGap === "number" ? ps.columnGap : d.columnGap,
        quickAddShortcut: ps.quickAddShortcut || d.quickAddShortcut,
        overallOpacity:
          typeof ps.overallOpacity === "number"
            ? ps.overallOpacity
            : d.overallOpacity,
        textBackgroundEnabled:
          typeof ps.textBackgroundEnabled === "boolean"
            ? ps.textBackgroundEnabled
            : d.textBackgroundEnabled,
        textBackgroundColor: ps.textBackgroundColor || d.textBackgroundColor,
        textBackgroundPaddingInline:
          typeof ps.textBackgroundPaddingInline === "number"
            ? ps.textBackgroundPaddingInline
            : d.textBackgroundPaddingInline,
        textBackgroundPaddingBlock:
          typeof ps.textBackgroundPaddingBlock === "number"
            ? ps.textBackgroundPaddingBlock
            : d.textBackgroundPaddingBlock,
        textBackgroundBorderWidth:
          typeof ps.textBackgroundBorderWidth === "number"
            ? ps.textBackgroundBorderWidth
            : d.textBackgroundBorderWidth,
        textBackgroundBorderColor:
          ps.textBackgroundBorderColor || d.textBackgroundBorderColor,
        textPanelOpacity:
          typeof ps.textPanelOpacity === "number"
            ? ps.textPanelOpacity
            : d.textPanelOpacity,
        textBackgroundBorderRadius:
          typeof ps.textBackgroundBorderRadius === "number"
            ? ps.textBackgroundBorderRadius
            : d.textBackgroundBorderRadius,
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
        overallOpacity: DEFAULT_OVERALL_OPACITY,
        textBackgroundEnabled: false,
        textBackgroundColor: DEFAULT_TEXT_BG_COLOR,
        textBackgroundPaddingInline: 15,
        textBackgroundPaddingBlock: 15,
        textBackgroundBorderWidth: 0,
        textBackgroundBorderColor: DEFAULT_TEXT_BORDER_COLOR,
        textPanelOpacity: DEFAULT_PANEL_OPACITY,
        textBackgroundBorderRadius: 5,
        lastGeneratedImageDataUrl: null,
        settingsCollapsed: false,
        runInTray: false,
        quickAddShortcut: DEFAULT_SHORTCUT,
        quickAddTranslucent: pd,
      }
      console.log("No saved state found, using defaults.")
    }
  } catch (e) {
    console.error("Load State Error:", e)
    const p = window.electronAPI?.getPlatform() || "win32"
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
      quickAddTranslucent: p === "darwin",
      overallOpacity: DEFAULT_OVERALL_OPACITY,
      textBackgroundEnabled: false,
      textBackgroundColor: DEFAULT_TEXT_BG_COLOR,
      textBackgroundPaddingInline: 15,
      textBackgroundPaddingBlock: 15,
      textBackgroundBorderWidth: 0,
      textBackgroundBorderColor: DEFAULT_TEXT_BORDER_COLOR,
      textPanelOpacity: DEFAULT_PANEL_OPACITY,
      textBackgroundBorderRadius: 5,
    }
  }
}

// --- Event Handlers & Helpers ---
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
function isValidHexColor(hex) {
  if (!hex) return false
  const r = /^#([0-9A-F]{3,4}|[0-9A-F]{6}|[0-9A-F]{8})$/i
  return r.test(hex)
}
function handleHexInputChange(event) {
  const i = event.target
  const v = i.value.trim()
  let p = null
  let sp = null
  if (i.id === "text-color-hex") {
    p = textColorPickr
    sp = "textColor"
  } else if (i.id === "bg-color-hex") {
    p = bgColorPickr
    sp = "bgColor"
  } else if (i.id === "text-bg-color-hex") {
    p = textBgColorPickr
    sp = "textBackgroundColor"
  } else if (i.id === "text-border-color-hex") {
    p = textBorderColorPickr
    sp = "textBackgroundBorderColor"
  }
  if (isValidHexColor(v)) {
    i.classList.remove("invalid")
    if (p) {
      p.setColor(v, true)
    }
    if (state[sp] !== v) {
      state[sp] = v
      generateTodoImageAndUpdatePreview()
      saveState()
    }
  } else {
    i.classList.add("invalid")
  }
}
function handleSettingChange(event) {
  const t = event.target
  let sc = false,
    rg = true,
    rs = true,
    ni = false
  const id = t.id
  let v = t.type === "checkbox" ? t.checked : t.value
  const k = t.name || id
  if (id.endsWith("-hex") || id.endsWith("-picker") || !k) return
  if (k === "font-source") {
    v = t.value
    if (t.checked && state.fontSource !== v) {
      state.fontSource = v
      sc = true
      rs = true
      if (v === "default") {
        state.activeFontFamily = DEFAULT_FONT
        updateFontStatus("idle", DEFAULT_FONT)
        state.systemFontFamily = ""
        state.googleFontName = ""
      } else if (v === "system") {
        const sf = settingsInputs.systemFontSelect.value
        if (sf) {
          state.activeFontFamily = sf
          state.systemFontFamily = sf
          updateFontStatus("loaded", sf)
        } else {
          state.activeFontFamily = DEFAULT_FONT
          state.systemFontFamily = ""
          updateFontStatus("idle", DEFAULT_FONT)
          rg = false
        }
        state.googleFontName = ""
      } else if (v === "google") {
        state.systemFontFamily = ""
        rg = false
        if (state.googleFontName && state.customFontStatus === "loaded") {
          updateFontStatus("loaded", state.activeFontFamily)
        } else {
          updateFontStatus("idle", state.googleFontName || DEFAULT_FONT)
          state.customFontStatus = "idle"
        }
      }
    } else if (!t.checked) {
      sc = false
      rg = false
      rs = false
    }
    updateFontControlsVisibility()
  } else if (k === "bg-type") {
    v = t.value
    if (t.checked && state.backgroundType !== v) {
      state.backgroundType = v
      sc = true
      rs = true
    } else if (!t.checked) {
      sc = false
      rg = false
      rs = false
    }
    updateBackgroundControlsVisibility()
  } else {
    let hp = false
    let pn = id
    const m = {
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
    pn = m[id] || id
    if (state.hasOwnProperty(pn)) {
      const ov = state[pn]
      let nv = v
      if (t.type === "number") {
        nv = parseFloat(v) || 0
        if (t.min !== "" && nv < parseFloat(t.min)) nv = parseFloat(t.min)
        if (t.max !== "" && nv > parseFloat(t.max)) nv = parseFloat(t.max)
        const s = t.getAttribute("step")
        if (!s || s === "1") {
          nv = Math.round(nv)
        }
      } else if (t.type === "checkbox") {
        nv = t.checked
      }
      if (ov !== nv) {
        state[pn] = nv
        hp = true
        sc = true
        rs = true
        if (pn === "runInTray") {
          ni = true
          updateShortcutInputVisibility()
        }
        if (pn === "quickAddTranslucent") {
          ni = true
        }
        if (pn === "textBackgroundEnabled") {
          updateTextBackgroundControlsVisibility()
        }
        const np = [
          "systemFontFamily",
          "googleFontName",
          "runInTray",
          "quickAddTranslucent",
        ]
        if (np.includes(pn)) {
          rg = false
          if (pn === "systemFontFamily" && state.fontSource === "system") {
            if (v) {
              state.activeFontFamily = v
              updateFontStatus("loaded", v)
              rg = true
            } else {
              state.activeFontFamily = DEFAULT_FONT
              updateFontStatus("idle", DEFAULT_FONT)
            }
          } else if (pn === "googleFontName") {
            if (
              state.customFontStatus === "loaded" ||
              state.customFontStatus === "error"
            ) {
              updateFontStatus("idle", state.activeFontFamily)
              state.customFontStatus = "idle"
            }
          }
        } else {
          rg = true
        }
      } else {
        sc = false
        rg = false
        rs = false
        ni = false
      }
    } else {
      console.warn(
        `State property not found for element ID: ${id} (mapped to: ${pn})`
      )
      sc = false
      rg = false
      rs = false
    }
  }
  if (sc) {
    if (rg) {
      generateTodoImageAndUpdatePreview()
    }
    if (rs) {
      saveState()
    }
    if (ni) {
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
  const i = [
    ...settingsColumn.querySelectorAll(
      'input[type="text"], input[type="number"], input[type="checkbox"], select, input[type="radio"]'
    ),
  ]
  i.forEach((n) => {
    if (!n.id.endsWith("-hex")) {
      const e =
        n.tagName === "SELECT" || n.type === "radio" || n.type === "checkbox"
          ? "change"
          : "input"
      n.addEventListener(e, handleSettingChange)
    }
  })
  settingsInputs.textColorHex.addEventListener("input", handleHexInputChange)
  settingsInputs.bgColorHex.addEventListener("input", handleHexInputChange)
  settingsInputs.textBgColorHex.addEventListener("input", handleHexInputChange)
  settingsInputs.textBorderColorHex.addEventListener(
    "input",
    handleHexInputChange
  )
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
  const tc = document.querySelector(".column-todos")
  if (tc) tc.addEventListener("click", handleListClick) // Handles delete, toggle, AND edit clicks now
  openAddTodoModalBtn.addEventListener("click", openModal) // Add Task modal
  modalCloseBtn.addEventListener("click", closeModal)
  modalCancelBtn.addEventListener("click", closeModal)
  addTodoForm.addEventListener("submit", handleModalSubmit)
  addTodoModal.addEventListener("click", (e) => {
    if (e.target === addTodoModal) closeModal()
  })
  // Edit Task Modal Listeners
  editModalCloseBtn.addEventListener("click", closeEditModal)
  editModalCancelBtn.addEventListener("click", closeEditModal)
  editTodoForm.addEventListener("submit", handleEditModalSubmit)
  editTodoModal.addEventListener("click", (e) => {
    if (e.target === editTodoModal) closeEditModal()
  })
  // Record Shortcut Modal Listeners
  recordModalCloseBtn.addEventListener("click", closeRecordShortcutModal)
  recordCancelBtn.addEventListener("click", closeRecordShortcutModal)
  recordSaveBtn.addEventListener("click", handleSaveShortcut)
  recordShortcutModal.addEventListener("click", (e) => {
    if (e.target === recordShortcutModal) closeRecordShortcutModal()
  })
  // Clear Completed Listener
  if (clearCompletedBtn)
    clearCompletedBtn.addEventListener("click", handleClearCompleted)
  // Global Key Listener
  document.addEventListener("keydown", handleGlobalKeyDown)
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
function renderTodoList() {
  // UPDATED to manage "Clear Completed" button state
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
  // UPDATED to include Edit button
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
  ci.maxLength = CONTEXT_MAX_LENGTH
  d.appendChild(s)
  d.appendChild(ci)
  // Action Buttons Container
  const ab = document.createElement("div")
  ab.className = "task-actions"
  // Edit Button
  const eb = document.createElement("button")
  eb.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" width="14" height="14"><path d="M13.488 2.513a1.75 1.75 0 0 0-2.475 0L3.763 9.763a1.75 1.75 0 0 0-.44 1.06l-.663 3.18a.75.75 0 0 0 .914.914l3.18-.662a1.75 1.75 0 0 0 1.06-.44l7.25-7.25a1.75 1.75 0 0 0 0-2.475ZM4.753 10.61l6.875-6.875 1.118 1.118-6.875 6.875-1.528.318.41-1.964.001-.002Z"></path></svg>` // Adjusted size
  eb.className = "button button-ghost button-icon edit-btn"
  eb.title = "Edit Task"
  eb.setAttribute("aria-label", "Edit task")
  // Delete Button
  const db = document.createElement("button")
  db.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" width="14" height="14"><path fill-rule="evenodd" d="M5 3.25V4H2.75a.75.75 0 0 0 0 1.5h.3l.815 8.15A1.5 1.5 0 0 0 5.357 15h5.285a1.5 1.5 0 0 0 1.493-1.35l.815-8.15h.3a.75.75 0 0 0 0-1.5H11v-.75A2.25 2.25 0 0 0 8.75 1h-1.5A2.25 2.25 0 0 0 5 3.25Zm2.25-.75a.75.75 0 0 0-.75.75V4h3v-.75a.75.75 0 0 0-.75-.75h-1.5ZM6.05 6a.75.75 0 0 1 .787.713l.275 5.5a.75.75 0 0 1-1.498.075l-.275-5.5A.75.75 0 0 1 6.05 6Zm3.9 0a.75.75 0 0 1 .712.787l-.275 5.5a.75.75 0 0 1-1.498-.075l.275-5.5a.75.75 0 0 1 .786-.711Z" clip-rule="evenodd" /></svg>` // Adjusted size
  db.className = "button button-ghost button-icon delete-btn"
  db.title = "Delete Task"
  db.setAttribute("aria-label", "Delete task")
  // Add buttons to container
  ab.appendChild(eb)
  ab.appendChild(db)
  // Add elements to li
  li.appendChild(cb)
  li.appendChild(d)
  li.appendChild(ab) // Add the action button container
  return li
}
function handleContextChange(event) {
  const i = event.target
  if (!i.classList.contains("context-input")) return
  const id = parseInt(i.dataset.id, 10)
  const t = state.todos.find((t) => t.id === id)
  if (t) {
    let nc = i.value
    if (nc.length > CONTEXT_MAX_LENGTH) {
      nc = nc.substring(0, CONTEXT_MAX_LENGTH)
      i.value = nc
    }
    if (t.context !== nc) {
      t.context = nc
      console.log(`Context updated for ID ${id}: "${nc}"`)
      saveState()
      generateTodoImageAndUpdatePreview()
    }
  }
}
function addContextInputListeners() {
  todoListUl.removeEventListener("input", handleContextChange)
  todoListUl.addEventListener("input", handleContextChange)
  completedTodoListUl.removeEventListener("input", handleContextChange) // Add for completed list too
  completedTodoListUl.addEventListener("input", handleContextChange)
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
  if (canvas.width !== screenWidth || canvas.height !== screenHeight)
    setCanvasAndPreviewSize(screenWidth, screenHeight)
  const cf = activeFontFamily || DEFAULT_FONT
  const ifs = parseInt(fontSize, 10) || 48
  const ld = todos
    .filter((t) => !t.done)
    .map((t) => ({ text: t.text, context: t.context || "", done: false }))
  const p = Math.max(60, ifs * 1.5)
  const ts = parseInt(titleBottomMargin, 10) || 40
  const si = parseInt(itemSpacing, 10) || 20
  const mi = Math.max(1, parseInt(maxItemsPerColumn, 10) || 10)
  const cg = Math.max(0, parseInt(columnGap, 10) || 50)
  const tfs = Math.round(ifs * 1.2)
  const cfs = Math.round(ifs * 0.6)
  const ctm = Math.round(si * 0.3)
  previewContainer.classList.remove("loaded")
  try {
    ctx.clearRect(0, 0, screenWidth, screenHeight)
    if (backgroundType === "image" && backgroundImageDataUrl) {
      try {
        const i = await loadImage(backgroundImageDataUrl)
        drawBackgroundImage(ctx, i, screenWidth, screenHeight)
      } catch (e) {
        console.error("BG Image Error:", e)
        drawBackgroundColor(ctx, bgColor, screenWidth, screenHeight)
      }
    } else {
      drawBackgroundColor(ctx, bgColor, screenWidth, screenHeight)
    }
    const m = calculateTextBlockDimensions(ctx, {
      title,
      fontName: cf,
      fontWeight,
      titleFontSize: tfs,
      itemFontSize: ifs,
      contextFontSize: cfs,
      contextTopMargin: ctm,
      titleSpacing: ts,
      itemSpacing: si,
      lines: ld,
      maxItemsPerColumn: mi,
      columnGap: cg,
      listStyle,
    })
    const { startX: tx, startY: ty } = calculateTextStartPositionMultiCol(
      screenWidth,
      screenHeight,
      p,
      m.titleHeight,
      m.maxColumnItemHeight,
      ts,
      si,
      mi,
      ld.length,
      textPosition,
      offsetX,
      offsetY,
      m
    )
    const oa = ctx.globalAlpha
    ctx.globalAlpha = Math.max(0, Math.min(1, overallOpacity))
    if (textBackgroundEnabled) {
      drawTextBackgroundPanel(ctx, {
        x: tx,
        y: ty,
        width: m.overallWidth,
        height: m.overallHeight,
        paddingInline: state.textBackgroundPaddingInline,
        paddingBlock: state.textBackgroundPaddingBlock,
        bgColor: state.textBackgroundColor,
        opacity: state.textPanelOpacity,
        borderColor: state.textBackgroundBorderColor,
        borderWidth: state.textBackgroundBorderWidth,
        borderRadius: state.textBackgroundBorderRadius,
        textAlign: state.textAlign,
      })
    }
    drawTextElementsMultiCol(ctx, {
      title,
      textColor,
      textAlign,
      fontName: cf,
      fontWeight,
      titleFontSize: tfs,
      itemFontSize: ifs,
      contextFontSize: cfs,
      contextTopMargin: ctm,
      titleSpacing: ts,
      itemSpacing: si,
      lines: ld,
      startX: tx,
      startY: ty,
      listStyle,
      maxItemsPerColumn: mi,
      columnGap: cg,
    })
    ctx.globalAlpha = oa
    updatePreviewImage()
  } catch (e) {
    console.error("Error during image generation process:", e)
    updatePreviewImage()
    throw e
  }
}
function loadImage(src) {
  return new Promise((r, j) => {
    const i = new Image()
    i.onload = () => r(i)
    i.onerror = (e) => j(new Error(`Image load error: ${e?.message || e}`))
    i.src = src
  })
}
function drawBackgroundColor(ctx, color, w, h) {
  ctx.fillStyle = color
  ctx.fillRect(0, 0, w, h)
}
function drawBackgroundImage(ctx, img, cw, ch) {
  const ia = img.width / img.height
  const ca = cw / ch
  let dw, dh, dx, dy
  if (ia >= ca) {
    dh = ch
    dw = dh * ia
    dx = (cw - dw) / 2
    dy = 0
  } else {
    dw = cw
    dh = dw / ia
    dx = 0
    dy = (ch - dh) / 2
  }
  ctx.drawImage(img, dx, dy, dw, dh)
}
function calculateTextBlockDimensions(ctx, p) {
  const {
    title: t,
    fontName: fn,
    fontWeight: fw,
    titleFontSize: tfs,
    itemFontSize: ifs,
    contextFontSize: cfs,
    contextTopMargin: ctm,
    titleSpacing: ts,
    itemSpacing: is,
    lines: l,
    maxItemsPerColumn: mic,
    columnGap: cg,
    listStyle: ls,
  } = p
  let ow = 0
  let oh = 0
  let mcw = 0
  let mch = 0
  let cic = 0
  let ccw = 0
  let nc = 1
  const tw = Math.max(parseInt(fw, 10) || 400, 600)
  const tfont = `${tw} ${tfs}px "${fn}", ${DEFAULT_FONT}`
  ctx.font = tfont
  const tiw = t ? ctx.measureText(t).width : 0
  const th = t ? tfs : 0
  mcw = Math.max(mcw, tiw)
  oh = t ? th + (l.length > 0 ? ts : 0) : 0
  const iw = parseInt(fw, 10) || 400
  const ifont = `${iw} ${ifs}px "${fn}", ${DEFAULT_FONT}`
  const ctwt = 300
  const ctfont = `${ctwt} ${cfs}px "${fn}", ${DEFAULT_FONT}`
  if (l.length > 0) {
    l.forEach((i, idx) => {
      cic++
      ctx.font = ifont
      const p = ls === "dash" ? "- " : ls === "number" ? `${idx + 1}. ` : "• "
      const it = `${p}${i.text}`
      const itw = ctx.measureText(it).width
      let ctxw = 0
      let ith = ifs
      if (i.context) {
        ctx.font = ctfont
        ctxw = ctx.measureText(i.context).width
        ith += ctm + cfs
      }
      ccw = Math.max(ccw, itw, ctxw)
      if (cic >= mic && idx < l.length - 1) {
        mcw = Math.max(mcw, ccw)
        const cch =
          cic * ifs +
          l
            .slice(idx - cic + 1, idx + 1)
            .reduce((s, it) => s + (it.context ? ctm + cfs : 0), 0) +
          Math.max(0, cic - 1) * is
        mch = Math.max(mch, cch)
        nc++
        ccw = 0
        cic = 0
      }
    })
    mcw = Math.max(mcw, ccw)
    const lch =
      cic * ifs +
      l
        .slice(l.length - cic)
        .reduce((s, it) => s + (it.context ? ctm + cfs : 0), 0) +
      Math.max(0, cic - 1) * is
    mch = Math.max(mch, lch)
    oh += mch
    ow = nc * mcw + Math.max(0, nc - 1) * cg
  } else {
    ow = tiw
  }
  return {
    overallWidth: ow,
    overallHeight: oh,
    titleHeight: th,
    maxColumnItemHeight: mch,
    numColumns: nc,
    maxColumnWidth: mcw,
  }
}
function calculateTextStartPositionMultiCol(
  cw,
  ch,
  p,
  titleH,
  colItemH,
  titleSpacing,
  itemSpacing,
  maxItems,
  lineCount,
  pos,
  ox,
  oy,
  metrics
) {
  let sx, sy
  const rh = metrics.overallHeight
  const rw = metrics.overallWidth
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
      sy = Math.max(p, ch / 2 - rh / 2)
      break
    case "center":
      sx = cw / 2
      sy = Math.max(p, ch / 2 - rh / 2)
      break
    case "bottom-left":
      sx = p
      sy = ch - p - rh
      break
    case "bottom-center":
      sx = cw / 2
      sy = ch - p - rh
      break
    case "bottom-right":
      sx = cw - p
      sy = ch - p - rh
      break
    default:
      sx = p
      sy = p
      break
  }
  sy = Math.max(p, sy)
  if (sy + rh > ch - p) sy = ch - p - rh
  sy = Math.max(p, sy)
  return { startX: sx + ox, startY: sy + oy }
}
function drawTextBackgroundPanel(ctx, opts) {
  const {
    x,
    y,
    width: w,
    height: h,
    paddingInline: pi,
    paddingBlock: pb,
    bgColor: bg,
    opacity: op,
    borderColor: bc,
    borderWidth: bw,
    borderRadius: br,
    textAlign: ta,
  } = opts
  const px = Math.max(0, pi)
  const py = Math.max(0, pb)
  let pX = x - px
  if (ta === "center") {
    pX = x - w / 2 - px
  } else if (ta === "right") {
    pX = x - w - px
  }
  const pY = y - py
  const pW = w + 2 * px
  const pH = h + 2 * py
  const oa = ctx.globalAlpha
  ctx.globalAlpha = oa * Math.max(0, Math.min(1, op))
  ctx.fillStyle = bg
  if (br > 0 && ctx.roundRect) {
    ctx.beginPath()
    ctx.roundRect(pX, pY, pW, pH, br)
    ctx.fill()
  } else {
    ctx.fillRect(pX, pY, pW, pH)
  }
  if (bw > 0) {
    ctx.strokeStyle = bc
    ctx.lineWidth = bw
    if (br > 0 && ctx.roundRect) {
      ctx.beginPath()
      ctx.roundRect(pX, pY, pW, pH, br)
      ctx.stroke()
    } else {
      ctx.strokeRect(pX, pY, pW, pH)
    }
  }
  ctx.globalAlpha = oa
}
function drawTextElementsMultiCol(ctx, p) {
  const {
    title: t,
    textColor: tc,
    textAlign: ta,
    fontName: fn,
    fontWeight: fw,
    titleFontSize: tfs,
    itemFontSize: ifs,
    contextFontSize: cfs,
    contextTopMargin: ctm,
    titleSpacing: ts,
    itemSpacing: is,
    lines: l,
    startX: sx,
    startY: sy,
    listStyle: ls,
    maxItemsPerColumn: mic,
    columnGap: cg,
  } = p
  ctx.textAlign = ta
  ctx.textBaseline = "top"
  ctx.shadowColor = "rgba(0,0,0,0.4)"
  ctx.shadowBlur = 6
  ctx.shadowOffsetX = 1
  ctx.shadowOffsetY = 2
  let cX = sx
  let cY = sy
  let cw = 0
  ctx.fillStyle = tc
  const tw = Math.max(parseInt(fw, 10) || 400, 600)
  const tf = `${tw} ${tfs}px "${fn}", ${DEFAULT_FONT}`
  const dtf = `${tw} ${tfs}px ${DEFAULT_FONT}`
  let tiw = 0
  if (t) {
    try {
      ctx.font = tf
      tiw = ctx.measureText(t).width
      ctx.fillText(t, cX, cY)
    } catch (e) {
      console.warn(`Failed to draw title with font ${fn}. Falling back.`, e)
      ctx.font = dtf
      tiw = ctx.measureText(t).width
      ctx.fillText(t, cX, cY)
    }
    cw = Math.max(cw, tiw)
    cY += tfs + ts
  }
  let iy = cY
  let csx = cX
  const iw = parseInt(fw, 10) || 400
  const itf = `${iw} ${ifs}px "${fn}", ${DEFAULT_FONT}`
  const ditf = `${iw} ${ifs}px ${DEFAULT_FONT}`
  const cwt = 300
  const ctf = `${cwt} ${cfs}px "${fn}", ${DEFAULT_FONT}`
  const dctf = `${cwt} ${cfs}px ${DEFAULT_FONT}`
  let cic = 0
  let mcw = 0
  l.forEach((i, idx) => {
    if (idx > 0 && cic >= mic) {
      csx += mcw + cg
      cY = iy
      cic = 0
      mcw = 0
    }
    cic++
    let p
    switch (ls) {
      case "dash":
        p = "- "
        break
      case "number":
        p = `${idx + 1}. `
        break
      default:
        p = "• "
        break
    }
    const itxt = `${p}${i.text}`
    ctx.fillStyle = tc
    let iw = 0
    try {
      ctx.font = itf
      iw = ctx.measureText(itxt).width
      ctx.fillText(itxt, csx, cY)
    } catch (e) {
      console.warn(`Failed to draw item with font ${fn}. Falling back.`, e)
      ctx.font = ditf
      iw = ctx.measureText(itxt).width
      ctx.fillText(itxt, csx, cY)
    }
    let cih = ifs
    let ctw = 0
    if (i.context) {
      ctx.fillStyle = tc
      ctx.globalAlpha *= 0.8
      let cty = cY + ifs + ctm
      try {
        ctx.font = ctf
        ctw = ctx.measureText(i.context).width
        ctx.fillText(i.context, csx + ifs * 0.75, cty)
      } catch (e) {
        console.warn(`Failed to draw context with font ${fn}. Falling back.`, e)
        ctx.font = dctf
        ctw = ctx.measureText(i.context).width
        ctx.fillText(i.context, csx + ifs * 0.75, cty)
      }
      cih += ctm + cfs
      ctx.globalAlpha /= 0.8
    }
    mcw = Math.max(mcw, iw, ctw)
    cY += cih + is
  })
  ctx.shadowColor = "transparent"
  ctx.shadowBlur = 0
  ctx.shadowOffsetX = 0
  ctx.shadowOffsetY = 0
}
function updatePreviewImage() {
  try {
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
async function handleLoadFontClick() {
  const n = settingsInputs.googleFontName.value.trim()
  if (!n) {
    updateFontStatus("error", state.activeFontFamily, "Enter Google Font name")
    showToast("Please enter a Google Font name.", "error")
    return
  }
  await loadAndApplyGoogleFont(n, true)
}
async function loadAndApplyGoogleFont(fontName, shouldSaveState = true) {
  updateFontStatus("loading", state.activeFontFamily)
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
      showToast(`Font "${af}" loaded!`, "success")
      generateTodoImageAndUpdatePreview()
      if (shouldSaveState) saveState()
    } else {
      throw new Error(r.error || "Failed details")
    }
  } catch (e) {
    console.error("Google Font Load Error:", e)
    state.customFontStatus = "error"
    state.customFontError = e.message
    updateFontStatus("error", state.activeFontFamily, e.message)
    showToast(`Error loading font: ${e.message}`, "error")
  }
}
function updateFontControlsVisibility() {
  const s = state.fontSource
  settingsInputs.systemFontControls.classList.toggle("hidden", s !== "system")
  settingsInputs.googleFontControls.classList.toggle("hidden", s !== "google")
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
  // UPDATED to handle Edit button
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
    // Check for closest edit button
    openEditModal(id)
  } else if (target.closest(".delete-btn")) {
    // Check for closest delete button
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
// --- Edit Task Modal ---
function openEditModal(id) {
  const todo = state.todos.find((t) => t.id === id)
  if (!todo) {
    console.error("Could not find todo to edit with ID:", id)
    return
  }
  modalEditInput.value = todo.text
  editTodoIdInput.value = todo.id // Store ID in hidden input
  editTodoModal.classList.remove("hidden")
  setTimeout(() => modalEditInput.focus(), 50) // Focus after modal is visible
}
function closeEditModal() {
  editTodoModal.classList.add("hidden")
  modalEditInput.value = "" // Clear input
  editTodoIdInput.value = "" // Clear stored ID
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
    closeEditModal()
    return
  }

  const todo = state.todos.find((t) => t.id === id)
  if (todo) {
    if (todo.text !== newText) {
      // Only update if text changed
      todo.text = newText
      renderTodoList()
      saveState()
      generateTodoImageAndUpdatePreview()
      showToast("Task updated!", "success")
    } else {
      showToast("No changes detected.", "info")
    }
  } else {
    console.error("Could not find todo to save edit for ID:", id)
    showToast("Error updating task.", "error")
  }
  closeEditModal()
}

// --- Clear Completed Tasks ---
function handleClearCompleted() {
  const completedCount = state.todos.filter((t) => t.done).length
  if (completedCount === 0) return

  state.todos = state.todos.filter((t) => !t.done) // Keep only non-done tasks
  renderTodoList() // Will update UI and hide completed section/button
  saveState()
  generateTodoImageAndUpdatePreview()
  showToast(
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
  const k = event.key,
    c = event.code
  const m =
    ["Control", "Shift", "Alt", "Meta", "ContextMenu"].includes(k) ||
    c.startsWith("Control") ||
    c.startsWith("Shift") ||
    c.startsWith("Alt") ||
    c.startsWith("Meta")
  if (!m) {
    if (!lastMainKeyPressed) {
      pressedKeys.clear()
      if (event.ctrlKey) pressedKeys.add("Control")
      if (event.shiftKey) pressedKeys.add("Shift")
      if (event.altKey) pressedKeys.add("Alt")
      if (event.metaKey) pressedKeys.add("Meta")
      pressedKeys.add(k)
      lastMainKeyPressed = k
      currentRecordedString = buildAcceleratorString()
      const i = isValidAccelerator(currentRecordedString)
      updateRecordShortcutDisplay(null, buildAcceleratorStringParts())
      recordSaveBtn.disabled = !i
      if (i) {
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
      pressedKeys.add(k)
      updateRecordShortcutDisplay(
        "Press main key...",
        buildAcceleratorStringParts()
      )
    }
  }
}
function handleShortcutKeyUp(event) {
  if (!isRecordingShortcut) return
  const k = event.key
  if (isRecordingShortcut) {
    if (["Control", "Shift", "Alt", "Meta"].includes(k)) {
      pressedKeys.delete(k)
      if (!lastMainKeyPressed) {
        updateRecordShortcutDisplay(
          "Press main key...",
          buildAcceleratorStringParts()
        )
      }
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
      if (k.startsWith("F") && !isNaN(parseInt(k.substring(1))))
        return k.toUpperCase()
      if (
        [
          "ESC",
          "TAB",
          "ENTER",
          "BACKSPACE",
          "DELETE",
          "HOME",
          "END",
          "PAGEUP",
          "PAGEDOWN",
          "INSERT",
        ].includes(k.toUpperCase())
      )
        return k.charAt(0).toUpperCase() + k.slice(1).toLowerCase()
      return k.length === 1 ? k.toUpperCase() : k
  }
}
function buildAcceleratorStringParts(useCurrentState = false) {
  const s = useCurrentState
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
  const i = navigator.platform.toUpperCase().includes("MAC")
  if (s.has("Control") || (s.has("CmdOrCtrl") && !i)) m.push("Ctrl")
  if (s.has("Alt")) m.push("Alt")
  if (s.has("Shift")) m.push("Shift")
  if (s.has("Meta") || (s.has("CmdOrCtrl") && i)) m.push("Cmd")
  s.forEach((key) => {
    if (!["Control", "Shift", "Alt", "Meta", "CmdOrCtrl"].includes(key))
      k.push(mapKeyToAccelerator(key))
  })
  const o = { Ctrl: 1, Alt: 2, Shift: 3, Cmd: 4 }
  m.sort((a, b) => (o[a] || 99) - (o[b] || 99))
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
  const f = [...m, ...k]
  return f.join("+")
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
      return "Slash"
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
    case "NUMPAD0":
      return "num0"
    case "NUMPADMULTIPLY":
      return "nummult"
    case "BACKSPACE":
      return "Backspace"
    case "DELETE":
      return "Delete"
    case "HOME":
      return "Home"
    case "END":
      return "End"
    case "PAGEUP":
      return "PageUp"
    case "PAGEDOWN":
      return "PageDown"
    case "INSERT":
      return "Insert"
    default:
      return k.length === 1 ? k.toUpperCase() : k
  }
}
function isValidAccelerator(accel) {
  if (!accel) return false
  const p = accel.split("+")
  if (p.length < 2) return false
  const hM = p.some((k) =>
    [
      "CommandOrControl",
      "Alt",
      "Shift",
      "Super",
      "Cmd",
      "Ctrl",
      "Option",
    ].includes(k)
  )
  const hK = p.some(
    (k) =>
      ![
        "CommandOrControl",
        "Alt",
        "Shift",
        "Super",
        "Cmd",
        "Ctrl",
        "Option",
      ].includes(k)
  )
  return hM && hK
}
function handleSaveShortcut() {
  if (!currentRecordedString || !isValidAccelerator(currentRecordedString)) {
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
    alert("Invalid image file type. Please select a PNG, JPG, or WEBP image.")
    return
  }
  if (f.size > 15 * 1024 * 1024) {
    alert("Image file is too large (Max 15MB). Please choose a smaller image.")
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
  alert("Error reading the selected image file.")
  handleClearImage()
}
async function handleApplyWallpaper() {
  if (!state.lastGeneratedImageDataUrl) {
    console.warn("Apply Wallpaper: No image data generated yet.")
    try {
      await generateTodoImageAndUpdatePreview()
      if (!state.lastGeneratedImageDataUrl) {
        showToast("Could not generate wallpaper image.", "error")
        return
      }
    } catch (e) {
      showToast(`Failed to generate image: ${e.message}`, "error")
      return
    }
  }
  if (applyWallpaperBtn.disabled) return
  applyWallpaperBtn.disabled = true
  const s = applyWallpaperBtn.querySelector("span")
  const o = s ? s.textContent : "Apply Wallpaper"
  if (s) s.textContent = "Applying..."
  console.log("Applying wallpaper...")
  try {
    const d = state.lastGeneratedImageDataUrl
    const r = await window.electronAPI.updateWallpaper(d)
    if (r?.success) {
      console.log("Wallpaper update successful.")
      if (s) s.textContent = "Applied!"
      showToast("Wallpaper applied successfully!", "success")
      setTimeout(() => {
        if (applyWallpaperBtn.disabled && s?.textContent === "Applied!") {
          if (s) s.textContent = o
          applyWallpaperBtn.disabled = false
        }
      }, 2000)
    } else {
      throw new Error(r?.error || "Unknown error setting wallpaper")
    }
  } catch (e) {
    console.error("Wallpaper update failed:", e)
    showToast(`Failed to apply wallpaper: ${e.message}`, "error")
    if (s) s.textContent = o
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
      if (state.lastGeneratedImageDataUrl) {
        console.log("Applying wallpaper after quick add...")
        await handleApplyWallpaper()
      } else {
        console.error(
          "Failed to generate image after quick add, cannot apply wallpaper."
        )
        showToast("Failed to generate image for wallpaper.", "error")
      }
    } catch (e) {
      console.error(
        "Error during image generation or application after quick add:",
        e
      )
      showToast("Error applying wallpaper after Quick Add.", "error")
    }
  }
}
function handleShortcutError(errorMessage) {
  console.error("Renderer received Shortcut Error from main:", errorMessage)
  alert(
    `Shortcut Error:\n${errorMessage}\n\nPlease choose different keys or close the conflicting application.`
  )
  state.runInTray = false
  if (settingsInputs.runInTrayCheckbox) {
    settingsInputs.runInTrayCheckbox.checked = false
  }
  updateShortcutInputVisibility()
  saveState()
  console.log(
    "Renderer: Sending reverted tray setting back to main due to shortcut error."
  )
  window.electronAPI.updateSettings({
    runInTray: false,
    quickAddShortcut: state.quickAddShortcut,
    quickAddTranslucent: state.quickAddTranslucent,
  })
}
function handleForcedSettingUpdate(settingsToUpdate) {
  console.log(
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
      if (k === "runInTray" && settingsInputs.runInTrayCheckbox) {
        settingsInputs.runInTrayCheckbox.checked = state.runInTray
      }
      if (k === "quickAddShortcut" && settingsInputs.currentShortcutDisplay) {
        settingsInputs.currentShortcutDisplay.textContent = formatAccelerator(
          state.quickAddShortcut || DEFAULT_SHORTCUT
        )
      }
      if (
        k === "quickAddTranslucent" &&
        settingsInputs.quickAddTranslucentCheckbox
      ) {
        settingsInputs.quickAddTranslucentCheckbox.checked =
          state.quickAddTranslucent
      }
    }
  }
  if (sc) {
    console.log("Applying forced state changes to UI and saving.")
    updateShortcutInputVisibility()
    saveState()
  } else {
    console.log("No actual state changes needed from forced update.")
  }
}
function formatAccelerator(accelerator) {
  if (!accelerator) return ""
  const p = window.electronAPI.getPlatform()
  let d = accelerator
  if (p === "darwin") {
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
  const b = settingsColumn.querySelectorAll(".setting-section-toggle")
  b.forEach((b) => {
    const s = b.closest(".setting-section"),
      c = s.querySelector(".setting-section-content"),
      i = s.classList.contains("collapsed")
    b.setAttribute("aria-expanded", !i)
    if (c && i) {
      c.style.transition = "none"
      c.style.maxHeight = "0"
      c.style.opacity = "0"
      c.style.visibility = "hidden"
      void c.offsetHeight
      c.style.transition = ""
    } else if (c && !i) {
      c.style.transition = "none"
      c.style.maxHeight = "none"
      c.style.opacity = "1"
      c.style.visibility = "visible"
      void c.offsetHeight
      c.style.transition = ""
    }
  })
}
function handleSettingToggleClick(button) {
  const s = button.closest(".setting-section"),
    c = s.querySelector(".setting-section-content")
  if (!s || !c) return
  s.classList.toggle("collapsed")
  const i = s.classList.contains("collapsed")
  button.setAttribute("aria-expanded", !i)
  if (i) {
    c.style.maxHeight = c.scrollHeight + "px"
    requestAnimationFrame(() => {
      c.style.maxHeight = "0"
      c.style.opacity = "0"
      c.addEventListener(
        "transitionend",
        () => {
          if (s.classList.contains("collapsed")) {
            c.style.visibility = "hidden"
          }
        },
        { once: true }
      )
    })
  } else {
    c.style.visibility = "visible"
    requestAnimationFrame(() => {
      c.style.maxHeight = c.scrollHeight + "px"
      c.style.opacity = "1"
    })
    c.addEventListener(
      "transitionend",
      () => {
        if (!s.classList.contains("collapsed")) {
          c.style.maxHeight = "none"
        }
      },
      { once: true }
    )
  }
}

// --- Start the application ---
initialize()
