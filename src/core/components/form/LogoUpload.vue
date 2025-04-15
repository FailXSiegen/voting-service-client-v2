<!-- LogoUpload.vue -->
<template>
    <div class="logo-upload">
      <div v-if="modelValue" class="mb-3 d-flex">
        <img :src="modelValue" alt="Current Logo" class="preview-image" />
        <span class="ms-3">
            <button class="btn btn-danger btn-sm mt-2" @click="removeLogo">
            <i class="bi bi-trash"></i>
            </button>
        </span>
      </div>
      
      <div class="mb-3">
        <label for="logoInput" class="form-label">{{ label }}</label>
        <input
          id="logoInput"
          type="file"
          class="form-control"
          accept="image/jpeg,image/png"
          :class="{ 'is-invalid': hasErrors }"
          @change="handleLogoChange"
        >
        <div class="form-text">
            {{ $t('view.event.create.labels.logoHelp') }}
        </div>
        <div v-if="hasErrors" class="invalid-feedback">
          <template v-for="error in errors" :key="error.$uid">
            {{ error.$message }}
          </template>
        </div>
      </div>
      
      <div v-if="isLoading" class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Lädt...</span>
      </div>
    </div>
  </template>
  
<script setup>
import { ref } from 'vue';
import { toast } from 'vue3-toastify';
import t from "@/core/util/l18n";

const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  },
  label: {
    type: String,
    default: 'Logo auswählen'
  },
  hasErrors: {
    type: Boolean,
    default: false
  },
  errors: {
    type: Array,
    default: () => []
  }
});

const emit = defineEmits(['update:modelValue', 'change']);
  
const isLoading = ref(false);
const MAX_WIDTH = 400;
const MAX_HEIGHT = 300;
const QUALITY = 0.6;
const MAX_FILE_SIZE = 500 * 1024; // 500KB
  
const compressImage = (file) => {
  return new Promise((resolve, reject) => {
    if (!['image/jpeg', 'image/png'].includes(file.type)) {
      reject(new Error('Nur JPEG und PNG Dateien sind erlaubt'));
      return;
    }
  
    const img = new Image();
    img.src = URL.createObjectURL(file);
      
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;
        
      const ratio = Math.min(MAX_WIDTH / width, MAX_HEIGHT / height);
      if (ratio < 1) {
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }
        
      canvas.width = width;
      canvas.height = height;
        
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);
        
      canvas.toBlob((blob) => {
        if (blob.size > MAX_FILE_SIZE) {
          reject(new Error('Bild ist zu groß. Bitte verwenden Sie ein kleineres Bild.'));
          return;
        }
        resolve(blob);
      }, 'image/jpeg', QUALITY);
        
      URL.revokeObjectURL(img.src);
    };
      
    img.onerror = (error) => {
      URL.revokeObjectURL(img.src);
      reject(new Error('Fehler beim Laden des Bildes'));
    };
  });
};
  
const handleLogoChange = async (event) => {
  const file = event.target.files[0];
  if (!file) return;
    
  isLoading.value = true;
    
  try {
    const compressedBlob = await compressImage(file);
      
    const base64 = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(compressedBlob);
    });
      
    emit('update:modelValue', base64);
    emit('change', { value: base64 });
    toast('Logo wurde erfolgreich aktualisiert', { type: 'success' });
    event.target.value = '';
      
  } catch (error) {
    console.error('Upload error:', error);
    toast(error.message || 'Fehler beim Hochladen des Logos', { type: 'error' });
    event.target.value = '';
  } finally {
    isLoading.value = false;
  }
};
  
const removeLogo = () => {
  emit('update:modelValue', '');
  emit('change', { value: '' });
  toast('Logo wurde entfernt', { type: 'success' });
};
</script>
  
  <style scoped>
  .preview-image {
    max-width: 200px;
    max-height: 100px;
    object-fit: contain;
  }
  
  .logo-upload {
    max-width: 400px;
  }
  
  .spinner-border {
    width: 1.5rem;
    height: 1.5rem;
    margin-top: 0.5rem;
  }
  </style>