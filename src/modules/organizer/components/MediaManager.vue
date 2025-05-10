<template>
  <div class="media-manager">
    <div class="card">
      <div class="card-header d-flex justify-content-between align-items-center">
        <h5 class="mb-0">Medienverwaltung</h5>
        <button 
          type="button" 
          class="btn btn-sm btn-outline-secondary" 
          @click="$emit('close')"
        >
          <i class="bi bi-x-lg"></i>
        </button>
      </div>
      
      <div class="card-body">
        <!-- Uploads -->
        <div class="mb-4">
          <h6>Neues Bild hochladen</h6>
          <div class="input-group mb-3">
            <input 
              type="file" 
              class="form-control" 
              id="mediaUpload" 
              accept="image/*"
              @change="handleFileSelect"
            >
            <button 
              class="btn btn-primary" 
              type="button" 
              @click="uploadFile"
              :disabled="!selectedFile || uploading"
            >
              <span v-if="uploading" class="spinner-border spinner-border-sm me-1"></span>
              Hochladen
            </button>
          </div>
          
          <div v-if="uploadProgress > 0 && uploadProgress < 100" class="progress">
            <div 
              class="progress-bar" 
              role="progressbar" 
              :style="{ width: uploadProgress + '%' }" 
              :aria-valuenow="uploadProgress" 
              aria-valuemin="0" 
              aria-valuemax="100"
            >
              {{ uploadProgress }}%
            </div>
          </div>
          
          <div v-if="selectedFile" class="mt-2">
            <div class="alert alert-info">
              <strong>Ausgewählte Datei:</strong> {{ selectedFile.name }} ({{ formatFileSize(selectedFile.size) }})
            </div>
          </div>
          
          <div v-if="uploadError" class="alert alert-danger">
            {{ uploadError }}
          </div>
        </div>
        
        <!-- Media Library -->
        <div>
          <h6>Medienbibliothek</h6>
          
          <div v-if="loading" class="text-center py-3">
            <div class="spinner-border text-primary" role="status">
              <span class="visually-hidden">Wird geladen...</span>
            </div>
          </div>
          
          <div v-else-if="mediaItems.length === 0" class="alert alert-info">
            Noch keine Medien hochgeladen. Laden Sie oben Ihr erstes Bild hoch.
          </div>
          
          <div v-else class="row g-2 media-grid">
            <div 
              v-for="item in mediaItems" 
              :key="item.id" 
              class="col-md-4 col-lg-3"
              @click="selectMedia(item)"
            >
              <div 
                class="card h-100 media-item" 
                :class="{ 'selected': selectedMedia?.id === item.id }"
              >
                <img 
                  :src="item.url" 
                  class="card-img-top media-thumbnail" 
                  :alt="item.filename"
                >
                <div class="card-body p-2">
                  <p class="card-text small text-truncate">{{ item.filename }}</p>
                  <p class="card-text small text-muted">{{ formatDate(item.uploadedAt) }}</p>
                </div>
              </div>
            </div>
          </div>
          
          <div class="d-flex justify-content-between mt-3">
            <button 
              class="btn btn-sm btn-outline-danger" 
              :disabled="!selectedMedia"
              @click="deleteMedia"
            >
              <i class="bi bi-trash"></i> Löschen
            </button>
            
            <button 
              class="btn btn-primary" 
              :disabled="!selectedMedia"
              @click="useSelectedMedia"
            >
              Auswählen
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useApolloClient } from '@vue/apollo-composable';
import gql from 'graphql-tag';
import { toast } from 'vue3-toastify';

const emit = defineEmits(['select', 'close']);

// Zustand
const mediaItems = ref([]);
const selectedFile = ref(null);
const selectedMedia = ref(null);
const loading = ref(false);
const uploading = ref(false);
const uploadProgress = ref(0);
const uploadError = ref('');

// API-Endpoints
const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';
const UPLOAD_URL = `${API_URL}/media/upload`;

// GraphQL Client
const { resolveClient } = useApolloClient();

// Medien laden
onMounted(async () => {
  await fetchMedia();
});

// GraphQL Queries und Mutations
const FETCH_MEDIA = gql`
  query GetAllMedia {
    mediaItems {
      id
      filename
      url
      mimeType
      fileSize
      uploadedAt
    }
  }
`;

const DELETE_MEDIA = gql`
  mutation DeleteMedia($id: ID!) {
    deleteMedia(id: $id)
  }
`;

// Dateien auswählen
const handleFileSelect = (event) => {
  const files = event.target.files;
  if (files.length > 0) {
    selectedFile.value = files[0];
    uploadError.value = '';
  }
};

