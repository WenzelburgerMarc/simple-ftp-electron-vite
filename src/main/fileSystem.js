// Desc: File system related functions
import fs from "fs";
import path from "path";
import { dialog, ipcRenderer } from "electron";
import { mainWindow } from "./window";
import { v4 as uuidv4 } from "uuid";
import Store from "electron-store";
import { addLog } from "./logs";

const store = new Store();

// Get All Client File Types
const getAllClientFileTypes = async (directory = null) => {
  try {
    if (directory === null) {
      directory = store.get("clientSyncPath");
    }

    const items = fs.readdirSync(directory, { withFileTypes: true });
    let files = [];
    for (const item of items) {
      if (item.isDirectory()) {
        const subDirectory = path.join(directory, item.name);
        const subFiles = await getAllClientFileTypes(subDirectory);
        files = files.concat(subFiles);
      } else {
        if (!item.name.startsWith("."))
          files.push(item.name);
      }
    }

    files = files.map((file) => {
      let splitFile = file.split(".");
      if (splitFile.length > 1) {
        return splitFile[splitFile.length - 1];
      }
    });

    return files;
  } catch (error) {
    let log = {
      logType: "Error",
      id: uuidv4(),
      type: "Error - Get All Client File Types",
      open: false,
      description: error.message
    };
    await addLog(log);
    throw new Error(`Error - Get All Client File Types: ${error.message}`);
  }
};

// Function to list files from a specified directory
const listLocalFiles = async (dirPath) => {
  try {
    dirPath = path.normalize(dirPath);
    const files = fs.readdirSync(dirPath);
    const fileDetailsPromises = files.map(async file => {
      // Ignore hidden files (those starting with a dot)
      if (file.startsWith(".")) {
        return null;
      }

      const filePath = path.normalize(path.join(dirPath, file));
      try {
        const stats = await fs.promises.stat(filePath);
        return {
          name: file,
          path: filePath,
          type: stats.isDirectory() ? "d" : "f",  // Identify if it's a directory or file
          size: stats.size
        };
      } catch (error) {
        let log = {
          logType: "Error",
          id: uuidv4(),
          type: "Error - List Client Files",
          open: false,
          description: error.message
        };
        await ipcRenderer.invoke("add-log", log);
        await ipcRenderer.invoke("flash-message", error.message, "Error");
        throw new Error(`Error - List Client Files: ${error.message}`);
      }
    });

    // Await all fileDetail promises to resolve, then filter out any null values
    const fileDetails = await Promise.all(fileDetailsPromises);
    return fileDetails.filter(file => file !== null);
  } catch (error) {
    let log = {
      logType: "Error",
      id: uuidv4(),
      type: "Error - List Client Files",
      open: false,
      description: error.message
    };
    await ipcRenderer.invoke("add-log", log);
    await ipcRenderer.invoke("flash-message", error.message, "Error");
    throw new Error(`Error - List Client Files: ${error.message}`);
  }
};

// Function to create a new folder in the specified directory
const createNewClientFolder = async (selectedDirectory) => {
  const normalizedDirectory = path.normalize(selectedDirectory);
  const result = await dialog.showSaveDialog({
    defaultPath: normalizedDirectory,
    properties: ["createDirectory"]
  });

  if (!result.canceled && result.filePath) {
    try {
      if (!fs.existsSync(result.filePath)) {
        fs.mkdirSync(result.filePath, { recursive: true });
      }
      return result.filePath;
    } catch (error) {
      let log = {
        logType: "Error",
        id: uuidv4(),
        type: "Error - Creating Client Folder",
        open: false,
        description: error.message
      };
      await ipcRenderer.invoke("add-log", log);
      await ipcRenderer.invoke("flash-message", error.message, "Error");
      throw new Error(`Error - Creating Client Folder: ${error.message}`);
    }
  } else {
    return null;
  }
};

// Function to copy a file from source to destination
const copyFile = async (sourcePath, destinationPath) => {
  try {
    await fs.promises.copyFile(sourcePath, destinationPath);
    return destinationPath;
  } catch (error) {
    let log = {
      logType: "Error",
      id: uuidv4(),
      type: "Error - Copy Client Files",
      open: false,
      description: error.message
    };
    await ipcRenderer.invoke("add-log", log);
    await ipcRenderer.invoke("flash-message", error.message, "Error");
    throw new Error(`Error - Copy Client Files: ${error.message}`);
  }
};

// Function to delete a file from the specified path
const deleteClientFile = async (filePath) => {
  try {
    await fs.promises.unlink(filePath);
    return { success: true, message: "File deleted successfully" };
  } catch (error) {
    let log = {
      logType: "Error",
      id: uuidv4(),
      type: "Error - Delete Client Files",
      open: false,
      description: error.message
    };
    await ipcRenderer.invoke("add-log", log);
    await ipcRenderer.invoke("flash-message", error.message, "Error");
    throw new Error(`Error - Delete Client Files: ${error.message}`);
  }
};

// Function to delete a directory from the specified path
const deleteClientDirectory = async (dirPath) => {
  try {
    await fs.promises.rmdir(dirPath);
    return { success: true, message: "Folder deleted successfully" };
  } catch (error) {
    let log = {
      logType: "Error",
      id: uuidv4(),
      type: "Error - Delete Client Directory",
      open: false,
      description: error.message
    };
    await ipcRenderer.invoke("add-log", log);
    await ipcRenderer.invoke("flash-message", error.message, "Error");
    throw new Error(`Error - Delete Client Directory: ${error.message}`);
  }
};

// Function to watch changes in a specified directory
// Variables to store watcher and interval references
let watcher;
let intervalId = null;
const watchClientDirectory = async (directoryPath, event) => {
  if (directoryPath === null) return;
  directoryPath = path.normalize(directoryPath);
  watcher = fs.watch(directoryPath, { recursive: true }, (eventType, filename) => {
    if (filename && mainWindow && !mainWindow.isDestroyed()) {
      event.sender.send("file-changed", { eventType });
    }
  });

  if (intervalId) clearInterval(intervalId);

  intervalId = setInterval(() => {
    if (mainWindow && !mainWindow.isDestroyed())
      event.sender.send("file-changed", { eventType: "change" });
  }, 1000);
};

// Function to stop watching changes in the directory
const unwatchClientDirectory = async () => {
  if (watcher) {
    watcher.close();
  }
  if (intervalId) {
    clearInterval(intervalId);
  }
};

// Function to let the user select a client directory
const selectClientDirectory = async (event) => {
  const result = await dialog.showOpenDialog({
    properties: ["openDirectory"]
  });
  if (!result.canceled && result.filePaths.length > 0) {
    event.sender.send("client-directory-changed", result.filePaths[0]);
    return result.filePaths[0];
  } else {
    return null;
  }
};

// Exporting functions for external use
export {
  listLocalFiles,
  createNewClientFolder,
  copyFile,
  deleteClientFile,
  deleteClientDirectory,
  watchClientDirectory,
  unwatchClientDirectory,
  selectClientDirectory,
  getAllClientFileTypes
};
