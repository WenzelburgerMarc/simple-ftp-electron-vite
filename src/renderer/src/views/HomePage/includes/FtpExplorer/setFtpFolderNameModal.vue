<script setup>
// Desc: This is the modal that appears when the user clicks the "Create New Folder" button in the FTP Explorer
import ModalComponent from "../../../../components/ModalComponent.vue";
import { defineEmits, defineProps, onMounted, ref, toRefs, watch } from "vue";
import IconButtonComponent from "../../../../components/form/IconButtonComponent.vue";
import TitleComponent from "../../../../components/form/TitleComponent.vue";
import LabelInputComponent from "../../../../components/form/LabelInputComponent.vue";
import ButtonComponent from "../../../../components/form/ButtonComponent.vue";

const props = defineProps({
  showModal: Boolean
});
const emits = defineEmits(["update:showModal", "createFolder"]);
const { showModal } = toRefs(props);

onMounted(() => {
  watch(props, (newValue) => {
    if (newValue.showModal) {
      newFolderName.value = "";
    }
  });
});

const closeModal = () => {
  emits("update:showModal", false);
};

const newFolderName = ref("");

const updateNewFolderName = (newValue) => {
  newFolderName.value = newValue;
};

const createFolder = () => {
  emits("createFolder", newFolderName.value);
};
</script>

<template>
  <ModalComponent
    :show-modal="showModal"
    class="newFolderModal"
    @closeModal="closeModal">
    <div class="w-full flex flex-col space-y-2 justify-start items-start">
      <div class="w-full flex justify-between items-start">
        <TitleComponent :title-text="'Create A New Folder'"
                        :size="'medium'" />
        <IconButtonComponent
          v-if="props.showModal"
          :emit-name="'closeSettings'"
          :icon="['fas', 'xmark']"
          :btn-class="'z-20 close text-xl flex justify-center items-center'"
          @closeSettings="closeModal" />
      </div>
      <LabelInputComponent
        :model-value="newFolderName"
        :label="'Folder Name'"
        :type="'text'"
        :placeholder="'Name'"
        @update:modelValue="updateNewFolderName" />

      <ButtonComponent
        :button-text="'Create'"
        :emit-event="'createFolder'"
        :class="'mx-auto'"
        @createFolder="createFolder" />
    </div>
  </ModalComponent>
</template>

