<template>
  <label class="text-sm text-gray-700">{{ props.labelText }}</label>
</template>

<script setup>
import { defineProps } from 'vue';

const props = defineProps({
  labelText: String
});
</script>
