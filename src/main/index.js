// Desc: This file contains the main entry point of the electron app
import { app, BrowserWindow } from "electron";
import { electronApp, optimizer } from "@electron-toolkit/utils";
import createMainWindow, { mainWindow, setMainWindow } from "./window";
import './ipcHandler';  // Import IPC (Inter-Process Communication) handlers

// Function to create the main application window
function createWindow() {
  createMainWindow();  // Initialize the main window of the app

  // Add an event listener for when the main window is closed
  mainWindow.on("closed", function() {
    setMainWindow(null);  // Reset the main window reference
  });
}

// Ensure the Electron app is ready before executing the following code
app.whenReady().then(() => {
  // Set the AppUserModelId for Windows notifications
  electronApp.setAppUserModelId("com.electron");

  // Add an event listener for when any new browser window is created
  app.on("browser-window-created", (_, window) => {
    optimizer.watchWindowShortcuts(window);  // Watch for window shortcuts and optimize accordingly
  });

  // Create the main application window
  createWindow();

  // Add an event listener for when the app is activated (clicked on dock/taskbar icon)
  app.on("activate", function() {
    // If no windows are open, create a new main window
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// Add an event listener for when all windows of the app are closed
app.on("window-all-closed", () => {
  // On macOS, it's common to not quit the app when all windows are closed, hence the check for 'darwin'
  // On other platforms, quit the app when all windows are closed
  if (process.platform !== "darwin") {
    app.quit();
  }
});
