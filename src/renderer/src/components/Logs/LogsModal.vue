<template>
  <ModalComponent @closeModal="closeModal" :show-modal="showModal">
    <div class="w-full flex flex-col space-y-2 justify-start items-center">
      <div class="w-full flex justify-between items-start">
        <TitleComponent :title-text="'Logs'"
                        :size="'medium'" />
        <IconButtonComponent v-if="props.showModal"
                             :emit-name="'closeSettings'"
                             :icon="['fas', 'xmark']"
                             :btn-class="'z-20 close text-xl flex justify-center items-center'"
                             @closeSettings="closeModal" />
      </div>
    </div>
  </ModalComponent>
</template>

<script setup>
// Imports
import {toRefs, defineProps, defineEmits } from "vue";
import ModalComponent from "@/components/ModalComponent.vue";
import IconButtonComponent from "../form/IconButtonComponent.vue";
import TitleComponent from "../form/TitleComponent.vue";

// Setup
const props = defineProps({
  showModal: Boolean
});

const emits = defineEmits(["update:showModal"]);

const { showModal } = toRefs(props);

const closeModal = () => {
  emits("update:showModal", false);
};


</script>

