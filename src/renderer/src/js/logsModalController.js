// Desc: Controller for the logs modal
import { ref } from "vue";

export const isLogsModalVisible = ref(false);

export const openLogsModal = () => {
  isLogsModalVisible.value = true;
};

export const updateLogsModalVisibility = (newVisibility) => {
  isLogsModalVisible.value = newVisibility;
};
export const formatSize = (size) => {
  const kb = 1024;
  const mb = kb * 1024;
  const gb = mb * 1024;
  const tb = gb * 1024;

  if (size >= tb) {
    return `${(size / tb).toFixed(2)} TB`;
  } else if (size >= gb) {
    return `${(size / gb).toFixed(2)} GB`;
  } else if (size >= mb) {
    return `${(size / mb).toFixed(2)} MB`;
  } else if (size >= kb) {
    return `${(size / kb).toFixed(2)} KB`;
  } else {
    return `${size} B`;
  }
};