// Datei hochladen zum Server via API-Endpunkt
const uploadFile = async () => {
  if (!selectedFile.value) {
    uploadError.value = 'Bitte wählen Sie eine Datei aus.';
    return;
  }
  
  // Bildtyp prüfen
  if (!selectedFile.value.type.startsWith('image/')) {
    uploadError.value = 'Nur Bilddateien sind erlaubt.';
    return;
  }
  
  uploading.value = true;
  uploadProgress.value = 0;
  uploadError.value = '';
  
  try {
    // Formular erstellen
    const formData = new FormData();
    formData.append('file', selectedFile.value);
    
    // Konfiguration für Upload mit Fortschrittsanzeige
    const config = {
      onUploadProgress: (progressEvent) => {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        uploadProgress.value = percentCompleted;
      },
      headers: {
        // JWT-Token für Authentifizierung
        'Authorization': `Bearer ${localStorage.getItem('apollo-token')}`,
        'Content-Type': 'multipart/form-data'
      }
    };
    
    // Datei hochladen über direkten API-Endpunkt
    const response = await fetch(UPLOAD_URL, {
      method: 'POST',
      body: formData,
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('apollo-token')}`
      }
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Upload fehlgeschlagen');
    }
    
    // Antwort verarbeiten
    const result = await response.json();
    
    // Neues Media-Item erstellen
    const newItem = {
      id: result.id,
      filename: result.filename,
      url: result.url,
      mimeType: result.mimeType,
      fileSize: result.fileSize,
      uploadedAt: result.uploadedAt
    };
    
    // Zum Anfang der Liste hinzufügen
    mediaItems.value = [newItem, ...mediaItems.value];
    
    // Als aktuell ausgewähltes Item setzen
    selectedMedia.value = newItem;
    
    // Formular zurücksetzen
    selectedFile.value = null;
    uploading.value = false;
    
    toast.success('Datei erfolgreich hochgeladen');
  } catch (err) {
    console.error('Failed to upload media:', err);
    uploadError.value = 'Fehler beim Hochladen: ' + (err.message || 'Unbekannter Fehler');
    uploading.value = false;
  }
};

// Medien vom Server laden via GraphQL
const fetchMedia = async () => {
  loading.value = true;
  
  try {
    // Medien über GraphQL vom Server laden
    const client = resolveClient();
    const result = await client.query({
      query: FETCH_MEDIA,
      fetchPolicy: 'network-only'
    });
    
    if (result.data && result.data.mediaItems) {
      mediaItems.value = result.data.mediaItems;
    } else {
      mediaItems.value = [];
    }
  } catch (err) {
    console.error('Failed to load media:', err);
    toast.error('Fehler beim Laden der Medien');
    mediaItems.value = [];
  } finally {
    loading.value = false;
  }
};

// Medium auswählen
const selectMedia = (item) => {
  selectedMedia.value = item;
};

// Ausgewähltes Medium verwenden
const useSelectedMedia = () => {
  if (selectedMedia.value) {
    emit('select', selectedMedia.value);
    emit('close');
  }
};

// Medium löschen über GraphQL
const deleteMedia = async () => {
  if (!selectedMedia.value) return;
  
  if (!confirm(`Möchten Sie wirklich "${selectedMedia.value.filename}" löschen?`)) {
    return;
  }
  
  try {
    loading.value = true;
    
    // GraphQL-Mutation zum Löschen aufrufen
    const client = resolveClient();
    const result = await client.mutate({
      mutation: DELETE_MEDIA,
      variables: {
        id: selectedMedia.value.id
      }
    });
    
    if (result.data.deleteMedia) {
      // Auch aus der lokalen Liste entfernen
      mediaItems.value = mediaItems.value.filter(item => item.id !== selectedMedia.value.id);
      selectedMedia.value = null;
      
      toast.success('Medium erfolgreich gelöscht');
    } else {
      toast.error('Medium konnte nicht gelöscht werden');
    }
  } catch (err) {
    console.error('Failed to delete media:', err);
    toast.error('Fehler beim Löschen des Mediums');
  } finally {
    loading.value = false;
  }
};

// Hilfsfunktionen
const formatFileSize = (bytes) => {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
};

const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('de-DE', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
};
</script>

<style scoped>
.media-manager {
  max-height: 80vh;
  overflow-y: auto;
}

.media-grid {
  max-height: 50vh;
  overflow-y: auto;
}

.media-item {
  cursor: pointer;
  transition: all 0.2s ease;
  border: 2px solid transparent;
}

.media-item:hover {
  transform: translateY(-3px);
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.media-item.selected {
  border-color: #0d6efd;
  background-color: rgba(13, 110, 253, 0.05);
}

.media-thumbnail {
  height: 120px;
  object-fit: cover;
  background-color: #f8f9fa;
}
</style>