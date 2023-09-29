<template>
  <panel-component class="ftp-status flex justify-between items-center">
    <div class="w-full flex items-center space-x-4">
      <div :class="statusClass"
           class="w-3 h-3 rounded-full"></div>
      <div class="text-sm">
        <p v-if="isConnected"
           class="text-green-500">Connected</p>
        <p v-else
           class="text-red-500">Disconnected</p>
        <p v-if="isConnected && ftpCredentials.host"
           class="text-gray-800">Host: {{ ftpCredentials.host }}</p>
        <p v-else
           class="text-gray-400">No host connected</p>
      </div>
    </div>
    <div class="w-full flex justify-end items-center space-x-2">
      <icon-button-component emit-name="listFilesIconBtn" @listFilesIconBtn="listFiles" v-if="isConnected" iconClass="text-lg text-gray-800"
                             icon="rotate-right"/>
      <icon-button-component emit-name="disconnectFtpIconBtn" @disconnectFtpIconBtn="disconnect" v-if="isConnected"  iconClass="text-2xl text-red-500"
                             icon="xmark"/>

      <icon-button-component emit-name="connectFtpIconBtn" @connectFtpIconBtn="connectToFtp" v-if="!isConnected" iconClass="text-lg text-gray-800" icon="plug"/>

    </div>
  </panel-component>
</template>

<script setup>
import { defineProps, computed, ref, defineEmits, onMounted, watch } from "vue";
import IconButtonComponent from "@/components/form/IconButtonComponent.vue";
import {connect, disconnect} from "@/js/ftpManager";
import PanelComponent from "../../../components/form/PanelComponent.vue";
import {connected} from "../../../js/ftpManager";

const emit = defineEmits(['listFiles'])

const props = defineProps({
  isConnected: {
    type: Boolean,
    required: true
  }
});

const ftpCredentials = ref({
  host: '',
  port: '',
  user: '',
  password: ''
});

onMounted(() => {
  watch(connected, async(newValue) => {
    console.log('new');
    if (newValue) {
      ftpCredentials.value.host = await window.ipcRendererInvoke('get-setting', 'ftpHost');
    }
  })
})

const connectToFtp = async() => {
  ftpCredentials.value = {
    host: await window.ipcRendererInvoke('get-setting', 'ftpHost'),
    port: await window.ipcRendererInvoke('get-setting', 'ftpPort'),
    user: await window.ipcRendererInvoke('get-setting', 'ftpUsername'),
    password: await window.ipcRendererInvoke('get-setting', 'ftpPassword')
  };


  await connect({
    host: ftpCredentials.value.host,
    port: ftpCredentials.value.port,
    username: ftpCredentials.value.user,
    password: ftpCredentials.value.password
  });

  await listFiles();


}
const listFiles = ()  => {
   emit('listFiles');
}

const statusClass = computed(() => {
  return props.isConnected ? 'bg-green-500' : 'bg-red-500';
});

</script>

<style scoped>

</style>
