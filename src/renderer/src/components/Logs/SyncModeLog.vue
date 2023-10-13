<script setup>
import IconButtonComponent from "../form/IconButtonComponent.vue";
import { ref, onBeforeMount, watch, onMounted } from "vue";
import { formatSize } from "../../js/logsModalController";

const log = ref(null);
const allowExpand = ref(false);
const isCanceled = ref(false);
onBeforeMount(() => {

  watch(props, (newValue) => {
    log.value = newValue.propLog;
    allowExpand.value = newValue.propAllowExpand;
    checkIfCanceled();
  }, {deep: true, immediate: true});

});

onMounted(() => {
  log.value = props.propLog;
  allowExpand.value = props.propAllowExpand;
  checkIfCanceled();


  const accordionElements = document.querySelectorAll('.accordion-content');
  accordionElements.forEach(element => {
    element.addEventListener('mouseover', handleMouseOver);
    element.addEventListener('mouseout', handleMouseOut);
  });
});

const handleMouseOver = (event) => {
  const element = event.currentTarget;
  if (element) {
    element.style.maxHeight = (element.scrollHeight) + "px";
  }
};

const handleMouseOut = (event) => {
  const element = event.currentTarget;
  if (element) {
    element.style.maxHeight = element.scrollHeight + "px";
  }
};

const checkIfCanceled = () => {
  if(log.value.type.toString().includes("Canceled")) {
    isCanceled.value = true;
  }else{
    isCanceled.value = false;
  }
};

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

const toggleLogDetails = (id) => {
  emits("toggleLogDetails", id);
};

const deleteLog = (id) => {
  emits("deleteLog", id);
};



</script>

<template>
  <div
:class="[
                'w-full grid grid-cols-6 gap-0  hover:bg-gray-50 transition-all duration-300 text-gray-800',
                !log.open ? '' : 'bg-gray-50', (allowExpand&&log.files) ? 'cursor-pointer' : 'cursor-default', isCanceled ? 'bg-gray-200' : ''
                ]"
  >

    <div
class="col-span-1 p-1  truncate-no-hover"
         @click="toggleLogDetails(log.id)">{{ log.type }}
    </div>
    <div
class="col-span-1 p-1  truncate-no-hover"
         @click="toggleLogDetails(log.id)">{{ log.totalFiles }}
    </div>
    <div
class="col-span-1 p-1  truncate-no-hover"
         @click="toggleLogDetails(log.id)">{{ formatSize(log.totalSize) }}
    </div>
    <div
class="col-span-1 p-1  truncate-no-hover"
         @click="toggleLogDetails(log.id)">{{ log.destination }}
    </div>
    <div
class="col-span-1 p-1  truncate-no-hover"
         @click="toggleLogDetails(log.id)">{{ log.progress }}
    </div>
    <div
class="col-span-1 p-1  truncate-no-hover"
         @click="toggleLogDetails(log.id)">
      <div class="flex justify-end items-center space-x-2" >
        <icon-button-component
:icon="['fas', 'trash-alt']"
                               emit-name="deleteLog"
                               icon-class="text-red-500"
                               :btn-class="'z-50 close text-xl flex justify-center items-center'"
                               @deleteLog="deleteLog(log.id)"
        />
        <icon-button-component
v-if="allowExpand && log.files"
                               :icon="['fas', 'chevron-down']"
                               :icon-class="[
                    log.open ? 'rotate-180' : '',
                    'transition-transform duration-300 text-gray-700'
                  ]"
                               :btn-class="'z-20 close text-xl flex justify-center items-center ml-auto'"
                               @click="toggleLogDetails(log.id)"
        />

        <icon-button-component
v-else
                               :icon="['fas', 'chevron-down']"
                               icon-class="opacity-0 pointer-events-none"
                               :btn-class="'z-20 close text-xl flex justify-center items-center ml-auto pointer-events-none'"
        />

      </div>


    </div>


    <div

      class="col-span-8 bg-gray-200 accordion-content transition-all duration-300 text-gray-800"
      :data-id="log.id">
      <div class="col-span-8 grid grid-cols-4 gap-0 p-1">
        <div class="col-span-1 p-1 text-xs text-gray-700 uppercase">Path</div>
        <div class="col-span-1 p-1 text-xs text-gray-700 uppercase">Name</div>
        <div class="col-span-1 p-1 text-xs text-gray-700 uppercase">Size</div>
        <div class="col-span-1 p-1 text-xs text-gray-700 uppercase">Type</div>
        <template
v-for="file in log.files"
                  :key="file.name">
          <div class="col-span-8 grid grid-cols-4 gap-0 hover:bg-gray-300 rounded-md cursor-default">
            <div class="col-span-1 p-1 truncate-no-hover">{{ file.path }}</div>
            <div class="col-span-1 p-1 truncate-no-hover">{{ file.name }}</div>
            <div class="col-span-1 p-1 truncate-no-hover">{{ formatSize(file.size) }}</div>
            <div class="col-span-1 p-1 truncate-no-hover">{{ file.type }}</div>
          </div>
        </template>
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
