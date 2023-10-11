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
  setCurrentDir,
  deleteFile,
  createNewFolder,
  deleteDirectory

} from "@/js/ftpManager.js";
import Breadcrumb from "../../../../components/form/Breadcrumb.vue";
import FileList from "../../../../components/FileList.vue";
import { displayFlash } from "../../../../js/flashMessageController";
import { onBeforeRouteLeave } from "vue-router";
import SetFtpFolderNameModal from "./setFtpFolderNameModal.vue";

const currentDir = ref(getCurrentDir());
const fileList = ref([]);
const initialPath = ref("");
const showTooltip = ref(false);

const pauseModeEnabled = ref(false);

const showModal = ref(false);

const updateShowModal = (newValue) => {
  showModal.value = newValue;
};

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
  setCurrentDir(currentDir.value);
  listFiles();
};

const handleBack = () => {
  if (currentDir.value) {
    const segments = currentDir.value.split("/").filter(segment => segment.trim() !== "");

    if (segments.length > 0) {
      segments.pop();
      const newPath = "/" + segments.join("/");
      currentDir.value = newPath;
      setCurrentDir(currentDir.value);
      listFiles();

    } else {
      displayFlash("You have reached the Root Directory!", "warning");
      setCurrentDir(currentDir.value);
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
let syncModeInterval = null;
const currentSyncMode = ref(null);
onMounted(async () => {
  currentDir.value = await window.ipcRendererInvoke("get-setting", "ftp-sync-directory");
  initialPath.value = await currentDir.value;
  await listFiles();
  watch(getFileList, () => {
    fileList.value = getFileList();
  });

  await startPolling();

  window.ipcRendererOn("restart-ftp-reload-interval", async () => {
    await stopPolling();
    await startPolling();
  });



  if(syncModeInterval) {
    clearInterval(syncModeInterval);
  }
  syncModeInterval = setInterval(async () => {
    currentSyncMode.value = await window.ftp.getSyncMode();
    if(currentSyncMode.value === "") {
      pauseModeEnabled.value = true;
    } else {
      pauseModeEnabled.value = false;
    }
  }, 250);

});

const startPolling = async () => {
  let timeout = await window.ipcRendererInvoke("get-setting", "autoReloadFtpInterval");
  timeout = parseInt(timeout);
  timeout += 250;
  pollingInterval = setInterval(async () => {
    await listFiles(false);
    console.log("polling");
  }, timeout);
};

const stopPolling = () => {
  clearInterval(pollingInterval);
};

onBeforeRouteLeave((to, from, next) => {
  stopPolling();
  next();
});

const listFiles = async (showLoader = true) => {
  if (currentDir.value) {
    try {
      await listFilesAndDirectories(getCurrentDir(), showLoader);
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

const setFtpSyncDirectory = async () => {
  console.log("setFtpSyncDirectory");
  await window.ipcRendererInvoke("set-setting", "ftp-sync-directory", currentDir.value);
  setCurrentDir(currentDir.value);
  initialPath.value = currentDir.value;
  displayFlash("FTP Sync Directory Set!", "success");
};

const deleteFtpFile = async (file) => {
  const path = currentDir.value + "/" + file.name;
  await deleteFile(path);
  await listFiles();
};

const deleteFtpFolder = async (folder) => {
  const path = currentDir.value + "/" + folder.name;
  console.log(path);
  await deleteDirectory(path);
  await listFiles();
};

const createNewFolderOnFtp = async (name) => {
  const folderName = name;

  if (folderName != null) {
    const path = currentDir.value + "/" + folderName + "/";
    await createNewFolder(path);
    await listFiles();
    updateShowModal(false);
    displayFlash("Folder created", "success");
    return;
  }
  displayFlash("Error creating folder", "error");
};
</script>

<template>
  <set-ftp-folder-name-modal :show-modal="showModal"
                             @update:showModal="updateShowModal"
                             @createFolder="createNewFolderOnFtp" />
  <panel-component
    v-if="connected"
    class="relative h-[45vh] overflow-x-hidden shadow-md sm:rounded-lg">

    <div class="w-full flex justify-between items-center">
      <div class="relative">
        <button @mouseover="showTooltip = true"
                @mouseleave="showTooltip = false"
                type="button">
          <title-component title-text="Server"
                           @click="goToFtpInitialPath" />
        </button>
        <div v-if="showTooltip"
             class="absolute min-w-max z-10 px-3 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg shadow-sm tooltip dark:bg-gray-700">
          Go To The Root Of Your Sync Directory
        </div>
      </div>
        <icon-button-component :class="[pauseModeEnabled ? 'active-setsyncpath-btn' : 'inactive-setsyncpath-btn', 'transition-all duration-300']"
                               @SelectFtpSyncDurectory="setFtpSyncDirectory"
                               emitName="SelectFtpSyncDurectory"
                               btnClass="w-auto flex flex-shrink-0 justify-end items-center text-blue-600 hover:text-blue-700 text-base"
                               icon="rotate"
                               icon-class="mr-2">Select Current Path As Sync Directory
        </icon-button-component>
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
      <icon-button-component @newFolderFtp="showModal = true"
                             emitName="newFolderFtp"
                             btnClass="w-auto flex flex-shrink-0 justify-end items-center text-blue-600 hover:text-blue-700 text-base"
                             icon="plus"
                             icon-class="mr-2">New Folder
      </icon-button-component>

    </div>

    <FileList :pause-mode-enabled="pauseModeEnabled.value"
              :initial-file-list="fileList"
              @file-clicked="handleClick"
              @delete-file="deleteFtpFile"
              @delete-folder="deleteFtpFolder" />

  </panel-component>

</template>

<style scoped>
.active-setsyncpath-btn {
  opacity: 1;
  pointer-events: auto;
}

.inactive-setsyncpath-btn {
  opacity: 0;
  pointer-events: none;
}
</style>
