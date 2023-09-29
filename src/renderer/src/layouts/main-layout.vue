<script setup>
import TheSidebar from "@/components/SideBar/TheSidebar.vue";
import Loader from "../components/Loader.vue";


</script>

<template>
  <div class="overflow-hidden">
    <loader />
    <TheSidebar />

    <div class="main-content-container w-[calc(100vw-70px)] min-h-screen flex flex-col start start p-5 ml-5">
      <slot></slot>
    </div>

  </div>
</template>

<style scoped>
.main-content-container {
  overflow-x: hidden !important;
  transform: translateX(70px);
  transition: all 0.45s ease-in-out;
}

.translate-blur {
  overflow: hidden;
  transform: translateX(224px) scale(0.8);
  filter: blur(5px);
}

@media (prefers-reduced-motion: reduce) {

  * {
    transition: none !important;
  }
}
</style>
