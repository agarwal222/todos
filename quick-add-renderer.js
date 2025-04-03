// quick-add-renderer.js
const quickAddInput = document.getElementById("quick-add-input")
const quickAddForm = document.getElementById("quick-add-form")
const taskListsContainer = document.getElementById("task-lists-container")
const quickAddFooter = document.querySelector(".quick-add-footer")

let allTodos = []

const circleIconSVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" class="checkbox-icon"><path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14Zm0-1.5A5.5 5.5 0 1 1 8 2.5a5.5 5.5 0 0 1 0 11Z"></path></svg>`
const checkCircleIconSVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" class="checkbox-icon"><path fill-rule="evenodd" d="M8 15A7 7 0 1 0 8 1a7 7 0 0 0 0 14Zm3.84-9.12a.75.75 0 0 0-1.18-.94l-2.97 2.97-1.22-1.22a.75.75 0 0 0-1.06 1.06l1.75 1.75a.75.75 0 0 0 1.06 0l3.62-3.62Z" clip-rule="evenodd"></path></svg>`
const deleteIconSVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor"><path fill-rule="evenodd" d="M5 3.25V4H2.75a.75.75 0 0 0 0 1.5h.3l.815 8.15A1.5 1.5 0 0 0 5.357 15h5.285a1.5 1.5 0 0 0 1.493-1.35l.815-8.15h.3a.75.75 0 0 0 0-1.5H11v-.75A2.25 2.25 0 0 0 8.75 1h-1.5A2.25 2.25 0 0 0 5 3.25Zm2.25-.75a.75.75 0 0 0-.75.75V4h3v-.75a.75.75 0 0 0-.75-.75h-1.5ZM6.05 6a.75.75 0 0 1 .787.713l.275 5.5a.75.75 0 0 1-1.498.075l-.275-5.5A.75.75 0 0 1 6.05 6Zm3.9 0a.75.75 0 0 1 .712.787l-.275 5.5a.75.75 0 0 1-1.498-.075l.275-5.5a.75.75 0 0 1 .786-.711Z" clip-rule="evenodd"></path></svg>`

const MAX_VISIBLE_TASKS = 7
const ITEM_HEIGHT_ESTIMATE = 38
const HEADER_HEIGHT_ESTIMATE = 28
const FORM_HEIGHT_ESTIMATE = 60
const FOOTER_HEIGHT_ESTIMATE = 40
const CONTAINER_PADDING_ESTIMATE = 12
const FINAL_BUFFER = 5

// 1. Listen for initial todos
window.electronAPI.onInitialTodos((todos) => {
  console.log("QuickAdd: Received initial todos", todos)
  allTodos = Array.isArray(todos) ? todos : []
  renderQuickAddTodos()
  requestWindowResize()
})

// 2. Listen for settings
window.electronAPI.onQuickAddSettings((settings) => {
  console.log("QuickAdd: Received settings", settings)
  document.body.classList.toggle("translucent", !!settings.translucent)
  document.body.dataset.platform = window.electronAPI.getPlatform()
})

// Calculate desired height
function calculateDesiredHeight() {
  /* ... remains the same ... */
}
function calculateDesiredHeight() {
  const activeCount = allTodos.filter((t) => !t.done).length
  const completedCount = allTodos.filter((t) => t.done).length
  const totalTasks = activeCount + completedCount
  let listHeight = 0
  let headerCount = 0
  if (activeCount > 0) {
    headerCount++
    listHeight += activeCount * ITEM_HEIGHT_ESTIMATE
  }
  if (completedCount > 0) {
    headerCount++
    listHeight += completedCount * ITEM_HEIGHT_ESTIMATE
  }
  if (totalTasks === 0) {
    listHeight = 60
  }
  listHeight += headerCount * HEADER_HEIGHT_ESTIMATE
  const totalNeededHeight =
    FORM_HEIGHT_ESTIMATE +
    listHeight +
    CONTAINER_PADDING_ESTIMATE +
    FOOTER_HEIGHT_ESTIMATE
  let maxListHeight = 0
  let maxHeaderCount = 0
  if (totalTasks > 0) {
    maxHeaderCount = (activeCount > 0 ? 1 : 0) + (completedCount > 0 ? 1 : 0)
    maxListHeight =
      Math.min(totalTasks, MAX_VISIBLE_TASKS) * ITEM_HEIGHT_ESTIMATE +
      maxHeaderCount * HEADER_HEIGHT_ESTIMATE
  } else {
    maxListHeight = 60
  }
  const maxHeightBasedOnLimit =
    FORM_HEIGHT_ESTIMATE +
    maxListHeight +
    CONTAINER_PADDING_ESTIMATE +
    FOOTER_HEIGHT_ESTIMATE
  const desiredHeight = Math.max(
    100,
    Math.min(totalNeededHeight, maxHeightBasedOnLimit) + FINAL_BUFFER
  )
  console.log(
    `Tasks: ${totalTasks}, Needed: ${totalNeededHeight}, MaxLimit: ${maxHeightBasedOnLimit}, Final: ${desiredHeight}`
  )
  return desiredHeight
}

