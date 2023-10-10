<script setup>
import TheSidebar from "@/components/SideBar/TheSidebar.vue";
import Loader from "../components/Loader.vue";
import SettingsModal from "../components/Settings/SettingsModal.vue";
import { connect } from "@/js/ftpManager.js";
import LogsModal from "../components/Logs/LogsModal.vue";
import {isSettingsModalVisible, openSettingsModal, updateSettingsModalVisibility } from "../js/settingsModalController";
import {isLogsModalVisible, openLogsModal, updateLogsModalVisibility} from "../js/logsModalController";

const toggleSettingsModal = () => {
  updateLogsModalVisibility(false);
  openSettingsModal();
};

const toggleLogsModal = () => {
  updateSettingsModalVisibility(false);
  openLogsModal();
};

</script>

<template>
  <div class="overflow-hidden">
    <loader />
    <TheSidebar @settings-clicked="toggleSettingsModal" @logs-clicked="toggleLogsModal" />

    <div class="main-content-container w-[calc(100vw-70px)]  min-h-screen p-5 ml-5">
      <div class="w-full h-full flex flex-col justify-start items-start">
        <SettingsModal :showModal="isSettingsModalVisible"
                       @connectToFTP="connect"
                       @update:showModal="updateSettingsModalVisibility"
        />
        <logs-modal :showModal="isLogsModalVisible"
                    @update:showModal="updateLogsModalVisibility" />
        <slot></slot>
      </div>

    </div>

  </div>
</template>

<style scoped>
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

@media (prefers-reduced-motion: reduce) {

  * {
    transition: none !important;
  }
}
</style>
