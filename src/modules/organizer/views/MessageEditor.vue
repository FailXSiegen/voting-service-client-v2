<template>
  <PageLayout :meta-title="$t('navigation.views.organizerMessageEditor')">
    <template #title>
      {{ $t('navigation.views.organizerMessageEditor') }}
    </template>
    <template #header>
      <PageNavigation :routes="routes" />
    </template>
    <template #content>
      <div class="row">
        <div class="col-12">
          <p class="text-muted">{{ $t('view.messageEditor.description') }}</p>

          <div class="alert alert-info">
            <i class="bi bi-info-circle me-2"></i>
            {{ $t('view.messageEditor.infoText') }}
          </div>

          <!-- Development export button - only visible in development -->
          <div v-if="isDevelopment" class="mb-3 text-end">
            <button @click="exportTranslations" class="btn btn-sm btn-outline-secondary">
              <i class="bi bi-download me-1"></i>
              Export messages.local.json
            </button>
          </div>
        </div>
      </div>

      <div v-if="loading" class="row">
        <div class="col-12 text-center my-5">
          <div class="spinner-border" role="status">
            <span class="visually-hidden">{{ $t('general.loading') }}</span>
          </div>
        </div>
      </div>

      <div v-else class="row mt-3">
        <div class="col-12">
          <div class="card">
            <div class="card-header bg-light d-flex justify-content-between align-items-center">
              <div>
                <input
                  v-model="searchQuery"
                  class="form-control"
                  type="text"
                  :placeholder="$t('view.messageEditor.search')"
                />
              </div>
              <div class="ms-2">
                <button
                  class="btn btn-primary"
                  @click="saveChanges"
                  :disabled="!hasChanges || saving"
                >
                  <i class="bi bi-save me-1"></i>
                  {{ $t('view.messageEditor.saveChanges') }}
                </button>
              </div>
            </div>
            <div class="card-body">
              <ul class="nav nav-tabs mb-4">
                <li class="nav-item">
                  <button class="nav-link" :class="{ active: activeTab === 'editor' }" @click="activeTab = 'editor'">
                    Editor
                  </button>
                </li>
                <li class="nav-item">
                  <button class="nav-link" :class="{ active: activeTab === 'structure' }" @click="activeTab = 'structure'">
                    JSON Struktur
                  </button>
                </li>
              </ul>

              <!-- Editor Tab -->
              <div v-if="activeTab === 'editor'">
                <div class="row mb-4">
                  <div class="col-md-6">
                    <div class="form-check form-switch">
                      <input class="form-check-input" type="checkbox" v-model="showOnlyModified" id="showModifiedOnly">
                      <label class="form-check-label" for="showModifiedOnly">
                        {{ $t('view.messageEditor.showOnlyModified') }}
                      </label>
                    </div>
                  </div>
                  <div class="col-md-6">
                    <div class="d-flex">
                      <div class="me-2">
                        <select class="form-select form-select-sm" v-model="currentLocale">
                          <option value="de">Deutsch</option>
                          <option value="en">Englisch</option>
                        </select>
                      </div>
                      <div class="flex-grow-1">
                        <div class="input-group">
                          <span class="input-group-text"><i class="bi bi-search"></i></span>
                          <input
                            type="text"
                            class="form-control"
                            v-model="searchQuery"
                            placeholder="Suchen..."
                          >
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div class="table-responsive">
                  <table class="table table-hover">
                    <thead>
                      <tr>
                        <th style="width: 25%">{{ $t('view.messageEditor.table.path') }}</th>
                        <th style="width: 30%">{{ $t('view.messageEditor.table.defaultValue') }}</th>
                        <th style="width: 30%">{{ $t('view.messageEditor.table.customValue') }}</th>
                        <th style="width: 15%">{{ $t('view.messageEditor.table.actions') }}</th>
                      </tr>
                    </thead>
                    <tbody>
                      <template v-for="(item, index) in filteredMessages" :key="index">
                        <tr :class="{ 'table-info': item.modified }">
                          <td class="text-break">
                            <div class="d-flex align-items-center">
                              <span
                                v-if="item.modified"
                                class="badge bg-primary me-2"
                                title="Bearbeitet"
                              >
                                <i class="bi bi-pencil-fill"></i>
                              </span>
                              {{ item.path }}
                            </div>
                          </td>
                          <td class="text-break">
                            <div class="default-value">{{ item.defaultValue }}</div>
                          </td>
                          <td>
                            <textarea
                              class="form-control"
                              v-model="item.customValue"
                              rows="2"
                              :placeholder="'Übersetzung bearbeiten...'"
                            ></textarea>
                          </td>
                          <td>
                            <button
                              class="btn btn-sm btn-outline-secondary mb-2"
                              @click="resetMessage(item)"
                              :disabled="!item.customValue || item.resetting"
                              title="Auf Standardwert zurücksetzen"
                            >
                              <span v-if="item.resetting" class="spinner-border spinner-border-sm me-1" role="status"></span>
                              <i v-else class="bi bi-arrow-counterclockwise me-1"></i>
                              {{ $t('view.messageEditor.reset') }}
                            </button>
                          </td>
                        </tr>
                      </template>
                    </tbody>
                  </table>
                </div>

                <div v-if="filteredMessages.length === 0" class="alert alert-info text-center mt-3">
                  <i class="bi bi-info-circle me-2"></i>
                  Keine Einträge gefunden. Bitte passen Sie Ihre Suchkriterien an.
                </div>

                <div v-if="filteredMessages.length > 0" class="mt-2 text-muted">
                  {{ filteredMessages.length }} von {{ messages.length }} Einträgen angezeigt
                  <span v-if="messages.filter(m => m.modified).length > 0">
                    ({{ messages.filter(m => m.modified).length }} bearbeitet)
                  </span>
                </div>
              </div>

              <!-- Structure Tab -->
              <div v-if="activeTab === 'structure'" class="json-structure">
                <div class="d-flex mb-3">
                  <div class="me-2">
                    <select class="form-select" v-model="jsonViewLocale">
                      <option value="all">Alle Sprachen</option>
                      <option value="de">Deutsch</option>
                      <option value="en">Englisch</option>
                    </select>
                  </div>
                  <div>
                    <input
                      v-model="jsonSearchQuery"
                      class="form-control"
                      type="text"
                      placeholder="JSON durchsuchen..."
                    />
                  </div>
                </div>
                <div class="json-container">
                  <pre class="json-display">{{ displayedJsonStructure }}</pre>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </PageLayout>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import defaultMessages from '@/messages.json';
