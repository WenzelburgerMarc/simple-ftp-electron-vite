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


export const calculateDirectorySize = async (dirPath, isLocal, files) => {
  if (isLocal) {

    let size = 0;

    for (const file of files) {
      console.log("calculateDirectorySize: " + file);
      const filePath = path.join(dirPath, file.name);
      try {
        if (fs.existsSync(filePath)) {
          const stats = await fs.promises.stat(filePath);
          size += stats.size;
        } else {
          console.log(`File does not exist yet: ${filePath}`);
          console.log(file);
        }
      } catch (error) {
        console.error(`Error accessing ${filePath}:`, error);
      }
    }


    return size;
  } else {

    try {
      const fileObjects = await sftp.list(dirPath);
      let size = 0;
      for (const file of fileObjects) {
        try {
          if (files.find(f => f.name === file.name)) {
            size += file.size;
          }
        } catch (error) {
          console.error(`Error accessing ${file.name}:`, error);
        }
      }
      return size;
    } catch (error) {
      console.error("Error calculating ftp directory size:", error);
    }
  }
};

let progress = 0;
export const calculateAndCompareSize = async (mode, clientPath, ftpPath) => {
  try {

    console.log('calculate progress: ',mode, clientPath, ftpPath);
    let files = null;
    if (mode === "upload") {
      files = currentFilesToUpload;
    } else if (mode === "download") {
      files = currentDownloadFiles;
    }


    const clientSize = await calculateDirectorySize(clientPath, true, files);
    const serverSize = await calculateDirectorySize(ftpPath, false, files);

    if (clientSize === 0 && serverSize === 0) {
      console.log("Nothing to synchronize. Both directories are empty or synchronized.");
      return "100";
    } else if (clientSize === 0) {
      console.error("No files to sync from the client directory.");
      return progress.toFixed(2);
    } else {

      if (mode === "upload") {
        progress = (serverSize / clientSize) * 100;
      } else {
        progress = (clientSize / serverSize) * 100;
      }
      console.log(`Synchronization progress: ${progress.toFixed(2)}%`);
      return progress.toFixed(2);
    }
  } catch (error) {
    console.error("Error calculating sizes:", error);
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
          filesToUpload.push({ name: item, path: localPath, size: localSize, mtime: localMtime });
        }
      } else if (stats.isDirectory()) {
        if (!serverItems.find(f => f.name === item)) {
          await sftp.mkdir(serverPath, true);
        }
        const subFiles = await getFilesToUpload(localPath, serverPath, lastModifiedTimes);
        filesToUpload.push(...subFiles);
      }
    }

    return filesToUpload;
  } catch (error) {
    console.error("Error in getFilesToUpload:", error);
    return [];
  }
};

let currentFilesToUpload = [];
let currentlyUploading = false;
const uploadFiles = async (clientSyncPath, ftpSyncPath, lastModifiedTimes) => {
  if (!currentlyUploading) {
    currentlyUploading = true;
    try {

      const newFilesToUpload = await getFilesToUpload(clientSyncPath, ftpSyncPath, lastModifiedTimes);
      currentFilesToUpload = [...new Set([...currentFilesToUpload, ...newFilesToUpload])];

      await ipcRenderer.invoke("sync-progress-start");

      for (const file of currentFilesToUpload) {
        const localPath = file.path;
        const serverPath = path.join(ftpSyncPath, file.name);

        try {
          await ipcRenderer.invoke("sync-file-start", file.name);
          await sftp.put(localPath, serverPath);
          lastModifiedTimes[file.name] = file.mtime * 1000;
        } catch (error) {
          console.error(`Failed to upload ${file.name}:`, error);
        }
      }

      let clientSize = await calculateDirectorySize(clientSyncPath, true, currentFilesToUpload);
      let serverSize = await calculateDirectorySize(ftpSyncPath, false, currentFilesToUpload);

      const intervalId = setInterval(async () => {
        try {
          clientSize = await calculateDirectorySize(clientSyncPath, true, currentFilesToUpload);
          serverSize = await calculateDirectorySize(ftpSyncPath, false, currentFilesToUpload);

          if (clientSize === serverSize) {
            await ipcRenderer.invoke("set-setting", "lastModifiedTimes", lastModifiedTimes);
            await listFilesAndDirectories();
            await ipcRenderer.invoke("sync-file-end");
            currentFilesToUpload = [];
          currentlyUploading = false;
            clearInterval(intervalId);
          }
        } catch (error) {
          currentlyUploading = false;
          console.error("Error in size comparison interval:", error);
          clearInterval(intervalId);
        }
      }, 1000);

    } catch (error) {
      console.error("Error in uploadFiles:", error);
      currentFilesToUpload = currentFilesToUpload.filter(file => file.path !== error.path);
    }
  }
};


