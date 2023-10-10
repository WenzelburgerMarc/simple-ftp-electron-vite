import { ref } from "vue";

export const isLogsModalVisible = ref(false);

export const openLogsModal = () => {
  isLogsModalVisible.value = true;
};

export const updateLogsModalVisibility = (newVisibility) => {
  isLogsModalVisible.value = newVisibility;
};
