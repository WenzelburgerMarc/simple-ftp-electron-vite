<template>
  <button @click="$emit(emitName)" :class="btnClass">
    <font-awesome-icon :icon="icon" :class="iconClass" />
    <slot></slot>
  </button>
</template>

<script setup>
import { defineProps, defineEmits } from 'vue';

const props = defineProps({
  icon: {
    type: Array,
    required: true
  },
  btnClass: {
    type: String,
    default: ''
  },
  iconClass: {
    type: String,
    default: 'text-gray-800'
  },
  emitName: {
    type: String,
    default: 'click'
  }
});

</script>

