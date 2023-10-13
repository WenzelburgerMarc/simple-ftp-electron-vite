import { createApp } from "vue";
import App from "./App.vue";
import router from "./router";
import "./css/style.css";

import { library } from "@fortawesome/fontawesome-svg-core";
import { fas } from "@fortawesome/free-solid-svg-icons";
import { far } from "@fortawesome/free-regular-svg-icons";
import { fab } from "@fortawesome/free-brands-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";

library.add(fas, far, fab);

const app = createApp(App);
app.component("FontAwesomeIcon", FontAwesomeIcon);
app.use(router).mount("#app");

