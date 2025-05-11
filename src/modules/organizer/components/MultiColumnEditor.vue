<template>
  <div class="multi-column-editor">
    <div class="mb-3">
      <label class="form-label">Anzahl der Spalten</label>
      <div class="btn-group w-100">
        <button
          type="button"
          class="btn"
          :class="columnCount === 2 ? 'btn-primary' : 'btn-outline-primary'"
          @click="setColumnCount(2)"
        >
          2 Spalten
        </button>
        <button
          type="button"
          class="btn"
          :class="columnCount === 3 ? 'btn-primary' : 'btn-outline-primary'"
          @click="setColumnCount(3)"
        >
          3 Spalten
        </button>
        <button
          type="button"
          class="btn"
          :class="columnCount === 4 ? 'btn-primary' : 'btn-outline-primary'"
          @click="setColumnCount(4)"
        >
          4 Spalten
        </button>
      </div>
    </div>

    <div class="row">
      <div
        v-for="(column, index) in columns"
        :key="`column-${columnCount}-${index}`"
        :class="getColumnClass()"
      >
        <div class="card mb-3">
          <div class="card-header bg-light d-flex justify-content-between align-items-center">
            <h6 class="mb-0">Spalte {{ index + 1 }}</h6>
            <div>
              <button
                v-if="columns.length > 2"
                type="button"
                class="btn btn-sm btn-outline-danger"
                @click="removeColumn(index)"
                title="Spalte entfernen"
              >
                <i class="bi bi-trash"></i>
              </button>
            </div>
          </div>
          <div class="card-body">
            <div :id="`editor-container-${index}`" class="editor-container">
              <div class="d-flex justify-content-end gap-2 mb-2">
                <button
                  type="button"
                  class="btn btn-outline-primary btn-sm"
                  @click="showMediaManager = true; currentColumnIndex = index"
                >
                  <i class="bi bi-image"></i> Medienverwaltung
                </button>
              </div>
              <div class="editor-container_classic-editor editor-container_include-style">
                <div class="editor-container__editor">
                  <ckeditor
                    :modelValue="column.content"
                    :editor="editorClass"
                    :config="editorConfig"
                    @update:modelValue="value => updateColumnDirectly(index, value)"
                    @ready="onEditorReady($event, index)"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="mt-2 mb-4" v-if="columns.length < 4">
      <button
        type="button"
        class="btn btn-outline-success"
        @click="addColumn"
      >
        <i class="bi bi-plus-circle me-1"></i> Spalte hinzufügen
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

    <div class="mb-3">
      <h6>Vorschau:</h6>
      <div class="border rounded p-3 bg-light">
        <div class="row">
          <div
            v-for="(column, index) in columns"
            :key="`preview-${index}`"
            :class="getColumnClass()"
          >
            <div class="border rounded p-2 bg-white h-100" v-html="column.content"></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { Ckeditor } from '@ckeditor/ckeditor5-vue';
import MediaManager from './MediaManager.vue';

