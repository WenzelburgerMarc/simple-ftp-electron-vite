<script setup>
// Desc: Flash Message Component
import { ref, watch, computed, onMounted } from "vue";
import { showFlash, flashMessage, flashType, hideFlash } from "@/js/flashMessageController.js";
import { displayFlash } from "../js/flashMessageController";

const visible = ref(false);

watch(showFlash, (newVal) => {
  visible.value = newVal;
  if (newVal) {
    setTimeout(() => {
      visible.value = false;

      setTimeout(() => {
        hideFlash();
      }, 500);
    }, 3000);
  }
});
const flashTitle = computed(() => {
  switch (flashType.value) {
    case "error":
      return "Error";
    case "success":
      return "Success";
    case "info":
      return "Info";
    case "warning":
      return "Warning";
    default:
      return "Info";
  }
});

const gradientClasses = computed(() => {
  switch (flashType.value) {
    case "error":
      return "bg-gradient-to-t from-red-500 to-red-400";
    case "success":
      return "bg-gradient-to-t from-green-500 to-green-400";
    case "info":
      return "bg-gradient-to-t from-blue-500 to-blue-400";
    case "warning":
      return "bg-gradient-to-t from-yellow-500 to-yellow-300";
    default:
      return "bg-gradient-to-t from-blue-500 to-blue-400";
  }
});

const closeFlash = () => {
  visible.value = false;
};

onMounted(() => {
  window.ipcRendererOn("flash-message", (message, type) => {
    displayFlash(message, type);
  });
});

</script>

<template>
  <transition
    enter-active-class="transition ease-out duration-500"
    leave-active-class="transition ease-in duration-500"
    enter-from-class="opacity-0 transform translate-x-full"
    enter-to-class="opacity-100 transform translate-x-0"
    leave-from-class="opacity-100 transform translate-x-0"
    leave-to-class="opacity-0 transform translate-x-full">
    <div
      v-if="visible"
      class="fixed bg-white bottom-5 right-5  rounded-lg shadow-md flex flex-row overflow-hidden no-blur"
    >
      <div class="flex w-3"
           :class="gradientClasses"></div>
      <div class="flex-1 p-3">
        <h1 class="md:text-xl text-gray-600"
            v-text="flashTitle"></h1>
        <p class="text-gray-400 text-xs md:text-sm font-light"
           v-text="flashMessage"></p>
      </div>
      <div class="cursor-pointer border-l hover:bg-gray-100 border-gray-100 px-4 flex place-items-center"
           @click="closeFlash">
        <p class="text-gray-400 text-xs">CLOSE</p>
      </div>
    </div>
  </transition>
</template>

<style scoped>
.no-blur {
  backdrop-filter: none;
  z-index: 10000;
  filter: blur(0px);
}
</style>
