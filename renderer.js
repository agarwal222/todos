// --- DOM Elements ---

// Header
const applyWallpaperBtn = document.getElementById("apply-wallpaper-btn")
const toggleSettingsBtn = document.getElementById("toggle-settings-btn")
const settingsIconOpen = document.getElementById("settings-icon-open")
const settingsIconClose = document.getElementById("settings-icon-close")

// Columns
const todoListUl = document.getElementById("todo-list")
const settingsColumn = document.getElementById("settings-column")
const previewAreaImg = document.getElementById("preview-area")

// Settings Inputs (grouped for clarity)
const settingsInputs = {
  title: document.getElementById("wallpaper-title-input"),
  textColor: document.getElementById("text-color"),
  fontSize: document.getElementById("font-size"),
  textPosition: document.getElementById("text-position"),
  textAlign: document.getElementById("text-align-select"),
  offsetX: document.getElementById("offset-x"),
  offsetY: document.getElementById("offset-y"),
  bgTypeColor: document.getElementById("bg-type-color"),
  bgTypeImage: document.getElementById("bg-type-image"),
  bgColor: document.getElementById("bg-color"),
  chooseImageBtn: document.getElementById("choose-image-btn"),
  clearImageBtn: document.getElementById("clear-image-btn"),
  imageFileInput: document.getElementById("image-file-input"),
  imageFilenameSpan: document.getElementById("image-filename"),
  bgColorControls: document.getElementById("bg-color-controls"),
  bgImageControls: document.getElementById("bg-image-controls"),
}

// Modal Elements
const addTodoModal = document.getElementById("add-todo-modal")
const modalCloseBtn = document.getElementById("modal-close-btn")
const modalCancelBtn = document.getElementById("modal-cancel-btn")
const addTodoForm = document.getElementById("add-todo-form")
const modalTodoInput = document.getElementById("modal-todo-input")

// Canvas (still needed for generation)
const canvas = document.getElementById("image-canvas")
const ctx = canvas.getContext("2d")

// --- Application State ---
let state = {
  todos: [],
  title: "My Tasks", // Updated default
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
}

// --- Initialization ---
function initialize() {
  loadState()

  // Apply loaded state to UI elements
  applyStateToUI()

  // Initial Render
  renderTodoList()
  generateTodoImageAndUpdatePreview() // Generate initial image

  // Setup Event Listeners
  setupEventListeners()

  console.log("Renderer initialized.")
}

// --- Apply State to UI ---
// Helper to set all UI elements based on the current state
function applyStateToUI() {
  settingsInputs.title.value = state.title
  settingsInputs.textColor.value = state.textColor
  settingsInputs.fontSize.value = state.fontSize
  settingsInputs.textPosition.value = state.textPosition
  settingsInputs.textAlign.value = state.textAlign
  settingsInputs.offsetX.value = state.offsetX
  settingsInputs.offsetY.value = state.offsetY
  settingsInputs.bgColor.value = state.bgColor

  // Background type
  if (state.backgroundType === "image") {
    settingsInputs.bgTypeImage.checked = true
    settingsInputs.imageFilenameSpan.textContent =
      state.backgroundImageName || "No file chosen"
  } else {
    settingsInputs.bgTypeColor.checked = true
  }
  updateBackgroundControlsVisibility() // Show/hide relevant controls

  // Settings panel collapse state
  settingsColumn.dataset.collapsed = state.settingsCollapsed
  updateToggleIcons(state.settingsCollapsed)
}

// --- Setup Event Listeners ---
function setupEventListeners() {
  // Header Buttons
  applyWallpaperBtn.addEventListener("click", handleApplyWallpaper)
  toggleSettingsBtn.addEventListener("click", handleToggleSettings)

  // Settings Inputs Change (using event delegation on a container might be more performant for many inputs, but this is clear)
  Object.values(settingsInputs).forEach((input) => {
    if (
      input &&
      input.tagName !== "SPAN" &&
      input.id !== "bg-color-controls" &&
      input.id !== "bg-image-controls" &&
      input.type !== "file" &&
      !input.classList.contains("button")
    ) {
      // Avoid adding listeners to containers, spans, file inputs, buttons handled separately
      const eventType =
        input.tagName === "SELECT" || input.type === "radio"
          ? "change"
          : "input"
      input.addEventListener(eventType, handleSettingChange)
    }
  })

  // Specific Button Listeners in Settings
  settingsInputs.chooseImageBtn.addEventListener("click", () =>
    settingsInputs.imageFileInput.click()
  )
  settingsInputs.clearImageBtn.addEventListener("click", handleClearImage)
  settingsInputs.imageFileInput.addEventListener(
    "change",
    handleImageFileSelect
  )

  // Todo List Interaction (Event Delegation)
  todoListUl.addEventListener("click", handleListClick)

  // Modal Interactions
  modalCloseBtn.addEventListener("click", closeModal)
  modalCancelBtn.addEventListener("click", closeModal)
  addTodoForm.addEventListener("submit", handleModalSubmit)
  addTodoModal.addEventListener("click", (event) => {
    // Close on overlay click
    if (event.target === addTodoModal) {
      closeModal()
    }
  })

  // Keyboard Shortcuts
  document.addEventListener("keydown", handleKeyDown)
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
}

