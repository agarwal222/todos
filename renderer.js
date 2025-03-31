// --- DOM Elements ---
const newTodoInput = document.getElementById("new-todo-input")
const addTodoBtn = document.getElementById("add-todo-btn")
const todoListUl = document.getElementById("todo-list")

// Settings Elements
const wallpaperTitleInput = document.getElementById("wallpaper-title-input")
const bgTypeColorRadio = document.getElementById("bg-type-color")
const bgTypeImageRadio = document.getElementById("bg-type-image")
const bgColorControls = document.getElementById("bg-color-controls")
const bgColorInput = document.getElementById("bg-color")
const bgImageControls = document.getElementById("bg-image-controls")
const chooseImageBtn = document.getElementById("choose-image-btn")
const imageFileInput = document.getElementById("image-file-input")
const imageFilenameSpan = document.getElementById("image-filename")
const clearImageBtn = document.getElementById("clear-image-btn")
const textColorInput = document.getElementById("text-color")
const textPositionSelect = document.getElementById("text-position")
const fontSizeInput = document.getElementById("font-size")
const textAlignSelect = document.getElementById("text-align-select")
const offsetXInput = document.getElementById("offset-x")
const offsetYInput = document.getElementById("offset-y")

// Preview/Apply Elements
const previewAreaImg = document.getElementById("preview-area")
const applyWallpaperBtn = document.getElementById("apply-wallpaper-btn")

const canvas = document.getElementById("image-canvas")
const ctx = canvas.getContext("2d")

// --- Application State ---
let state = {
  todos: [],
  title: "My To-Do List", // Default title
  backgroundType: "color", // 'color' or 'image'
  bgColor: "#2a2a2a",
  backgroundImageDataUrl: null, // Store base64 data URL of the image
  backgroundImageName: null, // Store the original filename for display
  textColor: "#eeeeee",
  textPosition: "top-left",
  fontSize: 48,
  textAlign: "left",
  offsetX: 0,
  offsetY: 0,
  lastGeneratedImageDataUrl: null,
}

// --- Initialization ---
function initialize() {
  loadState() // Load previous state FIRST

  // Set initial values for controls FROM the loaded or default state
  wallpaperTitleInput.value = state.title
  bgColorInput.value = state.bgColor
  textColorInput.value = state.textColor
  fontSizeInput.value = state.fontSize
  textPositionSelect.value = state.textPosition
  textAlignSelect.value = state.textAlign
  offsetXInput.value = state.offsetX
  offsetYInput.value = state.offsetY

  // Set background type radio and visibility
  if (state.backgroundType === "image") {
    bgTypeImageRadio.checked = true
    bgColorControls.style.display = "none"
    bgImageControls.style.display = "flex" // Use flex for control-group
    imageFilenameSpan.textContent =
      state.backgroundImageName || "No file chosen"
  } else {
    bgTypeColorRadio.checked = true
    bgColorControls.style.display = "flex" // Use flex for control-group
    bgImageControls.style.display = "none"
  }

  // Initial render of UI elements based on state
  renderTodoList()
  generateTodoImageAndUpdatePreview() // Generate initial preview

  // --- Add Event Listeners ---

  // Todo List
  addTodoBtn.addEventListener("click", handleAddTodo)
  newTodoInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") handleAddTodo()
  })
  todoListUl.addEventListener("click", handleListClick)

  // Settings Changes (trigger preview update & save)
  wallpaperTitleInput.addEventListener("input", handleSettingChange)
  bgColorInput.addEventListener("input", handleSettingChange)
  textColorInput.addEventListener("input", handleSettingChange)
  fontSizeInput.addEventListener("input", handleSettingChange)
  textPositionSelect.addEventListener("change", handleSettingChange)
  textAlignSelect.addEventListener("change", handleSettingChange)
  offsetXInput.addEventListener("input", handleSettingChange)
  offsetYInput.addEventListener("input", handleSettingChange)

  // Background Type Selection
  bgTypeColorRadio.addEventListener("change", handleBackgroundTypeChange)
  bgTypeImageRadio.addEventListener("change", handleBackgroundTypeChange)

  // Background Image Selection
  chooseImageBtn.addEventListener("click", () => imageFileInput.click())
  imageFileInput.addEventListener("change", handleImageFileSelect)
  clearImageBtn.addEventListener("click", handleClearImage)

  // Apply Button
  applyWallpaperBtn.addEventListener("click", handleApplyWallpaper)

  console.log("Renderer initialized.")
}

