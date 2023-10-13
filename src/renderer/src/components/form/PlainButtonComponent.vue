<template>
  <button class="w-fit rounded-md"
          @click="$emit(props.emitEvent)">{{ props.buttonText }}
  </button>
</template>

<script setup>


const props = defineProps({
  buttonText: {
    type: String,
    default: "Button"
  },
  emitEvent: {
    type: String,
    default: "click"
  }
});

</script>


