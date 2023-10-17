<script setup>
// Desc: Modal for displaying password input
import { toRefs, defineProps, defineEmits, ref, onMounted } from "vue";
import ModalComponent from "@/components/ModalComponent.vue";
import TitleComponent from "./form/TitleComponent.vue";
import PlainButtonComponent from "./form/PlainButtonComponent.vue";
import ButtonComponent from "./form/ButtonComponent.vue";
import { startLoading, stopLoading } from "../js/loaderManager";
import InputComponent from "./form/InputComponent.vue";
import { getSetting, setSetting } from "../js/manageSettings";
import { displayFlash } from "../js/flashMessageController";
import { updateSettingsModalVisibility } from "../js/settingsModalController";
import { updateLogsModalVisibility } from "../js/logsModalController";
import { updateExitModalVisibility } from "../js/exitModalController";
import { openPasswordModal } from "../js/passwordModalController";

const emits = defineEmits(["update:showModal"]);

const props = defineProps({
  showModal: Boolean
});

const { showModal } = toRefs(props);
const password = ref("");

const closeModal = () => {
  emits("update:showModal", false);
};

onMounted( () => {
  window.ipcRendererOn("resetPasswordEnteredSuccessfully", async () => {
    updatePassword("");
  });
});

const updatePassword = (newValue) => {
  password.value = newValue;
};

const exit = async () => {
  await startLoading();
  await window.ftp.clearFilesAfterModeSwitch();
  closeModal();
  window.ipcRendererInvoke("exit");
  await stopLoading();
};

const submit = async () => {
  await startLoading();
  let passwordRequired = await getSetting("passwordRequiredOnStartup");
  let setPasswordOnStartup = await getSetting("password");
  if (passwordRequired && password.value !== setPasswordOnStartup) {
    await displayFlash("Incorrect Password", "error");
    await stopLoading();
    return;
  } else {
    await setSetting("passwordSuccessfullyEntered", true);
    await window.ipcRendererInvoke("passwordEnteredSuccessfully");
    await displayFlash("Password Accepted", "success");
    closeModal();
  }
  await stopLoading();
};

</script>

<template>
  <ModalComponent :show-modal="showModal"
                  :over-everything="true"
  >
    <div class="w-full flex flex-col justify-start items-start relative space-y-3">

      <title-component title-text="Password Required" />

      <input-component :model-value="password"
                       :label="'Password'"
                       :type="'password'"
                       :placeholder="'Password'"
                       @update:modelValue="updatePassword"
                       @keydown.enter.prevent="submit"
      />

      <div class="w-full flex justify-center items-center space-x-5 my-3">
        <ButtonComponent
          button-text="Submit"
          emit-event="submitPassword"
          @submitPassword="submit" />
        <PlainButtonComponent
          class="text-gray-800 hover:text-black"
          button-text="Exit"
          emit-event="exit"
          @exit="exit" />

      </div>

    </div>

  </ModalComponent>
</template>
