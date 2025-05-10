<template>
  <div class="static-content-manager">
    <h2>Statische Inhalte verwalten</h2>
    
    <!-- Tab-Navigation -->
    <ul class="nav nav-tabs mb-4">
      <li class="nav-item">
        <a 
          class="nav-link" 
          :class="{ active: activeTab === 'pages' }"
          href="#" 
          @click.prevent="activeTab = 'pages'"
        >
          <i class="bi bi-file-earmark-text"></i> Seiten
        </a>
      </li>
      <li class="nav-item">
        <a 
          class="nav-link" 
          :class="{ active: activeTab === 'sections' }"
          href="#" 
          @click.prevent="activeTab = 'sections'"
        >
          <i class="bi bi-list-ul"></i> Abschnitte
        </a>
      </li>
      <li class="nav-item">
        <a 
          class="nav-link" 
          :class="{ active: activeTab === 'editor' }"
          href="#" 
          @click.prevent="activeTab = 'editor'"
        >
          <i class="bi bi-pencil-square"></i> {{ editMode ? 'Bearbeiten' : 'Neu erstellen' }}
        </a>
      </li>
    </ul>
    
    <!-- Seiten-Tab -->
    <div v-if="activeTab === 'pages'" class="mb-4">
      <div class="d-flex justify-content-between align-items-center mb-3">
        <h3>Verfügbare Seiten</h3>
        <button @click="createNewPage" class="btn btn-success">
          <i class="bi bi-plus-circle"></i> Neue Seite
        </button>
      </div>
      
      <div v-if="loading" class="text-center py-3">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Wird geladen...</span>
        </div>
      </div>
      
      <div v-else-if="uniquePages.length === 0" class="alert alert-info">
        Noch keine statischen Seiten vorhanden.
      </div>
      
      <div v-else class="row">
        <div class="col-md-8">
          <div class="list-group">
            <a 
              v-for="page in uniquePages" 
              :key="page" 
              href="#" 
              class="list-group-item list-group-item-action d-flex justify-content-between align-items-center"
              @click.prevent="selectPage(page)"
            >
              <div>
                <h5 class="mb-1">{{ page }}</h5>
                <small>{{ countSections(page) }} Abschnitte</small>
              </div>
              <div>
                <a 
                  @click.stop
                  :href="localUseDirectPaths ? `/${page}` : `/static-page/${page}`" 
                  target="_blank" 
                  class="btn btn-sm btn-outline-secondary me-2"
                >
                  <i class="bi bi-box-arrow-up-right"></i> Ansehen
                </a>
                <button @click.stop="selectPage(page)" class="btn btn-sm btn-outline-primary">
                  <i class="bi bi-gear"></i> Verwalten
                </button>
              </div>
            </a>
          </div>
          
          <div class="alert alert-info mt-3">
            <i class="bi bi-info-circle-fill me-2"></i>
            Die URL für statische Seiten lautet: 
            <code v-if="localUseDirectPaths">
              /[seiten-schlüssel]
            </code>
            <code v-else>
              /static-page/[seiten-schlüssel]
            </code>
          </div>
          
          <!-- Systemeinstellungen (nur für Super-Admin) -->
          <div v-if="coreStore.isSuperOrganizer" class="card mt-3 mb-2">
            <div class="card-header bg-primary text-white">
              <h5 class="mb-0">Globale Systemeinstellungen</h5>
            </div>
            <div class="card-body">
              <form @submit.prevent="updateSystemSettings">
                <div class="form-check mb-2">
                  <input 
                    type="checkbox" 
                    class="form-check-input" 
                    id="useDirectPaths" 
                    v-model="localUseDirectPaths"
                  >
                  <label class="form-check-label" for="useDirectPaths">
                    Direkte Pfade aktivieren (ohne /static-page/ Prefix)
                  </label>
                </div>
                <div class="form-check mb-3">
                  <input 
                    type="checkbox" 
                    class="form-check-input" 
                    id="useInFooterNavigation" 
                    v-model="localUseInFooterNavigation"
                  >
                  <label class="form-check-label" for="useInFooterNavigation">
                    Dynamische Seiten in der Footer-Navigation anzeigen
                  </label>
                </div>
                <div class="d-grid">
                  <button type="submit" class="btn btn-primary">
                    <i class="bi bi-save"></i> Systemeinstellungen speichern
                  </button>
                </div>
                <small class="text-muted mt-2">
                  Hinweis: Diese Einstellungen gelten für alle Benutzer im System.
                </small>
              </form>
            </div>
          </div>
          
          <div v-else class="alert alert-info mt-3">
            <i class="bi bi-info-circle me-2"></i>
            Die globalen URL-Einstellungen können nur von einem Super-Admin geändert werden.
          </div>
        </div>
        
        <div class="col-md-4">
          <div class="card">
            <div class="card-header bg-primary text-white">
              <h5 class="mb-0">Schnellhilfe</h5>
            </div>
            <div class="card-body">
              <h6>So erstellen Sie neue Seiten:</h6>
              <ol>
                <li>Klicken Sie auf "Neue Seite"</li>
                <li>Geben Sie einen eindeutigen Seitenschlüssel ein</li>
                <li>Erstellen Sie mindestens einen Abschnitt für die Seite</li>
                <li>Die Seite ist dann unter /static-page/[schlüssel] erreichbar</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Abschnitte-Tab -->
    <div v-if="activeTab === 'sections'" class="mb-4">
      <div class="d-flex justify-content-between align-items-center mb-3">
        <h3>
          <span v-if="selectedPage">Abschnitte für "{{ selectedPage }}"</span>
          <span v-else>Alle Abschnitte</span>
        </h3>
        <div>
          <div class="input-group">
            <select 
              v-model="selectedPage" 
              class="form-select"
              aria-label="Seite auswählen"
            >
              <option value="">Alle Seiten</option>
              <option v-for="page in uniquePages" :key="page" :value="page">
                {{ page }}
              </option>
            </select>
            <button 
              @click="activeTab = 'editor'; prepareNewSection()" 
              class="btn btn-success"
              :disabled="!selectedPage"
            >
              <i class="bi bi-plus-circle"></i> Abschnitt hinzufügen
            </button>
          </div>
        </div>
      </div>
      
      <div v-if="loading" class="text-center py-3">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Wird geladen...</span>
        </div>
      </div>
      
      <div v-else-if="filteredSections.length === 0" class="alert alert-info">
        <span v-if="selectedPage">
          Noch keine Abschnitte für diese Seite. 
          <a href="#" @click.prevent="activeTab = 'editor'; prepareNewSection()">Erstellen Sie den ersten Abschnitt</a>.
        </span>
        <span v-else>Keine Abschnitte gefunden.</span>
      </div>
      
      <div v-else>
        <div class="table-responsive">
          <table class="table table-striped table-hover">
            <thead class="table-primary">
              <tr>
                <th>Seite</th>
                <th>Abschnitt</th>
                <th>Titel</th>
                <th>Reihenfolge</th>
                <th>Status</th>
                <th>Aktionen</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="content in filteredSections" :key="content.id" :class="{'table-light': !content.isPublished}">
                <td>{{ content.pageKey }}</td>
                <td>{{ content.sectionKey }}</td>
                <td>{{ content.title || '-' }}</td>
                <td>{{ content.ordering }}</td>
                <td>
                  <span :class="[
                    'badge',
                    content.isPublished ? 'bg-success' : 'bg-warning'
                  ]">
                    {{ content.isPublished ? 'Veröffentlicht' : 'Entwurf' }}
                  </span>
                </td>
                <td>
                  <div class="btn-group">
                    <button @click="editContent(content)" class="btn btn-sm btn-outline-primary">
                      <i class="bi bi-pencil-square"></i> Bearbeiten
                    </button>
                    <button 
                      @click="togglePublishStatus(content)" 
                      class="btn btn-sm" 
                      :class="content.isPublished ? 'btn-outline-warning' : 'btn-outline-success'"
                    >
                      <i :class="['bi', content.isPublished ? 'bi-eye-slash' : 'bi-eye']"></i>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
    
    <!-- Editor-Tab -->
    <div v-if="activeTab === 'editor'" class="mt-4">
      <div class="d-flex justify-content-between align-items-center mb-3">
        <h3>{{ editMode ? 'Inhalt bearbeiten' : 'Neuen Inhalt erstellen' }}</h3>
        <button @click="activeTab = 'sections'" class="btn btn-outline-secondary">
          <i class="bi bi-arrow-left"></i> Zurück
        </button>
      </div>
      
      <form @submit.prevent="saveContent" class="border rounded p-4 bg-light">
        <div class="row mb-3">
          <div class="col-md-6">
            <label for="pageKey" class="form-label">Seitenschlüssel</label>
            <input 
              type="text" 
              class="form-control" 
              id="pageKey" 
              v-model="formData.pageKey" 
              placeholder="z.B. about-us"
              :disabled="editMode"
              @input="checkDuplicateSection"
              @blur="checkDuplicateSection"
              required
            >
            <small class="form-text text-muted">
              Der Seitenschlüssel wird in der URL verwendet: /static-page/[seitenschlüssel]
            </small>
          </div>
          
          <div class="col-md-6">
            <label for="sectionKey" class="form-label">Abschnittschlüssel</label>
            <input 
              type="text" 
              class="form-control" 
              id="sectionKey" 
              v-model="formData.sectionKey" 
              placeholder="z.B. main-content"
              :disabled="editMode"
              @input="checkDuplicateSection"
              @blur="checkDuplicateSection"
              required
            >
            <div class="invalid-feedback">
              Dieser Abschnittschlüssel existiert bereits für diese Seite. Bitte wählen Sie einen anderen Schlüssel.
            </div>
            <small class="form-text text-muted">
              Mehrere Abschnitte auf einer Seite werden nach diesem Schlüssel sortiert
            </small>
          </div>
        </div>
        
        <div class="row mb-3">
          <div class="col-md-8">
            <label for="title" class="form-label">Titel</label>
            <input 
              type="text" 
              class="form-control" 
              id="title" 
              v-model="formData.title" 
              placeholder="Titel des Abschnitts"
            >
          </div>
          
          <div class="col-md-4">
            <label for="ordering" class="form-label">Reihenfolge</label>
            <input 
              type="number" 
              class="form-control" 
              id="ordering" 
              v-model="formData.ordering" 
              placeholder="1"
            >
          </div>
        </div>
        
        <div class="mb-3">
          <label for="content" class="form-label">Inhalt</label>
          <div class="d-flex justify-content-end gap-2 mb-2">
            <button 
              type="button" 
              class="btn btn-outline-primary btn-sm" 
              @click="showMediaManager = true"
            >
              <i class="bi bi-image"></i> Medienverwaltung
            </button>
          </div>
          
          <div class="position-relative editor-container">
            <div
              class="editor-container editor-container_classic-editor editor-container_include-style editor-container_include-block-toolbar editor-container_include-fullscreen"
              ref="editorContainerElement"
            >
              <div class="editor-container__editor">
                <div ref="editorElement">
                  <ckeditor 
                    v-if="editor && config" 
                    :modelValue="config.initialData" 
                    :editor="editor" 
                    :config="config"
                    @ready="onEditorReady"
                  />
                </div>
              </div>
            </div>
          </div>
          
          <!-- Media Manager Modal -->
          <div v-if="showMediaManager" class="media-manager-modal">
            <div class="modal-backdrop show"></div>
            <div class="modal media-manager-dialog d-block" tabindex="-1">
              <div class="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
                <div class="modal-content">
                  <MediaManager 
                    @select="insertMedia" 
                    @close="showMediaManager = false"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div class="mb-3 form-check">
          <input 
            type="checkbox" 
            class="form-check-input" 
            id="isPublished" 
            v-model="formData.isPublished"
          >
          <label class="form-check-label" for="isPublished">Veröffentlichen</label>
        </div>
        
        <div class="d-flex mt-4">
          <button type="submit" class="btn btn-primary me-2" :disabled="saving">
            <span v-if="saving" class="spinner-border spinner-border-sm me-1"></span>
            {{ editMode ? 'Aktualisieren' : 'Erstellen' }}
          </button>
          
          <button 
            v-if="editMode" 
            @click="cancelEdit" 
            type="button" 
            class="btn btn-outline-secondary"
          >
            Abbrechen
          </button>
        </div>
      </form>
      
      <!-- Tabs für Editor und Vorschau -->
      <div class="card mt-4">
        <div class="card-header">
          <ul class="nav nav-tabs card-header-tabs">
            <li class="nav-item">
              <a 
                class="nav-link" 
                :class="{ active: previewTab === 'code' }"
                href="#" 
                @click.prevent="previewTab = 'code'"
              >
                <i class="bi bi-code-square"></i> HTML-Code
              </a>
            </li>
            <li class="nav-item">
              <a 
                class="nav-link" 
                :class="{ active: previewTab === 'preview' }"
                href="#" 
                @click.prevent="previewTab = 'preview'"
              >
                <i class="bi bi-eye"></i> Vorschau
              </a>
            </li>
          </ul>
        </div>
        <div class="card-body">
          <!-- Code-Ansicht -->
          <div v-if="previewTab === 'code'" class="p-3 border rounded bg-light">
            <pre class="mb-0"><code>{{ formData.content }}</code></pre>
          </div>
          
          <!-- Vorschau-Ansicht -->
          <div v-if="previewTab === 'preview'" v-html="formData.content" class="p-3 border rounded bg-white"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
