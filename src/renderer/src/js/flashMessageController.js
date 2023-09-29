import { ref } from 'vue';

export const showFlash = ref(false);
export const flashMessage = ref("");
export const flashType = ref("info");

export const displayFlash = (message, type = "info") => {
    showFlash.value = false;
    flashMessage.value = message;
    flashType.value = type;
    showFlash.value = true;
};

export const hideFlash = () => {
    showFlash.value = false;
};
