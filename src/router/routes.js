import {useRouter} from "vue-router";

export const RouteMainLogin = 'mainLogin';
export const RouteOrganizerDashboard = 'organizerDashboard';
export const NotFound = '404';

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
