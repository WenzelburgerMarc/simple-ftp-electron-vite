<script setup>
// Desc: Main Layout For The Whole Applikation
import TheSidebar from "@/components/SideBar/TheSidebar.vue";
import Loader from "../components/Loader.vue";
import SettingsModal from "../components/Settings/SettingsModal.vue";
import { connect } from "@/js/ftpManager.js";
import LogsModal from "../components/Logs/LogsModal.vue";
import {
  isSettingsModalVisible,
  openSettingsModal,
  updateSettingsModalVisibility
} from "../js/settingsModalController";
import { isLogsModalVisible, openLogsModal, updateLogsModalVisibility } from "../js/logsModalController";
import { isExitModalVisible, openExitModal, updateExitModalVisibility } from "../js/exitModalController";
import ExitModal from "../components/ExitModal.vue";
import PasswordModal from "../components/PasswordModal.vue";
import { getSetting } from "../js/manageSettings";
import { openPasswordModal, isPasswordModalVisible, updatePasswordModalVisibility } from "../js/passwordModalController";
import { onMounted } from "vue";


const toggleSettingsModal = () => {
  updateLogsModalVisibility(false);
  updateExitModalVisibility(false);
  openSettingsModal();
};

const toggleLogsModal = () => {
  updateSettingsModalVisibility(false);
  updateExitModalVisibility(false);
  openLogsModal();
};

const toggleExitModal = () => {
  updateSettingsModalVisibility(false);
  updateLogsModalVisibility(false);
  openExitModal();
};

onMounted(async () => {
  let passwordRequired = await getSetting("passwordRequiredOnStartup");
  let setPasswordOnStartup = await getSetting("password");
  if(passwordRequired && setPasswordOnStartup !== ""){
    openPasswordModal();
  }else{
    await window.ipcRendererInvoke("passwordEnteredSuccessfully");
  }
});

</script>

<template>
  <div class="overflow-hidden">
    <div class="titlebar fixed top-0 left-0 w-full bg-gray-300 h-[11px]">
    </div>
    <loader />
    <TheSidebar @settings-clicked="toggleSettingsModal"
                @logs-clicked="toggleLogsModal"
                @exitClicked="toggleExitModal"
    />

    <div class="main-content-container w-[calc(100vw-70px)] min-h-screen p-5 ml-5">
      <div class="w-full h-full flex flex-col justify-start items-start">
        <SettingsModal
          :show-modal="isSettingsModalVisible"
          @connectToFTP="connect"
          @update:showModal="updateSettingsModalVisibility"
        />
        <logs-modal
          :show-modal="isLogsModalVisible"
          @update:showModal="updateLogsModalVisibility"
        />
        <exit-modal
          :show-modal="isExitModalVisible"
          @update:showModal="updateExitModalVisibility"
        />
        <password-modal :show-modal="isPasswordModalVisible"
                        @update:showModal="updatePasswordModalVisibility"
        />
        <slot></slot>
      </div>

    </div>

  </div>
</template>

<style scoped>
.titlebar {
  -webkit-app-region: drag;
  z-index: 49;
}

.main-content-container {
  overflow-x: hidden !important;
  transform: translateX(70px);
  transition: all 0.45s ease-in-out;
}

.translate-blur {
  overflow: hidden;
  transform: translateX(224px) scale(0.8);
  filter: blur(5px);
}

.main-content-container.translate-blur {
  pointer-events: auto !important;
}

.main-content-container.translate-blur * {
  pointer-events: none !important;
}
</style>
