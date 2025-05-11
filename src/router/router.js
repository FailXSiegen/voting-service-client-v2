import { createRouter, createWebHistory } from "vue-router";
import { Route } from "@/core/model/Route";
import { toast } from "vue3-toastify";
import t from "@/core/util/l18n";
import { AUTH_TOKEN } from "@/apollo-client";
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
  RouteStaticGeneric,
  RouteChangeOrganizerPassword,
  RouteRequestChangeOrganizerPassword,
  RouteRegisterOrganizer,
  RouteVerifyRegisteredOrganizer,
  RouteOrganizerEvents,
  RouteOrganizerProfile,
  RouteOrganizerManagement,
  RouteOrganizerAllEvents,
  RouteOrganizerMessageEditor,
  RouteOrganizerStaticContentEditor,
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
  RouteEventUserFrame,
  RouteActivateAuthToken,
} from "@/router/routes";
import { useCore } from "@/core/store/core";
import { USER_ROLE_ORGANIZER } from "@/core/auth/login";
import { getPageSlugBySlug, STATIC_ROUTE_MAPPING } from "@/core/util/page-slug-checker";

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
import MessageEditor from "@/modules/organizer/views/MessageEditor.vue";
import StaticContentEditorView from "@/modules/organizer/views/StaticContentEditorView.vue";
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
import ActivateAuthToken from "@/modules/eventUser/views/ActivateAuthToken.vue";

import StaticPageImprint from "@/core/views/staticPages/StaticPageImprint.vue";
import StaticPageDataProtection from "@/core/views/staticPages/StaticPageDataProtection.vue";
import StaticPageFaq from "@/core/views/staticPages/StaticPageFaq.vue";
import StaticPageUserAgreement from "@/core/views/staticPages/StaticPageUserAgreement.vue";
import StaticPageManual from "@/core/views/staticPages/StaticPageManual.vue";
import StaticPageFunctions from "@/core/views/staticPages/StaticPageFunctions.vue";
import GenericStaticPage from "@/core/views/staticPages/GenericStaticPage.vue";
import { fetchEventBySlug } from "@/modules/eventUser/requests/fetch-event-by-slug";

