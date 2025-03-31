// --- DOM Elements ---
const newTodoInput = document.getElementById("new-todo-input")
const addTodoBtn = document.getElementById("add-todo-btn")
const todoListUl = document.getElementById("todo-list")
const bgColorInput = document.getElementById("bg-color")
const textColorInput = document.getElementById("text-color")
const textPositionSelect = document.getElementById("text-position")
const fontSizeInput = document.getElementById("font-size") // New
const offsetXInput = document.getElementById("offset-x") // New
const offsetYInput = document.getElementById("offset-y") // New
const previewAreaImg = document.getElementById("preview-area")
const applyWallpaperBtn = document.getElementById("apply-wallpaper-btn")

const canvas = document.getElementById("image-canvas") // Hidden canvas for generation
const ctx = canvas.getContext("2d")

// --- Application State ---
let state = {
  todos: [], // Array of { id: number, text: string, done: boolean }
  bgColor: "#2a2a2a", // Default dark background
  textColor: "#eeeeee", // Default light text
  textPosition: "top-left", // default
  fontSize: 48, // Default font size
  offsetX: 0, // Default offset X
  offsetY: 0, // Default offset Y
  lastGeneratedImageDataUrl: null, // Store the latest generated image data
}

// --- Initialization ---
function initialize() {
  loadState() // Load previous state FIRST

  // Set initial values for controls FROM the loaded or default state
  bgColorInput.value = state.bgColor
  textColorInput.value = state.textColor
  fontSizeInput.value = state.fontSize
  textPositionSelect.value = state.textPosition
  offsetXInput.value = state.offsetX
  offsetYInput.value = state.offsetY

  // Initial render of UI elements based on state
  renderTodoList()
  generateTodoImageAndUpdatePreview() // Generate initial preview

  // Add Event Listeners
  addTodoBtn.addEventListener("click", handleAddTodo)
  newTodoInput.addEventListener("keypress", (e) => {
    // Allow adding todo by pressing Enter in the input field
    if (e.key === "Enter") handleAddTodo()
  })
  // Single handler for all setting changes
  bgColorInput.addEventListener("input", handleSettingChange)
  textColorInput.addEventListener("input", handleSettingChange)
  fontSizeInput.addEventListener("input", handleSettingChange)
  textPositionSelect.addEventListener("change", handleSettingChange)
  offsetXInput.addEventListener("input", handleSettingChange)
  offsetYInput.addEventListener("input", handleSettingChange)
  // Button to apply wallpaper
  applyWallpaperBtn.addEventListener("click", handleApplyWallpaper)

  // Event delegation for todo list items (delete, toggle done)
  todoListUl.addEventListener("click", handleListClick)

  console.log("Renderer initialized.")
}

// --- State Management (LocalStorage) ---
function saveState() {
  try {
    // Convert the entire state object to a JSON string and save it
    localStorage.setItem("todoAppState", JSON.stringify(state))
    console.log("State saved.")
  } catch (e) {
    console.error("Failed to save state:", e)
    // Optional: Notify user if saving fails critically
  }
}

function loadState() {
  try {
    const savedState = localStorage.getItem("todoAppState")
    if (savedState) {
      const parsedState = JSON.parse(savedState)
      // Merge saved state with defaults to ensure all keys exist even if state was saved before new keys were added
      state = { ...state, ...parsedState }
      // Ensure todos array exists and is an array
      state.todos = Array.isArray(state.todos) ? state.todos : []
      console.log("State loaded:", state)
    } else {
      console.log("No saved state found, using defaults.")
      // No need to reset state here, defaults are already set
    }
  } catch (e) {
    console.error("Failed to load or parse state:", e)
    // Optionally reset to defaults if loading fails, or just proceed with defaults
    // state = { ... }; // Reset if necessary
  }
}

// --- Todo CRUD Functions ---
function addTodo(text) {
  const trimmedText = text.trim()
  if (trimmedText) {
    state.todos.push({
      id: Date.now(), // Simple unique ID based on timestamp
      text: trimmedText,
      done: false,
    })
    return true // Indicate success
  }
  return false // Indicate failure (empty text)
}

function deleteTodo(id) {
  // Filter out the todo item with the matching ID
  state.todos = state.todos.filter((todo) => todo.id !== id)
}

function toggleDone(id) {
  // Map over the todos, find the one with the matching ID, and flip its 'done' status
  state.todos = state.todos.map((todo) =>
    todo.id === id ? { ...todo, done: !todo.done } : todo
  )
}

// --- UI Update Functions ---
function renderTodoList() {
  todoListUl.innerHTML = "" // Clear existing list items
  if (!Array.isArray(state.todos)) {
    console.error("State.todos is not an array!", state.todos)
    state.todos = [] // Attempt recovery
    return
  }
  state.todos.forEach((todo) => {
    const li = document.createElement("li")
    li.dataset.id = todo.id // Store id on the element for later retrieval
    if (todo.done) {
      li.classList.add("done") // Add 'done' class for styling
    }

    const checkbox = document.createElement("input")
    checkbox.type = "checkbox"
    checkbox.checked = todo.done
    checkbox.classList.add("toggle-done") // Class to identify the checkbox for event delegation

    const textSpan = document.createElement("span")
    textSpan.textContent = todo.text
    textSpan.classList.add("todo-text")

    const deleteBtn = document.createElement("button")
    deleteBtn.textContent = "Delete"
    deleteBtn.classList.add("delete-btn") // Class to identify the button for event delegation

    // Append elements to the list item
    li.appendChild(checkbox)
    li.appendChild(textSpan)
    li.appendChild(deleteBtn)
    // Append the list item to the unordered list
    todoListUl.appendChild(li)
  })
  console.log("Todo list UI updated.")
}

