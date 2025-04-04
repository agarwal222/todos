// quick-add-renderer.js
const quickAddInput = document.getElementById("quick-add-input")
const quickAddForm = document.getElementById("quick-add-form")
const taskListsContainer = document.getElementById("task-lists-container")
const quickAddFooter = document.querySelector(".quick-add-footer")

let allTodos = []

// Replace SVG strings with Material Symbols HTML
const circleIconHTML = `<span class="material-symbols-outlined checkbox-icon">radio_button_unchecked</span>`
const checkCircleIconHTML = `<span class="material-symbols-outlined checkbox-icon">check_circle</span>`
const deleteIconHTML = `<span class="material-symbols-outlined">delete</span>`

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
    listHeight = 60 // Placeholder height when empty
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
    maxListHeight = 60 // Placeholder height when empty
  }
  const maxHeightBasedOnLimit =
    FORM_HEIGHT_ESTIMATE +
    maxListHeight +
    CONTAINER_PADDING_ESTIMATE +
    FOOTER_HEIGHT_ESTIMATE
  const desiredHeight = Math.max(
    100, // Minimum height
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
  taskListsContainer.innerHTML = "" // Clear previous content
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

// Helper to create list item HTML (UPDATED with HTML strings)
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
  checkboxArea.innerHTML = todo.done ? checkCircleIconHTML : circleIconHTML // Use HTML strings
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
  deleteButton.innerHTML = deleteIconHTML // Use HTML string
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

// Handle clicks on task items for toggle/delete
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
      // Window will close via main process after task toggle & apply
    } else {
      console.error("QuickAdd: Toggle Task API not available.")
    }
  } else if (action === "delete") {
    if (window.electronAPI?.sendQuickAddDeleteTask) {
      window.electronAPI.sendQuickAddDeleteTask(taskId)
      // Animate removal locally before window closes
      listItem.style.opacity = "0"
      listItem.style.transform = "translateX(-20px)"
      listItem.style.transition = "opacity 0.2s ease, transform 0.2s ease"
      // Window will close via main process after task delete & apply
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