// --- State Management (LocalStorage) ---
function saveState() {
  try {
    localStorage.setItem("todoAppState", JSON.stringify(state))
    console.log("State saved.")
  } catch (e) {
    console.error("Failed to save state:", e)
    if (e.name === "QuotaExceededError") {
      alert(
        "Could not save settings. The selected background image might be too large to store locally. Please choose a smaller image or use a background color."
      )
      // Optionally clear the image data to allow saving other settings
      // state.backgroundImageDataUrl = null;
      // state.backgroundImageName = null;
      // localStorage.setItem("todoAppState", JSON.stringify(state)); // Try saving again without image
    }
  }
}

function loadState() {
  try {
    const savedState = localStorage.getItem("todoAppState")
    if (savedState) {
      const parsedState = JSON.parse(savedState)
      // Merge saved state with defaults
      state = { ...state, ...parsedState }
      state.todos = Array.isArray(state.todos) ? state.todos : []
      console.log("State loaded:", state)
    } else {
      console.log("No saved state found, using defaults.")
    }
  } catch (e) {
    console.error("Failed to load or parse state:", e)
  }
}

// --- Todo CRUD Functions ---
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
  state.todos = state.todos.map((todo) =>
    todo.id === id ? { ...todo, done: !todo.done } : todo
  )
}

// --- UI Update Functions ---
function renderTodoList() {
  todoListUl.innerHTML = ""
  if (!Array.isArray(state.todos)) {
    console.error("State.todos is not an array!", state.todos)
    state.todos = []
    return
  }
  state.todos.forEach((todo) => {
    const li = document.createElement("li")
    li.dataset.id = todo.id
    if (todo.done) {
      li.classList.add("done")
    }

    const checkbox = document.createElement("input")
    checkbox.type = "checkbox"
    checkbox.checked = todo.done
    checkbox.classList.add("toggle-done")

    const textSpan = document.createElement("span")
    textSpan.textContent = todo.text
    textSpan.classList.add("todo-text")

    const deleteBtn = document.createElement("button")
    deleteBtn.textContent = "Delete"
    deleteBtn.classList.add("delete-btn")

    li.appendChild(checkbox)
    li.appendChild(textSpan)
    li.appendChild(deleteBtn)
    todoListUl.appendChild(li)
  })
  console.log("Todo list UI updated.")
}

