// Desc: Controller for the confirm exit modal
import { ref } from "vue";

export const isExitModalVisible = ref(false);

export const openExitModal = () => {
  isExitModalVisible.value = true;
};

export const updateExitModalVisibility = (newVisibility) => {
  isExitModalVisible.value = newVisibility;
};
