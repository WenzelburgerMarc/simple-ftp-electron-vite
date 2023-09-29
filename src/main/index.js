"use strict";
// === IMPORTS ===
import { app, BrowserWindow, ipcMain, dialog, shell } from "electron";
import { electronApp, optimizer, is } from "@electron-toolkit/utils";
import { join } from "path";

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

ipcMain.handle("select-directory", async () => {
  const result = await dialog.showOpenDialog({
    properties: ["openDirectory"]
  });
  if (!result.canceled && result.filePaths.length > 0) {
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