/**
 * This configuration was generated using the CKEditor 5 Builder. You can modify it anytime using this link:
 * https://ckeditor.com/ckeditor-5/builder/#installation/NoFgNARATAdArDADBSBGA7CKI4E4ToAcAbMSKrounKgMyIF6GHXnnGVS2pwggoQAJgFMUiMMFRgpU8TIC6kXLQDGAM2GoARhHlA=
 */
import { computed, ref, onMounted, useTemplateRef, watch } from 'vue';
import { useApolloClient } from '@vue/apollo-composable';
import gql from 'graphql-tag';
import { toast } from 'vue3-toastify';
import MediaManager from './MediaManager.vue';
import { useCore } from '@/core/store/core';

 import { Ckeditor } from '@ckeditor/ckeditor5-vue';

 import {
	ClassicEditor,
	Alignment,
	Autoformat,
	AutoImage,
	AutoLink,
	Autosave,
	BalloonToolbar,
	BlockQuote,
	BlockToolbar,
	Bold,
	Bookmark,
	CloudServices,
	Code,
	CodeBlock,
	Essentials,
	FindAndReplace,
	FullPage,
	Fullscreen,
	GeneralHtmlSupport,
	Heading,
	HorizontalLine,
	ImageBlock,
	ImageCaption,
	ImageInline,
	ImageInsertViaUrl,
	ImageResize,
	ImageStyle,
	ImageTextAlternative,
	ImageToolbar,
	ImageUpload,
	Indent,
	IndentBlock,
	Italic,
	Link,
	LinkImage,
	List,
	ListProperties,
	// Markdown plugin removed to fix HTML output
	MediaEmbed,
	Paragraph,
	// PasteFromMarkdownExperimental plugin removed to fix HTML output
	PasteFromOffice,
	ShowBlocks,
	SourceEditing,
	SpecialCharacters,
	SpecialCharactersArrows,
	SpecialCharactersCurrency,
	SpecialCharactersEssentials,
	SpecialCharactersLatin,
	SpecialCharactersMathematical,
	SpecialCharactersText,
	Style,
	Table,
	TableCaption,
	TableCellProperties,
	TableColumnResize,
	TableProperties,
	TableToolbar,
	TextTransformation,
	TodoList
} from 'ckeditor5';


