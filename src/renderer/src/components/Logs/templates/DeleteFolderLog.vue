<script setup>
// Desc: Log Template for Log - Delete Folder
import { defineProps, defineEmits, ref, watch, onBeforeMount } from "vue";
import IconButtonComponent from "../../form/IconButtonComponent.vue";

const log = ref(null);

onBeforeMount(() => {
  watch(props, (newValue) => {
    log.value = newValue.propLog;
  }, { deep: true, immediate: true });

  log.value = props.propLog;
});

const props = defineProps({
  propLog: {
    type: Object,
    required: true
  },
  firstOrLast: {
    type: String,
    required: true
  }
});

const emits = defineEmits(["deleteLog"]);

const deleteLog = (id) => {
  emits("deleteLog", id);
};
</script>

<template>
  <div
    :class="[
                'w-full grid grid-cols-6 gap-0  hover:bg-gray-50 transition-all duration-300 text-gray-800 cursor-default'
                ,firstOrLast === 'first' ? 'rounded-t-xl' : '',firstOrLast === 'both' ? 'rounded-xl' : '', firstOrLast === 'last' ? 'rounded-b-xl' : '']">
    <div class="col-span-2 p-1  truncate-no-hover">{{ log.type }}
    </div>
    <div class="col-span-3 p-1  truncate-no-hover">{{ log.destination }}
    </div>
    <div class="col-span-1 p-1 flex justify-end items-center truncate-no-hover">
      <div class="flex justify-end items-center space-x-2">
        <icon-button-component
          :icon="['fas', 'trash-alt']"
          emit-name="deleteLog"
          icon-class="text-red-500"
          :btn-class="'z-50 close text-xl flex justify-center items-center'"
          @deleteLog="deleteLog(log.id)"
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
