import {createRouter, createWebHistory} from "vue-router";
import {Route} from "@/core/model/Route";
import MainLogin from "@/core/views/MainLogin.vue";
import NotFound from "@/core/views/NotFound.vue";
import RequestChangeOrganizerPassword from "@/core/views/RequestChangeOrganizerPassword.vue";
import ChangeOrganizerPassword from "@/core/views/ChangeOrganizerPassword.vue";
import RegisterOrganizer from "@/core/views/RegisterOrganizer.vue";
import OrganizerDashboard from "@/modules/organizer/views/OrganizerDashboard.vue";
import VerifyRegisteredOrganizer from "@/core/views/VerifyRegisteredOrganizer.vue";
import {
    RouteMainLogin,
    RouteOrganizerDashboard,
    RouteNotFound,
    RouteStaticImprint,
    RouteStaticDataProtection,
    RouteStaticFaq,
    RouteStaticUserAgreement,
    RouteStaticManual,
    RouteStaticFunctions,
    RouteChangeOrganizerPassword,
    RouteRequestChangeOrganizerPassword, RouteRegisterOrganizer, RouteVerifyRegisteredOrganizer
} from "@/router/routes";
import {useCore} from "@/core/store/core";
import {USER_ROLE_ORGANIZER} from "@/core/auth/login";

import StaticPageImprint from "@/core/views/staticPages/StaticPageImprint.vue";
import StaticPageDataProtection from "@/core/views/staticPages/StaticPageDataProtection.vue";
import StaticPageFaq from "@/core/views/staticPages/StaticPageFaq.vue";
import StaticPageUserAgreement from "@/core/views/staticPages/StaticPageUserAgreement.vue";
import StaticPageManual from "@/core/views/staticPages/StaticPageManual.vue";
import StaticPageFunctions from "@/core/views/staticPages/StaticPageFunctions.vue";

const routes = [
    new Route("/:pathMatch(.*)", null, null, null, RouteNotFound),
    new Route("/404", RouteNotFound, NotFound),
    new Route("/passwort-aendern", RouteRequestChangeOrganizerPassword, RequestChangeOrganizerPassword),
    new Route("/passwort-aendern/:hash", RouteChangeOrganizerPassword, ChangeOrganizerPassword, null, null, true),
    new Route("/register", RouteRegisterOrganizer, RegisterOrganizer),
    new Route("/register/:hash", RouteVerifyRegisteredOrganizer, VerifyRegisteredOrganizer, null, null, true),
    new Route("/", RouteMainLogin, MainLogin, {
        bootstrapIcon: 'bi-box-arrow-in-right',
        redirectOrganizer: true,
    }),
    new Route("/admin", RouteOrganizerDashboard, OrganizerDashboard, {
        bootstrapIcon: 'bi-calendar4-week',
        requireOrganizerRole: true
    }),
    // Static pages.
    new Route("/impressum", RouteStaticImprint, StaticPageImprint),
    new Route("/datenschutz", RouteStaticDataProtection, StaticPageDataProtection),
    new Route("/haeufige-fragen", RouteStaticFaq, StaticPageFaq),
    new Route("/nutzervereinbarung", RouteStaticUserAgreement, StaticPageUserAgreement),
    new Route("/anleitung", RouteStaticManual, StaticPageManual),
    new Route("/funktionen-planung", RouteStaticFunctions, StaticPageFunctions),
];

export const router = createRouter({
    history: createWebHistory(),
    routes,
    scrollBehavior() {
        // We want to start at the top, if we switch the view.
        return {top: 0};
    },
});

// eslint-disable-next-line no-unused-vars
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