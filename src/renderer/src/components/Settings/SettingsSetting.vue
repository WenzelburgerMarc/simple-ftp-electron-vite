<template>
  <div class="flex space-x-5 justify-start items-start">
    <div class="flex flex-col space-y-2 justify-start items-start">
      <PlainButtonComponent :class="showGeneralSettings ? 'text-blue-600' : 'text-gray-800'" @showGeneralSettings="showGeneralSettingsHandler" buttonText="General" emit-event="showGeneralSettings" />
      <PlainButtonComponent :class="showFtpSettings ? 'text-blue-500' : 'text-gray-800'" @showFtpSettings="showFtpSettingsHandler" buttonText="FTP" emit-event="showFtpSettings" />

    </div>
    <div class="flex flex-col space-y-3 flex-grow">
      <slot v-if="showGeneralSettings" name="showGeneralSettings"></slot>
      <slot v-if="showFtpSettings" name="showFtpSettings"></slot>
    </div>
  </div>
</template>


<script setup>
import PlainButtonComponent from "@/components/form/PlainButtonComponent.vue";
import {onMounted, ref} from "vue";

const showGeneralSettings = ref(true);
const showFtpSettings = ref(false);

onMounted(() => {
  if(localStorage.getItem('showFtpSettings') == 'true') {
    showFtpSettingsHandler();
  } else {
    showGeneralSettingsHandler();
  }
});

const showGeneralSettingsHandler = () => {
  showGeneralSettings.value = true;
  showFtpSettings.value = false;

  setLocalStorage();
};

const showFtpSettingsHandler = () => {
  showGeneralSettings.value = false;
  showFtpSettings.value = true;

  setLocalStorage();
};

const setLocalStorage = () => {
  localStorage.setItem('showGeneralSettings', showGeneralSettings.value);
  localStorage.setItem('showFtpSettings', showFtpSettings.value);
};

</script>
