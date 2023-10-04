<template>
  <div class="relative flex justify-center items-center w-fit">
    <div :style="switchingBackgroundStyle"
         class="absolute bg-blue-600 h-full shadow-md -z-10 rounded-md" />
    <icon-button-component :icon="['fas', 'upload']"
                           emit-name="setSyncUpload"
                           @setSyncUpload="setSyncUpload"
                           :btn-class="[isActive('upload') ? 'text-gray-200' : 'text-gray-800', 'w-[120px] transition flex justify-center items-center p-3']"
                           :icon-class="[isActive('upload') ? 'text-gray-200' : 'text-gray-800', 'mr-2 transition']" >Upload</icon-button-component>
    <icon-button-component :icon="['fas', 'download']"
                           emit-name="setSyncDownload"
                           @setSyncDownload="setSyncDownload"
                           :btn-class="[isActive('download') ? 'text-gray-200' : 'text-gray-800', 'w-[120px] transition flex justify-center items-center p-3']"
                           :icon-class="[isActive('download') ? 'text-gray-200' : 'text-gray-800', 'mr-2 transition']" >Download</icon-button-component>
    <icon-button-component :icon="['fas', 'pause']"
                           emit-name="setStopSyncingMethod"
                           @setStopSyncingMethod="setStopSyncingMethod"
                           :btn-class="[isActive('pause') ? 'text-gray-200' : 'text-gray-800', 'w-[120px] transition flex justify-center items-center p-3']"
                           :icon-class="[isActive('pause') ? 'text-gray-200' : 'text-gray-800', 'mr-2 transition']" >Pause</icon-button-component>

  </div>
</template>

<script setup>
import IconButtonComponent from "../../../components/form/IconButtonComponent.vue";
import { ref, computed } from "vue";
import {startSyncing, stopSyncing } from "../../../js/ftpManager";

const uploadEnabled = ref(false);

const setSyncUpload = async() => {
  uploadEnabled.value = true;
  let clientSyncPath = await window.ipcRendererInvoke("get-setting", "clientSyncPath");
  let ftpSyncPath = await window.ipcRendererInvoke('get-setting', 'ftp-sync-directory');

  startSyncing('upload', clientSyncPath, ftpSyncPath)
    .catch(error => {
      console.error("Error in startSyncing:", error);

    });
}


const setSyncDownload = async() => {
  uploadEnabled.value = false;
  let clientSyncPath = await window.ipcRendererInvoke("get-setting", "clientSyncPath");
  let ftpSyncPath = await window.ipcRendererInvoke('get-setting', 'ftp-sync-directory');

  startSyncing('upload', clientSyncPath, ftpSyncPath)
    .catch(error => {
      console.error("Error in startSyncing:", error);

    });

}

const setStopSyncingMethod = () => {
  uploadEnabled.value = null;
  stopSyncing();
}

const isActive = (button) => {
  if (button === 'upload') return uploadEnabled.value === true;
  if (button === 'download') return uploadEnabled.value === false;
  if (button === 'pause') return uploadEnabled.value === null;
  return false;
}

const switchingBackgroundStyle = computed(() => {
  if(uploadEnabled.value === null) {
    return {
      width: '120px',
      transform: `translateX(120px)`,
      transition: 'transform 0.3s ease-in-out'
    };
  }else {
    return {
      width: '120px',
      transform: `translateX(${uploadEnabled.value ? -120 : 0}px)`,
      transition: 'transform 0.3s ease-in-out'
    };
  }

});
</script>

<style scoped>

</style>
