// --- DOM Elements ---

// Header & Columns
const applyWallpaperBtn = document.getElementById("apply-wallpaper-btn")
const toggleSettingsBtn = document.getElementById("toggle-settings-btn")
const settingsIconOpen = document.getElementById("settings-icon-open")
const settingsIconClose = document.getElementById("settings-icon-close")
const todoListUl = document.getElementById("todo-list")
const settingsColumn = document.getElementById("settings-column")
const previewContainer = document.getElementById("preview-container") // Get preview container
const previewAreaImg = document.getElementById("preview-area")

// Settings Inputs (Grouped)
const settingsInputs = {
  title: document.getElementById("wallpaper-title-input"),
  textColor: document.getElementById("text-color"),
  fontSize: document.getElementById("font-size"),
  listStyle: document.getElementById("list-style-select"), // New
  textPosition: document.getElementById("text-position"),
  textAlign: document.getElementById("text-align-select"),
  offsetX: document.getElementById("offset-x"),
  offsetY: document.getElementById("offset-y"),
  fontSourceDefault: document.getElementById("font-source-default"), // New
  fontSourceGoogle: document.getElementById("font-source-google"), // New
  googleFontControls: document.getElementById("google-font-controls"), // New Container
  googleFontUrl: document.getElementById("google-font-url"), // New
  loadFontBtn: document.getElementById("load-font-btn"), // New
  fontStatus: document.getElementById("font-status"), // New Status Display
  bgTypeColor: document.getElementById("bg-type-color"),
  bgTypeImage: document.getElementById("bg-type-image"),
  bgColorControls: document.getElementById("bg-color-controls"),
  bgColor: document.getElementById("bg-color"),
  bgImageControls: document.getElementById("bg-image-controls"),
  chooseImageBtn: document.getElementById("choose-image-btn"),
  clearImageBtn: document.getElementById("clear-image-btn"),
  imageFileInput: document.getElementById("image-file-input"),
  imageFilenameSpan: document.getElementById("image-filename"),
}

// Modal Elements
const openAddTodoModalBtn = document.getElementById("open-add-todo-modal-btn")
const addTodoModal = document.getElementById("add-todo-modal")
const modalCloseBtn = document.getElementById("modal-close-btn")
const modalCancelBtn = document.getElementById("modal-cancel-btn")
const addTodoForm = document.getElementById("add-todo-form")
const modalTodoInput = document.getElementById("modal-todo-input")

// Canvas
const canvas = document.getElementById("image-canvas")
const ctx = canvas.getContext("2d")

// --- Application State ---
const DEFAULT_FONT = "Inter" // Match CSS default
let state = {
  todos: [],
  title: "My Tasks", // Updated default
  listStyle: "bullet", // Default list style
  fontSource: "default", // 'default' or 'google'
  googleFontUrl: "",
  activeFontFamily: DEFAULT_FONT, // Currently active font for drawing
  customFontStatus: "idle", // 'idle', 'loading', 'loaded', 'error'
  customFontError: null,
  backgroundType: "color",
  bgColor: "#111827", // Dark Blue/Grey start (sync with CSS vars conceptually)
  backgroundImageDataUrl: null,
  backgroundImageName: null,
  textColor: "#f3f4f6", // Light Grey start
  textPosition: "top-left",
  fontSize: 48,
  textAlign: "left",
  offsetX: 0,
  offsetY: 0,
  lastGeneratedImageDataUrl: null,
  settingsCollapsed: false, // Track settings panel state
  // Screen dimensions will be added here on init
  screenWidth: 1920, // Default fallback
  screenHeight: 1080, // Default fallback
}