// --- Image Generation and Preview ---
function generateTodoImageAndUpdatePreview() {
  console.log("Generating preview with state:", state)
  // Read current settings from state
  const bgColor = state.bgColor
  const textColor = state.textColor
  const position = state.textPosition
  const itemFontSize = parseInt(state.fontSize, 10) || 48 // Use state font size, fallback to 48
  const offsetX = parseInt(state.offsetX, 10) || 0 // Use state offset X, fallback to 0
  const offsetY = parseInt(state.offsetY, 10) || 0 // Use state offset Y, fallback to 0
  const lines = state.todos.map((todo) => ({
    // Create objects with text and done status for drawing
    text: todo.text,
    done: todo.done,
  }))

  // Canvas Settings from state or defaults
  const canvasWidth = canvas.width // e.g., 1920
  const canvasHeight = canvas.height // e.g., 1080
  const fontName = "Roboto" // Consider making this configurable later
  const titleFontSize = Math.round(itemFontSize * 1.25) // Title slightly larger than items
  const padding = 80 // Base padding from edges
  const lineSpacing = Math.round(itemFontSize * 0.4) // Spacing relative to font size
  const title = "My To-Do List" // You could make this configurable too

  // 1. Clear canvas and set background color
  ctx.fillStyle = bgColor
  ctx.fillRect(0, 0, canvasWidth, canvasHeight)

  // --- Calculate Text Position ---
  let startX, startY
  let textAlign = "left"
  let textBaseline = "top" // Use 'top' for consistent positioning calculation

  // Estimate total text height required for positioning calculations
  let totalTextHeight = titleFontSize + lineSpacing * 2 // Title height + spacing after it
  totalTextHeight += lines.length * (itemFontSize + lineSpacing) // Add height for each todo item + spacing

  // Calculate base X, Y coordinates based on the selected position string
  switch (position) {
    case "top-left":
      startX = padding
      startY = padding
      textAlign = "left"
      break
    case "top-center":
      startX = canvasWidth / 2
      startY = padding
      textAlign = "center"
      break
    case "center-left":
      startX = padding
      startY = canvasHeight / 2 - totalTextHeight / 2
      textAlign = "left"
      break
    case "center":
      startX = canvasWidth / 2
      startY = canvasHeight / 2 - totalTextHeight / 2
      textAlign = "center"
      break
    case "bottom-left":
      startX = padding
      startY = canvasHeight - padding - totalTextHeight
      textAlign = "left"
      break
    case "bottom-center":
      startX = canvasWidth / 2
      startY = canvasHeight - padding - totalTextHeight
      textAlign = "center"
      break
    case "bottom-right":
      startX = canvasWidth - padding
      startY = canvasHeight - padding - totalTextHeight
      textAlign = "right"
      break
    default:
      startX = padding
      startY = padding
      textAlign = "left" // Default to top-left
  }

  // Apply User-Defined Offsets
  startX += offsetX
  startY += offsetY

  // Set canvas context properties for text drawing
  ctx.textAlign = textAlign
  ctx.textBaseline = textBaseline // Draw text starting from the top edge

  // --- Draw Text ---
  let currentY = startY // Initialize Y position for drawing

  // Draw Title
  ctx.fillStyle = textColor // Use selected text color
  ctx.font = `bold ${titleFontSize}px ${fontName}` // Set title font style
  ctx.fillText(title, startX, currentY)
  currentY += titleFontSize + lineSpacing * 2 // Move Y down past the title and spacing

  // Draw Todo Items
  ctx.font = `normal ${itemFontSize}px ${fontName}` // Set item font style using state font size
  lines.forEach((item) => {
    const itemText = `• ${item.text}` // Prepend bullet point
    let currentTextColor = textColor // Base text color for item

    // Handle visual style for 'done' items
    if (item.done) {
      currentTextColor = "#999999" // Use a dimmer color for done items (adjust for theme)
      // Strikethrough (Optional): Draw a line manually if desired
      // const textMetrics = ctx.measureText(itemText);
      // const textWidth = textMetrics.width;
      // ctx.save();
      // ctx.strokeStyle = currentTextColor;
      // ctx.lineWidth = Math.max(1, Math.round(itemFontSize / 20));
      // let lineX = startX;
      // if (textAlign === 'center') lineX = startX - textWidth / 2;
      // else if (textAlign === 'right') lineX = startX - textWidth;
      // ctx.beginPath();
      // // Adjust Y position for strikethrough based on baseline and font size
      // const strikeY = currentY + itemFontSize * 0.6; // Approximation for middle
      // ctx.moveTo(lineX, strikeY);
      // ctx.lineTo(lineX + textWidth, strikeY);
      // ctx.stroke();
      // ctx.restore();
    }

    ctx.fillStyle = currentTextColor // Set the fill color (handles 'done' state)
    ctx.fillText(itemText, startX, currentY) // Draw the todo item text
    currentY += itemFontSize + lineSpacing // Move Y down for the next line
  })

  // --- Update Preview Image ---
  try {
    // Generate data URL from the canvas
    const imageDataUrl = canvas.toDataURL("image/png")
    // Store it in state (needed for the Apply button)
    state.lastGeneratedImageDataUrl = imageDataUrl
    // Update the src attribute of the preview img tag
    previewAreaImg.src = state.lastGeneratedImageDataUrl
    console.log("Canvas updated, preview refreshed.")
  } catch (error) {
    console.error("Error generating image data for preview:", error)
    previewAreaImg.src = "" // Clear preview on error
    state.lastGeneratedImageDataUrl = null
  }
}

