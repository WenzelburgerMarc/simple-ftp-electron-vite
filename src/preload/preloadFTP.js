import sftpClient from "ssh2-sftp-client";

import { ref } from "vue";
import * as path from "path";
import * as fs from "fs";
import { ipcRenderer } from "electron";

let sftp = new sftpClient();
let isConnected = false;
let files = [];
let syncMode = null;
export const setSyncMode = (mode) => {
  syncMode = mode;
};

export const getSyncMode = () => {
  return syncMode;
};

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


export const calculateDirectorySize = async (dirPath, isLocal, filesToUpload) => {
  // calculate client size with files to upload
  if (isLocal) {
    let size = 0;
    for (const file of filesToUpload) {
      const filePath = path.join(dirPath, file);
      const stats = fs.statSync(filePath);
      size += stats.size;
    }
    return size;
  }else {

    try {
      const fileObjects = await sftp.list(dirPath);
      let size = 0;
      for (const file of fileObjects) {
        if (filesToUpload.includes(file.name)) {
          size += file.size;
        }
      }
      return size;
    }catch (error) {
      console.error('Error calculating ftp directory size:', error);
    }
  }
};

export const calculateAndCompareSize = async (clientPath, ftpPath) => {
  try {

    const filesToUpload = currentFilesToUpload;
    const clientSize = await calculateDirectorySize(clientPath, true, filesToUpload);
    const serverSize = await calculateDirectorySize(ftpPath, false, filesToUpload);

    if (clientSize === 0 && serverSize === 0) {
      console.log('Nothing to synchronize. Both directories are empty or synchronized.');
      return '100';
    } else if (clientSize === 0) {
      console.error('No files to upload from the client directory.');
      return '0';
    } else {
      const progress = (serverSize / clientSize) * 100;
      console.log(`Synchronization progress: ${progress.toFixed(2)}%`);
      return progress.toFixed(2);
    }
  } catch (error) {
    console.error('Error calculating sizes:', error);
  }
};


const getFilesToUpload = async (clientSyncPath, ftpSyncPath, lastModifiedTimes) => {
  try {
    const items = fs.readdirSync(clientSyncPath);
    const serverItems = await sftp.list(ftpSyncPath);
    const filesToUpload = [];

    for (const item of items) {
      const localPath = path.join(clientSyncPath, item);
      const serverPath = path.join(ftpSyncPath, item);
      const stats = fs.statSync(localPath);

      if (stats.isFile()) {
        const serverFile = serverItems.find(f => f.name === item);
        const localMtime = Math.floor(new Date(stats.mtime).getTime() / 1000);
        const serverMtime = serverFile ? Math.floor(new Date(serverFile.modifyTime).getTime() / 1000) : null;

        const localSize = stats.size;
        const serverSize = serverFile ? serverFile.size : null;
        const sizeMismatch = serverSize !== null && localSize !== serverSize;

        const shouldUpload = !serverFile || localMtime > serverMtime || sizeMismatch;

        if (shouldUpload) {
          filesToUpload.push(item);
        }
      } else if (stats.isDirectory()) {
        if (!serverItems.find(f => f.name === item)) {
          await sftp.mkdir(serverPath, true);

        }
        const subFiles = await getFilesToUpload(localPath, serverPath, lastModifiedTimes);
        filesToUpload.push(...subFiles.map(subFile => path.join(item, subFile)));
      }
    }

    return filesToUpload;
  } catch (error) {
    console.error('Error in getFilesToUpload:', error);
    return [];
  }
};

