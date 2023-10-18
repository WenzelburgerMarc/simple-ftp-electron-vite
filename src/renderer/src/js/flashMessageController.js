// Desc: This file contains the logic for displaying flash messages
import { ref } from "vue";

export const showFlash = ref(false);
export const flashMessage = ref("");
export const flashType = ref("info");

const messageQueue = ref([]);

export const displayFlash = (message, type = "info") => {

  const formattedMessage = message
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');

  messageQueue.value.push({ message: formattedMessage, type });

  if (messageQueue.value.length > 1) {
    const nextMessage = messageQueue.value[messageQueue.value.length - 2];
    if (nextMessage.message === formattedMessage && nextMessage.type === type) {
      messageQueue.value.pop();
    }
  }

  if (!showFlash.value) {
    showNextFlash();
  }
};


export const hideFlash = () => {
  showFlash.value = false;
  if (messageQueue.value.length > 0) {

    setTimeout(() => {
      showNextFlash();
    }, 500);
  }
};

const showNextFlash = () => {
  const nextMessage = messageQueue.value.shift();
  if (nextMessage) {
    flashMessage.value = nextMessage.message;
    flashType.value = nextMessage.type;
    showFlash.value = true;
  }
};
