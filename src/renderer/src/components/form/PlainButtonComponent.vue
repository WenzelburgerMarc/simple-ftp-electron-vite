<template>
  <button @click="$emit(emitEvent)" class="w-fit rounded-md">{{ buttonText }}</button>
</template>

<script setup>
import { defineProps, defineEmits } from 'vue';

const props = defineProps({
  buttonText: {
    type: String,
    default: 'Button'
  },
  emitEvent: {
    type: String,
    default: 'click'
  }
});

</script>


