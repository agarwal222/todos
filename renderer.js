// renderer.js

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
const previewContainer = document.getElementById("preview-container")
const previewAreaImg = document.getElementById("preview-area")
const minimizeBtn = document.getElementById("minimize-btn")
const maximizeRestoreBtn = document.getElementById("maximize-restore-btn")
const maximizeIcon = maximizeRestoreBtn?.querySelector(".icon-maximize")
const restoreIcon = maximizeRestoreBtn?.querySelector(".icon-restore")
const closeBtn = document.getElementById("close-btn")
const settingsInputs = {
  title: document.getElementById("wallpaper-title-input"),
  textColor: document.getElementById("text-color"),
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
  fontSourceSystem: document.getElementById("font-source-system"), // Added
  fontSourceGoogle: document.getElementById("font-source-google"),
  systemFontControls: document.getElementById("system-font-controls"), // Added
  systemFontSelect: document.getElementById("system-font-select"), // Added
  googleFontControls: document.getElementById("google-font-controls"),
  googleFontName: document.getElementById("google-font-name"), // Changed from URL
  loadFontBtn: document.getElementById("load-font-btn"),
  fontStatus: document.getElementById("font-status"),
  bgTypeColor: document.getElementById("bg-type-color"),
  bgTypeImage: document.getElementById("bg-type-image"),
  bgColorControls: document.getElementById("bg-color-controls"),
  bgColor: document.getElementById("bg-color"),
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
const DEFAULT_SHORTCUT = "CommandOrControl+Shift+N"
let state = {
  todos: [],
  title: "My Tasks",
  listStyle: "bullet",
  fontSource: "default", // 'default', 'system', 'google'
  systemFontFamily: "", // Store selected system font
  googleFontName: "", // Store google font name
  activeFontFamily: DEFAULT_FONT, // Currently rendered font
  fontWeight: DEFAULT_WEIGHT,
  customFontStatus: "idle", // 'idle', 'loading', 'loaded', 'error'
  customFontError: null,
  backgroundType: "color", // 'color', 'image'
  bgColor: "#111827",
  backgroundImageDataUrl: null,
  backgroundImageName: null,
  textColor: "#f3f4f6",
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
let systemFontsCache = [] // Cache system fonts

// --- Initialization ---
async function initialize() {
  // Make initialize async
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

  // Populate system fonts BEFORE applying state to UI
  await populateSystemFonts()

  applyStateToUI() // Apply state AFTER fonts are potentially loaded/selected

  window.electronAPI.updateSettings({
    runInTray: state.runInTray,
    quickAddShortcut: state.quickAddShortcut,
  })

  // Font loading now happens based on state applied in applyStateToUI
  // We just need to ensure the initial preview generation happens
  try {
    // If google font was loaded previously, try to load it now (no save)
    if (state.fontSource === "google" && state.googleFontName) {
      await loadAndApplyGoogleFont(state.googleFontName, false)
    } else if (state.fontSource === "system" && state.systemFontFamily) {
      state.activeFontFamily = state.systemFontFamily
      updateFontStatus("loaded", state.activeFontFamily)
    } else {
      state.activeFontFamily = DEFAULT_FONT
      updateFontStatus("idle", DEFAULT_FONT)
    }
  } catch (err) {
    console.warn("Initial font setup/load failed:", err)
    state.activeFontFamily = DEFAULT_FONT // Fallback
    state.fontSource = "default"
    applyStateToUI() // Re-apply UI if font failed
    updateFontStatus("error", DEFAULT_FONT, "Initial load failed")
  } finally {
    generateTodoImageAndUpdatePreview() // Generate preview after font setup
  }

  renderTodoList()
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
    settingsInputs.systemFontSelect.innerHTML = "" // Clear loading message

    if (!systemFontsCache || systemFontsCache.length === 0) {
      const option = document.createElement("option")
      option.value = ""
      option.textContent = "No fonts found"
      option.disabled = true
      settingsInputs.systemFontSelect.appendChild(option)
      return
    }

    // Add a default/placeholder option
    const defaultOption = document.createElement("option")
    defaultOption.value = ""
    defaultOption.textContent = "Select System Font..."
    defaultOption.disabled = true
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

// --- Apply State to UI ---
function applyStateToUI() {
  settingsInputs.title.value = state.title
  settingsInputs.textColor.value = state.textColor
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
  settingsInputs.bgColor.value = state.bgColor
  settingsInputs.googleFontName.value = state.googleFontName || "" // Use name
  settingsInputs.fontSourceDefault.checked = state.fontSource === "default"
  settingsInputs.fontSourceSystem.checked = state.fontSource === "system" // Added
  settingsInputs.fontSourceGoogle.checked = state.fontSource === "google"
  settingsInputs.bgTypeColor.checked = state.backgroundType === "color"
  settingsInputs.bgTypeImage.checked = state.backgroundType === "image"
  settingsInputs.imageFilenameSpan.textContent =
    state.backgroundImageName || "No file chosen"

  // Select the correct system font in the dropdown
  if (state.fontSource === "system" && state.systemFontFamily) {
    settingsInputs.systemFontSelect.value = state.systemFontFamily
  } else {
    // Ensure placeholder is selected if no system font is active or available
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

// --- Setup Event Listeners ---
function setupEventListeners() {
  console.log("Setting up event listeners...")
  applyWallpaperBtn.addEventListener("click", handleApplyWallpaper)
  toggleSettingsBtn.addEventListener("click", handleToggleSettings)

  // Window Control Listeners
  if (minimizeBtn)
    minimizeBtn.addEventListener("click", () =>
      window.electronAPI.minimizeWindow()
    )
  else console.error("#minimize-btn not found")
  if (maximizeRestoreBtn)
    maximizeRestoreBtn.addEventListener("click", () =>
      window.electronAPI.maximizeRestoreWindow()
    )
  else console.error("#maximize-restore-btn not found")
  if (closeBtn)
    closeBtn.addEventListener("click", () => window.electronAPI.closeWindow())
  else console.error("#close-btn not found")

  // Settings Inputs Change - Direct listeners
  Object.keys(settingsInputs).forEach((key) => {
    const input = settingsInputs[key]
    if (
      input &&
      (input.tagName === "INPUT" || input.tagName === "SELECT") &&
      input.type !== "file" &&
      input.type !== "button" &&
      !input.classList.contains("button") &&
      !input.id.endsWith("-controls") && // Exclude container divs
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
      // Add listeners specifically for system font select and google name input
      const eventType = input.tagName === "SELECT" ? "change" : "input"
      input.addEventListener(eventType, handleSettingChange)
    }
  })

  // Listener for "Change" Shortcut Button
  if (settingsInputs.changeShortcutBtn)
    settingsInputs.changeShortcutBtn.addEventListener(
      "click",
      openRecordShortcutModal
    )
  else console.error("#change-shortcut-btn not found")

  // Specific Button Listeners in Settings
  settingsInputs.loadFontBtn.addEventListener("click", handleLoadFontClick)
  settingsInputs.chooseImageBtn.addEventListener("click", () =>
    settingsInputs.imageFileInput.click()
  )
  settingsInputs.clearImageBtn.addEventListener("click", handleClearImage)
  settingsInputs.imageFileInput.addEventListener(
    "change",
    handleImageFileSelect
  )

  // Todo List Interaction
  const todoColumn = document.querySelector(".column-todos")
  if (todoColumn) todoColumn.addEventListener("click", handleListClick)
  else console.error(".column-todos not found")

  openAddTodoModalBtn.addEventListener("click", openModal)
  // Add Todo Modal Interactions
  modalCloseBtn.addEventListener("click", closeModal)
  modalCancelBtn.addEventListener("click", closeModal)
  addTodoForm.addEventListener("submit", handleModalSubmit)
  addTodoModal.addEventListener("click", (e) => {
    if (e.target === addTodoModal) closeModal()
  })
  // Record Shortcut Modal Interactions
  recordModalCloseBtn.addEventListener("click", closeRecordShortcutModal)
  recordCancelBtn.addEventListener("click", closeRecordShortcutModal)
  recordSaveBtn.addEventListener("click", handleSaveShortcut)
  recordShortcutModal.addEventListener("click", (e) => {
    if (e.target === recordShortcutModal) closeRecordShortcutModal()
  })
  // Keyboard Shortcuts (Global Level)
  document.addEventListener("keydown", handleGlobalKeyDown)
  // Collapsible setting toggles
  settingsColumn.addEventListener("click", (e) => {
    const t = e.target.closest(".setting-section-toggle")
    if (t) handleSettingToggleClick(t)
  })
  console.log("Event listeners setup complete.")
}

// --- Global Keyboard Shortcut Handler ---
function handleGlobalKeyDown(event) {
  if (!addTodoModal.classList.contains("hidden")) {
    if (event.key === "Escape") closeModal()
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

// --- State Management ---
function saveState() {
  try {
    const stateToSave = {
      todos: state.todos,
      title: state.title,
      listStyle: state.listStyle,
      fontSource: state.fontSource,
      systemFontFamily: state.systemFontFamily, // Added
      googleFontName: state.googleFontName, // Added
      // activeFontFamily: state.activeFontFamily, // Don't save this, derive it
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
    localStorage.setItem("visidoState", JSON.stringify(stateToSave)) // Changed key slightly
  } catch (e) {
    console.error("Save State Error:", e)
  }
}
function loadState() {
  try {
    const savedState = localStorage.getItem("visidoState") // Changed key slightly
    if (savedState) {
      const parsedState = JSON.parse(savedState)
      const currentScreenDims = {
        screenWidth: state.screenWidth,
        screenHeight: state.screenHeight,
      }
      // Define defaults for potentially new state properties
      const defaults = {
        titleBottomMargin: 40,
        itemSpacing: 20,
        maxItemsPerColumn: 10,
        columnGap: 50,
        // activeFontFamily: DEFAULT_FONT, // Derive this
        fontWeight: DEFAULT_WEIGHT,
        quickAddShortcut: DEFAULT_SHORTCUT,
        runInTray: false,
        settingsCollapsed: false,
        fontSource: "default",
        systemFontFamily: "", // Added
        googleFontName: "", // Added
      }
      state = {
        ...state, // Keep existing state (like screen dims)
        ...defaults, // Apply defaults
        ...parsedState, // Override with saved state
        ...currentScreenDims, // Ensure screen dims are current
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
        customFontStatus: "idle", // Reset status on load
        customFontError: null,
      }

      // Derive activeFontFamily after loading state
      if (state.fontSource === "system" && state.systemFontFamily) {
        state.activeFontFamily = state.systemFontFamily
      } else if (state.fontSource === "google" && state.googleFontName) {
        // We will attempt to load this in initialize()
        state.activeFontFamily = state.googleFontName // Set temporarily
      } else {
        state.fontSource = "default" // Ensure default if others invalid
        state.activeFontFamily = DEFAULT_FONT
      }
    } else {
      // Defaults for a completely fresh start
      state = {
        ...state, // Keep screen dims if already set
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
        bgColor: "#111827",
        backgroundImageDataUrl: null,
        backgroundImageName: null,
        textColor: "#f3f4f6",
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
    // Apply minimal defaults in case of catastrophic error
    state = {
      ...state, // Keep screen dims if possible
      todos: [],
      title: "My Tasks",
      fontSource: "default",
      activeFontFamily: DEFAULT_FONT,
      fontWeight: DEFAULT_WEIGHT,
      quickAddShortcut: DEFAULT_SHORTCUT,
      // ... other essential defaults
    }
  }
}

// --- Todo CRUD ---
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

// --- Image Generation ---
async function generateTodoImageAndUpdatePreview() {
  const {
    title,
    listStyle,
    activeFontFamily, // Use the derived active font
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

  const currentActiveFont = activeFontFamily || DEFAULT_FONT // Fallback

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
  return Promise.resolve()
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
        fontName: currentActiveFont, // Use current active font
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
      throw err
    })
}
// --- loadImage, drawBackgroundColor, drawBackgroundImage - remain the same ---
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
// --- calculateTextStartPositionMultiCol - remains the same ---
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
  // --- Calculate Start Position ---
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
// --- drawTextElementsMultiCol - remains the same (already uses fontWeight) ---
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
  const titleWeight = Math.max(parseInt(fontWeight, 10) || 400, 600) // Ensure title is at least semi-bold
  const tfs = `${titleWeight} ${titleFontSize}px "${fontName}"`,
    ftfs = `${titleWeight} ${titleFontSize}px ${DEFAULT_FONT}` // Fallback font string
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
    fifs = `${itemWeight} ${itemFontSize}px ${DEFAULT_FONT}` // Fallback item font string
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
// --- updatePreviewImage - remains the same ---
function updatePreviewImage() {
  try {
    state.lastGeneratedImageDataUrl = canvas.toDataURL("image/png")
    previewAreaImg.src = state.lastGeneratedImageDataUrl
  } catch (e) {
    console.error("Preview Gen Error:", e)
    previewAreaImg.src = ""
    state.lastGeneratedImageDataUrl = null
  }
}

// --- Event Handlers ---
function handleSettingChange(event) {
  const target = event.target
  let settingChanged = false,
    requiresRegeneration = true,
    requiresSave = true,
    needsIpcUpdate = false
  const id = target.id
  let value = target.type === "checkbox" ? target.checked : target.value
  const key = target.name || id

  switch (key) {
    case "font-source":
      if (target.checked) {
        value = target.value // 'default', 'system', 'google'
        if (state.fontSource !== value) {
          state.fontSource = value
          settingChanged = true
          updateFontControlsVisibility()
          // Update active font based on the new source
          if (value === "default") {
            state.activeFontFamily = DEFAULT_FONT
            updateFontStatus("idle", DEFAULT_FONT)
          } else if (value === "system") {
            const selectedSystemFont = settingsInputs.systemFontSelect.value
            if (selectedSystemFont) {
              state.activeFontFamily = selectedSystemFont
              state.systemFontFamily = selectedSystemFont
              updateFontStatus("loaded", selectedSystemFont)
            } else {
              state.activeFontFamily = DEFAULT_FONT // Fallback if none selected
              updateFontStatus("idle", DEFAULT_FONT)
              requiresRegeneration = false // Don't regen if no font selected yet
            }
          } else if (value === "google") {
            // Don't change active font yet, wait for load button
            requiresRegeneration = false
            // Update status based on whether a font *was* loaded previously
            if (state.googleFontName && state.customFontStatus === "loaded") {
              // If a google font was previously successfully loaded, keep its status
              updateFontStatus("loaded", state.activeFontFamily)
            } else {
              updateFontStatus("idle", state.activeFontFamily) // Or reset status
            }
          }
        } else {
          // Clicked the already selected radio
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
      // Handle specific inputs by ID
      switch (id) {
        case "wallpaper-title-input":
          state.title = value
          settingChanged = true
          break
        case "text-color":
          state.textColor = value
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
        case "bg-color":
          state.bgColor = value
          settingChanged = true
          break
        case "system-font-select": // Handle system font selection
          if (state.fontSource === "system" && value) {
            state.activeFontFamily = value
            state.systemFontFamily = value
            settingChanged = true
            updateFontStatus("loaded", value)
          } else if (state.fontSource === "system" && !value) {
            // If they somehow unselect
            state.activeFontFamily = DEFAULT_FONT
            state.systemFontFamily = ""
            settingChanged = true
            updateFontStatus("idle", DEFAULT_FONT)
          } else {
            // Changed while system not active? Just save, don't apply yet.
            state.systemFontFamily = value
            settingChanged = true
            requiresRegeneration = false // Don't regen if system not active
          }
          break
        case "google-font-name": // Handle Google font name input
          state.googleFontName = value.trim()
          settingChanged = true // Save the name change
          requiresRegeneration = false // Don't regen on typing
          // Reset status if user types a new name after a successful load
          if (state.customFontStatus === "loaded") {
            updateFontStatus("idle", state.activeFontFamily)
            state.customFontStatus = "idle" // Update state directly
          }
          break
        default:
          // Unhandled input - likely a container or non-state element
          requiresRegeneration = false
          settingChanged = false
          requiresSave = false
          break
      }
      break
  }

  // Apply changes
  if (settingChanged) {
    if (requiresRegeneration) {
      generateTodoImageAndUpdatePreview()
    }
    if (requiresSave) {
      saveState()
    }
    if (needsIpcUpdate && id === "run-in-tray-checkbox") {
      window.electronAPI.updateSettings({
        runInTray: state.runInTray,
        quickAddShortcut: state.quickAddShortcut,
      })
    }
  }
}
// --- updateShortcutInputVisibility - remains the same ---
function updateShortcutInputVisibility() {
  if (settingsInputs.shortcutDisplayGroup)
    settingsInputs.shortcutDisplayGroup.classList.toggle(
      "hidden",
      !state.runInTray
    )
}

// --- Collapsible Settings Logic - remains the same ---
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

// --- Font Loading Logic ---
async function handleLoadFontClick() {
  const fontName = settingsInputs.googleFontName.value.trim()
  if (!fontName) {
    updateFontStatus("error", state.activeFontFamily, "Enter Google Font name")
    return
  }
  await loadAndApplyGoogleFont(fontName, true) // Pass true to save state on success
}

async function loadAndApplyGoogleFont(fontName, shouldSaveState = true) {
  updateFontStatus("loading", state.activeFontFamily)
  try {
    // Get selected weight
    const fontWeight = state.fontWeight || DEFAULT_WEIGHT
    const result = await window.electronAPI.loadGoogleFontByName(
      fontName,
      fontWeight
    )

    if (result.success && result.fontFamily && result.fontDataUrl) {
      const actualFontFamily = result.fontFamily // Use family name from response
      const actualWeight = result.fontWeight // Use actual loaded weight

      // Create FontFace object
      // The 'descriptor' argument is less commonly needed unless specifying ranges, etc.
      const fontFace = new FontFace(
        actualFontFamily,
        `url(${result.fontDataUrl})`,
        { weight: actualWeight }
      )

      await fontFace.load() // Load the font data

      // Check if already added to avoid duplicates (less critical with specific weights)
      // let exists = false;
      // document.fonts.forEach(ff => {
      //     if (ff.family === actualFontFamily && ff.weight === actualWeight) exists = true;
      // });
      // if (!exists) {
      //     document.fonts.add(fontFace);
      // }

      // Always add - browser should handle duplicates if properties match exactly.
      // Crucially, this makes the specific weight available.
      document.fonts.add(fontFace)

      // Wait briefly for the font to be usable by the canvas
      await document.fonts.ready

      console.log(`Font loaded and added: ${actualFontFamily} ${actualWeight}`)

      state.activeFontFamily = actualFontFamily
      state.googleFontName = fontName // Keep the user-entered name
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
    // Don't change active font on error, keep previous or default
    updateFontStatus("error", state.activeFontFamily, e.message)
    // Optionally regenerate preview with the fallback font if needed
    // generateTodoImageAndUpdatePreview();
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
  state.customFontStatus = status // Ensure internal state matches displayed status
  state.customFontError = error
  let txt = ""
  settingsInputs.fontStatus.className = "font-status-display" // Reset classes

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
        txt = `Active: ${displayFontFamily || DEFAULT_FONT}` // Fallback
      }
      settingsInputs.loadFontBtn.disabled = state.fontSource !== "google" // Disable load unless Google selected
      break
  }
  settingsInputs.fontStatus.textContent = txt
  settingsInputs.fontStatus.title = error || txt // Show error on hover if present
}

// --- Settings Panel Toggle - remains the same ---
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

// --- Todo List Click Handler - remains the same ---
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

// --- Add Todo Modal Logic - remains the same ---
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

// --- Record Shortcut Modal Logic - remains the same ---
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

// --- Image Handling - remains the same ---
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

// --- Apply Wallpaper (Manual & Auto) - remains the same ---
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

// --- Handler for Auto-Apply Task - remains the same ---
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

// --- Handler for Shortcut Error - remains the same ---
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

// --- Utility - remains the same ---
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

// --- handleWindowStateChange - remains the same ---
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

// --- Start the application ---
initialize()
