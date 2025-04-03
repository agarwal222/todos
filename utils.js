// utils.js

import { DEFAULT_FONT } from "./state.js" // Import constants if needed

const CONTEXT_MAX_LENGTH = 100
const TOAST_DURATION = 3000

// Use export keyword for ES Modules
export function showToast(
  toastContainer,
  message,
  type = "info",
  duration = TOAST_DURATION
) {
  /* ... keep body ... */ if (!toastContainer) {
    console.error("Toast container not provided!")
    return
  }
  const toast = document.createElement("div")
  toast.className = `toast toast--${type}`
  toast.setAttribute("role", "status")
  toast.setAttribute("aria-live", "polite")
  const messageSpan = document.createElement("span")
  messageSpan.textContent = message
  toast.appendChild(messageSpan)
  toastContainer.prepend(toast)
  requestAnimationFrame(() => {
    toast.classList.add("toast-visible")
  })
  const timerId = setTimeout(() => {
    toast.classList.remove("toast-visible")
    toast.classList.add("toast-exiting")
    toast.addEventListener(
      "transitionend",
      () => {
        if (toast.parentNode === toastContainer) {
          toastContainer.removeChild(toast)
        }
      },
      { once: true }
    )
    setTimeout(() => {
      if (toast.parentNode === toastContainer) {
        console.warn("Toast fallback removal triggered.")
        toastContainer.removeChild(toast)
      }
    }, 500)
  }, duration)
  toast.addEventListener(
    "click",
    () => {
      clearTimeout(timerId)
      toast.classList.remove("toast-visible")
      toast.classList.add("toast-exiting")
      toast.addEventListener(
        "transitionend",
        () => {
          if (toast.parentNode === toastContainer) {
            toastContainer.removeChild(toast)
          }
        },
        { once: true }
      )
      setTimeout(() => {
        if (toast.parentNode === toastContainer)
          toastContainer.removeChild(toast)
      }, 500)
    },
    { once: true }
  )
}
export function isValidHexColor(hex) {
  /* ... keep body ... */ if (!hex) return false
  const hexRegex = /^#([0-9A-F]{3,4}|[0-9A-F]{6}|[0-9A-F]{8})$/i
  return hexRegex.test(hex)
}
export function loadImage(src) {
  /* ... keep body ... */ return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = (e) =>
      reject(new Error(`Image load error: ${e?.message || e}`))
    img.src = src
  })
}
export function drawBackgroundColor(ctx, color, width, height) {
  /* ... keep body ... */ ctx.fillStyle = color
  ctx.fillRect(0, 0, width, height)
}
export function drawBackgroundImage(ctx, img, canvasWidth, canvasHeight) {
  /* ... keep body ... */ const imgAspectRatio = img.width / img.height
  const canvasAspectRatio = canvasWidth / canvasHeight
  let drawWidth, drawHeight, drawX, drawY
  if (imgAspectRatio >= canvasAspectRatio) {
    drawHeight = canvasHeight
    drawWidth = drawHeight * imgAspectRatio
    drawX = (canvasWidth - drawWidth) / 2
    drawY = 0
  } else {
    drawWidth = canvasWidth
    drawHeight = drawWidth / imgAspectRatio
    drawX = 0
    drawY = (canvasHeight - drawHeight) / 2
  }
  ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight)
}