// --- Initialization ---
async function initialize() {
  // Make initialize async
  console.log("Initializing...")
  // 1. Get Screen Dimensions *first*
  const dimensions = await window.electronAPI.getScreenDimensions()
  if (dimensions && dimensions.width && dimensions.height) {
    state.screenWidth = dimensions.width
    state.screenHeight = dimensions.height
    console.log(
      `Screen dimensions received: ${state.screenWidth}x${state.screenHeight}`
    )
  } else {
    console.warn(
      "Could not get screen dimensions from main process, using defaults."
    )
    // Use defaults already set in state
  }

  // 2. Set Canvas and Preview Size based on dimensions
  setCanvasAndPreviewSize(state.screenWidth, state.screenHeight)

  // 3. Load Saved State
  loadState() // Load state *after* getting screen dimensions but before applying to UI

  // 4. Apply State to UI Elements
  console.log("Applying initial state to UI...")
  applyStateToUI()

  // 5. Attempt to load saved custom font *after* UI is set
  let fontLoadPromise = Promise.resolve() // Default to resolved promise
  if (state.fontSource === "google" && state.googleFontUrl) {
    console.log("Attempting to load saved Google Font:", state.googleFontUrl)
    // Trigger the load but don't necessarily wait for it here,
    // let generateTodoImageAndUpdatePreview handle potential fallback
    fontLoadPromise = loadAndApplyCustomFont(state.googleFontUrl, false) // false = don't save state again yet
  } else {
    state.activeFontFamily = DEFAULT_FONT // Ensure default if not google
    updateFontStatus("idle", DEFAULT_FONT)
  }

  // 6. Initial Render of List
  renderTodoList()

  // 7. Generate Preview - *Wait* for initial font load attempt if applicable
  // This helps ensure the *first* preview uses the custom font if possible
  try {
    await fontLoadPromise // Wait for the font loading attempt to finish (success or fail)
    console.log(
      "Initial font load attempt complete, generating initial preview."
    )
  } catch (err) {
    // Error is already handled and logged within loadAndApplyCustomFont
    console.warn(
      "Initial font load failed, proceeding with default font for preview."
    )
  } finally {
    generateTodoImageAndUpdatePreview() // Generate preview regardless of font load success/fail
  }

  // 8. Setup Event Listeners
  console.log("Setting up event listeners...")
  setupEventListeners()

  console.log("Renderer initialized.")
}

// --- Set Canvas & Preview Size ---
function setCanvasAndPreviewSize(width, height) {
  canvas.width = width
  canvas.height = height
  if (previewContainer) {
    // Set aspect ratio using CSS custom property for easier access/update
    previewContainer.style.setProperty(
      "--preview-aspect-ratio",
      `${width} / ${height}`
    )
    console.log(`Preview aspect ratio set to: ${width} / ${height}`)
  }
}

// --- Apply State to UI ---
function applyStateToUI() {
  // Apply standard settings
  settingsInputs.title.value = state.title
  settingsInputs.textColor.value = state.textColor
  settingsInputs.fontSize.value = state.fontSize
  settingsInputs.listStyle.value = state.listStyle // Set list style dropdown
  settingsInputs.textPosition.value = state.textPosition
  settingsInputs.textAlign.value = state.textAlign
  settingsInputs.offsetX.value = state.offsetX
  settingsInputs.offsetY.value = state.offsetY
  settingsInputs.bgColor.value = state.bgColor

  // Apply font settings
  settingsInputs.googleFontUrl.value = state.googleFontUrl || ""
  if (state.fontSource === "google") {
    settingsInputs.fontSourceGoogle.checked = true
  } else {
    settingsInputs.fontSourceDefault.checked = true
  }
  updateFontControlsVisibility() // Show/hide google font url input
  updateFontStatus(
    state.customFontStatus,
    state.activeFontFamily,
    state.customFontError
  ) // Update status display

  // Apply background settings
  if (state.backgroundType === "image") {
    settingsInputs.bgTypeImage.checked = true
    settingsInputs.imageFilenameSpan.textContent =
      state.backgroundImageName || "No file chosen"
  } else {
    settingsInputs.bgTypeColor.checked = true
  }
  updateBackgroundControlsVisibility()

  // Apply settings panel collapse state
  settingsColumn.dataset.collapsed = state.settingsCollapsed
  updateToggleIcons(state.settingsCollapsed)
}

// --- Setup Event Listeners ---
function setupEventListeners() {
  // Header Buttons
  applyWallpaperBtn.addEventListener("click", handleApplyWallpaper)
  toggleSettingsBtn.addEventListener("click", handleToggleSettings)

  // Settings Inputs Change - Attach listeners directly for reliability
  Object.keys(settingsInputs).forEach((key) => {
    const input = settingsInputs[key]
    // Check if it's an actual input/select element we care about for direct changes
    // Exclude containers, buttons, file inputs, spans etc.
    if (
      input &&
      (input.tagName === "INPUT" || input.tagName === "SELECT") &&
      input.type !== "file" &&
      input.type !== "button" &&
      !input.classList.contains("button") &&
      !input.id.endsWith("-controls") &&
      input.id !== "font-status" &&
      input.id !== "image-filename"
    ) {
      const eventType =
        input.tagName === "SELECT" || input.type === "radio"
          ? "change"
          : "input"
      input.addEventListener(eventType, handleSettingChange)
      // console.log(`DEBUG: Added ${eventType} listener to: #${input.id}`); // Debug log
    }
  })

  // Specific Button Listeners in Settings (Keep these)
  settingsInputs.loadFontBtn.addEventListener("click", handleLoadFontClick) // Load font button
  settingsInputs.chooseImageBtn.addEventListener("click", () =>
    settingsInputs.imageFileInput.click()
  )
  settingsInputs.clearImageBtn.addEventListener("click", handleClearImage)
  settingsInputs.imageFileInput.addEventListener(
    "change",
    handleImageFileSelect
  )

  // Todo List Interaction (Event Delegation)
  todoListUl.addEventListener("click", handleListClick) // Keep delegation for list items
  openAddTodoModalBtn.addEventListener("click", openModal) // Button in Todo column header

  // Modal Interactions
  modalCloseBtn.addEventListener("click", closeModal)
  modalCancelBtn.addEventListener("click", closeModal)
  addTodoForm.addEventListener("submit", handleModalSubmit)
  addTodoModal.addEventListener("click", (event) => {
    if (event.target === addTodoModal) closeModal()
  })

  // Keyboard Shortcuts
  document.addEventListener("keydown", handleKeyDown)
  console.log("Event listeners setup complete.")
}

