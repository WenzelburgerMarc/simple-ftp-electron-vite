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
import { displayFlash } from "../../../js/flashMessageController";

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
let currentlyReConnecting = false;

const startAutoReconnect = async () => {

  if (!startIsOnlineInterval && !currentlyReConnecting) {
    startIsOnlineInterval = setInterval(async () => {
      online.value = await window.api.isOnline();

      if (!online.value) {
        if (!onlineStatusChanged) {
          await displayFlash("No Internet Connection available!", "error");
          onlineStatusChanged = true;
          await setIsConnected(false);
        }
        return;
      }

      if (onlineStatusChanged) {
        onlineStatusChanged = false;
        await displayFlash("Automatically Re-Connected to the Internet!", "info");
      }

      const ftpAutoReconnect = await window.ipcRendererInvoke("get-setting", "enableAutoReconnect");

      if (ftpAutoReconnect && !connected.value && !currentlyReConnecting) {
        ftpCredentials.value.host = await window.ipcRendererInvoke("get-setting", "ftpHost");
        ftpCredentials.value.port = await window.ipcRendererInvoke("get-setting", "ftpPort");
        ftpCredentials.value.user = await window.ipcRendererInvoke("get-setting", "ftpUsername");
        ftpCredentials.value.password = await window.ipcRendererInvoke("get-setting", "ftpPassword");

        if (ftpCredentials.value.host === "" || ftpCredentials.value.port === "" || ftpCredentials.value.user === "" || ftpCredentials.value.password === "") {
          await displayFlash("Please set FTP Credentials in Settings!", "error");
          await window.ipcRendererInvoke("set-setting", "enableAutoReconnect", false);
          await window.ipcRendererInvoke("disableAutoReconnectChanged");
          clearInterval(startIsOnlineInterval);
          return;
        }
        currentlyReConnecting = true;
        await connectToFtp();
        currentlyReConnecting = false;
      }
    }, 1000);
  }
};


onMounted(async () => {
  //window.ipcRendererInvoke("delete-all-logs");
  // let log = {
  //   logType: "Error",
  //   id: window.api.getUUID(),
  //   type: "Error - Test",
  //   open: false,
  //   description: 'This is a test error',
  // };
  // window.ipcRendererInvoke("add-log", log);
  window.ipcRendererOn("autoReconnectChanged", async () => {
    startIsOnlineInterval = false;
    currentlyReConnecting = false;
    await startAutoReconnect();

  });

  await startAutoReconnect();

  watch(connected, async (newValue) => {
    if (newValue) {
      ftpCredentials.value.host = await window.ipcRendererInvoke("get-setting", "ftpHost");
    }
  });


});
let progress = 0;
let intervalID = null;
let currentProcessingFiles = ref([]);
let currentType = ref("");
let logID = ref(null);
const checkFtpProgress = async () => {

  intervalID = setInterval(async () => {

    try {
      progress = await window.ftp.calculateAndCompareSize(
        await window.ipcRendererInvoke("get-setting", "ftp-sync-mode")
      );
      syncProgress.value = progress;
    } catch (error) {
      let log = {
        logType: "Error",
        id: window.api.getUUID(),
        type: "Error - Calculate Progress",
        open: false,
        description: error,
      };
      window.ipcRendererInvoke("add-log", log);
    }

    let files = [];
    let size = 0;

    currentProcessingFiles.value = currentProcessingFiles.value || [];
    if (Array.isArray(currentProcessingFiles.value) && currentProcessingFiles.value.length > 0) {

      for (const file of currentProcessingFiles.value) {

        const fileType = file.name.split(".").pop();
        files.push({ path: file.localPath, name: file.name, size: file.size, type: fileType });
        size += file.size;
      }
      let ftpSyncPath = await window.ipcRendererInvoke("get-setting", "ftp-sync-directory");
      let clientSyncPath = await window.ipcRendererInvoke("get-setting", "clientSyncPath");

      let log = {
        logType: 'Sync-Progress',
        id: logID.value,
        type: progressPaused.value ? currentType.value+' Canceled' : currentType.value,
        open: false,
        totalFiles: currentProcessingFiles.value.length,
        totalSize: size,
        destination: currentType.value === "Upload" ? ftpSyncPath : clientSyncPath,
        progress: progressPaused.value ? '-' : isNaN(progress) ? "100%" : progress + "%" || "0%",
        files: files
      };

      await window.ipcRendererInvoke("add-log", log);


    }

    if(progressPaused.value){
      clearInterval(intervalID)
    }

  }, 50);

};

let shortlyStarted = ref(false);
let showProgress = reactive(ref(false));
let idAlreadySet = ref(false);
window.ipcRendererOn("sync-progress-start", async (event, currentFiles, type) => {

  if (!idAlreadySet.value) {
    logID.value = await window.api.getUUID();
    idAlreadySet.value = true;
  }
  progressPaused.value = false;
  shortlyStarted.value = true;
  currentProcessingFiles.value = currentFiles;
  currentType.value = type;

  finishedSyncing.value = false;
  if (intervalID)
    clearInterval(intervalID);
  showProgress.value = true;
  await checkFtpProgress();

});

let progressPaused = ref(false);
window.ipcRendererOn("sync-progress-pause", async () => {

  syncProgress.value = 0;
  idAlreadySet.value = false;
 progressPaused.value = true;

  if (intervalID){
    setTimeout(() => {
      clearInterval(intervalID);
    }, 500);
  }


  setTimeout(() => {
    finishedSyncing.value = false;
    showProgress.value = false;

  }, 500);

});

window.ipcRendererOn("sync-progress-end", async () => {

  if(progressPaused.value){
    return;
  }
  if (syncProgress.value >= 100) {
    idAlreadySet.value = false;
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
  let autoReconnectValue = await window.ipcRendererInvoke("get-setting", "enableAutoReconnect");
  if (autoReconnectValue) {
    await window.ipcRendererInvoke("set-setting", "enableAutoReconnect", false);
    await displayFlash("Auto Re-Connect disabled in Settings!", "info");
  }

  await disconnect(false, true);

};

</script>

<style scoped>

</style>
z
