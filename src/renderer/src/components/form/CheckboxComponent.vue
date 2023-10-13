<template>
  <div class="flex items-center mr-4">
    <input :id="id"
           :checked="modelValue"
           type="checkbox"
           class="w-4 h-4 text-gray-800 bg-gray-100 accent-blue-500 border-gray-300 rounded focus:ring-blue-600 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
           @change="updateValue($event)">
    <label :for="id"
           class="ml-2 text-sm font-medium text-gray-800">{{ label }}</label>
  </div>
</template>

<script setup>
import { defineProps, defineEmits } from "vue";

defineProps({
  modelValue: Boolean,
  id: {
    type: String,
    default: "blue-checkbox"
  },
  label: {
    type: String,
    default: "Blue"
  }
});

const emit = defineEmits(["update:modelValue"]);

const updateValue = (event) => {
  emit("update:modelValue", event.target.checked);
};
</script>
