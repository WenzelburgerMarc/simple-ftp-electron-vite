<script setup>
// Desc: Modal Component
import { defineProps, onMounted } from "vue";

const emit = defineEmits(["closeModal", "connectToFTP"]);

onMounted(() => {
  window.addEventListener("click", (event) => {
    if (event.target.closest(".modal-bg")) {
      if (props.showModal) {
        emit("closeModal");
      }
    }
  });
});

const props = defineProps({
  showModal: {
    type: Boolean,
    required: true
  },
  overEverything: {
    type: Boolean,
    default: false,
    required: false
  }
});
</script>

<template>
  <div class="w-full">


    <div
      class="fixed modal-bg top-0 left-0 h-full w-full z-40 transition-all"
      :class="[props.showModal ? 'blur-transparent-modal pointer-events-auto' : 'opacity-0 pointer-events-none']"></div>

    <transition name="modal-fade">
      <div
        v-if="props.showModal"
        class="z-50 fixed w-[calc(100vw-100px)] left-0 max-w-5xl inset-0 flex items-center justify-center mx-auto pointer-events-none">
        <div class="modal relative w-full bg-gray-100 shadow-md p-3 rounded-md modal-content pointer-events-auto">
          <slot></slot>
        </div>
      </div>
    </transition>
  </div>
</template>

<style scoped>
.modal-fade-enter-active, .modal-fade-leave-active {
  transition: opacity 0.5s, transform 0.5s;
}

.modal-fade-enter-from, .modal-fade-leave-to {
  opacity: 0;
  transform: translateY(-10%);
}

.modal-fade-enter-to, .modal-fade-leave-from {
  opacity: 1;
  transform: translateY(0);
}

.blur-transparent-modal {
  backdrop-filter: blur(5px);
  background: transparent;
}
</style>