// --- Event Handlers ---
function handleAddTodo() {
  if (addTodo(newTodoInput.value)) {
    // Call addTodo, check if successful
    newTodoInput.value = "" // Clear input field
    renderTodoList() // Update the list display in the UI
    generateTodoImageAndUpdatePreview() // Update the wallpaper preview
    saveState() // Save the updated state
  } else {
    // Optional: Provide feedback if input was empty
    // alert("Please enter some text for the todo.");
    console.warn("Attempted to add empty todo.")
  }
}

// Single handler for changes in any wallpaper setting input
function handleSettingChange() {
  // Update state from the current values of the controls
  state.bgColor = bgColorInput.value
  state.textColor = textColorInput.value
  state.fontSize = parseInt(fontSizeInput.value, 10) || 48 // Parse int, provide fallback
  state.textPosition = textPositionSelect.value
  state.offsetX = parseInt(offsetXInput.value, 10) || 0 // Parse int, provide fallback
  state.offsetY = parseInt(offsetYInput.value, 10) || 0 // Parse int, provide fallback

  // Regenerate preview with new settings
  generateTodoImageAndUpdatePreview()
  // Save the changed settings
  saveState()
  console.log("Settings changed and saved:", state)
}

// Handler for clicks within the todo list (uses event delegation)
function handleListClick(event) {
  const target = event.target // The specific element that was clicked
  const li = target.closest("li") // Find the closest parent 'li' element

  // If the click wasn't inside an 'li' or the 'li' has no ID, ignore
  if (!li || !li.dataset.id) return

  const todoId = parseInt(li.dataset.id, 10) // Get the ID from the 'data-id' attribute

  // Check if the Delete button was clicked
  if (target.classList.contains("delete-btn")) {
    // Optional: Confirmation dialog
    // if (confirm(`Are you sure you want to delete this todo?\n"${state.todos.find(t=>t.id===todoId)?.text}"`)) {
    deleteTodo(todoId) // Call delete function
    renderTodoList() // Update UI list
    generateTodoImageAndUpdatePreview() // Update preview
    saveState() // Save changes
    // }
  }
  // Check if the checkbox or the text span was clicked to toggle 'done' status
  else if (
    target.classList.contains("toggle-done") ||
    target.classList.contains("todo-text")
  ) {
    toggleDone(todoId) // Call toggle function
    renderTodoList() // Update UI list (handles adding/removing 'done' class)
    generateTodoImageAndUpdatePreview() // Update preview (handles visual change for done items)
    saveState() // Save changes
  }
}

// Handler for the "Apply as Wallpaper" button
async function handleApplyWallpaper() {
  // Check if there is image data generated and stored
  if (!state.lastGeneratedImageDataUrl) {
    alert(
      "No preview available to apply. Please add some todos or change settings."
    )
    console.error("Apply Wallpaper clicked, but no image data available.")
    return
  }

  console.log("Sending image data to main process for wallpaper update...")
  // Provide visual feedback to the user
  applyWallpaperBtn.textContent = "Applying..."
  applyWallpaperBtn.disabled = true

  try {
    // Call the function exposed from the main process via preload script
    const result = await window.electronAPI.updateWallpaper(
      state.lastGeneratedImageDataUrl
    )
    // Check the result returned from the main process
    if (result.success) {
      console.log(
        "Renderer received confirmation: Wallpaper update successful."
      )
      // Optional: Show a temporary success message to the user
    } else {
      console.error(
        "Renderer received error during wallpaper update:",
        result.error
      )
      alert(`Failed to apply wallpaper:\n${result.error}`) // Show error from main process
    }
  } catch (err) {
    // Catch errors related to the IPC communication itself
    console.error("Renderer IPC error during wallpaper update:", err)
    alert(
      `An error occurred while communicating with the main process:\n${err.message}`
    )
  } finally {
    // Reset button state regardless of success or failure
    applyWallpaperBtn.textContent = "Apply as Wallpaper"
    applyWallpaperBtn.disabled = false
  }
}

// --- Start the application ---
initialize() // Call the initialization function when the script loads
