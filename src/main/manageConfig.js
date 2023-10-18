// Desc: Export and Import Settings Functionality
import { app, dialog, shell } from "electron";
import path from "path";
import fs from "fs";
import { v4 as uuidv4 } from "uuid";
import { addLog } from "./logs";

export const exportSettings = async (settings) => {

  try {
    // Ask the user where to save the logs file
    const { filePath } = await dialog.showSaveDialog({
      title: "Save Config",
      defaultPath: path.join(app.getPath("downloads"), "config.json"),
      buttonLabel: "Save Config",
      filters: [
        { name: "JSON", extensions: ["json"] }
      ]
    });

    // If the user selects a location, write the logs to that file and open it
    if (filePath) {
      fs.writeFileSync(filePath, JSON.stringify(settings, null, 2));
      await shell.openPath(filePath);
    }
  } catch (error) {
    // If there's an error, log it
    let log = {
      logType: "Error",
      id: uuidv4(),
      type: "Error - Save Config",
      open: false,
      description: error.message
    };
    await addLog(log);
  }

};

export const importSettings = async () => {
  try {
    // Select File with explorer and read json
    const { filePaths } = await dialog.showOpenDialog({
      title: "Import Config",
      buttonLabel: "Import Config",
      filters: [
        { name: "JSON", extensions: ["json"] }
      ]
    });

    if (filePaths.length > 0) {
      const settings = JSON.parse(fs.readFileSync(filePaths[0], "utf-8"));
      return settings;
    } else {
      let log = {
        logType: "Error",
        id: uuidv4(),
        type: "Error - Import Config",
        open: false,
        description: "No File selected"
      };
      await addLog(log);
    }
  }catch (error){
    let log = {
      logType: "Error",
      id: uuidv4(),
      type: "Error - Import Config",
      open: false,
      description: error.message
    }
    await addLog(log)
  }

};
