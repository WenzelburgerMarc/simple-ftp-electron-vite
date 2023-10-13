<template>
  <button :class="props.btnClass" @click="$emit(props.emitName)" >
    <font-awesome-icon :icon="props.icon" :class="props.iconClass"  />
    <slot></slot>
  </button>
</template>

<script setup>


const props = defineProps({
  icon: {
    // array or string
    type: [String, Array],
    required: true
  },
  btnClass: {
    type: [String, Array],
    default: ''
  },
  iconClass: {
    type: [String, Array],
    default: 'text-gray-800'
  },
  emitName: {
    type: String,
    default: 'click'
  }
});

</script>

