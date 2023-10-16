<script setup>
// Desc: Main Sidebar Component
import SidebarContainer from "./SidebarContainer.vue";
import { ref, watch } from "vue";

let toggledSidebar = ref(false);

const emits = defineEmits(["settingsClicked", "logsClicked", "exitClicked"]);

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
                      @toggledSidebarEvent="toggledSidebar = !toggledSidebar"
                      @exitClicked="$emit('exitClicked')"
    />
  </div>
</template>
