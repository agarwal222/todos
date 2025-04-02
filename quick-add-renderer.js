const quickAddInput = document.getElementById("quick-add-input")
const quickAddForm = document.getElementById("quick-add-form")
const taskListsContainer = document.getElementById("task-lists-container")

let allTodos = []

// Icons for tasks
const circleIconSVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" class="checkbox-icon"><path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14Zm0-1.5A5.5 5.5 0 1 1 8 2.5a5.5 5.5 0 0 1 0 11Z"></path></svg>`
const checkCircleIconSVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" class="checkbox-icon"><path fill-rule="evenodd" d="M8 15A7 7 0 1 0 8 1a7 7 0 0 0 0 14Zm3.84-9.12a.75.75 0 0 0-1.18-.94l-2.97 2.97-1.22-1.22a.75.75 0 0 0-1.06 1.06l1.75 1.75a.75.75 0 0 0 1.06 0l3.62-3.62Z" clip-rule="evenodd"></path></svg>`

// 1. Listen for initial todos from main process
window.electronAPI.onInitialTodos((todos) => {
  console.log("QuickAdd: Received initial todos", todos)
  allTodos = Array.isArray(todos) ? todos : []
  renderQuickAddTodos()
})

// Listen for settings (specifically translucency)
window.electronAPI.onQuickAddSettings((settings) => {
  console.log("QuickAdd: Received settings", settings)
  document.body.classList.toggle("translucent", !!settings.translucent)
})

// 2. Render received todos into lists
function renderQuickAddTodos() {
  taskListsContainer.innerHTML = "" // Clear placeholder/old content

  const activeTodos = allTodos.filter((t) => !t.done)
  const completedTodos = allTodos.filter((t) => t.done)

  // Create Active Section
  if (activeTodos.length > 0) {
    const activeSection = document.createElement("section")
    activeSection.className = "task-section"
    activeSection.innerHTML = `<h3 class="task-section-header">Active</h3>`
    const activeUl = document.createElement("ul")
    activeTodos.forEach((todo) =>
      activeUl.appendChild(createQuickTodoElement(todo))
    )
    activeSection.appendChild(activeUl)
    taskListsContainer.appendChild(activeSection)
  }

  // Create Completed Section
  if (completedTodos.length > 0) {
    const completedSection = document.createElement("section")
    completedSection.className = "task-section"
    completedSection.innerHTML = `<h3 class="task-section-header">Completed</h3>`
    const completedUl = document.createElement("ul")
    completedTodos.forEach((todo) =>
      completedUl.appendChild(createQuickTodoElement(todo))
    )
    completedSection.appendChild(completedUl)
    taskListsContainer.appendChild(completedSection)
  }

  // Show message if no tasks at all
  if (activeTodos.length === 0 && completedTodos.length === 0) {
    taskListsContainer.innerHTML =
      '<div class="empty-message">No tasks yet!</div>'
  }
}

// Helper to create list item HTML for the overlay
function createQuickTodoElement(todo) {
  const li = document.createElement("li")
  li.className = "quick-task-item"
  if (todo.done) {
    li.classList.add("done")
  }
  li.innerHTML = `
        ${todo.done ? checkCircleIconSVG : circleIconSVG}
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
    window.electronAPI.sendTaskToMain(taskText)
    quickAddInput.value = ""
    // Main process will close the window
  } else {
    console.error("QuickAdd: API not available or task is empty.")
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

// 5. Request initial todos (no longer needed - main asks main renderer)
window.addEventListener("DOMContentLoaded", () => {
  quickAddInput.focus()
  console.log("QuickAdd: DOM Loaded.")
  // Requesting todos is now handled implicitly by main process flow
})

console.log("Quick Add Renderer loaded.")
