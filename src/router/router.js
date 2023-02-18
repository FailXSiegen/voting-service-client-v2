import {createRouter, createWebHistory} from "vue-router";
import {Route} from "@/core/model/Route";
import MainLogin from "@/core/views/MainLogin.vue";
import NotFound from "@/core/views/NotFound.vue";
import OrganizerDashboard from "@/modules/organizer/views/OrganizerDashboard.vue";
import {RouteMainLogin, RouteOrganizerDashboard, NotFound as NotFoundRoute} from "@/router/routes";
import {useCore} from "@/core/store/core";
import {USER_ROLE_ORGANIZER} from "@/core/auth/login";

const routes = [
    new Route("/:pathMatch(.*)", null, null, null, NotFoundRoute),
    new Route("/404", NotFoundRoute, NotFound),
    new Route("/", RouteMainLogin, MainLogin, {
        bootstrapIcon: 'bi-box-arrow-in-right',
        redirectOrganizer: true,
    }),
    new Route("/admin", RouteOrganizerDashboard, OrganizerDashboard, {
        bootstrapIcon: 'bi-calendar4-week',
        requireOrganizerRole: true
    }),
];

export const router = createRouter({
    history: createWebHistory(),
    routes,
});

router.beforeEach((to, from) => {
    const coreStore = useCore();

    // Redirect logged in organizer to dashboard, if they visit a route with "meta.redirectOrganizer".
    if (to.meta.redirectOrganizer && coreStore.isActiveOrganiserSession) {
        return {
            name: RouteOrganizerDashboard,
        };
    }

    // Do not allow access to routes which require organizer role.
    if (to.meta.requireOrganizerRole && coreStore.getActiveUserRole !== USER_ROLE_ORGANIZER) {
        return {
            name: RouteMainLogin,
        };
    }
});