import translations from 'ckeditor5/translations/de.js';

import 'ckeditor5/ckeditor5.css';

// Lizenzschlüssel
const LICENSE_KEY = 'GPL';

// Editor-Menüleiste (aus Builder-Beispiel)
// Wir kommentieren die Variable aus, da sie bereits definiert sein könnte
const editorMenuBar = useTemplateRef('editorMenuBarElement');

// Funktion zum Initialisieren des Editors
// Layout-Status
const isLayoutReady = ref(false);

const editor = ClassicEditor;

// Editor-Konfiguration aus dem Builder
const config = computed(() => {
	if (!isLayoutReady.value) {
		return null;
	}

	return {
		toolbar: {
			items: [
				'sourceEditing',
				'showBlocks',
				'findAndReplace',
				'fullscreen',
				'|',
				'heading',
				'style',
				'|',
				'bold',
				'italic',
				'code',
				'|',
				'specialCharacters',
				'horizontalLine',
				'link',
				'bookmark',
				'insertImageViaUrl',
				'mediaEmbed',
				'insertTable',
				'blockQuote',
				'codeBlock',
				'|',
				'alignment',
				'|',
				'bulletedList',
				'numberedList',
				'todoList',
				'outdent',
				'indent'
			],
			shouldNotGroupWhenFull: true
		},
		plugins: [
			Alignment,
			Autoformat,
			AutoImage,
			AutoLink,
			Autosave,
			BalloonToolbar,
			BlockQuote,
			BlockToolbar,
			Bold,
			Bookmark,
			CloudServices,
			Code,
			CodeBlock,
			Essentials,
			FindAndReplace,
			FullPage,
			Fullscreen,
			GeneralHtmlSupport,
			Heading,
			HorizontalLine,
			ImageBlock,
			ImageCaption,
			ImageInline,
			ImageInsertViaUrl,
			ImageResize,
			ImageStyle,
			ImageTextAlternative,
			ImageToolbar,
			ImageUpload,
			Indent,
			IndentBlock,
			Italic,
			Link,
			LinkImage,
			List,
			ListProperties,
			// Markdown plugin removed
			MediaEmbed,
			Paragraph,
			// PasteFromMarkdownExperimental plugin removed
			PasteFromOffice,
			ShowBlocks,
			SourceEditing,
			SpecialCharacters,
			SpecialCharactersArrows,
			SpecialCharactersCurrency,
			SpecialCharactersEssentials,
			SpecialCharactersLatin,
			SpecialCharactersMathematical,
			SpecialCharactersText,
			Style,
			Table,
			TableCaption,
			TableCellProperties,
			TableColumnResize,
			TableProperties,
			TableToolbar,
			TextTransformation,
			TodoList
		],
		balloonToolbar: ['bold', 'italic', '|', 'link', '|', 'bulletedList', 'numberedList'],
		blockToolbar: ['bold', 'italic', '|', 'link', 'insertTable', '|', 'bulletedList', 'numberedList', 'outdent', 'indent'],
		fullscreen: {
			onEnterCallback: container =>
				container.classList.add(
					'editor-container',
					'editor-container_classic-editor',
					'editor-container_include-style',
					'editor-container_include-block-toolbar',
					'editor-container_include-fullscreen',
					'main-container'
				)
		},
		heading: {
			options: [
				{
					model: 'paragraph',
					title: 'Paragraph',
					class: 'ck-heading_paragraph'
				},
				{
					model: 'heading1',
					view: 'h1',
					title: 'Heading 1',
					class: 'ck-heading_heading1'
				},
				{
					model: 'heading2',
					view: 'h2',
					title: 'Heading 2',
					class: 'ck-heading_heading2'
				},
				{
					model: 'heading3',
					view: 'h3',
					title: 'Heading 3',
					class: 'ck-heading_heading3'
				},
				{
					model: 'heading4',
					view: 'h4',
					title: 'Heading 4',
					class: 'ck-heading_heading4'
				},
				{
					model: 'heading5',
					view: 'h5',
					title: 'Heading 5',
					class: 'ck-heading_heading5'
				},
				{
					model: 'heading6',
					view: 'h6',
					title: 'Heading 6',
					class: 'ck-heading_heading6'
				}
			]
		},
		htmlSupport: {
			allow: [
				{
					name: /^.*$/,
					styles: true,
					attributes: true,
					classes: true
				}
			]
		},
		image: {
			toolbar: [
				'toggleImageCaption',
				'imageTextAlternative',
				'|',
				'imageStyle:inline',
				'imageStyle:wrapText',
				'imageStyle:breakText',
				'|',
				'resizeImage'
			]
		},
		language: 'de',
		licenseKey: LICENSE_KEY,
		link: {
			addTargetToExternalLinks: true,
			defaultProtocol: 'https://',
			decorators: {
				toggleDownloadable: {
					mode: 'manual',
					label: 'Downloadable',
					attributes: {
						download: 'file'
					}
				}
			}
		},
		list: {
			properties: {
				styles: true,
				startIndex: true,
				reversed: true
			}
		},
		menuBar: {
			isVisible: true
		},
		placeholder: 'Type or paste your content here!',
		style: {
			definitions: [
				{
					name: 'Article category',
					element: 'h3',
					classes: ['category']
				},
				{
					name: 'Title',
					element: 'h2',
					classes: ['document-title']
				},
				{
					name: 'Subtitle',
					element: 'h3',
					classes: ['document-subtitle']
				},
				{
					name: 'Info box',
					element: 'p',
					classes: ['info-box']
				},
				{
					name: 'CTA Link Primary',
					element: 'a',
					classes: ['btn', 'btn-primary']
				},
				{
					name: 'CTA Link Secondary',
					element: 'a',
					classes: ['btn', 'btn-primary']
				},
				{
					name: 'Marker',
					element: 'span',
					classes: ['marker']
				},
				{
					name: 'Spoiler',
					element: 'span',
					classes: ['spoiler']
				}
			]
		},
		table: {
			contentToolbar: ['tableColumn', 'tableRow', 'mergeTableCells', 'tableProperties', 'tableCellProperties']
		},
		translations: [translations]
	};
});

