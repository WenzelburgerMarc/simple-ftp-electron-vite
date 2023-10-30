// Desc: Start and stop loading animation
import { ref } from "vue";

export const loading = ref(false);

export const startLoading = () => {
  loading.value = true;
};

export const stopLoading = () => {
  loading.value = false;
};
