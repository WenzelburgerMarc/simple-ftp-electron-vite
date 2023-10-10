import sftpClient from "ssh2-sftp-client";
import { ref } from "vue";
import * as path from "path";
import * as fs from "fs";
import { ipcRenderer } from "electron";
import { displayFlash } from "../renderer/src/js/flashMessageController";


let uploadInProgress = ref(false);
let downloadInProgress = ref(false);

let sftp = new sftpClient();
let isConnected = false;
let files = [];
let syncMode = ref("");
export const setSyncMode = (mode) => {
  if (mode !== syncMode.value) firstRun = true;

  syncMode.value = mode;
};

export const getSyncMode = () => {
  return syncMode.value;
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


let progress = 0;
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
    console.log(`Synchronization progress: ${progress.toFixed(2)}%`);
    return progress.toFixed(2);
  }

};
let foldersToDelete = [];
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
          console.log(`File ${localPath} does not exist on server. Preparing to upload.`);
        } else {

          const serverStats = await sftp.stat(serverPath);
          const serverSize = serverStats.size;
          const localSize = localStats.size;


          if (localSize > serverSize) {
            shouldUpload = true;
            console.log(`File ${localPath} is partially uploaded. Preparing to resume upload.`);
          } else {

            const serverMtime = Math.floor(new Date(serverStats.mtime).getTime() / 1000);
            const localMtime = Math.floor(new Date(localStats.mtime).getTime() / 1000);


            shouldUpload = localMtime > serverMtime;
            if (shouldUpload) {
              console.log(`File ${localPath} is newer than server. Preparing to upload.`);
            }
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
    console.error("Error in getFilesToUpload:", error);
    return [];
  }
};

const deleteFolders = async (clientSyncPath) => {

  // delete everything after the last /
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


  console.log("foldersToDelete: ", foldersToDelete);

  for (const folder of foldersToDelete) {


    if (fs.existsSync(folder.localPath) && folder.type === "d") {
      const items = fs.readdirSync(folder.localPath);
      if (items.length > 0) {
        foldersToDelete = foldersToDelete.filter((f) => f.name !== folder.name);
      }else{
        if(folder.localPath !== clientSyncPath)
        fs.rmdirSync(folder.localPath, { recursive: true });
      }
    }
  }


}

