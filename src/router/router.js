import {createRouter, createWebHistory} from "vue-router";
import {Route} from "@/core/model/Route";
import {toast} from "vue3-toastify";
import t from '@/core/util/l18n';
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
    RouteOrganizerProfile,
    RouteOrganizerManagement,
    RouteOrganizerAllEvents,
    RouteOrganizerVideoConference,
    RouteOrganizerVideoConferenceNew,
    RouteOrganizerVideoConferenceEdit,
    RouteOrganizerEventsNew,
    RouteOrganizerEventsEdit,
    RouteOrganizerMemberRoom,
    RouteOrganizerLobbyRoom,
    RouteOrganizerPolls,
    RouteOrganizerPollResults,
    RouteOrganizerEventUserNew,
    RouteOrganizerEventUserEdit,
    RouteOrganizerEventUserMultipleNew,
    RouteOrganizerPollsNew,
    RouteOrganizerPollsEdit,
    RouteOrganizerPollsCopy,
    RouteEventUserFrame
} from "@/router/routes";
import {useCore} from "@/core/store/core";
import {USER_ROLE_ORGANIZER} from "@/core/auth/login";

import MainLogin from "@/core/views/MainLogin.vue";
import NotFound from "@/core/views/NotFound.vue";
import RequestChangeOrganizerPassword from "@/core/views/RequestChangeOrganizerPassword.vue";
import ChangeOrganizerPassword from "@/core/views/ChangeOrganizerPassword.vue";
import RegisterOrganizer from "@/core/views/RegisterOrganizer.vue";
import VerifyRegisteredOrganizer from "@/core/views/VerifyRegisteredOrganizer.vue";

import OrganizerDashboard from "@/modules/organizer/views/OrganizerDashboard.vue";
import OrganizerProfile from "@/modules/organizer/views/OrganizerProfile.vue";
import OrganizerEvents from "@/modules/organizer/views/OrganizerEvents.vue";
import OrganizerVideoConference from "@/modules/organizer/views/OrganizerVideoConference.vue";
import EditVideoConference from "@/modules/organizer/views/video-conference/EditVideoConference.vue";
import NewVideoConference from "@/modules/organizer/views/video-conference/NewVideoConference.vue";
import OrganizerManagement from "@/modules/organizer/views/OrganizerManagement.vue";
import OrganizerAllEvents from "@/modules/organizer/views/OrganizerAllEvents.vue";
import EventNew from "@/modules/organizer/views/event/EventNew.vue";
import EventEdit from "@/modules/organizer/views/event/EventEdit.vue";
import MemeberRoom from "@/modules/organizer/views/event/MemeberRoom.vue";
import LobbyRoom from "@/modules/organizer/views/event/LobbyRoom.vue";
import PollResultListing from "@/modules/organizer/views/event/PollResultListing.vue";
import PollListing from "@/modules/organizer/views/event/PollListing.vue";
import NewPoll from "@/modules/organizer/views/event/poll/NewPoll.vue";
import EditPoll from "@/modules/organizer/views/event/poll/EditPoll.vue";
import CopyPoll from "@/modules/organizer/views/event/poll/CopyPoll.vue";
import NewEventUser from "@/modules/organizer/views/event/event-user/NewEventUser.vue";
import NewMultipleEventUser from "@/modules/organizer/views/event/event-user/NewMultipleEventUser.vue";
import EditEventUser from "@/modules/organizer/views/event/event-user/EditEventUser.vue";

import EventUserFrame from "@/modules/eventUser/views/EventUserFrame.vue";

