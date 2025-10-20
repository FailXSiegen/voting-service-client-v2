<template>
  <PageLayout :meta-title="$t('navigation.views.organizerGlobalSettings')">
    <template #title>
      {{ $t("navigation.views.organizerGlobalSettings") }}
    </template>
    <template #header>
      <PageNavigation :routes="routes" />
    </template>
    <template #content>
      <!-- System Settings -->
      <SystemSettingsManager />
    </template>
  </PageLayout>
</template>

<script setup>
import PageLayout from "@/modules/organizer/components/PageLayout.vue";
import PageNavigation from "@/modules/organizer/components/PageNavigation.vue";
import SystemSettingsManager from "@/modules/organizer/components/SystemSettingsManager.vue";
import {
  getRoutesByName,
  RouteOrganizerAllEvents,
  RouteOrganizerDashboard,
  RouteOrganizerEvents,
  RouteOrganizerManagement,
  RouteOrganizerMessageEditor,
  RouteOrganizerStaticContentEditor,
  RouteOrganizerGlobalSettings,
  RouteOrganizerVideoConference,
} from "@/router/routes";

// Define navigation items for superadmins
const routes = getRoutesByName([
  RouteOrganizerDashboard,
  RouteOrganizerEvents,
  RouteOrganizerVideoConference,
  RouteOrganizerManagement,
  RouteOrganizerAllEvents,
  RouteOrganizerMessageEditor,
  RouteOrganizerStaticContentEditor,
  RouteOrganizerGlobalSettings,
]);
</script>