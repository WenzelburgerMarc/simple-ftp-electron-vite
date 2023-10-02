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
const currentDir = ref(getCurrentDir());
const fileList = ref([]);

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

const handleBack = () => {
  if (currentDir.value) {
    const segments = currentDir.value.split("/").filter(segment => segment.trim() !== "");

    if (segments.length > 1) {
      segments.pop();
      currentDir.value = "/" + segments.join("/");
    } else {
      currentDir.value = "/";
    }

    listFiles();
  }
};


const changePath = (path) => {
  currentDir.value = path;
  setCurrentDir(currentDir.value);

  listFiles();
};


onMounted(() => {
  listFiles();

  watch(getFileList, () => {
    fileList.value = getFileList();
  });


});

const listFiles = async () => {
  if (currentDir.value) {
    try {
      await listFilesAndDirectories(currentDir.value);
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
</script>

<template>

  <panel-component
    v-if="connected"
    class="relative h-[45vh] overflow-x-hidden shadow-md sm:rounded-lg">

    <title-component title-text="Server" />

    <div class="w-full flex space-x-2 justify-between items-start py-3">

      <div class="w-full flex space-x-2 justify-start items-center ">

        <icon-button-component
          emit-name="goBackFTPPath"
          btn-class="flex justify-center items-center text-gray-800 text-lg"
          icon-class="text-gray-800"
          :class="currentDir === '/' ? 'opacity-0 pointer-events-none' : ''"
          icon="arrow-left"
          @goBackFTPPath="handleBack" />

        <Breadcrumb :initial-breadcrumb="breadcrumb"
                    :current-dir="currentDir"
                    @change-path="changePath" />

      </div>

    </div>

    <FileList :initial-file-list="fileList"
              @file-clicked="handleClick" />

  </panel-component>

</template>

<style scoped>

</style>
