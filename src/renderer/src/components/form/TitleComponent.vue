<script setup>
import { computed, defineProps } from "vue";

const props = defineProps({
  titleText: {
    type: String,
    default: "Title"
  },
  size: {
    type: String,
    default: "medium",
    validator: value => ["small", "medium", "large"].indexOf(value) !== -1
  }
});

const computedClass = computed(() => {
  switch (props.size) {
    case "small":
      return "text-xl";
    case "large":
      return "text-3xl";
    default:
      return "text-2xl";
  }
});
</script>

<template>
  <h1 :class="computedClass"
      class="text-gray-800">{{ titleText }}</h1>
</template>
