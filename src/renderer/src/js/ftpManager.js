import { ref} from 'vue';

import { displayFlash } from './flashMessageController';

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
  // eslint-disable-next-line no-async-promise-executor
  return new Promise(async (resolve, reject) => {
    try {
      console.log(ftpSettings);
      if (window.ftp.getIsConnected()) {
        await window.ftp.disconnectFTP();
        connected.value = window.ftp.getIsConnected();
      }
      await window.ftp.connectFTP(ftpSettings);
      connected.value = window.ftp.getIsConnected();
      if (connected.value) {
        await listFiles();
        displayFlash("Connected to FTP Server", "success");
        resolve(true);
      } else {
        displayFlash("Failed to connect to FTP Server", "error");
        reject(new Error("Failed to connect to FTP Server"));
      }
    } catch (Exception) {
      displayFlash("Failed to connect to FTP Server", "error");
      reject(Exception);
    }
  });
};


export const disconnect = async () => {
    try {
        await window.ftp.disconnectFTP();
        connected.value = window.ftp.getIsConnected();
        displayFlash("Disconnected from FTP Server", "success");
    } catch (Exception) {
        displayFlash("Failed to disconnect from FTP Server", "error");
    }
}

export const listFiles = async () => {
    try {
        await window.ftp.listFiles();
        fileList.value = window.ftp.getFiles();

    } catch (Exception) {
        displayFlash("Failed to list files", "error");
    }

};