let currentFilesToUpload = [];
const uploadFiles = async (clientSyncPath, ftpSyncPath, lastModifiedTimes) => {

  try {
    const newFilesToUpload = await getFilesToUpload(clientSyncPath, ftpSyncPath, lastModifiedTimes);
    currentFilesToUpload = [...currentFilesToUpload, ...newFilesToUpload];
    currentFilesToUpload = [...new Set(currentFilesToUpload)];
    const items = currentFilesToUpload;
    const serverItems = await sftp.list(ftpSyncPath);
    await ipcRenderer.invoke("sync-progress-start");
    for (const item of items) {
      const localPath = path.join(clientSyncPath, item);
      const serverPath = path.join(ftpSyncPath, item);
      const stats = fs.statSync(localPath);

      if (stats.isFile()) {
        const serverFile = serverItems.find(f => f.name === item);

        const localMtime = Math.floor(new Date(stats.mtime).getTime() / 1000);
        const serverMtime = serverFile ? Math.floor(new Date(serverFile.modifyTime).getTime() / 1000) : null;

        const localSize = stats.size;
        const serverSize = serverFile ? serverFile.size : null;
        const sizeMismatch = serverSize !== null && localSize !== serverSize;

        const shouldUpload = !serverFile || localMtime > serverMtime || sizeMismatch;


        if (shouldUpload) {
          try {
            await ipcRenderer.invoke("sync-file-start", item);
            await sftp.put(localPath, serverPath);
          } catch (error) {
            console.error(`Failed to upload ${item}:`, error);
          }

          lastModifiedTimes[item] = localMtime * 1000;
        }
      } else if (stats.isDirectory()) {
        // create path if it does not exist
        if (!serverItems.find(f => f.name === item)) {
          await sftp.mkdir(serverPath, true);
        }
        await uploadFiles(localPath, serverPath, lastModifiedTimes);
      }
    }

    let clientSize = await calculateDirectorySize(clientSyncPath, true, currentFilesToUpload);
    let serverSize = await calculateDirectorySize(ftpSyncPath, false, currentFilesToUpload);

    const intervalId = setInterval(async () => {
      try {
        clientSize = await calculateDirectorySize(clientSyncPath, true, currentFilesToUpload);
        serverSize = await calculateDirectorySize(ftpSyncPath, false, currentFilesToUpload);

        if(clientSize === serverSize){
          await ipcRenderer.invoke("set-setting", "lastModifiedTimes", lastModifiedTimes);
          await listFilesAndDirectories();
          await ipcRenderer.invoke("sync-file-end");
          currentFilesToUpload = [];
          taskFinishedOnceBefore = true;
          clearInterval(intervalId);
        }
      } catch (error) {
        console.error('Error in size comparison interval:', error);
        clearInterval(intervalId);
      }
    }, 1000);

  } catch (error) {
    console.error('Error in uploadFiles:', error);
    currentFilesToUpload = currentFilesToUpload.filter(file => file !== error.path);
  }
};

const downloadFiles = async (clientSyncPath, ftpSyncPath) => {
  try {
    const serverItems = await sftp.list(ftpSyncPath);
    await ipcRenderer.invoke("sync-progress-start");

    for (const item of serverItems) {
      const localPath = path.join(clientSyncPath, item.name);
      const serverPath = path.join(ftpSyncPath, item.name);


      if (item.type === '-' || item.type === 'f') {
        const fileExistsLocally = fs.existsSync(localPath);
        let shouldDownload = !fileExistsLocally;

        if (fileExistsLocally) {
          const localStats = fs.statSync(localPath);
          const localMtime = Math.floor(new Date(localStats.mtime).getTime() / 1000);
          const serverMtime = Math.floor(new Date(item.modifyTime).getTime() / 1000);

          const localSize = localStats.size;
          const serverSize = item.size;
          const sizeMismatch = localSize !== serverSize;
          console.log(sizeMismatch);
          // add size mismatch if first time is done
          shouldDownload = serverMtime > localMtime;
        }

        if (shouldDownload) {
          try {
            await sftp.fastGet(serverPath, localPath);
            console.log(`Downloaded: ${item.name}`);
          } catch (error) {
            console.error(`Failed to download ${item.name}:`, error);
          }
        }
      } else if (item.type === 'd') {
        if (!fs.existsSync(localPath)) {
          fs.mkdirSync(localPath, { recursive: true });
        }
        await downloadFiles(localPath, serverPath);
      }
    }
  } catch (error) {
    console.error('Error in downloadFiles:', error);
  }
};


let intervalMethod = null;
export const startSyncing = async (mode, clientSyncPath, ftpSyncPath) => {

  let interval = await ipcRenderer.invoke("get-setting", "autoUploadInterval");

  if(intervalMethod){
    clearInterval(intervalMethod);
  }
  intervalMethod = setInterval(async () => {
    if (!isConnected) {
      console.error("Not connected to FTP server");
      return;
    }

    if (mode === "upload") {

      let lastModifiedTimes = await ipcRenderer.invoke("get-setting", "lastModifiedTimes") || {};
      console.log(lastModifiedTimes);
      taskFinishedOnceBefore = false;
      await uploadFiles(clientSyncPath, ftpSyncPath, lastModifiedTimes);
    } else if (mode === "download") {
      await downloadFiles(clientSyncPath, ftpSyncPath);
      console.log("Download mode is selected");

    } else {
      console.error("Invalid mode selected");
    }
  }, interval);
};


export const stopSyncing = async () => {
  clearInterval(intervalMethod);
  console.log("Syncing stopped");
};
