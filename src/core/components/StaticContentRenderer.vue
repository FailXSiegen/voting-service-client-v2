<template>
  <div class="static-content-renderer">
    <div v-if="loading" class="text-center py-4">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Wird geladen...</span>
      </div>
    </div>
    
    <div v-else-if="error" class="alert alert-danger">
      {{ error }}
    </div>
    
    <template v-else-if="content">
      <!-- Standard content -->
      <div v-if="contentType === 'standard'" v-html="content"></div>
      
      <!-- Multi-column content -->
      <multi-column-content 
        v-else-if="contentType === 'multi-column' && columnCount && columnsContent" 
        :column-count="columnCount" 
        :columns-content="columnsContent"
      />
      
      <!-- Accordion content -->
      <accordion-content 
        v-else-if="contentType === 'accordion' && accordionItems" 
        :accordion-items="accordionItems"
      />
      
      <!-- Default fallback if content type not recognized -->
      <div v-else v-html="content"></div>
    </template>
    
    <div v-else-if="!hideEmpty" class="alert alert-info">
      Kein Inhalt verfügbar.
    </div>
  </div>
</template>

<script>
import gql from 'graphql-tag';
import MultiColumnContent from './MultiColumnContent.vue';
import AccordionContent from './AccordionContent.vue';

export default {
  name: 'StaticContentRenderer',
  
  components: {
    MultiColumnContent,
    AccordionContent
  },
  
  props: {
    pageKey: {
      type: String,
      required: true
    },
    sectionKey: {
      type: String,
      required: true
    },
    hideEmpty: {
      type: Boolean,
      default: false
    }
  },
  
  data() {
    return {
      content: '',
      contentType: 'standard',
      columnCount: null,
      columnsContent: null,
      accordionItems: null,
      loading: true,
      error: null
    };
  },
  
  watch: {
    pageKey() {
      this.fetchContent();
    },
    sectionKey() {
      this.fetchContent();
    }
  },
  
  mounted() {
    this.fetchContent();
  },
  
  methods: {
    async fetchContent() {
      this.loading = true;
      this.error = null;
      
      try {
        const result = await this.$apollo.query({
          query: gql`
            query GetStaticContentBySection($pageKey: String!, $sectionKey: String!) {
              staticContentBySection(pageKey: $pageKey, sectionKey: $sectionKey) {
                id
                contentType
                content
                title
                columnCount
                columnsContent {
                  content
                }
                accordionItems {
                  title
                  content
                }
              }
            }
          `,
          variables: {
            pageKey: this.pageKey,
            sectionKey: this.sectionKey
          },
          fetchPolicy: 'cache-first'
        });
        
        const contentData = result.data.staticContentBySection;
        
        if (contentData) {
          this.content = contentData.content || '';
          this.contentType = contentData.contentType || 'standard';
          
          // Handle multi-column content
          if (contentData.contentType === 'multi-column' && contentData.columnCount) {
            this.columnCount = contentData.columnCount;
            this.columnsContent = contentData.columnsContent || [];
          } else {
            this.columnCount = null;
            this.columnsContent = null;
          }
          
          // Handle accordion content
          if (contentData.contentType === 'accordion' && contentData.accordionItems) {
            this.accordionItems = contentData.accordionItems || [];
          } else {
            this.accordionItems = null;
          }
        } else {
          this.content = '';
          this.contentType = 'standard';
          this.columnCount = null;
          this.columnsContent = null;
          this.accordionItems = null;
        }
        
        // Emit loaded event with content
        this.$emit('loaded', {
          content: this.content,
          contentType: this.contentType,
          columnCount: this.columnCount,
          columnsContent: this.columnsContent,
          accordionItems: this.accordionItems
        });
      } catch (err) {
        console.error('Failed to load static content:', err);
        // Only show error if not RecordNotFoundError
        if (!err.message || !err.message.includes('Static content not found')) {
          this.error = 'Fehler beim Laden des Inhalts';
        }
        this.content = '';
        this.contentType = 'standard';
        this.columnCount = null;
        this.columnsContent = null;
        this.accordionItems = null;
      } finally {
        this.loading = false;
      }
    }
  }
};
</script>