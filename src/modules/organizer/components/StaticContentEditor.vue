<template>
  <div class="static-content-editor">
    <div class="card mb-4">
      <div class="card-header d-flex justify-content-between align-items-center">
        <h5 class="mb-0">Statische Inhalte verwalten</h5>
        <button 
          class="btn btn-sm btn-primary" 
          @click="loadPages" 
          :disabled="loading"
        >
          <i class="bi bi-arrow-clockwise me-1"></i> Aktualisieren
        </button>
      </div>
      <div class="card-body">
        <div v-if="loading" class="text-center py-4">
          <div class="spinner-border text-primary" role="status">
            <span class="visually-hidden">Wird geladen...</span>
          </div>
          <p class="mt-2">Inhalte werden geladen...</p>
        </div>
        
        <div v-else-if="error" class="alert alert-danger">
          {{ error }}
        </div>
        
        <div v-else>
          <!-- Page selector -->
          <div class="mb-4">
            <label for="pageSelector" class="form-label">Seite auswählen:</label>
            <select 
              id="pageSelector" 
              class="form-select"
              v-model="selectedPageKey"
              @change="onPageChange"
            >
              <option value="">-- Bitte wählen --</option>
              <option 
                v-for="page in uniquePages" 
                :key="page" 
                :value="page"
              >
                {{ getPageDisplayName(page) }}
              </option>
            </select>
          </div>
          
          <!-- Content list for selected page -->
          <div v-if="selectedPageKey && filteredContents.length > 0">
            <h6>Abschnitte auf {{ getPageDisplayName(selectedPageKey) }}:</h6>
            
            <div class="list-group mb-4">
              <a 
                href="#" 
                class="list-group-item list-group-item-action d-flex justify-content-between align-items-center"
                v-for="content in filteredContents"
                :key="content.id"
                @click.prevent="selectContent(content)"
                :class="{ 'active': selectedContent && selectedContent.id === content.id }"
              >
                <div>
                  <strong>{{ content.title || getSectionDisplayName(content.sectionKey) }}</strong>
                  <span 
                    class="badge rounded-pill ms-2"
                    :class="content.isPublished ? 'bg-success' : 'bg-secondary'"
                  >
                    {{ content.isPublished ? 'Veröffentlicht' : 'Entwurf' }}
                  </span>
                </div>
                <div>
                  <button 
                    class="btn btn-sm btn-outline-light me-1"
                    @click.stop="togglePublish(content)"
                    :title="content.isPublished ? 'Zurückziehen' : 'Veröffentlichen'"
                  >
                    <i class="bi" :class="content.isPublished ? 'bi-eye-slash' : 'bi-eye'"></i>
                  </button>
                </div>
              </a>
            </div>
            
            <button class="btn btn-success mb-3" @click="createNewSection">
              <i class="bi bi-plus-circle me-1"></i> Neuen Abschnitt erstellen
            </button>
          </div>
          
          <!-- No content message -->
          <div v-else-if="selectedPageKey" class="alert alert-info">
            <p>Diese Seite hat noch keine Inhaltsabschnitte.</p>
            <button class="btn btn-success" @click="createNewSection">
              <i class="bi bi-plus-circle me-1"></i> Ersten Abschnitt erstellen
            </button>
          </div>
          
          <!-- Content editor -->
          <div v-if="selectedContent" class="content-editor mt-4">
            <div class="card">
              <div class="card-header d-flex justify-content-between align-items-center">
                <h6 class="mb-0">
                  {{ selectedContent.title || getSectionDisplayName(selectedContent.sectionKey) }} bearbeiten
                </h6>
                <div>
                  <button 
                    v-if="contentHistory.length > 0"
                    class="btn btn-sm btn-outline-secondary me-2" 
                    @click="showVersionHistory = !showVersionHistory"
                  >
                    <i class="bi bi-clock-history me-1"></i>
                    {{ showVersionHistory ? 'Editor anzeigen' : 'Versionshistorie' }}
                  </button>
                  <button 
                    class="btn btn-sm btn-danger" 
                    @click="confirmDelete"
                  >
                    <i class="bi bi-trash me-1"></i> Löschen
                  </button>
                </div>
              </div>
              
              <div class="card-body">
                <!-- Version history -->
                <div v-if="showVersionHistory">
                  <h6>Versionshistorie</h6>
                  <div v-if="loadingHistory" class="text-center py-2">
                    <div class="spinner-border spinner-border-sm text-primary" role="status">
                      <span class="visually-hidden">Wird geladen...</span>
                    </div>
                  </div>
                  <div v-else-if="contentHistory.length === 0" class="alert alert-info">
                    Keine früheren Versionen verfügbar.
                  </div>
                  <div v-else class="list-group mb-3">
                    <a 
                      href="#" 
                      class="list-group-item list-group-item-action"
                      v-for="version in contentHistory"
                      :key="version.id"
                      @click.prevent="previewVersion(version)"
                    >
                      <div class="d-flex justify-content-between">
                        <div>
                          <strong>Version {{ version.version }}</strong>
                          <small class="text-muted ms-2">
                            {{ formatDate(version.createdAt) }}
                          </small>
                        </div>
                        <div>
                          <button 
                            class="btn btn-sm btn-outline-primary me-1"
                            @click.stop="previewVersion(version)"
                            title="Vorschau"
                          >
                            <i class="bi bi-eye"></i>
                          </button>
                          <button 
                            class="btn btn-sm btn-outline-success"
                            @click.stop="restoreVersion(version)"
                            title="Wiederherstellen"
                          >
                            <i class="bi bi-arrow-counterclockwise"></i>
                          </button>
                        </div>
                      </div>
                    </a>
                  </div>
                  
                  <!-- Version preview -->
                  <div v-if="selectedVersion" class="version-preview p-3 border rounded mb-3">
                    <div class="mb-2 d-flex justify-content-between">
                      <h6>Vorschau: Version {{ selectedVersion.version }}</h6>
                      <button 
                        class="btn btn-sm btn-outline-secondary"
                        @click="selectedVersion = null"
                      >
                        Schließen
                      </button>
                    </div>
                    <div v-html="selectedVersion.content"></div>
                  </div>
                </div>
                
                <!-- Content form -->
                <div v-else>
                  <form @submit.prevent="saveContent">
                    <div class="mb-3">
                      <label for="contentTitle" class="form-label">Titel</label>
                      <input 
                        type="text" 
                        id="contentTitle" 
                        class="form-control"
                        v-model="editForm.title" 
                        required
                      />
                    </div>
                    
                    <div class="mb-3">
                      <label for="contentSectionKey" class="form-label">Abschnitts-ID</label>
                      <input 
                        type="text" 
                        id="contentSectionKey" 
                        class="form-control"
                        v-model="editForm.sectionKey" 
                        :disabled="!isNewContent"
                        required
                      />
                      <small class="form-text text-muted">
                        Technischer Bezeichner für diesen Abschnitt (nur Kleinbuchstaben, Zahlen und Unterstriche).
                      </small>
                    </div>
                    
                    <div class="mb-3">
                      <label for="contentOrder" class="form-label">Sortierreihenfolge</label>
                      <input 
                        type="number" 
                        id="contentOrder" 
                        class="form-control"
                        v-model.number="editForm.ordering" 
                        min="0"
                      />
                    </div>
                    
                    <div class="mb-3">
                      <label for="contentHtml" class="form-label">HTML-Inhalt</label>
                      <textarea 
                        id="contentHtml" 
                        class="form-control" 
                        v-model="editForm.content"
                        rows="10"
                        required
                      ></textarea>
                    </div>
                    
                    <div class="mb-3 form-check">
                      <input 
                        type="checkbox" 
                        id="contentPublished" 
                        class="form-check-input"
                        v-model="editForm.isPublished" 
                      />
                      <label for="contentPublished" class="form-check-label">Veröffentlicht</label>
                    </div>
                    
                    <div class="mb-3">
                      <label class="form-label">Vorschau</label>
                      <div class="p-3 border rounded bg-light">
                        <div v-html="editForm.content"></div>
                      </div>
                    </div>
                    
                    <div class="d-flex justify-content-end">
                      <button 
                        type="button"
                        class="btn btn-secondary me-2" 
                        @click="cancelEdit"
                      >
                        Abbrechen
                      </button>
                      <button 
                        type="submit" 
                        class="btn btn-primary"
                        :disabled="saving"
                      >
                        <span v-if="saving">
                          <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                          Speichern...
                        </span>
                        <span v-else>Speichern</span>
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Confirmation modal -->
    <div 
      class="modal fade" 
      id="deleteConfirmModal" 
      tabindex="-1" 
      aria-labelledby="deleteConfirmModalLabel" 
      aria-hidden="true"
      ref="deleteModal"
    >
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="deleteConfirmModalLabel">Löschen bestätigen</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Schließen"></button>
          </div>
          <div class="modal-body">
            Möchten Sie diesen Inhaltsabschnitt wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Abbrechen</button>
            <button 
              type="button" 
              class="btn btn-danger" 
              @click="deleteContent"
              :disabled="deleting"
            >
              <span v-if="deleting">
                <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                Löschen...
              </span>
              <span v-else>Löschen</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { Modal } from 'bootstrap';
