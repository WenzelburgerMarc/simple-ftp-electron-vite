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
import {
  enableAutoStart,
  autoReloadFtpInterval,
  autoSyncInterval,
  selectedPath,
  enableAutoReconnect,
  enableDeletingFilesAfterUpload,
  loadSettings,
  saveGeneralSettings,
  saveSettings
} from "../../js/manageSettings.js";

import ButtonComponent from "../form/ButtonComponent.vue";
import SelectPathInputComponent from "../form/SelectPathInputComponent.vue";
import LabelInputComponent from "../form/LabelInputComponent.vue";
import CheckboxComponent from "../form/CheckboxComponent.vue";
import IconButtonComponent from "../form/IconButtonComponent.vue";
import TitleComponent from "../form/TitleComponent.vue";
import { onMounted, watch } from "vue";
import { disconnect } from "../../js/ftpManager";
import {getSetting} from "../../js/manageSettings.js";

const props = defineProps({
  showModal: Boolean
});
const emit = defineEmits(["closeModal"]);

const updateEnableAutoStart = (newValue) => {
  enableAutoStart.value = newValue;
  saveGeneralSettings();
};

const updateEnableDeletingFilesAfterUpload = (newValue) => {
  disconnect(true);
  enableDeletingFilesAfterUpload.value = newValue;
  saveGeneralSettings();
};

const updateEnableAutoReconnect = (newValue) => {
  enableAutoReconnect.value = newValue;
  window.ipcRendererInvoke("autoReconnectChanged");
  saveGeneralSettings();
};

const updateSyncInterval = (newValue) => {
  autoSyncInterval.value = newValue;
};

const updateAutoReloadFtpInterval = (newValue) => {
  autoReloadFtpInterval.value = newValue;
};

const handleSelectDirectory = async (path) => {
  await disconnect(true);
  selectedPath.value = path;
  await saveGeneralSettings();


  let log = {
    logType: "Set-Sync-Path",
    id: window.api.getUUID(),
    type: "Client Sync Path Set",
    open: false,
    destination: selectedPath.value + "/"
  };

  await window.ipcRendererInvoke("add-log", log);

};


const closeModal = () => {
  emit("closeModal");
};


onMounted(async () => {
  window.ipcRendererOn("disableAutoReconnectChanged", async () => {
    enableAutoReconnect.value = await getSetting("enableAutoReconnect");
  });

  window.api.getAutoStartItemSetting().then(settings => {
    enableAutoStart.value = settings.openAtLogin;
  });

  watch(enableAutoStart, (newValue) => {
    window.api.setAutoStartItemSetting({ openAtLogin: newValue });
  });

  await loadSettings(false);
});

watch(props, async () => {
  await loadSettings(false);
});


</script>
