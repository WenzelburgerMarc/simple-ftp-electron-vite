import { reactive, ref } from "vue";
import { displayFlash } from "./flashMessageController";
import { startLoading, stopLoading } from "./loaderManager";

export const isModalVisible = ref(false);
export const connected = ref(false);
export const fileList = reactive([]);
export const currentDir = ref(null);

export const openModal = () => {
  isModalVisible.value = true;
};

export const updateModalVisibility = (newVisibility) => {
  isModalVisible.value = newVisibility;
};


export const connect = (ftpSettings) => {
  startLoading();
  // eslint-disable-next-line no-async-promise-executor
  return new Promise(async (resolve, reject) => {
    try {
      if (window.ftp.getIsConnected()) {
        await window.ftp.disconnectFTP();
        connected.value = window.ftp.getIsConnected();
      }
      await window.ftp.connectFTP(ftpSettings);
      connected.value = window.ftp.getIsConnected();
      if (connected.value) {
        await listFilesAndDirectories();
        displayFlash("Connected to FTP Server", "success");
        stopLoading();
        resolve(true);
      } else {
        displayFlash("Failed to connect to FTP Server", "error");
        stopLoading();
        reject(new Error("Failed to connect to FTP Server"));
      }
    } catch (Exception) {
      displayFlash("Failed to connect to FTP Server", "error");
      stopLoading();
      reject(Exception);
    }
  });
};


export const disconnect = async () => {
  try {
    startLoading()
    await window.ftp.disconnectFTP();
    connected.value = window.ftp.getIsConnected();
    stopLoading();
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

export const getFileList = () => {
  return fileList.value;
}
export const listFilesAndDirectories = async (remoteDir = currentDir.value) => {
  if (!connected.value) {
    return;
  }

  if(remoteDir === null) {
    remoteDir = await window.ipcRendererInvoke("get-setting", "ftp-sync-directory") || "/";
  }

  try {
    startLoading();
    await window.ftp.listFilesAndDirectories(remoteDir);

    fileList.value = window.ftp.getFiles();
    stopLoading();
  } catch (error) {
    stopLoading();
    console.log(error);
    displayFlash("Failed to list files", "error");
  }
};