// Send resize request
function requestWindowResize() {
  const desiredHeight = calculateDesiredHeight()
  window.electronAPI.resizeQuickAdd(desiredHeight)
}

// 3. Render todos
function renderQuickAddTodos() {
  taskListsContainer.innerHTML = ""
  const activeTodos = allTodos.filter((t) => !t.done)
  const completedTodos = allTodos.filter((t) => t.done)
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
  if (activeTodos.length === 0 && completedTodos.length === 0) {
    taskListsContainer.innerHTML =
      '<div class="empty-message">No tasks yet!</div>'
  }
}

// Helper to create list item HTML (UPDATED)
function createQuickTodoElement(todo) {
  const li = document.createElement("li")
  li.className = "quick-task-item"
  li.dataset.id = todo.id // Add task ID to the list item
  if (todo.done) {
    li.classList.add("done")
  }

  // Checkbox Area (clickable)
  const checkboxArea = document.createElement("div")
  checkboxArea.className = "checkbox-area"
  checkboxArea.dataset.action = "toggle" // Action identifier
  checkboxArea.innerHTML = todo.done ? checkCircleIconSVG : circleIconSVG
  checkboxArea.setAttribute("role", "button")
  checkboxArea.setAttribute(
    "aria-label",
    todo.done ? "Mark incomplete" : "Mark complete"
  )
  checkboxArea.setAttribute("tabindex", "0") // Make focusable

  // Text Span
  const textSpan = document.createElement("span")
  textSpan.className = "text"
  textSpan.textContent = escapeHTML(todo.text)

  // Delete Button
  const deleteButton = document.createElement("button")
  deleteButton.className = "delete-button"
  deleteButton.dataset.action = "delete" // Action identifier
  deleteButton.innerHTML = deleteIconSVG
  deleteButton.setAttribute("aria-label", "Delete task")
  deleteButton.setAttribute("title", "Delete task")

  li.appendChild(checkboxArea)
  li.appendChild(textSpan)
  li.appendChild(deleteButton)

  return li
}

// Basic HTML escaping helper
function escapeHTML(str) {
  const div = document.createElement("div")
  div.appendChild(document.createTextNode(str))
  return div.innerHTML
}

// 4. Handle adding a NEW task
quickAddForm.addEventListener("submit", (event) => {
  event.preventDefault()
  const taskText = quickAddInput.value.trim()
  if (taskText && window.electronAPI?.sendTaskToMain) {
    window.electronAPI.sendTaskToMain(taskText)
    quickAddInput.value = ""
    // Don't close immediately, main process handles that after applying
  } else {
    console.error("QuickAdd: API not available or task is empty.")
  }
})

// *** NEW: Handle clicks on task items for toggle/delete ***
taskListsContainer.addEventListener("click", (event) => {
  const target = event.target
  const actionElement = target.closest("[data-action]") // Find the element with data-action

  if (!actionElement) return // Clicked outside an action area

  const listItem = actionElement.closest(".quick-task-item")
  if (!listItem || !listItem.dataset.id) return // Couldn't find parent task item or its ID

  const taskId = parseInt(listItem.dataset.id, 10)
  const action = actionElement.dataset.action

  console.log(`QuickAdd: Action "${action}" triggered for task ID: ${taskId}`)

  if (action === "toggle") {
    if (window.electronAPI?.sendQuickAddToggleTask) {
      window.electronAPI.sendQuickAddToggleTask(taskId)
      // Optionally provide visual feedback immediately, though window will close
      // listItem.classList.toggle('done'); // Might cause flicker
      if (window.electronAPI?.closeQuickAddWindow) {
        setTimeout(() => window.electronAPI.closeQuickAddWindow(), 50) // Close after a tiny delay
      }
    } else {
      console.error("QuickAdd: Toggle Task API not available.")
    }
  } else if (action === "delete") {
    if (window.electronAPI?.sendQuickAddDeleteTask) {
      window.electronAPI.sendQuickAddDeleteTask(taskId)
      // Optionally provide visual feedback immediately
      listItem.style.opacity = "0"
      listItem.style.transform = "translateX(-20px)"
      listItem.style.transition = "opacity 0.2s ease, transform 0.2s ease"

      if (window.electronAPI?.closeQuickAddWindow) {
        // Close after animation could finish (adjust timing if needed)
        setTimeout(() => window.electronAPI.closeQuickAddWindow(), 250)
      }
    } else {
      console.error("QuickAdd: Delete Task API not available.")
    }
  }
})

// 5. Close window on Escape key press
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    if (window.electronAPI?.closeQuickAddWindow) {
      window.electronAPI.closeQuickAddWindow()
    } else {
      window.close() // Fallback for safety
    }
  }
})

// 6. Initial focus
window.addEventListener("DOMContentLoaded", () => {
  quickAddInput.focus()
  console.log("QuickAdd: DOM Loaded.")
})

console.log("Quick Add Renderer loaded.")
