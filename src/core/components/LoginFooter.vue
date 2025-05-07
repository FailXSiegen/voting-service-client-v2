<template>
  <footer class="fixed-bottom page-footer font-small border-top bg-white pb-2">
    <nav class="d-flex justify-content-center text-center">
      <ul class="nav navbar-nav flex-row">
        <li class="nav-item m-1">
          <router-link :to="{ name: RouteMainLogin }" class="nav-link p-1">
            {{ $t("navigation.views.startPage") }}
          </router-link>
        </li>
        <!-- Statische Navigation -->
        <template v-if="!useDbNavigation">
          <li
            v-for="routeName in staticNavigationItems"
            :key="routeName"
            class="nav-item m-1"
          >
            <router-link :to="{ name: routeName }" class="nav-link p-1">
              {{ $t("navigation.views.staticPages." + routeName) }}
            </router-link>
          </li>
        </template>
        
        <!-- Dynamische DB-basierte Navigation -->
        <template v-else>
          <li
            v-for="page in dynamicPages"
            :key="page.pageKey"
            class="nav-item m-1"
          >
            <router-link 
              :to="getStaticPageRoute(page.pageKey)" 
              class="nav-link p-1"
            >
              {{ page.title || page.pageKey }}
            </router-link>
          </li>
        </template>
      </ul>
    </nav>
    
    <!-- Lade-Indikator für dynamische Seiten -->
    <div v-if="loading" class="d-flex justify-content-center pb-2">
      <div class="spinner-border spinner-border-sm text-primary" role="status">
        <span class="visually-hidden">Wird geladen...</span>
      </div>
    </div>
  </footer>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue';
import { useApolloClient } from '@vue/apollo-composable';
import gql from 'graphql-tag';
import {
  RouteMainLogin,
  RouteStaticDataProtection,
  RouteStaticFaq,
  RouteStaticFunctions,
  RouteStaticImprint,
  RouteStaticManual,
  RouteStaticUserAgreement,
  RouteStaticGeneric,
} from "@/router/routes";
import { useCore } from "@/core/store/core";

// Core-Store
const coreStore = useCore();

// Konfiguration aus dem Store abrufen
const useDbNavigation = computed(() => coreStore.getUseDbFooterNavigation);
const useDirectPaths = computed(() => coreStore.getUseDirectStaticPaths);

// Statische Navigationspunkte
const staticNavigationItems = [
  RouteStaticImprint,
  RouteStaticUserAgreement,
  RouteStaticDataProtection,
  RouteStaticFunctions,
  RouteStaticFaq,
  RouteStaticManual,
];

// Dynamische DB-basierte Seiten
const dynamicPages = ref([]);
const loading = ref(false);

// Hilfs-Methode, um die richtige Route basierend auf der Pfad-Konfiguration zu erstellen
const getStaticPageRoute = (pageKey) => {
  if (useDirectPaths.value) {
    return { path: `/${pageKey}` };
  } else {
    return { 
      name: RouteStaticGeneric, 
      params: { pageKey } 
    };
  }
};

// GraphQL-Client
const { resolveClient } = useApolloClient();

// Seiten aus der Datenbank laden
onMounted(async () => {
  if (useDbNavigation.value) {
    await fetchDynamicPages();
  }
});

// Watch für Änderungen an den Konfigurationseinstellungen
watch(useDbNavigation, async (newValue) => {
  if (newValue) {
    await fetchDynamicPages();
  }
});

// Seiten aus der Datenbank laden
const fetchDynamicPages = async () => {
  if (!useDbNavigation.value) return;
  
  loading.value = true;
  
  try {
    const client = resolveClient();
    const result = await client.query({
      query: gql`
        query GetAllStaticPages {
          staticContents {
            id
            pageKey
            sectionKey
            title
            isPublished
            ordering
          }
        }
      `,
      fetchPolicy: 'network-only'
    });
    
    // Gruppieren nach pageKey und nur die Hauptinformationen behalten
    const pages = {};
    result.data.staticContents.forEach(content => {
      if (content.isPublished) {
        if (!pages[content.pageKey]) {
          pages[content.pageKey] = {
            pageKey: content.pageKey,
            title: content.title || content.pageKey,
            sectionKey: content.sectionKey,
            ordering: content.ordering
          };
        }
      }
    });
    
    // In Array umwandeln und sortieren
    dynamicPages.value = Object.values(pages).sort((a, b) => a.ordering - b.ordering);
  } catch (err) {
    console.error('Failed to load dynamic pages:', err);
  } finally {
    loading.value = false;
  }
};
</script>

<style lang="scss" scoped>
.router-link-exact-active {
  background-color: inherit;
}

@media (max-width: 576px) {
  footer {
    position: relative !important;
  }
}
</style>