// --- Keyboard Shortcut Handler ---
function handleKeyDown(event) {
  // Ctrl+N or Cmd+N for New Todo Modal
  if ((event.ctrlKey || event.metaKey) && event.key === "n") {
    event.preventDefault()
    openModal()
  }
  // Escape key to close modal
  if (event.key === "Escape" && !addTodoModal.classList.contains("hidden")) {
    closeModal()
  }
  // Alt+S or Option+S to toggle settings
  if (event.altKey && event.key === "s") {
    event.preventDefault()
    handleToggleSettings()
  }
}

// --- State Management ---
function saveState() {
  try {
    // Explicitly create object to save, ensuring all needed keys are present
    const stateToSave = {
      todos: state.todos,
      title: state.title,
      listStyle: state.listStyle,
      fontSource: state.fontSource,
      googleFontUrl: state.googleFontUrl, // SAVE THIS
      activeFontFamily: state.activeFontFamily, // SAVE THIS
      backgroundType: state.backgroundType,
      bgColor: state.bgColor,
      backgroundImageDataUrl: state.backgroundImageDataUrl, // Potentially large!
      backgroundImageName: state.backgroundImageName,
      textColor: state.textColor,
      textPosition: state.textPosition,
      fontSize: state.fontSize,
      textAlign: state.textAlign,
      offsetX: state.offsetX,
      offsetY: state.offsetY,
      settingsCollapsed: state.settingsCollapsed,
      // Don't save screen dimensions, get them fresh on load
      // Don't save customFontStatus/Error or lastGeneratedImageDataUrl
    }
    localStorage.setItem("todoAppState", JSON.stringify(stateToSave))
    console.log("State saved.")
  } catch (e) {
    console.error("Failed to save state:", e)
    if (e.name === "QuotaExceededError") {
      alert(
        "Could not save settings. The selected background image might be too large to store locally. Please choose a smaller image or use a background color."
      )
    }
  }
}

function loadState() {
  try {
    const savedState = localStorage.getItem("todoAppState")
    if (savedState) {
      const parsedState = JSON.parse(savedState)
      // Merge saved state over defaults, ensuring keys exist
      // Important: Keep existing screen dimensions from initial detection
      const currentScreenDims = {
        screenWidth: state.screenWidth,
        screenHeight: state.screenHeight,
      }
      state = {
        ...state, // Keep defaults (like screen dims, status)
        ...parsedState, // Override with saved values
        ...currentScreenDims, // Re-apply current screen dims
        todos: Array.isArray(parsedState.todos) ? parsedState.todos : [], // Ensure array
        settingsCollapsed:
          typeof parsedState.settingsCollapsed === "boolean"
            ? parsedState.settingsCollapsed
            : false,
        // Set active font based on loaded source, default if necessary
        activeFontFamily:
          parsedState.fontSource === "google" && parsedState.activeFontFamily
            ? parsedState.activeFontFamily
            : DEFAULT_FONT,
        // Reset font status on load, will be updated if custom font loads
        customFontStatus: "idle",
        customFontError: null,
      }
      console.log("State loaded. Active font set to:", state.activeFontFamily)
    } else {
      console.log("No saved state found, using defaults.")
      state.activeFontFamily = DEFAULT_FONT
      state.settingsCollapsed = false
      // Ensure defaults match initial state definition
      state.bgColor = "#111827"
      state.textColor = "#f3f4f6"
    }
  } catch (e) {
    console.error("Failed to load or parse state:", e)
    // Reset to robust defaults on error, Keep current screen dims.
    const currentScreenDims = {
      screenWidth: state.screenWidth,
      screenHeight: state.screenHeight,
    }
    state = {
      // Reinitialize state completely on error, keeping screen dims
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
      lastGeneratedImageDataUrl: null,
      settingsCollapsed: false,
      ...currentScreenDims, // Keep screen dims
    }
    console.warn("State reset to defaults due to load error.")
  }
}

