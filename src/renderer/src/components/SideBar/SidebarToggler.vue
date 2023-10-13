<template>
  <div
    class=" flex items-center justify-center p-4 bg-blue-600 w-4 h-4 rounded-full hover:cursor-pointer drop-shadow-md"
    @click="$emit('toggleSidebar')"
  >
    <font-awesome-icon :icon="['fa-solid', 'fa-chevron-left']"
      :class="isOpenWatcher ? 'rotate-180' : ''"
      class="icon text-white text-center text-xl"
    ></font-awesome-icon>

  </div>
</template>
<script setup>

import { watch, ref, defineProps } from "vue";
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";

const props = defineProps({
  isOpen: {
    type: Boolean,
    required: true
  }
});

let isOpenWatcher = ref(props.isOpen);
watch(() => props.isOpen, () => {
  isOpenWatcher.value = props.isOpen;
});
</script>
<style scoped>
.icon {
  transition: all 0.25s ease-in-out;
}
</style>