export function calculateTextBlockDimensions(ctx, params) {
  const {
    title,
    fontName,
    fontWeight,
    titleFontSize,
    itemFontSize,
    contextFontSize,
    contextTopMargin,
    titleSpacing,
    itemSpacing,
    lines,
    maxItemsPerColumn,
    columnGap,
    listStyle,
  } = params

  // *** ADDED CHECK: If no lines, return zero dimensions ***
  if (!lines || lines.length === 0) {
    return {
      overallWidth: 0,
      overallHeight: 0,
      titleHeight: 0,
      maxColumnItemHeight: 0,
      numColumns: 0,
      maxColumnWidth: 0,
    }
  }
  // **********************************************************

  let overallWidth = 0
  let overallHeight = 0
  let maxColumnWidth = 0
  let maxColumnItemHeight = 0
  let currentColumnItemCount = 0
  let currentColumnWidth = 0
  let numColumns = 1

  // Title Calculation (Only if lines exist)
  const titleWeight = Math.max(parseInt(fontWeight, 10) || 400, 600)
  const titleFont = `${titleWeight} ${titleFontSize}px "${fontName}", ${DEFAULT_FONT}`
  ctx.font = titleFont
  const titleWidth = title ? ctx.measureText(title).width : 0
  const titleHeight = title ? titleFontSize : 0
  maxColumnWidth = Math.max(maxColumnWidth, titleWidth)
  overallHeight = title ? titleHeight + titleSpacing : 0 // Spacing added regardless of items *if title exists*

  // Items Calculation (Rest remains the same)
  const itemWeight = parseInt(fontWeight, 10) || 400
  const itemFont = `${itemWeight} ${itemFontSize}px "${fontName}", ${DEFAULT_FONT}`
  const contextWeight = 300
  const contextFont = `${contextWeight} ${contextFontSize}px "${fontName}", ${DEFAULT_FONT}`

  let currentColumnHeightOnlyItems = 0
  lines.forEach((item, index) => {
    currentColumnItemCount++
    ctx.font = itemFont
    const prefix =
      listStyle === "dash"
        ? "- "
        : listStyle === "number"
        ? `${index + 1}. `
        : "• "
    const itemText = `${prefix}${item.text}`
    const itemWidth = ctx.measureText(itemText).width
    let contextWidth = 0
    let itemTotalHeight = itemFontSize
    if (item.context) {
      ctx.font = contextFont
      contextWidth = ctx.measureText(item.context).width
      itemTotalHeight += contextTopMargin + contextFontSize
    }
    const effectiveContextWidth = item.context
      ? contextWidth + itemFontSize * 0.75
      : 0
    currentColumnWidth = Math.max(
      currentColumnWidth,
      itemWidth,
      effectiveContextWidth
    )
    if (currentColumnItemCount > 1) {
      currentColumnHeightOnlyItems += itemSpacing
    }
    currentColumnHeightOnlyItems += itemTotalHeight
    if (
      currentColumnItemCount >= maxItemsPerColumn &&
      index < lines.length - 1
    ) {
      maxColumnWidth = Math.max(maxColumnWidth, currentColumnWidth)
      maxColumnItemHeight = Math.max(
        maxColumnItemHeight,
        currentColumnHeightOnlyItems
      )
      numColumns++
      currentColumnWidth = 0
      currentColumnItemCount = 0
      currentColumnHeightOnlyItems = 0
    }
  })
  maxColumnWidth = Math.max(maxColumnWidth, currentColumnWidth)
  maxColumnItemHeight = Math.max(
    maxColumnItemHeight,
    currentColumnHeightOnlyItems
  )
  overallHeight += maxColumnItemHeight
  overallWidth =
    numColumns * maxColumnWidth + Math.max(0, numColumns - 1) * columnGap

  return {
    overallWidth,
    overallHeight,
    titleHeight,
    maxColumnItemHeight,
    numColumns,
    maxColumnWidth,
  }
}

export function calculateTextStartPositionMultiCol(
  canvasWidth,
  canvasHeight,
  padding,
  titleHeight,
  columnItemHeight,
  titleSpacing,
  itemSpacing,
  maxItems,
  lineCount,
  position,
  offsetX,
  offsetY,
  metrics
) {
  /* ... keep body ... */ let startX, startY
  const requiredHeight = metrics.overallHeight
  const requiredWidth = metrics.overallWidth
  switch (position) {
    case "top-left":
    case "center-left":
    case "bottom-left":
      startX = padding
      break
    case "top-center":
    case "center":
    case "bottom-center":
      startX = canvasWidth / 2
      break
    case "top-right":
    case "bottom-right":
      startX = canvasWidth - padding
      break
    default:
      startX = padding
      break
  }
  switch (position) {
    case "top-left":
    case "top-center":
    case "top-right":
      startY = padding
      break
    case "center-left":
    case "center":
      startY = Math.max(padding, canvasHeight / 2 - requiredHeight / 2)
      break
    case "bottom-left":
    case "bottom-center":
    case "bottom-right":
      startY = canvasHeight - padding - requiredHeight
      break
    default:
      startY = padding
      break
  }
  startY = Math.max(padding, startY)
  if (startY + requiredHeight > canvasHeight - padding) {
    startY = canvasHeight - padding - requiredHeight
    startY = Math.max(padding, startY)
  }
  return { startX: startX + offsetX, startY: startY + offsetY }
}
export function drawTextBackgroundPanel(ctx, opts) {
  /* ... keep body ... */ const {
    x,
    y,
    width,
    height,
    paddingInline,
    paddingBlock,
    bgColor,
    opacity,
    borderColor,
    borderWidth,
    borderRadius,
    textAlign,
  } = opts
  const padX = Math.max(0, paddingInline)
  const padY = Math.max(0, paddingBlock)
  let panelX = x
  if (textAlign === "center") {
    panelX = x - width / 2
  } else if (textAlign === "right") {
    panelX = x - width
  }
  panelX -= padX
  const panelY = y - padY
  const panelWidth = width + 2 * padX
  const panelHeight = height + 2 * padY
  const originalAlpha = ctx.globalAlpha
  ctx.globalAlpha = originalAlpha * Math.max(0, Math.min(1, opacity))
  ctx.fillStyle = bgColor
  if (borderRadius > 0 && ctx.roundRect) {
    ctx.beginPath()
    ctx.roundRect(panelX, panelY, panelWidth, panelHeight, borderRadius)
    ctx.fill()
  } else {
    ctx.fillRect(panelX, panelY, panelWidth, panelHeight)
  }
  if (borderWidth > 0) {
    ctx.strokeStyle = borderColor
    ctx.lineWidth = borderWidth
    if (borderRadius > 0 && ctx.roundRect) {
      ctx.beginPath()
      ctx.roundRect(panelX, panelY, panelWidth, panelHeight, borderRadius)
      ctx.stroke()
    } else {
      ctx.strokeRect(panelX, panelY, panelWidth, panelHeight)
    }
  }
  ctx.globalAlpha = originalAlpha
}

