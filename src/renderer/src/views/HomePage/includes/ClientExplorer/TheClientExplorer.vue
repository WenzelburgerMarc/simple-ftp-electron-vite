<script setup>
import IconButtonComponent from "../../../../components/form/IconButtonComponent.vue";
import TitleComponent from "../../../../components/form/TitleComponent.vue";
import PanelComponent from "../../../../components/form/PanelComponent.vue";
import { onMounted, ref } from "vue";
import Breadcrumb from "../../../../components/form/Breadcrumb.vue";
import FileList from "../../../../components/FileList.vue";
import breadcrumb from "../../../../components/form/Breadcrumb.vue";
import { connected } from "@/js/ftpManager.js";
import { displayFlash } from "../../../../js/flashMessageController";
import { onBeforeRouteLeave } from "vue-router";
import {getSetting} from "../../../../js/manageSettings";

const currentDir = ref("");
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
    listFiles();
  }
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
      displayFlash("You have reached the Root Directory!", "warning");
      listFiles();
    }
  }
};


const changePath = (path) => {
  currentDir.value = path;

  listFiles();
};

const createNewFolderOnClient = async () => {
  const folderName = await window.ipcRendererInvoke("create-new-folder-client", currentDir.value);
  if (folderName) {
    displayFlash("Folder created", "success");

    let name = folderName.split("/").pop();
    if (name === "") {
      name = folderName;
    }

    let log = {
      logType: "Create-Folder",
      id: window.api.getUUID(),
      type: "Client Folder Created",
      name: name,
      open: false,
      destination: currentDir.value + "/"
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

const listFiles = async () => {
  if (currentDir.value) {
    try {
      fileList.value = await window.ipcRendererInvoke("list-local-files", currentDir.value) || [];

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
  const basename = (p) => p.split(/[\\/]/).pop();
  const destinationPath = currentDir.value + "/" + basename(sourcePath);
  await window.ipcRendererInvoke("copy-file", sourcePath, destinationPath);
  displayFlash("File copied", "success");
  await listFiles();
};

const openSelectedClientDirectory = async () => {
  await window.ipcRendererInvoke("open-selected-client-directory", currentDir.value);
};

const deleteFile = async (file) => {
  const filePath = currentDir.value + "/" + file.name;

  try {
    const response = await window.ipcRendererInvoke("delete-client-file", filePath);
    if (response.success) {
      displayFlash("Deleted file", "success");
      await listFiles();


      let log = {
        logType: "Delete-File",
        id: window.api.getUUID(),
        type: "Deleted Server File",
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
  await window.ipcRendererInvoke("delete-client-directory", currentDir.value + "/" + folder.name)
    .then(response => {
      if (response.success) {
        displayFlash("Deleted folder", "success");

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
</script>

<template>

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
            :initial-breadcrumb="breadcrumb"
            :current-dir="currentDir"
            :initial-path-prop="initialPath"
            @change-path="changePath" />
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
      @file-clicked="handleClick"
      @delete-file="deleteFile"
      @delete-folder="deleteFolder" />

  </panel-component>

</template>

<style scoped>

</style>