// Inhalte laden
onMounted(async () => {
  isLayoutReady.value = true;
  await fetchStaticContents();
});

// Media in den Editor einfügen
const insertMedia = (media) => {
  try {
    // Bild-URL bereitstellen
    const imageUrl = media.url;
    const altText = media.filename || 'Bild';
    
    if (editorInstance.value) {
      // CKEditor API verwenden, um das Bild einzufügen
      const editor = editorInstance.value;
      
      // Bild in den Editor einfügen
      editor.execute('insertImage', {
        source: {
          src: imageUrl,
          alt: altText
        }
      });
      
      // Den aktualisierten Inhalt aus dem Editor holen
      formData.value.content = editor.getData();
      
      // Media Manager Dialog schließen
      showMediaManager.value = false;
      
      // Erfolgsbenachrichtigung
      toast.success('Bild erfolgreich eingefügt');
    } else {
      console.error('Keine CKEditor-Instanz gefunden');
      toast.error('Editor konnte nicht gefunden werden');
      
      // Fallback: direktes Einfügen in das Formular, falls der Editor nicht verfügbar ist
      const currentContent = formData.value.content || '';
      const imgHtml = `<img src="${imageUrl}" alt="${altText}" class="img-fluid" loading="lazy">`;
      formData.value.content = currentContent + imgHtml;
      
      // Media Manager Dialog schließen
      showMediaManager.value = false;
    }
  } catch (err) {
    console.error('Fehler beim Einfügen des Bildes:', err);
    toast.error('Fehler beim Einfügen des Bildes: ' + err.message);
  }
};

// Reference to CKEditor instance
const editorInstance = ref(null);

// Event handler when editor is ready
const onEditorReady = (editor) => {
  editorInstance.value = editor;
  
  // Set initial data if we have content
  if (formData.value.content) {
    editor.setData(formData.value.content);
  }
  
  // Update content when editor data changes
  editor.model.document.on('change:data', () => {
    formData.value.content = editor.getData();
  });
};

// Zustand
const staticContents = ref([]);
const loading = ref(false);
const saving = ref(false);
const editMode = ref(false);
const currentContentId = ref(null);
const activeTab = ref('pages'); // Startseite ist "Seiten"
const selectedPage = ref(''); // Ausgewählte Seite für Filterung
const showMediaManager = ref(false); // Media Manager Dialog anzeigen/ausblenden
const previewTab = ref('preview'); // Vorschau-Tab Standardeinstellung
// Store
const coreStore = useCore();

// Konfigurationsoptionen mit dem Store verbinden (computed, damit sie reaktiv sind)
const useDirectPaths = computed(() => coreStore.getUseDirectStaticPaths);
const useInFooterNavigation = computed(() => coreStore.getUseDbFooterNavigation);

// Lokale editierbare Kopien für die Formularsteuerung
const localUseDirectPaths = ref(useDirectPaths.value);
const localUseInFooterNavigation = ref(useInFooterNavigation.value);

// Laden der aktuellen Einstellungen beim Mounten
onMounted(async () => {
  await coreStore.loadSystemSettings();
  localUseDirectPaths.value = useDirectPaths.value;
  localUseInFooterNavigation.value = useInFooterNavigation.value;
});

// Wenn sich die globalen Einstellungen ändern, lokale Kopien aktualisieren
watch(useDirectPaths, (newValue) => {
  localUseDirectPaths.value = newValue;
});

watch(useInFooterNavigation, (newValue) => {
  localUseInFooterNavigation.value = newValue;
});

// Methode zum Speichern der Systemeinstellungen
const updateSystemSettings = async () => {
  try {
    // Nur Super-Admin kann Einstellungen ändern
    if (!coreStore.isSuperOrganizer) {
      toast.error('Super-Admin-Rechte erforderlich, um Systemeinstellungen zu ändern');
      return;
    }
    
    // Aktualisiere Einstellungen über den Store
    await coreStore.updateSystemSettings({
      useDirectStaticPaths: localUseDirectPaths.value,
      useDbFooterNavigation: localUseInFooterNavigation.value
    });
    
    toast.success('Systemeinstellungen wurden aktualisiert');
  } catch (error) {
    console.error('Fehler beim Aktualisieren der Systemeinstellungen:', error);
    toast.error('Fehler beim Aktualisieren der Systemeinstellungen: ' + error.message);
  }
};