export function drawTextElementsMultiCol(ctx, params) {
  const {
    title,
    textColor,
    textAlign,
    fontName,
    fontWeight,
    titleFontSize,
    itemFontSize,
    contextFontSize,
    contextTopMargin,
    titleSpacing,
    itemSpacing,
    lines,
    startX,
    startY,
    listStyle,
    maxItemsPerColumn,
    columnGap,
  } = params

  // *** ADDED CHECK: If no lines, do nothing ***
  if (!lines || lines.length === 0) {
    return
  }
  // ********************************************

  ctx.textAlign = textAlign
  ctx.textBaseline = "top"
  ctx.fillStyle = textColor
  ctx.shadowColor = "transparent"
  ctx.shadowBlur = 0
  ctx.shadowOffsetX = 0
  ctx.shadowOffsetY = 0

  let currentX = startX
  let currentY = startY
  let columnStartX = currentX
  let initialItemY = startY

  // Draw Title (Only if it exists and lines exist)
  const titleWeight = Math.max(parseInt(fontWeight, 10) || 400, 600)
  const titleFont = `${titleWeight} ${titleFontSize}px "${fontName}", ${DEFAULT_FONT}`
  const fallbackTitleFont = `${titleWeight} ${titleFontSize}px ${DEFAULT_FONT}`
  const titleHeight = title ? titleFontSize : 0 // Get title height for spacing calc

  if (title) {
    try {
      ctx.font = titleFont
      ctx.fillText(title, currentX, currentY)
    } catch (e) {
      console.warn(
        `Failed to draw title with font ${fontName}. Falling back.`,
        e
      )
      ctx.font = fallbackTitleFont
      ctx.fillText(title, currentX, currentY)
    }
    currentY += titleHeight + titleSpacing
    initialItemY = currentY
  }

  // Draw Items (Rest remains the same)
  const itemWeight = parseInt(fontWeight, 10) || 400
  const itemFont = `${itemWeight} ${itemFontSize}px "${fontName}", ${DEFAULT_FONT}`
  const fallbackItemFont = `${itemWeight} ${itemFontSize}px ${DEFAULT_FONT}`
  const contextWeight = 300
  const contextFont = `${contextWeight} ${contextFontSize}px "${fontName}", ${DEFAULT_FONT}`
  const fallbackContextFont = `${contextWeight} ${contextFontSize}px ${DEFAULT_FONT}`
  let currentColumnItemCount = 0
  let currentColumnCalculatedWidth = 0
  lines.forEach((item, index) => {
    if (index > 0 && currentColumnItemCount >= maxItemsPerColumn) {
      columnStartX += currentColumnCalculatedWidth + columnGap
      currentY = initialItemY
      currentColumnItemCount = 0
      currentColumnCalculatedWidth = 0
    }
    currentColumnItemCount++
    let prefix
    switch (listStyle) {
      case "dash":
        prefix = "- "
        break
      case "number":
        prefix = `${index + 1}. `
        break
      default:
        prefix = "• "
        break
    }
    const itemText = `${prefix}${item.text}`
    ctx.fillStyle = textColor
    let itemWidth = 0
    try {
      ctx.font = itemFont
      itemWidth = ctx.measureText(itemText).width
      ctx.fillText(itemText, columnStartX, currentY)
    } catch (e) {
      console.warn(
        `Failed to draw item with font ${fontName}. Falling back.`,
        e
      )
      ctx.font = fallbackItemFont
      itemWidth = ctx.measureText(itemText).width
      ctx.fillText(itemText, columnStartX, currentY)
    }
    let currentItemTotalHeight = itemFontSize
    let contextWidth = 0
    let effectiveContextWidth = 0
    if (item.context) {
      const originalAlpha = ctx.globalAlpha
      ctx.globalAlpha *= 0.8
      const contextY = currentY + itemFontSize + contextTopMargin
      const contextIndent = itemFontSize * 0.75
      try {
        ctx.font = contextFont
        contextWidth = ctx.measureText(item.context).width
        ctx.fillText(item.context, columnStartX + contextIndent, contextY)
      } catch (e) {
        console.warn(
          `Failed to draw context with font ${fontName}. Falling back.`,
          e
        )
        ctx.font = fallbackContextFont
        contextWidth = ctx.measureText(item.context).width
        ctx.fillText(item.context, columnStartX + contextIndent, contextY)
      }
      currentItemTotalHeight += contextTopMargin + contextFontSize
      ctx.globalAlpha = originalAlpha
      effectiveContextWidth = contextWidth + contextIndent
    }
    currentColumnCalculatedWidth = Math.max(
      currentColumnCalculatedWidth,
      itemWidth,
      effectiveContextWidth
    )
    currentY += currentItemTotalHeight + itemSpacing
  })
}

