<template>
  <div class="w-full flex flex-col space-y-2 justify-start items-start">
    <div class="w-full flex justify-between items-start">
      <TitleComponent :title-text="'General Settings'" :size="'medium'" />
      <IconButtonComponent v-if="props.showModal"
                           :emit-name="'closeSettings'"
                           :icon="['fas', 'xmark']"
                           :btn-class="'z-20 close text-xl flex justify-center items-center'"
                           @closeSettings="closeModal" />
    </div>
    <CheckboxComponent :id="'enableAutoUpload'" :model-value="enableAutoStart" @update:modelValue="updateEnableAutoStart" :label="'Enable Auto-Start'" />
    <LabelInputComponent :model-value="autoUploadInterval" @update:modelValue="updateAutoUploadInterval"
                         :label="'Auto-Upload Interval in ms'"
                         :type="'number'"
                         :placeholder="'10000'" />
    <SelectPathInputComponent :prev-selected-path="selectedPath"
                              label-text="Choose Directory to Sync With Server"
                              :btn-text="'Select Save Location'"
                              @updateSelectedPath="handleSelectDirectory" />
    <ButtonComponent :button-text="'Save'"
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

// eslint-disable-next-line vue/no-dupe-keys
let autoUploadInterval = reactive(ref(0));
// eslint-disable-next-line vue/no-dupe-keys
const selectedPath = ref("");
// eslint-disable-next-line vue/no-dupe-keys
const enableAutoStart = ref(false);

const props = defineProps(['showModal', 'selectedPath', 'enableAutoStart', 'autoUploadInterval']);
const emit = defineEmits(['closeModal']);

const updateEnableAutoStart = (newValue) => {
  enableAutoStart.value = newValue;
};

const updateAutoUploadInterval = (newValue) => {
  autoUploadInterval.value = newValue;
};

const handleSelectDirectory = (path) => {
  selectedPath.value = path;
};



const closeModal = () => {
  emit('closeModal');
};


// On Mounted
onMounted(async () => {
  window.api.getAutoStartItemSetting().then(settings => {
    enableAutoStart.value = settings.openAtLogin;
  });

  watch(enableAutoStart, (newValue) => {
    window.api.setAutoStartItemSetting({ openAtLogin: newValue });
  });

  await loadSettings();
});

// Watch showModal
watch(props.showModal, async () => {
  await loadSettings();
});
const loadSettings = async () => {
  startLoading();
  enableAutoStart.value = await window.ipcRendererInvoke("get-setting", "enableAutoStart");
  autoUploadInterval.value = await window.ipcRendererInvoke("get-setting", "autoUploadInterval");
  selectedPath.value = await window.ipcRendererInvoke("get-setting", "clientSyncPath");
  stopLoading();
};


// Save Settings
const saveSettings = async () => {
  try {
    startLoading();
    await window.ipcRendererInvoke("set-setting", "enableAutoStart", enableAutoStart.value);
    await window.ipcRendererInvoke("set-setting", "autoUploadInterval", autoUploadInterval.value);
    await window.ipcRendererInvoke("set-setting", "clientSyncPath", selectedPath.value);
    stopLoading();
    displayFlash("Settings Saved", "success");
  } catch (e) {
    stopLoading();
    displayFlash("An Error Occured While Saving Settings", "error");
  }
};

</script>
