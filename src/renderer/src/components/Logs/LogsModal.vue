<template>
  <ModalComponent @closeModal="closeModal"
                  :show-modal="showModal">
    <div class="w-full flex flex-col space-y-4 justify-start items-center relative">
      <div class="w-full flex justify-between items-center">

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
      <div class="grid grid-cols-6 gap-0 w-full text-sm text-left text-gray-500 rounded-lg overflow-hidden pb-10">

        <div class="col-span-1 p-1 text-xs text-gray-700 uppercase bg-gray-200">Type</div>
        <div class="col-span-1 p-1 text-xs text-gray-700 uppercase bg-gray-200">Total Files</div>
        <div class="col-span-1 p-1 text-xs text-gray-700 uppercase bg-gray-200">Total Size</div>
        <div class="col-span-1 p-1 text-xs text-gray-700 uppercase bg-gray-200">Destination</div>
        <div class="col-span-1 p-1 text-xs text-gray-700 uppercase bg-gray-200">Progress</div>
        <div class="col-span-1 p-1 text-xs text-gray-700 uppercase bg-gray-200"></div>


        <template v-for="log in paginatedLogs"
                  :key="log.id">
          <div
            :class="[
                'col-span-8 grid grid-cols-6 gap-0  hover:bg-gray-50 transition-all duration-300',
                !log.open ? '' : 'bg-gray-50', (allowExpand&&log.files) ? 'cursor-pointer' : 'cursor-default',
                paginatedLogs[paginatedLogs.length - 1] !== log ? 'border-b border-gray-400' : ''
              ]"
          >

            <div @click="toggleLogDetails(log.id)" class="col-span-1 p-1 truncate">{{ log.type }}</div>
            <div @click="toggleLogDetails(log.id)" class="col-span-1 p-1 truncate">{{ log.totalFiles }}</div>
            <div @click="toggleLogDetails(log.id)" class="col-span-1 p-1 truncate">{{ formatSize(log.totalSize) }}</div>
            <div @click="toggleLogDetails(log.id)" class="col-span-1 p-1 truncate">{{ log.destination }}</div>
            <div @click="toggleLogDetails(log.id)" class="col-span-1 p-1 truncate">{{ log.progress }}</div>
            <div @click="toggleLogDetails(log.id)" class="col-span-1 p-1 truncate">
              <div class="flex justify-center items-center space-x-2">
                <icon-button-component :icon="['fas', 'trash-alt']"
                                       emit-name="deleteLog"
                                       @deleteLog="deleteLog(log.id)"
                                       icon-class="text-red-500"
                                       :btn-class="'z-50 close text-xl flex justify-center items-center'"
                />
                <icon-button-component @click="toggleLogDetails(log.id)" v-if="allowExpand && log.files"
                                       :icon="['fas', 'chevron-down']"
                                       :icon-class="[
                    log.open ? 'rotate-180' : '',
                    'transition-transform duration-300 text-gray-700'
                  ]"
                                       :btn-class="'z-20 close text-xl flex justify-center items-center ml-auto'"
                />
              </div>


            </div>
          </div>


          <div

            class="col-span-8 bg-gray-200 accordion-content transition-all duration-300 grid grid-cols-8"
            :data-id="log.id">
            <div class="col-span-8 grid grid-cols-4 gap-0 p-1">
              <div class="col-span-1 p-1 text-xs text-gray-700 uppercase">Path</div>
              <div class="col-span-1 p-1 text-xs text-gray-700 uppercase">Name</div>
              <div class="col-span-1 p-1 text-xs text-gray-700 uppercase">Size</div>
              <div class="col-span-1 p-1 text-xs text-gray-700 uppercase">Type</div>
              <template v-for="file in log.files" :key="file.name">
                <div class="col-span-8 grid grid-cols-4 gap-0 hover:bg-gray-300 rounded-full cursor-default">
                  <div class="col-span-1 p-1 truncate">{{ file.path }}</div>
                  <div class="col-span-1 p-1 truncate">{{ file.name }}</div>
                  <div class="col-span-1 p-1 truncate">{{ formatSize(file.size) }}</div>
                  <div class="col-span-1 p-1 truncate">{{ file.type }}</div>
                </div>
              </template>
            </div>
          </div>
        </template>

      </div>
    </div>
    <div class="w-full flex justify-center items-center space-x-2" v-if="logList.length > itemsPerPage">
      <button @click="prevPage" :disabled="currentPage <= 1" class="px-1 text-white bg-blue-600 rounded"><font-awesome-icon :icon="['fas', 'chevron-left']" /></button>

      <!-- Nächste Seite Button -->
      <button @click="nextPage" :disabled="logList ? currentPage * itemsPerPage >= logList.length : true"
              class="px-1 text-white bg-blue-600 rounded"><font-awesome-icon :icon="['fas', 'chevron-right']" /></button>
    </div>
    <LabelComponent class="absolute bottom-3 right-3" :label-text="'Page ' + currentPage + ' of ' + Math.max((Math.ceil(logList.length / itemsPerPage)), 1)"
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

onMounted(async() => {
  let logs = await window.ipcRendererInvoke("get-logs");

  window.ipcRendererOn("log-changed", async () => {
    logs = await window.ipcRendererInvoke("get-logs");
    updateLogs(logs);
    console.log("logs", logs)
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
  logList.value.forEach(async (log) => {
    if (log.id === id && log.files) {
      log.open = !log.open;
      await nextTick();
      const element = document.querySelector(`.accordion-content[data-id="${id}"]`);

      if (element) {
        if (log.open) {
          element.style.maxHeight = element.scrollHeight + "px";
        } else {
          element.style.maxHeight = 0+"px";

        }
      }
    }
  });
};


const formatSize = (size) => {
  const kb = 1024;
  const mb = kb * 1024;
  const gb = mb * 1024;
  const tb = gb * 1024;

  if (size >= tb) {
    return `${(size / tb).toFixed(2)} TB`;
  } else if (size >= gb) {
    return `${(size / gb).toFixed(2)} GB`;
  } else if (size >= mb) {
    return `${(size / mb).toFixed(2)} MB`;
  } else if (size >= kb) {
    return `${(size / kb).toFixed(2)} KB`;
  } else {
    return `${size} B`;
  }
};

</script>

<style scoped>

.accordion-content {
  overflow: hidden;
  max-height: 0;
  transition: max-height 0.3s ease-in-out;
}

</style>