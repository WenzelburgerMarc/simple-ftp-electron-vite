<script setup>
// Desc: Client File Explorer
import IconButtonComponent from "../../../../components/form/IconButtonComponent.vue";
import TitleComponent from "../../../../components/form/TitleComponent.vue";
import PanelComponent from "../../../../components/form/PanelComponent.vue";
import { onMounted, ref } from "vue";
import Breadcrumb from "../../../../components/explorer/Breadcrumb.vue";
import FileList from "../../../../components/explorer/FileList.vue";
import { connected } from "@/js/ftpManager.js";
import { displayFlash } from "../../../../js/flashMessageController";
import { onBeforeRouteLeave } from "vue-router";
import { getSetting } from "../../../../js/manageSettings";
import FilterExplorerComponent from "../FilterExplorerComponent.vue";

const path = window.api.path;

const currentDir = ref("");
const fileList = ref([]);
const initialPath = ref("");
const showTooltip = ref(false);

const handleClick = async (file) => {
  const syncPath = await getSetting("clientSyncPath");
  const newPath = path.join(currentDir.value, file.name);

  if (file.type === "d" && newPath.startsWith(syncPath) && newPath !== syncPath) {
    currentDir.value = newPath;
    await listFiles();
  } else {
    displayFlash("Cannot navigate beyond the sync directory!", "warning");
    // Optionally, you might want to reset currentDir.value to syncPath here
     currentDir.value = syncPath;
    await listFiles();
  }
};

const handleBack = async() => {
  const syncPath = await getSetting("clientSyncPath");
  const newPath = path.dirname(currentDir.value);

  if (newPath.startsWith(syncPath) && newPath !== syncPath) {
    currentDir.value = newPath;
    await listFiles();
  } else {
    displayFlash("You have reached the Root Directory!", "warning");
    // Optionally, you might want to reset currentDir.value to syncPath here
     currentDir.value = syncPath;
    await listFiles();
  }
};


const changePath = async(newPath) => {
  const syncPath = await getSetting("clientSyncPath");
  if(newPath.startsWith(syncPath) && newPath !== syncPath) {
    let isWindows = window.api.os === "win32";
    currentDir.value = isWindows ? newPath : '/'+newPath;
    listFiles();
  } else {
    displayFlash("Cannot navigate beyond the sync directory!", "warning");
    // Optionally, you might want to reset currentDir.value to syncPath here
     currentDir.value = syncPath;
    listFiles();
  }

};

const createNewFolderOnClient = async () => {
  const folderName = await window.ipcRendererInvoke("create-new-folder-client", currentDir.value);
  if (folderName) {
    displayFlash("Folder created", "success");

    let name = folderName.split("/").pop();
    if (name === "") {
      name = folderName;
    }

    const destinationPath = path.join(currentDir.value, name);

    let log = {
      logType: "Create-Folder",
      id: window.api.getUUID(),
      type: "Client Folder Created",
      name: name,
      open: false,
      destination: destinationPath
    };

    await window.ipcRendererInvoke("add-log", log);

    await listFiles();
    return;
  }
  displayFlash("Canceled creating folder", "info");
};

onMounted(async () => {

  currentDir.value = await getSetting("clientSyncPath");
  initialPath.value = await currentDir.value;

  window.ipcRendererInvoke("watch-client-directory", initialPath.value);

  window.ipcRendererOn("client-directory-changed", async (event, path) => {
    currentDir.value = path;
    initialPath.value = path;
    await listFiles();
  });

  window.ipcRendererOn("file-changed", async () => {
    await listFiles();
  });

  await listFiles();


});

onBeforeRouteLeave((to, from, next) => {
  window.ipcRendererInvoke("unwatch-client-directory");
  next();
});

const goToClientInitialPath = () => {
  currentDir.value = initialPath.value;
  listFiles();
};

const checkIsFiltering = async() => {
  if (searchByText.value !== '' || searchByFileTypes.value.length > 0) {
    filtering.value = true;
    return true;
  }
  filtering.value = false;
  return false;
};

const filtering = ref(false);

const listFiles = async () => {
  if (currentDir.value) {
    try {
      const isFiltering = await checkIsFiltering();

      fileList.value = await window.ipcRendererInvoke("list-local-files", currentDir.value, isFiltering) || [];

      // File Type Filtering
      if (searchByFileTypes.value.length > 0) {
        fileList.value = fileList.value.filter(file =>
          searchByFileTypes.value.some(type =>
            file.name.toLowerCase().endsWith(type.toString().toLowerCase())
          )
        );
      }

      // Text Filtering
      if(searchByText.value !== '') {
        fileList.value = fileList.value.filter(file =>
          file.name.toLowerCase().includes(searchByText.value.toLowerCase())
        );
      }

      fileList.value.sort((a, b) => {
        if (a.type === "d" && b.type !== "d") return -1;
        if (a.type !== "d" && b.type === "d") return 1;
        return a.name.localeCompare(b.name);
      });
    } catch (error) {
      let log = {
        logType: "Error",
        id: window.api.getUUID(),
        type: "Error - Failed To List Client Files",
        open: false,
        description: error.message
      };
      await window.ipcRendererInvoke("add-log", log);
    }
  }
};

