<template>
  <div class="breadcrumb">

    <template
              v-for="(segment, index) in breadcrumb"
              :key="index">
      <a
         class="w-full mr-0 hover:underline hover:text-blue-600"
         :class="isInitialSegment(segment.path) ? 'text-gray-800' : 'text-blue-600'"
         @click.prevent="changePath(segment.path)"
         href="#"
         @mouseover="hover(index)"
         @mouseout="unhover()">
        {{ segment.name }}
      </a>
    </template>
  </div>
</template>


<script setup>
import { computed, onMounted, reactive, ref, watch } from "vue";

const props = defineProps({
  initialBreadcrumb: {
    type: Array,
    required: true
  },
  currentDir: {
    type: String,
    required: true
  },
  initialPathProp: {
    type: String,
    required: false
  }

});

const emit = defineEmits(["change-path"]);

const isInitialSegment = reactive(ref(() => false));

const currentDir = computed(() => {
  return props.currentDir;
});
const breadcrumb = ref(props.initialBreadcrumb);
const breadcrumbContainerWidth = ref(0);

const changePath = (path) => {
  emit("change-path", path);
};

const hover = (index) => {
  breadcrumb.value.forEach((segment, i) => {
    segment.hover = i === index;
  });
};

const unhover = () => {
  breadcrumb.value.forEach(segment => {
    segment.hover = false;
  });
};

const getCurrentPathBreadcrumb = () => {
  try{
    const segments = currentDir.value.split("/").filter(segment => segment.trim() !== "");
    if(segments.length === 0) {
      segments.push('');
    }
    return segments.map((segment, index) => {
      return {
        name: "/" + segment,
        path: "/" + segments.slice(0, index + 1).join("/"),
        hover: false
      };
    });
  }catch (e) {
    return {
      name: "/" + currentDir.value,
      path: "/" + currentDir.value,
      hover: false
    };
  }
};

const initialPath = computed(() => props.initialPathProp);

onMounted(() => {


  watch(currentDir, () => {
    breadcrumb.value = getCurrentPathBreadcrumb();
  });


  breadcrumb.value = getCurrentPathBreadcrumb();

  watch(breadcrumbContainerWidth, () => {
    const adjustedBreadcrumb = getCurrentPathBreadcrumb();
    if (breadcrumbContainerWidth.value < 300) {
      const middleIndex = Math.floor(adjustedBreadcrumb.length / 2);
      adjustedBreadcrumb.splice(middleIndex, 0, { name: "...", path: "", hover: false });
    }
    breadcrumb.value = adjustedBreadcrumb;
  });

  isInitialSegment.value = () => {
    if (!initialPath.value) {
      return false;
    }
    console.log(initialPath.value, currentDir.value);

    if(initialPath.value === currentDir.value) {
      return true;
    }
    return false;

  };


});
</script>
