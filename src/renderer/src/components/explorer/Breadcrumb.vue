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

const getSeparator = () => {
  return props.isClientBreadcrumb === true ? window.api.path.sep : '/';
};

const changePath = (pathStr) => {
  let normalizedPath;
  if (props.isClientBreadcrumb === true) {

    const forwardSlashPath = pathStr.replace(/\\/g, '/');
    normalizedPath = window.api.path.normalize(forwardSlashPath);

  } else {

    normalizedPath = pathStr.startsWith('/') ? pathStr : '/' + pathStr;

  }

  if(props.isClientBreadcrumb){
    emit("change-path", normalizedPath, false);
  }else{
    emit("change-path", normalizedPath, true);
  }


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

const getCurrentPathBreadcrumb = async() => {
  try {
    const segments = currentDir.value.split(getSeparator()).filter(segment => segment.trim() !== "");


    if (segments.length === 0) {
      segments.push("");
    }
    return segments.map((segment, index) => {
      return {
        name: segment,
        path: window.api.path.join(...segments.slice(0, index + 1)),
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

const isInitialSegment = (pathStr) => {
  if (!initialPath.value) {
    return false;
  }

  if (!pathStr) {
    return false;
  }



  // Ensure the path starts with a separator



  if(props.isClientBreadcrumb === false) {
    if(!pathStr.startsWith('/')){
      pathStr = '/' + pathStr;
    }
    pathStr = pathStr.replace(/\\/g, '/');


  }else{
    let isWindows = window.api.os.platform === "win32";
    if(!isWindows){
      if(!pathStr.startsWith('/')){
        pathStr = '/' + pathStr;
      }
    }

  }



  return initialPath.value === pathStr;
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
        {{ segment.name }}
      </a>
      <span class="text-blue-600" v-if="index < breadcrumb.length - 1">{{ getSeparator() }}</span>
    </template>
  </div>
</template>
