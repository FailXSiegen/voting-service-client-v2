import { useRouter } from "vue-router";

export const RouteMainLogin = "mainLogin";
export const RouteNotFound = "404";
export const RouteRequestChangeOrganizerPassword =
  "requestChangeOrganizerPassword";
export const RouteChangeOrganizerPassword = "changeOrganizerPassword";
export const RouteRegisterOrganizer = "registerOrganizer";
export const RouteVerifyRegisteredOrganizer = "verifyRegisteredOrganizer";

// Static pages.
export const RouteStaticDataProtection = "dataProtection";
export const RouteStaticFaq = "faq";
export const RouteStaticFunctions = "functions";
export const RouteStaticImprint = "imprint";
export const RouteStaticManual = "manual";
export const RouteStaticUserAgreement = "userAgreement";
export const RouteStaticGeneric = "staticPage";

// Module organizer routes.
export const RouteOrganizerDashboard = "organizerDashboard";
export const RouteOrganizerProfile = "organizerProfile";
export const RouteOrganizerEvents = "organizerEvents";
export const RouteOrganizerManagement = "organizerManagement";
export const RouteOrganizerAllEvents = "organizerAllEvents";
export const RouteOrganizerMessageEditor = "organizerMessageEditor";
export const RouteOrganizerStaticContentEditor = "organizerStaticContentEditor";
export const RouteOrganizerVideoConference = "organizerVideoConference";
export const RouteOrganizerVideoConferenceNew = "organizerVideoConferenceNew";
export const RouteOrganizerVideoConferenceEdit = "organizerVideoConferenceEdit";
export const RouteOrganizerEventsNew = "organizerEventsNew";
export const RouteOrganizerEventsEdit = "organizerEventsEdit";
export const RouteOrganizerMemberRoom = "organizerMemberRoom";
export const RouteOrganizerLobbyRoom = "organizerLobbyRoom";
export const RouteOrganizerPolls = "organizerPolls";
export const RouteOrganizerPollsNew = "organizerPollsNew";
export const RouteOrganizerPollsEdit = "organizerPollsEdit";
export const RouteOrganizerPollsCopy = "organizerPollsCopy";
export const RouteOrganizerPollResults = "organizerPollResults";
export const RouteOrganizerEventUserNew = "organizerEventUserNew";
export const RouteOrganizerEventUserEdit = "organizerEventUserEdit";
export const RouteOrganizerEventUserMultipleNew =
  "organizerEventUserMultipleNew";
export const RouteEventUserFrame = "eventUserFrame";
export const RouteActivateAuthToken = "eventUserActivateAuthToken";

/**
 * @param {String[]} routeNames Use constants in router.js
 * @returns {Route[]}
 */
export function getRoutesByName(routeNames) {
  const router = useRouter();
  const result = [];
  routeNames.forEach((targetName) => {
    const route = router.getRoutes().find((route) => route.name === targetName);
    if (route) {
      result.push(route);
    }
  });
  return result;
}

/**
 * @param {String} routeName Use constants in router.js
 * @returns {Route}
 */
export function getRouteByName(routeName) {
  const router = useRouter();
  return router.getRoutes().find((route) => route.name === routeName);
}
