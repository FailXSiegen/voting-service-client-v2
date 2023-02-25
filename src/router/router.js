import {createRouter, createWebHistory} from "vue-router";
import {Route} from "@/core/model/Route";
import {toast} from "vue3-toastify";
import i18n from "@/l18n";
import MainLogin from "@/core/views/MainLogin.vue";
import NotFound from "@/core/views/NotFound.vue";
import RequestChangeOrganizerPassword from "@/core/views/RequestChangeOrganizerPassword.vue";
import ChangeOrganizerPassword from "@/core/views/ChangeOrganizerPassword.vue";
import RegisterOrganizer from "@/core/views/RegisterOrganizer.vue";
import VerifyRegisteredOrganizer from "@/core/views/VerifyRegisteredOrganizer.vue";
import OrganizerDashboard from "@/modules/organizer/views/OrganizerDashboard.vue";
import OrganizerProfile from "@/modules/organizer/views/OrganizerProfile.vue";
import OrganizerEvents from "@/modules/organizer/views/OrganizerEvents.vue";
import OrganizerManagement from "@/modules/organizer/views/OrganizerManagement.vue";
import OrganizerAllEvents from "@/modules/organizer/views/OrganizerAllEvents.vue";
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
    RouteRequestChangeOrganizerPassword,
    RouteRegisterOrganizer,
    RouteVerifyRegisteredOrganizer,
    RouteOrganizerEvents,
    RouteOrganizerProfile, RouteOrganizerManagement, RouteOrganizerAllEvents
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
    // 404
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

    // Static pages.
    new Route("/impressum", RouteStaticImprint, StaticPageImprint),
    new Route("/datenschutz", RouteStaticDataProtection, StaticPageDataProtection),
    new Route("/haeufige-fragen", RouteStaticFaq, StaticPageFaq),
    new Route("/nutzervereinbarung", RouteStaticUserAgreement, StaticPageUserAgreement),
    new Route("/anleitung", RouteStaticManual, StaticPageManual),
    new Route("/funktionen-planung", RouteStaticFunctions, StaticPageFunctions),

    // Module organizer routes.
    new Route("/admin", RouteOrganizerDashboard, OrganizerDashboard, {
        bootstrapIcon: 'bi-calendar4-week',
        requireOrganizerRole: true
    }),
    new Route("/admin/profile", RouteOrganizerProfile, OrganizerProfile, {
        bootstrapIcon: 'bi-calendar4-week',
        requireOrganizerRole: true
    }),
    new Route("/admin/events", RouteOrganizerEvents, OrganizerEvents, {
        bootstrapIcon: 'bi-card-list',
        requireOrganizerRole: true
    }),
    new Route("/admin/organizers", RouteOrganizerManagement, OrganizerManagement, {
        bootstrapIcon: 'bi-people-fill',
        requireOrganizerRole: true,
        requireSuperOrganizerRole: true
    }),
    new Route("/admin/all-events", RouteOrganizerAllEvents, OrganizerAllEvents, {
        bootstrapIcon: 'bi-calendar2-range-fill',
        requireOrganizerRole: true,
        requireSuperOrganizerRole: true
    }),
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
    if (to.meta.redirectOrganizer && coreStore.isActiveOrganizerSession) {
        toast(i18n.global.tc('router.redirect.activeOrganizerSession'), {type: "info"});
        return {
            name: RouteOrganizerDashboard,
        };
    }
    // Do not allow access to routes which require super organizer role.
    if (to.meta.requireSuperOrganizerRole && !coreStore.isSuperOrganizer) {
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