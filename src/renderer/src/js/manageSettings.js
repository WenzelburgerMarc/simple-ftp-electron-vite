import { ref } from "vue";
import { displayFlash } from "./flashMessageController";
import { startLoading, stopLoading } from "./loaderManager.js";

export const enableAutoStart = ref(false);
export const autoReloadFtpInterval = ref(60000);
export const autoSyncInterval = ref(30000);
export const selectedPath = ref("");
export const enableAutoReconnect = ref(false);
export const enableDeletingFilesAfterUpload = ref(false);

export const ftpHost = ref("");
export const ftpPort = ref("");
export const ftpUsername = ref("");
export const ftpPassword = ref("");

export const loadSettings = async (showFlash = true) => {
  // General Settings
  await loadGeneralSettings(showFlash);

  // FTP Settings
  await loadFtpSettings(showFlash);

  if (showFlash) {
    displayFlash("Settings loaded successfully!", "success");
  }
};

export const loadGeneralSettings = async (showFlash = true) => {
  // General Settings
  startLoading();
  enableAutoStart.value = await window.ipcRendererInvoke("get-setting", "enableAutoStart");
  autoReloadFtpInterval.value = await window.ipcRendererInvoke("get-setting", "autoReloadFtpInterval");
  autoSyncInterval.value = await window.ipcRendererInvoke("get-setting", "autoSyncInterval");
  selectedPath.value = await window.ipcRendererInvoke("get-setting", "clientSyncPath");
  enableAutoReconnect.value = await window.ipcRendererInvoke("get-setting", "enableAutoReconnect");
  enableDeletingFilesAfterUpload.value = await window.ipcRendererInvoke("get-setting", "enableDeletingFilesAfterUpload");

  if (showFlash) {
    displayFlash("General settings loaded successfully!", "success");
  }
  stopLoading();
};

export const loadFtpSettings = async (showFlash = true) => {
  startLoading();
  // FTP Settings
  ftpHost.value = await window.ipcRendererInvoke("get-setting", "ftpHost");
  ftpPort.value = await window.ipcRendererInvoke("get-setting", "ftpPort");
  ftpUsername.value = await window.ipcRendererInvoke("get-setting", "ftpUsername");
  ftpPassword.value = await window.ipcRendererInvoke("get-setting", "ftpPassword");

  if (showFlash) {
    displayFlash("FTP settings loaded successfully!", "success");
  }
  stopLoading();
};

export const saveSettings = async (showFlash = true) => {
  // General Settings
  await saveGeneralSettings(showFlash);

  // FTP Settings
  await saveFtpSettings(showFlash);


  if (showFlash) {
    displayFlash("Settings saved successfully!", "success");
  }
};

export const saveGeneralSettings = async (showFlash = true) => {
  startLoading();

  if (!validateGeneralSettings()) {
      stopLoading();
      return;
  }

  // General Settings
  await window.ipcRendererInvoke("set-setting", "enableAutoStart", enableAutoStart.value);
  await window.ipcRendererInvoke("set-setting", "autoReloadFtpInterval", autoReloadFtpInterval.value);
  await window.ipcRendererInvoke("set-setting", "autoSyncInterval", autoSyncInterval.value);
  await window.ipcRendererInvoke("set-setting", "clientSyncPath", selectedPath.value);
  await window.ipcRendererInvoke("set-setting", "enableAutoReconnect", enableAutoReconnect.value);
  await window.ipcRendererInvoke("set-setting", "enableDeletingFilesAfterUpload", enableDeletingFilesAfterUpload.value);

  await window.ipcRendererInvoke("unwatch-client-directory");

  if (showFlash) {
    displayFlash("General settings saved successfully!", "success");
  }
  stopLoading();
};

const validateGeneralSettings = () => {

  if (isNaN(autoSyncInterval.value) && typeof autoSyncInterval.value !== "number") {
    displayFlash("Auto-Sync Interval must be numbers", "error");
    return false;
  }

  if (isNaN(autoReloadFtpInterval.value) && typeof autoReloadFtpInterval.value !== "number") {
    displayFlash("Auto-Reload FTP Files Interval must be numbers", "error");
    return false;
  }

  return true;

};

export const saveFtpSettings = async (showFlash = true) => {
  startLoading();
  // FTP Settings
  await window.ipcRendererInvoke("set-setting", "ftpHost", ftpHost.value);
  await window.ipcRendererInvoke("set-setting", "ftpPort", ftpPort.value);
  await window.ipcRendererInvoke("set-setting", "ftpUsername", ftpUsername.value);
  await window.ipcRendererInvoke("set-setting", "ftpPassword", ftpPassword.value);


  if (showFlash) {
    displayFlash("FTP settings saved successfully!", "success");
  }
  stopLoading();
};

export const setSetting = async (key, value) => {
  await window.ipcRendererInvoke("set-setting", key, value);
};

export const getSetting = async (key) => {
  return await window.ipcRendererInvoke("get-setting", key);
};

export const resetSettings = async (showFlash = true) => {
  // General Settings
  await resetGeneralSettings(showFlash);

  // FTP Settings
  await resetFtpSettings(showFlash);

  if (showFlash) {
    displayFlash("Settings reset successfully!", "success");
  }
};

export const resetGeneralSettings = async (showFlash = true) => {
  startLoading();
  // General Settings
  enableAutoStart.value = false;
  autoReloadFtpInterval.value = 60000;
  autoSyncInterval.value = 30000;
  selectedPath.value = "";
  enableAutoReconnect.value = false;
  enableDeletingFilesAfterUpload.value = false;

  if (showFlash) {
    displayFlash("General settings reset successfully!", "success");
  }
  await saveGeneralSettings(false)
  stopLoading();
};

export const resetFtpSettings = async (showFlash = true) => {
  startLoading();
  // FTP Settings
  ftpHost.value = "";
  ftpPort.value = "";
  ftpUsername.value = "";
  ftpPassword.value = "";

  if (showFlash) {
    displayFlash("Ftp settings reset successfully!", "success");
  }
  await saveFtpSettings(false)
  stopLoading();
};
