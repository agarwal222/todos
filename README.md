# Visido 🎨✅

**Visualize Your Tasks, Beautifully Displayed on Your Desktop.**

Visido keeps your active tasks visible by rendering them directly onto your desktop wallpaper. Stay organized and focused with your priorities always in sight, eliminating the need to constantly switch to a separate to-do application.

---

## ✨ Key Features

*   **Always-Visible Tasks:** Displays your current to-do list seamlessly integrated with your desktop background.
*   **Effortless Task Management:**
    *   Quickly add new tasks via the main UI or a global keyboard shortcut.
    *   Edit existing tasks through a simple modal.
    *   Mark tasks as complete with a click.
    *   Delete individual tasks or clear all completed tasks at once.
    *   Add optional context notes to tasks (visible in UI).
*   **Dynamic Wallpaper Updates:**
    *   Apply your task list and visual settings to the wallpaper manually.
    *   Enable **Auto-Apply** to update the wallpaper automatically after any task change or visual setting adjustment.
*   **Deep Visual Customization:**
    *   **Background:** Use a solid color or your own custom image as the wallpaper base.
    *   **Text & Font:** Control font size, color, weight (Light, Regular, Medium, Bold etc.), load custom Google Fonts by name, or use system fonts.
    *   **Layout:** Position the task list block (9 positions), set text alignment (left/center/right), add custom X/Y offsets, adjust spacing between title/items, and configure multi-column layouts (max items per column, column gap).
    *   **Styling:** Choose list style (bullet, dash, number), control overall text/panel opacity, and add an optional styled background panel behind the text (custom color, opacity, padding, border, corner radius).
*   **Workflow Enhancements:**
    *   **Tray Mode:** Run Visido minimized in the system tray for unobtrusive operation.
    *   **Quick Add Overlay:** Configure a global keyboard shortcut to instantly summon a Spotlight-style overlay for adding tasks from anywhere. (Requires Tray Mode).
    *   **Translucent UI Option:** Enable native blur (macOS) or transparency (Windows/Linux) for the Quick Add window.
*   **Modern & Native Feel:**
    *   Clean multi-column interface with a collapsible visual settings panel.
    *   Custom window controls for a sleek look.
    *   Platform-aware details.
*   **Reliable & Persistent:**
    *   Uses file-based storage in your user data directory (not localStorage) to reliably save your tasks and settings, including the selected background image.
    *   Auto-update checks powered by `electron-updater`.
*   **Cross-Platform:** Built with Electron, available for Windows, macOS, and Linux.

---

## 🚀 Getting Started

1.  Download the latest **Visido** release for your operating system from the **[Project Releases Page](https://github.com/agarwal222/todos/releases)**.
2.  **Windows:** Run the `.exe` installer.
3.  **macOS:** Open the `.dmg` file and drag `Visido.app` to your Applications folder.
4.  **Linux:** Download the `.AppImage`, make it executable (`chmod +x Visido-*.AppImage`), and run it. (Other formats like `.deb` or `.rpm` might also be available).

---

## 💻 Usage Overview

1.  **Add Tasks:** Click the "+" button in the "Active Tasks" column header or use the configured Quick Add shortcut (if Tray Mode is enabled).
2.  **Manage Tasks:**
    *   Check the box to mark a task complete.
    *   Click the pencil icon to edit a task's text.
    *   Click the trash icon to delete a task.
    *   Click "Clear Completed" to remove all done tasks.
3.  **Customize:** Open the "Visual Settings" panel (using the sliders icon or Alt+S) to adjust fonts, colors, layout, background, etc.
4.  **App Behavior:** Click the gear icon in the header to open App Settings, where you can configure Tray Mode, Quick Add shortcut, Auto-Apply, etc.
5.  **Apply:** Click the "Apply Wallpaper" button to update your desktop background with the current tasks and settings (unless Auto-Apply is enabled).

---

## 🛠️ Development

1.  **Clone:** `git clone https://github.com/agarwal222/todos.git`
2.  **Navigate:** `cd todos`
3.  **Install:** `npm install` (or `yarn install`)
4.  **Run:** `npm start` (or `yarn start`)

---

## 📦 Building from Source

1.  Ensure icons (`icon.ico`, `icon.icns`, `icon.png`) are present in the `assets/` folder (or adjust `package.json` build config).
2.  Run the build command:
    ```bash
    # Build for all platforms defined in package.json
    npm run dist

    # Or build for specific platforms (e.g., Windows NSIS installer)
    npm run dist -- -w nsis
    ```
3.  Output will be in the `dist/` directory.

---

## ❤️ Contributing

Contributions, issues, and feature requests are welcome! Please check the [issues page](https://github.com/agarwal222/todos/issues).

---

## 📄 License

This project is licensed under the MIT License. (Assumes you have a LICENSE.md file with the MIT license text).