// Form-Daten
const formData = ref({
  pageKey: '',
  sectionKey: '',
  title: '',
  content: '',
  ordering: 0,
  isPublished: true
});

// Einzigartige Seiten für die Vorschau-Links
const uniquePages = computed(() => {
  const pages = new Set();
  staticContents.value.forEach(content => {
    pages.add(content.pageKey);
  });
  return Array.from(pages);
});

// Gefilterte Abschnitte basierend auf der ausgewählten Seite
const filteredSections = computed(() => {
  if (!selectedPage.value) {
    return staticContents.value;
  }
  
  return staticContents.value.filter(content => 
    content.pageKey === selectedPage.value
  ).sort((a, b) => a.ordering - b.ordering);
});

// Zählt die Anzahl der Abschnitte für eine bestimmte Seite
const countSections = (pageKey) => {
  return staticContents.value.filter(content => 
    content.pageKey === pageKey
  ).length;
};

// Wählt eine Seite aus und wechselt zum Abschnitts-Tab
const selectPage = (pageKey) => {
  selectedPage.value = pageKey;
  activeTab.value = 'sections';
};

// Erstellt eine neue Seite (wechselt zum Editor-Tab)
const createNewPage = () => {
  resetForm();
  activeTab.value = 'editor';
  
  // Reset the editor content if it exists
  if (editorInstance.value) {
    editorInstance.value.setData('');
  }
};

// Bereitet das Formular für einen neuen Abschnitt auf der ausgewählten Seite vor
const prepareNewSection = () => {
  resetForm();
  formData.value.pageKey = selectedPage.value;
  editMode.value = false;
  
  // Reset the editor content if it exists
  if (editorInstance.value) {
    editorInstance.value.setData('');
  }
};

// Apollo-Client
const { resolveClient } = useApolloClient();



// GraphQL-Queries und Mutations
const FETCH_STATIC_CONTENTS = gql`
  query GetAllStaticContents {
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
`;

const CREATE_STATIC_CONTENT = gql`
  mutation CreateStaticContent($input: CreateStaticContentInput!) {
    createStaticContent(input: $input) {
      id
      pageKey
      sectionKey
      title
      content
      ordering
      isPublished
    }
  }
`;

const UPDATE_STATIC_CONTENT = gql`
  mutation UpdateStaticContent($input: UpdateStaticContentInput!) {
    updateStaticContent(input: $input) {
      id
      pageKey
      sectionKey
      title
      content
      ordering
      isPublished
    }
  }
`;

const TOGGLE_STATIC_CONTENT_PUBLISHED = gql`
  mutation ToggleStaticContentPublished($id: ID!, $isPublished: Boolean!) {
    toggleStaticContentPublished(id: $id, isPublished: $isPublished) {
      id
      isPublished
    }
  }
`;

// Methoden
const fetchStaticContents = async () => {
  loading.value = true;
  
  try {
    const client = resolveClient();
    const result = await client.query({
      query: FETCH_STATIC_CONTENTS,
      fetchPolicy: 'network-only'
    });
    
    // Erstelle eine Kopie des Arrays und sortiere diese
    staticContents.value = [...(result.data.staticContents || [])].sort((a, b) => {
      if (a.pageKey !== b.pageKey) {
        return a.pageKey.localeCompare(b.pageKey);
      }
      return a.ordering - b.ordering;
    });
  } catch (err) {
    console.error('Failed to load static contents:', err);
    toast.error('Fehler beim Laden der statischen Inhalte');
  } finally {
    loading.value = false;
  }
};

const editContent = async (content) => {
  try {
    loading.value = true;
    
    // Da wir den vollständigen Content bereits im content-Objekt haben,
    // können wir ihn direkt im Formular verwenden
    formData.value = {
      pageKey: content.pageKey,
      sectionKey: content.sectionKey,
      title: content.title || '',
      content: content.content || '', // Falls content.content fehlt, laden wir es
      ordering: content.ordering || 0,
      isPublished: content.isPublished
    };
    
    // Wenn das Content-Feld fehlt, laden wir es nach
    if (!content.content) {
      console.log('Content field missing, fetching from API');
      const client = resolveClient();
      try {
        const result = await client.query({
          query: gql`
            query GetStaticContentById($id: ID!) {
              staticContent(id: $id) {
                id
                pageKey
                sectionKey
                title
                content
                ordering
                isPublished
              }
            }
          `,
          variables: { id: content.id },
          fetchPolicy: 'network-only'
        });
        
        const fullContent = result.data.staticContent;
        
        if (fullContent) {
          formData.value.content = fullContent.content;
        } else {
          // Wenn der API-Aufruf null zurückgibt, zeigen wir einen Fehler an
          console.error('API returned null for content ID:', content.id);
          toast.error('Fehler: Der Server hat keine Daten für diesen Inhalt zurückgegeben. Prüfe deine Berechtigungen.');
          
          // Für Debugging: Sende Informationen, die helfen könnten, das Problem zu diagnostizieren
          console.log('User context:', await getUserContext());
          return; // Abbrechen
        }
      } catch (err) {
        console.error('GraphQL query failed:', err);
        toast.error('GraphQL-Fehler: ' + (err.message || 'Unbekannter Fehler'));
        return; // Abbrechen
      }
    }
    
    editMode.value = true;
    currentContentId.value = content.id;
    
    // Wechsle zum Editor-Tab
    activeTab.value = 'editor';
    
    // Set the content in the editor if it exists
    if (editorInstance.value && formData.value.content) {
      // Use setTimeout to ensure the editor is fully initialized
      setTimeout(() => {
        editorInstance.value.setData(formData.value.content);
      }, 100);
    }
    
    console.log('Content geladen, Editor wird ihn beim nächsten Rendern anzeigen');
  } catch (err) {
    console.error('Failed to load content for editing:', err);
    toast.error('Fehler beim Laden des Inhalts zum Bearbeiten: ' + err.message);
  } finally {
    loading.value = false;
  }
};


const editorContainerElement = ref(null);
const editorElement = ref(null);


