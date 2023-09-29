<template>
  <transition
      enter-active-class="transition ease-out duration-500"
      leave-active-class="transition ease-in duration-500"
      enter-from-class="opacity-0 transform translate-x-full"
      enter-to-class="opacity-100 transform translate-x-0"
      leave-from-class="opacity-100 transform translate-x-0"
      leave-to-class="opacity-0 transform translate-x-full">
    <div v-if="visible"
         class="fixed bottom-5 right-5 px-6 py-3 rounded-lg shadow-md text-gray-800 no-blur"
         :class="flashTypeClasses">
      {{ flashMessage }}
    </div>
  </transition>
</template>

<script setup>
import {ref, watch, computed, nextTick} from 'vue';
import { showFlash, flashMessage, flashType } from "@/js/flashMessageController.js";

const visible = ref(false);

watch(showFlash, (newVal) => {
  if (newVal) {
    nextTick(() => {
      visible.value = true;
    });

    setTimeout(() => {
      showFlash.value = false;
      visible.value = false;
    }, 3000);
  }
});

const flashTypeClasses = computed(() => {
  switch (flashType.value) {
    case 'error': return 'bg-red-300';
    case 'success': return 'bg-green-300';
    default: return 'bg-blue-300';
  }
});

</script>

<style scoped>
.no-blur {
  backdrop-filter: none;
  z-index: 10000;
  filter: blur(0px);
}
</style>