import { toast } from 'vue3-toastify';
import { deepMerge } from '@/core/util/deep-merge';
import PageLayout from "@/modules/organizer/components/PageLayout.vue";
import PageNavigation from "@/modules/organizer/components/PageNavigation.vue";
import { useApolloClient } from '@vue/apollo-composable';
import gql from 'graphql-tag';
import { reloadTranslations } from '@/l18n';

// Check if we're in development mode
const isDevelopment = ref(import.meta.env.DEV || false);
import {
  getRoutesByName,
  RouteOrganizerAllEvents,
  RouteOrganizerDashboard,
  RouteOrganizerEvents,
  RouteOrganizerManagement,
  RouteOrganizerMessageEditor,
  RouteOrganizerVideoConference,
} from "@/router/routes";

// Define navigation items
const routes = getRoutesByName([
  RouteOrganizerDashboard,
  RouteOrganizerEvents,
  RouteOrganizerVideoConference,
  RouteOrganizerManagement,
  RouteOrganizerAllEvents,
  RouteOrganizerMessageEditor,
]);

const loading = ref(true);
const saving = ref(false);
const messages = ref([]);
const localMessages = ref({});
const searchQuery = ref('');
const showOnlyModified = ref(false);
const activeTab = ref('editor');
const jsonViewLocale = ref('all');
const jsonSearchQuery = ref('');
const currentLocale = ref('de');

// Recursively extract all leaf nodes from the messages object
const extractLeafNodes = (obj, locale = 'de', path = '') => {
  console.debug("Extracting messages for locale:", locale);
  const result = [];

  // Special case for the top level object with locale keys
  if (path === '' && obj[locale]) {
    return extractMessages(obj[locale], locale, '');
  }

  function extractMessages(objToExtract, locale, currentPath) {
    const extractedItems = [];

    Object.keys(objToExtract).forEach(key => {
      const keyPath = currentPath ? `${currentPath}.${key}` : key;

      if (typeof objToExtract[key] === 'object' && objToExtract[key] !== null) {
        // It's a nested object, recurse into it
        extractedItems.push(...extractMessages(objToExtract[key], locale, keyPath));
      } else {
        // Es handelt sich um einen Blattknoten (tatsächliche Übersetzungszeichenfolge)

        // Standardwert aus den Default-Übersetzungen
        const defaultValue = objToExtract[key];

        // Benutzerdefinierten Wert aus localMessages holen
        // localMessages enthält nur die benutzerdefinierten Übersetzungen
        const customValue = getNestedValue(localMessages.value, [locale, ...keyPath.split('.')]) || '';

        // Wenn der benutzerdefinierte Wert existiert und nicht leer ist, gilt der Eintrag als geändert
        const isModified = customValue !== '';

        // Debugging ausgeben
        if (isModified) {
          console.debug(`Found modified translation: ${keyPath}, default="${defaultValue}", custom="${customValue}"`);
        }

        extractedItems.push({
          path: keyPath,
          defaultValue: defaultValue,  // Der originale Standardwert aus messages.json
          customValue: customValue,    // Der benutzerdefinierte Wert (oder leer, wenn nicht vorhanden)
          modified: isModified,        // Nur als geändert markieren, wenn ein benutzerdefinierter Wert existiert
          resetting: false             // Zusätzliches Flag für den Reset-Vorgang
        });
      }
    });

    return extractedItems;
  }

  return extractMessages(obj[locale], locale, '');
};