// Hilfsfunktion, um Kontext des aktuellen Benutzers zu erhalten (für Debugging)
const getUserContext = async () => {
  try {
    const client = resolveClient();
    
    // Zunächst prüfen wir die JWT-Token im localStorage
    const authToken = localStorage.getItem('apollo-token');
    console.log('JWT Token vorhanden:', !!authToken);
    if (authToken) {
      try {
        // Token decodieren (ohne Signaturprüfung)
        const parts = authToken.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(atob(parts[1]));
          console.log('JWT Payload:', payload);
          
          // Prüfen, ob der Token abgelaufen ist
          const now = Math.floor(Date.now() / 1000);
          if (payload.exp && payload.exp < now) {
            console.log('JWT Token ist abgelaufen!', {
              expiresAt: new Date(payload.exp * 1000).toLocaleString(),
              currentTime: new Date().toLocaleString()
            });
          }
        }
      } catch (e) {
        console.error('Fehler beim Decodieren des Tokens:', e);
      }
    }
    
    // Jetzt versuchen wir, den aktuellen Benutzer zu laden
    const result = await client.query({
      query: gql`
        query GetCurrentUser {
          me {
            id
            username
            super_admin
            can_edit_content
          }
        }
      `,
      fetchPolicy: 'network-only'
    });
    
    console.log('Aktuelle Benutzerrechte:', result.data.me);
    return result.data.me;
  } catch (err) {
    console.error('Failed to get user context:', err);
    
    // Bei Fehlern mehr Diagnose-Infos anzeigen
    console.log('Error details:', {
      name: err.name,
      message: err.message,
      networkError: err.networkError,
      graphQLErrors: err.graphQLErrors
    });
    
    return 'Error fetching user context';
  }
};

const cancelEdit = () => {
  editMode.value = false;
  currentContentId.value = null;
  resetForm();
  
  // Reset the editor if it exists
  if (editorInstance.value) {
    editorInstance.value.setData('');
  }
  
  // Zurück zur Abschnittsübersicht
  activeTab.value = 'sections';
};

const resetForm = () => {
  formData.value = {
    pageKey: '',
    sectionKey: '',
    title: '',
    content: '',
    ordering: 0,
    isPublished: true
  };
};

// Prüft, ob ein Abschnitt für eine Seite bereits existiert
const checkDuplicateSection = () => {
  if (editMode.value) return; // Nicht prüfen, wenn wir im Bearbeitungsmodus sind
  
  const pageKey = formData.value.pageKey.trim();
  const sectionKey = formData.value.sectionKey.trim();
  
  if (!pageKey || !sectionKey) return;
  
  const sectionKeyInput = document.getElementById('sectionKey');
  if (!sectionKeyInput) return;
  
  // Prüfen, ob diese Kombination bereits existiert
  const duplicate = staticContents.value.find(
    item => item.pageKey === pageKey && item.sectionKey === sectionKey
  );
  
  if (duplicate) {
    sectionKeyInput.classList.add('is-invalid');
  } else {
    sectionKeyInput.classList.remove('is-invalid');
  }
};

// Optimierte Methode für direkten GraphQL-API-Zugriff ohne Apollo-Client
const directApiSaveContent = async (contentData) => {
  try {
    const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';
    const GRAPHQL_ENDPOINT = `${API_URL}/graphql`;
    
    // JWT-Token aus localStorage holen
    const authToken = localStorage.getItem('apollo-token');
    if (!authToken) {
      throw new Error('Nicht angemeldet. Bitte melden Sie sich erneut an.');
    }
    
    // GraphQL-Mutation abhängig davon erstellen, ob wir einen neuen Inhalt oder ein Update haben
    const isUpdate = !!contentData.id;
    
    let mutationQuery;
    if (isUpdate) {
      mutationQuery = `
        mutation UpdateStaticContent($input: UpdateStaticContentInput!) {
          updateStaticContent(input: $input) {
            id
            pageKey
            sectionKey
            title
            isPublished
          }
        }
      `;
    } else {
      mutationQuery = `
        mutation CreateStaticContent($input: CreateStaticContentInput!) {
          createStaticContent(input: $input) {
            id
            pageKey
            sectionKey
            title
            isPublished
          }
        }
      `;
    }
    
    console.log(`Sending ${isUpdate ? 'update' : 'create'} mutation with direct API call`);
    
    // Anfrage an die API senden
    const response = await fetch(GRAPHQL_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({
        query: mutationQuery,
        variables: {
          input: contentData
        }
      })
    });
    
    // Antwort verarbeiten
    const responseData = await response.json();
    
    // Detaillierte Fehleranalyse
    if (responseData.errors) {
      const errorDetail = {
        message: responseData.errors[0].message,
        path: responseData.errors[0].path,
        extensions: responseData.errors[0].extensions,
        fullError: JSON.stringify(responseData.errors)
      };
      console.error('GraphQL error details:', errorDetail);
      throw new Error(`GraphQL Fehler: ${errorDetail.message}`);
    }
    
    // Erfolgreiche Antwort
    return responseData.data;
  } catch (error) {
    console.error('Direct API Error:', error);
    throw error;
  }
};


