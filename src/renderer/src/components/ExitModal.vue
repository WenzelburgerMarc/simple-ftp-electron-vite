<script setup>
// Desc: Modal for displaying confirm exit
import { toRefs, defineEmits, ref, onMounted, watch } from "vue";
import ModalComponent from "@/components/ModalComponent.vue";
import TitleComponent from "./form/TitleComponent.vue";
import PlainButtonComponent from "./form/PlainButtonComponent.vue";
import ButtonComponent from "./form/ButtonComponent.vue";
import { startLoading, stopLoading } from "../js/loaderManager";
import { getSetting, password } from "../js/manageSettings";

const emits = defineEmits(["update:showModal"]);

const props = defineProps({
  showModal: Boolean
});

const { showModal } = toRefs(props);

const closeModal = () => {
  emits("update:showModal", false);
};


const exit = async() => {
  await startLoading();
  await window.ftp.clearFilesAfterModeSwitch();
  closeModal();
  window.ipcRendererInvoke("exit");
  await stopLoading();
};

const lock = async() => {
  await startLoading();
  window.ipcRendererInvoke("resetPasswordEnteredSuccessfully");
  await stopLoading();
};

const lockAvailable = ref(false);
onMounted(async() => {
  watch(props, async (newValue) => {
    if (newValue) {

      if(password.value.toString().length > 0){
        lockAvailable.value = await getSetting("passwordRequiredOnStartup");
      }else{
        lockAvailable.value = false;
      }
    }
  });
  lockAvailable.value = await getSetting("passwordRequiredOnStartup");
});

</script>

<template>
  <ModalComponent :show-modal="showModal"
                  @closeModal="closeModal"
  >
    <div class="w-full flex flex-col justify-start items-start relative pb-0">

      <title-component title-text="Confirm Exit" />

      <ButtonComponent
        v-if="lockAvailable"
        button-text="Lock"
        emit-event="lock"
        @lock="lock"
        class="absolute left-0 bottom-0"
      />

      <div class="w-full flex justify-center items-center space-x-5 my-3">
        <ButtonComponent
          button-text="Exit"
          emit-event="confirmExit"
          @confirmExit="exit"
        />
        <PlainButtonComponent
          class="text-gray-800 hover:text-black"
          button-text="Cancel"
          emit-event="cancelExit"
          @cancelExit="closeModal"
        />

      </div>
      <p class="text-gray-400 text-md mt-0 mx-auto">
        Unfinished Sync Files will be deleted.
      </p>

    </div>

  </ModalComponent>
</template>
