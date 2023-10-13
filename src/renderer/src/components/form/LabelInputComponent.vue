<template>
  <div class="w-full flex flex-col">
    <LabelComponent :label-text="props.label"/>
    <InputComponent
:type="props.type"
                    :placeholder="props.placeholder"
                    :model-value="props.modelValue"
                    @update:modelValue="val => $emit('update:modelValue', val)"
    />
  </div>
</template>

<script setup>
import LabelComponent from "@/components/form/LabelComponent.vue";
import InputComponent from "@/components/form/InputComponent.vue";


const props = defineProps({
  label: String,
  type: String,
  placeholder: String,
  modelValue: [String, Number]
});
</script>
