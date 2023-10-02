<template>
  <div class="breadcrumb">
    <a class="w-full mr-0 text-gray-800 hover:underline hover:text-blue-600"
       v-for="(segment, index) in breadcrumb"
       :key="index"
       @click.prevent="changePath(segment.path)"
       href="#"
       @mouseover="hover(index)"
       @mouseout="unhover()">
      /{{ segment.name }}
    </a>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from "vue";

const props = defineProps({
  initialBreadcrumb: {
    type: Array,
    required: true
  },
  currentDir: {
    type: String,
    required: true
  }
});

const emit = defineEmits(['change-path']);

const currentDir = computed(() => {
  return props.currentDir;
})
const breadcrumb = ref(props.initialBreadcrumb);
const breadcrumbContainerWidth = ref(0);

const changePath = (path) => {
  emit('change-path', path);
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
  const segments = currentDir.value.split("/").filter(segment => segment.trim() !== "");
  return segments.map((segment, index) => {
    return {
      name: segment,
      path: '/' + segments.slice(0, index + 1).join('/'),
      hover: false
    };
  });
};

onMounted(() => {
  watch(currentDir, () => {
    breadcrumb.value = getCurrentPathBreadcrumb();
  });


  breadcrumb.value = getCurrentPathBreadcrumb();

  watch(breadcrumbContainerWidth, () => {
    const adjustedBreadcrumb = getCurrentPathBreadcrumb();
    if (breadcrumbContainerWidth.value < 300) {
      const middleIndex = Math.floor(adjustedBreadcrumb.length / 2);
      adjustedBreadcrumb.splice(middleIndex, 0, { name: '...', path: '', hover: false });
    }
    breadcrumb.value = adjustedBreadcrumb;
  });
});
</script>
