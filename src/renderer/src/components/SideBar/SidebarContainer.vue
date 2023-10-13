<template>
  <div class="sidebar w-auto fixed top-0 left-0 bg-blue-600 h-screen z-50"
       :class="isOpen ? 'sidebarOpen' : 'sidebarClosed'">

    <div class="sidebar-content transition-all relative flex flex-col items-start justify-start h-full pb-3">

      <sidebar-toggler :isOpen="isOpen"
                       v-on:toggleSidebar="toggleSidebar()"
                       class="absolute left-full m-3" />

      <sidebar-item :item="logoItem"
                    :isOpen="isOpen"
                    class="z-50 mx-auto my-3 w-11/12"
                    :active-route="isRouteName('home').value" />
      <sidebar-divider />
      <SidebarItem :key="item"
                   v-for="item in arrSidebarItemsTop"
                   :item="item"
                   :isOpen="isOpen"
                   class="mx-auto mt-3 w-11/12"
                   :active-route="isRouteName(item.activeRouteName).value" />

      <sidebar-divider class="mt-auto" />
      <SidebarItem :key="item"
                   v-for="item in arrSidebarItemsBottom"
                   :item="item"
                   :isOpen="isOpen"
                   class="mx-auto mt-3 w-11/12"
                   :active-route="isRouteName(item.activeRouteName).value" />
    </div>


  </div>


  <FlashMessage />

</template>

<script setup>
import SidebarItem from "./SidebarItem.vue";
import SidebarToggler from "./SidebarToggler.vue";
import SidebarDivider from "./SidebarDivider.vue";
import { useRouter } from "vue-router";
import { defineEmits, onMounted } from "vue";
import nightwind from "nightwind/helper";
import FlashMessage from "@/components/FlashMessage.vue";
import { ref, computed } from "vue";

let isOpen = ref(false);

const emit = defineEmits(["toggledSidebarEvent", "settingsClicked", "logsClicked"]);

const router = useRouter();


const darkModeOn = ref(document.documentElement.classList.contains("dark"));
const darkModeIcon = computed(() => darkModeOn.value ? "bx-moon" : "bx-sun");
const arrSidebarItemsBottom = [

  {
    get iconClass() {
      return darkModeIcon.value;
    },
    label: "Toggle Appearance",
    actionEvent: () => toggleDarkMode(),
    activeRouteName: ""
  },
  {
    iconClass: "bx-log-out",
    label: "Exit",
    actionEvent: () => {
      window.ipcRendererInvoke("exit");
      if (isOpen.value)
        toggleSidebar();
    },
    activeRouteName: ""
  },
];


const toggleDarkMode = () => {
  nightwind.toggle();
  darkModeOn.value = !darkModeOn.value;
};

const arrSidebarItemsTop = [
  {
    iconClass: "bx-analyse",
    label: "Logs",
    actionEvent: () => {
      emit("logsClicked");
      if (isOpen.value)
        toggleSidebar();
    },
    activeRouteName: "logs"
  },
  {
    iconClass: "bx-cog",
    label: "Settings",
    actionEvent: () => {
      emit("settingsClicked");
      if (isOpen.value)
        toggleSidebar();
    },
    activeRouteName: ""
  },
];

const logoItem = {
  iconClass: "bx-home",
  label: "Home",
  actionEvent: () => {
    goToHome();
    if (isOpen.value)
      toggleSidebar();
  },
  isLogoItem: true
};

function toggleSidebar() {

  animateLabels(isOpen.value);

  isOpen.value = !isOpen.value;

  emit("toggledSidebarEvent");
}

onMounted(() => {
  window.addEventListener("click", (event) => {
    if (event.target.closest(".main-content-container")) {
      if (isOpen.value) {
        toggleSidebar();
      }
    }
  });
});

const isRouteName = (name) => {
  return computed(() => router.currentRoute.value.name === name);
};

async function animateLabels(reverse) {
  const labels = document.querySelectorAll(".sidebar-item h1");
  const headingElements = Array.from(labels);


  if (reverse) {
    headingElements.reverse();
  }
  let delay = 0;

  for (const label of headingElements) {
    await new Promise(resolve => setTimeout(resolve, delay * 25));
    label.classList.toggle("hide");
    delay += 0.5;
  }
}


function goToHome() {
  router.push({ name: "home" });
}

</script>
<style scoped>
.icon {

  transition: all 0.15s ease-in-out;
}

.sidebar {
  transition: all 0.45s ease-in-out;
}

.sidebarOpen {
  width: 224px !important;
}

.sidebarClosed {
  width: 70px !important;
}


</style>
