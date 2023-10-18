<script setup>
  const props = defineProps({
    labelText: String
  });
</script>

<template>
  <label class="text-sm text-gray-700">{{ props.labelText }}</label>
</template>
