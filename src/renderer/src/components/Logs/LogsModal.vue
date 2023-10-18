<script setup>
// Desc: Modal for displaying logs
import { toRefs, defineProps, defineEmits, ref } from "vue";
import ModalComponent from "@/components/ModalComponent.vue";
import IconButtonComponent from "../form/IconButtonComponent.vue";
import TitleComponent from "../form/TitleComponent.vue";
import { nextTick, onMounted, onUnmounted, computed } from "vue";
import LabelComponent from "../form/LabelComponent.vue";
import SyncModeLog from "./templates/SyncModeLog.vue";
import DeleteFileLog from "./templates/DeleteFileLog.vue";
import CreateFolderLog from "./templates/CreateFolderLog.vue";
import SetSyncPathLog from "./templates/SetSyncPathLog.vue";
import DeleteFolderLog from "./templates/DeleteFolderLog.vue";
import ErrorLog from "./templates/ErrorLog.vue";

const emits = defineEmits(["update:showModal"]);

const props = defineProps({
  showModal: Boolean
});

const { showModal } = toRefs(props);

const closeModal = () => {
  emits("update:showModal", false);
};

const logList = ref([]);
const allowExpand = ref(true);

// Pagination
const currentPage = ref(1);
const itemsPerPage = ref(5);
const paginatedLogs = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value;
  const end = start + itemsPerPage.value;
  return logList.value.slice(start, end);
});

const nextPage = () => {
  if (currentPage.value * itemsPerPage.value < logList.value.length) {
    currentPage.value += 1;
  }
};

const prevPage = () => {
  if (currentPage.value > 1) {
    currentPage.value -= 1;
  }
};

const isCurrentPageEmpty = () => {
  if (paginatedLogs.value.length === 0 && currentPage.value > 1) {
    currentPage.value -= 1;
    isCurrentPageEmpty();
  }

};


// Logs
const updateLogs = (updatedLogs) => {
  logList.value = updatedLogs.reverse();
};

onMounted(async () => {
  let logs = await window.ipcRendererInvoke("get-logs");

  window.ipcRendererOn("log-changed", async () => {
    logs = await window.ipcRendererInvoke("get-logs");
    await updateLogs(logs);
  });
  logs = await window.ipcRendererInvoke("get-logs");

  await updateLogs(logs);


  window.ipcRendererOn("sync-progress-end", async () => {
    allowExpand.value = true;
  });

  window.ipcRendererOn("sync-progress-pause", async () => {
    allowExpand.value = true;


  });

  window.ipcRendererOn("sync-progress-start", async () => {
    allowExpand.value = false;
  });


});

const saveAllLogs = async () => {
  await window.ipcRendererInvoke("save-all-logs");
};

const deleteAllLogs = async () => {
  await window.ipcRendererInvoke("delete-all-logs");
  const logs = await window.ipcRendererInvoke("get-logs");
  await updateLogs(logs);
  isCurrentPageEmpty();
};

const getFirstOrLast = (log) => {
  const index = paginatedLogs.value.findIndex((item) => item.id === log.id);
  if (index === 0 && index === paginatedLogs.value.length - 1) {
    return "both";
  } else if (index === 0) {
    return "first";
  } else if (index === paginatedLogs.value.length - 1) {
    return "last";
  } else {
    return "";
  }
};

const deleteLog = async (id) => {

  await window.ipcRendererInvoke("delete-log", id);
  const logs = await window.ipcRendererInvoke("get-logs");
  await updateLogs(logs);
  isCurrentPageEmpty();
};


onUnmounted(() => {
  window.ipcRendererOff("log-changed");
});

const toggleLogDetails = (id) => {
  if (!allowExpand.value) return;
  logList.value.forEach(async (log, index) => {
    if (log.id === id && log.files) {
      logList.value[index] = { ...log, open: !log.open };
      await nextTick();
      const element = document.querySelector(`.accordion-content[data-id="${id}"]`);
      if (element) {
        if (!log.open) {
          element.style.maxHeight = (element.scrollHeight) + "px";

        } else {
          element.style.maxHeight = 0 + "px";

        }
      }
    }
  });
};
</script>