// --- State Management ---
function saveState() {
  try {
    // Explicitly include settingsCollapsed in saved state
    const stateToSave = { ...state }
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
      // Merge saved state over defaults
      state = { ...state, ...parsedState }
      // Ensure todos is always an array
      state.todos = Array.isArray(state.todos) ? state.todos : []
      // Ensure settingsCollapsed is boolean
      state.settingsCollapsed =
        typeof state.settingsCollapsed === "boolean"
          ? state.settingsCollapsed
          : false

      console.log("State loaded:", state)
    } else {
      console.log("No saved state found, using defaults.")
      // Set default colors explicitly if needed (to match CSS)
      state.bgColor = "#111827"
      state.textColor = "#f3f4f6"
    }
  } catch (e) {
    console.error("Failed to load or parse state:", e)
    // Reset to defaults on error?
    state.bgColor = "#111827"
    state.textColor = "#f3f4f6"
    state.settingsCollapsed = false
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
  if (!Array.isArray(state.todos)) {
    state.todos = [] // Recover if state is broken
  }

  if (state.todos.length === 0) {
    todoListUl.innerHTML = `<li class="empty-list-message">No tasks added yet.</li>`
    return
  }

  state.todos.forEach((todo) => {
    const li = document.createElement("li")
    li.className = "todo-item"
    li.dataset.id = todo.id
    if (todo.done) {
      li.classList.add("done")
    }

    const checkbox = document.createElement("input")
    checkbox.type = "checkbox"
    checkbox.checked = todo.done
    checkbox.classList.add("toggle-done")
    checkbox.setAttribute(
      "aria-label",
      `Mark task ${todo.done ? "not done" : "done"}`
    ) // Accessibility

    const textSpan = document.createElement("span")
    textSpan.textContent = todo.text
    textSpan.classList.add("todo-text")

    const deleteBtn = document.createElement("button")
    deleteBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" width="14" height="14"><path fill-rule="evenodd" d="M5 3.25V4H2.75a.75.75 0 0 0 0 1.5h.3l.815 8.15A1.5 1.5 0 0 0 5.357 15h5.285a1.5 1.5 0 0 0 1.493-1.35l.815-8.15h.3a.75.75 0 0 0 0-1.5H11v-.75A2.25 2.25 0 0 0 8.75 1h-1.5A2.25 2.25 0 0 0 5 3.25Zm2.25-.75a.75.75 0 0 0-.75.75V4h3v-.75a.75.75 0 0 0-.75-.75h-1.5ZM6.05 6a.75.75 0 0 1 .787.713l.275 5.5a.75.75 0 0 1-1.498.075l-.275-5.5A.75.75 0 0 1 6.05 6Zm3.9 0a.75.75 0 0 1 .712.787l-.275 5.5a.75.75 0 0 1-1.498-.075l.275-5.5a.75.75 0 0 1 .786-.711Z" clip-rule="evenodd" /></svg>` // Trash icon
    deleteBtn.className = "button button-ghost button-icon delete-btn"
    deleteBtn.title = "Delete Task"
    deleteBtn.setAttribute("aria-label", "Delete task") // Accessibility

    li.appendChild(checkbox)
    li.appendChild(textSpan)
    li.appendChild(deleteBtn)
    todoListUl.appendChild(li)
  })
}

