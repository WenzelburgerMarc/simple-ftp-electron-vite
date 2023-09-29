<template>
  <main-layout>
    <div class="w-full flex flex-col justify-center items-center space-y-3 p-3 mr-[10px]">
      <FtpStatusOverview @listFiles="listFiles"
                         :is-connected="connected" />
      <panel-component class="relative h-[45vh] overflow-x-hidden shadow-md sm:rounded-lg"
                       v-if="connected">

        <title-component title-text="Server" />
        <div class="w-full flex space-x-2 justify-between items-start py-3">
          <div class="w-full flex space-x-2 justify-start items-center ">
            <icon-button-component @goBackFTPPath="handleBack"
                                   emitName="goBackFTPPath"
                                   btnClass="flex justify-center items-center text-gray-800 text-lg"
                                   icon-class="text-gray-800"
                                   :class="currentDir === '/' ? 'opacity-0 pointer-events-none' : ''"
                                   icon="arrow-left" />
            <span class="truncate w-full mr-5 text-gray-800 ">Path: {{ currentDir }}</span>
          </div>
          <icon-button-component ëmitName="newFolderFTP"
                                 btnClass="w-auto flex flex-shrink-0 justify-end items-center text-blue-600 text-base"
                                 icon="plus" icon-class="mr-2" >New Folder</icon-button-component>


        </div>

        <table class="w-full text-sm text-left text-gray-500">
          <thead class="text-xs text-gray-700 uppercase">
          <tr>
            <th scope="col"
                class="px-6 py-3">Name
            </th>
            <th scope="col"
                class="px-6 py-3">Size
            </th>
            <th scope="col"
                class="px-6 py-3">Type
            </th>
            <th scope="col"
                class="px-6 py-3">
            </th>
          </tr>
          </thead>
          <tbody>
          <tr v-for="file in fileList"
              :key="file.name"
              class="bg-white border-b border-gray-200 hover:bg-gray-50"
              @click="handleClick(file)">
            <td class="px-6 py-4">
              <font-awesome-icon class="text-base mr-2"
                                 v-if="file.type === 'd'"
                                 :icon="['far', 'folder-open']" />
              <span class="hover:underline cursor-pointer">{{ file.name }}</span></td>
            <td class="px-6 py-4">{{ formatSize(file.size) }}</td>
            <td class="px-6 py-4">{{ formatType(file.name, file.type) }}</td>

            <td class="flex items-center px-6 py-4 space-x-3">
              <a href="#"
                 class="font-medium ml-auto text-red-600 hover:underline">Delete File</a>
            </td>
          </tr>
          </tbody>
        </table>
      </panel-component>
    </div>
  </main-layout>
</template>

<script setup>
import { onMounted, ref } from "vue";
import MainLayout from "@/layouts/main-layout.vue";
import FtpStatusOverview from "./includes/FtpStatusOverview.vue";
import {
  connected,
  listFilesAndDirectories,
  getCurrentDir,
  getFileList,
  setCurrentDir
} from "@/js/ftpManager.js";
import PanelComponent from "../../components/form/PanelComponent.vue";
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";
import IconButtonComponent from "../../components/form/IconButtonComponent.vue";
import TitleComponent from "../../components/form/TitleComponent.vue";

const currentDir = ref(getCurrentDir());
const fileList = ref([]);

const listFiles = () => {
  if (currentDir.value) {

    listFilesAndDirectories(currentDir.value).then(() => {
      fileList.value = getFileList();

    }).catch(error => {
      console.error("Error listing files:", error);
    });
  }
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


const handleBack = () => {
  if (currentDir.value) {
    const segments = currentDir.value.split("/").filter(segment => segment.trim() !== "");

    if (segments.length > 1) {
      segments.pop();
      currentDir.value = '/' + segments.join('/');
    } else {
      currentDir.value = '/';
    }

    listFiles();
  }
};



const formatSize = (size) => {
  const kb = 1024;
  const mb = kb * 1024;
  const gb = mb * 1024;
  const tb = gb * 1024;
  if (size >= tb) return (size / tb).toFixed(2) + " TB";
  if (size >= gb) return (size / gb).toFixed(2) + " GB";
  if (size >= mb) return (size / mb).toFixed(2) + " MB";
  return (size / kb).toFixed(2) + " KB";
};

const formatType = (name, type) => {
  if (type === "d") return "Directory";
  const extension = name.split(".").pop();
  return extension ? extension.toUpperCase() : "Unknown";
};


onMounted(() => {
  listFiles();
});
</script>

