<template>
  <ModalComponent @closeModal="closeModal"
                  :show-modal="showModal">
    <div class="w-full flex flex-col justify-start items-center relative pb-10">
      <div class="w-full flex justify-between items-center ">

        <TitleComponent :title-text="'Logs'"
                        :size="'medium'" />


        <IconButtonComponent
          v-if="props.showModal"
          :emit-name="'closeSettings'"
          :icon="['fas', 'xmark']"
          :btn-class="'z-20 close text-xl flex justify-center items-center'"
          @closeSettings="closeModal"
        />
      </div>


      <template v-for="log in paginatedLogs"
                :key="log.id">
        <sync-mode-log @deleteLog="deleteLog"
                       @toggleLogDetails="toggleLogDetails"
                       :prop-log="log"
                       :prop-allow-expand="allowExpand"
                       v-if="log.logType === 'Sync-Progress'"
                       :class="paginatedLogs[paginatedLogs.length - 1] !== log ? 'border-b border-gray-400' : ''" />
        <delete-file-log v-else-if="log.logType === 'Delete-File'"
                         :class="paginatedLogs[paginatedLogs.length - 1] !== log ? 'border-b border-gray-400' : ''"
                         :prop-log="log"
                         :prop-allow-expand="false"
                         @deleteLog="deleteLog"
        />
      </template>

    </div>

    <div class="w-full flex justify-center items-center space-x-2"
         v-if="logList.length > itemsPerPage">
      <button @click="prevPage"
              :disabled="currentPage <= 1"
              class="px-1 text-white bg-blue-600 rounded">
        <font-awesome-icon :icon="['fas', 'chevron-left']" />
      </button>

      <!-- Nächste Seite Button -->
      <button @click="nextPage"
              :disabled="logList ? currentPage * itemsPerPage >= logList.length : true"
              class="px-1 text-white bg-blue-600 rounded">
        <font-awesome-icon :icon="['fas', 'chevron-right']" />
      </button>
    </div>
    <LabelComponent class="absolute bottom-3 right-3"
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
const itemsPerPage = ref(10);

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
    console.log("logs", logs);
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
  console.log("toggleLogDetails 1");
  if (!allowExpand.value) return;
  console.log("toggleLogDetails 2");
  logList.value.forEach(async(log, index) => {
    console.log("toggleLogDetails 3");
    if (log.id === id && log.files) {
      console.log("toggleLogDetails 4");
      logList.value[index] = { ...log, open: !log.open };
      await nextTick();
      const element = document.querySelector(`.accordion-content[data-id="${id}"]`);
      console.log("toggleLogDetails 5");
      if (element) {
        console.log("toggleLogDetails 6");
        if (!log.open) {
          console.log("toggleLogDetails 7");
          element.style.maxHeight = (element.scrollHeight + 100) + "px";
        } else {
          console.log("toggleLogDetails 8");
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
