# Visido 🎨✅

**Visualize Your Tasks, Right on Your Desktop!**

Visido displays your active to-do list directly onto your desktop background, keeping your tasks constantly visible without needing to open another app. Stay organized and focused with your priorities always in sight.


## ✨ Features

*   **Task Management:** Add, complete, and delete tasks easily through the main interface or a quick-add overlay.
*   **Instant Wallpaper Update:** Apply your current task list to your desktop background with a click, or automatically after using Quick Add.
*   **Deep Customization:**
    *   **Background:** Choose a solid color or upload your own image.
    *   **Text Styling:** Adjust font size, color, position (9 locations), and alignment (left/center/right).
    *   **List Styling:** Select bullet points, dashes, or numbered lists. Control spacing between the title and items, and between individual items.
    *   **Layout:** Organize tasks into multiple columns by setting a maximum number of items per column and adjusting the gap between columns.
    *   **Custom Fonts:** Load fonts directly from Google Fonts URLs for a personalized look.
*   **Modern UI:** Sleek 3-column layout with custom window controls and a collapsible settings panel for a clean workspace.
*   **Tray Mode & Quick Add:**
    *   Optionally run Visido minimized to the system tray for unobtrusive operation.
    *   Set a custom global keyboard shortcut to instantly open a Spotlight-style overlay for adding new tasks from anywhere.
    *   Tasks added via Quick Add automatically update the wallpaper in the background.
*   **Cross-Platform:** Built with Electron, designed to work on Windows, macOS, and Linux.
*   **Native Feel:** Custom window controls (`frame: false`), disabled text selection (except inputs), and platform-aware details enhance the integrated experience.

## 🚀 Getting Started

*(Instructions for users installing a built version - adjust based on your build targets)*

1.  Download the latest **Visido** release for your operating system from the [Releases page](https://github.com/YOUR_USERNAME/visido/releases) *(<- **Update this link**)*.
2.  **Windows:** Run the `.exe` installer.
3.  **macOS:** Open the `.dmg` file and drag `Visido.app` to your Applications folder.
4.  **Linux:** Download the `.AppImage`, make it executable (`chmod +x Visido-*.AppImage`), and run it.

*(Instructions for developers)*

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/YOUR_USERNAME/visido.git
    cd visido
    ```
2.  **Install dependencies:**
    ```bash
    npm install
    # or
    yarn install
    ```
3.  **Run the app:**
    ```bash
    npm start
    # or
    yarn start
    ```

## 🛠️ Building from Source

To create distributable packages:

1.  Ensure you have the necessary build tools installed for your target platforms.
2.  Make sure icons (`icon.ico`, `icon.icns`, `icon.png`) are present in the `assets/` folder.
3.  Run the build script:
    ```bash
    npm run dist
    # or build for specific platforms, e.g., npm run dist -- -w (Windows)
    ```
    Build output will be in the `dist/` directory.

## 🔮 Upcoming Features (Potential Ideas)

We're always thinking about how to make Visido even better! Here are some ideas we're considering for the future:

*   **Task Management:**
    *   Task Priorities (High/Medium/Low) & Visual Indicators
    *   Due Dates & Overdue Highlighting
    *   Task Notes/Details (in-app)
    *   Subtasks
    *   Recurring Tasks
    *   Filtering/Sorting in Main UI
    *   Archiving/Hiding Old Completed Tasks
*   **Wallpaper Customization:**
    *   More Layout Positions (Corners)
    *   Predefined Color Themes (Light Mode, Solarized, etc.)
    *   Gradient Backgrounds
    *   Unsplash Integration (API Key Required)
    *   Bold/Italic Font Style Options
    *   Text Panel Opacity/Background Option
    *   Multi-Monitor Selection & Configuration
*   **Workflow & Integration:**
    *   Multiple Named Todo Lists
    *   Import/Export Tasks (CSV/JSON/Markdown)
    *   Cloud Sync (Google Tasks, Todoist, etc. - *Advanced*)
    *   System Reminders/Notifications
*   **UX & Polish:**
    *   Inline Task Editing in Main UI
    *   Drag & Drop Task Reordering
    *   Undo/Redo Support
    *   Save Settings Panel Collapse State
    *   App Auto-Update Mechanism (`electron-updater`)
    *   Enhanced Accessibility (ARIA attributes, full keyboard navigation)

## ❤️ Contributing

Contributions, issues, and feature requests are welcome! Please feel free to check the [issues page](https://github.com/YOUR_USERNAME/visido/issues) *(<- **Update this link**)* or submit a pull request.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details *(Create a LICENSE.md file with the MIT license text)*.