const onDrop = async (event) => {
  const files = event.dataTransfer.files;

  for (let i = 0; i < files.length; i++) {
    const file = files.item(i);
    await copyFileToCurrentDir(file.path);
  }
};

const copyFileToCurrentDir = async (sourcePath) => {
  const destinationPath = path.join(currentDir.value, path.basename(sourcePath));
  await window.ipcRendererInvoke("copy-file", sourcePath, destinationPath);
  displayFlash("File copied", "success");
  await listFiles();
};

const openSelectedClientDirectory = async () => {
  await window.ipcRendererInvoke("open-selected-client-directory", currentDir.value);
};

const deleteFile = async (file) => {
  const filePath = path.join(currentDir.value, file.name);

  try {
    const response = await window.ipcRendererInvoke("delete-client-file", filePath);
    if (response.success) {
      displayFlash("Deleted file", "success");
      await listFiles();

      await window.ipcRendererInvoke('remove-file-type')

      let log = {
        logType: "Delete-File",
        id: window.api.getUUID(),
        type: "Deleted Client File",
        open: false,
        totalSize: file.size,
        destination: filePath + "/",
        name: file.name
      };

      await window.ipcRendererInvoke("add-log", log);

    } else {
      displayFlash(response.message, "error");
    }
  } catch (error) {
    displayFlash(error.message, "error");
  }

};

const deleteFolder = async (folder) => {
  const folderPath = path.join(currentDir.value, folder.name);
  await window.ipcRendererInvoke("delete-client-directory", folderPath)
    .then(response => {
      if (response.success) {
        displayFlash("Deleted folder", "success");

        window.ipcRendererInvoke('remove-file-type')
        let log = {
          logType: "Delete-Folder",
          id: window.api.getUUID(),
          type: "Deleted Client Folder",
          open: false,
          destination: currentDir.value + "/" + folder.name
        };

        window.ipcRendererInvoke("add-log", log);

        listFiles();
      } else {
        displayFlash(response.message, "error");
      }
    })
    .catch(error => displayFlash(error.message, "error"));
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
                             mode="client"
                             @searchByName="searchByName"
                             @searchByFileType="searchByFileType"
                             @listFiles="listFiles"
  />

  <panel-component
    v-if="connected"
    class="relative h-[45vh] overflow-x-hidden shadow-md sm:rounded-lg"
    @drop.prevent="onDrop"
    @dragover.prevent
    @dragenter.prevent
  >

    <div class="w-full flex justify-between items-center">

      <div class="relative">
        <button
          type="button"
          @mouseover="showTooltip = true"
          @mouseleave="showTooltip = false">
          <title-component
            title-text="Client"
            @click="goToClientInitialPath" />
        </button>
        <div
          v-if="showTooltip"
          class="absolute min-w-max z-10 px-3 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg shadow-sm tooltip dark:bg-gray-700">
          Go To The Root Of Your Sync Directory
        </div>
      </div>

      <icon-button-component
        :icon="['far', 'folder-open']"
        emit-name="openClientFolder"
        btn-class="w-auto flex flex-shrink-0 justify-end items-center text-blue-600 hover:text-blue-700 text-base"
        icon-class="mr-2"
        @click="openSelectedClientDirectory">Open Folder
      </icon-button-component>
    </div>

    <div class="w-full flex space-x-2 justify-between items-start py-3">

      <div class="w-full flex space-x-5 justify-between items-center ">

        <div class="w-full flex space-x-2 justify-start items-center ">
          <icon-button-component
            emit-name="goBackFTPPath"
            btn-class="flex justify-center items-center text-gray-800 text-lg"
            icon-class="text-gray-800"
            icon="arrow-left"
            @goBackFTPPath="handleBack" />

          <Breadcrumb
            :initial-breadcrumb="Breadcrumb"
            :current-dir="currentDir"
            :initial-path-prop="initialPath"
            @change-path="changePath"
            :isClientBreadcrumb="true"
          />
        </div>

        <icon-button-component
          emit-name="newFolderClient"
          btn-class="w-auto flex flex-shrink-0 justify-end items-center text-blue-600 hover:text-blue-700 text-base"
          icon="plus"
          icon-class="mr-2"
          @newFolderClient="createNewFolderOnClient">New Folder
        </icon-button-component>

      </div>

    </div>

    <FileList
      :initial-file-list="fileList"
      :is-client="true"
      :is-client-filtering="filtering"
      @file-clicked="handleClick"
      @delete-file="deleteFile"
      @delete-folder="deleteFolder" />

  </panel-component>

</template>
