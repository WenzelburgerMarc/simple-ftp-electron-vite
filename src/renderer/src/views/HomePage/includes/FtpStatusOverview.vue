<template>
  <panel-component class="relative z-0 ftp-status flex flex-col justify-between items-center overflow-hidden">
    <div :class="finishedSyncing ? 'bg-green-200' : 'bg-blue-200'"
         :style="{width: syncProgress + '%'}"
         class="sync-progress transition-all pointer-events-none absolute h-full left-0 top-0 z-10"></div>
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
                               @disconnectFtpIconBtn="disconnectFtp"
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
import { connect, disconnect, stopSyncing } from "@/js/ftpManager";
import PanelComponent from "../../../components/form/PanelComponent.vue";
import { connected, currentSyncMode, setIsConnected } from "../../../js/ftpManager";

const online = ref(false);

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

let startIsOnlineInterval = null;
let onlineStatusChanged = false;

onMounted(async() => {

  if(!startIsOnlineInterval){
    startIsOnlineInterval = setInterval(async () => {
      online.value = await window.api.isOnline();
      if(!online.value) {
        onlineStatusChanged = true;
        await setIsConnected(false);
      }
      if(online.value && onlineStatusChanged){

        onlineStatusChanged = false;
        await disconnectFtp();
        await connectToFtp();

      }
    }, 1000);
  }


  watch(connected, async (newValue) => {
    console.log("new");
    if (newValue) {
      ftpCredentials.value.host = await window.ipcRendererInvoke("get-setting", "ftpHost");
    }
  });


});
let progress = 0;
let intervalID = null;
const checkFtpProgress = async () => {

  intervalID = setInterval(async () => {

    try {
      progress = await window.ftp.calculateAndCompareSize(
        await window.ipcRendererInvoke("get-setting", "ftp-sync-mode")
      );
      console.log("progress: " + progress);
      syncProgress.value = progress;
    } catch (error) {
      console.error("Error calculating and comparing size:", error);
    }

  }, 50);
};

let shortlyStarted = ref(false);
let showProgress = reactive(ref(false));
window.ipcRendererOn("sync-progress-start", () => {
  shortlyStarted.value = true;
  console.log("sync-progress-start");
  finishedSyncing.value = false;
  if (intervalID)
    clearInterval(intervalID);
  showProgress.value = true;
  checkFtpProgress();

});

window.ipcRendererOn("sync-progress-pause",async () => {

  syncProgress.value = 0;

  console.log("sync-progress-pause");
  if (intervalID)
    clearInterval(intervalID);

  setTimeout(() => {
    finishedSyncing.value = false;
    showProgress.value = false;
  }, 500);

});

window.ipcRendererOn("sync-progress-end", async() => {
  console.log("sync-progress-end");

  if (syncProgress.value >= 100){
    finishedSyncing.value = true;
          setTimeout(() => {
            showProgress.value = false;
            syncProgress.value = 0;
          }, 500);
  }

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

const disconnectFtp = async () => {
  await stopSyncing();
  await disconnect(false, true);
};

</script>

<style scoped>

</style>