// --- Image Generation ---
async function generateTodoImageAndUpdatePreview() {
  console.log("Generating preview image...")

  // Read settings from state
  const {
    title,
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
  } = state

  const itemFontSize = parseInt(fontSize, 10) || 48
  const lines = todos.map((todo) => ({ text: todo.text, done: todo.done }))

  // Canvas Settings
  const canvasWidth = canvas.width
  const canvasHeight = canvas.height
  const fontName = "Inter" // Match CSS font
  const titleFontSize = Math.round(itemFontSize * 1.2) // Slightly smaller title ratio
  const padding = Math.max(60, itemFontSize * 1.5) // Dynamic padding based on font size
  const lineSpacing = Math.round(itemFontSize * 0.6) // Increased spacing

  // 1. Draw Background
  ctx.clearRect(0, 0, canvasWidth, canvasHeight)
  if (backgroundType === "image" && backgroundImageDataUrl) {
    try {
      const img = await loadImage(backgroundImageDataUrl)
      drawBackgroundImage(ctx, img, canvasWidth, canvasHeight)
    } catch (error) {
      console.error("Failed to load/draw background image:", error)
      drawBackgroundColor(ctx, bgColor, canvasWidth, canvasHeight)
    }
  } else {
    drawBackgroundColor(ctx, bgColor, canvasWidth, canvasHeight)
  }

  // 2. Calculate Text Position
  const { startX, startY } = calculateTextStartPosition(
    canvasWidth,
    canvasHeight,
    padding,
    titleFontSize,
    itemFontSize,
    lineSpacing,
    lines.length,
    textPosition,
    offsetX,
    offsetY
  )

  // 3. Draw Text
  drawTextElements(ctx, {
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
  })

  // 4. Update Preview
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

// Helper: Draw Text Elements
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
  } = params

  ctx.textAlign = textAlign
  ctx.textBaseline = "top"

  // Subtle shadow for readability
  ctx.shadowColor = "rgba(0, 0, 0, 0.4)"
  ctx.shadowBlur = 6
  ctx.shadowOffsetX = 1
  ctx.shadowOffsetY = 2

  let currentY = startY

  // Draw Title
  ctx.fillStyle = textColor
  ctx.font = `600 ${titleFontSize}px ${fontName}` // Use font weight 600
  ctx.fillText(title, startX, currentY)
  currentY += titleFontSize + lineSpacing * 1.5 // More space after title

  // Draw Todo Items
  ctx.font = `400 ${itemFontSize}px ${fontName}` // Weight 400 for items
  const doneColor = "#a1a1aa" // Zinc 400 for done items (adjust if needed)

  lines.forEach((item) => {
    const prefix = item.done ? "✓ " : "• " // Checkmark for done
    const itemText = `${prefix}${item.text}`
    let currentTextColor = item.done ? doneColor : textColor
    ctx.fillStyle = currentTextColor
    ctx.globalAlpha = item.done ? 0.75 : 1.0 // Fade done items slightly

    ctx.fillText(itemText, startX, currentY)

    // Strikethrough for done items
    if (item.done) {
      const textMetrics = ctx.measureText(itemText)
      const textWidth = textMetrics.width
      ctx.save()
      ctx.strokeStyle = currentTextColor // Match faded color
      ctx.lineWidth = Math.max(1, Math.round(itemFontSize / 22)) // Adjust line thickness
      ctx.globalAlpha = 0.6 // Make line slightly more transparent than text
      ctx.shadowColor = "transparent" // No shadow on line
      let lineX = startX
      if (textAlign === "center") lineX = startX - textWidth / 2
      else if (textAlign === "right") lineX = startX - textWidth
      ctx.beginPath()
      const strikeY = currentY + itemFontSize * 0.58 // Fine-tune vertical position
      ctx.moveTo(lineX, strikeY)
      ctx.lineTo(lineX + textWidth, strikeY)
      ctx.stroke()
      ctx.restore() // Restore alpha, shadow
    }
    ctx.globalAlpha = 1.0 // Reset alpha for next item
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

function handleSettingChange(event) {
  const target = event.target
  const key = Object.keys(settingsInputs).find(
    (k) => settingsInputs[k] === target
  )

  if (key) {
    let value = target.value
    if (target.type === "number") value = parseInt(value, 10) || 0
    if (target.type === "radio" && target.name === "bg-type") {
      state.backgroundType = value
      updateBackgroundControlsVisibility() // Update visibility immediately
    } else if (key !== "bgTypeColor" && key !== "bgTypeImage") {
      // Avoid direct assignment for radios handled above
      state[key] = value
    }

    // Special handling for color inputs that might fire 'input' rapidly
    if (target.type === "color") {
      // Optional: Debounce this if performance is an issue
      generateTodoImageAndUpdatePreview()
    } else {
      generateTodoImageAndUpdatePreview() // Regenerate for other changes too
    }

    saveState() // Save on any valid setting change
    console.log(`Setting ${key} changed to:`, value)
  } else if (event.target.name === "bg-type") {
    // Catch radio change specifically if missed by above
    state.backgroundType = event.target.value
    updateBackgroundControlsVisibility()
    generateTodoImageAndUpdatePreview()
    saveState()
    console.log(`Setting backgroundType changed to:`, state.backgroundType)
  }
}

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
    toggleSettingsBtn.title = "Open Settings Panel"
    toggleSettingsBtn.setAttribute("aria-expanded", "false")
  } else {
    settingsIconOpen.classList.remove("hidden")
    settingsIconClose.classList.add("hidden")
    toggleSettingsBtn.title = "Close Settings Panel"
    toggleSettingsBtn.setAttribute("aria-expanded", "true")
  }
}

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
    deleteTodo(todoId)
    // Animate removal (optional but nice UX)
    todoItem.style.opacity = "0"
    todoItem.style.transform = "translateX(-20px)"
    todoItem.style.transition = "opacity 0.3s ease, transform 0.3s ease"
    setTimeout(() => {
      renderTodoList() // Re-render list after animation
      generateTodoImageAndUpdatePreview()
      saveState()
    }, 300)
  }
}