// --- Image Generation and Preview ---
// Make async because loading the background image is async
async function generateTodoImageAndUpdatePreview() {
  console.log("Generating preview with state:", state)

  // Read current settings from state
  const title = state.title || "To-Do List" // Use state title or default
  const backgroundType = state.backgroundType
  const bgColor = state.bgColor
  const bgImageDataUrl = state.backgroundImageDataUrl
  const textColor = state.textColor
  const align = state.textAlign
  const position = state.textPosition
  const itemFontSize = parseInt(state.fontSize, 10) || 48
  const offsetX = parseInt(state.offsetX, 10) || 0
  const offsetY = parseInt(state.offsetY, 10) || 0
  const lines = state.todos.map((todo) => ({
    text: todo.text,
    done: todo.done,
  }))

  // Canvas Settings
  const canvasWidth = canvas.width
  const canvasHeight = canvas.height
  const fontName = "Roboto"
  const titleFontSize = Math.round(itemFontSize * 1.25)
  const padding = 80
  const lineSpacing = Math.round(itemFontSize * 0.4)

  // --- 1. Draw Background (Color or Image) ---
  ctx.clearRect(0, 0, canvasWidth, canvasHeight) // Clear previous content

  if (backgroundType === "image" && bgImageDataUrl) {
    try {
      const img = new Image()
      // Use a Promise to wait for the image to load
      await new Promise((resolve, reject) => {
        img.onload = () => resolve()
        img.onerror = (err) =>
          reject(new Error("Failed to load background image."))
        img.src = bgImageDataUrl
      })
      // Draw the image scaled to fit the canvas
      ctx.drawImage(img, 0, 0, canvasWidth, canvasHeight)
      console.log("Background image drawn.")
    } catch (error) {
      console.error(error.message)
      // Fallback to background color on error
      ctx.fillStyle = bgColor
      ctx.fillRect(0, 0, canvasWidth, canvasHeight)
      console.log("Fell back to background color.")
      // Optionally notify user or update state?
      // state.backgroundType = 'color';
      // state.backgroundImageDataUrl = null;
      // state.backgroundImageName = null;
      // updateBackgroundControlsVisibility(); // Refresh UI if state changed
    }
  } else {
    // Default to background color
    ctx.fillStyle = bgColor
    ctx.fillRect(0, 0, canvasWidth, canvasHeight)
    console.log("Background color drawn.")
  }

  // --- 2. Calculate Text Position ---
  let startX, startY
  let textBaseline = "top"

  let totalTextHeight = titleFontSize + lineSpacing * 2
  totalTextHeight += lines.length * (itemFontSize + lineSpacing)

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
      startY = canvasHeight / 2 - totalTextHeight / 2
      break
    case "center":
      startX = canvasWidth / 2
      startY = canvasHeight / 2 - totalTextHeight / 2
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

  startX += offsetX
  startY += offsetY

  ctx.textAlign = align
  ctx.textBaseline = textBaseline

  // --- 3. Draw Text ---
  let currentY = startY

  // Draw Title
  ctx.fillStyle = textColor
  ctx.font = `bold ${titleFontSize}px ${fontName}`
  ctx.fillText(title, startX, currentY)
  currentY += titleFontSize + lineSpacing * 2

  // Draw Todo Items
  ctx.font = `normal ${itemFontSize}px ${fontName}`
  lines.forEach((item) => {
    const prefix = item.done ? "✓ " : "• " // Use checkmark for done items
    const itemText = `${prefix}${item.text}`
    let currentTextColor = textColor
    let currentTextStyle = `normal ${itemFontSize}px ${fontName}` // Base style

    if (item.done) {
      currentTextColor = "#aaa" // More pronounced fade for done items
      // Optional: Slightly smaller font for done items
      // currentTextStyle = `normal ${Math.round(itemFontSize * 0.95)}px ${fontName}`;
      ctx.font = currentTextStyle // Apply potentially different font style

      // Strikethrough
      const textMetrics = ctx.measureText(itemText) // Measure with potentially new font
      const textWidth = textMetrics.width
      ctx.save()
      ctx.strokeStyle = currentTextColor // Use the faded color for the line
      ctx.lineWidth = Math.max(1, Math.round(itemFontSize / 25)) // Thinner line
      let lineX = startX
      if (align === "center") lineX = startX - textWidth / 2
      else if (align === "right") lineX = startX - textWidth
      ctx.beginPath()
      const strikeY = currentY + itemFontSize * 0.55 // Adjust vertical position
      ctx.moveTo(lineX, strikeY)
      ctx.lineTo(lineX + textWidth, strikeY)
      ctx.stroke()
      ctx.restore()
    } else {
      ctx.font = currentTextStyle // Ensure regular font is set if not done
    }

    ctx.fillStyle = currentTextColor
    ctx.fillText(itemText, startX, currentY)
    currentY += itemFontSize + lineSpacing // Use base font size for spacing consistency
  })

  // --- 4. Update Preview Image ---
  try {
    const imageDataUrl = canvas.toDataURL("image/png")
    state.lastGeneratedImageDataUrl = imageDataUrl
    previewAreaImg.src = state.lastGeneratedImageDataUrl // Update preview
    console.log("Canvas updated, preview refreshed.")
  } catch (error) {
    console.error("Error generating image data for preview:", error)
    previewAreaImg.src = ""
    state.lastGeneratedImageDataUrl = null
  }
}

// --- Event Handlers ---
function handleAddTodo() {
  if (addTodo(newTodoInput.value)) {
    newTodoInput.value = ""
    renderTodoList()
    generateTodoImageAndUpdatePreview()
    saveState()
  } else {
    console.warn("Attempted to add empty todo.")
  }
}

// Consolidated handler for simple setting changes
function handleSettingChange() {
  state.title = wallpaperTitleInput.value
  state.bgColor = bgColorInput.value
  state.textColor = textColorInput.value
  state.fontSize = parseInt(fontSizeInput.value, 10) || 48
  state.textPosition = textPositionSelect.value
  state.textAlign = textAlignSelect.value
  state.offsetX = parseInt(offsetXInput.value, 10) || 0
  state.offsetY = parseInt(offsetYInput.value, 10) || 0

  generateTodoImageAndUpdatePreview()
  saveState()
  console.log("Settings changed and saved:", state)
}

