const quickAddInput = document.getElementById("quick-add-input")
const quickAddForm = document.getElementById("quick-add-form")
const quickCancelBtn = document.getElementById("quick-cancel-btn")

// Send task to main process on form submit
quickAddForm.addEventListener("submit", (event) => {
  event.preventDefault()
  const taskText = quickAddInput.value.trim()
  if (
    taskText &&
    window.electronAPI &&
    typeof window.electronAPI.sendTaskToMain === "function"
  ) {
    console.log("QuickAdd: Sending task:", taskText)
    window.electronAPI.sendTaskToMain(taskText)
    quickAddInput.value = "" // Clear input
    // Main process will close the window after processing
  } else {
    console.error("QuickAdd: API not available or task is empty.")
    // Optionally provide visual feedback
  }
})

// Close window on cancel button click
quickCancelBtn.addEventListener("click", () => {
  if (
    window.electronAPI &&
    typeof window.electronAPI.closeQuickAddWindow === "function"
  ) {
    window.electronAPI.closeQuickAddWindow()
  } else {
    console.error("QuickAdd: API not available for closing.")
    window.close() // Fallback
  }
})

// Close window on Escape key press
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    if (
      window.electronAPI &&
      typeof window.electronAPI.closeQuickAddWindow === "function"
    ) {
      window.electronAPI.closeQuickAddWindow()
    } else {
      console.error("QuickAdd: API not available for closing via Esc.")
      window.close() // Fallback
    }
  }
})

// Auto-focus input when window loads (might already happen with 'autofocus' attribute)
window.addEventListener("DOMContentLoaded", () => {
  quickAddInput.focus()
})

console.log("Quick Add Renderer loaded.")
