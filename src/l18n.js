import { createI18n } from "vue-i18n";
import defaultMessages from "@/messages.json";
import { deepMerge } from "@/core/util/deep-merge";
import gql from "graphql-tag";
// Wichtig: apolloClient wird später importiert, um Zirkelabhängigkeiten zu vermeiden

// GraphQL query to get all translations
const TRANSLATIONS_QUERY = gql`
  query GetTranslations {
    translations
  }
`;

// Initial creation with default messages
let l18n = createI18n({
  locale: "de",
  fallbackLocale: "de",
  messages: defaultMessages,
  legacy: false,
  globalInjection: true,
});

// Function to reload translations from API
export async function reloadTranslations() {

  try {
    // Dynamisches Importieren des apolloClient, um Zirkelabhängigkeiten zu vermeiden
    const { apolloClient } = await import("@/apollo-client");

    // Lade vollständige Übersetzungen (Standard + Angepasste)
    // Die translations-Query gibt die gemergten Übersetzungen zurück
    const response = await apolloClient.query({
      query: TRANSLATIONS_QUERY,
      fetchPolicy: 'network-only' // Force network request, no cache
    });

    if (response.data && response.data.translations) {
      try {
        // Parse die Antwort
        const allTranslations = JSON.parse(response.data.translations);
        // Überprüfe grundlegende Struktur
        if (!allTranslations.de) {
          console.warn("[l18n] Loaded translations missing 'de' locale");
        }

        // Update global messages mit den vollständigen Übersetzungen
        l18n.global.setLocaleMessage("de", allTranslations.de || {});

        if (allTranslations.en) {
          l18n.global.setLocaleMessage("en", allTranslations.en);
        }
        return true;
      } catch (parseError) {
        console.error("[l18n] Failed to parse translations:", parseError);
        console.error("[l18n] Raw response:", response.data.translations);
      }
    } else {
      console.warn("[l18n] No translations data in API response");
    }
  } catch (apiError) {
    console.warn("[l18n] Could not load translations from API:", apiError);

    if (apiError.networkError) {
      console.warn("[l18n] Network error details:", apiError.networkError);
    }

    if (apiError.graphQLErrors && apiError.graphQLErrors.length > 0) {
      console.warn("[l18n] GraphQL errors:", JSON.stringify(apiError.graphQLErrors));
    }

    // Bei API-Fehler verwenden wir die Default-Übersetzungen
    console.warn("[l18n] Using default translations only");
  }

  // Wenn wir hier ankommen, konnte die API nicht geladen werden oder es gab einen Fehler
  // In diesem Fall behalten wir einfach die Default-Übersetzungen bei
  return false;
}

// Load translations at startup
// This is asynchronous and won't block app initialization
reloadTranslations().catch(error => {
  console.error("Error initializing translations:", error);
});

export default l18n;