// --- Todo CRUD ---
function addTodo(text) {
  const trimmedText = text.trim()
  if (trimmedText) {
    state.todos.push({
      id: Date.now(),
      text: trimmedText,
      done: false,
    })
    return true
  }
  return false
}

function deleteTodo(id) {
  state.todos = state.todos.filter((todo) => todo.id !== id)
}

function toggleDone(id) {
  const todo = state.todos.find((t) => t.id === id)
  if (todo) {
    todo.done = !todo.done
  }
}

// --- UI Rendering ---
function renderTodoList() {
  todoListUl.innerHTML = "" // Clear previous items
  if (!Array.isArray(state.todos)) state.todos = [] // Recover

  if (state.todos.length === 0) {
    todoListUl.innerHTML = `<li class="empty-list-message">No tasks yet (Ctrl+N)</li>`
    return
  }

  state.todos.forEach((todo) => {
    const li = document.createElement("li")
    li.className = "todo-item"
    li.dataset.id = todo.id
    if (todo.done) li.classList.add("done")

    const checkbox = document.createElement("input")
    checkbox.type = "checkbox"
    checkbox.checked = todo.done
    checkbox.classList.add("toggle-done")
    checkbox.setAttribute(
      "aria-label",
      `Mark task ${todo.done ? "not done" : "done"}`
    )

    const textSpan = document.createElement("span")
    textSpan.textContent = todo.text
    textSpan.classList.add("todo-text")

    const deleteBtn = document.createElement("button")
    deleteBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" width="14" height="14"><path fill-rule="evenodd" d="M5 3.25V4H2.75a.75.75 0 0 0 0 1.5h.3l.815 8.15A1.5 1.5 0 0 0 5.357 15h5.285a1.5 1.5 0 0 0 1.493-1.35l.815-8.15h.3a.75.75 0 0 0 0-1.5H11v-.75A2.25 2.25 0 0 0 8.75 1h-1.5A2.25 2.25 0 0 0 5 3.25Zm2.25-.75a.75.75 0 0 0-.75.75V4h3v-.75a.75.75 0 0 0-.75-.75h-1.5ZM6.05 6a.75.75 0 0 1 .787.713l.275 5.5a.75.75 0 0 1-1.498.075l-.275-5.5A.75.75 0 0 1 6.05 6Zm3.9 0a.75.75 0 0 1 .712.787l-.275 5.5a.75.75 0 0 1-1.498-.075l.275-5.5a.75.75 0 0 1 .786-.711Z" clip-rule="evenodd" /></svg>` // Trash icon
    deleteBtn.className = "button button-ghost button-icon delete-btn"
    deleteBtn.title = "Delete Task"
    deleteBtn.setAttribute("aria-label", "Delete task")

    li.appendChild(checkbox)
    li.appendChild(textSpan)
    li.appendChild(deleteBtn)
    todoListUl.appendChild(li)
  })
}

// --- Image Generation ---
async function generateTodoImageAndUpdatePreview() {
  console.log("Generating preview image...")
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
    todos,
    screenWidth,
    screenHeight,
  } = state

  // 1. Ensure Canvas size matches state
  if (canvas.width !== screenWidth || canvas.height !== screenHeight) {
    setCanvasAndPreviewSize(screenWidth, screenHeight)
  }

  const itemFontSize = parseInt(fontSize, 10) || 48
  const lines = todos.map((todo) => ({ text: todo.text, done: todo.done }))
  const padding = Math.max(60, itemFontSize * 1.5)
  const lineSpacing = Math.round(itemFontSize * 0.6)
  const titleFontSize = Math.round(itemFontSize * 1.2)

  // 2. Draw Background
  ctx.clearRect(0, 0, screenWidth, screenHeight)
  if (backgroundType === "image" && backgroundImageDataUrl) {
    try {
      const img = await loadImage(backgroundImageDataUrl)
      drawBackgroundImage(ctx, img, screenWidth, screenHeight)
    } catch (error) {
      console.error("Failed to load/draw background image:", error)
      drawBackgroundColor(ctx, bgColor, screenWidth, screenHeight)
    }
  } else {
    drawBackgroundColor(ctx, bgColor, screenWidth, screenHeight)
  }

  // 3. Calculate Text Position
  const { startX, startY } = calculateTextStartPosition(
    screenWidth,
    screenHeight,
    padding,
    titleFontSize,
    itemFontSize,
    lineSpacing,
    lines.length,
    textPosition,
    offsetX,
    offsetY
  )

  // 4. Draw Text Elements
  drawTextElements(ctx, {
    title,
    textColor,
    textAlign,
    fontName: activeFontFamily,
    titleFontSize,
    itemFontSize,
    lineSpacing,
    lines,
    startX,
    startY,
    listStyle,
  })

  // 5. Update Preview
  updatePreviewImage()
}