// Modal: Open
function openModal() {
  addTodoModal.classList.remove("hidden")
  // Delay focus slightly to allow transition
  setTimeout(() => modalTodoInput.focus(), 50)
}

// Modal: Close
function closeModal() {
  // Add animation class if needed, then hide
  addTodoModal.classList.add("hidden")
  modalTodoInput.value = "" // Clear input on close
}

// Modal: Form Submit
function handleModalSubmit(event) {
  event.preventDefault()
  const newTodoText = modalTodoInput.value
  if (addTodo(newTodoText)) {
    renderTodoList()
    generateTodoImageAndUpdatePreview()
    saveState()
    closeModal()
  } else {
    // Optional: Add error indication to modal input
    console.warn("Attempted to add empty task from modal.")
    modalTodoInput.focus() // Keep focus if invalid
    // Shake animation example:
    modalTodoInput.classList.add("shake-animation")
    setTimeout(() => modalTodoInput.classList.remove("shake-animation"), 500)
    // Add @keyframes shake-animation in CSS
  }
}

// Image Handling (Mostly unchanged, ensure selectors match)
function updateBackgroundControlsVisibility() {
  const isImage = state.backgroundType === "image"
  settingsInputs.bgColorControls.classList.toggle("hidden", isImage)
  settingsInputs.bgImageControls.classList.toggle("hidden", !isImage)
}

function handleImageFileSelect(event) {
  const file = event.target.files[0]
  if (!file) return
  // Validation (unchanged)
  if (!file.type.startsWith("image/")) {
    alert("Please select a valid image file.")
    return
  }
  if (file.size > 15 * 1024 * 1024) {
    alert("Image file too large (max 15MB).")
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
  settingsInputs.imageFileInput.value = "" // Reset file input
  // Switch back to color mode
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

// Apply Wallpaper (unchanged core logic, check button ID)
async function handleApplyWallpaper() {
  if (!state.lastGeneratedImageDataUrl) {
    alert("No preview available to apply.")
    return
  }
  applyWallpaperBtn.disabled = true
  const originalText = applyWallpaperBtn.querySelector("span").textContent
  applyWallpaperBtn.querySelector("span").textContent = "Applying..."

  try {
    const result = await window.electronAPI.updateWallpaper(
      state.lastGeneratedImageDataUrl
    )
    if (result.success) {
      console.log("Wallpaper update successful.")
      applyWallpaperBtn.querySelector("span").textContent = "Applied!"
      // Change back after a delay
      setTimeout(() => {
        applyWallpaperBtn.querySelector("span").textContent = originalText
        applyWallpaperBtn.disabled = false
      }, 2000)
    } else {
      throw new Error(result.error || "Unknown error from main process")
    }
  } catch (err) {
    console.error("Wallpaper update failed:", err)
    alert(`Failed to apply wallpaper:\n${err.message}`)
    applyWallpaperBtn.querySelector("span").textContent = originalText // Reset on error
    applyWallpaperBtn.disabled = false
  }
  // No finally block needed as success case handles reset now
}

// --- Start the application ---
initialize()

// CSS for Shake Animation (add to style.css if using)
/*
@keyframes shake-animation {
  10%, 90% { transform: translateX(-1px); }
  20%, 80% { transform: translateX(2px); }
  30%, 50%, 70% { transform: translateX(-3px); }
  40%, 60% { transform: translateX(3px); }
}
.shake-animation {
    animation: shake-animation 0.5s ease-in-out;
}
*/
