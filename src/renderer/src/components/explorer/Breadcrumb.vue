<script setup>
// Desc: Breadcrumb component for the explorers
import { computed, onMounted, ref, watch } from "vue";

const props = defineProps({
  initialBreadcrumb: {
    type: Object,
    required: true
  },
  currentDir: {
    type: String,
    required: true
  },
  initialPathProp: {
    type: String,
    required: false
  },
  isClientBreadcrumb: {
    type: Boolean,
    default: false,
    required: false
  }

});

const emit = defineEmits(["change-path"]);

const currentDir = computed(() => {
  return props.currentDir;
});
const breadcrumb = ref(props.initialBreadcrumb);
const breadcrumbContainerWidth = ref(0);

const changePath = (path) => {
  emit("change-path", isWindows() ? path : '/'+path);
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

const isWindows = () => {
  return navigator.platform.indexOf("Win") > -1;
};

const getCurrentPathBreadcrumb = async() => {
  try {
    let splitSymbol = (isWindows() && props.isClientBreadcrumb) ? "\\" : "/";
    const segments = currentDir.value.split(splitSymbol).filter(segment => segment.trim() !== "");

    if (segments.length === 0) {
      segments.push("");
    }
    return segments.map((segment, index) => {
      return {
        name: segment,
        path: segments.slice(0, index + 1).join(splitSymbol),
        hover: false
      };
    });
  } catch (e) {
    return {
      name: currentDir.value,
      path: currentDir.value,
      hover: false
    };
  }
};

const initialPath = computed(() => props.initialPathProp);

const isInitialSegment = (path) => {
  if (!initialPath.value) {
    return false;
  }
  if(props.isClientBreadcrumb !== true) {

    if (initialPath.value === '/'+path) {

      return true;
    }

  }else{
    let check = isWindows() ? path : '/'+path;
    if (initialPath.value === check) {
      console.log('true');
      return true;
    }else{
      console.log('false');
    }
  }

  return false;
};


onMounted(async () => {
  watch(currentDir, async () => {
    breadcrumb.value = await getCurrentPathBreadcrumb();
  });

  breadcrumb.value = await getCurrentPathBreadcrumb();

  watch(breadcrumbContainerWidth, async () => {
    const adjustedBreadcrumb = await getCurrentPathBreadcrumb();
    if (breadcrumbContainerWidth.value < 300) {
      const middleIndex = Math.floor(adjustedBreadcrumb.length / 2);
      adjustedBreadcrumb.splice(middleIndex, 0, { name: "...", path: "", hover: false });
    }
    breadcrumb.value = adjustedBreadcrumb;
  });
});

</script>

<template>
  <div class="breadcrumb">

    <template
      v-for="(segment, index) in breadcrumb"
      :key="index">
      <a
        class="w-full mr-0 hover:underline hover:text-blue-600"
        :class="isInitialSegment(segment.path) ? 'text-gray-800' : 'text-blue-600'"
        href="#"
        @click.prevent="changePath(segment.path)"
        @mouseover="hover(index)"
        @mouseout="unhover()">
        {{ segment.name }}<span>/</span>
      </a>
    </template>
  </div>
</template>
