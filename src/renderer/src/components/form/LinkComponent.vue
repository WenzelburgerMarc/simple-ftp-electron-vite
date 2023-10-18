<script setup>
  const props = defineProps({
    labelText: String,
    link: String
  });
</script>

<template>
  <a :href="props.link"
     class="text-sm text-gray-700">{{ props.labelText }}</a>
</template>
