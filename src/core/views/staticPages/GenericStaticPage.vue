<template>
  <CorePageLayout :meta-title="pageTitle">
    <div class="static-page">
      <h1 v-if="pageTitle">{{ pageTitle }}</h1>
      
      <!-- DB-basierter Inhalt -->
      <div v-if="contentSections.length > 0">
        <div v-for="section in contentSections" :key="section.sectionKey" class="mb-4">
          <h2 v-if="section.title">{{ section.title }}</h2>
          <div v-html="section.content"></div>
        </div>
      </div>
      
      <!-- Lade-Indikator -->
      <div v-if="loading" class="text-center py-4">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Wird geladen...</span>
        </div>
        <p class="mt-2">Inhalte werden geladen...</p>
      </div>
      
      <!-- Fallback für leere Inhalte -->
      <div v-if="!loading && contentSections.length === 0" class="alert alert-info">
        <strong>Noch keine Inhalte vorhanden.</strong>
        <p>Für diese Seite wurden noch keine Inhalte angelegt.</p>
      </div>
    </div>
  </CorePageLayout>
</template>

<script setup>
import CorePageLayout from "@/core/components/CorePageLayout.vue";
import { ref, onMounted, defineProps, computed, watch } from 'vue';
import { useApolloClient } from '@vue/apollo-composable';
import gql from 'graphql-tag';

const props = defineProps({
  pageKey: {
    type: String,
    required: true
  },
  title: {
    type: String,
    default: ''
  }
});

// Wenn pageKey über Route-Parameter empfangen wird
import { useRoute } from 'vue-router';
const route = useRoute();
const effectivePageKey = computed(() => {
  // Prüfen, welcher Parameter verwendet wird (für beide Route-Typen)
  const pageKey = route.params.pageKey || route.params.directPageKey || props.pageKey;
  console.log('Loading static page with key:', pageKey, 'Route full path:', route.fullPath);
  
  // Für den Fall, dass wir keinen Parameter haben, versuchen wir ihn aus dem Pfad zu extrahieren
  if (!pageKey && route.fullPath.startsWith('/static-page/')) {
    const extractedKey = route.fullPath.replace('/static-page/', '');
    console.log('Extracted key from path:', extractedKey);
    return extractedKey;
  }
  
  return pageKey;
});

const contentSections = ref([]);
const loading = ref(false);
const pageTitle = computed(() => props.title || contentSections.value[0]?.title || '');

// GraphQL-Client
const { resolveClient } = useApolloClient();

// Inhalte aus der Datenbank laden
onMounted(async () => {
  console.log('GenericStaticPage mounted with params:', route.params);
  await fetchContentFromDb();
});

// Wenn sich die Route ändert, Inhalte neu laden
watch(() => route.params, async (newParams, oldParams) => {
  console.log('Route params changed:', {
    from: oldParams,
    to: newParams
  });
  
  if (newParams.pageKey !== oldParams.pageKey || 
      newParams.directPageKey !== oldParams.directPageKey) {
    await fetchContentFromDb();
  }
}, { deep: true });

const fetchContentFromDb = async () => {
  loading.value = true;
  
  try {
    // Detailliertes Logging zur Fehlerdiagnose
    console.log('Fetching content for static page:', {
      pageKey: effectivePageKey.value,
      route: route.fullPath,
      params: route.params
    });
    
    const client = resolveClient();
    
    // Wenn wir eine der Standard statischen Seiten wie "imprint" aufrufen,
    // ist es möglich, dass wir tatsächlich eine eigene Vue-Komponente haben
    // In diesem Fall müssten wir weniger auf DB-Content setzen
    const isPredefinedStaticPage = [
      'imprint', 'dataProtection', 'faq', 'userAgreement', 'manual', 'functions'
    ].includes(effectivePageKey.value);
    
    if (isPredefinedStaticPage) {
      console.log(`Note: ${effectivePageKey.value} is a predefined static page with its own component`);
    }
    
    const result = await client.query({
      query: gql`
        query GetStaticContent($pageKey: String!) {
          staticContentsByPage(pageKey: $pageKey) {
            id
            sectionKey
            title
            content
            ordering
            isPublished
          }
        }
      `,
      variables: {
        pageKey: effectivePageKey.value
      },
      fetchPolicy: 'network-only' // Immer frisch vom Server laden
    });
    
    console.log(`Content for ${effectivePageKey.value} loaded:`, result.data);
    
    // Nur veröffentlichte Inhalte anzeigen und nach Reihenfolge sortieren
    const publishedSections = (result.data.staticContentsByPage || [])
      .filter(section => section.isPublished)
      .sort((a, b) => a.ordering - b.ordering);
      
    contentSections.value = publishedSections;
    
    if (publishedSections.length === 0) {
      console.warn(`No published content found for page: ${effectivePageKey.value}`);
    }
  } catch (err) {
    console.error(`Failed to load content for page "${effectivePageKey.value}" from database:`, err);
    if (err.graphQLErrors) {
      console.error('GraphQL errors:', err.graphQLErrors);
    }
    if (err.networkError) {
      console.error('Network error:', err.networkError);
    }
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.static-page {
  margin-bottom: 2rem;
}
</style>