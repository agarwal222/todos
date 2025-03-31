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
  title: "My To-Do List",
  backgroundType: "color",
  bgColor: "#1a1a1d", // Updated default bg to match theme
  backgroundImageDataUrl: null,
  backgroundImageName: null,
  textColor: "#e1e1e6", // Updated default text to match theme
  textPosition: "top-left",
  fontSize: 48,
  textAlign: "left",
  offsetX: 0,
  offsetY: 0,
  lastGeneratedImageDataUrl: null,
}

// --- Initialization ---
function initialize() {
  loadState()

  // Set initial values from state
  wallpaperTitleInput.value = state.title
  bgColorInput.value = state.bgColor
  textColorInput.value = state.textColor
  fontSizeInput.value = state.fontSize
  textPositionSelect.value = state.textPosition
  textAlignSelect.value = state.textAlign
  offsetXInput.value = state.offsetX
  offsetYInput.value = state.offsetY

  // Set background type UI
  if (state.backgroundType === "image") {
    bgTypeImageRadio.checked = true
    imageFilenameSpan.textContent =
      state.backgroundImageName || "No file chosen"
  } else {
    bgTypeColorRadio.checked = true
  }
  updateBackgroundControlsVisibility() // Use helper to set visibility

  // Initial Render
  renderTodoList()
  generateTodoImageAndUpdatePreview()

  // --- Event Listeners ---

  // Todo List
  addTodoBtn.addEventListener("click", handleAddTodo)
  newTodoInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") handleAddTodo()
  })
  todoListUl.addEventListener("click", handleListClick)

  // Keyboard Shortcut (Ctrl+N)
  document.addEventListener("keydown", (event) => {
    if (event.ctrlKey && event.key === "n") {
      event.preventDefault() // Prevent default browser action (new window)
      newTodoInput.focus() // Focus the input field
      console.log("Ctrl+N pressed, focusing input.")
    }
  })

  // Settings Changes
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
    }
  }
}

