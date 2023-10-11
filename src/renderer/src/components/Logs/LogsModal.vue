<template>
  <ModalComponent @closeModal="closeModal"
                  :show-modal="showModal">
    <div class="w-full flex flex-col space-y-4 justify-start items-center ">
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
      <div class="grid grid-cols-8 gap-0 w-full text-sm text-left text-gray-500 rounded-lg overflow-hidden">

        <div class="col-span-1 p-1 text-xs text-gray-700 uppercase bg-gray-200">Type</div>
        <div class="col-span-1 p-1 text-xs text-gray-700 uppercase bg-gray-200">Total Files</div>
        <div class="col-span-1 p-1 text-xs text-gray-700 uppercase bg-gray-200">Total Size</div>
        <div class="col-span-1 p-1 text-xs text-gray-700 uppercase bg-gray-200">Destination</div>
        <div class="col-span-1 p-1 text-xs text-gray-700 uppercase bg-gray-200">Progress</div>
        <div class="col-span-1 p-1 text-xs text-gray-700 uppercase bg-gray-200">Start Time</div>
        <div class="col-span-1 p-1 text-xs text-gray-700 uppercase bg-gray-200">End Time</div>
        <div class="col-span-1 p-1 text-xs text-gray-700 uppercase bg-gray-200"></div>


        <template v-for="upload in uploadList"
                  :key="upload.id">
          <div
            @click="toggleLogDetails(upload.id)"
            :class="[
                'col-span-8 grid grid-cols-8 gap-0 cursor-pointer hover:bg-gray-50 transition-all duration-300',
                !upload.open ? '' : 'bg-gray-50',
                uploadList[uploadList.length - 1] !== upload ? 'border-b border-gray-400' : ''
              ]"
          >

            <div class="col-span-1 p-1 truncate">{{ upload.type }}</div>
            <div class="col-span-1 p-1 truncate">{{ upload.totalFiles }}</div>
            <div class="col-span-1 p-1 truncate">{{ formatSize(upload.totalSize) }}</div>
            <div class="col-span-1 p-1 truncate">{{ upload.destination }}</div>
            <div class="col-span-1 p-1 truncate">{{ upload.progress }}</div>
            <div class="col-span-1 p-1 truncate">{{ upload.startTime }}</div>
            <div class="col-span-1 p-1 truncate">{{ upload.endTime }}</div>
            <div class="col-span-1 p-1 truncate">
              <icon-button-component
                :icon="['fas', 'chevron-down']"
                :icon-class="[
                    upload.open ? 'rotate-180' : '',
                    'transition-transform duration-300 text-gray-700'
                  ]"
                :btn-class="'z-20 close text-xl flex justify-center items-center ml-auto'"
              />
            </div>
          </div>


          <div

            class="col-span-8 bg-gray-200 accordion-content transition-all duration-300 grid grid-cols-8"
            :data-id="upload.id">
            <div class="col-span-8 grid grid-cols-4 gap-0 p-1">
              <div class="col-span-1 p-1 text-xs text-gray-700 uppercase">Path</div>
              <div class="col-span-1 p-1 text-xs text-gray-700 uppercase">Name</div>
              <div class="col-span-1 p-1 text-xs text-gray-700 uppercase">Size</div>
              <div class="col-span-1 p-1 text-xs text-gray-700 uppercase">Type</div>
              <template v-for="file in upload.files" :key="file.name">
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
  </ModalComponent>
</template>
<script setup>
// Imports
import { toRefs, defineProps, defineEmits, ref } from "vue";
import ModalComponent from "@/components/ModalComponent.vue";
import IconButtonComponent from "../form/IconButtonComponent.vue";
import TitleComponent from "../form/TitleComponent.vue";
import { nextTick } from "vue";

// Setup
const props = defineProps({
  showModal: Boolean
});

const emits = defineEmits(["update:showModal"]);

const { showModal } = toRefs(props);

const closeModal = () => {
  emits("update:showModal", false);
};

const uploadList = ref([
  {
    id: 1,
    type: "Upload",
    open: false,
    status: "Completed",
    totalFiles: 10,
    totalSize: 1000000,
    destination: "/path/to/destination",
    progress: "100%",
    startTime: "10:00 AM",
    endTime: "10:30 AM",
    files: [
      { path: "test/path", name: "file1.txt", size: 100000, type: "txt" },
      { path: "test/path2", name: "file2.jpg", size: 200000, type: "jpg" }
    ]
  },
  {
    id: 2,
    type: "Upload",
    open: false,
    status: "Completed",
    totalFiles: 10,
    totalSize: 1000000,
    destination: "/path/to/destination",
    progress: "100%",
    startTime: "10:00 AM",
    endTime: "10:30 AM",
    files: [
      { path: "test/path", name: "file1.txt", size: 100000, type: "txt" },
      { path: "test/path2", name: "file2.jpg", size: 200000, type: "jpg" }
    ]
  }
]);

const toggleLogDetails = (id) => {
  uploadList.value.forEach(async (upload) => {
    if (upload.id === id) {
      upload.open = !upload.open;
      await nextTick();
      const element = document.querySelector(`.accordion-content[data-id="${id}"]`);

      if (element) {
        if (upload.open) {
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