// Helper: Load Image Promise
function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = (err) => reject(new Error(`Image load error: ${err}`))
    img.src = src
  })
}

// Helper: Draw Background Color
function drawBackgroundColor(ctx, color, width, height) {
  ctx.fillStyle = color
  ctx.fillRect(0, 0, width, height)
}

// Helper: Draw Background Image (Cover)
function drawBackgroundImage(ctx, img, canvasWidth, canvasHeight) {
  const imgAspect = img.width / img.height
  const canvasAspect = canvasWidth / canvasHeight
  let drawWidth, drawHeight, drawX, drawY

  if (imgAspect >= canvasAspect) {
    // Image wider or same aspect as canvas
    drawHeight = canvasHeight
    drawWidth = drawHeight * imgAspect
    drawX = (canvasWidth - drawWidth) / 2
    drawY = 0
  } else {
    // Image taller than canvas
    drawWidth = canvasWidth
    drawHeight = drawWidth / imgAspect
    drawX = 0
    drawY = (canvasHeight - drawHeight) / 2
  }
  ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight)
}

// Helper: Calculate Text Start Position
function calculateTextStartPosition(
  canvasWidth,
  canvasHeight,
  padding,
  titleFontSize,
  itemFontSize,
  lineSpacing,
  lineCount,
  position,
  offsetX,
  offsetY
) {
  let startX, startY
  let totalTextHeight = titleFontSize + lineSpacing * 1.5 // Title + space after
  totalTextHeight += lineCount * (itemFontSize + lineSpacing) // Items + spacing

  switch (position) {
    case "top-left":
      startX = padding
      startY = padding
      break
    case "top-center":
      startX = canvasWidth / 2
      startY = padding
      break
    case "center-left":
      startX = padding
      startY = Math.max(padding, canvasHeight / 2 - totalTextHeight / 2)
      break
    case "center":
      startX = canvasWidth / 2
      startY = Math.max(padding, canvasHeight / 2 - totalTextHeight / 2)
      break
    case "bottom-left":
      startX = padding
      startY = canvasHeight - padding - totalTextHeight
      break
    case "bottom-center":
      startX = canvasWidth / 2
      startY = canvasHeight - padding - totalTextHeight
      break
    case "bottom-right":
      startX = canvasWidth - padding
      startY = canvasHeight - padding - totalTextHeight
      break
    default:
      startX = padding
      startY = padding
  }
  // Ensure text doesn't start below bottom padding if height is large
  startY = Math.max(padding, startY)

  return { startX: startX + offsetX, startY: startY + offsetY }
}

