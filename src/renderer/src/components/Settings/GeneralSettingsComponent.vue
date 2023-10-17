<script setup>
// Desc: Modal for General Settings
import {
  enableAutoStart,
  autoReloadFtpInterval,
  autoSyncInterval,
  selectedPath,
  enableAutoReconnect,
  enableDeletingFilesAfterUpload,
  loadSettings,
  saveGeneralSettings,
  passwordRequiredOnStartup,
  password,
  confirmPassword
} from "../../js/manageSettings.js";

import ButtonComponent from "../form/ButtonComponent.vue";
import SelectPathInputComponent from "../form/SelectPathInputComponent.vue";
import LabelInputComponent from "../form/LabelInputComponent.vue";
import CheckboxComponent from "../form/CheckboxComponent.vue";
import IconButtonComponent from "../form/IconButtonComponent.vue";
import TitleComponent from "../form/TitleComponent.vue";
import { onMounted, watch } from "vue";
import { disconnect } from "../../js/ftpManager";
import { getSetting } from "../../js/manageSettings.js";
import InputComponent from "../form/InputComponent.vue";
import LabelComponent from "../form/LabelComponent.vue";

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

const updatePasswordRequiredOnStartup = (newValue) => {
  passwordRequiredOnStartup.value = newValue;
  updatePassword("");
  updateConfirmPassword("");
};

const updatePassword = (newValue) => {
  password.value = newValue;
};

const updateConfirmPassword = (newValue) => {
  confirmPassword.value = newValue;
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

<template>
  <!-- General Settings Header -->
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
    <!-- General Settings Fields -->
    <SelectPathInputComponent
      :prev-selected-path="selectedPath"
      label-text="Choose Directory to Sync With Server"
      :btn-text="'Select Save Location'"
      @updateSelectedPath="handleSelectDirectory"
    />

    <LabelInputComponent
      :model-value="autoSyncInterval"
      :label="'Auto-Sync Interval in ms'"
      :type="'number'"
      :placeholder="'10000'"
      @update:modelValue="updateSyncInterval"
      @keydown.enter.prevent="saveGeneralSettings"
    />
    <LabelInputComponent
      :model-value="autoReloadFtpInterval"
      :label="'Auto-Reload FTP Files Interval in ms'"
      :type="'number'"
      :placeholder="'60000'"
      @update:modelValue="updateAutoReloadFtpInterval"
      @keydown.enter.prevent="saveGeneralSettings"
    />


    <CheckboxComponent
      :id="'enableAutoUpload'"
      :model-value="enableAutoStart"
      :label="'Enable Auto-Start'"
      @update:modelValue="updateEnableAutoStart"
    />
    <CheckboxComponent
      :id="'enableAutoReconnect'"
      :model-value="enableAutoReconnect"
      :label="'Enable Auto-Reconnect on Start-Up & Connection Loss'"
      @update:modelValue="updateEnableAutoReconnect"
    />
    <CheckboxComponent
      :id="'enableDeletingFilesAfterUpload'"
      :model-value="enableDeletingFilesAfterUpload"
      :label="'Enable deleting Files on Client after Upload'"
      @update:modelValue="updateEnableDeletingFilesAfterUpload"
    />

    <CheckboxComponent :id="'passwordRequiredOnStartup'"
                       :model-value="passwordRequiredOnStartup"
                       :label="'Password required on Startup'"
                       @update:modelValue="updatePasswordRequiredOnStartup"
    />
    <div class="w-full">
      <label-component v-if="passwordRequiredOnStartup"
                       :label-text="'Password'"
      />
      <input-component v-if="passwordRequiredOnStartup"
                       :type="'password'"
                       :placeholder="'Password'"
                       :model-value="password"
                       @update:modelValue="updatePassword"
                       @keydown.enter.prevent="saveGeneralSettings"
      />
    </div>
    <div class="w-full">
      <label-component v-if="passwordRequiredOnStartup"
                       :label-text="'Confirm Password'"
      />
      <input-component v-if="passwordRequiredOnStartup"
                       :type="'password'"
                       :placeholder="'Confirm Password'"
                       :model-value="confirmPassword"
                       @update:modelValue="updateConfirmPassword"
                       @keydown.enter.prevent="saveGeneralSettings"
      />
    </div>

    <ButtonComponent
      :button-text="'Save'"
      :emit-event="'saveSettings'"
      :class="'mx-auto'"
      @saveSettings="saveGeneralSettings" />
  </div>
</template>