import gql from 'graphql-tag';

export default {
  name: 'StaticContentEditor',
  
  data() {
    return {
      contents: [],
      selectedPageKey: '',
      selectedContent: null,
      selectedVersion: null,
      editForm: {
        id: null,
        pageKey: '',
        sectionKey: '',
        title: '',
        content: '',
        ordering: 0,
        isPublished: true
      },
      contentHistory: [],
      showVersionHistory: false,
      loading: false,
      loadingHistory: false,
      saving: false,
      deleting: false,
      error: null,
      deleteModal: null,
      isNewContent: false
    };
  },
  
  computed: {
    uniquePages() {
      const pages = [...new Set(this.contents.map(c => c.pageKey))];
      return pages.sort();
    },
    
    filteredContents() {
      if (!this.selectedPageKey) return [];
      return this.contents
        .filter(c => c.pageKey === this.selectedPageKey)
        .sort((a, b) => a.ordering - b.ordering);
    }
  },
  
  mounted() {
    this.loadPages();
    this.$nextTick(() => {
      this.deleteModal = new Modal(this.$refs.deleteModal);
    });
  },
  
  methods: {
    async loadPages() {
      this.loading = true;
      this.error = null;
      
      try {
        const result = await this.$apollo.query({
          query: gql`
            query GetStaticContents {
              staticContents {
                id
                pageKey
                sectionKey
                title
                content
                ordering
                isPublished
                createdAt
                updatedAt
              }
            }
          `,
          fetchPolicy: 'network-only'
        });
        
        this.contents = result.data.staticContents;
      } catch (err) {
        console.error('Failed to load static contents:', err);
        this.error = 'Fehler beim Laden der Inhalte: ' + (err.message || 'Unbekannter Fehler');
      } finally {
        this.loading = false;
      }
    },
    
    onPageChange() {
      this.selectedContent = null;
      this.selectedVersion = null;
      this.showVersionHistory = false;
    },
    
    getPageDisplayName(pageKey) {
      const displayNames = {
        'faq': 'Häufige Fragen (FAQ)',
        'imprint': 'Impressum',
        'data_protection': 'Datenschutz',
        'user_agreement': 'Nutzungsvereinbarung',
        'manual': 'Benutzerhandbuch',
        'functions': 'Funktionen'
      };
      
      return displayNames[pageKey] || pageKey;
    },
    
    getSectionDisplayName(sectionKey) {
      const displayNames = {
        'main': 'Hauptinhalt',
        'general_info': 'Allgemeine Informationen',
        'security': 'Sicherheit',
        'registration': 'Registrierung',
        'execution': 'Durchführung',
        'requirements': 'Voraussetzungen',
        'results': 'Ergebnisse',
        'support': 'Support',
        'legal': 'Rechtliches',
        'feedback': 'Feedback',
        'special': 'Besondere Fälle'
      };
      
      return displayNames[sectionKey] || sectionKey;
    },
    
    selectContent(content) {
      this.selectedContent = content;
      this.showVersionHistory = false;
      this.selectedVersion = null;
      this.isNewContent = false;
      
      // Initialize edit form
      this.editForm = {
        id: content.id,
        pageKey: content.pageKey,
        sectionKey: content.sectionKey,
        title: content.title || '',
        content: content.content,
        ordering: content.ordering || 0,
        isPublished: content.isPublished
      };
      
      // Load version history
      this.loadContentHistory(content.id);
    },
    
    async loadContentHistory(contentId) {
      this.loadingHistory = true;
      this.contentHistory = [];
      
      try {
        const result = await this.$apollo.query({
          query: gql`
            query GetStaticContentVersions($contentId: ID!) {
              staticContentVersions(contentId: $contentId) {
                id
                contentId
                content
                title
                version
                createdAt
                changedBy {
                  id
                  publicName
                }
              }
            }
          `,
          variables: {
            contentId
          },
          fetchPolicy: 'network-only'
        });
        
        this.contentHistory = result.data.staticContentVersions;
      } catch (err) {
        console.error('Failed to load content history:', err);
      } finally {
        this.loadingHistory = false;
      }
    },
    
    previewVersion(version) {
      this.selectedVersion = version;
    },
    
    async restoreVersion(version) {
      if (!confirm(`Möchten Sie wirklich zur Version ${version.version} zurückkehren?`)) {
        return;
      }
      
      this.saving = true;
      
      try {
        const result = await this.$apollo.mutate({
          mutation: gql`
            mutation RevertToVersion($contentId: ID!, $versionId: ID!) {
              revertStaticContentToVersion(contentId: $contentId, versionId: $versionId) {
                id
                content
                title
              }
            }
          `,
          variables: {
            contentId: this.selectedContent.id,
            versionId: version.id
          }
        });
        
        // Update content in the list
        const updatedContent = result.data.revertStaticContentToVersion;
        const index = this.contents.findIndex(c => c.id === updatedContent.id);
        
        if (index !== -1) {
          this.contents[index] = {
            ...this.contents[index],
            content: updatedContent.content,
            title: updatedContent.title
          };
        }
        
        // Update selected content
        this.selectedContent = {
          ...this.selectedContent,
          content: updatedContent.content,
          title: updatedContent.title
        };
        
        // Update form
        this.editForm.content = updatedContent.content;
        this.editForm.title = updatedContent.title || '';
        
        this.showVersionHistory = false;
        this.selectedVersion = null;
        
        // Reload history
        this.loadContentHistory(this.selectedContent.id);
        
        this.$toast.success('Version erfolgreich wiederhergestellt!');
      } catch (err) {
        console.error('Failed to restore version:', err);
        this.$toast.error('Fehler bei der Wiederherstellung: ' + (err.message || 'Unbekannter Fehler'));
      } finally {
        this.saving = false;
      }
    },
    
    createNewSection() {
      this.isNewContent = true;
      this.selectedContent = {
        id: null,
        pageKey: this.selectedPageKey,
        sectionKey: '',
        title: '',
        content: '<p>Neuer Inhalt</p>',
        ordering: 0,
        isPublished: true
      };
      
      this.editForm = { ...this.selectedContent };
      this.showVersionHistory = false;
      this.contentHistory = [];
    },
    
    async saveContent() {
      if (!this.editForm.pageKey || !this.editForm.sectionKey) {
        this.$toast.error('Seiten-ID und Abschnitts-ID sind erforderlich!');
        return;
      }
      
      // Validate sectionKey format (lowercase, numbers, underscores)
      const sectionKeyPattern = /^[a-z0-9_]+$/;
      if (!sectionKeyPattern.test(this.editForm.sectionKey)) {
        this.$toast.error('Abschnitts-ID darf nur Kleinbuchstaben, Zahlen und Unterstriche enthalten!');
        return;
      }
      
      this.saving = true;
      
      try {
        let result;
        
        if (this.isNewContent) {
          // Create new content
          result = await this.$apollo.mutate({
            mutation: gql`
              mutation CreateStaticContent($input: CreateStaticContentInput!) {
                createStaticContent(input: $input) {
                  id
                  pageKey
                  sectionKey
                  title
                  content
                  ordering
                  isPublished
                  createdAt
                  updatedAt
                }
              }
            `,
            variables: {
              input: {
                pageKey: this.editForm.pageKey,
                sectionKey: this.editForm.sectionKey,
                title: this.editForm.title,
                content: this.editForm.content,
                ordering: this.editForm.ordering,
                isPublished: this.editForm.isPublished
              }
            }
          });
          
          const newContent = result.data.createStaticContent;
          this.contents.push(newContent);
          this.selectedContent = newContent;
          this.isNewContent = false;
          this.$toast.success('Neuer Abschnitt erfolgreich erstellt!');
        } else {
          // Update existing content
          result = await this.$apollo.mutate({
            mutation: gql`
              mutation UpdateStaticContent($input: UpdateStaticContentInput!) {
                updateStaticContent(input: $input) {
                  id
                  title
                  content
                  ordering
                  isPublished
                  updatedAt
                }
              }
            `,
            variables: {
              input: {
                id: this.editForm.id,
                title: this.editForm.title,
                content: this.editForm.content,
                ordering: this.editForm.ordering,
                isPublished: this.editForm.isPublished
              }
            }
          });
          
          // Update content in the list
          const updatedContent = result.data.updateStaticContent;
          const index = this.contents.findIndex(c => c.id === updatedContent.id);
          
          if (index !== -1) {
            this.contents[index] = {
              ...this.contents[index],
              ...updatedContent
            };
          }
          
          // Update selected content
          this.selectedContent = {
            ...this.selectedContent,
            ...updatedContent
          };
          
          this.$toast.success('Änderungen erfolgreich gespeichert!');
          
          // Reload history
          this.loadContentHistory(this.selectedContent.id);
        }
      } catch (err) {
        console.error('Failed to save content:', err);
        this.$toast.error('Fehler beim Speichern: ' + (err.message || 'Unbekannter Fehler'));
      } finally {
        this.saving = false;
      }
    },
    
    cancelEdit() {
      if (this.isNewContent) {
        this.selectedContent = null;
      } else {
        // Reset form to original content
        this.selectContent(this.selectedContent);
      }
    },
    
    confirmDelete() {
      this.deleteModal.show();
    },
    
    async deleteContent() {
      if (!this.selectedContent || !this.selectedContent.id) {
        this.deleteModal.hide();
        return;
      }
      
      this.deleting = true;
      
      try {
        await this.$apollo.mutate({
          mutation: gql`
            mutation DeleteStaticContent($id: ID!) {
              deleteStaticContent(id: $id)
            }
          `,
          variables: {
            id: this.selectedContent.id
          }
        });
        
        // Remove content from the list
        const index = this.contents.findIndex(c => c.id === this.selectedContent.id);
        if (index !== -1) {
          this.contents.splice(index, 1);
        }
        
        this.selectedContent = null;
        this.$toast.success('Inhalt erfolgreich gelöscht!');
      } catch (err) {
        console.error('Failed to delete content:', err);
        this.$toast.error('Fehler beim Löschen: ' + (err.message || 'Unbekannter Fehler'));
      } finally {
        this.deleting = false;
        this.deleteModal.hide();
      }
    },
    
    async togglePublish(content) {
      try {
        const result = await this.$apollo.mutate({
          mutation: gql`
            mutation TogglePublished($id: ID!, $isPublished: Boolean!) {
              toggleStaticContentPublished(id: $id, isPublished: $isPublished) {
                id
                isPublished
                publishedAt
              }
            }
          `,
          variables: {
            id: content.id,
            isPublished: !content.isPublished
          }
        });
        
        // Update content in the list
        const updatedContent = result.data.toggleStaticContentPublished;
        const index = this.contents.findIndex(c => c.id === updatedContent.id);
        
        if (index !== -1) {
          this.contents[index].isPublished = updatedContent.isPublished;
        }
        
        // Update selected content if needed
        if (this.selectedContent && this.selectedContent.id === updatedContent.id) {
          this.selectedContent.isPublished = updatedContent.isPublished;
          this.editForm.isPublished = updatedContent.isPublished;
        }
        
        const status = updatedContent.isPublished ? 'veröffentlicht' : 'zurückgezogen';
        this.$toast.success(`Inhalt erfolgreich ${status}!`);
      } catch (err) {
        console.error('Failed to toggle published status:', err);
        this.$toast.error('Fehler bei der Statusänderung: ' + (err.message || 'Unbekannter Fehler'));
      }
    },
    
    formatDate(dateString) {
      if (!dateString) return '';
      
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('de-DE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(date);
    }
  }
};
</script>

<style scoped>
.static-content-editor {
  max-width: 1000px;
  margin: 0 auto;
}

.version-preview {
  max-height: 400px;
  overflow-y: auto;
}
</style>