const getFilesToDownload = async (clientSyncPath, ftpSyncPath) => {
  try {
    const items = await sftp.list(ftpSyncPath);
    const filesToDownload = [];

    for (const item of items) {
      const localPath = path.join(clientSyncPath, item.name);
      const serverPath = path.join(ftpSyncPath, item.name);

      if (item.type === "-" || item.type === "f") {  // Checking if it's a file
        const fileExistsLocally = fs.existsSync(localPath);
        let shouldDownload = true;

        if (fileExistsLocally) {
          const localStats = fs.statSync(localPath);
          const localMtime = Math.floor(new Date(localStats.mtime).getTime() / 1000);
          const serverMtime = Math.floor(new Date(item.modifyTime).getTime() / 1000);

          const localSize = localStats.size;
          const serverSize = item.size;
          const sizeMismatch = localSize !== serverSize;
          shouldDownload = serverMtime > localMtime || sizeMismatch;
        }

        if (shouldDownload) {
          filesToDownload.push(item);
        }
      } else if (item.type === "d") {  // Checking if it's a directory
        if (!fs.existsSync(localPath)) {
          fs.mkdirSync(localPath, { recursive: true });
        }
        const subFiles = await getFilesToDownload(localPath, serverPath);
        filesToDownload.push(...subFiles.map(subFile => path.join(item, subFile)));
      }
    }

    return filesToDownload;
  } catch (error) {
    console.error("Error in getFilesToDownload:", error);
    return [];
  }
};


let currentDownloadFiles = [];
let currentlyDownloading = false;
const downloadFiles = async (clientSyncPath, ftpSyncPath) => {
  if(!currentlyDownloading) {
    currentlyDownloading = true;

  try {
    currentDownloadFiles = await getFilesToDownload(clientSyncPath, ftpSyncPath);

    const serverItems = currentDownloadFiles;
    await ipcRenderer.invoke("sync-progress-start");
    for (const item of serverItems) {

      const localPath = path.join(clientSyncPath, item.name);
      const serverPath = path.join(ftpSyncPath, item.name);


      if (item.type === "-" || item.type === "f") {
        const fileExistsLocally = fs.existsSync(localPath);
        let shouldDownload = true;

        if (fileExistsLocally) {
          const localStats = fs.statSync(localPath);
          const localMtime = Math.floor(new Date(localStats.mtime).getTime() / 1000);
          const serverMtime = Math.floor(new Date(item.modifyTime).getTime() / 1000);

          const localSize = localStats.size;
          const serverSize = item.size;
          const sizeMismatch = localSize !== serverSize;
          shouldDownload = serverMtime > localMtime || sizeMismatch;
        }

        if (shouldDownload) {
          try {

            await sftp.fastGet(serverPath, localPath);
            console.log(`Downloaded: ${item.name}`);
          } catch (error) {
            console.error(`Failed to download ${item.name}:`, error);
          }
        }
      } else if (item.type === "d") {
        if (!fs.existsSync(localPath)) {
          fs.mkdirSync(localPath, { recursive: true });
        }
        await downloadFiles(localPath, serverPath);
      }
    }
    let clientSize = await calculateDirectorySize(clientSyncPath, true, currentDownloadFiles);
    let serverSize = await calculateDirectorySize(ftpSyncPath, false, currentDownloadFiles);

    const intervalId = setInterval(async () => {
      try {
        clientSize = await calculateDirectorySize(clientSyncPath, true, currentDownloadFiles);
        serverSize = await calculateDirectorySize(ftpSyncPath, false, currentDownloadFiles);

        if (clientSize === serverSize) {
          await listFilesAndDirectories();
          currentlyDownloading = false;
          await ipcRenderer.invoke("sync-file-end");
          clearInterval(intervalId);
        }
      } catch (error) {
        currentlyDownloading = false;

        console.error("Error in size comparison interval:", error);
        clearInterval(intervalId);
      }
    }, 1000);

  } catch (error) {
    console.error("Error in downloadFiles:", error);
  }
  }
};


let intervalMethod = null;
export const startSyncing = async (mode, clientSyncPath, ftpSyncPath) => {

  let interval = await ipcRenderer.invoke("get-setting", "autoUploadInterval");

  if (intervalMethod) {
    clearInterval(intervalMethod);
  }
  intervalMethod = setInterval(async () => {
    if (!isConnected) {
      console.error("Not connected to FTP server");
      return;
    }

    if (mode === "upload") {

      let lastModifiedTimes = await ipcRenderer.invoke("get-setting", "lastModifiedTimes") || {};
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
  currentlyUploading = false;
  currentlyDownloading = false;
  console.log("Syncing stopped");
};
