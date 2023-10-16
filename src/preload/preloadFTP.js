// Desc: FTP Functionality for the renderer process
import sftpClient from "ssh2-sftp-client";
import { ref } from "vue";
import * as path from "path";
import * as fs from "fs";
import { ipcRenderer } from "electron";
import { v4 as uuidv4 } from "uuid";

// Variables
let sftp = new sftpClient();
let isConnected = false;
let files = [];
let syncMode = ref("");
let currentDir = ref(null);
let uploadInProgress = ref(false);
let downloadInProgress = ref(false);
let foldersToDelete = [];
let currentFilesToUpload = [];
let currentDownloadFiles = [];
let progress = 0;
let intervalId = null;
let firstRun = true;

// Sync Mode
export const setSyncMode = (mode) => {
  if (mode !== syncMode.value) firstRun = true;
  syncMode.value = mode;
};
export const getSyncMode = () => syncMode.value;
// Connected
export const setConnected = (status) => isConnected = status;
export const getIsConnected = () => isConnected;
// Files
export const setFiles = (fileList) => files = fileList;
export const getFiles = () => files;
// Current Directory
export const setCurrentDir = (dir) => currentDir.value = dir;
export const getCurrentDir = () => currentDir.value;
// === FTP Methods === \\
// Connect to the FTP server
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
// Disconnect from the FTP server
export const disconnectFTP = async () => {
  try {
    await sftp.end();
    setConnected(false);
  } catch (error) {
    setConnected(false);
  }
};
// List files and directories from the FTP server
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

    let log = {
      logType: "Error",
      id: window.api.getUUID(),
      type: "Error - List Server Files",
      open: false,
      description: error.message
    };
    await ipcRenderer.invoke("add-log", log);
  }
};
// Delete a file from the FTP server
export const deleteFile = async (filePath) => {
  if (!isConnected) {
    return;
  }

  let destPathArr = filePath.split("/");
  destPathArr.pop();
  let destPath = destPathArr.join("/");

  try {
    const fileStats = await sftp.stat(filePath);

    let name = filePath.split("/");
    name = name[name.length - 1];

    await sftp.delete(filePath);

    let log = {
      logType: "Delete-File",
      id: uuidv4(),
      type: "Deleted Server File",
      open: false,
      totalSize: fileStats.size,
      destination: destPath + "/",
      name: name

    };

    await ipcRenderer.invoke("add-log", log);

  } catch (error) {
    let log = {
      logType: "Error",
      id: window.api.getUUID(),
      type: "Error - Delete Server File",
      open: false,
      description: error.message
    };

    await ipcRenderer.invoke("add-log", log);

  }
};
// Create a new folder on the FTP server
export const createNewFolder = async (selectedDirectory) => {
  if (!isConnected) {
    throw new Error("Not connected to FTP server");
  }

  try {

    let exists = await sftp.exists(selectedDirectory);

    if (exists === "d") {
      throw new Error("Folder already exists");
    } else {
      await sftp.mkdir(selectedDirectory, true);
    }

  } catch (error) {
    let log = {
      logType: "Error",
      id: window.api.getUUID(),
      type: "Error - Creating Server Folder",
      open: false,
      description: error.message
    };

    await ipcRenderer.invoke("add-log", log);

    throw error;
  }
};
// Delete a folder from the FTP server
export const deleteDirectory = async (directory) => {
  if (!isConnected) {
    throw new Error("Not connected to FTP server");
  }

  try {
    await sftp.rmdir(directory, true);

    let log = {
      logType: "Delete-Folder",
      id: uuidv4(),
      type: "Deleted Server Folder",
      open: false,
      destination: directory + "/"
    };

    await ipcRenderer.invoke("add-log", log);

  } catch (error) {
    let log = {
      logType: "Error",
      id: window.api.getUUID(),
      type: "Error - Delete Server Folder",
      open: false,
      description: error.message
    };

    await ipcRenderer.invoke("add-log", log);
    throw error;
  }
};
// === Syncing Methods === \\
// Calculate the size of a directory
export const calculateDirectorySize = async (isLocal, files) => {
  let size = 0;

  if (!Array.isArray(files)) {
    return size;
  }

  if (files.length === 0) {
    await ipcRenderer.invoke("sync-progress-end");
  }

  const calculateSizeRecursively = async (isLocal, currentFile) => {
    try {
      if (isLocal) {


        const filePath = currentFile.localPath;
        if (fs.existsSync(filePath)) {
          const stats = await fs.promises.stat(filePath);
          return typeof stats.size === "number" ? stats.size : 0;
        }
      } else {
        const fileFromFtp = await sftp.stat(currentFile.serverPath);
        return typeof fileFromFtp.size === "number" ? fileFromFtp.size : 0;
      }
    } catch {
      return 0;
    }
    return 0;
  };

  const sizes = await Promise.all(files.map(file => calculateSizeRecursively(isLocal, file)));
  return sizes.reduce((acc, currSize) => acc + currSize, 0);

};
// Calculate and compare the size of the client and server directories, return progress in %
export const calculateAndCompareSize = async (mode) => {

  if (mode === "upload" || mode === "download") {
    let files = null;
    if (mode === "upload") {
      files = currentFilesToUpload;
    } else if (mode === "download") {
      files = currentDownloadFiles;
    }

    const clientSize = await calculateDirectorySize(true, files);
    const serverSize = await calculateDirectorySize(false, files);


    if (mode === "upload") {
      progress = (serverSize / clientSize) * 100;
    } else {
      progress = (clientSize / serverSize) * 100;
    }
    if (progress > 100) {
      progress = 100;
    }

    return progress.toFixed(2);
  }

};
// Start syncing
export const startSyncing = async (mode, clientSyncPath, ftpSyncPath) => {
  if (!isConnected) {
    let log = {
      logType: "Error",
      id: window.api.getUUID(),
      type: "Error - Start Syncing",
      open: false,
      description: "Not Connected to FTP Server"
    };
    await ipcRenderer.invoke("add-log", log);
    return;
  }

  let interval = await ipcRenderer.invoke("get-setting", "autoSyncInterval");

  interval = parseInt(interval);
  interval += 250;

  intervalId = setInterval(async () => {
    if (firstRun) {
      firstRun = false;

    }
    const newInterval = parseInt(await ipcRenderer.invoke("get-setting", "autoSyncInterval")) + 250;
    if (newInterval !== interval) {
      clearInterval(intervalId);
      interval = newInterval;
      await startSyncing(mode, clientSyncPath, ftpSyncPath);

    }


    if (mode === "upload") {

      setSyncMode("upload");
      await uploadFiles(clientSyncPath, ftpSyncPath);
      if (!firstRun)
        await ipcRenderer.invoke("sync-progress-stop-loading");
    } else if (mode === "download") {

      setSyncMode("download");
      await downloadFiles(clientSyncPath, ftpSyncPath);
      if (!firstRun)
        await ipcRenderer.invoke("sync-progress-stop-loading");
    } else if (mode === "") {
      setSyncMode("");
      await stopSyncing();
      await clearFilesAfterModeSwitch();
      await ipcRenderer.invoke("sync-progress-pause");
      if (!firstRun)
        await ipcRenderer.invoke("sync-progress-stop-loading");
    } else {
      let log = {
        logType: "Error",
        id: window.api.getUUID(),
        type: "Error - Invalid Syncing Mode",
        open: false,
        description: "This Sync Mode does not exist."
      };
      await ipcRenderer.invoke("add-log", log);
      await ipcRenderer.invoke("sync-progress-stop-loading");
    }

  }, interval);

};
// Stop syncing
export const stopSyncing = async () => {
  clearInterval(intervalId);
  await ipcRenderer.invoke("sync-progress-end");

  uploadInProgress.value = false;
  downloadInProgress.value = false;

};
// Clear files after mode switch, delete files if syncing was not finished
export const clearFilesAfterModeSwitch = async (deleteOnlyClient = false, deleteOnlyServer = false) => {
  try {

    if (deleteOnlyClient || (!deleteOnlyClient && !deleteOnlyServer)) {
      for (const file of currentFilesToUpload) {
        try {
          if (file.type === "f") {
            await sftp.delete(file.serverPath);

          } else {
            await sftp.rmdir(file.serverPath, true);

          }
        } catch (error) {
          let log = {
            logType: "Error",
            id: window.api.getUUID(),
            type: "Error - Delete Server File On Mode Switch",
            open: false,
            description: error.message
          };
          await ipcRenderer.invoke("add-log", log);
        }
      }
      currentFilesToUpload = [];

    }
    if (deleteOnlyServer || (!deleteOnlyClient && !deleteOnlyServer)) {
      for (const file of currentDownloadFiles) {
        try {
          if (file.type === "-" || file.type === "f") {
            fs.unlinkSync(file.localPath);

          } else {
            fs.rmdirSync(file.localPath, { recursive: true });

          }
        } catch (error) {
          let log = {
            logType: "Error",
            id: window.api.getUUID(),
            type: "Error - Delete Server File On Mode Switch",
            open: false,
            description: error.message
          };
          await ipcRenderer.invoke("add-log", log);
        }
      }
      currentDownloadFiles = [];

    }
  } catch (error) {
    let log = {
      logType: "Error",
      id: window.api.getUUID(),
      type: "Error - Delete Client File On Mode Switch",
      open: false,
      description: error.message
    };
    await ipcRenderer.invoke("add-log", log);
  }

};

