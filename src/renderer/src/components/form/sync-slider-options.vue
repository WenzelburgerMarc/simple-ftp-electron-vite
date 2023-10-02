<template>
  <div class="relative flex justify-center items-center w-fit">
    <div :style="switchingBackgroundStyle"
         class="absolute bg-blue-600 h-full shadow-md -z-10 rounded-md" />
    <icon-button-component :icon="['fas', 'upload']"
                           emit-name="setSyncUpload"
                           @setSyncUpload="setSyncUpload"
                           :btn-class="[uploadEnabled ? 'text-gray-200' : 'text-gray-800', 'w-[120px] transition flex justify-center items-center p-3']"
                           :icon-class="[uploadEnabled ? 'text-gray-200' : 'text-gray-800', 'mr-2 transition']" >Upload</icon-button-component>
    <icon-button-component :icon="['fas', 'download']"
                           emit-name="setSyncDownload"
                           @setSyncDownload="setSyncDownload"
                           :btn-class="[uploadEnabled ? 'text-gray-800' : 'text-gray-200', 'w-[120px] transition flex justify-center items-center p-3']"
                           :icon-class="[uploadEnabled ? 'text-gray-800' : 'text-gray-200', 'mr-2 transition']" >Download</icon-button-component>
  </div>
</template>

<script setup>
import IconButtonComponent from "./IconButtonComponent.vue";
import { ref, computed } from "vue";
const uploadEnabled = ref(false);

const setSyncUpload = () => {
  uploadEnabled.value = true;
}

const setSyncDownload = () => {
  uploadEnabled.value = false;
}

const switchingBackgroundStyle = computed(() => {
  return {
    width: '120px',
    transform: `translateX(${uploadEnabled.value ? -60 : 60}px)`,
    transition: 'transform 0.3s ease-in-out'
  };
});
</script>

<style scoped>
/* You can keep your styles here */
</style>