export default {
  name: 'MultiColumnEditor',
  components: {
    ckeditor: Ckeditor,
    MediaManager
  },

  props: {
    /**
     * The initial value for the columns
     */
    value: {
      type: Array,
      default: () => []
    },

    /**
     * The initial column count
     */
    initialColumnCount: {
      type: Number,
      default: 2,
      validator: val => [2, 3, 4].includes(val)
    },

    /**
     * CKEditor instance to use (not used anymore due to proxy errors)
     */
    editorClass: {
      type: Function,
      required: true
    },

    /**
     * CKEditor configuration (not used anymore due to proxy errors)
     */
    editorConfig: {
      type: Object,
      required: true
    }
  },

  data() {
    return {
      columnCount: this.initialColumnCount,
      columns: [],
      editorInstances: [],
      showMediaManager: false,
      currentColumnIndex: null
    };
  },
  
  watch: {
    value: {
      handler(newVal, oldVal) {
        // Avoid infinite update loops by checking if the values are significantly different
        const newLength = newVal && Array.isArray(newVal) ? newVal.length : 0;
        const oldLength = oldVal && Array.isArray(oldVal) ? oldVal.length : -1;
        
        // Only update if this is the initial value or the array length has changed
        if (oldVal === undefined || newLength !== oldLength) {
          console.log('MultiColumnEditor: value changed significantly', { 
            newLength, 
            oldLength
          });
          if (newVal && Array.isArray(newVal)) {
            this.initFromValue();
          }
        }
      },
      immediate: true
    }
  },
  
  methods: {
    /**
     * Insert media into the editor at the current column
     */
    insertMedia(media) {
      try {
        if (this.currentColumnIndex === null) return;

        // Get the editor instance for the current column
        const editor = this.editorInstances[this.currentColumnIndex];
        if (!editor) {
          console.error('No editor instance found for column', this.currentColumnIndex);
          return;
        }

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
          this.updateColumnDirectly(this.currentColumnIndex, editor.getData());
        }

        // Close the media manager
        this.showMediaManager = false;
      } catch (err) {
        console.error('Fehler beim Einfügen des Bildes:', err);
      }
    },

    /**
     * Handle the editor ready event
     */
    onEditorReady(editor, index) {
      // Store the editor instance for later reference if needed
      if (!this.editorInstances) {
        this.editorInstances = [];
      }
      this.editorInstances[index] = editor;

      // Set initial content if available
      if (this.columns[index]?.content) {
        editor.setData(this.columns[index].content);
      }
    },

    /**
     * Initialize the columns from the provided value
     */
    initFromValue() {
      console.log('MultiColumnEditor: initFromValue called');
      
      if (this.value && Array.isArray(this.value)) {
        // Make a clean copy of the value without __typename
        this.columns = this.value.map(column => ({
          content: column.content || ''
        }));
        
        // Ensure we have at least 2 columns
        if (this.columns.length < 2) {
          for (let i = this.columns.length; i < 2; i++) {
            this.columns.push({ content: '' });
          }
        }
        
        this.columnCount = Math.min(Math.max(this.columns.length, 2), 4);
      } else {
        console.warn('MultiColumnEditor: Invalid value provided:', this.value);
        
        // Create default columns
        this.columns = [];
        for (let i = 0; i < this.columnCount; i++) {
          this.columns.push({ content: '' });
        }
      }
    },
    
    /**
     * Update column content from CKEditor
     */
    updateColumnDirectly(index, newContent) {
      console.log(`CKEditor update for column ${index}: "${newContent?.substring(0, 30)}..."`);

      if (this.columns && index >= 0 && index < this.columns.length) {
        // Update content directly
        this.columns[index].content = newContent || '';

        // Log the update
        console.log(`Column ${index} content updated via CKEditor.`);

        // Emit changes immediately
        this.$emit('input', [...this.columns]);
        this.$emit('update:modelValue', [...this.columns]);
        this.$emit('change', {
          columnCount: this.columnCount,
          columns: [...this.columns]
        });
      }
    },
    
    /**
     * Set the number of columns
     */
    async setColumnCount(count) {
      if (![2, 3, 4].includes(count)) return;
      if (this.columnCount === count) return; // No change, skip processing
      
      this.columnCount = count;
      
      // Adjust columns array if needed
      if (this.columns.length < count) {
        // Add columns
        for (let i = this.columns.length; i < count; i++) {
          this.columns.push({ content: '' });
        }
      } else if (this.columns.length > count) {
        // Remove extra columns
        this.columns = this.columns.slice(0, count);
      }
      
      this.$emit('input', [...this.columns]);
      this.$emit('update:modelValue', [...this.columns]);
      this.$emit('change', { columnCount: count, columns: [...this.columns] });
    },
    
    /**
     * Add a new column
     */
    async addColumn() {
      if (this.columns.length >= 4) return; // Max 4 columns
      
      this.columns.push({ content: '' });
      this.columnCount = this.columns.length;
      
      this.$emit('input', [...this.columns]);
      this.$emit('update:modelValue', [...this.columns]);
      this.$emit('change', { columnCount: this.columnCount, columns: [...this.columns] });
    },
    
    /**
     * Remove a column
     */
    async removeColumn(index) {
      if (this.columns.length <= 2) return; // Min 2 columns
      
      this.columns.splice(index, 1);
      this.columnCount = this.columns.length;
      
      this.$emit('input', [...this.columns]);
      this.$emit('update:modelValue', [...this.columns]);
      this.$emit('change', { columnCount: this.columnCount, columns: [...this.columns] });
    },
    
    /**
     * Calculate the Bootstrap column class based on column count
     */
    getColumnClass() {
      switch (this.columnCount) {
        case 4:
          return 'col-md-3';
        case 3:
          return 'col-md-4';
        case 2:
        default:
          return 'col-md-6';
      }
    }
  },
  
  mounted() {
    console.log('MultiColumnEditor: mounted with value:', this.value);
    
    // Initialize with empty columns if no value provided
    if (!this.value || !this.value.length) {
      console.log('MultiColumnEditor: no initial value, creating empty columns');
      
      this.columns = [];
      for (let i = 0; i < this.columnCount; i++) {
        this.columns.push({ content: '' });
      }
      
      // Initial emit to ensure parent component has data
      this.$emit('input', [...this.columns]);
      this.$emit('update:modelValue', [...this.columns]);
      this.$emit('change', {
        columnCount: this.columnCount,
        columns: [...this.columns]
      });
    } else {
      console.log('MultiColumnEditor: mounted with existing value, will handle via watcher');
    }
  }
};
</script>

<style scoped>
.editor-container {
  min-height: 200px;
}

/* CKEditor styles - use :deep so they apply through component scoping */
:deep(.ck-editor__editable) {
  min-height: 200px;
  max-height: 400px;
  overflow-y: auto;
}

:deep(.ck-editor__editable_inline) {
  padding: 0 1rem;
}

:deep(.ck-content img) {
  max-width: 100%;
  height: auto;
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
</style>