// === Helper Methods === \\
// Get files that are on client and not on server
const getFilesToUpload = async (clientSyncPath, ftpSyncPath) => {
  try {
    const itemNames = fs.readdirSync(clientSyncPath);
    let filesToUpload = [];

    for (const itemName of itemNames) {
      const localPath = path.join(clientSyncPath, itemName);
      const serverPath = path.join(ftpSyncPath, itemName);
      const localStats = fs.statSync(localPath);

      let shouldUpload = false;

      if (localStats.isFile()) {
        const serverExists = await sftp.exists(serverPath);
        if (!serverExists) {
          shouldUpload = true;
        } else {

          const serverStats = await sftp.stat(serverPath);
          const serverSize = serverStats.size;
          const localSize = localStats.size;


          if (localSize > serverSize) {
            shouldUpload = true;

          } else {

            const serverMtime = Math.floor(new Date(serverStats.mtime).getTime() / 1000);
            const localMtime = Math.floor(new Date(localStats.mtime).getTime() / 1000);


            shouldUpload = localMtime > serverMtime;
          }
        }


        if (shouldUpload) {
          foldersToDelete.push({ name: itemName, localPath, serverPath, type: "d", size: localStats.size });
          filesToUpload.push({ name: itemName, localPath, serverPath, type: "f", size: localStats.size });
        }
      } else if (localStats.isDirectory()) {

        if (!await sftp.exists(serverPath)) await sftp.mkdir(serverPath, true);
        const subFilesToUpload = await getFilesToUpload(localPath, serverPath);
        filesToUpload = filesToUpload.concat(subFilesToUpload);
      }
    }

    return filesToUpload;
  } catch (error) {
    let log = {
      logType: "Error",
      id: window.api.getUUID(),
      type: "Error - Get Files to Upload",
      open: false,
      description: error.message
    };
    await ipcRenderer.invoke("add-log", log);
    return [];
  }
};
// Delete folders
const deleteFolders = async (clientSyncPath) => {

  foldersToDelete = foldersToDelete.map((folder) => {
    const splitPath = folder.localPath.split("/");
    splitPath.pop();
    folder.localPath = splitPath.join("/");
    return folder;
  });

  foldersToDelete = foldersToDelete.filter((folder, index, self) =>
      index === self.findIndex((t) => (
        t.localPath === folder.localPath
      ))
  );

  for (const folder of foldersToDelete) {


    if (fs.existsSync(folder.localPath) && folder.type === "d") {
      const items = fs.readdirSync(folder.localPath);
      if (items.length > 0) {
        foldersToDelete = foldersToDelete.filter((f) => f.name !== folder.name);
      } else {
        if (folder.localPath !== clientSyncPath)
          fs.rmdirSync(folder.localPath, { recursive: true });
      }
    }
  }


};
// Upload Files
const uploadFiles = async (clientSyncPath, ftpSyncPath) => {
  try {
    if (!uploadInProgress.value) {
      uploadInProgress.value = true;

      currentFilesToUpload = await getFilesToUpload(clientSyncPath, ftpSyncPath);
      await ipcRenderer.invoke("sync-progress-start", currentFilesToUpload, "Upload");

      for (const { localPath, serverPath, type } of currentFilesToUpload) {

        if (type === "f") {
          try {
            await sftp.fastPut(localPath, serverPath);
          } catch (error) {
            let log = {
              logType: "Error",
              id: window.api.getUUID(),
              type: "Error - Upload File",
              open: false,
              description: error.message
            };
            await ipcRenderer.invoke("add-log", log);
          }
        }
      }

      let clientSize = await calculateDirectorySize(true, currentFilesToUpload);
      let serverSize = await calculateDirectorySize(false, currentFilesToUpload);

      try {
        clientSize = await calculateDirectorySize(true, currentFilesToUpload);
        serverSize = await calculateDirectorySize(false, currentFilesToUpload);


        if (clientSize === serverSize) {
          let deleteUploadedFilesOnCLient = await ipcRenderer.invoke("get-setting", "enableDeletingFilesAfterUpload");
          if (deleteUploadedFilesOnCLient) {
            for (const file of currentFilesToUpload) {
              if (file.type === "f") {
                fs.unlinkSync(file.localPath);
              }
            }
            try {
              await deleteFolders(clientSyncPath);
            } catch (error) {
              let log = {
                logType: "Error",
                id: window.api.getUUID(),
                type: "Error - Delete Client File After Upload",
                open: false,
                description: error.message
              };
              await ipcRenderer.invoke("add-log", log);
            }

          }
          await listFilesAndDirectories();
          currentFilesToUpload = [];
          uploadInProgress.value = false;
          await ipcRenderer.invoke("sync-progress-end");
        }
      } catch (error) {
        let log = {
          logType: "Error",
          id: window.api.getUUID(),
          type: "Error - Upload File",
          open: false,
          description: error.message
        };
        await ipcRenderer.invoke("add-log", log);
      }
    }
  } catch (error) {
    let log = {
      logType: "Error",
      id: window.api.getUUID(),
      type: "Error - Upload File",
      open: false,
      description: error.message
    };
    await ipcRenderer.invoke("add-log", log);
  }
};
// Get files that are on server and not on client
const getFilesToDownload = async (clientSyncPath, ftpSyncPath) => {
  try {
    const items = await sftp.list(ftpSyncPath);
    let filesToDownload = [];

    for (const item of items) {
      const localPath = path.join(clientSyncPath, item.name);
      const serverPath = path.join(ftpSyncPath, item.name);
      let shouldDownload = false;

      if (item.type === "-" || item.type === "f") {
        shouldDownload = !fs.existsSync(localPath);
        if (!shouldDownload) {
          const localStats = fs.statSync(localPath);
          const localSize = localStats.size;
          const serverSize = item.size;

          if (serverSize > localSize) {
            shouldDownload = true;
          } else {
            const localMtime = Math.floor(new Date(localStats.mtime).getTime() / 1000);
            const serverMtime = Math.floor(new Date(item.modifyTime).getTime() / 1000);

            shouldDownload = serverMtime > localMtime;
          }
        }
        if (shouldDownload) {
          filesToDownload.push({ name: item.name, localPath, serverPath, type: item.type, size: item.size });
        }
      } else if (item.type === "d") {
        if (!fs.existsSync(localPath)) {
          fs.mkdirSync(localPath, { recursive: true });
        }
        const subFilesToDownload = await getFilesToDownload(localPath, serverPath);
        filesToDownload = filesToDownload.concat(subFilesToDownload);
      }
    }

    return filesToDownload;
  } catch (error) {
    let log = {
      logType: "Error",
      id: window.api.getUUID(),
      type: "Error - Get Files to Download",
      open: false,
      description: error.message
    };
    await ipcRenderer.invoke("add-log", log);
    return [];
  }
};
// Download Files
const downloadFiles = async (clientSyncPath, ftpSyncPath) => {
  try {
    if (!downloadInProgress.value) {
      downloadInProgress.value = true;

      currentDownloadFiles = await getFilesToDownload(clientSyncPath, ftpSyncPath);
      await ipcRenderer.invoke("sync-progress-start", currentDownloadFiles, "Download");

      for (const { localPath, serverPath, type } of currentDownloadFiles) {

        if (type === "-" || type === "f") {
          try {
            await sftp.fastGet(serverPath, localPath);
          } catch (error) {
            let log = {
              logType: "Error",
              id: window.api.getUUID(),
              type: "Error - Download File",
              open: false,
              description: error.message
            };
            await ipcRenderer.invoke("add-log", log);
          }
        }
      }

      let clientSize = await calculateDirectorySize(true, currentDownloadFiles);
      let serverSize = await calculateDirectorySize(false, currentDownloadFiles);

      try {
        clientSize = await calculateDirectorySize(true, currentDownloadFiles);
        serverSize = await calculateDirectorySize(false, currentDownloadFiles);

        if (clientSize === serverSize) {
          await listFilesAndDirectories();
          currentDownloadFiles = [];
          downloadInProgress.value = false;
          await ipcRenderer.invoke("sync-progress-end");
        }
      } catch (error) {
        let log = {
          logType: "Error",
          id: window.api.getUUID(),
          type: "Error - Download File",
          open: false,
          description: error.message
        };
        await ipcRenderer.invoke("add-log", log);
      }
    }
  } catch (error) {
    let log = {
      logType: "Error",
      id: window.api.getUUID(),
      type: "Error - Download File",
      open: false,
      description: error.message
    };
    await ipcRenderer.invoke("add-log", log);
  }
};
