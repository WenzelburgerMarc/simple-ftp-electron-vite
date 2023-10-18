<script setup>
// Desc: Filter Explorer Component, Filter For FileType And Name in the selected Sync Directories
import { defineEmits, ref, onMounted, onUnmounted } from "vue";
import PanelComponent from "../../../components/form/PanelComponent.vue";
import InputComponent from "../../../components/form/InputComponent.vue";
import LabelComponent from "../../../components/form/LabelComponent.vue";
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";

const emits = defineEmits(["searchByName", "searchByFileType", "listFiles"]);

const searchText = ref("");
const searchFileType = ref([]);

const props = defineProps({
  mode: {
    type: String,
    required: true
  }
});

const searchByName = async () => {
  emits("searchByName", searchText.value.trim(), props.mode);
};

const searchByFileType = async () => {
  emits("searchByFileType", searchFileType.value, props.mode);
};

const updateFileName = (newValue) => {
  searchText.value = newValue;
  searchByName();
};

const isOpen = ref(true);
const dropdownButton = ref(null);
const dropdownMenu = ref(null);
// Dropdown
onMounted(() => {

  dropdownButton.value = document.getElementById("dropdown-button"+props.mode);
  dropdownMenu.value = document.getElementById("dropdown-menu"+props.mode);
  const searchInput = document.getElementById("search-input"+props.mode);
  isOpen.value = true;

  // Function to toggle the dropdown state
  function toggleDropdown() {
    isOpen.value = !isOpen.value;
    dropdownMenu.value.classList.toggle("hidden", !isOpen.value);
  }

  // Set initial state
  toggleDropdown();

  dropdownButton.value.addEventListener("click", () => {
    toggleDropdown();
  });

  // Add event listener to filter items based on input
  searchInput.addEventListener("input", () => {
    const searchTerm = searchInput.value.toLowerCase();
    const items = dropdownMenu.value.querySelectorAll("a");

    items.forEach((item) => {
      const text = item.textContent.toLowerCase();
      if (text.includes(searchTerm)) {
        item.style.display = "block";
      } else {
        item.style.display = "none";
      }
    });
  });

  getAllFileTypes(props.mode);

  window.ipcRendererOn("updated-ftp-file-list", async () => {
    await getAllFileTypes(props.mode);
  });

  // Reset File Type Searching on file/folder delete
  window.ipcRendererOn("remove-file-type", async () => {
    fileTypes.value = [];
    searchFileType.value = [];
    await getAllFileTypes(props.mode);
    await searchByFileType();
  });
});

// Get All File Types
const fileTypes = ref([]);
const getAllFileTypes = async () => {
  try {
    if (props.mode === "client") {
      fileTypes.value = await window.ipcRendererInvoke("get-all-client-file-types");
    } else if (props.mode === "ftp") {
      fileTypes.value = await window.ftp.getAllFtpFileTypes();
    }

    fileTypes.value = [...new Set(fileTypes.value)];

  } catch (error) {
    let log = {
      logType: "Error",
      id: window.api.getUUID(),
      type: "Error - Failed To Get All File Types",
      open: false,
      description: error.message
    };
    window.ipcRendererInvoke("add-log", log);
  }

};
// Add or Remove File Type to search
const toggleToSearchByFileType = (fileType) => {

  if (searchFileType.value.includes(fileType)) {
    searchFileType.value = searchFileType.value.filter(item => item !== fileType);
    searchByFileType();
    return;
  }
  searchFileType.value.push(fileType);
  searchByFileType();
};

// Close Dropdown when clicked outside
function handleDocumentClick(event) {
  const { target } = event;
  const isClickInside = dropdownButton.value.contains(target) || dropdownMenu.value.contains(target);
  if (!isClickInside && isOpen.value) {
    isOpen.value = false;
    dropdownMenu.value.classList.add("hidden");
  }
}

document.addEventListener('click', handleDocumentClick);

onUnmounted(() => {
  document.removeEventListener('click', handleDocumentClick);
});
</script>

<template>
  <panel-component title="Filter">
    <div class="flex flex-col">
      <div class="flex flex-col">
        <label-component label-text="Search By File Name" />

        <input-component :model-value="searchText"
                         :label="'Search By File Name'"
                         :type="'text'"
                         :placeholder="'Search By File Name'"
                         @update:modelValue="updateFileName"
                         @keydown.enter.prevent="searchByName"
        />

      </div>
      <div class="flex flex-col mt-4">
        <!--    Dropdown tailwind for file type    -->
        <div class="relative group">
          <button :id="'dropdown-button'+props.mode"
                  class="inline-flex justify-center w-full px-4 py-2 text-sm font-medium text-gray-900 bg-gray-50 border border-gray-300 rounded-md shadow-sm focus:border-blue-600 focus:ring-2 focus:ring-blue-200">
            <span class="mr-2">Search By File Type</span>
            <font-awesome-icon :icon="['fas', 'caret-down']"
                               class="w-5 h-5 transition-all duration-300"
                               :class="isOpen ? 'rotate-180' : ''" />
          </button>
          <p class="text-gray-800 text-xs font-light">
            Selected File Types: <span v-for="type in searchFileType"
                                       :key="type"
                                       class="font-bold">{{ type }}, </span>
          </p>

          <div :id="'dropdown-menu'+props.mode"
               class="hidden z-50 absolute right-0 mt-2 rounded-md shadow-lg bg-blue-600 p-1 space-y-1">
            <!-- Search input -->
            <input-component :id="'search-input'+props.mode"
                             type="text"
                             placeholder="Search items"
                             autocomplete="off" />
            <a v-for="fileType in fileTypes"
               @click.prevent="toggleToSearchByFileType(fileType)"
               :key="fileType"
               href="#"
               class="block px-4 py-2 text-gray-200 cursor-pointer rounded-md"
               :class="{'bg-blue-500': searchFileType.indexOf(fileType) >= 0, 'hover:bg-blue-400': searchFileType.indexOf(fileType) < 0}"
            >
              {{ fileType }}
            </a>


          </div>
        </div>

      </div>
    </div>
  </panel-component>
</template>

<style scoped>

</style>