// Helper: Draw Text Elements - Updated for listStyle
function drawTextElements(ctx, params) {
  const {
    title,
    textColor,
    textAlign,
    fontName,
    titleFontSize,
    itemFontSize,
    lineSpacing,
    lines,
    startX,
    startY,
    listStyle,
  } = params

  ctx.textAlign = textAlign
  ctx.textBaseline = "top"
  ctx.shadowColor = "rgba(0, 0, 0, 0.4)"
  ctx.shadowBlur = 6
  ctx.shadowOffsetX = 1
  ctx.shadowOffsetY = 2

  let currentY = startY

  // Draw Title
  ctx.fillStyle = textColor
  ctx.font = `600 ${titleFontSize}px "${fontName}"` // Quote font name
  try {
    ctx.fillText(title, startX, currentY)
  } catch (e) {
    console.error(`Error drawing title with font ${fontName}:`, e)
    ctx.font = `600 ${titleFontSize}px ${DEFAULT_FONT}` // Fallback font
    ctx.fillText(title, startX, currentY)
  }
  currentY += titleFontSize + lineSpacing * 1.5

  // Draw Todo Items
  const itemFontString = `400 ${itemFontSize}px "${fontName}"`
  const fallbackItemFontString = `400 ${itemFontSize}px ${DEFAULT_FONT}`
  ctx.font = itemFontString // Set initial font
  const doneColor = "#a1a1aa" // Zinc 400

  lines.forEach((item, index) => {
    // Added index
    let prefix
    if (item.done) {
      prefix = "✓ "
    } else {
      switch (listStyle) {
        case "dash":
          prefix = "- "
          break
        case "number":
          prefix = `${index + 1}. `
          break
        case "bullet":
        default:
          prefix = "• "
          break
      }
    }

    const itemText = `${prefix}${item.text}`
    let currentTextColor = item.done ? doneColor : textColor
    ctx.fillStyle = currentTextColor
    ctx.globalAlpha = item.done ? 0.75 : 1.0

    // Draw text, catch potential font errors
    try {
      ctx.font = itemFontString // Ensure font is set correctly for measurement/drawing
      ctx.fillText(itemText, startX, currentY)
    } catch (e) {
      console.error(`Error drawing item with font ${fontName}:`, e)
      ctx.font = fallbackItemFontString // Fallback font
      ctx.fillText(itemText, startX, currentY)
    }

    // Strikethrough for done items
    if (item.done) {
      try {
        ctx.font = itemFontString // Use current item font for measurement
        const textMetrics = ctx.measureText(itemText)
        const textWidth = textMetrics.width
        ctx.save()
        ctx.strokeStyle = currentTextColor
        ctx.globalAlpha = 0.6
        ctx.lineWidth = Math.max(1, Math.round(itemFontSize / 22))
        ctx.shadowColor = "transparent"
        let lineX = startX
        if (textAlign === "center") lineX = startX - textWidth / 2
        else if (textAlign === "right") lineX = startX - textWidth
        ctx.beginPath()
        const strikeY = currentY + itemFontSize * 0.58
        ctx.moveTo(lineX, strikeY)
        ctx.lineTo(lineX + textWidth, strikeY)
        ctx.stroke()
        ctx.restore()
      } catch (e) {
        console.error(`Error drawing strikethrough with font ${fontName}:`, e)
        // Skip strikethrough if measurement fails
      }
    }
    ctx.globalAlpha = 1.0
    currentY += itemFontSize + lineSpacing
  })

  // Reset shadow
  ctx.shadowColor = "transparent"
  ctx.shadowBlur = 0
  ctx.shadowOffsetX = 0
  ctx.shadowOffsetY = 0
}

// Helper: Update Preview Image Src
function updatePreviewImage() {
  try {
    state.lastGeneratedImageDataUrl = canvas.toDataURL("image/png")
    previewAreaImg.src = state.lastGeneratedImageDataUrl
    console.log("Preview updated.")
  } catch (error) {
    console.error("Error generating preview image data:", error)
    previewAreaImg.src = "" // Clear on error
    state.lastGeneratedImageDataUrl = null
  }
}

// --- Event Handlers ---

