import { reactive, ref } from "vue";
import { displayFlash } from "./flashMessageController";
import { startLoading, stopLoading } from "./loaderManager";

export const isModalVisible = ref(false);
export const connected = ref(false);
export const fileList = reactive([]);
export const currentDir = ref(null);

export const currentSyncMode = ref();

export const openModal = () => {
  isModalVisible.value = true;
};

export const updateModalVisibility = (newVisibility) => {
  isModalVisible.value = newVisibility;
};

export const connect = (ftpSettings, justTest = false) => {
  startLoading();

  /* eslint-disable */
  return new Promise(async (resolve, reject) => {
    const handleConnectionError = (message) => {
      displayFlash(message, 'error');
      stopLoading();
      reject(new Error(message));
    };

    try {
      if (window.ftp.getIsConnected()) {
        await window.ftp.disconnectFTP();
        connected.value = false;
      }

      await window.ftp.connectFTP(ftpSettings);
      connected.value = window.ftp.getIsConnected();

      if (!connected.value) {
        return handleConnectionError('Failed to connect to FTP Server');
      }

      if (justTest) {
        displayFlash('FTP-Connection Settings are valid', 'success');
        await disconnect(false, true);
        stopLoading();
        return resolve(true);
      }

      await listFilesAndDirectories();
      await startSyncing(
        await window.ipcRendererInvoke('get-setting', 'ftp-sync-mode'),
        await window.ipcRendererInvoke('get-setting', 'clientSyncPath'),
        await window.ipcRendererInvoke('get-setting', 'ftp-sync-directory')
      );
      displayFlash('Connected to FTP Server', 'success');
      stopLoading();
      return resolve(true);
    } catch (error) {
      handleConnectionError('Failed to connect to FTP Server due to an error: ' + error.message);
    }
  });
};



export const disconnect = async (deleteSyncModeInStore = false, hideFlashMessage = false) => {
  try {
    startLoading();
    await window.ftp.disconnectFTP();
    connected.value = window.ftp.getIsConnected();
    if (deleteSyncModeInStore) {
      await window.ipcRendererInvoke("set-setting", "ftp-sync-mode", "");
    }
    stopLoading();
    if(hideFlashMessage) return;
    displayFlash("Disconnected from FTP Server", "success");
  } catch (Exception) {
    stopLoading();
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
    console.log("Not connected to the server");
    return;
  }

  if (remoteDir === null) {
    remoteDir = await window.ipcRendererInvoke("get-setting", "ftp-sync-directory") || "/";
  }

  try {
    if (showLoader)
      startLoading();

    await window.ftp.listFilesAndDirectories(remoteDir);
    fileList.value = window.ftp.getFiles();
    console.log(fileList.value);

    stopLoading();

  } catch (error) {
    stopLoading();
    console.log(error);
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
      console.log(error);
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
      console.log(error);
      displayFlash(error.message, "error");

    });
};


export const createNewFolder = async (selectedDirectory) => {
  const result = await window.ftp.createnewFolder(selectedDirectory);
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
    console.log(mode);
    currentSyncMode.value = window.ftp.getSyncMode();
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