// Verbesserte Methode zum Speichern des Inhalts mit mehreren Fallback-Strategien
const saveContent = async () => {
  saving.value = true;
  
  try {
    // Grundlegende Validierung
    const pageKey = formData.value.pageKey.trim();
    const sectionKey = formData.value.sectionKey.trim();
    const title = formData.value.title.trim();
    const ordering = parseInt(formData.value.ordering, 10) || 0;
    
    if (!pageKey || !sectionKey) {
      toast.error('Bitte füllen Sie mindestens Seitenschlüssel und Abschnittschlüssel aus.');
      saving.value = false;
      return;
    }
    
    // Prüfe auf Duplikate, wenn wir einen neuen Eintrag erstellen
    if (!editMode.value) {
      const duplicateContent = staticContents.value.find(
        item => item.pageKey === pageKey && item.sectionKey === sectionKey
      );
      
      if (duplicateContent) {
        toast.error(`Diese Kombination aus Seitenschlüssel "${pageKey}" und Abschnittschlüssel "${sectionKey}" existiert bereits.`);
        
        // Fokus auf das Feld setzen
        setTimeout(() => {
          const sectionKeyInput = document.getElementById('sectionKey');
          if (sectionKeyInput) {
            sectionKeyInput.focus();
            sectionKeyInput.classList.add('is-invalid');
          }
        }, 100);
        
        saving.value = false;
        return;
      }
    }
    
    // HTML-Inhalt bereinigen und optimieren
    const cleanContent = formData.value.content;
    console.log('HTML-Inhalt optimiert, Länge:', cleanContent.length);
    
    // 1. Strategien - Vollständige Speicherung versuchen
    // ================================================
    
    toast.info('Speichere Inhalt...');
    
    if (editMode.value) {
      // Update-Strategie
      try {
        const updateInput = {
          id: currentContentId.value,
          title,
          ordering,
          content: cleanContent,
          isPublished: formData.value.isPublished
        };
        
        // 1. Versuch: Versuch mit Apollo-Client
        const client = resolveClient();
        console.log('Update mit Apollo-Client');
        
        try {
          const result = await client.mutate({
            mutation: UPDATE_STATIC_CONTENT,
            variables: {
              input: updateInput
            }
          });
          
          if (result.data?.updateStaticContent) {
            toast.success('Inhalt erfolgreich aktualisiert');
            editMode.value = false;
            currentContentId.value = null;
            selectedPage.value = pageKey;
            activeTab.value = 'sections';
            
            await fetchStaticContents();
            resetForm();
            return;
          }
        } catch (apolloError) {
          console.warn('Apollo-Client Update fehlgeschlagen, versuche direkten API-Zugriff:', apolloError.message);
          
          // 2. Versuch: Direkter API-Zugriff (ohne Apollo-Client)
          try {
            const apiResult = await directApiSaveContent(updateInput);
            
            if (apiResult?.updateStaticContent) {
              toast.success('Inhalt erfolgreich aktualisiert (direkter API-Zugriff)');
              editMode.value = false;
              currentContentId.value = null;
              selectedPage.value = pageKey;
              activeTab.value = 'sections';
              
              await fetchStaticContents();
              resetForm();
              return;
            }
          } catch (directApiError) {
            console.error('Direkter API-Zugriff für Update fehlgeschlagen:', directApiError);
            // Weiter mit Fallback-Strategien
          }
        }
        
        // 3. Versuch: Nur Titel und Metadaten ohne Inhalt aktualisieren
        console.log('Fallback: Nur Metadaten ohne Inhalt aktualisieren');
        
        try {
          const metaResult = await client.mutate({
            mutation: UPDATE_STATIC_CONTENT,
            variables: {
              input: {
                id: currentContentId.value,
                title,
                ordering,
                isPublished: formData.value.isPublished
                // Kein content-Feld
              }
            }
          });
          
          if (metaResult.data?.updateStaticContent) {
            toast.warning('Nur Metadaten wurden aktualisiert. Der Inhalt konnte nicht gespeichert werden.');
            editMode.value = false;
            currentContentId.value = null;
            selectedPage.value = pageKey;
            activeTab.value = 'sections';
            
            await fetchStaticContents();
            resetForm();
            return;
          }
        } catch (metaError) {
          console.error('Selbst einfaches Meta-Update fehlgeschlagen:', metaError);
          throw metaError; // Lasse den globalen Error-Handler übernehmen
        }
      } catch (updateError) {
        console.error('Alle Update-Versuche fehlgeschlagen:', updateError);
        throw updateError;
      }
    } else {
      // Create-Strategie
      try {
        // Bereite Eingabedaten für die Erstellung vor
        const createInput = {
          pageKey,
          sectionKey,
          title,
          content: cleanContent,
          ordering,
          isPublished: formData.value.isPublished
        };
        
        // 1. Versuch: Kompletten Inhalt mit Apollo-Client speichern
        const client = resolveClient();
        console.log('Create mit Apollo-Client');
        
        try {
          const result = await client.mutate({
            mutation: CREATE_STATIC_CONTENT,
            variables: {
              input: createInput
            }
          });
          
          if (result.data?.createStaticContent) {
            toast.success('Neuer Inhalt erfolgreich erstellt');
            selectedPage.value = pageKey;
            activeTab.value = 'sections';
            
            await fetchStaticContents();
            resetForm();
            return;
          }
        } catch (apolloError) {
          console.warn('Apollo-Client Create fehlgeschlagen, versuche direkten API-Zugriff:', apolloError.message);
          
          // 2. Versuch: Direkter API-Zugriff (ohne Apollo-Client)
          try {
            const apiResult = await directApiSaveContent(createInput);
            
            if (apiResult?.createStaticContent) {
              toast.success('Neuer Inhalt erfolgreich erstellt (direkter API-Zugriff)');
              selectedPage.value = pageKey;
              activeTab.value = 'sections';
              
              await fetchStaticContents();
              resetForm();
              return;
            }
          } catch (directApiError) {
            console.error('Direkter API-Zugriff für Create fehlgeschlagen:', directApiError);
            // Weiter mit Fallback-Strategien
          }
        }
        
        // 3. Versuch: Chunked Content-Strategie - nur Teilinhalt speichern
        let shortenedContent = cleanContent;
        const maxChunkSize = 1000; // Maximal 1000 Zeichen pro Versuch
        
        if (shortenedContent.length > maxChunkSize) {
          console.log(`Versuche gekürzten Inhalt (max. ${maxChunkSize} Zeichen)`);
          shortenedContent = shortenedContent.substring(0, maxChunkSize) + '...';
          
          try {
            const chunkResult = await client.mutate({
              mutation: CREATE_STATIC_CONTENT,
              variables: {
                input: {
                  ...createInput,
                  content: shortenedContent
                }
              }
            });
            
            if (chunkResult.data?.createStaticContent) {
              toast.warning('Inhalt wurde erstellt, aber gekürzt. Der vollständige Inhalt war zu groß für den Server.');
              selectedPage.value = pageKey;
              activeTab.value = 'sections';
              
              await fetchStaticContents();
              resetForm();
              return;
            }
          } catch (chunkError) {
            console.error('Auch gekürzter Inhalt schlägt fehl:', chunkError);
            // Letzter Fallback
          }
        }
        
        // 4. Letzter Versuch: Minimaler Inhalt
        console.log('Letzter Fallback: Minimaler Inhalt');
        
        try {
          const minimalResult = await client.mutate({
            mutation: CREATE_STATIC_CONTENT,
            variables: {
              input: {
                pageKey,
                sectionKey,
                content: '<p>...</p>', // Minimaler Inhalt
                title,
                ordering,
                isPublished: false // Als Entwurf speichern
              }
            }
          });
          
          if (minimalResult.data?.createStaticContent) {
            const createdId = minimalResult.data.createStaticContent.id;
            toast.warning('Eintrag konnte nur als leerer Entwurf erstellt werden. Bitte bearbeiten Sie ihn später erneut.');
            selectedPage.value = pageKey;
            activeTab.value = 'sections';
            
            await fetchStaticContents();
            resetForm();
            return;
          }
        } catch (minimalError) {
          console.error('Selbst minimaler Inhalt schlägt fehl:', minimalError);
          throw minimalError;
        }
      } catch (createError) {
        console.error('Alle Create-Versuche fehlgeschlagen:', createError);
        throw createError;
      }
    }
  } catch (err) {
    console.error('Fehler beim Speichern:', err);
    
    // Verbesserte Fehleranalyse und -behandlung mit spezieller Erkennung von Duplikat-Fehlern
    const errorMessage = err.message || '';
    
    // Spezielle Erkennung des Duplikat-Fehlers
    if (errorMessage.includes('Failed to insert static content') || 
        errorMessage.includes('ER_DUP_ENTRY') || 
        errorMessage.includes('Duplicate entry')) {
      
      console.error('Duplikat-Fehler erkannt:', err);
      toast.error(`Diese Kombination aus Seitenschlüssel "${pageKey}" und Abschnittschlüssel "${sectionKey}" existiert bereits. Bitte wählen Sie einen anderen Abschnittschlüssel.`);
      
      // Fokus auf das Feld setzen
      setTimeout(() => {
        const sectionKeyInput = document.getElementById('sectionKey');
        if (sectionKeyInput) {
          sectionKeyInput.focus();
          sectionKeyInput.classList.add('is-invalid');
        }
      }, 100);
      
      return; // Früher beenden, da wir den Fehler bereits spezifisch behandelt haben
    }
    
    // Normale GraphQL-Fehlerbehandlung
    if (err.graphQLErrors) {
      console.error('GraphQL-Fehler:', err.graphQLErrors);
      
      // Detaillierte Fehleranalyse
      const errorMessages = err.graphQLErrors.map(e => {
        let details = '';
        if (e.extensions?.code) {
          details += ` (Code: ${e.extensions.code})`;
        }
        if (e.extensions?.exception?.stacktrace) {
          console.error('Server stacktrace:', e.extensions.exception.stacktrace);
        }
        
        // Nach Duplikat-Fehlern im Backend suchen
        const errMsg = e.message || '';
        if (errMsg.includes('ER_DUP_ENTRY') || errMsg.includes('Duplicate entry') || 
            (e.extensions?.exception?.sqlMessage && e.extensions.exception.sqlMessage.includes('Duplicate entry'))) {
          return `Dieser Abschnitt existiert bereits. Bitte wählen Sie einen anderen Abschnittschlüssel.`;
        }
        
        return e.message + details;
      }).join('\n- ');
      
      toast.error(`GraphQL-Fehler:\n- ${errorMessages}`);
    } else if (err.networkError) {
      console.error('Netzwerkfehler:', err.networkError);
      if (err.networkError.statusCode) {
        toast.error(`Netzwerkfehler (${err.networkError.statusCode}): Bitte prüfen Sie Ihre Verbindung zum Server.`);
      } else {
        toast.error('Netzwerkfehler: Bitte prüfen Sie Ihre Verbindung zum Server.');
      }
    } else {
      toast.error('Fehler beim Speichern: ' + (errorMessage || 'Unbekannter Fehler'));
    }
    
    // Spezifischere Hilfestellung für den Benutzer
    const isCreation = !editMode.value;
    if (isCreation) {
      toast.info('Bitte überprüfen Sie, ob die Kombination aus Seitenschlüssel und Abschnittschlüssel bereits existiert, und wählen Sie bei Bedarf einen anderen Schlüssel.');
    } else {
      toast.info('Bitte prüfen Sie, ob Ihre Eingaben korrekt sind und versuchen Sie, den Inhalt zu vereinfachen oder in kleinere Abschnitte aufzuteilen.');
    }
  } finally {
    saving.value = false;
  }
};

