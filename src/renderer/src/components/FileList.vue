<template>
  <table class="w-full text-sm text-left text-gray-500">
    <thead class="text-xs text-gray-700 uppercase">
    <tr>
      <th
scope="col"
          class="px-6 py-3">Name
      </th>
      <th
scope="col"
          class="px-6 py-3">Size
      </th>
      <th
scope="col"
          class="px-6 py-3">Type
      </th>
      <th
scope="col"
          class="px-6 py-3">
      </th>
    </tr>
    </thead>
    <tbody>
    <tr
v-for="file in fileList"
        :key="file.name"
        class="bg-white w-full  border-b border-gray-200 hover:bg-gray-50"
        >
      <td class="px-6 py-4" @click="handleClick(file)">
        <font-awesome-icon
v-if="file.type === 'd'"
                           class="text-base mr-2"
                           :icon="['far', 'folder-open']" />
        <span class="hover:underline cursor-pointer">{{ file.name }}</span></td>
      <td class="px-6 py-4">{{ file.type !== 'd' ? formatSize(file.size) : '' }}</td>
      <td class="px-6 py-4">{{ formatType(file.name, file.type) }}</td>

      <td class="flex items-center px-6 py-4 space-x-3" :class="[showDeleteButtons ? 'active-delete-buttons' : 'inactive-delete-buttons', 'transition-all duration-300']">

        <a
v-if="file.type !== 'd'" href="#"
           class="font-medium flex-grow text-red-600 truncate hover:text-red-700"
            @click.prevent="$emit('delete-file', file)">Delete File</a>
        <a
v-else href="#" class="font-medium flex-grow truncate text-red-600 hover:text-red-700"
           @click.prevent="$emit('delete-folder', file)">Delete Folder</a>
      </td>
    </tr>
    </tbody>
  </table>
</template>

<script setup>
import { onMounted, computed, ref } from "vue";
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";

const props = defineProps({
  initialFileList: {
    type: Array,
    required: true
  }
});

const showDeleteButtons = ref(false);

const currentSyncMode = ref(null);

const emit = defineEmits(['file-clicked', 'delete-file', 'delete-folder']);

const fileList = computed(() => {
  return props.initialFileList;
});

const handleClick = (file) => {
  emit('file-clicked', file);
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
let interval = null;
onMounted(async() => {

  if(interval) {
    clearInterval(interval);
  }
  interval = setInterval(async () => {
    currentSyncMode.value = await window.ftp.getSyncMode();
    if(currentSyncMode.value === "") {
      showDeleteButtons.value = true;
    } else {
      showDeleteButtons.value = false;
    }
  }, 250);



});
</script>

<style scoped>
.active-delete-buttons {
  opacity: 1;
  pointer-events: auto;
}

.inactive-delete-buttons {
  opacity: 0;
  pointer-events: none;
}
</style>