import StaticPageImprint from "@/core/views/staticPages/StaticPageImprint.vue";
import StaticPageDataProtection from "@/core/views/staticPages/StaticPageDataProtection.vue";
import StaticPageFaq from "@/core/views/staticPages/StaticPageFaq.vue";
import StaticPageUserAgreement from "@/core/views/staticPages/StaticPageUserAgreement.vue";
import StaticPageManual from "@/core/views/staticPages/StaticPageManual.vue";
import StaticPageFunctions from "@/core/views/staticPages/StaticPageFunctions.vue";
import {fetchEventBySlug} from "@/modules/eventUser/requests/fetch-event-by-slug";

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
    new Route("/admin/event", RouteOrganizerEvents, OrganizerEvents, {
        bootstrapIcon: 'bi-card-list',
        requireOrganizerRole: true
    }),
    new Route("/admin/video-conference", RouteOrganizerVideoConference, OrganizerVideoConference, {
        bootstrapIcon: 'bi-camera-video',
        requireOrganizerRole: true
    }),
    new Route("/admin/event/new", RouteOrganizerEventsNew, EventNew, {
        requireOrganizerRole: true
    }),
    new Route("/admin/event/edit/:id", RouteOrganizerEventsEdit, EventEdit, {
        requireOrganizerRole: true
    }, null, true),
    new Route("/admin/event/member-room/:id", RouteOrganizerMemberRoom, MemeberRoom, {
        bootstrapIcon: 'bi-people-fill',
        requireOrganizerRole: true
    }, null, true),
    new Route("/admin/event/member-room/:id/event-user/new", RouteOrganizerEventUserNew, NewEventUser, {
        requireOrganizerRole: true
    }, null, true),
    new Route("/admin/event/member-room/:id/event-user/multiple-new", RouteOrganizerEventUserMultipleNew, NewMultipleEventUser, {
        requireOrganizerRole: true
    }, null, true),
    new Route("/admin/event/member-room/:id/event-user/edit/:eventUserId", RouteOrganizerEventUserEdit, EditEventUser, {
        requireOrganizerRole: true
    }, null, true),
    new Route("/admin/event/lobby-room/:id", RouteOrganizerLobbyRoom, LobbyRoom, {
        bootstrapIcon: 'bi-person-plus-fill',
        requireOrganizerRole: true
    }, null, true),
    new Route("/admin/event/polls/:id", RouteOrganizerPolls, PollListing, {
        bootstrapIcon: 'bi-collection-fill',
        requireOrganizerRole: true
    }, null, true),
    new Route("/admin/event/polls/:id/poll/new", RouteOrganizerPollsNew, NewPoll, {
        requireOrganizerRole: true
    }, null, true),
    new Route("/admin/event/polls/:id/poll/edit/:pollId", RouteOrganizerPollsEdit, EditPoll, {
        requireOrganizerRole: true
    }, null, true),
    new Route("/admin/event/polls/:id/poll/copy/:pollId", RouteOrganizerPollsCopy, CopyPoll, {
        requireOrganizerRole: true
    }, null, true),
    new Route("/admin/event/poll-results/:id", RouteOrganizerPollResults, PollResultListing, {
        bootstrapIcon: 'bi-card-checklist',
        requireOrganizerRole: true
    }, null, true),
    new Route("/admin/video-conference/new", RouteOrganizerVideoConferenceNew, NewVideoConference, {
        requireOrganizerRole: true
    }),
    new Route("/admin/video-conference/edit/:id", RouteOrganizerVideoConferenceEdit, EditVideoConference, {
        requireOrganizerRole: true
    }, null, true),
    new Route("/admin/organizers", RouteOrganizerManagement, OrganizerManagement, {
        bootstrapIcon: 'bi-people-fill',
        requireOrganizerRole: true,
        requireSuperOrganizerRole: true
    }),
    new Route("/admin/all-event", RouteOrganizerAllEvents, OrganizerAllEvents, {
        bootstrapIcon: 'bi-calendar2-range-fill',
        requireOrganizerRole: true,
        requireSuperOrganizerRole: true
    }),

    // Module event user.
    // @todo Use regex to allow "/:eventSlug" urls, which are not clashing with 404 and other first level urls.
    new Route("/event/:eventSlug", RouteEventUserFrame, EventUserFrame, null, null, null, null,
        async (to) => {
            const slug = to.params?.eventSlug ?? '';
            try {
                const event = await fetchEventBySlug(slug);
                const coreStore = useCore();
                coreStore.setEvent(event);
            } catch (error) {
                toast(t('router.redirect.invalidEventSlug', {slug}), {type: "error"});
                return {
                    name: RouteMainLogin,
                };
            }
        }
    ),
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
        toast(t('router.redirect.activeOrganizerSession'), {type: "info"});
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