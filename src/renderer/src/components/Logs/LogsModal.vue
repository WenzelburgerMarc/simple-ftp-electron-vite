<template>
  <ModalComponent
:show-modal="showModal"
                  @closeModal="closeModal">
    <div class="w-full flex flex-col justify-start items-center relative pb-10">
      <div class="w-full flex justify-between items-center ">

        <TitleComponent
:title-text="'Logs'"
                        :size="'medium'" />

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
                       @toggleLogDetails="toggleLogDetails" />
        <delete-file-log
v-else-if="log.logType === 'Delete-File'"
                         :class="paginatedLogs[paginatedLogs.length - 1] !== log ? 'border-b border-gray-400' : ''"
                         :prop-log="log"
                         :prop-allow-expand="false"
                         @deleteLog="deleteLog"
        />

        <create-folder-log
v-else-if="log.logType ==='Create-Folder'"
                           :class="paginatedLogs[paginatedLogs.length - 1] !== log ? 'border-b border-gray-400' : ''"
                           :prop-log="log"
                           :prop-allow-expand="false"
                           @deleteLog="deleteLog" />

        <set-sync-path-log
v-else-if="log.logType ==='Set-Sync-Path'"
                           :class="paginatedLogs[paginatedLogs.length - 1] !== log ? 'border-b border-gray-400' : ''"
                           :prop-log="log"
                           :prop-allow-expand="false"
                           @deleteLog="deleteLog" />

        <delete-folder-log
v-else-if="log.logType === 'Delete-Folder'"
                           :class="paginatedLogs[paginatedLogs.length - 1] !== log ? 'border-b border-gray-400' : ''"
                           :prop-log="log"
                           :prop-allow-expand="false"
                           @deleteLog="deleteLog"
        />
        <error-log
v-else-if="log.logType === 'Error'"
                   :class="paginatedLogs[paginatedLogs.length - 1] !== log ? 'border-b border-gray-400' : ''"
                   :prop-log="log"
                   :prop-allow-expand="false"
                   @deleteLog="deleteLog"
        />
<!--   make a test error log     -->
        <error-log
v-else-if="log.logType === 'Test-Error'"
                   :class="paginatedLogs[paginatedLogs.length - 1] !== log ? 'border-b border-gray-400' : ''"
                   :prop-log="log"
                   :prop-allow-expand="false"
                   @deleteLog="deleteLog" />
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
  </ModalComponent>
</template>
<script setup>
// Imports
import { toRefs, defineProps, defineEmits, ref } from "vue";
import ModalComponent from "@/components/ModalComponent.vue";
import IconButtonComponent from "../form/IconButtonComponent.vue";
import TitleComponent from "../form/TitleComponent.vue";
import { nextTick, onMounted, onUnmounted, computed } from "vue";
import LabelComponent from "../form/LabelComponent.vue";
import SyncModeLog from "./SyncModeLog.vue";
import DeleteFileLog from "./DeleteFileLog.vue";
import CreateFolderLog from "./CreateFolderLog.vue";
import SetSyncPathLog from "./SetSyncPathLog.vue";
import DeleteFolderLog from "./DeleteFolderLog.vue";
import ErrorLog from "./ErrorLog.vue";
// Setup
const props = defineProps({
  showModal: Boolean
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


const emits = defineEmits(["update:showModal"]);

const { showModal } = toRefs(props);

const closeModal = () => {
  emits("update:showModal", false);
};

const currentPage = ref(1);
const itemsPerPage = ref(5);

const paginatedLogs = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value;
  const end = start + itemsPerPage.value;
  return logList.value.slice(start, end);
});


const logList = ref([]);
const allowExpand = ref(true);

const updateLogs = (updatedLogs) => {
  logList.value = updatedLogs.reverse();
};

onMounted(async () => {
  let logs = await window.ipcRendererInvoke("get-logs");

  window.ipcRendererOn("log-changed", async () => {
    logs = await window.ipcRendererInvoke("get-logs");
    updateLogs(logs);
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

const deleteLog = async (id) => {
  await window.ipcRendererInvoke("delete-log", id);
  const logs = await window.ipcRendererInvoke("get-logs");
  await updateLogs(logs);
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
          element.style.maxHeight = (element.scrollHeight + 100) + "px";
        } else {
          element.style.maxHeight = 0 + "px";

        }
      }
    }
  });
};


</script>

<style scoped>

.accordion-content {
  overflow: hidden;
  max-height: 0;
  transition: max-height 0.3s ease-in-out;
}

.truncate-no-hover {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.truncate-no-hover:hover {
  overflow: visible;
  text-overflow: clip;
  white-space: normal;
  word-break: break-all;
}


</style>
