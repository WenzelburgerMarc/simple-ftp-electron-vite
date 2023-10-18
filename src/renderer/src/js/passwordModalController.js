// Desc: Controller for the password on startup modal
import { ref } from "vue";

export const isPasswordModalVisible = ref(false);

export const openPasswordModal = () => {
  isPasswordModalVisible.value = true;
};

export const updatePasswordModalVisibility = (newVisibility) => {
  isPasswordModalVisible.value = newVisibility;
};
