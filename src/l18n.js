import { createI18n } from "vue-i18n";
import defaultMessages from "@/messages.js";
import gql from "graphql-tag";
import { ref } from "vue";

// GraphQL query to get all translations
const TRANSLATIONS_QUERY = gql`
  query GetTranslations {
    translations
  }
`;

// Singleton-Instanz für i18n
let i18nInstance = null;

// Status für Übersetzungsladung
export const translationsLoaded = ref(false);

// Factory-Funktion um die i18n-Instanz zu erhalten
export function getI18n() {
  if (!i18nInstance) {
    // Klonen der defaultMessages, um später zusammenführen zu können
    const clonedMessages = JSON.parse(JSON.stringify(defaultMessages));

    i18nInstance = createI18n({
      locale: "de",
      fallbackLocale: "de",
      messages: clonedMessages,
      legacy: false,  // Legacy-Modus für Vue 2 API-Kompatibilität
      globalInjection: true, // Wichtig für $t im Template
      missingWarn: false,    // Keine Warnungen für fehlende Übersetzungen
      fallbackWarn: false    // Keine Warnungen für Fallback-Übersetzungen
    });
  }
  return i18nInstance;
}

// Erzeuge i18n-Instanz sofort
const l18n = getI18n();

// Loading-Zustandsverfolgung
let isLoadingTranslations = false;
let loadingPromise = null;

// Sichere Merge-Funktion
function safeMerge(target, source) {
  // Falls source oder target kein Objekt, return target oder source
  if (!source || typeof source !== 'object') return target;
  if (!target || typeof target !== 'object') return source;

  // Klone target, um Originalobjekte nicht zu verändern
  const result = { ...target };

  // Merge alle Properties von source nach result
  Object.keys(source).forEach(key => {
    if (source[key] && typeof source[key] === 'object' &&
      result[key] && typeof result[key] === 'object') {
      // Rekursiver Merge für verschachtelte Objekte
      result[key] = safeMerge(result[key], source[key]);
    } else {
      // Primitive Werte oder wenn eines der Objekte nicht existiert
      result[key] = source[key];
    }
  });

  return result;
}

// Function to reload translations from API
export async function reloadTranslations() {
  // Verhindern von parallelen Ladevorgängen
  if (isLoadingTranslations) {
    return loadingPromise;
  }

  isLoadingTranslations = true;

  loadingPromise = (async () => {
    try {
      // Dynamisches Importieren des apolloClient
      const { apolloClient } = await import("@/apollo-client");

      // Lade Übersetzungen
      const response = await apolloClient.query({
        query: TRANSLATIONS_QUERY,
        fetchPolicy: 'network-only'
      });

      if (response.data && response.data.translations) {
        try {
          // Parse die Antwort
          const serverTranslations = JSON.parse(response.data.translations);

          // Direkte Kopie der Standard-Nachrichten als Basis
          const baseDE = JSON.parse(JSON.stringify(defaultMessages.de || {}));
          const baseEN = JSON.parse(JSON.stringify(defaultMessages.en || {}));

          // Zusammenführen mit Server-Übersetzungen
          const mergedDE = serverTranslations.de ?
            safeMerge(baseDE, serverTranslations.de) : baseDE;

          const mergedEN = serverTranslations.en ?
            safeMerge(baseEN, serverTranslations.en) : baseEN;

          // Aktualisiere die Nachrichten
          l18n.global.setLocaleMessage('de', mergedDE);
          l18n.global.setLocaleMessage('en', mergedEN);

          // Markiere als geladen
          translationsLoaded.value = true;
          return true;
        } catch (parseError) {
          console.error("[i18n] Failed to parse or merge translations:", parseError.message);
        }
      }
    } catch (apiError) {
      console.warn("[i18n] Could not load translations from API");
    }

    // Bei Fehlern: Sicherstellen, dass die Standardübersetzungen funktionieren
    try {
      const defaultDE = JSON.parse(JSON.stringify(defaultMessages.de || {}));
      const defaultEN = JSON.parse(JSON.stringify(defaultMessages.en || {}));

      l18n.global.setLocaleMessage('de', defaultDE);
      l18n.global.setLocaleMessage('en', defaultEN);
    } catch (resetError) {
      console.error('[i18n] Error setting default translations:', resetError.message);
    }

    // Markiere als geladen, auch wenn es Fehler gab
    translationsLoaded.value = true;
    return false;
  })();

  try {
    const result = await loadingPromise;
    return result;
  } finally {
    isLoadingTranslations = false;
    loadingPromise = null;
  }
}

// Prüfhilfsfunktion für Übersetzungen (für Debugging)
export function checkTranslation(key) {
  if (!l18n.global) {
    return { exists: false, value: null };
  }

  const exists = l18n.global.te(key);
  const value = exists ? l18n.global.t(key) : null;
  return { exists, value };
}

// Lade Übersetzungen erst NACH der Initialisierung von l18n
reloadTranslations().catch(error => {
  console.error("[i18n] Error initializing translations:", error.message);
  translationsLoaded.value = true;
});

export default l18n;