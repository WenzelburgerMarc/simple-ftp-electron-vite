"use strict";
import { contextBridge, ipcRenderer } from "electron";
import { connectFTP, disconnectFTP, listFiles, getIsConnected, getFiles } from "./preloadFTP";

// Expose protected methods that allow the renderer process to use
contextBridge.exposeInMainWorld("ipcRendererInvoke", (channel, ...args) => {
  return ipcRenderer.invoke(channel, ...args);
});

contextBridge.exposeInMainWorld("ftp", {
  connectFTP,
  disconnectFTP,
  listFiles,
  getIsConnected,
  getFiles
});



contextBridge.exposeInMainWorld("api", {
  baseUrl: process.env.BASE_URL,
  selectDirectory: async () => {
    return await ipcRenderer.invoke("select-directory");
  },
  getAutoStartItemSetting: () => ipcRenderer.invoke("get-auto-start-item-setting"),
  setAutoStartItemSetting: (settings) => ipcRenderer.invoke("set-auto-start-item-setting", settings)
});