function loadState() {
  try {
    const savedState = localStorage.getItem("todoAppState")
    if (savedState) {
      const parsedState = JSON.parse(savedState)
      // Use defaults as base and merge saved state over it
      state = { ...state, ...parsedState }
      state.todos = Array.isArray(state.todos) ? state.todos : []
      // Ensure loaded background color/text match the theme if not overridden
      state.bgColor = parsedState.bgColor || "#1a1a1d"
      state.textColor = parsedState.textColor || "#e1e1e6"
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
  if (state.todos.length === 0) {
    todoListUl.innerHTML = `<li class="empty-list-message">No tasks yet!</li>` // Placeholder
    // Style .empty-list-message in CSS if desired (e.g., text-align: center; color: var(--text-secondary); padding: var(--spacing-lg);)
    return
  }

  state.todos.forEach((todo) => {
    const li = document.createElement("li")
    li.className = "todo-item" // Use the new class
    li.dataset.id = todo.id
    if (todo.done) {
      li.classList.add("done")
    }

    const checkbox = document.createElement("input")
    checkbox.type = "checkbox"
    checkbox.checked = todo.done
    checkbox.classList.add("toggle-done") // Keep for event delegation logic

    const textSpan = document.createElement("span")
    textSpan.textContent = todo.text
    textSpan.classList.add("todo-text")

    const deleteBtn = document.createElement("button")
    // Use text symbol for delete
    deleteBtn.textContent = "×"
    deleteBtn.className = "button button-danger button-icon delete-btn" // Use new button classes
    deleteBtn.title = "Delete Task"

    li.appendChild(checkbox)
    li.appendChild(textSpan)
    li.appendChild(deleteBtn)
    todoListUl.appendChild(li)
  })
  console.log("Todo list UI updated.")
}

// --- Image Generation and Preview ---
async function generateTodoImageAndUpdatePreview() {
  console.log("Generating preview with state:", state)

  // Read current settings from state
  const title = state.title || "To-Do List"
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
  const fontName = "Roboto" // Already using Roboto from Google Fonts
  const titleFontSize = Math.round(itemFontSize * 1.25)
  const padding = 80 // Adjust padding as needed for aesthetics
  const lineSpacing = Math.round(itemFontSize * 0.5) // Slightly increased line spacing

  // --- 1. Draw Background (Color or Image) ---
  ctx.clearRect(0, 0, canvasWidth, canvasHeight)

  if (backgroundType === "image" && bgImageDataUrl) {
    try {
      const img = new Image()
      await new Promise((resolve, reject) => {
        img.onload = () => resolve()
        img.onerror = (err) =>
          reject(new Error("Failed to load background image."))
        img.src = bgImageDataUrl
      })
      // Draw image covering the canvas, potentially cropping
      const imgAspect = img.width / img.height
      const canvasAspect = canvasWidth / canvasHeight
      let drawWidth, drawHeight, drawX, drawY

      if (imgAspect > canvasAspect) {
        // Image wider than canvas
        drawHeight = canvasHeight
        drawWidth = drawHeight * imgAspect
        drawX = (canvasWidth - drawWidth) / 2 // Center horizontally
        drawY = 0
      } else {
        // Image taller than canvas or same aspect
        drawWidth = canvasWidth
        drawHeight = drawWidth / imgAspect
        drawX = 0
        drawY = (canvasHeight - drawHeight) / 2 // Center vertically
      }
      ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight)
      console.log("Background image drawn (cover).")
    } catch (error) {
      console.error(error.message)
      ctx.fillStyle = bgColor // Fallback
      ctx.fillRect(0, 0, canvasWidth, canvasHeight)
      console.log("Fell back to background color.")
    }
  } else {
    ctx.fillStyle = bgColor
    ctx.fillRect(0, 0, canvasWidth, canvasHeight)
    console.log("Background color drawn.")
  }

  // --- 2. Calculate Text Position ---
  // (Calculation logic remains the same)
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

  // Apply subtle shadow to text for better readability on varied backgrounds
  ctx.shadowColor = "rgba(0, 0, 0, 0.5)"
  ctx.shadowBlur = 5
  ctx.shadowOffsetX = 2
  ctx.shadowOffsetY = 2

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
    const prefix = item.done ? "✓ " : "• "
    const itemText = `${prefix}${item.text}`
    let currentTextColor = textColor
    let currentTextStyle = `normal ${itemFontSize}px ${fontName}`

    if (item.done) {
      currentTextColor = "#a8a8b3" // Use theme's secondary text color
      ctx.font = currentTextStyle // Ensure font is set before measuring/drawing

      // Strikethrough
      const textMetrics = ctx.measureText(itemText)
      const textWidth = textMetrics.width
      ctx.save()
      ctx.strokeStyle = currentTextColor
      ctx.globalAlpha = 0.7 // Make strikethrough slightly transparent
      ctx.lineWidth = Math.max(1, Math.round(itemFontSize / 20)) // Slightly thicker line
      ctx.shadowColor = "transparent" // No shadow on the strikethrough itself
      let lineX = startX
      if (align === "center") lineX = startX - textWidth / 2
      else if (align === "right") lineX = startX - textWidth
      ctx.beginPath()
      const strikeY = currentY + itemFontSize * 0.6 // Adjust vertical position
      ctx.moveTo(lineX, strikeY)
      ctx.lineTo(lineX + textWidth, strikeY)
      ctx.stroke()
      ctx.restore() // Restore alpha and shadow settings
    } else {
      ctx.font = currentTextStyle // Ensure regular font is set if not done
    }

    ctx.fillStyle = currentTextColor
    ctx.fillText(itemText, startX, currentY)
    currentY += itemFontSize + lineSpacing
  })

  // Reset shadow for next draw cycle
  ctx.shadowColor = "transparent"
  ctx.shadowBlur = 0
  ctx.shadowOffsetX = 0
  ctx.shadowOffsetY = 0

  // --- 4. Update Preview Image ---
  try {
    const imageDataUrl = canvas.toDataURL("image/png")
    state.lastGeneratedImageDataUrl = imageDataUrl
    previewAreaImg.src = state.lastGeneratedImageDataUrl
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
    // Optional: Add visual feedback like shaking the input
    newTodoInput.style.animation = "shake 0.5s ease-in-out"
    setTimeout(() => (newTodoInput.style.animation = ""), 500) // Reset animation
    // Add @keyframes shake in CSS if using this
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
  generateTodoImageAndUpdatePreview()
  saveState()
}

