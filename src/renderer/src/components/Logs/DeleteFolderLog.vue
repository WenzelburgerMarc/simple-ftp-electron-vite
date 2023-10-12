<script setup>
import { defineProps, defineEmits, ref, watch, onBeforeMount } from "vue";
import IconButtonComponent from "../form/IconButtonComponent.vue";

const log = ref(null);
const allowExpand = ref(false);

onBeforeMount(() => {
  watch(props.propLog, (newValue) => {
    log.value = newValue;
  }, {deep: true});

  watch(props.propAllowExpand, (newValue) => {
    allowExpand.value = newValue;
  }, {deep: true});

  log.value = props.propLog;
  allowExpand.value = props.propAllowExpand;

  console.log("log", log.value);
  console.log("allowExpand", allowExpand.value);
});

const props = defineProps({
  propLog: {
    type: Object,
    required: true
  },
  propAllowExpand: {
    type: Boolean,
    required: false,
    default: false
  }
});

const emits = defineEmits(["toggleLogDetails", "deleteLog"]);

const deleteLog = (id) => {
  emits("deleteLog", id);
};
</script>

<template>
  <div
    :class="[
                'w-full grid grid-cols-6 gap-0  hover:bg-gray-50 transition-all duration-300 text-gray-800',
                !log.open ? '' : 'bg-gray-50', (allowExpand&&log.files) ? 'cursor-pointer' : 'cursor-default'
                ]">
    <div class="col-span-2 p-1  truncate-no-hover">{{ log.type }}
    </div>
    <div class="col-span-3 p-1  truncate-no-hover">{{ log.destination }}
    </div>
    <div class="col-span-1 p-1  truncate-no-hover">
      <div class="flex justify-end items-center space-x-2">
        <icon-button-component :icon="['fas', 'trash-alt']"
                               emit-name="deleteLog"
                               @deleteLog="deleteLog(log.id)"
                               icon-class="text-red-500"
                               :btn-class="'z-50 close text-xl flex justify-center items-center'"
        />
        <icon-button-component
          :icon="['fas', 'chevron-down']"
          icon-class="opacity-0 pointer-events-none"
          :btn-class="'z-20 close text-xl flex justify-center items-center ml-auto pointer-events-none'"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>

.accordion-content {
  overflow: hidden;
  max-height: 0;
  transition: max-height 0.3s ease-in-out;
}

.truncate-no-hover {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.truncate-no-hover:hover {
  overflow: visible;
  text-overflow: clip;
  white-space: normal;
  word-break: break-all;
}

</style>
