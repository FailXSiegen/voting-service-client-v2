<template>
  <div class="accordion-editor">
    <div v-if="items.length > 0">
      <div class="mb-3">
        <h6>Akkordeon-Elemente:</h6>
      </div>
    
      <div 
        v-for="(item, index) in items" 
        :key="`accordion-item-${index}`"
        class="card mb-3"
      >
        <div class="card-header bg-light d-flex justify-content-between align-items-center">
          <h6 class="mb-0">Element {{ index + 1 }}</h6>
          <div>
            <button 
              type="button" 
              class="btn btn-sm btn-outline-secondary me-1"
              :disabled="index === 0"
              title="Nach oben verschieben"
              @click="moveItem(index, 'up')"
            >
              <i class="bi bi-arrow-up"></i>
            </button>
            <button 
              type="button" 
              class="btn btn-sm btn-outline-secondary me-1"
              :disabled="index === items.length - 1"
              title="Nach unten verschieben"
              @click="moveItem(index, 'down')"
            >
              <i class="bi bi-arrow-down"></i>
            </button>
            <button 
              type="button" 
              class="btn btn-sm btn-outline-danger"
              title="Element entfernen"
              @click="removeItem(index)"
            >
              <i class="bi bi-trash"></i>
            </button>
          </div>
        </div>
        <div class="card-body">
          <div class="mb-3">
            <label :for="'item-title-' + index" class="form-label">Titel</label>
            <input 
              :id="'item-title-' + index" 
              v-model="item.title"
              type="text"
              class="form-control"
              placeholder="Titel des Akkordeon-Elements"
              @input="updateItem(index)"
            >
          </div>
          <div class="mb-2">
            <label :for="'item-content-' + index" class="form-label">Inhalt</label>
            <div class="d-flex justify-content-end gap-2 mb-2">
              <button
                type="button"
                class="btn btn-outline-primary btn-sm"
                @click="showMediaManager = true; currentItemIndex = index"
              >
                <i class="bi bi-image"></i> Medienverwaltung
              </button>
            </div>
            <div
              :id="`accordion-editor-${index}`"
              class="editor-container"
            >
              <div class="editor-container_classic-editor editor-container_include-style">
                <div class="editor-container__editor">
                  <ckeditor
                    :model-value="item.content"
                    :editor="editorClass"
                    :config="editorConfig"
                    @update:model-value="value => updateItemContent(index, value)"
                    @ready="onEditorReady($event, index)"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <div class="mb-4">
      <button
        type="button"
        class="btn btn-outline-success"
        @click="addItem"
      >
        <i class="bi bi-plus-circle me-1"></i> Element hinzufügen
      </button>
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
</template>

<script>
import MediaManager from './MediaManager.vue';
import { Ckeditor } from '@ckeditor/ckeditor5-vue';

export default {
  name: 'AccordionEditor',
  components: {
    MediaManager,
    ckeditor: Ckeditor
  },
  
  props: {
    /**
     * The initial value for the accordion items
     */
    value: {
      type: Array,
      default: () => []
    },
    
    /**
     * CKEditor instance to use
     */
    editorClass: {
      type: Function,
      required: true
    },
    
    /**
     * CKEditor configuration
     */
    editorConfig: {
      type: Object,
      required: true
    }
  },
  
  data() {
    return {
      items: [],
      editors: [],
      showMediaManager: false,
      currentItemIndex: null
    };
  },
  
  watch: {
    value: {
      handler(newVal) {
        if (newVal && Array.isArray(newVal) && newVal.length > 0) {
          this.initFromValue();
        }
      },
      immediate: true
    }
  },
  
  mounted() {
    // Initialize with empty items if no value provided
    if (!this.value || !this.value.length) {
      // Add an empty item
      this.items.push({
        title: '',
        content: ''
      });
    }
  },
  
  methods: {
    /**
     * Insert media into the editor of the current accordion item
     */
    insertMedia(media) {
      try {
        if (this.currentItemIndex === null || !this.editors[this.currentItemIndex]) {
          console.error('No editor instance found for item', this.currentItemIndex);
          return;
        }

        const editor = this.editors[this.currentItemIndex];

        // Prepare image data
        const imageUrl = media.url;
        const altText = media.filename || 'Bild';

        // Insert image using CKEditor API
        editor.execute('insertImage', {
          source: {
            src: imageUrl,
            alt: altText
          }
        });

        // Update content in our data model
        if (typeof editor.getData === 'function') {
          this.updateItemContent(this.currentItemIndex, editor.getData());
        }

        // Close the media manager
        this.showMediaManager = false;
      } catch (err) {
        console.error('Fehler beim Einfügen des Bildes:', err);
      }
    },

    /**
     * Initialize the items from the provided value
     */
    initFromValue() {
      if (this.value && Array.isArray(this.value)) {
        // Make a defensive copy of the value array without __typename
        this.items = this.value.map(item => ({
          title: item.title || '',
          content: item.content || ''
        }));

        // Ensure we have at least one item
        if (this.items.length === 0) {
          this.items.push({ title: '', content: '' });
        }
      }
    },
    
    /**
     * Handle editor ready event
     */
    onEditorReady(editor, index) {
      // Store the editor instance
      if (!this.editors) {
        this.editors = [];
      }
      this.editors[index] = editor;

      // Set initial content if available
      if (this.items[index]?.content) {
        editor.setData(this.items[index].content);
      }
    },
    
    /**
     * Update item content data
     */
    updateItemContent(index, content) {
      if (this.items[index]) {
        this.items[index].content = content;
        this.emitUpdate();

        // Trigger immediate rendering update for previews
        this.$nextTick(() => {
          // Ensure data binding is updated for preview
          this.$forceUpdate();
        });
      }
    },
    
    /**
     * Update item data
     */
    updateItem(index) {
      this.emitUpdate();
    },
    
    /**
     * Add a new accordion item
     */
    addItem() {
      this.items.push({
        title: '',
        content: ''
      });

      this.emitUpdate();
    },

    /**
     * Remove an accordion item
     */
    removeItem(index) {
      // Remove the item
      this.items.splice(index, 1);

      // Remove the editor instance
      if (this.editors && this.editors[index]) {
        this.editors.splice(index, 1);
      }

      this.emitUpdate();
    },

    /**
     * Move an item up or down in the list
     */
    moveItem(index, direction) {
      if (direction === 'up' && index > 0) {
        const temp = this.items[index];
        this.items[index] = this.items[index - 1];
        this.items[index - 1] = temp;
      } else if (direction === 'down' && index < this.items.length - 1) {
        const temp = this.items[index];
        this.items[index] = this.items[index + 1];
        this.items[index + 1] = temp;
      }

      this.emitUpdate();
    },
    
    /**
     * Emit update events
     */
    emitUpdate() {
      const updatedItems = [...this.items];

      // Emit events for v-model compatibility
      this.$emit('input', updatedItems);
      this.$emit('update:modelValue', updatedItems);
      this.$emit('change', updatedItems);

      // Force component update to refresh previews
      this.$forceUpdate();
    }
  }
};
</script>

<style scoped>
.editor-container {
  min-height: 200px;
}

.accordion-body {
  background-color: #fff;
}

/* Media Manager Modal Styles */
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

/* CKEditor styles */
:deep(.ck-editor__editable) {
  min-height: 200px;
  max-height: 400px;
  overflow-y: auto;
}

:deep(.ck-content img) {
  max-width: 100%;
  height: auto;
}
</style>