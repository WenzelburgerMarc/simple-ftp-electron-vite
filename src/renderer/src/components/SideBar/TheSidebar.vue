<script setup>
import SidebarContainer from './SidebarContainer.vue';
import { ref, watch } from 'vue';
let toggledSidebar = ref(false);

watch(() => toggledSidebar.value, () => {
  const mainContentContainer = document.querySelector('.main-content-container');
  if (!mainContentContainer) return;

  mainContentContainer.classList.toggle('translate-blur');

});
</script>

<template>
    <div>
        <SidebarContainer @toggledSidebarEvent="toggledSidebar = !toggledSidebar" class="z-50" />
    </div>
</template>

<style scoped>
@media (prefers-reduced-motion: reduce) {

    * {
        transition: none !important;
    }
}
</style>
