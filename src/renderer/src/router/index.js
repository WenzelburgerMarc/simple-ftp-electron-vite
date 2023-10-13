import { createRouter, createWebHistory } from "vue-router";
import HomeView from "../views/HomePage/HomeView.vue";

const routes = [
  {
    path: "/",
    name: "home",
    component: HomeView
  }

];

const router = createRouter({
  history: createWebHistory(window.api.baseUrl),
  routes
});

export default router;
