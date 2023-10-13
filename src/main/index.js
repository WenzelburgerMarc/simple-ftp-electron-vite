"use strict";
// === IMPORTS ===
import { app, BrowserWindow, ipcMain, dialog, shell } from "electron";
import { electronApp, optimizer, is } from "@electron-toolkit/utils";
import { join } from "path";
import * as path from "path";
import * as fs from "fs";
import { v4 as uuidv4 } from 'uuid';

let mainWindow = null;

// === WINDOW CREATION FUNCTION ===
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 720,
    resizable: true,
    maximizable: true,
    title: "FTP Synchronizer",
    frame: true,
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

  mainWindow.webContents.session.clearCache().then(() => {
    mainWindow.on("ready-to-show", () => {

      if (process.argv.includes("--hidden")) {
        mainWindow.minimize();
      } else {
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
  });


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
    event.sender.send("client-directory-changed", result.filePaths[0]);
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
ipcMain.handle("list-local-files", async (event, dirPath) => {
  try {
    const files = fs.readdirSync(dirPath);
    return files.map(file => {
      if (file.startsWith('.')) {
        return null;
      }

      const filePath = path.join(dirPath, file);
      try {
        const stats = fs.statSync(filePath);
        return {
          name: file,
          path: filePath,
          type: stats.isDirectory() ? "d" : "f",
          size: stats.size
        };
      } catch (error) {
        let log = {
          logType: "Error",
          id: uuidv4(),
          type: "Error - List Client Files",
          open: false,
          description: error.message,
        };

        addLog(event, log);
        return null;
      }
    }).filter(file => file !== null);
  } catch (error) {
    let log = {
      logType: "Error",
      id: uuidv4(),
      type: "Error - List Client Files",
      open: false,
      description: error.message,
    };
    addLog(event, log);
    return [];
  }
});


ipcMain.handle("create-new-folder-client", async (event, selectedDirectory) => {
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
      let log = {
        logType: "Error",
        id: uuidv4(),
        type: "Error - Creating Client Folder",
        open: false,
        description: error.message,
      };

      addLog(event, log);
      return null;
    }
  } else {
    return null;
  }
});

ipcMain.handle("copy-file", async (event, sourcePath, destinationPath) => {
  try {
    await fs.promises.copyFile(sourcePath, destinationPath);

    return destinationPath;
  } catch (error) {
    let log = {
      logType: "Error",
      id: uuidv4(),
      type: "Error - Copy Client Files",
      open: false,
      description: error.message,
    };

    addLog(event, log);
    throw error;
  }
});

let watcher;
let intervalId = null;
ipcMain.handle("watch-client-directory", async (event, directoryPath) => {
  watcher = fs.watch(directoryPath, { recursive: true }, (eventType, filename) => {


    if (filename && !mainWindow.isDestroyed()) {
      event.sender.send("file-changed", { eventType });
    }
  });

  if (intervalId) clearInterval(intervalId);

  intervalId = setInterval(() => {
    if (!mainWindow.isDestroyed())
      event.sender.send("file-changed", { eventType: "change" });
  }, 1000);
});

ipcMain.handle("unwatch-client-directory", async () => {
  watcher.close();
});

ipcMain.handle("restart-ftp-reload-interval", async (event) => {
  if (!mainWindow.isDestroyed())
    event.sender.send("restart-ftp-reload-interval");
});

ipcMain.handle("open-selected-client-directory", async (event, path) => {
  await shell.openPath(path);
});

ipcMain.handle("delete-client-file", async (event, path) => {
  try {
    await fs.promises.unlink(path);
    return { success: true, message: "File deleted successfully" };
  } catch (error) {
    let log = {
      logType: "Error",
      id: uuidv4(),
      type: "Error - Delete Client Files",
      open: false,
      description: error.message,
    };
    addLog(event, log);
    return { success: false, message: error.message };
  }
});


ipcMain.handle("delete-client-directory", async (event, path) => {
  try {
    await fs.promises.rmdir(path);
    return { success: true, message: "Folder deleted successfully" };
  } catch (error) {
    let log = {
      logType: "Error",
      id: uuidv4(),
      type: "Error - Delete Client Directory",
      open: false,
      description: error.message,
    };
    addLog(event, log);
    return { success: false, message: error.message };
  }
});

ipcMain.handle("sync-progress-end", async (event) => {
  if (!mainWindow.isDestroyed())
    event.sender.send("sync-progress-end");
});

ipcMain.handle("sync-progress-pause", async (event) => {
  if (!mainWindow.isDestroyed())
    event.sender.send("sync-progress-pause");
});


ipcMain.handle("sync-progress-start", async (event, currentFiles, type) => {
  if (!mainWindow.isDestroyed())
    event.sender.send("sync-progress-start", currentFiles, type);

});

ipcMain.handle("sync-progress-start-loading", async (event) => {
  if (!mainWindow.isDestroyed())
    event.sender.send("sync-progress-start-loading");
});

ipcMain.handle("sync-progress-stop-loading", async (event) => {
  if (!mainWindow.isDestroyed())
    event.sender.send("sync-progress-stop-loading");
});

ipcMain.handle("disableAutoReconnectChanged", async (event) => {
  if (!mainWindow.isDestroyed())
    event.sender.send("disableAutoReconnectChanged");
});

ipcMain.handle("autoReconnectChanged", async (event) => {
  if (!mainWindow.isDestroyed())
    event.sender.send("autoReconnectChanged");
});


ipcMain.handle("exit", async () => {
  app.exit();
});

ipcMain.handle("add-log", (event, log) => {
  addLog(event, log);
});

ipcMain.handle("get-logs", () => {
  return store.get("logs", []);
});

ipcMain.handle("update-log", (event, index, updatedUpload) => {
  const logs = store.get("logs", []);
  logs[index] = updatedUpload;
  store.set("logs", logs);
  event.sender.send("log-changed");
});


ipcMain.handle("delete-log", (event, id) => {
  const logs = store.get("logs", []);
  const index = logs.findIndex((log) => log.id === id);
  logs.splice(index, 1);
  store.set("logs", logs);
  event.sender.send("log-changed");
});

ipcMain.handle("delete-all-logs", (event) => {
  store.set("logs", []);
  event.sender.send("log-changed");
});
const addLog = (event, log) => {
  const logs = store.get("logs", []);

  if(logs.length > 0){
    let tmpLatestLog = JSON.parse(JSON.stringify(logs[logs.length - 1])); // tiefe Kopie
    let tmpNewLog = JSON.parse(JSON.stringify(log)); // tiefe Kopie

    delete tmpLatestLog.id;
    delete tmpNewLog.id;

    if(JSON.stringify(tmpLatestLog) === JSON.stringify(tmpNewLog)){
      console.log('same log', tmpLatestLog, tmpNewLog);
      event.sender.send("log-changed");
      return;
    }
  }

  let index = logs.findIndex((l) => l.id === log.id);

  if (index !== -1) {
    logs[index] = log;
  } else {
    logs.push(log);
  }

  store.set("logs", logs);
  event.sender.send("log-changed");
}
