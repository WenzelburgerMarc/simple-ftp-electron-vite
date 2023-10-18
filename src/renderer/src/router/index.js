// Desc: Vue Router
import { createRouter, createWebHashHistory } from "vue-router";
import HomeView from "../views/HomePage/HomeView.vue";

const routes = [
  {
    path: "/",
    name: "home",
    component: HomeView
  }
];

const router = createRouter({
  history: createWebHashHistory(window.api.baseUrl),
  routes
});

export default router;