const routes = [
  // Debug-Route, um zu prüfen, ob diese Route aktiviert wird
  new Route("/debug-route", "debugRoute", NotFound, {
    beforeEnter: (to, from) => {
      console.log('Debug route was hit!');
      return true;
    }
  }),

  // 404 Route für den expliziten Pfad
  new Route("/404", RouteNotFound, NotFound),

  new Route(
    "/passwort-aendern",
    RouteRequestChangeOrganizerPassword,
    RequestChangeOrganizerPassword,
  ),
  new Route(
    "/passwort-aendern/:hash",
    RouteChangeOrganizerPassword,
    ChangeOrganizerPassword,
    null,
    null,
    true,
  ),
  new Route("/register", RouteRegisterOrganizer, RegisterOrganizer),
  new Route(
    "/register/:hash",
    RouteVerifyRegisteredOrganizer,
    VerifyRegisteredOrganizer,
    null,
    null,
    true,
  ),
  new Route("/", RouteMainLogin, MainLogin, {
    bootstrapIcon: "bi-box-arrow-in-right",
    redirectOrganizer: true,
  }),

  // Static pages.
  new Route("/impressum", RouteStaticImprint, StaticPageImprint, null, null, null, null, async (to) => {
    const pageSlug = await getPageSlugBySlug('impressum');
    if (pageSlug && pageSlug.pageKey) {
      console.log('Found custom page slug for impressum:', pageSlug);
      // GenericStaticPage-Komponente verwenden, aber URL als /impressum beibehalten
      to.matched[0].components.default = GenericStaticPage;
      to.params.pageKey = pageSlug.pageKey;
      console.log('Using GenericStaticPage with pageKey:', pageSlug.pageKey, 'but keeping URL as /impressum');
      return true;
    }
    console.log('Using default imprint page');
    return true;
  }),
  new Route(
    "/datenschutz",
    RouteStaticDataProtection,
    StaticPageDataProtection,
    null,
    null,
    null,
    null,
    async (to) => {
      const pageSlug = await getPageSlugBySlug('datenschutz');
      if (pageSlug && pageSlug.pageKey) {
        console.log('Found custom page slug for datenschutz:', pageSlug);
        // GenericStaticPage-Komponente verwenden, aber URL als /datenschutz beibehalten
        to.matched[0].components.default = GenericStaticPage;
        to.params.pageKey = pageSlug.pageKey;
        console.log('Using GenericStaticPage with pageKey:', pageSlug.pageKey, 'but keeping URL as /datenschutz');
        return true;
      }
      console.log('Using default data protection page');
      return true;
    }
  ),
  new Route("/haeufige-fragen", RouteStaticFaq, StaticPageFaq, null, null, null, null, async (to) => {
    const pageSlug = await getPageSlugBySlug('haeufige-fragen');
    if (pageSlug && pageSlug.pageKey) {
      console.log('Found custom page slug for faq:', pageSlug);
      // GenericStaticPage-Komponente verwenden, aber URL als /haeufige-fragen beibehalten
      to.matched[0].components.default = GenericStaticPage;
      to.params.pageKey = pageSlug.pageKey;
      console.log('Using GenericStaticPage with pageKey:', pageSlug.pageKey, 'but keeping URL as /haeufige-fragen');
      return true;
    }
    console.log('Using default faq page');
    return true;
  }),
  new Route(
    "/nutzervereinbarung",
    RouteStaticUserAgreement,
    StaticPageUserAgreement,
    null,
    null,
    null,
    null,
    async (to) => {
      const pageSlug = await getPageSlugBySlug('nutzervereinbarung');
      if (pageSlug && pageSlug.pageKey) {
        console.log('Found custom page slug for nutzervereinbarung:', pageSlug);
        // GenericStaticPage-Komponente verwenden, aber URL als /nutzervereinbarung beibehalten
        to.matched[0].components.default = GenericStaticPage;
        to.params.pageKey = pageSlug.pageKey;
        console.log('Using GenericStaticPage with pageKey:', pageSlug.pageKey, 'but keeping URL as /nutzervereinbarung');
        return true;
      }
      console.log('Using default user agreement page');
      return true;
    }
  ),
  new Route("/anleitung", RouteStaticManual, StaticPageManual, null, null, null, null, async (to) => {
    const pageSlug = await getPageSlugBySlug('anleitung');
    if (pageSlug && pageSlug.pageKey) {
      console.log('Found custom page slug for anleitung:', pageSlug);
      // GenericStaticPage-Komponente verwenden, aber URL als /anleitung beibehalten
      to.matched[0].components.default = GenericStaticPage;
      to.params.pageKey = pageSlug.pageKey;
      console.log('Using GenericStaticPage with pageKey:', pageSlug.pageKey, 'but keeping URL as /anleitung');
      return true;
    }
    console.log('Using default manual page');
    return true;
  }),
  new Route("/funktionen-planung", RouteStaticFunctions, StaticPageFunctions),
  // Dynamische statische Seiten aus der Datenbank
  new Route(
    "/static-page/:pageKey",
    RouteStaticGeneric,
    GenericStaticPage,
    null,
    null,
    true, // Prop-based route
    null,
    (to) => {
      // Debugging für static-page Route
      console.log('static-page route triggered with:', to.params.pageKey);

      // WICHTIG: Wenn wir eine bekannte statische Seite aufrufen, 
      // müssen wir sicherstellen, dass wir nicht zur 404-Seite weitergeleitet werden
      if (to.params.pageKey) {
        console.log(`Navigating to static page: ${to.params.pageKey}`);
      }

      return true;
    }
  ),

  // Explizite Route für die imprint Seite, um sicherzustellen, dass sie funktioniert
  new Route(
    "/static-page/imprint",
    "staticPageImprint",
    GenericStaticPage,
    null,
    null,
    true,
    null,
    (to) => {
      console.log('Static imprint page route triggered directly');
      // Statt einer Umleitung setzen wir hier einen festen Parameter
      to.params = { ...to.params, pageKey: 'imprint' };
      return true;
    }
  ),

  // Alternative direkte Pfade für statische Seiten (ohne /static-page/ Prefix)
  // Diese Route wird vor der Catch-All 404 Route platziert
  new Route(
    "/:directPageKey",
    "directStaticPage", // Eigener Name für diese Route
    GenericStaticPage,
    {
      isDirect: true
    },
    null,
    true, // Prop-based route
    null,
    async (to) => {
      // Diese Guard prüft, ob der Pfad eine direkte statische Seite ist
      // Wenn nicht, geben wir undefined zurück, damit die Route-Auflösung fortgesetzt wird
      const directPageKey = to.params?.directPageKey ?? "";

      // Liste der reservierten Pfade, die keine statischen Seiten sein dürfen
      const reservedPaths = [
        'admin', 'event', 'passwort-aendern', 'register', 'impressum',
        'datenschutz', 'haeufige-fragen', 'nutzervereinbarung', 'anleitung',
        'funktionen-planung', 'activate-user', 'static-page', '404'
      ];

      // Zusätzliche Überprüfung für Pfade, die mit "static-page/" beginnen
      if (directPageKey.startsWith('static-page/')) {
        console.log('Path starts with static-page/, skipping direct path handling');
        return true;
      }

      // Debug-Log für direkten Pfad-Zugriff
      console.log(`Direct path access attempted: /${directPageKey}`);

      try {
        // Zuerst prüfen, ob es einen entsprechenden PageSlug gibt, unabhängig von der direkten Pfade Einstellung
        const pageSlug = await getPageSlugBySlug(directPageKey);

        if (pageSlug && pageSlug.pageKey) {
          console.log(`Found custom page slug for ${directPageKey}:`, pageSlug);

          // Wenn ein PageSlug gefunden wurde, leiten wir zur generischen Seite mit dem pageKey weiter
          return {
            name: RouteStaticGeneric,
            params: { pageKey: pageSlug.pageKey },
            replace: true
          };
        }

        // Wenn kein PageSlug gefunden wurde, überprüfen wir die Einstellung für direkte Pfade
        const coreStore = useCore();
        console.log("Direct paths enabled:", coreStore.getUseDirectStaticPaths);

        // Wenn es keinen PageSlug gibt, aber der Pfad reserviert ist, die Route-Auflösung fortsetzen
        if (reservedPaths.includes(directPageKey)) {
          return true; // Route-Auflösung fortsetzen
        }

        // Wenn direkte Pfade aktiviert sind, Parameter direkt setzen statt umzuleiten
        if (coreStore.getUseDirectStaticPaths) {
          console.log(`No existing page slug found, treating ${directPageKey} as pageKey`);

          // Wir geben den Parameter als pageKeyOrSlug weiter und lassen die Komponente entscheiden
          to.params = {
            ...to.params,
            pageKeyOrSlug: directPageKey,
            isSlug: true // Hinweis für die Komponente, dass wir zuerst als Slug prüfen sollen
          };
          return true;
        } else {
          // Wenn direkte Pfade nicht aktiviert sind, zur normalen static-page Route umleiten
          console.log(`Direct paths not enabled, redirecting to /static-page/${directPageKey}`);
          return {
            path: `/static-page/${directPageKey}`
          };
        }
      } catch (error) {
        console.error("Error in direct path resolution:", error);
      }

      // Wenn keine Umleitung erfolgt, fortfahren
      return true;
    },
  ),

  // Module organizer routes.
  new Route("/admin", RouteOrganizerDashboard, OrganizerDashboard, {
    bootstrapIcon: "bi-calendar4-week",
    requireOrganizerRole: true,
  }),
  new Route("/admin/profile", RouteOrganizerProfile, OrganizerProfile, {
    bootstrapIcon: "bi-calendar4-week",
    requireOrganizerRole: true,
  }),
  new Route("/admin/event", RouteOrganizerEvents, OrganizerEvents, {
    bootstrapIcon: "bi-card-list",
    requireOrganizerRole: true,
  }),
  new Route(
    "/admin/video-conference",
    RouteOrganizerVideoConference,
    OrganizerVideoConference,
    {
      bootstrapIcon: "bi-camera-video",
      requireOrganizerRole: true,
    },
  ),
  new Route("/admin/event/new", RouteOrganizerEventsNew, EventNew, {
    requireOrganizerRole: true,
  }),
  new Route(
    "/admin/event/edit/:id",
    RouteOrganizerEventsEdit,
    EventEdit,
    {
      requireOrganizerRole: true,
    },
    null,
    true,
  ),
  new Route(
    "/admin/event/member-room/:id",
    RouteOrganizerMemberRoom,
    MemeberRoom,
    {
      bootstrapIcon: "bi-people",
      requireOrganizerRole: true,
    },
    null,
    true,
    null,
    async (to) => {
      const coreStore = useCore();

      // Wait for authentication to be initialized
      await coreStore.waitForAuth();

      console.log("Member room - User auth status after init:", {
        isActiveOrganizer: coreStore.isActiveOrganizerSession,
        userRole: coreStore.getActiveUserRole,
        userId: coreStore.user?.id,
        token: !!localStorage.getItem(AUTH_TOKEN)
      });
      return true; // Always proceed with the navigation
    }
  ),
  new Route(
    "/admin/event/member-room/:id/event-user/new",
    RouteOrganizerEventUserNew,
    NewEventUser,
    {
      requireOrganizerRole: true,
    },
    null,
    true,
  ),
  new Route(
    "/admin/event/member-room/:id/event-user/multiple-new",
    RouteOrganizerEventUserMultipleNew,
    NewMultipleEventUser,
    {
      requireOrganizerRole: true,
    },
    null,
    true,
  ),
  new Route(
    "/admin/event/member-room/:id/event-user/edit/:eventUserId",
    RouteOrganizerEventUserEdit,
    EditEventUser,
    {
      requireOrganizerRole: true,
    },
    null,
    true,
  ),
  new Route(
    "/admin/event/lobby-room/:id",
    RouteOrganizerLobbyRoom,
    LobbyRoom,
    {
      bootstrapIcon: "bi-person-plus",
      requireOrganizerRole: true,
    },
    null,
    true,
  ),
  new Route(
    "/admin/event/polls/:id",
    RouteOrganizerPolls,
    PollListing,
    {
      bootstrapIcon: "bi-collection",
      requireOrganizerRole: true,
    },
    null,
    true,
  ),
  new Route(
    "/admin/event/polls/:id/poll/new",
    RouteOrganizerPollsNew,
    NewPoll,
    {
      requireOrganizerRole: true,
    },
    null,
    true,
  ),
  new Route(
    "/admin/event/polls/:id/poll/edit/:pollId",
    RouteOrganizerPollsEdit,
    EditPoll,
    {
      requireOrganizerRole: true,
    },
    null,
    true,
  ),
  new Route(
    "/admin/event/polls/:id/poll/copy/:pollId",
    RouteOrganizerPollsCopy,
    CopyPoll,
    {
      requireOrganizerRole: true,
    },
    null,
    true,
  ),
  new Route(
    "/admin/event/poll-results/:id",
    RouteOrganizerPollResults,
    PollResultListing,
    {
      bootstrapIcon: "bi-card-checklist",
      requireOrganizerRole: true,
    },
    null,
    true,
  ),
  new Route(
    "/admin/video-conference/new",
    RouteOrganizerVideoConferenceNew,
    NewVideoConference,
    {
      requireOrganizerRole: true,
    },
  ),
  new Route(
    "/admin/video-conference/edit/:id",
    RouteOrganizerVideoConferenceEdit,
    EditVideoConference,
    {
      requireOrganizerRole: true,
    },
    null,
    true,
  ),
  new Route(
    "/admin/organizers",
    RouteOrganizerManagement,
    OrganizerManagement,
    {
      bootstrapIcon: "bi-people",
      requireOrganizerRole: true,
      requireSuperOrganizerRole: true,
    },
  ),
  new Route("/admin/all-event", RouteOrganizerAllEvents, OrganizerAllEvents, {
    bootstrapIcon: "bi-calendar2-range",
    requireOrganizerRole: true,
    requireSuperOrganizerRole: true,
  }),
  new Route("/admin/message-editor", RouteOrganizerMessageEditor, MessageEditor, {
    bootstrapIcon: "bi-translate",
    requireOrganizerRole: true,
    requireSuperOrganizerRole: true,
  }),
  new Route("/admin/static-content-editor", RouteOrganizerStaticContentEditor, StaticContentEditorView, {
    bootstrapIcon: "bi-file-earmark-text",
    requireOrganizerRole: true,
    requireSuperOrganizerRole: true,
  }),

  // Module event user.
  // @todo Use regex to allow "/:eventSlug" urls, which are not clashing with 404 and other first level urls.
  new Route(
    "/event/:eventSlug",
    RouteEventUserFrame,
    EventUserFrame,
    null,
    null,
    null,
    null,
    async (to) => {
      const slug = to.params?.eventSlug ?? "";
      try {
        const coreStore = useCore();

        // Redirect to organizer dashboard, if current user session is a organizer session.
        if (coreStore.isActiveOrganizerSession) {
          toast(t("router.redirect.activeOrganizerSession"), { type: "info" });
          return {
            name: RouteOrganizerDashboard,
          };
        }

        const event = await fetchEventBySlug(slug);
        coreStore.setEvent(event);
      } catch (error) {
        toast(t("router.redirect.invalidEventSlug", { slug }), {
          type: "error",
        });
        return {
          name: RouteMainLogin,
        };
      }
    },
  ),

  new Route(
    "/activate-user/:eventId/:token",
    RouteActivateAuthToken,
    ActivateAuthToken,
  ),

  // Catch-All Route für 404 (muss immer ganz am Ende stehen)
  new Route("/:pathMatch(.*)*", RouteNotFound, NotFound, null, null, false, null, (to) => {
    // Logging für die Catch-All Route
    console.log('404 Catch-All route triggered for:', to.fullPath);

    // Spezielle Prüfung für static-page Routen
    if (to.fullPath.startsWith('/static-page/')) {
      const pageKey = to.fullPath.replace('/static-page/', '');
      console.log(`Detected static page path in 404 handler: ${pageKey}`);

      // Direktes Setzen des Parameters für die statische Seite
      if (pageKey) {
        // Statt einer Umleitung, aktivieren wir direkt die Route mit dem entsprechenden Parameter
        to.params = { ...to.params, pageKey };

        // Eine statische Seite wird aufgerufen
        const coreStore = useCore();
        console.log(`StaticContent existence will be checked for: ${pageKey}`);

        // Zur GenericStaticPage-Komponente navigieren
        return {
          path: `/static-page/${pageKey}`,
          replace: true
        };
      }
    }

    // Normale 404-Weiterleitung
    return true;
  }),
];

export const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior() {
    // We want to start at the top, if we switch the view.
    return { top: 0 };
  },
});

// eslint-disable-next-line no-unused-vars
router.beforeEach(async (to, from) => {
  const coreStore = useCore();

  // Wait for authentication to be initialized before proceeding
  await coreStore.waitForAuth();

  // Redirect logged in organizer to dashboard, if they visit a route with "meta.redirectOrganizer".
  if (to.meta.redirectOrganizer && coreStore.isActiveOrganizerSession) {
    toast(t("router.redirect.activeOrganizerSession"), { type: "info" });
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
  if (
    to.meta.requireOrganizerRole &&
    coreStore.getActiveUserRole !== USER_ROLE_ORGANIZER
  ) {
    return {
      name: RouteMainLogin,
    };
  }
});