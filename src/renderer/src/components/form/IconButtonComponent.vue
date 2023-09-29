<template>
  <button @click="$emit(props.emitName)" :class="props.btnClass" >
    <font-awesome-icon :icon="props.icon" :class="props.iconClass"  />
    <slot></slot>
  </button>
</template>

<script setup>
import { defineProps } from 'vue';

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

