<template>
  <div class="w-full flex flex-col space-y-2 justify-start items-start">
    <div class="w-full flex justify-between items-center">
      <TitleComponent
:title-text="'General Settings'"
                      :size="'medium'" />
      <IconButtonComponent
v-if="props.showModal"
                           :emit-name="'closeSettings'"
                           :icon="['fas', 'xmark']"
                           :btn-class="'z-20 close text-xl flex justify-center items-center'"
                           @closeSettings="closeModal" />
    </div>
    <SelectPathInputComponent
:prev-selected-path="selectedPath"
                              label-text="Choose Directory to Sync With Server"
                              :btn-text="'Select Save Location'"
                              @updateSelectedPath="handleSelectDirectory" />


    <LabelInputComponent
:model-value="autoSyncInterval"
                         :label="'Auto-Sync Interval in ms'"
                         :type="'number'"
                         :placeholder="'10000'"
                         @update:modelValue="updateSyncInterval" />
    <LabelInputComponent
:model-value="autoReloadFtpInterval"
                         :label="'Auto-Reload FTP Files Interval in ms'"
                         :type="'number'"
                         :placeholder="'60000'"
                         @update:modelValue="updateAutoReloadFtpInterval" />


    <CheckboxComponent
:id="'enableAutoUpload'"
                       :model-value="enableAutoStart"
                       :label="'Enable Auto-Start'"
                       @update:modelValue="updateEnableAutoStart" />
    <CheckboxComponent
:id="'enableAutoReconnect'"
                       :model-value="enableAutoReconnect"
                       :label="'Enable Auto-Reconnect on Start-Up & Connection Loss'"
                       @update:modelValue="updateEnableAutoReconnect" />
    <CheckboxComponent
:id="'enableDeletingFilesAfterUpload'"
                       :model-value="enableDeletingFilesAfterUpload"
                       :label="'Enable deleting Files on Client after Upload'"
                       @update:modelValue="updateEnableDeletingFilesAfterUpload" />

    <ButtonComponent
:button-text="'Save'"
                     :emit-event="'saveSettings'"
                     :class="'mx-auto'"
                     @saveSettings="saveSettings" />
  </div>
</template>

<script setup>
import ButtonComponent from "../form/ButtonComponent.vue";
import SelectPathInputComponent from "../form/SelectPathInputComponent.vue";
import LabelInputComponent from "../form/LabelInputComponent.vue";
import CheckboxComponent from "../form/CheckboxComponent.vue";
import IconButtonComponent from "../form/IconButtonComponent.vue";
import TitleComponent from "../form/TitleComponent.vue";
import { onMounted, reactive, ref, watch } from "vue";
import { displayFlash } from "../../js/flashMessageController";
import { startLoading, stopLoading } from "@/js/loaderManager.js";
import { disconnect } from "../../js/ftpManager";

let autoSyncInterval = reactive(ref(0));
let autoReloadFtpInterval = reactive(ref(0));
const selectedPath = ref("");
const enableAutoStart = ref(false);
const enableAutoReconnect = ref(false);
const enableDeletingFilesAfterUpload = ref(false);


const props = defineProps({
  showModal: Boolean
});
const emit = defineEmits(["closeModal"]);

const updateEnableAutoStart = (newValue) => {
  enableAutoStart.value = newValue;
  saveSettings();
};

const updateEnableDeletingFilesAfterUpload = (newValue) => {
  disconnect(true);
  enableDeletingFilesAfterUpload.value = newValue;
  saveSettings();
};

const updateEnableAutoReconnect = (newValue) => {
  enableAutoReconnect.value = newValue;
  window.ipcRendererInvoke("autoReconnectChanged");
  saveSettings();
};

const updateSyncInterval = (newValue) => {
  autoSyncInterval.value = newValue;
};

const updateAutoReloadFtpInterval = (newValue) => {
  autoReloadFtpInterval.value = newValue;
};

const handleSelectDirectory = async(path) => {
  await disconnect(true);
  selectedPath.value = path;
  await saveSettings();


  let log = {
    logType: "Set-Sync-Path",
    id: window.api.getUUID(),
    type: "Client Sync Path Set",
    open: false,
    destination: selectedPath.value + "/",
  };

  await window.ipcRendererInvoke("add-log", log);

};


const closeModal = () => {
  emit("closeModal");
};


// On Mounted
onMounted(async () => {
  window.ipcRendererOn("disableAutoReconnectChanged", async () => {
    enableAutoReconnect.value = await window.ipcRendererInvoke("get-setting", "enableAutoReconnect");
  });

  window.api.getAutoStartItemSetting().then(settings => {
    enableAutoStart.value = settings.openAtLogin;
  });

  watch(enableAutoStart, (newValue) => {
    window.api.setAutoStartItemSetting({ openAtLogin: newValue });
  });

  await loadSettings();
});

// Watch showModal
watch(props, async () => {
  await loadSettings();
});
const loadSettings = async () => {
  startLoading();
  enableAutoStart.value = await window.ipcRendererInvoke("get-setting", "enableAutoStart");
  autoReloadFtpInterval.value = await window.ipcRendererInvoke("get-setting", "autoReloadFtpInterval");
  autoSyncInterval.value = await window.ipcRendererInvoke("get-setting", "autoSyncInterval");
  selectedPath.value = await window.ipcRendererInvoke("get-setting", "clientSyncPath");
  enableAutoReconnect.value = await window.ipcRendererInvoke("get-setting", "enableAutoReconnect");
  enableDeletingFilesAfterUpload.value = await window.ipcRendererInvoke("get-setting", "enableDeletingFilesAfterUpload");
  stopLoading();
};

const validateSettings = () => {

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


// Save Settings
const saveSettings = async () => {
  try {
    startLoading();

    await window.ipcRendererInvoke("unwatch-client-directory");

    if (!validateSettings()) {
      stopLoading();
      return;
    }

    await window.ipcRendererInvoke("set-setting", "enableAutoStart", enableAutoStart.value);
    await window.ipcRendererInvoke("set-setting", "autoSyncInterval", autoSyncInterval.value);
    await window.ipcRendererInvoke("set-setting", "autoReloadFtpInterval", autoReloadFtpInterval.value);
    await window.ipcRendererInvoke("set-setting", "clientSyncPath", selectedPath.value);
    await window.ipcRendererInvoke("restart-ftp-reload-interval");
    await window.ipcRendererInvoke("set-setting", "enableAutoReconnect", enableAutoReconnect.value);
    await window.ipcRendererInvoke("set-setting", "enableDeletingFilesAfterUpload", enableDeletingFilesAfterUpload.value);
    stopLoading();
    displayFlash("Settings Saved", "success");
  } catch (error) {
    stopLoading();
    displayFlash("An Error Occured While Saving Settings", "error");
    let log = {
      logType: "Error",
      id: window.api.getUUID(),
      type: "Error - Failed To Save Settings",
      open: false,
      description: error.message,
    };
    window.ipcRendererInvoke("add-log", log);
  }
};

</script>
