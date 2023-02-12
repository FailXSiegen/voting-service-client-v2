import {createRouter, createWebHistory} from "vue-router";
import {Route} from "@/core/model/Route";
import MainLogin from "@/core/views/MainLogin.vue";
import OrganizerDashboard from "@/modules/organizer/views/OrganizerDashboard.vue";
import {RouteMainLogin, RouteOrganizerDashboard} from "@/router/routes";

const routes = [
    new Route("/", RouteMainLogin, MainLogin, 'bi-box-arrow-in-right'),
    new Route("/admin", RouteOrganizerDashboard, OrganizerDashboard, 'bi-calendar4-week'),
];

export const router = createRouter({
    history: createWebHistory(),
    routes,
});
