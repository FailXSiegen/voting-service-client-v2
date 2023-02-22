import {useRouter} from "vue-router";

export const RouteMainLogin = 'mainLogin';
export const RouteOrganizerDashboard = 'organizerDashboard';
export const RouteNotFound = '404';
export const RouteRequestChangeOrganizerPassword = 'requestChangeOrganizerPassword';
export const RouteChangeOrganizerPassword = 'changeOrganizerPassword';
export const RouteRegisterOrganizer = 'registerOrganizer';
export const RouteVerifyRegisteredOrganizer = 'verifyRegisteredOrganizer';

// Static pages.
export const RouteStaticDataProtection = 'dataProtection';
export const RouteStaticFaq = 'faq';
export const RouteStaticFunctions = 'functions';
export const RouteStaticImprint = 'imprint';
export const RouteStaticManual = 'manual';
export const RouteStaticUserAgreement = 'userAgreement';

/**
 * @param {String[]} routeNames Use constants in router.js
 * @returns {Route[]}
 */
export function getRoutesByName(routeNames) {
    const router = useRouter();
    const result = [];
    routeNames.forEach((targetName) => {
        const route = router.getRoutes().find(route => route.name === targetName);
        if (route) {
            result.push(route);
        }
    });
    return result;
}
