<script setup>
// Desc: FTP File Explorer
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
import Breadcrumb from "../../../../components/explorer/Breadcrumb.vue";
import FileList from "../../../../components/explorer/FileList.vue";
import { displayFlash } from "../../../../js/flashMessageController";
import { onBeforeRouteLeave } from "vue-router";
import SetFtpFolderNameModal from "./SetFtpFolderNameModal.vue";
import {setSetting, getSetting} from "../../../../js/manageSettings";
import FilterExplorerComponent from "../FilterExplorerComponent.vue";

const currentDir = ref(getCurrentDir());
const fileList = ref([]);
const initialPath = ref("");
const showTooltip = ref(false);

const pauseModeEnabled = ref(false);

const showModal = ref(false);

const createPath = (...segments) => {
  // Entfernt leere Segmente und führende/trailing Schrägstriche von jedem Segment
  const cleanedSegments = segments
    .filter(segment => segment)
    .map(segment => segment.replace(/^\/+|\/+$/g, ''));

  // Fügt die Segmente zusammen, getrennt durch einen einzelnen Schrägstrich
  let paths = '/' + cleanedSegments.join('/')
  return paths;
};


const updateShowModal = (newValue) => {
  showModal.value = newValue;
};
const handleClick = async(file) => {
  if (file.type === "d" && currentDir.value != null) {
    currentDir.value = createPath(currentDir.value, file.name);
    setCurrentDir(currentDir.value);
    await listFiles();
  }
};

const handleBack = async() => {
  if (currentDir.value) {
    const segments = currentDir.value.split("/").filter(segment => segment.trim() !== "");
    if (segments.length > 0) {
      segments.pop();
      currentDir.value = createPath(...segments);
      setCurrentDir(currentDir.value);
      await listFiles();
    } else {
      displayFlash("You have reached the Root Directory!", "warning");
      setCurrentDir(currentDir.value);
      await listFiles();
    }
  }
};
const goToFtpInitialPath = async() => {
  currentDir.value = initialPath.value;

  setCurrentDir(currentDir.value);
  await listFiles();
};

const changePath = (path, isServer =false) => {
  currentDir.value = createPath(path);
  if(isServer){
    currentDir.value = currentDir.value.replace(/\\/g, '/'); // window.api.path.posix.normalize(currentDir.value);
  }
  setCurrentDir(currentDir.value);
  listFiles();
};


let pollingInterval;
let syncModeInterval = null;
const currentSyncMode = ref(null);
onMounted(async () => {
  currentDir.value = await getSetting("ftp-sync-directory");
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


  if (syncModeInterval) {
    clearInterval(syncModeInterval);
  }
  syncModeInterval = setInterval(async () => {
    currentSyncMode.value = await window.ftp.getSyncMode();
    if (currentSyncMode.value === "") {
      pauseModeEnabled.value = true;
    } else {
      pauseModeEnabled.value = false;
    }
  }, 250);

});