// Helper function to get a nested value from an object using a path array
const getNestedValue = (obj, path) => {
  if (!obj) return undefined;
  return path.reduce((o, key) => (o && o[key] !== undefined) ? o[key] : undefined, obj);
};

// Helper function to set a nested value in an object using a path array
const setNestedValue = (obj, path, value) => {
  if (path.length === 0) return;

  let current = obj;

  // Navigate to the parent object of where we want to set the value
  for (let i = 0; i < path.length - 1; i++) {
    const key = path[i];
    if (!current[key] || typeof current[key] !== 'object') {
      current[key] = {};
    }
    current = current[key];
  }

  // Set the value
  current[path[path.length - 1]] = value;
};

const loadMessages = async (locale = currentLocale.value) => {
  loading.value = true;
  try {

    // Alle Variablen zurücksetzen
    localMessages.value = {};
    messages.value = [];

    // Wir müssen das Original-messages.json neu laden, um die unveränderten Werte zu bekommen
    // Use a relative path that works in both development and production
    const messagesPath = import.meta.env.DEV ? '/src/messages.json' : '/src/messages.json';
    const response = await fetch(messagesPath);
    const originalMessages = (await response.json())[locale] || {};
    // Die benutzerdefinierten Übersetzungen vom Server holen
    let customMessages = {};
    try {
      const apolloClient = resolveClient();

      const response = await apolloClient.query({
        query: gql`
          query GetTranslationsByLocale($locale: String!) {
            translationsByLocale(locale: $locale)
          }
        `,
        variables: { locale },
        fetchPolicy: 'network-only'
      });

      if (response.data?.translationsByLocale) {
        customMessages = JSON.parse(response.data.translationsByLocale);
      }
    } catch (error) {
      console.error("Fehler beim Laden der benutzerdefinierten Übersetzungen:", error);
    }

    // Die benutzerdefinierten Übersetzungen speichern
    localMessages.value = { [locale]: customMessages };

    // Flache Liste aller Meldungen erstellen
    const result = [];

    // Rekursive Funktion zum Durchlaufen der Originalmeldungen
    function processMessages(obj, path = '') {
      Object.keys(obj).forEach(key => {
        const currentPath = path ? `${path}.${key}` : key;

        if (typeof obj[key] === 'object' && obj[key] !== null) {
          // Für Objekte rekursiv aufrufen
          processMessages(obj[key], currentPath);
        } else {
          // Für Texte einen Eintrag erstellen - als Variable, nicht als Konstante
          let originalValue = obj[key];

          // Den entsprechenden benutzerdefinierten Wert suchen
          let customValue = '';
          let modified = false;


          // Normaler Fall: Pfad in den benutzerdefinierten Übersetzungen suchen
          let current = customMessages;
          let found = true;

          for (const part of currentPath.split('.')) {
            if (!current || typeof current !== 'object' || !current[part]) {
              found = false;
              break;
            }
            current = current[part];
          }

          if (found && current !== undefined && current !== null) {
            customValue = current;
            modified = true;
          }
        

          // Eintrag zur Ergebnisliste hinzufügen
          result.push({
            path: currentPath,
            defaultValue: originalValue,
            customValue: customValue,
            modified: modified,
            resetting: false // Zusätzliches Flag für den Reset-Vorgang
          });
        }
      });
    }

    // Bearbeitung starten und Ergebnis speichern
    processMessages(originalMessages);
    messages.value = result;

  } catch (error) {
    console.error("Fehler beim Laden der Übersetzungen:", error);
    toast.error("Fehler beim Laden der Übersetzungen");
  } finally {
    loading.value = false;
  }
};

