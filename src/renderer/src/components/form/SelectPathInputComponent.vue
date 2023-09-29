<template>
  <div class="flex w-full flex-col items-center justify-center">

    <LabelComponent :labelText="props.labelText"
                    class="mr-auto"/>

    <div class="flex w-full flex-col items-center justify-center overflow-hidden rounded-md border border-blue-600">
      <button @click="selectDirectory"
              class="w-full truncate text-gray-800 min-h-[42px] hover:bg-blue-100">
        <font-awesome-icon :icon="['far', 'folder-open']"/>
        {{ selectedPath ? 'Selected Path: ' + selectedPath : props.btnText }}
      </button>
    </div>
  </div>
</template>

<script setup>
import {ref, defineProps, defineEmits, watchEffect} from 'vue';
import LabelComponent from "@/components/form/LabelComponent.vue";

const props = defineProps({
  labelText: String,
  btnText: String,
  prevSelectedPath: String
});
const emits = defineEmits(['updateSelectedPath']);
const selectedPath = ref('');

watchEffect(() => {
  selectedPath.value = props.prevSelectedPath;
});

const selectDirectory = async () => {
  const path = await window.api.selectDirectory();
  if (path) {
    selectedPath.value = path;
    emits('updateSelectedPath', path);
  }
};
</script>