// Helper to show/hide background controls using classes
function updateBackgroundControlsVisibility() {
  if (state.backgroundType === "image") {
    bgColorControls.classList.add("hidden")
    bgImageControls.classList.remove("hidden")
  } else {
    bgColorControls.classList.remove("hidden")
    bgImageControls.classList.add("hidden")
  }
}

// Handler for image file selection
function handleImageFileSelect(event) {
  const file = event.target.files[0]
  if (!file) return

  if (!file.type.startsWith("image/")) {
    alert("Please select a valid image file (png, jpg, webp).")
    imageFileInput.value = ""
    return
  }
  if (file.size > 10 * 1024 * 1024) {
    // 10MB limit
    alert("Image file is too large (max 10MB).")
    imageFileInput.value = ""
    return
  }

  const reader = new FileReader()
  reader.onload = (e) => {
    state.backgroundImageDataUrl = e.target.result
    state.backgroundImageName = file.name
    imageFilenameSpan.textContent = file.name
    generateTodoImageAndUpdatePreview()
    saveState()
  }
  reader.onerror = (err) => {
    console.error("FileReader error:", err)
    alert("Error reading image file.")
    state.backgroundImageDataUrl = null
    state.backgroundImageName = null
    imageFilenameSpan.textContent = "Error reading file"
    imageFileInput.value = ""
    saveState()
  }
  reader.readAsDataURL(file)
}

// Handler for clearing the selected image
function handleClearImage() {
  state.backgroundImageDataUrl = null
  state.backgroundImageName = null
  imageFilenameSpan.textContent = "No file chosen"
  imageFileInput.value = ""

  // Recommended: Switch back to color mode explicitly for clarity
  state.backgroundType = "color"
  bgTypeColorRadio.checked = true
  updateBackgroundControlsVisibility()

  generateTodoImageAndUpdatePreview()
  saveState()
  console.log("Background image cleared.")
}

// Handler for clicks within the todo list
function handleListClick(event) {
  const target = event.target
  const li = target.closest(".todo-item") // Target new class

  if (!li || !li.dataset.id) return

  const todoId = parseInt(li.dataset.id, 10)

  // Check for delete button specifically
  if (target.closest(".delete-btn")) {
    // Check parent button too
    deleteTodo(todoId)
    renderTodoList()
    generateTodoImageAndUpdatePreview()
    saveState()
  }
  // Check for checkbox or text click
  else if (
    target.classList.contains("toggle-done") ||
    target.classList.contains("todo-text")
  ) {
    toggleDone(todoId)
    // Instead of full re-render, just toggle the class for better UX
    li.classList.toggle("done", state.todos.find((t) => t.id === todoId)?.done)
    // Update checkbox state directly
    const checkbox = li.querySelector(".toggle-done")
    if (checkbox)
      checkbox.checked = state.todos.find((t) => t.id === todoId)?.done

    generateTodoImageAndUpdatePreview() // Still need to update the image
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
      // Optional: Add subtle success feedback, e.g., button text changes briefly
      applyWallpaperBtn.textContent = "Applied!"
      setTimeout(() => {
        applyWallpaperBtn.textContent = "Apply as Wallpaper"
        applyWallpaperBtn.disabled = false
      }, 1500)
    } else {
      console.error("Wallpaper update failed:", result.error)
      alert(`Failed to apply wallpaper:\n${result.error}`)
      applyWallpaperBtn.textContent = "Apply as Wallpaper" // Reset on failure
      applyWallpaperBtn.disabled = false
    }
  } catch (err) {
    console.error("Renderer IPC error:", err)
    alert(`An error occurred while applying wallpaper:\n${err.message}`)
    applyWallpaperBtn.textContent = "Apply as Wallpaper" // Reset on error
    applyWallpaperBtn.disabled = false
  }
  // Removed finally block as success case handles reset with delay
}

// --- Start the application ---
initialize()

// Optional: Add @keyframes for shake animation in CSS if using it
/*
@keyframes shake {
  10%, 90% { transform: translateX(-1px); }
  20%, 80% { transform: translateX(2px); }
  30%, 50%, 70% { transform: translateX(-4px); }
  40%, 60% { transform: translateX(4px); }
}
*/
