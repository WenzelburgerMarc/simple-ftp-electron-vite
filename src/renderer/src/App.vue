<template>

  <router-view />

</template>

<script setup>
import { onMounted } from "vue";
import {loadSettings, getSetting, setSetting, resetSettings} from "./js/manageSettings";

window.addEventListener("DOMContentLoaded", () => {
  function getInitialColorMode() {
    const persistedColorPreference = window.localStorage.getItem("nightwind-mode");
    const hasPersistedPreference = typeof persistedColorPreference === "string";
    if (hasPersistedPreference) {
      return persistedColorPreference;
    }
    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    const hasMediaQueryPreference = typeof mql.matches === "boolean";
    if (hasMediaQueryPreference) {
      return mql.matches ? "dark" : "light";
    }
    return "light";
  }

  getInitialColorMode() == "light" ? document.documentElement.classList.remove("dark") : document.documentElement.classList.add("dark");
});

onMounted(async () => {
  localStorage.removeItem("showGeneralSettings");
  localStorage.removeItem("showFtpSettings");


  let firstStart = await getSetting("firstStart");

  if(firstStart === null || firstStart === undefined) {
    await setSetting("firstStart", false);
    await resetSettings(false);
  }

  try {
    // Load Settings
    await loadSettings(false)

  } catch (error) {
    let log = {
      logType: "Error",
      id: window.api.getUUID(),
      type: "Error - Default Settings",
      open: false,
      description: error.message
    };
    window.ipcRendererInvoke("add-log", log);
  }

});

</script>
<style scoped>
.notransition {
  -webkit-transition: none !important;
  -moz-transition: none !important;
  -o-transition: none !important;
  transition: none !important;
}
</style>
