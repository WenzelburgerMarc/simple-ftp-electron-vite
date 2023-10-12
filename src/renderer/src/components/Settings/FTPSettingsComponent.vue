<template>
  <!-- FTP Settings Header -->
  <div class="w-full flex justify-between items-start">


    <TitleComponent title-text="FTP Settings"
                    size="medium" />
    <IconButtonComponent v-if="showModal"
                         emit-name="closeFtpSettings"
                         :icon="['fas', 'xmark']"
                         btn-class="z-20 close text-xl flex justify-center items-center"
                         @closeFtpSettings="closeModal" />
  </div>

  <!-- FTP Settings Fields -->
  <LabelInputComponent label="Host"
                       type="text"
                       placeholder="192.168.1.1 or ftp.example.com"
                       :model-value="ftpHost"
                       @update:modelValue="updateFtpHost" />
  <LabelInputComponent label="Port"
                       type="text"
                       placeholder="21"
                       :model-value="ftpPort"
                       @update:modelValue="updateFtpPort" />
  <LabelInputComponent label="Username"
                       type="text"
                       placeholder="john_doe"
                       :model-value="ftpUsername"
                       @update:modelValue="updateFtpUsername" />
  <LabelInputComponent label="Password"
                       type="password"
                       placeholder="********"
                       :model-value="ftpPassword"
                       @update:modelValue="updateFtpPassword" />
  <div class="w-full flex justify-start items-center space-x-3 mr-auto">
    <ButtonComponent button-text="Save & Connect"
                     emit-event="connectFTPSettings"
                     @connectFTPSettings="connectFtpSettings" />
    <PlainButtonComponent class="text-gray-800 hover:text-black"
                          button-text="Test Connection"
                          emit-event="testFTPSettings"
                          @testFTPSettings="testFtpSettings" />
  </div>
</template>
<script setup>
import PlainButtonComponent from "../form/PlainButtonComponent.vue";
import ButtonComponent from "../form/ButtonComponent.vue";
import LabelInputComponent from "../form/LabelInputComponent.vue";
import IconButtonComponent from "../form/IconButtonComponent.vue";
import TitleComponent from "../form/TitleComponent.vue";
import { defineEmits, onMounted, ref, watch } from "vue";
import { displayFlash } from "../../js/flashMessageController";
import { connect } from "../../js/ftpManager";
import { startLoading, stopLoading } from "@/js/loaderManager.js";

const ftpHost = ref("");
const ftpPort = ref("");
const ftpUsername = ref("");
const ftpPassword = ref("");

const props = defineProps(["showModal"]);
const emits = defineEmits(["closeModal", "update:showModal", "connectToFTP"]);


const updateFtpHost = (newValue) => {
  ftpHost.value = newValue;
};
const updateFtpPort = (newValue) => {
  ftpPort.value = newValue;
};
const updateFtpUsername = (newValue) => {
  ftpUsername.value = newValue;
};
const updateFtpPassword = (newValue) => {
  ftpPassword.value = newValue;
};

const closeModal = () => {
  emits("closeModal");
};

// On Mounted
onMounted(async () => {
  await loadSettings();
});

// Watch showModal
watch(props.showModal, async () => {
  await loadSettings();
});
const loadSettings = async () => {
  startLoading();
  ftpHost.value = await window.ipcRendererInvoke("get-setting", "ftpHost");
  ftpPort.value = await window.ipcRendererInvoke("get-setting", "ftpPort");
  ftpUsername.value = await window.ipcRendererInvoke("get-setting", "ftpUsername");
  ftpPassword.value = await window.ipcRendererInvoke("get-setting", "ftpPassword");
  stopLoading();
};


// Save and Test FTP Settings
const connectFtpSettings = async () => {
  await saveSettings();
  connect({
    host: ftpHost.value,
    port: ftpPort.value,
    username: ftpUsername.value,
    password: ftpPassword.value
  })
    .then(() => {
      closeModal();
    })
    .catch((error) => {
      let log = {
        logType: "Error",
        id: window.api.getUUID(),
        type: "Error - Failed To Connect To FTP Server",
        open: false,
        description: error,
      };
      window.ipcRendererInvoke("add-log", log);
    });
};

const testFtpSettings = async () => {
  await connect({
    host: ftpHost.value,
    port: ftpPort.value,
    username: ftpUsername.value,
    password: ftpPassword.value
  }, true);
};

// Save Settings
const saveSettings = async () => {
  try {
    startLoading();
    await window.ipcRendererInvoke("set-setting", "ftpHost", ftpHost.value);
    await window.ipcRendererInvoke("set-setting", "ftpPort", ftpPort.value);
    await window.ipcRendererInvoke("set-setting", "ftpUsername", ftpUsername.value);
    await window.ipcRendererInvoke("set-setting", "ftpPassword", ftpPassword.value);
    stopLoading();
    displayFlash("Settings Saved", "success");
  } catch (e) {
    stopLoading();
    displayFlash("An Error Occured While Saving Settings", "error");
  }
};

</script>