// Hilfsfunktion: Prüft, ob ein verschachtelter Pfad in einem Objekt existiert
function getNestedPropertyExists(obj, pathArray) {
  let current = obj;

  for (const key of pathArray) {
    if (current === undefined || current === null || !current.hasOwnProperty(key)) {
      return false;
    }
    current = current[key];
  }

  return true;
}


// Get Apollo client
const { resolveClient } = useApolloClient();

// GraphQL query to save translations
const SAVE_TRANSLATIONS_MUTATION = gql`
  mutation SaveTranslations($translations: [SaveTranslationInput!]!) {
    saveTranslations(translations: $translations)
  }
`;

const saveChanges = async () => {
  saving.value = true;
  try {
    console.log("Speichere Änderungen...");

    // Liste der zu speichernden Übersetzungen erstellen
    const translationsToSave = [];

    // Nur Einträge mit Änderungen berücksichtigen
    messages.value.forEach(item => {
      // Nur speichern, wenn ein benutzerdefinierter Wert gesetzt wurde
      if (item.customValue) {
        translationsToSave.push({
          locale: currentLocale.value,
          key: item.path,
          value: item.customValue
        });
      }
    });

    if (translationsToSave.length === 0) {
      toast.info('Keine Änderungen zum Speichern vorhanden');
      saving.value = false;
      return;
    }

    // API-Aufruf zum Speichern der Übersetzungen
    const apolloClient = resolveClient();
    const response = await apolloClient.mutate({
      mutation: SAVE_TRANSLATIONS_MUTATION,
      variables: {
        translations: translationsToSave
      }
    });

    // Antwort prüfen
    if (response.data?.saveTranslations) {

      // Lokale Übersetzungen aktualisieren
      const locale = currentLocale.value;
      const currentCustom = localMessages.value[locale] || {};

      // Für jede gespeicherte Übersetzung den Pfad im localMessages-Objekt aktualisieren
      translationsToSave.forEach(translation => {
        const path = translation.key.split('.');
        setNestedValue(currentCustom, path, translation.value);
      });

      // Lokalen Status aktualisieren
      localMessages.value = {
        ...localMessages.value,
        [locale]: currentCustom
      };

      // Jedes Item mit seiner modified-Eigenschaft aktualisieren
      messages.value.forEach(item => {
        if (item.customValue) {
          item.modified = true;
        }
      });

      toast.success(`${translationsToSave.length} Änderungen erfolgreich gespeichert`);

      // Übersetzungen neu laden
      try {
        await reloadTranslations();
        toast.info('Übersetzungen wurden in der Anwendung aktualisiert');

        // Seite neu laden nicht nötig, da wir den lokalen Status bereits richtig aktualisiert haben
        // Stattdessen direkt die Nachrichtenliste neu laden
        await loadMessages(currentLocale.value);
      } catch (reloadError) {
        console.error('Fehler beim Neuladen der Übersetzungen:', reloadError);
        toast.warning('Übersetzungen wurden gespeichert, aber die Anwendung muss neu geladen werden');

        // Im Fehlerfall Seite nach kurzer Verzögerung neu laden
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      }
    } else {
      throw new Error('Server-Antwort zeigt keinen Erfolg an');
    }
  } catch (error) {
    console.error('Fehler beim Speichern der Übersetzungen:', error);
    toast.error(`Fehler beim Speichern: ${error.message || 'Unbekannter Fehler'}`);
  } finally {
    saving.value = false;
  }
};

const DELETE_TRANSLATION_MUTATION = gql`
  mutation DeleteTranslation($locale: String!, $key: String!) {
    deleteTranslation(locale: $locale, key: $key)
  }
`;

const resetMessage = async (item) => {
  // Set resetting flag
  item.resetting = true;

  try {
    // Only call the API if this was a modified item (exists on the server)
    if (item.modified) {
      const apolloClient = resolveClient();
      const response = await apolloClient.mutate({
        mutation: DELETE_TRANSLATION_MUTATION,
        variables: {
          locale: currentLocale.value,
          key: item.path
        }
      });

      if (response.data?.deleteTranslation) {
        // Update local state only after successful server update
        item.customValue = '';
        item.modified = false;

        // Update the localMessages object
        const locale = currentLocale.value;
        const currentCustom = localMessages.value[locale] || {};
        const path = item.path.split('.');

        // Remove this path from the local messages
        let current = currentCustom;
        let parentObj = null;
        let lastKey = null;

        // Find the parent object containing the key to delete
        for (let i = 0; i < path.length - 1; i++) {
          if (!current[path[i]]) break;
          parentObj = current;
          current = current[path[i]];
          lastKey = path[i];
        }

        // If we found the path, delete the key
        if (current && path.length > 0) {
          delete current[path[path.length - 1]];
        }

        toast.success('Übersetzung zurückgesetzt');

        // Refresh translations in the app
        await reloadTranslations();
      } else {
        throw new Error('Server-Antwort zeigt keinen Erfolg an');
      }
    } else {
      // For items not yet saved to the server, just clear the local state
      item.customValue = '';
      item.modified = false;
    }
  } catch (error) {
    console.error('Fehler beim Zurücksetzen der Übersetzung:', error);
    toast.error(`Fehler beim Zurücksetzen: ${error.message || 'Unbekannter Fehler'}`);

    // Reset the UI state in case of error
    await loadMessages(currentLocale.value);
  } finally {
    // Always clear the resetting flag
    item.resetting = false;
  }
};