// ... (Keep remaining utility functions: formatAccelerator, mapKeyForDisplay, etc.) ...
export function formatAccelerator(accelerator) {
  if (!accelerator) return ""
  const platform = navigator.platform
  let displayString = accelerator
  if (platform.toUpperCase().includes("MAC")) {
    displayString = displayString
      .replace(/CommandOrControl|CmdOrCtrl/g, "Cmd")
      .replace(/Control/g, "Ctrl")
      .replace(/Alt/g, "Option")
  } else {
    displayString = displayString.replace(
      /CommandOrControl|CmdOrCtrl|Command|Meta/g,
      "Ctrl"
    )
  }
  return displayString.replace(/\+/g, " + ")
}
export function mapKeyForDisplay(key) {
  switch (key.toUpperCase()) {
    case "COMMANDORCONTROL":
    case "CMDORCTRL":
      return "Ctrl/Cmd"
    case "CONTROL":
      return "Ctrl"
    case "COMMAND":
    case "META":
      return "Cmd"
    case "OPTION":
    case "ALT":
      return "Alt"
    case "SHIFT":
      return "Shift"
    case "ARROWUP":
      return "Up"
    case "ARROWDOWN":
      return "Down"
    case "ARROWLEFT":
      return "Left"
    case "ARROWRIGHT":
      return "Right"
    case " ":
      return "Space"
    case "ESCAPE":
      return "Esc"
    case "BACKQUOTE":
      return "`"
    case "MINUS":
      return "-"
    case "EQUAL":
      return "="
    case "BRACKETLEFT":
      return "["
    case "BRACKETRIGHT":
      return "]"
    case "BACKSLASH":
      return "\\"
    case "SEMICOLON":
      return ";"
    case "QUOTE":
      return "'"
    case "COMMA":
      return ","
    case "PERIOD":
      return "."
    case "SLASH":
      return "/"
    case "F1":
    case "F2":
    case "F3":
    case "F4":
    case "F5":
    case "F6":
    case "F7":
    case "F8":
    case "F9":
    case "F10":
    case "F11":
    case "F12":
    case "F13":
    case "F14":
    case "F15":
    case "F16":
    case "F17":
    case "F18":
    case "F19":
    case "F20":
    case "F21":
    case "F22":
    case "F23":
    case "F24":
      return key.toUpperCase()
    case "TAB":
    case "ENTER":
    case "BACKSPACE":
    case "DELETE":
    case "HOME":
    case "END":
    case "PAGEUP":
    case "PAGEDOWN":
    case "INSERT":
      return key.charAt(0).toUpperCase() + key.slice(1).toLowerCase()
    default:
      return key.length === 1 ? key.toUpperCase() : key
  }
}
export function buildAcceleratorStringParts(
  pressedKeysSet,
  currentAcceleratorString = null
) {
  const keySet = currentAcceleratorString
    ? new Set(
        currentAcceleratorString
          .split("+")
          .map((p) =>
            p === "CommandOrControl"
              ? navigator.platform.toUpperCase().includes("MAC")
                ? "Meta"
                : "Control"
              : p
          )
      )
    : pressedKeysSet
  const modifiers = []
  const keys = []
  const isMac = navigator.platform.toUpperCase().includes("MAC")
  if (keySet.has("Control") || (keySet.has("CommandOrControl") && !isMac))
    modifiers.push("Ctrl")
  if (keySet.has("Alt") || keySet.has("Option")) modifiers.push("Alt")
  if (keySet.has("Shift")) modifiers.push("Shift")
  if (
    keySet.has("Meta") ||
    keySet.has("Command") ||
    (keySet.has("CommandOrControl") && isMac)
  )
    modifiers.push("Cmd")
  keySet.forEach((key) => {
    if (
      ![
        "Control",
        "Shift",
        "Alt",
        "Meta",
        "CommandOrControl",
        "Command",
        "Option",
      ].includes(key)
    ) {
      keys.push(mapKeyToAccelerator(key))
    }
  })
  const modifierOrder = { Ctrl: 1, Alt: 2, Shift: 3, Cmd: 4 }
  modifiers.sort((a, b) => (modifierOrder[a] || 99) - (modifierOrder[b] || 99))
  return [...modifiers, ...keys]
}
export function buildAcceleratorString(pressedKeysSet) {
  const modifiers = []
  const keys = []
  if (
    pressedKeysSet.has("Meta") ||
    pressedKeysSet.has("Control") ||
    pressedKeysSet.has("Command")
  ) {
    modifiers.push("CommandOrControl")
  }
  if (pressedKeysSet.has("Alt") || pressedKeysSet.has("Option")) {
    modifiers.push("Alt")
  }
  if (pressedKeysSet.has("Shift")) {
    modifiers.push("Shift")
  }
  pressedKeysSet.forEach((key) => {
    if (
      !["Control", "Shift", "Alt", "Meta", "Command", "Option"].includes(key)
    ) {
      keys.push(mapKeyToAccelerator(key))
    }
  })
  const finalParts = [...new Set([...modifiers, ...keys])]
  return finalParts.join("+")
}
export function mapKeyToAccelerator(key) {
  switch (key.toUpperCase()) {
    case " ":
      return "Space"
    case "ESCAPE":
      return "Esc"
    case "ENTER":
      return "Enter"
    case "TAB":
      return "Tab"
    case "ARROWUP":
      return "Up"
    case "ARROWDOWN":
      return "Down"
    case "ARROWLEFT":
      return "Left"
    case "ARROWRIGHT":
      return "Right"
    case "BACKSPACE":
      return "Backspace"
    case "DELETE":
      return "Delete"
    case "HOME":
      return "Home"
    case "END":
      return "End"
    case "PAGEUP":
      return "PageUp"
    case "PAGEDOWN":
      return "PageDown"
    case "INSERT":
      return "Insert"
    case "F1":
    case "F2":
    case "F3":
    case "F4":
    case "F5":
    case "F6":
    case "F7":
    case "F8":
    case "F9":
    case "F10":
    case "F11":
    case "F12":
    case "F13":
    case "F14":
    case "F15":
    case "F16":
    case "F17":
    case "F18":
    case "F19":
    case "F20":
    case "F21":
    case "F22":
    case "F23":
    case "F24":
      return key.toUpperCase()
    case "BACKQUOTE":
      return "`"
    case "MINUS":
      return "-"
    case "EQUAL":
      return "="
    case "BRACKETLEFT":
      return "["
    case "BRACKETRIGHT":
      return "]"
    case "BACKSLASH":
      return "\\"
    case "SEMICOLON":
      return ";"
    case "QUOTE":
      return "'"
    case "COMMA":
      return ","
    case "PERIOD":
      return "."
    case "SLASH":
      return "/"
    case "NUMPAD0":
      return "num0"
    case "NUMPADMULTIPLY":
      return "nummult"
    default:
      return key.length === 1 ? key.toUpperCase() : key
  }
}
export function isValidAccelerator(accel) {
  if (!accel) return false
  const parts = accel.split("+")
  if (parts.length < 2) return false
  const hasModifier = parts.some((key) =>
    [
      "CommandOrControl",
      "Alt",
      "Shift",
      "Super",
      "Cmd",
      "Ctrl",
      "Option",
      "Control",
      "Command",
    ].includes(key)
  )
  const hasKey = parts.some(
    (key) =>
      ![
        "CommandOrControl",
        "Alt",
        "Shift",
        "Super",
        "Cmd",
        "Ctrl",
        "Option",
        "Control",
        "Command",
      ].includes(key)
  )
  return hasModifier && hasKey
}
export { CONTEXT_MAX_LENGTH }
