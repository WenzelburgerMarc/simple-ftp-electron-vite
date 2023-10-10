<template>
  <ModalComponent @closeModal="closeModal"
                  :show-modal="showModal">
    <div class="w-full flex flex-col space-y-2 justify-start items-center">
      <div class="w-full flex justify-between items-start">
        <TitleComponent :title-text="'Logs'"
                        :size="'medium'" />
        <IconButtonComponent v-if="props.showModal"
                             :emit-name="'closeSettings'"
                             :icon="['fas', 'xmark']"
                             :btn-class="'z-20 close text-xl flex justify-center items-center'"
                             @closeSettings="closeModal" />
      </div>
      <table class="w-full text-sm text-left text-gray-500">
        <thead class="text-xs text-gray-700 uppercase">
        <tr>
          <th>Type</th>
          <th>Total Files</th>
          <th>Total Size</th>
          <th>Destination</th>
          <th>Progress</th>
          <th>Start Time</th>
          <th>End Time</th>
          <th></th>
        </tr>
        </thead>
        <tbody>
        <template v-for="upload in uploadList"
                  :key="upload.id">
          <tr @click="toggleLogDetails(upload.id)"
              :class="['cursor-pointer' , !upload.open ? 'border-b-gray-500 border-b' : '']">
            <td>{{ upload.type }}</td>
            <td>{{ upload.totalFiles }}</td>
            <td>{{ formatSize(upload.totalSize) }}</td>
            <td>{{ upload.destination }}</td>
            <td>{{ upload.progress }}</td>
            <td>{{ upload.startTime }}</td>
            <td>{{ upload.endTime }}</td>
            <td>
              <icon-button-component
                :icon="['fas', 'chevron-down']"
                :icon-class="[upload.open ? 'rotate-180' : '' , 'transition-all duration-300 text-gray-800']"
                :btn-class="'z-20 close text-xl flex justify-center items-center'"
              />
            </td>
          </tr>
          <tr v-if="upload.open"
              :key="`details-${upload.id}`"
              class="bg-gray-200">
            <td colspan="8">

              <table class="w-full">
                <thead>
                <tr>
                  <th class="p-1">Path</th>
                  <th class="p-1">Name</th>
                  <th class="p-1">Size</th>
                  <th class="p-1">Type</th>
                </tr>
                </thead>
                <tbody>
                <tr v-for="file in upload.files"
                    :key="file.name">
                  <td class="p-1">{{ file.path }}</td>
                  <td class="p-1">{{ file.name }}</td>
                  <td class="p-1">{{ formatSize(file.size) }}</td>
                  <td class="p-1">{{ file.type }}</td>
                </tr>
                </tbody>
              </table>


            </td>
          </tr>
        </template>
        </tbody>
      </table>
    </div>
  </ModalComponent>
</template>

<script setup>
// Imports
import { toRefs, defineProps, defineEmits, ref } from "vue";
import ModalComponent from "@/components/ModalComponent.vue";
import IconButtonComponent from "../form/IconButtonComponent.vue";
import TitleComponent from "../form/TitleComponent.vue";

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
      // ... other files ...
    ]
  }
]);

const toggleLogDetails = (id) => {
  console.log(id);
  uploadList.value.forEach((upload) => {
    if (upload.id === id) {
      upload.open = !upload.open;
      console.log(upload.open);
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

