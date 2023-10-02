<template>
  <main-layout>
    <div class="w-full flex flex-col justify-center items-center space-y-3 p-3 mr-[10px]">
      <FtpStatusOverview @listFiles="listFilesAndDirectories"
                         :is-connected="connected" />

      <the-ftp-explorer />

      <sync-slider-options v-if="connected" />


      <the-client-explorer />

    </div>
  </main-layout>
</template>

<script setup>
import MainLayout from "@/layouts/main-layout.vue";
import FtpStatusOverview from "./includes/FtpStatusOverview.vue";
import TheFtpExplorer from "./includes/FtpExplorer/TheFtpExplorer.vue";
import { connected, listFilesAndDirectories } from "../../js/ftpManager";
import TheClientExplorer from "./includes/ClientExplorer/TheClientExplorer.vue";
import SyncSliderOptions from "../../components/form/sync-slider-options.vue";
</script>

