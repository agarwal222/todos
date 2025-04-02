const quickAddInput = document.getElementById("quick-add-input")
const quickAddForm = document.getElementById("quick-add-form")
const taskListsContainer = document.getElementById("task-lists-container")
const quickAddFooter = document.querySelector(".quick-add-footer")

let allTodos = []

const circleIconSVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" class="checkbox-icon"><path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14Zm0-1.5A5.5 5.5 0 1 1 8 2.5a5.5 5.5 0 0 1 0 11Z"></path></svg>`
const checkCircleIconSVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" class="checkbox-icon"><path fill-rule="evenodd" d="M8 15A7 7 0 1 0 8 1a7 7 0 0 0 0 14Zm3.84-9.12a.75.75 0 0 0-1.18-.94l-2.97 2.97-1.22-1.22a.75.75 0 0 0-1.06 1.06l1.75 1.75a.75.75 0 0 0 1.06 0l3.62-3.62Z" clip-rule="evenodd"></path></svg>`

const MAX_VISIBLE_TASKS = 7
const ITEM_HEIGHT_ESTIMATE = 38
const HEADER_HEIGHT_ESTIMATE = 28
const FORM_HEIGHT_ESTIMATE = 60
const FOOTER_HEIGHT_ESTIMATE = 40 // Increased from 35
const CONTAINER_PADDING_ESTIMATE = 12
const FINAL_BUFFER = 5 // Extra buffer

// 1. Listen for initial todos from main process
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

// Calculate desired height based on content
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
    listHeight = 60 // Placeholder height
  }

  listHeight += headerCount * HEADER_HEIGHT_ESTIMATE // Add height for visible headers

  // Calculate total needed height *before* clamping
  const totalNeededHeight =
    FORM_HEIGHT_ESTIMATE +
    listHeight +
    CONTAINER_PADDING_ESTIMATE +
    FOOTER_HEIGHT_ESTIMATE

  // Calculate max height based on 7 tasks limit
  let maxListHeight = 0
  let maxHeaderCount = 0
  if (totalTasks > 0) {
    // Need at least one task for headers to matter for max calc
    maxHeaderCount = (activeCount > 0 ? 1 : 0) + (completedCount > 0 ? 1 : 0)
    maxListHeight =
      Math.min(totalTasks, MAX_VISIBLE_TASKS) * ITEM_HEIGHT_ESTIMATE +
      maxHeaderCount * HEADER_HEIGHT_ESTIMATE
  } else {
    maxListHeight = 60 // Max height for empty message
  }

  const maxHeightBasedOnLimit =
    FORM_HEIGHT_ESTIMATE +
    maxListHeight +
    CONTAINER_PADDING_ESTIMATE +
    FOOTER_HEIGHT_ESTIMATE

  // Choose the smaller of the total needed height or the 7-item max height
  // Add the final buffer and ensure minimum height
  const desiredHeight = Math.max(
    100,
    Math.min(totalNeededHeight, maxHeightBasedOnLimit) + FINAL_BUFFER
  )

  console.log(
    `Tasks: ${totalTasks}, Needed: ${totalNeededHeight}, MaxLimit: ${maxHeightBasedOnLimit}, Final: ${desiredHeight}`
  )
  return desiredHeight
}

// Send resize request to main process
function requestWindowResize() {
  const desiredHeight = calculateDesiredHeight()
  window.electronAPI.resizeQuickAdd(desiredHeight)
}

// 3. Render received todos into lists
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

// Helper to create list item HTML for the overlay
function createQuickTodoElement(todo) {
  const li = document.createElement("li")
  li.className = "quick-task-item"
  if (todo.done) {
    li.classList.add("done")
  }
  li.innerHTML = ` ${
    todo.done ? checkCircleIconSVG : circleIconSVG
  } <span class="text">${escapeHTML(todo.text)}</span> `
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
  } else {
    console.error("QuickAdd: API not available or task is empty.")
  }
})

// 5. Close window on Escape key press
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    if (window.electronAPI?.closeQuickAddWindow) {
      window.electronAPI.closeQuickAddWindow()
    } else {
      window.close()
    }
  }
})

// 6. Initial focus
window.addEventListener("DOMContentLoaded", () => {
  quickAddInput.focus()
  console.log("QuickAdd: DOM Loaded.")
})

console.log("Quick Add Renderer loaded.")
