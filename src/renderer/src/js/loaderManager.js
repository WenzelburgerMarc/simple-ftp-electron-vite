import { ref } from "vue";

export const loading =ref(false);

export const startLoading = () => {
  loading.value = true;
  console.log("start loading");
};

export const stopLoading = () => {
  loading.value = false;
  console.log("stop loading");
};
