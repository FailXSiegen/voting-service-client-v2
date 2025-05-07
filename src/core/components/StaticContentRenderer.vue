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
    
    <div v-else-if="content" v-html="content"></div>
    
    <div v-else-if="!hideEmpty" class="alert alert-info">
      Kein Inhalt verfügbar.
    </div>
  </div>
</template>

<script>
import gql from 'graphql-tag';

export default {
  name: 'StaticContentRenderer',
  
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
                content
                title
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
        this.content = contentData ? contentData.content : '';
        
        // Emit loaded event with content
        this.$emit('loaded', this.content);
      } catch (err) {
        console.error('Failed to load static content:', err);
        // Only show error if not RecordNotFoundError
        if (!err.message || !err.message.includes('Static content not found')) {
          this.error = 'Fehler beim Laden des Inhalts';
        }
        this.content = '';
      } finally {
        this.loading = false;
      }
    }
  }
};
</script>