// handleSettingChange - Refined logic
function handleSettingChange(event) {
  const target = event.target
  // console.log('Setting change detected:', target.id || target.name, target.value, target.type, target.checked); // Debug
  let settingChanged = false
  let requiresRegeneration = true
  let requiresSave = true

  const id = target.id
  let value = target.type === "checkbox" ? target.checked : target.value

  switch (target.name) {
    // Handle radio groups by name
    case "font-source":
      if (target.checked) {
        value = target.value
        if (state.fontSource !== value) {
          state.fontSource = value
          settingChanged = true
          updateFontControlsVisibility()
          if (value === "default") {
            if (state.activeFontFamily !== DEFAULT_FONT) {
              console.log("Switching back to default font.")
              state.activeFontFamily = DEFAULT_FONT
              updateFontStatus("idle", DEFAULT_FONT)
              // requiresRegeneration is true by default
            } else {
              requiresRegeneration = false // No change needed if already default
              requiresSave = false // No need to save if no effective change
            }
          } else {
            // Switching to 'google'
            requiresRegeneration = false // Don't regen yet
            updateFontStatus("idle", state.activeFontFamily) // Show current state until loaded
          }
        } else {
          settingChanged = false // Radio didn't actually change the source
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
          // requiresRegeneration is true by default
        } else {
          settingChanged = false // Radio didn't actually change the source
          requiresRegeneration = false
          requiresSave = false
        }
      }
      break
    default:
      // Handle other inputs by ID
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
        case "bg-color":
          state.bgColor = value
          settingChanged = true
          break
        case "google-font-url":
          if (state.googleFontUrl !== value.trim()) {
            state.googleFontUrl = value.trim()
            requiresRegeneration = false
            requiresSave = false // Don't save just for typing URL
          } else {
            requiresRegeneration = false
            requiresSave = false // No actual change
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
    console.log(`State updated via ${id || target.name} to: ${value}`)
    if (requiresRegeneration) {
      console.log("Regenerating image due to setting change.")
      generateTodoImageAndUpdatePreview()
    }
    if (requiresSave) {
      saveState()
    }
  }
}

// --- Font Loading Logic ---
async function handleLoadFontClick() {
  const url = settingsInputs.googleFontUrl.value.trim()
  if (!url || !url.startsWith("https://fonts.googleapis.com/css")) {
    // Basic validation
    updateFontStatus(
      "error",
      state.activeFontFamily,
      "Invalid Google Fonts URL format."
    )
    return
  }
  await loadAndApplyCustomFont(url, true) // true = save state after
}

// loadAndApplyCustomFont - Updated with refined error handling and fallback
async function loadAndApplyCustomFont(fontUrl, shouldSaveState = true) {
  updateFontStatus("loading", state.activeFontFamily)
  console.log(`Attempting to load font from URL: ${fontUrl}`)
  let loadedFontFamily = DEFAULT_FONT // Start assuming fallback

  try {
    const result = await window.electronAPI.loadGoogleFont(fontUrl)

    if (result.success && result.fontFamily && result.fontDataUrl) {
      loadedFontFamily = result.fontFamily // Get the actual family name
      console.log(`Renderer: Font details received: ${loadedFontFamily}`)

      const fontFace = new FontFace(
        loadedFontFamily,
        `url(${result.fontDataUrl})`
      ) // Removed format hint, let browser deduce
      console.log(`Loading FontFace for "${loadedFontFamily}"...`)
      await fontFace.load() // Wait for the font to be ready
      document.fonts.add(fontFace) // Make it available
      console.log(
        `Renderer: Font "${loadedFontFamily}" loaded and added via FontFace.`
      )

      // --- SUCCESS ---
      state.activeFontFamily = loadedFontFamily // Update active font *only on success*
      state.customFontStatus = "loaded"
      state.customFontError = null
      state.googleFontUrl = fontUrl // Store the successfully loaded URL

      updateFontStatus("loaded", loadedFontFamily)
      generateTodoImageAndUpdatePreview() // Regenerate with new font
      if (shouldSaveState) saveState()
      return // Exit function on success
    } else {
      throw new Error(
        result.error || "Failed to get font details from main process."
      )
    }
  } catch (error) {
    console.error("Renderer: Error loading custom font:", error)
    state.customFontStatus = "error"
    state.customFontError = error.message
    // *** Revert to default font on any failure during load ***
    state.activeFontFamily = DEFAULT_FONT
    updateFontStatus("error", DEFAULT_FONT, error.message) // Show default font in status on error
    generateTodoImageAndUpdatePreview() // Regenerate with default font on error
    // Avoid saving the failed state automatically
  }
}

function updateFontControlsVisibility() {
  settingsInputs.googleFontControls.classList.toggle(
    "hidden",
    state.fontSource !== "google"
  )
}

function updateFontStatus(status, fontFamily, error = null) {
  state.customFontStatus = status // Ensure state matches UI
  state.customFontError = error

  let statusText = ""
  settingsInputs.fontStatus.className = "font-status-display" // Reset classes

  switch (status) {
    case "loading":
      statusText = "Loading font..."
      settingsInputs.fontStatus.classList.add("loading")
      settingsInputs.loadFontBtn.disabled = true
      break
    case "loaded":
      statusText = `Active: ${fontFamily}`
      settingsInputs.fontStatus.classList.add("loaded")
      settingsInputs.loadFontBtn.disabled = false
      break
    case "error":
      statusText = `Error: ${error || "Unknown error"}`
      settingsInputs.fontStatus.classList.add("error")
      settingsInputs.loadFontBtn.disabled = false
      break
    case "idle":
    default:
      statusText =
        state.fontSource === "google" && state.activeFontFamily !== DEFAULT_FONT
          ? `Active: ${state.activeFontFamily}` // Show loaded google font if applicable
          : `Default: ${DEFAULT_FONT}` // Otherwise show default
      settingsInputs.loadFontBtn.disabled = false
      break
  }
  settingsInputs.fontStatus.textContent = statusText
  settingsInputs.fontStatus.title = error || statusText // Show error on hover
}

// handleToggleSettings, updateToggleIcons
function handleToggleSettings() {
  state.settingsCollapsed = !state.settingsCollapsed
  settingsColumn.dataset.collapsed = state.settingsCollapsed
  updateToggleIcons(state.settingsCollapsed)
  saveState() // Save collapse state
}

function updateToggleIcons(isCollapsed) {
  if (isCollapsed) {
    settingsIconOpen.classList.add("hidden")
    settingsIconClose.classList.remove("hidden")
    toggleSettingsBtn.title = "Open Settings Panel (Alt+S)"
    toggleSettingsBtn.setAttribute("aria-expanded", "false")
  } else {
    settingsIconOpen.classList.remove("hidden")
    settingsIconClose.classList.add("hidden")
    toggleSettingsBtn.title = "Close Settings Panel (Alt+S)"
    toggleSettingsBtn.setAttribute("aria-expanded", "true")
  }
}

// handleListClick - Refined animation timing
function handleListClick(event) {
  const target = event.target
  const todoItem = target.closest(".todo-item")

  if (!todoItem || !todoItem.dataset.id) return

  const todoId = parseInt(todoItem.dataset.id, 10)

  // Checkbox or Text Click -> Toggle Done
  if (
    target.classList.contains("toggle-done") ||
    target.classList.contains("todo-text")
  ) {
    toggleDone(todoId)
    // Visually update just this item
    todoItem.classList.toggle(
      "done",
      state.todos.find((t) => t.id === todoId)?.done
    )
    const checkbox = todoItem.querySelector(".toggle-done")
    if (checkbox)
      checkbox.checked = state.todos.find((t) => t.id === todoId)?.done

    generateTodoImageAndUpdatePreview() // Update wallpaper image
    saveState()
  }
  // Delete Button Click
  else if (target.closest(".delete-btn")) {
    deleteTodo(todoId) // Update state first
    // Animate removal
    todoItem.style.opacity = "0"
    todoItem.style.transform = "translateX(-20px)"
    // Use transitionend event for reliability instead of setTimeout
    todoItem.addEventListener(
      "transitionend",
      () => {
        // Only re-render if the element hasn't already been removed by a previous event/fast click
        if (todoItem.parentNode === todoListUl) {
          renderTodoList() // Re-render list after animation completes
        }
      },
      { once: true }
    ) // Ensure listener is removed after firing once

    generateTodoImageAndUpdatePreview() // Update image immediately
    saveState() // Save immediately
  }
}

// Modal: Open, Close, Submit
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
  const newTodoText = modalTodoInput.value
  if (addTodo(newTodoText)) {
    renderTodoList()
    generateTodoImageAndUpdatePreview()
    saveState()
    closeModal()
  } else {
    console.warn("Attempted to add empty task from modal.")
    modalTodoInput.focus()
    modalTodoInput.classList.add("shake-animation")
    setTimeout(() => modalTodoInput.classList.remove("shake-animation"), 500)
  }
}

