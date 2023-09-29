<template>
  <main-layout>
    <div class="w-full flex flex-col justify-center items-center space-y-3 p-3 mr-[10px]">
      <FtpStatusOverview :is-connected="connected" />
      <ServerExplorer  />
    </div>
  </main-layout>
</template>

<script setup>
import MainLayout from "@/layouts/main-layout.vue";
import FtpStatusOverview from "./includes/FtpStatusOverview.vue";
import ServerExplorer from "./includes/ServerExplorer.vue";
import {connected} from "../../js/ftpManager";

</script>

