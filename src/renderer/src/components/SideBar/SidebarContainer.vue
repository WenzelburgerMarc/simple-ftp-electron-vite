<script setup>
// Desc: Sidebar Container Component
import SidebarItem from "./SidebarItem.vue";
import SidebarToggler from "./SidebarToggler.vue";
import SidebarDivider from "./SidebarDivider.vue";
import { useRouter } from "vue-router";
import { defineEmits, onMounted } from "vue";
import nightwind from "nightwind/helper";
import FlashMessage from "@/components/FlashMessage.vue";
import { ref, computed } from "vue";
import { getSetting } from "../../js/manageSettings";
import '@/assets/guide.pdf'
let isOpen = ref(false);

const emit = defineEmits(["toggledSidebarEvent", "settingsClicked", "logsClicked", "exitClicked"]);

const router = useRouter();

const passwordSuccessfullyEntered = ref(false);

const darkModeOn = ref(document.documentElement.classList.contains("dark"));
const darkModeIcon = computed(() => darkModeOn.value ? "fa-solid fa-moon" : "fa-solid fa-sun");
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
    iconClass: "fa-solid fa-right-from-bracket",
    label: "Exit",
    actionEvent: () => {
      emit("exitClicked");
      if (isOpen.value)
        toggleSidebar();
    },
    activeRouteName: ""
  }
];


const toggleDarkMode = () => {
  nightwind.toggle();
  darkModeOn.value = !darkModeOn.value;
};

const arrSidebarItemsTop = [
  {
    iconClass: "fa-solid fa-magnifying-glass-chart",
    label: "Logs",
    actionEvent: () => {
      emit("logsClicked");
      if (isOpen.value)
        toggleSidebar();
    },
    activeRouteName: "logs"
  },
  {
    iconClass: "fa-solid fa-gear",
    label: "Settings",
    actionEvent: () => {
      emit("settingsClicked");
      if (isOpen.value)
        toggleSidebar();
    },
    activeRouteName: ""
  },
  {
    iconClass: "fa-solid fa-question",
    label: "Help",
    actionEvent: async() => {
      // open pdf
      await window.ipcRendererInvoke("openGuide");
      if (isOpen.value)
        toggleSidebar();
    },
    activeRouteName: ""
  }
];

const logoItem = {
  iconClass: "fa-solid fa-house",
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

onMounted(async () => {
  window.addEventListener("click", (event) => {
    if (event.target.closest(".main-content-container")) {
      if (isOpen.value) {
        toggleSidebar();
      }
    }


  });

  passwordSuccessfullyEntered.value = await getSetting("passwordSuccessfullyEntered");

  window.ipcRendererOn("passwordEnteredSuccessfully", async () => {
    passwordSuccessfullyEntered.value = true;
  });

  window.ipcRendererOn("resetPasswordEnteredSuccessfully", async () => {
    passwordSuccessfullyEntered.value = false;
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

<template>
  <div
    class="sidebar w-auto fixed top-0 left-0 bg-blue-600 h-screen z-50"
    :class="isOpen ? 'sidebarOpen' : 'sidebarClosed'">

    <div v-if="passwordSuccessfullyEntered === true" class="sidebar-content transition-all relative flex flex-col items-start justify-start h-full pb-3">

      <sidebar-toggler
        :is-open="isOpen"
        class="absolute left-full ml-[0.35rem] mt-4"
        @toggleSidebar="toggleSidebar()" />

      <sidebar-item
        :item="logoItem"
        :is-open="isOpen"
        class="z-50 mx-auto my-3 w-11/12"
        :active-route="isRouteName('home').value" />
      <sidebar-divider />
      <SidebarItem
        v-for="item in arrSidebarItemsTop"
        v-show="passwordSuccessfullyEntered"
        :key="item"
        :item="item"
        :is-open="isOpen"
        class="mx-auto mt-3 w-11/12"
        :active-route="isRouteName(item.activeRouteName).value" />

      <sidebar-divider class="mt-auto" />
      <SidebarItem
        v-for="item in arrSidebarItemsBottom"
        :key="item"
        :item="item"
        :is-open="isOpen"
        class="mx-auto mt-3 w-11/12"
        :active-route="isRouteName(item.activeRouteName).value" />
    </div>


  </div>


  <FlashMessage />

</template>


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
