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

onMounted( () => {
  localStorage.removeItem('showGeneralSettings');
  localStorage.removeItem('showFtpSettings');
});

</script>
<style>
</style>
