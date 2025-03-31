const quickAddInput = document.getElementById("quick-add-input")
const quickAddForm = document.getElementById("quick-add-form")
const activeListUl = document.getElementById("quick-active-list")
const completedListUl = document.getElementById("quick-completed-list")

let allTodos = [] // Store received todos

// 1. Listen for initial todos from main process
window.electronAPI.onInitialTodos((todos) => {
  console.log("QuickAdd: Received initial todos", todos)
  allTodos = Array.isArray(todos) ? todos : []
  renderQuickAddTodos()
})

// 2. Render received todos into lists
function renderQuickAddTodos() {
  activeListUl.innerHTML = "" // Clear placeholders/old items
  completedListUl.innerHTML = ""

  const activeTodos = allTodos.filter((t) => !t.done)
  const completedTodos = allTodos.filter((t) => t.done)

  if (activeTodos.length === 0) {
    activeListUl.innerHTML = '<li class="empty-message">No active tasks</li>'
  } else {
    activeTodos.forEach((todo) =>
      activeListUl.appendChild(createQuickTodoElement(todo))
    )
  }

  if (completedTodos.length === 0) {
    completedListUl.innerHTML =
      '<li class="empty-message">No completed tasks</li>'
  } else {
    completedTodos.forEach((todo) =>
      completedListUl.appendChild(createQuickTodoElement(todo))
    )
  }
}

// Helper to create list item HTML for the overlay
function createQuickTodoElement(todo) {
  const li = document.createElement("li")
  li.className = "quick-task-item"
  if (todo.done) {
    li.classList.add("done")
  }
  // Note: We are making these non-interactive for simplicity in the quick add overlay
  li.innerHTML = `
        <div class="checkbox"></div>
        <span class="text">${escapeHTML(todo.text)}</span>
    `
  return li
}

// Basic HTML escaping helper
function escapeHTML(str) {
  const div = document.createElement("div")
  div.appendChild(document.createTextNode(str))
  return div.innerHTML
}

// 3. Handle adding a NEW task
quickAddForm.addEventListener("submit", (event) => {
  event.preventDefault()
  const taskText = quickAddInput.value.trim()
  if (taskText && window.electronAPI?.sendTaskToMain) {
    console.log("QuickAdd: Sending new task:", taskText)
    window.electronAPI.sendTaskToMain(taskText) // Send ONLY the new task text
    quickAddInput.value = ""
    // Main process will close the window after receiving the task and telling main renderer
  } else {
    console.error("QuickAdd: API not available or task is empty.")
    // Optionally provide visual feedback (e.g., shake input)
  }
})

// 4. Close window on Escape key press
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    if (window.electronAPI?.closeQuickAddWindow) {
      window.electronAPI.closeQuickAddWindow()
    } else {
      window.close() // Fallback
    }
  }
})

// 5. Request initial todos when ready (moved from main process push)
window.addEventListener("DOMContentLoaded", () => {
  quickAddInput.focus()
  console.log("QuickAdd: Requesting initial todos from main process...")
  if (window.electronAPI?.requestTodosForOverlay) {
    window.electronAPI.requestTodosForOverlay() // Ask main to get todos from main window
  } else {
    console.error("QuickAdd: requestTodosForOverlay API not available.")
    renderQuickAddTodos() // Render empty lists if API fails
  }
})

console.log("Quick Add Renderer loaded.")
