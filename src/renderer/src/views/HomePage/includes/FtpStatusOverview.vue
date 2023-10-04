<template>
  <panel-component class="relative z-0 ftp-status flex flex-col justify-between items-center overflow-hidden">
    <div :class="finishedSyncing ? 'bg-green-200' : 'bg-blue-200'" :style="{width: syncProgress + '%'}" class="sync-progress transition-all pointer-events-none absolute h-full left-0 top-0 z-10"></div>
    <div class="w-full flex justify-between items-center z-10 pointer-events-auto">
      <div class="w-full flex items-center space-x-4">
        <div :class="statusClass"
             class="w-3 h-3 rounded-full"></div>
        <div class="text-sm w-full flex flex-col justify-center items-start">
          <p v-if="isConnected"
             class="text-green-500">Connected</p>
          <p v-else
             class="text-red-500">Disconnected</p>
          <p v-if="isConnected && ftpCredentials.host"
             class="text-gray-800">Host: {{ ftpCredentials.host }}</p>
          <p v-else
             class="text-gray-400">No host connected</p>
          <p class="text-gray-800 truncate"
             v-if="isConnected && currentSyncMode">


          </p>

        </div>
      </div>
      <div class="w-full flex justify-end items-center space-x-2">
        <icon-button-component emit-name="listFilesIconBtn"
                               @listFilesIconBtn="listFiles"
                               v-if="isConnected"
                               iconClass="text-lg text-gray-800"
                               icon="rotate-right" />
        <icon-button-component emit-name="disconnectFtpIconBtn"
                               @disconnectFtpIconBtn="disconnect"
                               v-if="isConnected"
                               iconClass="text-2xl text-red-500"
                               icon="xmark" />

        <icon-button-component emit-name="connectFtpIconBtn"
                               @connectFtpIconBtn="connectToFtp"
                               v-if="!isConnected"
                               iconClass="text-lg text-gray-800"
                               icon="plug" />

      </div>
    </div>
  </panel-component>
</template>

<script setup>
import { defineProps, computed, ref, defineEmits, onMounted, watch, reactive } from "vue";
import IconButtonComponent from "@/components/form/IconButtonComponent.vue";
import { connect, disconnect } from "@/js/ftpManager";
import PanelComponent from "../../../components/form/PanelComponent.vue";
import { connected, currentSync, currentSyncMode } from "../../../js/ftpManager";

const syncProgress = reactive(ref(0));

const emit = defineEmits(["listFiles"]);

const finishedSyncing = ref(false);

const props = defineProps({
  isConnected: {
    type: Boolean,
    required: true
  }
});

const ftpCredentials = ref({
  host: "",
  port: "",
  user: "",
  password: ""
});


onMounted(() => {
  watch(connected, async (newValue) => {
    console.log("new");
    if (newValue) {
      ftpCredentials.value.host = await window.ipcRendererInvoke("get-setting", "ftpHost");
    }
  });



});

const checkFtpProgress = async () => {
  if (currentSyncMode.value === "upload") {
    while (connected.value && currentSync.value.fileName !== "") {
      console.log("uploading");

      try {
        let progress = await window.ftp.calculateAndCompareSize(
          await window.ipcRendererInvoke("get-setting", "clientSyncPath"),
          await window.ipcRendererInvoke("get-setting", "ftp-sync-directory"),
          true
        );
        syncProgress.value = progress;
      } catch (error) {
        console.error('Error calculating and comparing size:', error);
      }

      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
};


window.ipcRendererOn("sync-progress-start", () => {
  checkFtpProgress();
});

window.ipcRendererOn("sync-file-start", (event, fileName) => {
  console.log("sync-file-start", fileName);
  currentSync.value.fileName = fileName;

});

window.ipcRendererOn("sync-file-end", () => {
  currentSync.value.fileName = "";
  finishedSyncing.value = true;
  setTimeout(() => {
    syncProgress.value = 0;
    finishedSyncing.value = false;
  }, 1000);

});

const connectToFtp = async () => {
  ftpCredentials.value = {
    host: await window.ipcRendererInvoke("get-setting", "ftpHost"),
    port: await window.ipcRendererInvoke("get-setting", "ftpPort"),
    user: await window.ipcRendererInvoke("get-setting", "ftpUsername"),
    password: await window.ipcRendererInvoke("get-setting", "ftpPassword")
  };


  await connect({
    host: ftpCredentials.value.host,
    port: ftpCredentials.value.port,
    username: ftpCredentials.value.user,
    password: ftpCredentials.value.password
  });

  await listFiles();


};
const listFiles = () => {
  emit("listFiles");
};

const statusClass = computed(() => {
  return props.isConnected ? "bg-green-500" : "bg-red-500";
});
//
// const capitalizedSyncModeWithIng = computed(() => {
//   if (!currentSyncMode.value) return "Paused";
//   const mode = currentSyncMode.value;
//   return mode.charAt(0).toUpperCase() + mode.slice(1) + "ing";
// });

</script>

<style scoped>

</style>
