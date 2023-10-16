// Desc: Renderer process logic for managing FTP connections
import { reactive, ref } from "vue";
import { displayFlash } from "./flashMessageController";
import { startLoading, stopLoading } from "./loaderManager";
import {setSetting, getSetting} from "./manageSettings";

export const connected = ref(false);
export const fileList = reactive([]);
export const currentDir = ref(null);

export const currentSyncMode = ref();

export const setIsConnected = (value) => {
  connected.value = value;
};

export const connect = (ftpSettings, justTest = false) => {
  startLoading();

  /* eslint-disable */
  return new Promise(async (resolve, reject) => {
    const handleConnectionError = (message) => {
      displayFlash(message, "error");
      stopLoading();
      let log = {
        logType: "Error",
        id: window.api.getUUID(),
        type: "Error - Connect to FTP",
        open: false,
        description: message
      }
      window.ipcRendererInvoke("add-log", log);
      reject(new Error(message));
    };

    try {
      let host = await getSetting("ftpHost");
      let port = await getSetting("ftpPort");
      let username = await getSetting("ftpUsername");
      let password = await getSetting("ftpPassword");
      let clientSyncPath = await getSetting("clientSyncPath");
      let ftpSyncDirectory = await getSetting("ftp-sync-directory");

      if (!host || !port || !username || !password) {
        return handleConnectionError("Please set FTP-Connection Settings");
      }

      if (!clientSyncPath) {
        return handleConnectionError("Please set Client Sync Path");
      }

      if (!ftpSyncDirectory) {
        await setSetting("ftp-sync-mode", "");
        await setSetting("ftp-sync-directory", "/");
      }

      if (window.ftp.getIsConnected()) {
        await window.ftp.disconnectFTP();
        connected.value = false;
      }

      await window.ftp.connectFTP(ftpSettings);
      connected.value = window.ftp.getIsConnected();

      if (!connected.value) {
        return handleConnectionError("Failed to connect to FTP Server");
      }

      if (justTest) {
        displayFlash("FTP-Connection Settings are valid", "success");
        await disconnect(true, true);
        stopLoading();
        return resolve(true);
      }
      displayFlash("Connected to FTP Server", "success");
      await listFilesAndDirectories();
      await startSyncing(
        await getSetting("ftp-sync-mode"),
        await getSetting("clientSyncPath"),
        await getSetting("ftp-sync-directory")
      );
      stopLoading();
      return resolve(true);
    } catch (error) {
      handleConnectionError("Failed to connect to FTP Server due to an error: " + error.message);
    }
  });
};


export const disconnect = async (deleteSyncModeInStore = false, hideFlashMessage = false) => {
  try {
    startLoading();
    let previousConnectionStatus = connected.value;

    await window.ftp.disconnectFTP();
    connected.value = window.ftp.getIsConnected();
    if (deleteSyncModeInStore) {
      await setSetting("ftp-sync-mode", "");
    }
    stopLoading();
    if (hideFlashMessage) return;
    if (previousConnectionStatus) {
      displayFlash("Disconnected from FTP Server", "success");
    }

  } catch (Exception) {
    stopLoading();
    if (hideFlashMessage) return;
    displayFlash("Failed to disconnect from FTP Server", "error");
  }
};

export const setCurrentDir = (dir) => {
  currentDir.value = dir;
};

export const getCurrentDir = () => {
  return currentDir.value;
};

export const getCurrentSyncMode = () => {
  return currentSyncMode.value;
};
export const getFileList = () => {
  return fileList.value;
};
export const listFilesAndDirectories = async (remoteDir = currentDir.value, showLoader = true) => {
  if (!connected.value) {
    return;
  }

  if (remoteDir === null) {
    remoteDir = await getSetting("ftp-sync-directory") || "/";
  }

  try {
    if (showLoader)
      startLoading();

    await window.ftp.listFilesAndDirectories(remoteDir);
    fileList.value = window.ftp.getFiles();

    stopLoading();

  } catch (error) {
    stopLoading();
    let log = {
      logType: "Error",
      id: window.api.getUUID(),
      type: "Error - List Files",
      open: false,
      description: error.message
    };
    window.ipcRendererInvoke("add-log", log);
    displayFlash("Failed to list files", "error");

  }
};

export const deleteFile = async (file) => {
  if (!connected.value) {
    return;
  }
  startLoading();

  await window.ftp.deleteFile(file)
    .then(async () => {
      await listFilesAndDirectories();
      stopLoading();
      displayFlash("Deleted file", "success");
    })
    .catch((error) => {
      stopLoading();
      let log = {
        logType: "Error",
        id: window.api.getUUID(),
        type: "Error - Delete File",
        open: false,
        description: error.message
      };
      window.ipcRendererInvoke("add-log", log);
      displayFlash(error.message, "error");

    });
};

export const deleteDirectory = async (directory) => {
  if (!connected.value) {
    return;
  }
  startLoading();

  await window.ftp.deleteDirectory(directory)
    .then(async () => {
      await listFilesAndDirectories();
      stopLoading();
      displayFlash("Deleted folder", "success");
    })
    .catch((error) => {
      stopLoading();
      let log = {
        logType: "Error",
        id: window.api.getUUID(),
        type: "Error - Delete Directory",
        open: false,
        description: error.message
      };
      window.ipcRendererInvoke("add-log", log);
      displayFlash(error.message, "error");

    });
};

export const createNewFolder = async (selectedDirectory) => {
  const result = await window.ftp.createNewFolder(selectedDirectory);
  if (result) {
    await listFilesAndDirectories();
    displayFlash("Created new folder", "success");
  }
};

export const startSyncing = async (mode, clientSyncPath, ftpSyncPath) => {

  if (!connected.value) {
    return;
  }
  try {

    await window.ftp.stopSyncing();
    await window.ftp.setSyncMode(mode);
    await window.ftp.startSyncing(mode, clientSyncPath, ftpSyncPath);

    currentSyncMode.value = window.ftp.getSyncMode();
    if (mode === "download" || mode === "upload")
      displayFlash("Syncing started", "success");

  } catch (e) {
    displayFlash(e.message, "error");
    await window.ftp.stopSyncing();
    stopLoading();

  }

};

export const stopSyncing = async () => {
  if (!connected.value) {
    return;
  }
  try {

    await window.ftp.setSyncMode("");
    await window.ftp.stopSyncing();
    displayFlash("Syncing stopped", "success");

    currentSyncMode.value = window.ftp.getSyncMode();
  } catch (e) {
    displayFlash(e.message, "error");
    stopLoading();
  }
};
