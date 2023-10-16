// Desc: This file contains all functions related to the log store
import Store from "electron-store";
import { v4 as uuidv4 } from "uuid";
import { app, dialog, shell } from "electron";
import path from "path";
import fs from "fs";

// Create a new persistent data store instance
const store = new Store();

// Retrieve all logs from the store
const getLogs = async () => {
  return await store.get("logs", []);
};

// Add a new log entry to the store
const addLog = async (log) => {
  const logs = await getLogs();

  log.timestamp = new Date().getTime();

  // replace log if it already exists
  const index = logs.findIndex(l => l.id === log.id);
  if (index !== -1) {
    logs[index] = log;
    store.set("logs", logs);
    return;
  }else{
    logs.push(log);
  }

  store.set("logs", logs);
};

// Update a specific log in the store using its unique ID
const updateLog = async (log) => {
  const logs = await getLogs();
  const index = logs.findIndex(l => l.id === log.id);
  logs[index] = log;

  store.set("logs", logs);
};

// Delete a log from the store using its unique ID
const deleteLog = async (logId) => {
  const logs = await getLogs();
  const updatedLogs = logs.filter(log => log.id !== logId);

  store.set("logs", updatedLogs);
};

// Clear all logs from the store
const clearLogs = async () => {
  await store.set("logs", []);
};

// Save all the logs to an external JSON file
const saveAllLogs = async () => {
  try {
    const logs = await store.get("logs", []);
    const copyLogs = JSON.parse(JSON.stringify(logs));

    // Remove unnecessary properties from each log
    copyLogs.forEach(log => {
      delete log.open;
      delete log.logType;
    });

    // Ask the user where to save the logs file
    const { filePath } = await dialog.showSaveDialog({
      title: "Save Logs",
      defaultPath: path.join(app.getPath("downloads"), "logs.json"),
      buttonLabel: "Save Logs",
      filters: [
        { name: "JSON", extensions: ["json"] }
      ]
    });

    // If the user selects a location, write the logs to that file and open it
    if (filePath) {
      fs.writeFileSync(filePath, JSON.stringify(copyLogs, null, 2));
      await shell.openPath(filePath);
    }
  } catch (error) {
    // If there's an error, log it
    let log = {
      logType: "Error",
      id: uuidv4(),
      type: "Error - Save Logs",
      open: false,
      description: error.message
    };
    await addLog(log);
  }
};

// Export functions for external use
export {
  getLogs,
  addLog,
  updateLog,
  deleteLog,
  clearLogs,
  saveAllLogs
};
