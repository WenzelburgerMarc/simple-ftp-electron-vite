// Desc: This file contains all ipc handlers for the electron app
import Store from "electron-store";
import { ipcMain, app, shell } from "electron";
import { mainWindow } from "./window";
import {
  listLocalFiles,
  createNewClientFolder,
  copyFile,
  deleteClientFile,
  deleteClientDirectory,
  watchClientDirectory,
  unwatchClientDirectory,
  selectClientDirectory
} from "./fileSystem";
import {
  getLogs,
  addLog,
  updateLog,
  deleteLog,
  clearLogs,
  saveAllLogs
} from "./logs";


const store = new Store();
//store.delete("firstStart");

// Get all data from the electron store
ipcMain.handle("get-all-data", () => {
  return store.store;
});

// Exit the Applikation
ipcMain.handle("exit", async () => {
  app.exit();
});

// Password on Startup
ipcMain.handle("passwordEnteredSuccessfully", async (event) => {
  event.sender.send("passwordEnteredSuccessfully");
});

// send Flash Message
ipcMain.handle("flash-message", async (event, message, type) => {
  if (mainWindow && !mainWindow.isDestroyed())
    event.sender.send("flash-message", message, type);
});

// Get auto start item setting
ipcMain.handle("get-auto-start-item-setting", () => {

  return app.getLoginItemSettings();
});

// Get a setting
ipcMain.handle("get-setting", (event, key) => {
  return store.get(key);
});

// Set a setting
ipcMain.handle("set-setting", (event, key, value) => {
  store.set(key, value);
});

// Restart FTP Reload Interval
ipcMain.handle("restart-ftp-reload-interval", async (event) => {
  if (mainWindow && !mainWindow.isDestroyed())
    event.sender.send("restart-ftp-reload-interval");
});

// Set auto start item setting
ipcMain.handle("set-auto-start-item-setting", (event, settings) => {
  app.setLoginItemSettings({
    openAtLogin: settings.openAtLogin,
    args: ["--hidden"]
  });
  return app.getLoginItemSettings();
});

// Drag N Drop
ipcMain.handle("copy-file", async (event, sourcePath, destinationPath) => {
  return await copyFile(sourcePath, destinationPath);
});

// === File System Handler ===
// Open a directory in the file explorer
ipcMain.handle("open-selected-client-directory", async (event, path) => {
  await shell.openPath(path);
});

// Select a Client directory
ipcMain.handle("select-directory", async (event) => {
  return await selectClientDirectory(event);
});

// Create a new folder in the specified directory
ipcMain.handle("create-new-folder-client", async (event, selectedDirectory) => {
  return await createNewClientFolder(selectedDirectory);
});

// Delete a file from the specified path
ipcMain.handle("delete-client-file", async (event, filePath) => {
  return await deleteClientFile(filePath);
});

// Delete a directory from the specified path
ipcMain.handle("delete-client-directory", async (event, dirPath) => {
  return await deleteClientDirectory(dirPath);
});

// List all files in a specified directory
ipcMain.handle("list-local-files", async (event, dirPath) => {
  return await listLocalFiles(dirPath);
});

// Function to watch changes in a specified directory
ipcMain.handle("watch-client-directory", async (event, directoryPath) => {
  await watchClientDirectory(directoryPath, event);
});

// Function to stop watching changes in a specified directory
ipcMain.handle("unwatch-client-directory", async () => {
  await unwatchClientDirectory();
});

// === Sync Handler ===
// Sync Stopped
ipcMain.handle("sync-progress-end", async (event) => {
  if (mainWindow && !mainWindow.isDestroyed())
    event.sender.send("sync-progress-end");
});

// Sync Paused
ipcMain.handle("sync-progress-pause", async (event) => {
  if (mainWindow && !mainWindow.isDestroyed())
    event.sender.send("sync-progress-pause");
});

// Sync Started
ipcMain.handle("sync-progress-start", async (event, currentFiles, type) => {
  if (mainWindow && !mainWindow.isDestroyed())
    event.sender.send("sync-progress-start", currentFiles, type);

});

// Sync Progress Loading Start
ipcMain.handle("sync-progress-start-loading", async (event) => {
  if (mainWindow && !mainWindow.isDestroyed())
    event.sender.send("sync-progress-start-loading");
});

// Sync Progress Loading End
ipcMain.handle("sync-progress-stop-loading", async (event) => {
  if (mainWindow && !mainWindow.isDestroyed())
    event.sender.send("sync-progress-stop-loading");
});

// === Auto Reconnect Handler ===
// Disable auto reconnect
ipcMain.handle("disableAutoReconnectChanged", async (event) => {
  if (mainWindow && !mainWindow.isDestroyed())
    event.sender.send("disableAutoReconnectChanged");
});

// Auto Reconnect Changed
ipcMain.handle("autoReconnectChanged", async (event) => {
  if (mainWindow && !mainWindow.isDestroyed())
    event.sender.send("autoReconnectChanged");
});

// === Log Handler ===
// Add a new log entry to the store
ipcMain.handle("add-log", async(event, log) => {
  await addLog(log);
  event.sender.send("log-changed");
});

// Get all logs from the store
ipcMain.handle("get-logs", async() => {
  return await getLogs();
});

// Add a new log entry to the store
ipcMain.handle("update-log", async(event, logId, updatedData) => {
  await updateLog(logId, updatedData);
  event.sender.send("log-changed");
});

// Update a specific log in the store using its unique ID
ipcMain.handle("delete-log", async(event, logId) => {
  await deleteLog(logId);
  event.sender.send("log-changed");
});

// Delete a log from the store using its unique ID
ipcMain.handle("save-all-logs", async () => {
  await saveAllLogs();
});

// Clear all logs from the store
ipcMain.handle("delete-all-logs", async(event) => {
  await clearLogs();
  event.sender.send("log-changed");
});