const togglePublishStatus = async (content) => {
  try {
    loading.value = true;
    
    const client = resolveClient();
    const result = await client.mutate({
      mutation: TOGGLE_STATIC_CONTENT_PUBLISHED,
      variables: {
        id: content.id,
        isPublished: !content.isPublished
      }
    });
    
    if (result.data.toggleStaticContentPublished) {
      toast.success(
        content.isPublished 
          ? 'Inhalt wurde verborgen' 
          : 'Inhalt wurde veröffentlicht'
      );
      await fetchStaticContents();
    }
  } catch (err) {
    console.error('Failed to toggle publish status:', err);
    toast.error('Fehler beim Ändern des Veröffentlichungsstatus');
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.media-manager-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1050;
}

.media-manager-dialog {
  overflow-y: auto;
}

/* HTML-Vorschau Styling */
.html-preview img {
  max-width: 100%;
  height: auto;
}

/* CKEditor Container Styling */
.editor-container {
  margin-bottom: 1.5rem;
}

/* Globale CKEditor Styles - diese werden nicht von scoped beeinflusst */
:deep(.ck-editor__editable) {
  min-height: 300px;
  max-height: 600px;
  overflow-y: auto;
}

:deep(.ck-editor__editable_inline) {
  padding: 0 1rem;
}

:deep(.ck-content img) {
  max-width: 100%;
  height: auto;
}

:deep(.ck-editor__top) {
  position: sticky;
  top: 0;
  background: white;
  z-index: 10;
}

/* Spezielle Styles für die Bildgrößenänderung */
:deep(.ck-content .image) {
  position: relative;
  margin: 1em 0;
}

:deep(.ck-content .image.image_resized) {
  box-sizing: border-box;
  display: block;
  max-width: 100%;
}

:deep(.ck-content .image.image_resized img) {
  width: 100%;
}

:deep(.ck-content .image img) {
  display: block;
  margin: 0 auto;
  max-width: 100%;
}

/* Styles für die CKEditor Full Screen Funktionalität */
:deep(.ck-editor__editable_fullscreen) {
  min-height: calc(100vh - 130px);
  max-height: calc(100vh - 130px);
}

:deep(.editor-container_include-fullscreen) {
  position: relative;
  z-index: 1;
}

:deep(.ck-editor_fullscreen) {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 9999;
  width: 100% !important;
  background: white;
  padding: 2rem;
  overflow-y: auto;
}

:deep(.ck-editor_fullscreen .ck-editor__editable) {
  min-height: calc(100vh - 100px);
  max-height: calc(100vh - 100px);
}

:deep(.ck-resize-handle) {
  display: block !important;
}

/* Styles für die Resize-Handles */
:deep(.ck-content .image .ck-resize-handle) {
  display: block;
}
</style>