<template>
  <ModalComponent
    :show-modal="showModal"
    @closeModal="closeModal">
    <div class="w-full flex flex-col justify-start items-center relative pb-10">
      <div class="w-full flex justify-between items-center ">

        <TitleComponent
          :title-text="'Logs'"
          :size="'medium'"
          class="mb-2"
        />

        <IconButtonComponent
          v-if="props.showModal"
          :emit-name="'closeSettings'"
          :icon="['fas', 'xmark']"
          :btn-class="'z-20 close text-xl flex justify-center items-center'"
          @closeSettings="closeModal"
        />
      </div>


      <template
        v-for="log in paginatedLogs"
        :key="log.id">
        <sync-mode-log
          v-if="log.logType === 'Sync-Progress'"
          :prop-log="log"
          :prop-allow-expand="allowExpand"
          :class="paginatedLogs[paginatedLogs.length - 1] !== log ? 'border-b border-gray-400' : ''"
          @deleteLog="deleteLog"
          @toggleLogDetails="toggleLogDetails"
          :first-or-last="getFirstOrLast(log)"
        />
        <delete-file-log
          v-else-if="log.logType === 'Delete-File'"
          :class="paginatedLogs[paginatedLogs.length - 1] !== log ? 'border-b border-gray-400' : ''"
          :prop-log="log"
          :prop-allow-expand="false"
          @deleteLog="deleteLog"
          :first-or-last="getFirstOrLast(log)"
        />

        <create-folder-log
          v-else-if="log.logType ==='Create-Folder'"
          :class="paginatedLogs[paginatedLogs.length - 1] !== log ? 'border-b border-gray-400' : ''"
          :prop-log="log"
          :prop-allow-expand="false"
          @deleteLog="deleteLog"
          :first-or-last="getFirstOrLast(log)"
        />

        <set-sync-path-log
          v-else-if="log.logType ==='Set-Sync-Path'"
          :class="paginatedLogs[paginatedLogs.length - 1] !== log ? 'border-b border-gray-400' : ''"
          :prop-log="log"
          :prop-allow-expand="false"
          :first-or-last="getFirstOrLast(log)"
          @deleteLog="deleteLog"
        />

        <delete-folder-log
          v-else-if="log.logType === 'Delete-Folder'"
          :class="paginatedLogs[paginatedLogs.length - 1] !== log ? 'border-b border-gray-400' : ''"
          :prop-log="log"
          :prop-allow-expand="false"
          @deleteLog="deleteLog"
          :first-or-last="getFirstOrLast(log)"
        />
        <error-log
          v-else-if="log.logType === 'Error'"
          :class="paginatedLogs[paginatedLogs.length - 1] !== log ? 'border-b border-gray-400' : ''"
          :prop-log="log"
          :prop-allow-expand="false"
          @deleteLog="deleteLog"
          :first-or-last="getFirstOrLast(log)"
        />
      </template>

    </div>

    <div
      v-if="logList.length > itemsPerPage"
      class="w-full flex justify-center items-center space-x-2">
      <button
        :disabled="currentPage <= 1"
        :class="currentPage <= 1 ? 'bg-gray-200' : 'bg-blue-600'"
        class="px-2 text-white rounded"
        @click="prevPage">
        <font-awesome-icon :icon="['fas', 'chevron-left']" />
      </button>

      <button
        :disabled="logList ? currentPage * itemsPerPage >= logList.length : true"
        :class="currentPage * itemsPerPage >= logList.length ? 'bg-gray-200' : 'bg-blue-600'"
        class="px-2 text-white rounded"
        @click="nextPage">
        <font-awesome-icon :icon="['fas', 'chevron-right']" />
      </button>
    </div>
    <LabelComponent
      class="absolute bottom-3 right-3"
      :label-text="'Page ' + currentPage + ' of ' + Math.max((Math.ceil(logList.length / itemsPerPage)), 1)"
    />
    <div class="w-fit flex flex-col space-y-2"
         v-if="logList.length > 0">

      <icon-button-component :icon="['fas', 'fa-download']"
                             :btn-class="'bg-blue-300 hover:bg-blue-400 p-1 rounded-md text-gray-800'"
                             :icon-class="'text-gray-800'"
                             emit-name="saveAllLogs"
                             @saveAllLogs="saveAllLogs"> Save Logs
      </icon-button-component>
      <icon-button-component :icon="['fas', 'fa-trash-alt']"
                             :btn-class="'bg-red-300 hover:bg-red-400 p-1 rounded-md text-gray-800'"
                             :icon-class="'text-gray-800'"
                             emit-name="deleteAllLogs"
                             @deleteAllLogs="deleteAllLogs"> Clear All
      </icon-button-component>
    </div>
  </ModalComponent>
</template>
