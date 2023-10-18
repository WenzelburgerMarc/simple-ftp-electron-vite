// Desc: This file creates the main application window
import { BrowserWindow, shell } from "electron";
import { is } from "@electron-toolkit/utils";
import { join } from "path";
// Define a global variable for the main application window
export let mainWindow = null;

// Function to create and initialize the main application window
const createMainWindow = () => {
  // Create a new browser window with the specified options
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 720,
    resizable: true,
    maximizable: true,
    title: "FTP Synchronizer",
    frame: false,
    minWidth: 1280,
    minHeight: 720,
    show: false,  // Window will not show immediately
    icon: join(__dirname, "../renderer/assets/icon.png"),
    autoHideMenuBar: true,
    webPreferences: {
      sandbox: false,
      nodeIntegration: false,
      contextIsolation: true,
      preload: join(__dirname, "../preload/index.js")  // Specify the path to preload script
    }
  });

  // Clear the browser window's cache
  mainWindow.webContents.session.clearCache().then(() => {
    // Add an event listener for when the window is ready to be shown
    mainWindow.on("ready-to-show", () => {
      // If the app was started with the "--hidden" flag, minimize the window
      if (process.argv.includes("--hidden")) {
        mainWindow.minimize();
      } else {
        // Otherwise, show the main window
        mainWindow.show();
      }
      // If the app is in development mode, open the devtools
      if (is.dev) {
        mainWindow.webContents.openDevTools();
      }
    });

    // Handle external link clicks in the browser window
    mainWindow.webContents.setWindowOpenHandler((details) => {
      // Open the link in the default web browser
      shell.openExternal(details.url);
      // Prevent the electron app from opening the link internally
      return { action: "deny" };
    });

    // If in development mode and there's a specified renderer URL, load it
    if (is.dev && process.env["ELECTRON_RENDERER_URL"]) {
      mainWindow.loadURL(process.env["ELECTRON_RENDERER_URL"]);
    } else {
      // Otherwise, load the default renderer file
      mainWindow.loadFile(join(__dirname, "../renderer/index.html"));
    }
  });
};

// Function to set the main application window
export const setMainWindow = (value) => {
  mainWindow = value;
};

// Export the createMainWindow function as the default export
export default createMainWindow;
