// Desc: Expose main process functionality to the renderer process
"use strict";
import { contextBridge, ipcRenderer } from "electron";
import {
  connectFTP,
  disconnectFTP,
  getIsConnected,
  getFiles,
  setCurrentDir,
  getCurrentDir,
  listFilesAndDirectories,
  deleteFile,
  createNewFolder,
  deleteDirectory,
  startSyncing,
  stopSyncing,
  getSyncMode,
  setSyncMode,
  calculateAndCompareSize, clearFilesAfterModeSwitch, getAllFtpFileTypes

} from "./preloadFTP";
import { online } from "./isOnline";
import { v4 as uuidv4 } from "uuid";

// Expose the ipcRenderer Invoke Function to the renderer process
contextBridge.exposeInMainWorld("ipcRendererInvoke", (channel, ...args) => {
  return ipcRenderer.invoke(channel, ...args);
});

// Expose the ipcRenderer On Function to the renderer process
contextBridge.exposeInMainWorld("ipcRendererOn", (channel, callback) => {
  ipcRenderer.on(channel, (event, ...args) => {
    callback(event, ...args);
  });
});

// Expose the ipcRenderer Off Function to the renderer process
contextBridge.exposeInMainWorld("ipcRendererOff", (channel, callback) => {
  ipcRenderer.off(channel, (event, ...args) => {
    callback(event, ...args);
  });
});


// Expose FTP Functionality to the renderer process
contextBridge.exposeInMainWorld("ftp", {
  connectFTP,
  disconnectFTP,
  getIsConnected,
  getFiles,
  setCurrentDir,
  getCurrentDir,
  listFilesAndDirectories,
  deleteFile,
  createNewFolder,
  deleteDirectory,
  startSyncing,
  stopSyncing,
  getSyncMode,
  setSyncMode,
  calculateAndCompareSize,
  clearFilesAfterModeSwitch,
  getAllFtpFileTypes
});


// Export some extra functions to the renderer process
contextBridge.exposeInMainWorld("api", {
  baseUrl: process.env.BASE_URL,
  isOnline: online,
  getUUID: () => uuidv4(),
  selectDirectory: async () => {
    return await ipcRenderer.invoke("select-directory");
  },
  getAutoStartItemSetting: () => ipcRenderer.invoke("get-auto-start-item-setting"),
  setAutoStartItemSetting: (settings) => ipcRenderer.invoke("set-auto-start-item-setting", settings)
});
