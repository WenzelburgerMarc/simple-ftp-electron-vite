<template>
  <ModalComponent :show-modal="showModal" @closeModal="closeModal">
    <settings-setting>
      <!-- General Settings Section -->
      <template #showGeneralSettings>
        <general-settings-section :show-modal="showModal" @closeModal="closeModal" />
      </template>

      <!-- FTP Settings Section -->
      <template #showFtpSettings>
       <f-t-p-settings-component :show-modal="showModal" @closeModal="closeModal"/>
      </template>
    </settings-setting>
  </ModalComponent>
</template>

<script setup>
// Imports
import {toRefs, defineProps, defineEmits } from "vue";
import ModalComponent from "@/components/ModalComponent.vue";
import SettingsSetting from "@/components/Settings/SettingsSetting.vue";
import GeneralSettingsSection from "./GeneralSettingsSection.vue";
import FTPSettingsComponent from "./FTPSettingsComponent.vue";

// Setup
const props = defineProps({
  showModal: Boolean
});

const emits = defineEmits(["update:showModal"]);

const { showModal } = toRefs(props);

const closeModal = () => {
  emits("update:showModal", false);
};


</script>

