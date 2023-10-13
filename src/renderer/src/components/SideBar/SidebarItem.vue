<template>
    <div
class="sidebar-item p-2 flex items-center justify-start rounded-xl hover:cursor-pointer overflow-hidden"
        :class="[props.item.isLogoItem ? '' : 'hover:bg-blue-400', activeRoute ? 'bg-blue-400' : '']" @click="props.item.actionEvent">
        <div class="w-12 h-12  flex-shrink-0 flex items-center justify-center rounded-full">
            <font-awesome-icon :icon="props.item.iconClass"
:class="[props.item.isLogoItem ? 'font-semibold' : 'font-normal']"
                class='bx text-xl rounded-md text-white text-center'></font-awesome-icon>
        </div>


        <h1
:class="props.item.isLogoItem ? 'font-semibold' : 'font-light'"
            class="text-base hide text-white truncate ml-3 mr-auto">{{
                props.item.label
            }}
        </h1>

        <sidebar-item-tooltip v-if="!props.item.isLogoItem && !isOpenWatcher" class="tooltip" :text="props.item.label" />
    </div>
</template>

<script setup>

import SidebarItemTooltip from './SidebarItemTooltip.vue';
import { watch, ref, defineProps } from 'vue';
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";

const props = defineProps({
    item: {
        type: Object,
        required: true
    },
    isOpen: {
        type: Boolean,
        required: true
    },
  activeRoute: {
    type: Boolean,
    required: true
  }

});

let isOpenWatcher = ref(props.isOpen);
watch(() => props.isOpen, () => {
    isOpenWatcher.value = props.isOpen;
});
</script>

<style scoped>
h1,
.sidebar-item {
    transition: all 0.25s ease-in-out;
}

.tooltip {
    transition: all 0.25s ease-in-out;
    opacity: 0;
    visibility: hidden;
}

.sidebar-item:hover .tooltip {
    opacity: 1;
    visibility: visible;
}

.sidebar-item h1.hide {
    opacity: 0;
    transform: translateX(-10px);
}
</style>
