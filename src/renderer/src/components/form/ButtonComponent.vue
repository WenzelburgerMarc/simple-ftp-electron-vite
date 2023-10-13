<template>
  <button class="w-fit py-2 px-4 rounded-md text-gray-200 bg-blue-600 hover:bg-blue-700" @click="$emit(props.emitEvent)">{{ props.buttonText }}</button>
</template>

<script setup>


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