// Image Handling
function updateBackgroundControlsVisibility() {
  const isImage = state.backgroundType === "image"
  settingsInputs.bgColorControls.classList.toggle("hidden", isImage)
  settingsInputs.bgImageControls.classList.toggle("hidden", !isImage)
}

function handleImageFileSelect(event) {
  const file = event.target.files[0]
  if (!file) return
  if (!file.type.startsWith("image/")) {
    alert("Please select a valid image file.")
    settingsInputs.imageFileInput.value = ""
    return
  }
  if (file.size > 15 * 1024 * 1024) {
    alert("Image file too large (max 15MB).")
    settingsInputs.imageFileInput.value = ""
    return
  }

  const reader = new FileReader()
  reader.onload = (e) => {
    state.backgroundImageDataUrl = e.target.result
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
  settingsInputs.imageFileInput.value = ""
  state.backgroundType = "color"
  settingsInputs.bgTypeColor.checked = true
  updateBackgroundControlsVisibility()
  generateTodoImageAndUpdatePreview()
  saveState()
}

function handleImageReadError(err) {
  console.error("FileReader error:", err)
  alert("Error reading image file.")
  handleClearImage() // Reset state on error
}

// Apply Wallpaper
async function handleApplyWallpaper() {
  if (!state.lastGeneratedImageDataUrl) {
    alert("No preview available to apply.")
    return
  }
  applyWallpaperBtn.disabled = true
  const spanElement = applyWallpaperBtn.querySelector("span")
  const originalText = spanElement ? spanElement.textContent : "Apply Wallpaper" // Fallback text
  if (spanElement) spanElement.textContent = "Applying..."

  try {
    const result = await window.electronAPI.updateWallpaper(
      state.lastGeneratedImageDataUrl
    )
    if (result && result.success) {
      // Check result exists
      console.log("Wallpaper update successful.")
      if (spanElement) spanElement.textContent = "Applied!"
      setTimeout(() => {
        if (spanElement) spanElement.textContent = originalText
        applyWallpaperBtn.disabled = false
      }, 2000)
    } else {
      // Handle failure from main process explicitly
      throw new Error(result?.error || "Unknown error from main process")
    }
  } catch (err) {
    console.error("Wallpaper update failed:", err)
    alert(`Failed to apply wallpaper:\n${err.message}`)
    if (spanElement) spanElement.textContent = originalText // Reset on error
    applyWallpaperBtn.disabled = false
  }
}

// --- Start the application ---
initialize() // Start the app
