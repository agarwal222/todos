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
  listStyle: document.getElementById("list-style-select"),
  textPosition: document.getElementById("text-position"),
  textAlign: document.getElementById("text-align-select"),
  offsetX: document.getElementById("offset-x"),
  offsetY: document.getElementById("offset-y"),
  titleSpacing: document.getElementById("title-spacing-input"), // New
  itemSpacing: document.getElementById("item-spacing-input"), // New
  fontSourceDefault: document.getElementById("font-source-default"),
  fontSourceGoogle: document.getElementById("font-source-google"),
  googleFontControls: document.getElementById("google-font-controls"),
  googleFontUrl: document.getElementById("google-font-url"),
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
const DEFAULT_SHORTCUT = "CommandOrControl+Shift+N"
let state = {
  todos: [],
  title: "My Tasks",
  listStyle: "bullet",
  fontSource: "default",
  googleFontUrl: "",
  activeFontFamily: DEFAULT_FONT,
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
  titleBottomMargin: 40, // New: Space below title (px)
  itemSpacing: 20, // New: Space between items (px)
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

// --- Initialization ---
function initialize() {
  console.log("Initializing Renderer...")
  const dimensions = window.electronAPI.getScreenDimensions()
  if (dimensions?.width && dimensions?.height) {
    state.screenWidth = dimensions.width
    state.screenHeight = dimensions.height
  } else {
    console.warn("Could not get screen dimensions sync, using defaults.")
  }
  setCanvasAndPreviewSize(state.screenWidth, state.screenHeight)
  loadState() // Load state first
  applyStateToUI() // Apply loaded state to UI
  window.electronAPI.updateSettings({
    runInTray: state.runInTray,
    quickAddShortcut: state.quickAddShortcut,
  }) // Send initial settings
  let fontLoadPromise = Promise.resolve() // Load custom font if needed
  if (state.fontSource === "google" && state.googleFontUrl) {
    fontLoadPromise = loadAndApplyCustomFont(state.googleFontUrl, false)
  } else {
    updateFontStatus("idle", DEFAULT_FONT)
  }
  renderTodoList() // Render initial list
  fontLoadPromise
    .catch((err) => console.warn("Initial font load failed:", err)) // Handle font load error
    .finally(() => {
      generateTodoImageAndUpdatePreview()
    }) // Generate preview after font settles
  setupEventListeners() // Setup listeners
  initializeCollapsibleSections() // Setup collapsible sections
  // Listen for IPC messages
  window.electronAPI.onAddTaskAndApply(handleQuickAddTaskAndApply)
  window.electronAPI.onShortcutError(handleShortcutError)
  window.electronAPI.onGetTodosRequest(() => {
    if (window.electronAPI?.sendTodosResponse)
      window.electronAPI.sendTodosResponse(state.todos)
  })
  window.electronAPI.onWindowStateChange(handleWindowStateChange)
  const platform = window.electronAPI.getPlatform() // Get platform
  document.body.dataset.platform = platform // Set data attribute
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

// --- Apply State to UI ---
function applyStateToUI() {
  settingsInputs.title.value = state.title
  settingsInputs.textColor.value = state.textColor
  settingsInputs.fontSize.value = state.fontSize
  settingsInputs.listStyle.value = state.listStyle
  settingsInputs.textPosition.value = state.textPosition
  settingsInputs.textAlign.value = state.textAlign
  settingsInputs.offsetX.value = state.offsetX
  settingsInputs.offsetY.value = state.offsetY
  settingsInputs.titleSpacing.value = state.titleBottomMargin // Apply new state
  settingsInputs.itemSpacing.value = state.itemSpacing // Apply new state
  settingsInputs.bgColor.value = state.bgColor
  settingsInputs.googleFontUrl.value = state.googleFontUrl || ""
  settingsInputs.fontSourceDefault.checked = state.fontSource === "default"
  settingsInputs.fontSourceGoogle.checked = state.fontSource === "google"
  settingsInputs.bgTypeColor.checked = state.backgroundType === "color"
  settingsInputs.bgTypeImage.checked = state.backgroundType === "image"
  settingsInputs.imageFilenameSpan.textContent =
    state.backgroundImageName || "No file chosen"
  if (settingsInputs.runInTrayCheckbox)
    settingsInputs.runInTrayCheckbox.checked = state.runInTray
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
  settingsColumn.dataset.collapsed = state.settingsCollapsed
  updateToggleIcons(state.settingsCollapsed)
}

// --- Setup Event Listeners ---
function setupEventListeners() {
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

  // Settings Inputs Change
  Object.keys(settingsInputs).forEach((key) => {
    const input = settingsInputs[key]
    if (
      input &&
      (input.tagName === "INPUT" || input.tagName === "SELECT") &&
      input.type !== "file" &&
      input.type !== "button" &&
      !input.classList.contains("button") &&
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
    }
  })

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
      googleFontUrl: state.googleFontUrl,
      activeFontFamily: state.activeFontFamily,
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
      titleBottomMargin: state.titleBottomMargin, // Save new state
      itemSpacing: state.itemSpacing, // Save new state
      settingsCollapsed: state.settingsCollapsed,
      runInTray: state.runInTray,
      quickAddShortcut: state.quickAddShortcut,
    }
    localStorage.setItem("todoAppState", JSON.stringify(stateToSave))
  } catch (e) {
    console.error("Save State Error:", e)
  }
}
function loadState() {
  try {
    const savedState = localStorage.getItem("todoAppState")
    if (savedState) {
      const parsedState = JSON.parse(savedState)
      const currentScreenDims = {
        screenWidth: state.screenWidth,
        screenHeight: state.screenHeight,
      }
      // Define defaults for new state properties if loading old save file
      const defaults = {
        titleBottomMargin: 40,
        itemSpacing: 20,
        activeFontFamily: DEFAULT_FONT,
        quickAddShortcut: DEFAULT_SHORTCUT,
        runInTray: false,
        settingsCollapsed: false,
        fontSource: "default",
        // Add other defaults if necessary
      }

      state = {
        ...state, // Keep current state (includes screen dims)
        ...defaults, // Apply defaults for potentially missing keys
        ...parsedState, // Override with saved values
        ...currentScreenDims, // Re-apply current screen dims
        todos: Array.isArray(parsedState.todos) ? parsedState.todos : [],
        // Ensure boolean and number types are correct after loading
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
        activeFontFamily:
          parsedState.activeFontFamily || defaults.activeFontFamily,
        quickAddShortcut:
          parsedState.quickAddShortcut || defaults.quickAddShortcut,
        customFontStatus: "idle",
        customFontError: null, // Reset status
      }
    } else {
      // Apply defaults if no saved state exists
      state.quickAddShortcut = DEFAULT_SHORTCUT
      state.titleBottomMargin = 40
      state.itemSpacing = 20
      console.log("No saved state found, using defaults.")
    }
  } catch (e) {
    console.error("Load State Error:", e)
    state.quickAddShortcut = DEFAULT_SHORTCUT
    state.titleBottomMargin = 40
    state.itemSpacing = 20
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
// generateTodoImageAndUpdatePreview - Calls calculateTextStartPosition & drawTextElements
async function generateTodoImageAndUpdatePreview() {
  const {
    title,
    listStyle,
    activeFontFamily,
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
    itemSpacing, // Use new state
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
  const itemFontSize = parseInt(fontSize, 10) || 48
  const linesToDraw = todos
    .filter((t) => !t.done)
    .map((t) => ({ text: t.text, done: false }))
  const padding = Math.max(60, itemFontSize * 1.5)
  // Use state values for spacing calculations
  const titleSpacing = parseInt(titleBottomMargin, 10) || 40
  const spacingBetweenItems = parseInt(itemSpacing, 10) || 20
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
      const { startX, startY } = calculateTextStartPosition(
        screenWidth,
        screenHeight,
        padding,
        titleFontSize,
        itemFontSize,
        titleSpacing, // Pass title spacing instead of lineSpacing here
        spacingBetweenItems, // Pass item spacing instead of lineSpacing here
        linesToDraw.length,
        textPosition,
        offsetX,
        offsetY
      )
      drawTextElements(ctx, {
        title,
        textColor,
        textAlign,
        fontName: activeFontFamily,
        titleFontSize,
        itemFontSize,
        titleSpacing, // Pass new spacing value
        itemSpacing: spacingBetweenItems, // Pass new spacing value
        lines: linesToDraw,
        startX,
        startY,
        listStyle,
      })
      updatePreviewImage()
    })
    .catch((err) => {
      console.error("Error during image generation process:", err)
      updatePreviewImage()
      throw err
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
// calculateTextStartPosition - *Updated* to accept separate title/item spacing
function calculateTextStartPosition(
  cw,
  ch,
  p,
  tfz,
  ifz,
  titleSpacing,
  itemSpacing,
  lc,
  pos,
  ox,
  oy
) {
  let sx, sy
  let totalTextHeight = tfz + titleSpacing // Title + space after
  totalTextHeight += lc > 0 ? lc * ifz + (lc - 1) * itemSpacing : 0 // Height of items + spacing between them

  switch (pos) {
    case "top-left":
      sx = p
      sy = p
      break
    case "top-center":
      sx = cw / 2
      sy = p
      break
    case "center-left":
      sx = p
      sy = Math.max(p, ch / 2 - totalTextHeight / 2)
      break
    case "center":
      sx = cw / 2
      sy = Math.max(p, ch / 2 - totalTextHeight / 2)
      break
    case "bottom-left":
      sx = p
      sy = ch - p - totalTextHeight
      break
    case "bottom-center":
      sx = cw / 2
      sy = ch - p - totalTextHeight
      break
    case "bottom-right":
      sx = cw - p
      sy = ch - p - totalTextHeight
      break
    default:
      sx = p
      sy = p
  }
  sy = Math.max(p, sy) // Clamp top
  if (sy + totalTextHeight > ch - p) sy = ch - p - totalTextHeight // Clamp bottom
  sy = Math.max(p, sy) // Re-clamp top after bottom clamp

  return { startX: sx + ox, startY: sy + oy }
}
// drawTextElements helper - *Updated* to use titleSpacing and itemSpacing
function drawTextElements(ctx, p) {
  const {
    title,
    textColor,
    textAlign,
    fontName,
    titleFontSize,
    itemFontSize,
    titleSpacing,
    itemSpacing,
    lines,
    startX,
    startY,
    listStyle,
  } = p
  ctx.textAlign = textAlign
  ctx.textBaseline = "top"
  ctx.shadowColor = "rgba(0,0,0,0.4)"
  ctx.shadowBlur = 6
  ctx.shadowOffsetX = 1
  ctx.shadowOffsetY = 2
  let currentY = startY
  ctx.fillStyle = textColor
  const tfs = `600 ${titleFontSize}px "${fontName}"`
  const ftfs = `600 ${titleFontSize}px ${DEFAULT_FONT}`
  ctx.font = tfs
  try {
    ctx.fillText(title, startX, currentY)
  } catch (e) {
    console.error(`Title Font Error (${fontName}):`, e)
    ctx.font = ftfs
    ctx.fillText(title, startX, currentY)
  }
  currentY += titleFontSize + titleSpacing // Use titleSpacing
  const ifs = `400 ${itemFontSize}px "${fontName}"`
  const fifs = `400 ${itemFontSize}px ${DEFAULT_FONT}`
  ctx.font = ifs
  const dc = "#a1a1aa"
  lines.forEach((item, idx) => {
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
    try {
      ctx.font = ifs
      ctx.fillText(itxt, startX, currentY)
    } catch (e) {
      console.error(`Item Font Error (${fontName}):`, e)
      ctx.font = fifs
      ctx.fillText(itxt, startX, currentY)
    }
    ctx.globalAlpha = 1.0
    currentY += itemFontSize + itemSpacing // Use itemSpacing
  })
  ctx.shadowColor = "transparent"
  ctx.shadowBlur = 0
  ctx.shadowOffsetX = 0
  ctx.shadowOffsetY = 0
}
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
        value = target.value
        if (state.fontSource !== value) {
          state.fontSource = value
          settingChanged = true
          updateFontControlsVisibility()
          if (value === "default" && state.activeFontFamily !== DEFAULT_FONT) {
            state.activeFontFamily = DEFAULT_FONT
            updateFontStatus("idle", DEFAULT_FONT)
          } else {
            requiresRegeneration = false
            updateFontStatus("idle", state.activeFontFamily)
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
        case "text-color":
          state.textColor = value
          settingChanged = true
          break
        case "font-size":
          state.fontSize = parseInt(value, 10) || 48
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
          break // Handle new input
        case "item-spacing-input":
          state.itemSpacing = parseInt(value, 10) || 0
          settingChanged = true
          break // Handle new input
        case "bg-color":
          state.bgColor = value
          settingChanged = true
          break
        case "google-font-url":
          if (state.googleFontUrl !== value.trim()) {
            state.googleFontUrl = value.trim()
            requiresRegeneration = false
            requiresSave = false
          } else {
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
    if (needsIpcUpdate && id === "run-in-tray-checkbox") {
      window.electronAPI.updateSettings({
        runInTray: state.runInTray,
        quickAddShortcut: state.quickAddShortcut,
      })
    }
  }
}
function updateShortcutInputVisibility() {
  if (settingsInputs.shortcutDisplayGroup)
    settingsInputs.shortcutDisplayGroup.classList.toggle(
      "hidden",
      !state.runInTray
    )
}

// --- Collapsible Settings Logic ---
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
  const url = settingsInputs.googleFontUrl.value.trim()
  if (!url || !url.startsWith("https://fonts.googleapis.com/css")) {
    updateFontStatus("error", state.activeFontFamily, "Invalid URL")
    return
  }
  await loadAndApplyCustomFont(url, true)
}
async function loadAndApplyCustomFont(fontUrl, shouldSaveState = true) {
  updateFontStatus("loading", state.activeFontFamily)
  let loadedFF = DEFAULT_FONT
  try {
    const r = await window.electronAPI.loadGoogleFont(fontUrl)
    if (r.success && r.fontFamily && r.fontDataUrl) {
      loadedFF = r.fontFamily
      const ff = new FontFace(loadedFF, `url(${r.fontDataUrl})`)
      await ff.load()
      if (!document.fonts.has(ff)) document.fonts.add(ff)
      state.activeFontFamily = loadedFF
      state.customFontStatus = "loaded"
      state.customFontError = null
      state.googleFontUrl = fontUrl
      updateFontStatus("loaded", loadedFF)
      generateTodoImageAndUpdatePreview()
      if (shouldSaveState) saveState()
    } else {
      throw new Error(r.error || "Failed details")
    }
  } catch (e) {
    console.error("Font Load Error:", e)
    state.customFontStatus = "error"
    state.customFontError = e.message
    state.activeFontFamily = DEFAULT_FONT
    updateFontStatus("error", DEFAULT_FONT, e.message)
    generateTodoImageAndUpdatePreview()
  }
}
function updateFontControlsVisibility() {
  settingsInputs.googleFontControls.classList.toggle(
    "hidden",
    state.fontSource !== "google"
  )
}
function updateFontStatus(status, fontFamily, error = null) {
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
      txt = `Active: ${fontFamily}`
      settingsInputs.fontStatus.classList.add("loaded")
      settingsInputs.loadFontBtn.disabled = false
      break
    case "error":
      txt = `Error: ${error || "Unknown"}`
      settingsInputs.fontStatus.classList.add("error")
      settingsInputs.loadFontBtn.disabled = false
      break
    default:
      txt =
        state.fontSource === "google" && state.activeFontFamily !== DEFAULT_FONT
          ? `Active: ${state.activeFontFamily}`
          : `Default: ${DEFAULT_FONT}`
      settingsInputs.loadFontBtn.disabled = false
      break
  }
  settingsInputs.fontStatus.textContent = txt
  settingsInputs.fontStatus.title = error || txt
}

// --- Settings Panel Toggle ---
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

// --- Todo List Click Handler ---
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

// --- Add Todo Modal Logic ---
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

// --- Record Shortcut Modal Logic ---
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
      if (["CmdOrCtrl", "Alt", "Shift", "Super"].includes(p))
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

// --- Image Handling ---
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

// --- Apply Wallpaper (Manual & Auto) ---
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

// --- Handler for Auto-Apply Task ---
async function handleQuickAddTaskAndApply(taskText) {
  console.log("Renderer received task and apply trigger:", taskText)
  if (addTodo(taskText)) {
    renderTodoList()
    saveState() // Save new todo list state immediately
    try {
      await generateTodoImageAndUpdatePreview()
      if (state.lastGeneratedImageDataUrl) await handleApplyWallpaper()
      else console.error("Failed image gen for auto-apply.")
    } catch (err) {
      console.error("Error during auto-apply:", err)
    }
  }
}

// --- Handler for Shortcut Error ---
function handleShortcutError(errorMessage) {
  console.error("Shortcut Error:", errorMessage)
  alert(`Shortcut Error:\n${errorMessage}\n\nPlease choose different keys.`)
  if (settingsInputs.runInTrayCheckbox)
    settingsInputs.runInTrayCheckbox.checked = false
  if (settingsInputs.currentShortcutDisplay)
    settingsInputs.currentShortcutDisplay.textContent = formatAccelerator(
      state.quickAddShortcut
    ) // Revert display only
  state.runInTray = false
  updateShortcutInputVisibility()
  saveState()
  window.electronAPI.updateSettings({
    runInTray: false,
    quickAddShortcut: state.quickAddShortcut,
  })
}

// --- Utility ---
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

// Handler for Window State Changes from Main
function handleWindowStateChange({ isMaximized }) {
  console.log("Renderer received window state change - Maximized:", isMaximized)
  document.body.classList.toggle("maximized", isMaximized)
  // Update button title/aria-label and icons
  if (maximizeRestoreBtn && maximizeIcon && restoreIcon) {
    maximizeRestoreBtn.title = isMaximized ? "Restore" : "Maximize"
    maximizeRestoreBtn.setAttribute(
      "aria-label",
      isMaximized ? "Restore" : "Maximize"
    )
    // Toggle the 'hidden' class on the icons
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