// Function to export translations for development
const exportTranslations = () => {
  const exportData = JSON.stringify(localMessages.value, null, 2);
  const blob = new Blob([exportData], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'messages.local.json';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  toast.success('Translation file exported');
};

const filteredMessages = computed(() => {
  // Create local reference to avoid reactivity issues
  const query = searchQuery.value ? searchQuery.value.toLowerCase().trim() : '';
  const onlyModified = showOnlyModified.value;

  if (!query && !onlyModified) {
    return messages.value;
  }

  return messages.value.filter(item => {
    // Always check if search should match
    let matchesSearch = true;
    if (query) {
      matchesSearch =
        item.path.toLowerCase().includes(query) ||
        (item.defaultValue && typeof item.defaultValue === 'string' && item.defaultValue.toLowerCase().includes(query)) ||
        (item.customValue && typeof item.customValue === 'string' && item.customValue.toLowerCase().includes(query));
    }

    // Always check if we should filter by modified state
    const matchesModified = !onlyModified || item.modified;

    return matchesSearch && matchesModified;
  });
});

const hasChanges = computed(() => {
  return messages.value.some(item => item.customValue);
});

// Function to filter messages.json based on locale and search query
const filterJsonStructure = (json, locale, query) => {
  if (locale === 'all' && !query) return json;

  // Clone the object to avoid mutating the original
  const filteredJson = JSON.parse(JSON.stringify(json));

  if (locale !== 'all') {
    // Keep only the selected locale
    return { [locale]: filteredJson[locale] };
  }

  if (query) {
    const searchString = JSON.stringify(filteredJson).toLowerCase();
    if (!searchString.includes(query.toLowerCase())) {
      return {}; // No matches
    }

    // For simplicity, if there's a search query, we'll just return everything
    // since filtering JSON while maintaining structure is complex
    // In a more advanced implementation, you could recursively filter the object
  }

  return filteredJson;
};

// Format JSON with indentation for display
const formatJson = (json) => {
  return JSON.stringify(json, null, 2);
};

// Computed property for the displayed JSON structure
// Hier verwenden wir NUR die Original-Werte aus messages.json,
// nicht die gemergten Werte mit messages.local.json
const displayedJsonStructure = computed(() => {
  // Wichtig: Wir verwenden nur defaultMessages, nicht die gemergten Werte
  const filteredJson = filterJsonStructure(
    defaultMessages, // Nur die Standardwerte aus messages.json
    jsonViewLocale.value,
    jsonSearchQuery.value
  );
  return formatJson(filteredJson);
});

// Watch for locale changes to reload messages
watch(currentLocale, (newLocale) => {
  loadMessages(newLocale);
});

onMounted(() => {
  loadMessages();
});
</script>

<style scoped>
.table th {
  position: sticky;
  top: 0;
  background-color: white;
  z-index: 1;
}

.table tr.table-info {
  background-color: rgba(0, 123, 255, 0.05);
}

.table tr:hover {
  background-color: rgba(0, 0, 0, 0.025);
}

.default-value {
  padding: 6px 8px;
  background-color: #f8f9fa;
  border-radius: 4px;
  border: 1px solid #eee;
  min-height: 36px;
  font-size: 0.9rem;
}

.json-structure {
  margin-top: 20px;
}

.json-container {
  background-color: #f8f9fa;
  border-radius: 5px;
  border: 1px solid #dee2e6;
  max-height: 600px;
  overflow-y: auto;
}

.json-display {
  padding: 15px;
  margin: 0;
  white-space: pre-wrap;
  font-family: 'Courier New', monospace;
  font-size: 14px;
  color: #333;
}

/* Badge styling */
.badge {
  font-size: 0.6rem;
  padding: 0.2rem 0.4rem;
}

/* Make textareas resize vertically only */
textarea {
  resize: vertical;
  min-height: 40px;
}
</style>