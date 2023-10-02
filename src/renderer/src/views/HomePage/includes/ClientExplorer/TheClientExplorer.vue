<script setup>
import IconButtonComponent from "../../../../components/form/IconButtonComponent.vue";
import TitleComponent from "../../../../components/form/TitleComponent.vue";
import PanelComponent from "../../../../components/form/PanelComponent.vue";
import { onMounted, ref } from "vue";
import Breadcrumb from "../../../../components/form/Breadcrumb.vue";
import FileList from "../../../../components/form/FileList.vue";
import breadcrumb from "../../../../components/form/Breadcrumb.vue";
import { connected } from "@/js/ftpManager.js";
const currentDir = ref("");
const fileList = ref([]);
const initialPath = ref("");

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
  if (currentDir.value && currentDir.value !== initialPath.value) {
    const segments = currentDir.value.split("/").filter(segment => segment.trim() !== "");

    if (segments.length > 1) {
      segments.pop();
      const newPath = "/" + segments.join("/");
      if (newPath.startsWith(initialPath.value)) {
        currentDir.value = newPath;
        listFiles();
      }
    } else {
      currentDir.value = initialPath.value;
      listFiles();
    }
  }
};



const changePath = (path) => {
  currentDir.value = path;

  listFiles();
};

const createNewFolderOnClient = async () => {
  const folderName = await window.ipcRendererInvoke('create-new-folder-client', currentDir.value);
  if (folderName) {
    listFiles();
  }
};

onMounted(async() => {

  currentDir.value = await window.ipcRendererInvoke('get-setting', 'savePath')
  initialPath.value = await currentDir.value;
  await listFiles();
});

const listFiles = async () => {
  if (currentDir.value) {
    try {
      fileList.value = await window.ipcRendererInvoke('list-local-files', currentDir.value) || [];

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
</script>

<template>

  <panel-component
    v-if="connected"
    class="relative h-[45vh] overflow-x-hidden shadow-md sm:rounded-lg">

    <div class="w-full flex justify-between items-center">
      <title-component title-text="Client" />
      <icon-button-component @newFolderClient="createNewFolderOnClient"
                             emitName="newFolderClient"
                             btnClass="w-auto flex flex-shrink-0 justify-end items-center text-blue-600 hover:text-blue-700 text-base"
                             icon="plus" icon-class="mr-2" >New Folder</icon-button-component>
    </div>


    <div class="w-full flex space-x-2 justify-between items-start py-3">

      <div class="w-full flex space-x-2 justify-start items-center ">

        <icon-button-component
          emit-name="goBackFTPPath"
          btn-class="flex justify-center items-center text-gray-800 text-lg"
          icon-class="text-gray-800"
          :class="currentDir === '/' || currentDir===initialPath ? 'opacity-0 pointer-events-none' : ''"
          icon="arrow-left"
          @goBackFTPPath="handleBack" />

        <Breadcrumb :initial-breadcrumb="breadcrumb"
                    :current-dir="currentDir"
                    :initial-path="initialPath"
                    @change-path="changePath" />

      </div>

    </div>

    <FileList :initial-file-list="fileList"
              @file-clicked="handleClick" />

  </panel-component>

</template>

<style scoped>

</style>
