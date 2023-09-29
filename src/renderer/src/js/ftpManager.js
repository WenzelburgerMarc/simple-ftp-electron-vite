import { ref } from "vue";
import { displayFlash } from "./flashMessageController";
import { startLoading, stopLoading } from "./loaderManager";

export const isModalVisible = ref(false);
export const connected = ref(false);
export const fileList = ref([]);

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
        await listFiles();
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

export const listFiles = async () => {
  try {
    startLoading();
    await window.ftp.listFiles();
    fileList.value = window.ftp.getFiles();
    stopLoading();
  } catch (Exception) {
    stopLoading();
    displayFlash("Failed to list files", "error");
  }

};