const startPolling = async () => {
  let timeout = await getSetting("autoReloadFtpInterval");
  timeout = parseInt(timeout);
  timeout += 250;
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

const listFiles = async (showLoader = true) => {

  if (currentDir.value) {
    try {
      await listFilesAndDirectories(getCurrentDir(), showLoader, searchByFileTypes.value, searchByText.value);

      fileList.value = getFileList() || [];

      fileList.value.sort((a, b) => {
        if (a.type === "d" && b.type !== "d") return -1;
        if (a.type !== "d" && b.type === "d") return 1;
        return a.name.localeCompare(b.name);
      });
      window.ipcRendererInvoke("updated-ftp-file-list");
    } catch (error) {
      let log = {
        logType: "Error",
        id: window.api.getUUID(),
        type: "Error - Failed To List Files",
        open: false,
        description: error.message
      };
      await window.ipcRendererInvoke("add-log", log);
    }
  }
};

const setFtpSyncDirectory = async () => {

  if(currentDir.value !== '/'){
    await setSetting("ftp-sync-directory", currentDir.value);
    setCurrentDir(currentDir.value);
    initialPath.value = currentDir.value;


    let log = {
      logType: "Set-Sync-Path",
      id: window.api.getUUID(),
      type: "Server Sync Path Set",
      open: false,
      totalFiles: 1,
      destination: currentDir.value,
      progress: "-"
    };

    await window.ipcRendererInvoke("add-log", log);

    displayFlash("FTP Sync Directory Set!", "success");
  }else{
    displayFlash("You cannot set the root directory as your sync directory!", "warning");
  }


};

const deleteFtpFile = async (file) => {
  const path = createPath(currentDir.value, file.name);
  await deleteFile(path);
  await window.ipcRendererInvoke('remove-file-type');
};

const deleteFtpFolder = async (folder) => {
  const path = createPath(currentDir.value, folder.name);
  await deleteDirectory(path);
  await window.ipcRendererInvoke('remove-file-type');
};


const createNewFolderOnFtp = async (name) => {
  const folderName = name;

  if (folderName != null) {
    const path = createPath(currentDir.value, folderName);
    try {
      await createNewFolder(path);
      displayFlash("Folder created", "success");
    } catch (error) {
      displayFlash("Folder already exists", "info");
    }


    let name = folderName.split("/").pop();
    if (name === "") {
      name = folderName;
    }

    let log = {
      logType: "Create-Folder",
      id: window.api.getUUID(),
      type: "Server Folder Created",
      name: name,
      open: false,
      destination: currentDir.value
    };

    await window.ipcRendererInvoke("add-log", log);
    await listFiles();
    updateShowModal(false);


    return;
  }
  displayFlash("Error creating folder", "error");
};

const searchByText = ref('');
const searchByName = async (name) => {
  searchByText.value = name;
};

const searchByFileTypes = ref([]);
const searchByFileType = async (fileTypes) => {
  searchByFileTypes.value = fileTypes;
};
</script>

<template>
  <filter-explorer-component v-if="connected"
                             mode="ftp"
                             @searchByName="searchByName"
                             @searchByFileType="searchByFileType"
                             @listFiles="listFiles"

  />
  <set-ftp-folder-name-modal
    :show-modal="showModal"
    @update:showModal="updateShowModal"
    @createFolder="createNewFolderOnFtp" />
  <panel-component
    v-if="connected"
    class="relative h-[45vh] overflow-x-hidden shadow-md sm:rounded-lg">

    <div class="w-full flex justify-between items-center">
      <div class="relative">
        <button
          type="button"
          @mouseover="showTooltip = true"
          @mouseleave="showTooltip = false">
          <title-component
            title-text="Server"
            @click="goToFtpInitialPath" />
        </button>
        <div
          v-if="showTooltip"
          class="absolute min-w-max z-10 px-3 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg shadow-sm tooltip dark:bg-gray-700">
          Go To The Root Of Your Sync Directory
        </div>
      </div>
      <icon-button-component
        :class="[pauseModeEnabled ? 'active-setsyncpath-btn' : 'inactive-setsyncpath-btn', 'transition-all duration-300']"
        emit-name="SelectFtpSyncDurectory"
        btn-class="w-auto flex flex-shrink-0 justify-end items-center text-blue-600 hover:text-blue-700 text-base"
        icon="rotate"
        icon-class="mr-2"
        @SelectFtpSyncDurectory="setFtpSyncDirectory">Select Current Path As Sync Directory
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

        <Breadcrumb
          :initial-breadcrumb="initialPath.split('/').filter(segment => segment.trim() !== '')"
          :current-dir="currentDir"
          :initial-path-prop="initialPath"
          @change-path="changePath" />

      </div>
      <icon-button-component
        emit-name="newFolderFtp"
        btn-class="w-auto flex flex-shrink-0 justify-end items-center text-blue-600 hover:text-blue-700 text-base"
        icon="plus"
        icon-class="mr-2"
        @newFolderFtp="showModal = true">New Folder
      </icon-button-component>

    </div>

    <FileList
      :pause-mode-enabled="pauseModeEnabled.value"
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
