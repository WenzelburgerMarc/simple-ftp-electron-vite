<template>
  <a :href="props.link" class="text-sm text-gray-700">{{ props.labelText }}</a>
</template>

<script setup>
import { defineProps } from 'vue';

const props = defineProps({
  labelText: String,
  link: String
});
</script>
