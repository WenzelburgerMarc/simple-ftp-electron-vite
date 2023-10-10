import { ref } from "vue";

export const isSettingsModalVisible = ref(false);

export const openSettingsModal = () => {
  isSettingsModalVisible.value = true;
};

export const updateSettingsModalVisibility = (newVisibility) => {
  isSettingsModalVisible.value = newVisibility;
};
