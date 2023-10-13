<script setup>
import SidebarContainer from "./SidebarContainer.vue";
import { ref, watch } from "vue";

let toggledSidebar = ref(false);

const emits = defineEmits(["settingsClicked", "logsClicked"]);

const settingsClicked = () => {
  emits("settingsClicked");
};

const logsClicked = () => {
  emits("logsClicked");
};

watch(() => toggledSidebar.value, () => {
  const mainContentContainer = document.querySelector(".main-content-container");
  if (!mainContentContainer) return;

  mainContentContainer.classList.toggle("translate-blur");

});
</script>

<template>
  <div class="z-30">
    <SidebarContainer @logs-clicked="logsClicked"
                      @settings-clicked="settingsClicked"
                      @toggledSidebarEvent="toggledSidebar = !toggledSidebar" />
  </div>
</template>

<style scoped>
@media (prefers-reduced-motion: reduce) {

  * {
    transition: none !important;
  }
}
</style>
