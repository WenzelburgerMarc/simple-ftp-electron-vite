"use strict";
// === IMPORTS ===
import { app, BrowserWindow, ipcMain, dialog, shell } from "electron";
import { electronApp, optimizer, is } from "@electron-toolkit/utils";
import { join } from "path";
import * as path from "path";
import * as fs from "fs";

// === WINDOW CREATION FUNCTION ===
function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 720,
    resizable: true,
    maximizable: true,
    minWidth: 1280,
    minHeight: 720,
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      sandbox: false,
      nodeIntegration: false,
      contextIsolation: true,
      preload: join(__dirname, "../preload/index.js")
    }
  });
  mainWindow.on("ready-to-show", () => {

    if (process.argv.includes("--hidden")) {      mainWindow.minimize();
    }else{
      mainWindow.show();
    }

    if (is.dev) {
      mainWindow.webContents.openDevTools();
    }
  });

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url);
    return { action: "deny" };
  });

  if (is.dev && process.env["ELECTRON_RENDERER_URL"]) {
    mainWindow.loadURL(process.env["ELECTRON_RENDERER_URL"]);
  } else {
    mainWindow.loadFile(join(__dirname, "../renderer/index.html"));
  }
}

app.whenReady().then(() => {
  electronApp.setAppUserModelId("com.electron");


  app.on("browser-window-created", (_, window) => {
    optimizer.watchWindowShortcuts(window);
  });

  createWindow();

  app.on("activate", function() {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});


// === ELECTRON STORE ===
const Store = require("electron-store");
const store = new Store();

// === IPC COMMUNICATION: GENERAL ===
ipcMain.handle("get-auto-start-item-setting", () => {

  return app.getLoginItemSettings();
});

ipcMain.handle("set-auto-start-item-setting", (event, settings) => {
  app.setLoginItemSettings({
    openAtLogin: settings.openAtLogin,
    args: ["--hidden"]
  });
  return app.getLoginItemSettings();
});

ipcMain.handle("select-directory", async (event) => {
  const result = await dialog.showOpenDialog({
    properties: ["openDirectory"]
  });
  if (!result.canceled && result.filePaths.length > 0) {
    event.sender.send("client-directory-changed", result.filePaths[0])
    return result.filePaths[0];
  } else {
    return null;
  }
});

ipcMain.handle("get-setting", (event, key) => {
  return store.get(key);
});

ipcMain.handle("set-setting", (event, key, value) => {
  store.set(key, value);
});

ipcMain.handle("get-all-data", () => {
  return store.store;
});

ipcMain.handle('list-local-files', async (event, dirPath) => {
  try {
    const files = fs.readdirSync(dirPath);
    return files.map(file => {
      const filePath = path.join(dirPath, file);
      try {
        const stats = fs.statSync(filePath);
        return {
          name: file,
          path: filePath,
          type: stats.isDirectory() ? 'd' : 'f',
          size: stats.size
        };
      } catch (error) {
        console.error(`Failed to get stats for file: ${filePath}`, error);
        return null;
      }
    }).filter(file => file !== null);
  } catch (error) {
    console.error(`Failed to read directory: ${dirPath}`, error);
    return [];
  }
});

ipcMain.handle('create-new-folder-client', async (event, selectedDirectory) => {
  const result = await dialog.showSaveDialog({
    defaultPath: selectedDirectory,
    properties: ["createDirectory"]
  });

  if (!result.canceled && result.filePath) {
    try {
      if (!fs.existsSync(result.filePath)) {
        fs.mkdirSync(result.filePath, { recursive: true });
      }
      return result.filePath;
    } catch (error) {
      console.error("Error creating directory:", error);
      return null;
    }
  } else {
    return null;
  }
});

ipcMain.handle('copy-file', async (event, sourcePath, destinationPath) => {
  await fs.promises.copyFile(sourcePath, destinationPath);
  return destinationPath;
});

let watcher;

ipcMain.handle('watch-client-directory', async (event, directoryPath) => {
  watcher = fs.watch(directoryPath, { recursive: true }, (eventType, filename) => {

    if (filename) {
      console.log('Event Type:', eventType, 'Filename:', filename);
      event.sender.send('file-changed', { eventType });
    }
  });
});

ipcMain.handle('unwatch-client-directory', async () => {
  watcher.close();
});

ipcMain.handle('restart-ftp-reload-interval', async (event) => {
  event.sender.send('restart-ftp-reload-interval');
});
