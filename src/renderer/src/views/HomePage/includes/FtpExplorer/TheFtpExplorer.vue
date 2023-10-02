<script setup>
import IconButtonComponent from "../../../../components/form/IconButtonComponent.vue";
import TitleComponent from "../../../../components/form/TitleComponent.vue";
import PanelComponent from "../../../../components/form/PanelComponent.vue";
import { onMounted, ref, watch } from "vue";
import {
  connected,
  listFilesAndDirectories,
  getFileList,
  getCurrentDir,
  setCurrentDir

} from "@/js/ftpManager.js";
import Breadcrumb from "../../../../components/form/Breadcrumb.vue";
import FileList from "../../../../components/form/FileList.vue";
import { displayFlash } from "../../../../js/flashMessageController";
import { onBeforeRouteLeave } from "vue-router";
const currentDir = ref(getCurrentDir());
const fileList = ref([]);
const initialPath = ref("");
const showTooltip = ref(false);

const handleClick = (file) => {
  if (file.type === "d" && currentDir.value != null) {
    if (currentDir.value === "/") {
      currentDir.value = `/${file.name}`;
    } else {
      currentDir.value = `${currentDir.value}/${file.name}`;
    }
    setCurrentDir(currentDir.value);
    listFiles();
  }
};

const goToFtpInitialPath = () => {
  currentDir.value = initialPath.value;
  listFiles();
};

const handleBack = () => {
  if (currentDir.value) {
    const segments = currentDir.value.split("/").filter(segment => segment.trim() !== "");

    if (segments.length > 0) {
      segments.pop();
      const newPath = "/" + segments.join("/");
      currentDir.value = newPath;
      listFiles();

    } else {
      displayFlash("You have reached the Root Directory!", "info")
      listFiles();
    }
  }
};

const changePath = (path) => {
  currentDir.value = path;
  setCurrentDir(currentDir.value);

  listFiles();
};


let pollingInterval;

onMounted(async() => {
  currentDir.value = await window.ipcRendererInvoke('get-setting', 'ftp-sync-directory');
  initialPath.value = '/' + await currentDir.value;
  await listFiles();
  watch(getFileList, () => {
    fileList.value = getFileList();
  });

  await startPolling();

  window.ipcRendererOn('restart-ftp-reload-interval', async() => {
    await stopPolling();
    await startPolling();
  });
});

const startPolling = async() => {
  let timeout = await window.ipcRendererInvoke('get-setting', 'autoReloadFtpInterval');
  pollingInterval = setInterval(async () => {
    await listFiles(false);
  }, timeout);
};

const stopPolling = () => {
  clearInterval(pollingInterval);
};

onBeforeRouteLeave((to, from, next) => {
  stopPolling();
  next();
});

const listFiles = async (showLoader=true) => {
  if (currentDir.value) {
    try {
      await listFilesAndDirectories(currentDir.value, showLoader);
      fileList.value = getFileList() || [];

      fileList.value.sort((a, b) => {
        if (a.type === "d" && b.type !== "d") return -1;
        if (a.type !== "d" && b.type === "d") return 1;
        return a.name.localeCompare(b.name);
      });
    } catch (error) {
      console.error("Error listing files:", error);
    }
  }
};

const setFtpSyncDirectory = async() => {
  await window.ipcRendererInvoke('set-setting', 'ftp-sync-directory', currentDir.value);
  setCurrentDir(currentDir.value);
  initialPath.value = '/'+currentDir.value;
  displayFlash("FTP Sync Directory Set!", "success")
};
</script>

<template>

  <panel-component
    v-if="connected"
    class="relative h-[45vh] overflow-x-hidden shadow-md sm:rounded-lg">

    <div class="w-full flex justify-between items-center">
      <div class="relative">
        <button @mouseover="showTooltip = true" @mouseleave="showTooltip = false" type="button">
          <title-component title-text="Server" @click="goToFtpInitialPath" />
        </button>
        <div v-if="showTooltip" class="absolute min-w-max z-10 px-3 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg shadow-sm tooltip dark:bg-gray-700">
          Go To The Root Of Your Sync Directory
        </div>
      </div>
      <icon-button-component @SelectFtpSyncDurectory="setFtpSyncDirectory"
                             emitName="SelectFtpSyncDurectory"
                             btnClass="w-auto flex flex-shrink-0 justify-end items-center text-blue-600 hover:text-blue-700 text-base"
                             icon="rotate" icon-class="mr-2" >Select Current Path As Sync Directory</icon-button-component>
    </div>


    <div class="w-full flex space-x-2 justify-between items-start py-3">

      <div class="w-full flex space-x-2 justify-start items-center ">

        <icon-button-component
          emit-name="goBackFTPPath"
          btn-class="flex justify-center items-center text-gray-800 text-lg"
          icon-class="text-gray-800"
          icon="arrow-left"
          @goBackFTPPath="handleBack" />

        <Breadcrumb :initial-breadcrumb="breadcrumb"
                    :current-dir="currentDir"
                    :initial-path-prop="initialPath"
                    @change-path="changePath" />

      </div>

    </div>

    <FileList :initial-file-list="fileList"
              @file-clicked="handleClick" />

  </panel-component>

</template>

<style scoped>

</style>
