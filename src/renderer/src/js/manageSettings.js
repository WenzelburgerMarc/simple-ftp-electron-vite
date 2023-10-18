// Desc: Manage Settings
import { ref } from "vue";
import { displayFlash } from "./flashMessageController";
import { startLoading, stopLoading } from "./loaderManager.js";

export const enableAutoStart = ref(false);
export const autoReloadFtpInterval = ref(60000);
export const autoSyncInterval = ref(30000);
export const selectedPath = ref("");
export const enableAutoReconnect = ref(false);
export const enableDeletingFilesAfterUpload = ref(false);
export const passwordRequiredOnStartup = ref(false);
export const password = ref("");
export const confirmPassword = ref("");

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
  enableAutoStart.value = await getSetting("enableAutoStart");
  autoReloadFtpInterval.value = await getSetting("autoReloadFtpInterval") || 60000;
  autoSyncInterval.value = await getSetting("autoSyncInterval") || 30000;
  selectedPath.value = await getSetting("clientSyncPath");
  enableAutoReconnect.value = await getSetting("enableAutoReconnect");
  enableDeletingFilesAfterUpload.value = await getSetting("enableDeletingFilesAfterUpload");
  passwordRequiredOnStartup.value = await getSetting("passwordRequiredOnStartup");
  password.value = await getSetting("password");

  if (showFlash) {
    displayFlash("General settings loaded successfully!", "success");
  }
  stopLoading();
};

export const loadFtpSettings = async (showFlash = true) => {
  startLoading();
  // FTP Settings
  ftpHost.value = await getSetting("ftpHost");
  ftpPort.value = await getSetting("ftpPort");
  ftpUsername.value = await getSetting("ftpUsername");
  ftpPassword.value = await getSetting("ftpPassword");

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


  if (passwordRequiredOnStartup.value && password.value !== confirmPassword.value) {
    displayFlash("Passwords do not match!", "error");
    stopLoading();
    return;
  } else {
    await setSetting("password", password.value);
  }

  // General Settings
  await setSetting("enableAutoStart", enableAutoStart.value);
  await setSetting("autoReloadFtpInterval", autoReloadFtpInterval.value);
  await setSetting("autoSyncInterval", autoSyncInterval.value);
  await setSetting("clientSyncPath", selectedPath.value);
  await setSetting("enableAutoReconnect", enableAutoReconnect.value);
  await setSetting("enableDeletingFilesAfterUpload", enableDeletingFilesAfterUpload.value);
  await setSetting("passwordRequiredOnStartup", passwordRequiredOnStartup.value);

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
  await setSetting("ftpHost", ftpHost.value);
  await setSetting("ftpPort", ftpPort.value);
  await setSetting("ftpUsername", ftpUsername.value);
  await setSetting("ftpPassword", ftpPassword.value);


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
  await saveGeneralSettings(false);
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
  await saveFtpSettings(false);
  stopLoading();
};

// Export / Import Settings
export const exportSettings = async () => {
  try {
    await startLoading();

    const settings = await getSettings();


    let set = await window.ipcRendererInvoke("export-settings", settings);
    console.log('set: ' + set);
    if(set){
      displayFlash("Settings exported successfully!", "success");
    }else{
      displayFlash("No settings exported!", "info");
    }
    stopLoading();

  } catch (error) {
    displayFlash("Settings not exported: " + error.message, "error");
    stopLoading();
  }

};

const getSettings = async () => {
  // General Settings
  const enableAutoStart = await getSetting("enableAutoStart") || false;
  const autoReloadFtpInterval = await getSetting("autoReloadFtpInterval") || 60000;
  const autoSyncInterval = await getSetting("autoSyncInterval") || 30000;
  const selectedPath = await getSetting("clientSyncPath") || "";
  const enableAutoReconnect = await getSetting("enableAutoReconnect") || false;
  const enableDeletingFilesAfterUpload = await getSetting("enableDeletingFilesAfterUpload") || false;
  const passwordRequiredOnStartup = await getSetting("passwordRequiredOnStartup") || false;
  const password = await getSetting("password") || "";

  // FtP Settings
  const ftpHost = await getSetting("ftpHost") || "";
  const ftpPort = await getSetting("ftpPort") || "";
  const ftpUsername = await getSetting("ftpUsername") || "";
  const ftpPassword = await getSetting("ftpPassword") || "";

  return {
    enableAutoStart,
    autoReloadFtpInterval,
    autoSyncInterval,
    selectedPath,
    enableAutoReconnect,
    enableDeletingFilesAfterUpload,
    passwordRequiredOnStartup,
    password,
    ftpHost,
    ftpPort,
    ftpUsername,
    ftpPassword
  };

};

const setSettings = async (settings) => {
  enableAutoStart.value = settings.enableAutoStart;
  autoReloadFtpInterval.value = settings.autoReloadFtpInterval;
  autoSyncInterval.value = settings.autoSyncInterval;
  selectedPath.value = settings.selectedPath;
  enableAutoReconnect.value = settings.enableAutoReconnect;
  enableDeletingFilesAfterUpload.value = settings.enableDeletingFilesAfterUpload;
  passwordRequiredOnStartup.value = settings.passwordRequiredOnStartup;
  password.value = settings.password;
  ftpHost.value = settings.ftpHost;
  ftpPort.value = settings.ftpPort;
  ftpUsername.value = settings.ftpUsername;
  ftpPassword.value = settings.ftpPassword;
  confirmPassword.value = settings.password;
}
export const importSettings = async () => {
  const backupSettings = await getSettings();
  try {
    startLoading();
    let settings = await window.ipcRendererInvoke("import-settings");
    if (!settings) {
      settings = backupSettings;
      displayFlash("No settings imported!", "info");
    }else{
      displayFlash("Settings imported successfully!", "success");
    }
    await setSettings(settings);
    await saveSettings(false);

    stopLoading();
  } catch (error) {
    await setSettings(backupSettings);
    await saveSettings(false)
    displayFlash("Error importing Settings: " + error.message, "error");
    stopLoading();
  }

};
