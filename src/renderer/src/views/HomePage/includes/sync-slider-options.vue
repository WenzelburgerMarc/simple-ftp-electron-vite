<template>
  <div class="relative flex justify-center items-center w-fit">
    <div
      :style="switchingBackgroundStyle"
      class="absolute bg-blue-600 h-full shadow-md -z-10 rounded-md" />
    <icon-button-component
      :icon="['fas', 'upload']"
      emit-name="setSyncUpload"
      :btn-class="[isActive('upload') ? 'text-gray-200' : 'text-gray-800', 'w-[120px] transition duration-300 flex justify-center items-center p-3']"
      :icon-class="[isActive('upload') ? 'text-gray-200' : 'text-gray-800', 'mr-2 transition duration-300']"
      @setSyncUpload="setSyncUpload">
      Upload
    </icon-button-component>
    <icon-button-component
      :icon="['fas', 'download']"
      emit-name="setSyncDownload"
      :btn-class="[isActive('download') ? 'text-gray-200' : 'text-gray-800', 'w-[120px] transition duration-300 flex justify-center items-center p-3']"
      :icon-class="[isActive('download') ? 'text-gray-200' : 'text-gray-800', 'mr-2 transition duration-300']"
      @setSyncDownload="setSyncDownload">
      Download
    </icon-button-component>
    <icon-button-component
      :icon="['fas', 'pause']"
      emit-name="setStopSyncingMethod"
      :btn-class="[isActive('pause') ? 'text-gray-200' : 'text-gray-800', 'w-[120px] transition duration-300 flex justify-center items-center p-3']"
      :icon-class="[isActive('pause') ? 'text-gray-200' : 'text-gray-800', 'mr-2 transition duration-300']"
      @setStopSyncingMethod="setStopSyncingMethod">
      Pause
    </icon-button-component>

  </div>
</template>

<script setup>
import IconButtonComponent from "../../../components/form/IconButtonComponent.vue";
import { ref, computed, onMounted } from "vue";
import { startSyncing } from "../../../js/ftpManager";
import { setSetting, getSetting } from "../../../js/manageSettings";

const uploadEnabled = ref(false);

onMounted(async () => {
  let mode = await getSetting("ftp-sync-mode");

  if (mode === "upload") {
    await setSyncUpload();
  } else if (mode === "download") {
    await setSyncDownload();
  } else {
    await setStopSyncingMethod();
  }

});

const setSyncUpload = async () => {
  await window.ipcRendererInvoke("sync-progress-start-loading");
  await setSetting("ftp-sync-mode", "upload");
  uploadEnabled.value = true;
  let clientSyncPath = await getSetting("clientSyncPath");
  let ftpSyncPath = await getSetting("ftp-sync-directory");

  await startSyncing("upload", clientSyncPath, ftpSyncPath)
    .catch(error => {
      let log = {
        logType: "Error",
        id: window.api.getUUID(),
        type: "Error - Failed To Start Upload Syncing",
        open: false,
        description: error.message
      };
      window.ipcRendererInvoke("add-log", log);

    });
};


const setSyncDownload = async () => {
  await window.ipcRendererInvoke("sync-progress-start-loading");
  await setSetting("ftp-sync-mode", "download");
  uploadEnabled.value = false;
  let clientSyncPath = await getSetting("clientSyncPath");
  let ftpSyncPath = await getSetting("ftp-sync-directory");

  await startSyncing("download", clientSyncPath, ftpSyncPath)
    .catch(error => {
      let log = {
        logType: "Error",
        id: window.api.getUUID(),
        type: "Error - Failed To Start Download Syncing",
        open: false,
        description: error.message
      };
      window.ipcRendererInvoke("add-log", log);

    });

};

const setStopSyncingMethod = async () => {
  await window.ipcRendererInvoke("sync-progress-start-loading");
  await setSetting("ftp-sync-mode", "");
  uploadEnabled.value = null;
  await startSyncing("", "", "");

};

const isActive = (button) => {
  if (button === "upload") return uploadEnabled.value === true;
  if (button === "download") return uploadEnabled.value === false;
  if (button === "pause") return uploadEnabled.value === null;
  return false;
};

const switchingBackgroundStyle = computed(() => {
  if (uploadEnabled.value === null) {
    return {
      width: "120px",
      transform: `translateX(120px)`,
      transition: "transform 0.15s ease-in-out"
    };
  } else {
    return {
      width: "120px",
      transform: `translateX(${uploadEnabled.value ? -120 : 0}px)`,
      transition: "transform 0.15s ease-in-out"
    };
  }

});
</script>

<style scoped>

</style>
