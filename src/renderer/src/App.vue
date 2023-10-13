<template>

  <router-view/>

</template>

<script setup>

import {onMounted} from "vue";

window.addEventListener('DOMContentLoaded', () => {
  function getInitialColorMode() {
    const persistedColorPreference = window.localStorage.getItem('nightwind-mode');
    const hasPersistedPreference = typeof persistedColorPreference === 'string';
    if (hasPersistedPreference) {
      return persistedColorPreference;
    }
    const mql = window.matchMedia('(prefers-color-scheme: dark)');
    const hasMediaQueryPreference = typeof mql.matches === 'boolean';
    if (hasMediaQueryPreference) {
      return mql.matches ? 'dark' : 'light';
    }
    return 'light';
  }
  getInitialColorMode() == 'light' ? document.documentElement.classList.remove('dark') : document.documentElement.classList.add('dark');
});

onMounted( async() => {
  localStorage.removeItem('showGeneralSettings');
  localStorage.removeItem('showFtpSettings');

  // Default Settings
  try {
    let autoReloadFtpInterval = await window.ipcRendererInvoke("get-setting", "autoReloadFtpInterval");
    let autoSyncInterval = await window.ipcRendererInvoke("get-setting", "autoSyncInterval");

    if(!autoReloadFtpInterval) {
      await window.ipcRendererInvoke("set-setting", "autoReloadFtpInterval", 60000);
    }
    if(!autoSyncInterval) {
      await window.ipcRendererInvoke("set-setting", "autoSyncInterval", 30000);
    }
  }catch (error) {
    let log = {
      logType: "Error",
      id: window.api.getUUID(),
      type: "Error - Default Settings",
      open: false,
      description: error.message,
    };
    window.ipcRendererInvoke("add-log", log);
  }

});

</script>
<style>
</style>