// Handler for background type radio buttons
function handleBackgroundTypeChange(event) {
  state.backgroundType = event.target.value
  updateBackgroundControlsVisibility()
  generateTodoImageAndUpdatePreview() // Update preview immediately
  saveState()
}

// Helper to show/hide background controls
function updateBackgroundControlsVisibility() {
  if (state.backgroundType === "image") {
    bgColorControls.style.display = "none"
    bgImageControls.style.display = "flex"
  } else {
    bgColorControls.style.display = "flex"
    bgImageControls.style.display = "none"
  }
}

// Handler for image file selection
function handleImageFileSelect(event) {
  const file = event.target.files[0]
  if (!file) {
    return // No file selected
  }

  // Basic validation (optional)
  if (!file.type.startsWith("image/")) {
    alert("Please select a valid image file (png, jpg, webp).")
    imageFileInput.value = "" // Reset file input
    return
  }
  if (file.size > 10 * 1024 * 1024) {
    // Example: 10MB limit
    alert("Image file is too large (max 10MB). Please choose a smaller file.")
    imageFileInput.value = "" // Reset file input
    return
  }

  const reader = new FileReader()

  reader.onload = (e) => {
    state.backgroundImageDataUrl = e.target.result // Store base64 data URL
    state.backgroundImageName = file.name // Store filename for display
    imageFilenameSpan.textContent = file.name // Update UI
    generateTodoImageAndUpdatePreview() // Update preview
    saveState() // Save the new image data
  }

  reader.onerror = (err) => {
    console.error("FileReader error:", err)
    alert("Error reading image file.")
    // Reset state if needed
    state.backgroundImageDataUrl = null
    state.backgroundImageName = null
    imageFilenameSpan.textContent = "Error reading file"
    imageFileInput.value = ""
    saveState()
  }

  reader.readAsDataURL(file) // Read file as Data URL
}

// Handler for clearing the selected image
function handleClearImage() {
  state.backgroundImageDataUrl = null
  state.backgroundImageName = null
  imageFilenameSpan.textContent = "No file chosen"
  imageFileInput.value = "" // Clear the file input visually

  // Optionally switch back to color mode, or just let the generator fallback
  // state.backgroundType = 'color';
  // bgTypeColorRadio.checked = true;
  // updateBackgroundControlsVisibility();

  generateTodoImageAndUpdatePreview() // Regenerate with fallback (color)
  saveState()
  console.log("Background image cleared.")
}

// Handler for clicks within the todo list
function handleListClick(event) {
  const target = event.target
  const li = target.closest("li")

  if (!li || !li.dataset.id) return

  const todoId = parseInt(li.dataset.id, 10)

  if (target.classList.contains("delete-btn")) {
    deleteTodo(todoId)
    renderTodoList()
    generateTodoImageAndUpdatePreview()
    saveState()
  } else if (
    target.classList.contains("toggle-done") ||
    target.classList.contains("todo-text")
  ) {
    toggleDone(todoId)
    renderTodoList()
    generateTodoImageAndUpdatePreview()
    saveState()
  }
}

// Handler for "Apply as Wallpaper"
async function handleApplyWallpaper() {
  if (!state.lastGeneratedImageDataUrl) {
    alert("No preview available to apply.")
    return
  }

  console.log("Sending image data to main process...")
  applyWallpaperBtn.textContent = "Applying..."
  applyWallpaperBtn.disabled = true

  try {
    const result = await window.electronAPI.updateWallpaper(
      state.lastGeneratedImageDataUrl
    )
    if (result.success) {
      console.log("Wallpaper update successful.")
    } else {
      console.error("Wallpaper update failed:", result.error)
      alert(`Failed to apply wallpaper:\n${result.error}`)
    }
  } catch (err) {
    console.error("Renderer IPC error:", err)
    alert(`An error occurred while applying wallpaper:\n${err.message}`)
  } finally {
    applyWallpaperBtn.textContent = "Apply as Wallpaper"
    applyWallpaperBtn.disabled = false
  }
}

// --- Start the application ---
initialize()
