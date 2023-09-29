<template>
  <main-layout>
    <div class="flex flex-col space-y-3 p-3">

      <FtpStatusOverview @listFiles="listFiles" :is-connected="connected"
      />

      <div v-if="connected">
        <ul>
          <li class="underline text-gray-800">Files:</li>
          <li v-for="file in fileList"
              :key="file"
              class="text-gray-800">
            {{ file }}
          </li>
        </ul>
      </div>
    </div>
  </main-layout>

</template>

<script setup>
import MainLayout from "@/layouts/main-layout.vue";
import FtpStatusOverview from "./includes/FtpStatusOverview.vue";
import {
  connected, fileList, listFiles,
  // fileList
} from "@/js/ftpManager.js";



</script>
