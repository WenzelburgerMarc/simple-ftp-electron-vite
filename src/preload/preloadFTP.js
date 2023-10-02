import sftpClient from "ssh2-sftp-client";

import { ref } from "vue";
import * as path from "path";
import * as fs from "fs";
import { ipcRenderer } from "electron";

let sftp = new sftpClient();
let isConnected = false;
let files = [];


export const setConnected = (status) => {
  isConnected = status;
};

export const setFiles = (fileList) => {
  files = fileList;
};

export const getIsConnected = () => {
  return isConnected;
};

export const getFiles = () => {
  return files;
};

export const connectFTP = async (ftpSettings) => {
  try {
    await sftp.connect({
      host: ftpSettings.host,
      port: ftpSettings.port,
      username: ftpSettings.username,
      password: ftpSettings.password
    });
    setConnected(true);
  } catch (error) {
    setConnected(false);
    throw new Error("Failed to connect to FTP Server");
  }
};

export const disconnectFTP = async () => {
  try {
    await sftp.end();
    setConnected(false);
  } catch (error) {
    setConnected(false);
  }
};
let currentDir = ref(null);

export const setCurrentDir = (dir) => {
  currentDir.value = dir;
};

export const getCurrentDir = () => {
  return currentDir;
};

export const listFilesAndDirectories = async (remoteDir = currentDir.value) => {
  if (!isConnected) {
    return;
  }
  if (remoteDir === null) {
    remoteDir = await ipcRenderer.invoke("get-setting", "ftp-sync-directory") || "/";
  }
  try {
    const fileObjects = await sftp.list(remoteDir);
    const files = [];
    for (const file of fileObjects) {
      files.push(file);
    }
    setFiles(files);
  } catch (error) {
    console.log(error);
  }
};

export const deleteFile = async (file) => {
  if (!isConnected) {
    return;
  }

  await sftp.delete(file);
};

export const createnewFolder = async (selectedDirectory) => {
  if (!isConnected) {
    throw new Error("Not connected to FTP server");
  }

  try {
    await sftp.mkdir(selectedDirectory, true);
    console.log(`Directory created at ${selectedDirectory}`);
  } catch (error) {
    console.error(`Error creating directory at ${selectedDirectory}:`, error);
    throw error;
  }
};

export const deleteDirectory = async (directory) => {
  if (!isConnected) {
    throw new Error("Not connected to FTP server");
  }

  try {
    await sftp.rmdir(directory, true);
  } catch (error) {
    console.error(`Error creating directory at ${directory}:`, error);
    throw error;
  }
};
const uploadFiles = async (clientSyncPath, ftpSyncPath, lastModifiedTimes) => {
  try {
    const files = fs.readdirSync(clientSyncPath);
    const serverFiles = await sftp.list(ftpSyncPath);

    for (const file of files) {
      const filePath = path.join(clientSyncPath, file);
      const stats = fs.statSync(filePath);

      if (stats.isFile()) {
        const serverFile = serverFiles.find(f => f.name === file);

        const localMtime = Math.floor(new Date(stats.mtime).getTime() / 1000);
        const serverMtime = serverFile ? Math.floor(new Date(serverFile.modifyTime).getTime() / 1000) : null;

        const shouldUpload = !serverFile || localMtime > serverMtime;

        if (shouldUpload) {
          try {
            await sftp.put(filePath, path.join(ftpSyncPath, file));
            console.log(`Uploaded: ${file}`);
          } catch (error) {
            console.error(`Failed to upload ${file}:`, error);
          }

          lastModifiedTimes[file] = localMtime * 1000;
        }
      }
    }
    await ipcRenderer.invoke("set-setting", "lastModifiedTimes", lastModifiedTimes);
  } catch (error) {
    console.error('Error in uploadFiles:', error);
  }
};



export const startSyncing = async (mode, clientSyncPath, ftpSyncPath) => {
  let interval = await ipcRenderer.invoke("get-setting", "autoUploadInterval");

  setInterval(async () => {
    if (!isConnected) {
      console.error("Not connected to FTP server");
      return;
    }

    if (mode === "upload") {
      let lastModifiedTimes = await ipcRenderer.invoke("get-setting", "lastModifiedTimes") || {};
      console.log(lastModifiedTimes);
      await uploadFiles(clientSyncPath, ftpSyncPath, lastModifiedTimes);
    } else if (mode === "download") {
      // Implement download logic...
      console.log("Download mode is selected");
    } else {
      console.error("Invalid mode selected");
    }
  }, interval);
};


export const stopSyncing = async () => {
  if (!isConnected) {
    throw new Error("Not connected to FTP server");
  }

  console.log("Stopping sync");
};
