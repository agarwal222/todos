// state.js

const DEFAULT_FONT = "Inter"
const DEFAULT_WEIGHT = "400"
const DEFAULT_TEXT_COLOR = "#f3f4f6"
const DEFAULT_BG_COLOR = "#111827"
const DEFAULT_SHORTCUT = "CommandOrControl+Shift+Q"
const DEFAULT_TEXT_BG_COLOR = "rgba(0, 0, 0, 0.5)"
const DEFAULT_TEXT_BORDER_COLOR = "rgba(255, 255, 255, 0.1)"
const DEFAULT_OVERALL_OPACITY = 1.0
const DEFAULT_PANEL_OPACITY = 0.5

// Define the initial state structure and default values
const initialState = {
  todos: [],
  title: "My Tasks",
  listStyle: "bullet",
  fontSource: "default",
  systemFontFamily: "",
  googleFontName: "",
  activeFontFamily: DEFAULT_FONT,
  fontWeight: DEFAULT_WEIGHT,
  customFontStatus: "idle", // 'idle', 'loading', 'loaded', 'error'
  customFontError: null,
  backgroundType: "color", // 'color' or 'image'
  bgColor: DEFAULT_BG_COLOR,
  backgroundImageDataUrl: null,
  backgroundImageName: null,
  textColor: DEFAULT_TEXT_COLOR,
  textPosition: "top-left",
  fontSize: 48,
  textAlign: "left",
  offsetX: 0,
  offsetY: 0,
  titleBottomMargin: 40,
  itemSpacing: 20,
  maxItemsPerColumn: 10,
  columnGap: 50,
  overallOpacity: DEFAULT_OVERALL_OPACITY,
  textBackgroundEnabled: false,
  textBackgroundColor: DEFAULT_TEXT_BG_COLOR,
  textBackgroundPaddingInline: 15,
  textBackgroundPaddingBlock: 15,
  textBackgroundBorderWidth: 0,
  textBackgroundBorderColor: DEFAULT_TEXT_BORDER_COLOR,
  textPanelOpacity: DEFAULT_PANEL_OPACITY,
  textBackgroundBorderRadius: 5,
  settingsCollapsed: false,
  runInTray: false,
  quickAddShortcut: DEFAULT_SHORTCUT,
  quickAddTranslucent: false, // Platform default set in loadState
  lastGeneratedImageDataUrl: null,
  screenWidth: 1920, // Default, updated on init
  screenHeight: 1080, // Default, updated on init
}

// Use export for ES Modules
export {
  initialState,
  DEFAULT_FONT,
  DEFAULT_WEIGHT,
  DEFAULT_TEXT_COLOR,
  DEFAULT_BG_COLOR,
  DEFAULT_SHORTCUT,
  DEFAULT_TEXT_BG_COLOR,
  DEFAULT_TEXT_BORDER_COLOR,
  DEFAULT_OVERALL_OPACITY,
  DEFAULT_PANEL_OPACITY,
}
