<script setup>
import { defineProps, ref } from "vue";
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";

const props = defineProps({
  type: String,
  placeholder: String,
  modelValue: [String, Number]
});
const showPassword = ref(false);
</script>

<template>
  <div class="w-full relative"
       v-if="type === 'password'">
    <input
      class="pr-14 bg-gray-50 outline-none border border-gray-300 text-gray-900 text-sm rounded-lg block w-full p-2.5 focus:border-blue-600 focus:ring-2 focus:ring-blue-200"
      :type="showPassword ? 'text' : props.type"
      :placeholder="props.placeholder"
      :value="props.modelValue"
      @input="$emit('update:modelValue', $event.target.value)"
    />
    <div class="absolute inset-y-0 right-0 px-3 flex items-center text-sm leading-5 bg-transparent rounded-r-xl">

      <font-awesome-icon class="h-1/2 w-8 text-gray-800"
                          :icon="showPassword ? ['fas', 'eye-slash'] : ['fas', 'eye']"
                          v-if="props.type === 'password'"
                          @click="showPassword = !showPassword"></font-awesome-icon>
    </div>
  </div>

  <input
    v-else
    class="bg-gray-50 outline-none border border-gray-300 text-gray-900 text-sm rounded-lg block w-full p-2.5 focus:border-blue-600 focus:ring-2 focus:ring-blue-200"
    :type="props.type"
    :placeholder="props.placeholder"
    :value="props.modelValue"
    @input="$emit('update:modelValue', $event.target.value)"
  />
</template>
