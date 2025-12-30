<template>
  <PageLayout :meta-title="$t('navigation.views.staticContentEditor')">
    <template #title>
      {{ $t('navigation.views.staticContentEditor') }}
    </template>
    <template #header>
      <PageNavigation :routes="routes" />
    </template>
    <template #content>
      <div class="row">
        <div class="col-12">
          <p class="text-muted">{{ $t('view.staticContentEditor.description', 'Verwalten Sie statische Inhalte für Ihre Webseite.') }}</p>
          <div class="alert alert-info">
            <i class="bi bi-info-circle me-2"></i>
            {{ $t('view.staticContentEditor.infoText', 'Hier können Sie Seiten und Abschnitte für statische Inhalte erstellen und bearbeiten.') }}
          </div>
        </div>
      </div>
      
      <div class="row mt-3">
        <div class="col-12">
          <StaticContentManager />
        </div>
      </div>
    </template>
  </PageLayout>
</template>

<script setup>
import PageLayout from "@/modules/organizer/components/PageLayout.vue";
import PageNavigation from "@/modules/organizer/components/PageNavigation.vue";
import StaticContentManager from "@/modules/organizer/components/StaticContentManager.vue";
import {
  getRoutesByName,
  RouteOrganizerAllEvents,
  RouteOrganizerDashboard,
  RouteOrganizerEvents,
  RouteOrganizerManagement,
  RouteOrganizerMessageEditor,
  RouteOrganizerVideoConference,
  RouteOrganizerStaticContentEditor,
  RouteOrganizerGlobalSettings
} from "@/router/routes";

// Define navigation items
const routes = getRoutesByName([
  RouteOrganizerDashboard,
  RouteOrganizerEvents,
  RouteOrganizerVideoConference,
  RouteOrganizerManagement,
  RouteOrganizerAllEvents,
  RouteOrganizerMessageEditor,
  RouteOrganizerStaticContentEditor,
  RouteOrganizerGlobalSettings
]);
</script>

<style scoped>
/* Keine spezifischen Styles benötigt */
</style>