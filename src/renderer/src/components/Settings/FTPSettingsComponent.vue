<script setup>
// Desc: Modal for FTP Settings
import PlainButtonComponent from "../form/PlainButtonComponent.vue";
import ButtonComponent from "../form/ButtonComponent.vue";
import LabelInputComponent from "../form/LabelInputComponent.vue";
import IconButtonComponent from "../form/IconButtonComponent.vue";
import TitleComponent from "../form/TitleComponent.vue";
import { defineEmits, onMounted, watch } from "vue";
import { connect } from "../../js/ftpManager";
import {
  ftpHost,
  ftpPort,
  ftpUsername,
  ftpPassword,
  loadSettings,
  saveFtpSettings,
} from "../../js/manageSettings.js";

const props = defineProps({
  showModal: Boolean,
});
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

onMounted(async () => {
  await loadSettings(false);
});

watch(props, async () => {
  await loadSettings(false);
});

const connectFtpSettings = async () => {
  await saveFtpSettings();
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
        description: error.message
      };
      window.ipcRendererInvoke("add-log", log);
    });
};

const testFtpSettings = async () => {
  await saveFtpSettings()
  await connect({
    host: ftpHost.value,
    port: ftpPort.value,
    username: ftpUsername.value,
    password: ftpPassword.value
  }, true);
};
</script>

<template>
  <!-- FTP Settings Header -->
  <div class="w-full flex justify-between items-start">


    <TitleComponent
      title-text="FTP Settings"
      size="medium" />
    <IconButtonComponent
      v-if="showModal"
      emit-name="closeFtpSettings"
      :icon="['fas', 'xmark']"
      btn-class="z-20 close text-xl flex justify-center items-center"
      @closeFtpSettings="closeModal" />
  </div>

  <!-- FTP Settings Fields -->
  <LabelInputComponent
    label="Host"
    type="text"
    placeholder="192.168.1.1 or ftp.example.com"
    :model-value="ftpHost"
    @update:modelValue="updateFtpHost" />
  <LabelInputComponent
    label="Port"
    type="text"
    placeholder="21"
    :model-value="ftpPort"
    @update:modelValue="updateFtpPort" />
  <LabelInputComponent
    label="Username"
    type="text"
    placeholder="john_doe"
    :model-value="ftpUsername"
    @update:modelValue="updateFtpUsername" />
  <LabelInputComponent
    label="Password"
    type="password"
    placeholder="********"
    :model-value="ftpPassword"
    @update:modelValue="updateFtpPassword" />
  <div class="w-full flex justify-start items-center space-x-3 mr-auto">
    <ButtonComponent
      button-text="Connect"
      emit-event="connectFTPSettings"
      @connectFTPSettings="connectFtpSettings" />
    <PlainButtonComponent
      class="text-gray-800 hover:text-black"
      button-text="Test"
      emit-event="testFTPSettings"
      @testFTPSettings="testFtpSettings" />
  </div>
</template>
