<template>
  <panel-component class="relative z-0 ftp-status flex flex-col justify-between items-center overflow-hidden">
    <div
      :class="finishedSyncing ? 'bg-green-200' : 'bg-blue-200'"
      :style="{width: syncProgress + '%'}"
      class="sync-progress transition-all pointer-events-none absolute h-full left-0 top-0 z-10"></div>
    <div class="w-full flex justify-between items-center z-10 pointer-events-auto">
      <div class="w-full flex items-center space-x-4">
        <div
          :class="statusClass"
          class="w-3 h-3 rounded-full"></div>
        <div class="text-sm w-full flex flex-col justify-center items-start">
          <p
            v-if="isConnected"
            class="text-green-500">Connected</p>
          <p
            v-else
            class="text-red-500">Disconnected</p>
          <p
            v-if="isConnected && ftpCredentials.host"
            class="text-gray-800">Host: {{ ftpCredentials.host }}</p>
          <p
            v-else
            class="text-gray-400">No host connected</p>
          <p
            v-if="isConnected && currentSyncMode"
            class="text-gray-800 truncate">


          </p>

        </div>
      </div>
      <div class="w-full flex justify-end items-center space-x-2">
        <icon-button-component
          v-if="isConnected"
          emit-name="listFilesIconBtn"
          icon-class="text-lg text-gray-800"
          icon="rotate-right"
          @listFilesIconBtn="listFiles" />
        <icon-button-component
          v-if="isConnected"
          emit-name="disconnectFtpIconBtn"
          icon-class="text-2xl text-red-500"
          :icon="['fas', 'xmark']"
          @disconnectFtpIconBtn="disconnectFtp" />

        <icon-button-component
          v-if="!isConnected"
          emit-name="connectFtpIconBtn"
          icon-class="text-lg text-gray-800"
          :icon="['fas', 'plug']"
          @connectFtpIconBtn="connectToFtp" />

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
import { setSetting, getSetting } from "../../../js/manageSettings";

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

      const ftpAutoReconnect = await getSetting("enableAutoReconnect");

      if (ftpAutoReconnect && !connected.value && !currentlyReConnecting) {
        ftpCredentials.value.host = await getSetting("ftpHost");
        ftpCredentials.value.port = await getSetting("ftpPort");
        ftpCredentials.value.user = await getSetting("ftpUsername");
        ftpCredentials.value.password = await getSetting("ftpPassword");

        if (ftpCredentials.value.host === "" || ftpCredentials.value.port === "" || ftpCredentials.value.user === "" || ftpCredentials.value.password === "") {
          await displayFlash("Please set FTP Credentials in Settings!", "error");
          await setSetting("enableAutoReconnect", false);
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
  window.ipcRendererOn("autoReconnectChanged", async () => {
    startIsOnlineInterval = false;
    currentlyReConnecting = false;
    await startAutoReconnect();

  });

  await startAutoReconnect();

  watch(connected, async (newValue) => {
    if (newValue) {
      ftpCredentials.value.host = await getSetting("ftpHost");
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
        await getSetting("ftp-sync-mode")
      );
      syncProgress.value = progress;
    } catch (error) {
      let log = {
        logType: "Error",
        id: window.api.getUUID(),
        type: "Error - Calculate Progress",
        open: false,
        description: error.message
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
      let ftpSyncPath = await getSetting("ftp-sync-directory");
      let clientSyncPath = await getSetting("clientSyncPath");

      let log = {
        logType: "Sync-Progress",
        id: logID.value,
        type: progressPaused.value ? currentType.value + " Canceled" : currentType.value,
        open: false,
        totalFiles: currentProcessingFiles.value.length,
        totalSize: size,
        destination: currentType.value === "Upload" ? ftpSyncPath : clientSyncPath,
        progress: progressPaused.value ? "-" : isNaN(progress) ? "100%" : progress + "%" || "0%",
        files: files
      };


      await window.ipcRendererInvoke("add-log", log);

    }

    if (progressPaused.value) {
      clearInterval(intervalID);
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

  if (intervalID) {
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

  if (progressPaused.value) {
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
    host: await getSetting("ftpHost"),
    port: await getSetting("ftpPort"),
    user: await getSetting("ftpUsername"),
    password: await getSetting("ftpPassword")
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

const disconnectFtp = async () => {
  await stopSyncing();
  let autoReconnectValue = await getSetting("enableAutoReconnect");
  if (autoReconnectValue) {
    await setSetting("enableAutoReconnect", false);
    await displayFlash("Auto Re-Connect disabled in Settings!", "info");
  }

  await disconnect(false, true);

};

</script>

<style scoped>

</style>
z
