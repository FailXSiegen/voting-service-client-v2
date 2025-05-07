<template>
  <CorePageLayout meta-title="Häufige Fragen">
    <div class="faq">
      <h1>Häufige Fragen</h1>
      
      <!-- DB-basierter Modus -->
      <div v-if="useDbContent">
        <div v-for="section in contentSections" :key="section.sectionKey" class="mb-4">
          <h2 v-if="section.title">{{ section.title }}</h2>
          <div v-html="section.content"></div>
        </div>
        
        <!-- Fallback für leere Datenbank -->
        <div v-if="contentSections.length === 0 && !loading">
          <!-- Komponenten-Modus als Fallback -->
          <div v-for="name in componentNames" :key="name">
            <component
              :is="name"
              @loaded="handleContentLoaded(name, $event)"
            ></component>
            <div class="mb-4" v-html="htmlContents[name]"></div>
          </div>
        </div>
      </div>
      
      <!-- Legacy Komponenten-Modus -->
      <div v-else>
        <div v-for="name in componentNames" :key="name">
          <component
            :is="name"
            @loaded="handleContentLoaded(name, $event)"
          ></component>
          <div class="mb-4" v-html="htmlContents[name]"></div>
        </div>
      </div>
      
      <div v-if="loading" class="text-center py-4">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Wird geladen...</span>
        </div>
        <p class="mt-2">Inhalte werden geladen...</p>
      </div>
    </div>
  </CorePageLayout>
</template>

<script setup>
import CorePageLayout from "@/core/components/CorePageLayout.vue";
import { ref, onMounted } from 'vue';
import { useApolloClient } from '@vue/apollo-composable';
import gql from 'graphql-tag';

// Konfiguration für DB-basierten Inhalt
const useDbContent = ref(true);
const contentSections = ref([]);
const loading = ref(false);

// GraphQL-Client
const { resolveClient } = useApolloClient();

// Inhalte aus der Datenbank laden
onMounted(async () => {
  if (useDbContent.value) {
    await fetchContentFromDb();
  }
});

const fetchContentFromDb = async () => {
  loading.value = true;
  
  try {
    const client = resolveClient();
    const result = await client.query({
      query: gql`
        query GetFaqContent {
          staticContentsByPage(pageKey: "faq") {
            id
            sectionKey
            title
            content
            ordering
          }
        }
      `,
      fetchPolicy: 'cache-first'
    });
    
    // Sortieren nach Reihenfolge
    contentSections.value = result.data.staticContentsByPage || [];
    contentSections.value.sort((a, b) => a.ordering - b.ordering);
    
    // Wenn keine Inhalte vorhanden sind, auf Komponenten-Modus zurückfallen
    if (contentSections.value.length === 0) {
      console.log('No content found in database, falling back to component mode');
    }
  } catch (err) {
    console.error('Failed to load FAQ content from database:', err);
    // Bei Fehler auf Komponenten-Modus zurückfallen
    useDbContent.value = false;
  } finally {
    loading.value = false;
  }
};
</script>

<script>
import { defineAsyncComponent } from "vue";

const componentNames = [
  "GeneralInfo",
  "Security",
  "Registration",
  "Execution",
  "Requirements",
  "Results",
  "Support",
  "Legal",
  "Feedback",
  "Special",
];

export default {
  components: componentNames.reduce((components, name) => {
    components[name] = defineAsyncComponent(
      () => import(`@/core/views/staticPages/Faq/${name}.vue`),
    );
    return components;
  }, {}),

  data() {
    return {
      htmlContents: componentNames.reduce((contents, name) => {
        contents[name] = "";
        return contents;
      }, {}),
    };
  },

  methods: {
    handleContentLoaded(name, htmlContent) {
      this.htmlContents[name] = htmlContent;
    },
  },
};
</script>

<style>
.card-header:hover {
  background-color: rgba(0, 0, 0, 0.06);
}

.card-header .btn:focus {
  box-shadow: none !important;
}
</style>