let currentFilesToUpload = [];
const uploadFiles = async (clientSyncPath, ftpSyncPath) => {
  try {
    if (!uploadInProgress.value) {
      uploadInProgress.value = true;

      currentFilesToUpload = await getFilesToUpload(clientSyncPath, ftpSyncPath);
      await ipcRenderer.invoke("sync-progress-start");

      for (const { name, localPath, serverPath, type } of currentFilesToUpload) {
        console.log("uploading file: ", name, localPath, serverPath, type);

        if (type === "f") {
          try {
            await sftp.fastPut(localPath, serverPath);
            console.log(`Uploaded: ${name}`);
          } catch (error) {
            console.error(`Failed to upload ${name}:`, error);
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
          if(deleteUploadedFilesOnCLient){
            for(const file of currentFilesToUpload){
              if(file.type === "f") {
                fs.unlinkSync(file.localPath);
              }
            }
            await deleteFolders(clientSyncPath);
            await displayFlash("Files deleted on client after upload", "success")
          }
          await listFilesAndDirectories();
          currentFilesToUpload = [];
          uploadInProgress.value = false;
          await ipcRenderer.invoke("sync-progress-end");
        }
      } catch (error) {
        console.error("Error in size comparison interval:", error);
      }
    }
  } catch (error) {
    console.error("Error in uploadFiles:", error);
  }
};
const getFilesToDownload = async (clientSyncPath, ftpSyncPath) => {
  try {
    const items = await sftp.list(ftpSyncPath);
    let filesToDownload = [];

    for (const item of items) {
      const localPath = path.join(clientSyncPath, item.name);
      const serverPath = path.join(ftpSyncPath, item.name);
      console.log("download item: ", item);
      let shouldDownload = false;

      if (item.type === "-" || item.type === "f") {
        shouldDownload = !fs.existsSync(localPath);
        if (!shouldDownload) {
          const localStats = fs.statSync(localPath);
          const localSize = localStats.size;
          const serverSize = item.size;

          if (serverSize > localSize) {
            shouldDownload = true;
            console.log(`File ${serverPath} is partially downloaded. Preparing to resume download.`);
          } else {
            const localMtime = Math.floor(new Date(localStats.mtime).getTime() / 1000);
            const serverMtime = Math.floor(new Date(item.modifyTime).getTime() / 1000);

            shouldDownload = serverMtime > localMtime;
            if (shouldDownload) {
              console.log(`File ${serverPath} is newer than local. Preparing to download.`);
            }
          }
        }
        if (shouldDownload) {
          console.log("should download: ", item);
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
    console.error("Error in getFilesToDownload:", error);
    return [];
  }
};


let currentDownloadFiles = [];
const downloadFiles = async (clientSyncPath, ftpSyncPath) => {
  try {
    if (!downloadInProgress.value) {
      downloadInProgress.value = true;

      currentDownloadFiles = await getFilesToDownload(clientSyncPath, ftpSyncPath);
      await ipcRenderer.invoke("sync-progress-start");

      for (const { item, localPath, serverPath, type } of currentDownloadFiles) {
        console.log("downloading file: ", item, localPath, serverPath);

        if (type === "-" || type === "f") {
          try {
            await sftp.fastGet(serverPath, localPath);
            console.log(`Downloaded: ${name}`);
          } catch (error) {
            console.error(`Failed to download ${name}:`, error);
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
        console.error("Error in size comparison interval:", error);
      }
    }
  } catch (error) {
    console.error("Error in downloadFiles:", error);
  }
};

let intervalId = null;
let firstRun = true;
export const startSyncing = async (mode, clientSyncPath, ftpSyncPath) => {
  if (!isConnected) {
    console.error("Not connected to FTP server");
    return;
  }

  let interval = await ipcRenderer.invoke("get-setting", "autoSyncInterval") || 10000;

  interval = parseInt(interval);
  interval += 250;
  console.log("interval: ", interval);

  intervalId = setInterval(async () => {
    if (firstRun) {
      firstRun = false;

    }
    const newInterval = parseInt(await ipcRenderer.invoke("get-setting", "autoSyncInterval")) + 250;
    if (newInterval !== interval) {
      console.log("Interval has changed. Updating...");
      clearInterval(intervalId);
      interval = newInterval;
      await startSyncing(mode, clientSyncPath, ftpSyncPath);

    }



    if (mode === "upload") {
      console.log("upload mode is selected");

      setSyncMode("upload");
      await uploadFiles(clientSyncPath, ftpSyncPath);
      if (!firstRun)
        await ipcRenderer.invoke("sync-progress-stop-loading");
    } else if (mode === "download") {
      console.log("Download mode is selected");
      setSyncMode("download");
      await downloadFiles(clientSyncPath, ftpSyncPath);
      if (!firstRun)
        await ipcRenderer.invoke("sync-progress-stop-loading");
    } else if (mode === "") {
      setSyncMode("");
      console.log("Syncing paused");
      await stopSyncing();
      await ipcRenderer.invoke("sync-progress-pause");
      await clearFilesAfterModeSwitch();
      if (!firstRun)
        await ipcRenderer.invoke("sync-progress-stop-loading");
    } else {
      console.error("Invalid mode selected");
      await ipcRenderer.invoke("sync-progress-stop-loading");
    }

  }, interval);

};


export const stopSyncing = async () => {
  clearInterval(intervalId);
  await ipcRenderer.invoke("sync-progress-end");

  uploadInProgress.value = false;
  downloadInProgress.value = false;
  console.log("Syncing stopped");
};
export const clearFilesAfterModeSwitch = async (deleteOnlyClient = false, deleteOnlyServer = false) => {
  try {

    if (deleteOnlyClient) {
      for (const file of currentFilesToUpload) {
        try {
          if (file.type === "f") {
            await sftp.delete(file.serverPath);
            console.log(`Deleted ${file.name} on server`);
          } else {
            await sftp.rmdir(file.serverPath, true);
            console.log(`Deleted directory ${file.name} on server`);
          }
        } catch (error) {
          console.error(`Failed to delete ${file.name} on server:`, error);
        }
      }
      currentFilesToUpload = [];

    }
    if (deleteOnlyServer) {
      for (const file of currentDownloadFiles) {
        try {
          if (file.type === "-" || file.type === "f") {
            fs.unlinkSync(file.localPath);
            console.log(`Deleted ${file.name} on client`);
          } else {
            fs.rmdirSync(file.localPath, { recursive: true });
            console.log(`Deleted directory ${file.name} on client`);
          }
        } catch (error) {
          console.error(`Failed to delete ${file.name} on client:`, error);
        }
      }
      currentDownloadFiles = [];

    }
  } catch (error) {
    console.error("Error in clearFilesAfterModeSwitch:", error);
  }

};

