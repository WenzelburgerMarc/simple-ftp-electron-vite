<template>
  <input class="bg-gray-50 outline-none border border-gray-300 text-gray-900 text-sm rounded-lg block w-full p-2.5 focus:border-blue-600 focus:ring-2 focus:ring-blue-200"
         :type="props.type"
         :placeholder="props.placeholder"
         :value="props.modelValue"
         @input="$emit('update:modelValue', $event.target.value)"
  />
</template>

<script setup>
import { defineProps } from "vue";
const props = defineProps({
    type: String,
    placeholder: String,
    modelValue: [String, Number]
});


</script>
