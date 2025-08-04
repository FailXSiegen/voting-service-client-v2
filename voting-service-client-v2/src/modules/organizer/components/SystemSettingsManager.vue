<template>
  <div class="card">
    <div class="card-header">
      <h5 class="card-title mb-0">
        <i class="bi bi-gear-fill me-2"></i>
        {{ $t('view.systemSettings.title') }}
      </h5>
    </div>
    <div class="card-body">
      <form @submit.prevent="onSave" class="needs-validation" novalidate>
        <!-- Title Suffix -->
        <div class="mb-3">
          <label class="form-label">
            {{ $t('view.systemSettings.titleSuffix.label') }}
          </label>
          <input
            v-model="formData.titleSuffix"
            type="text"
            class="form-control"
            :placeholder="$t('view.systemSettings.titleSuffix.placeholder')"
          />
          <div class="form-text">
            {{ $t('view.systemSettings.titleSuffix.help') }}
          </div>
        </div>

        <!-- Favicon Upload -->
        <div class="mb-3">
          <label class="form-label">
            {{ $t('view.systemSettings.favicon.label') }}
          </label>
          <div class="input-group">
            <input
              v-model="formData.faviconUrl"
              type="url"
              class="form-control"
              :placeholder="$t('view.systemSettings.favicon.placeholder')"
            />
            <button 
              type="button" 
              class="btn btn-outline-secondary"
              @click="showMediaManager = true"
            >
              <i class="bi bi-upload"></i>
              {{ $t('view.systemSettings.favicon.upload') }}
            </button>
          </div>
          <div class="form-text">
            {{ $t('view.systemSettings.favicon.help') }}
          </div>
          <!-- Favicon Preview -->
          <div v-if="formData.faviconUrl" class="mt-2">
            <img 
              :src="formData.faviconUrl" 
              alt="Favicon Preview"
              class="favicon-preview"
              @error="onFaviconError"
            />
            <span class="ms-2 text-muted">{{ $t('view.systemSettings.favicon.preview') }}</span>
          </div>
        </div>

        <!-- Existing Settings -->
        <div class="mb-3">
          <div class="form-check">
            <input
              id="useDirectStaticPaths"
              v-model="formData.useDirectStaticPaths"
              class="form-check-input"
              type="checkbox"
            />
            <label class="form-check-label" for="useDirectStaticPaths">
              {{ $t('view.systemSettings.useDirectStaticPaths.label') }}
            </label>
          </div>
          <div class="form-text">
            {{ $t('view.systemSettings.useDirectStaticPaths.help') }}
          </div>
        </div>

        <div class="mb-3">
          <div class="form-check">
            <input
              id="useDbFooterNavigation"
              v-model="formData.useDbFooterNavigation"
              class="form-check-input"
              type="checkbox"
            />
            <label class="form-check-label" for="useDbFooterNavigation">
              {{ $t('view.systemSettings.useDbFooterNavigation.label') }}
            </label>
          </div>
          <div class="form-text">
            {{ $t('view.systemSettings.useDbFooterNavigation.help') }}
          </div>
        </div>

        <!-- Save Button -->
        <div class="d-flex justify-content-end">
          <button 
            type="submit" 
            class="btn btn-primary"
            :disabled="saving"
          >
            <i v-if="saving" class="bi bi-hourglass-split me-1"></i>
            <i v-else class="bi bi-check-lg me-1"></i>
            {{ saving ? $t('view.systemSettings.saving') : $t('view.systemSettings.save') }}
          </button>
        </div>
      </form>

      <!-- Last Updated Info -->
      <div v-if="systemSettings?.updatedAt" class="mt-3 text-muted small">
        {{ $t('view.systemSettings.lastUpdated') }}: 
        {{ formatDate(systemSettings.updatedAt) }}
        <span v-if="systemSettings.updatedBy">
          {{ $t('view.systemSettings.updatedBy') }} {{ systemSettings.updatedBy.username }}
        </span>
      </div>
    </div>
  </div>

  <!-- Media Manager Modal -->
  <MediaManager
    v-if="showMediaManager"
    :show="showMediaManager"
    @close="showMediaManager = false"
    @selected="onMediaSelected"
    accept-types="image/*"
    :max-file-size="1024 * 1024"
  />
</template>

<script setup>
import { ref, reactive, onMounted, computed, watch } from 'vue';
import { useQuery, useMutation } from '@vue/apollo-composable';
import { toast } from 'vue3-toastify';
import { handleError } from '@/core/error/error-handler';
import MediaManager from '@/modules/organizer/components/MediaManager.vue';
import { SYSTEM_SETTINGS_QUERY } from '@/modules/organizer/graphql/queries/system-settings';
import { UPDATE_SYSTEM_SETTINGS } from '@/modules/organizer/graphql/mutation/update-system-settings';
import { useI18n } from 'vue-i18n';

const saving = ref(false);
const showMediaManager = ref(false);

// Use i18n
const { t } = useI18n();

const formData = reactive({
  useDirectStaticPaths: true,
  useDbFooterNavigation: true,
  faviconUrl: null,
  titleSuffix: 'digitalwahl.org'
});

// Query system settings
const { result: systemSettingsResult, loading: settingsLoading, refetch } = useQuery(
  SYSTEM_SETTINGS_QUERY,
  {},
  { fetchPolicy: 'cache-and-network' }
);

const systemSettings = computed(() => systemSettingsResult.value?.systemSettings);

// Update form data when query loads
watch(systemSettings, (settings) => {
  if (settings) {
    formData.useDirectStaticPaths = settings.useDirectStaticPaths;
    formData.useDbFooterNavigation = settings.useDbFooterNavigation;
    formData.faviconUrl = settings.faviconUrl;
    formData.titleSuffix = settings.titleSuffix || 'digitalwahl.org';
  }
}, { immediate: true });

// Save mutation
const { mutate: updateSystemSettings } = useMutation(UPDATE_SYSTEM_SETTINGS);

async function onSave() {
  saving.value = true;
  
  try {
    console.log('Saving system settings:', formData);
    
    const result = await updateSystemSettings({
      input: {
        useDirectStaticPaths: formData.useDirectStaticPaths,
        useDbFooterNavigation: formData.useDbFooterNavigation,
        faviconUrl: formData.faviconUrl,
        titleSuffix: formData.titleSuffix
      }
    });
    
    console.log('Mutation result:', result);
    
    try {
      await refetch();
      console.log('Refetch completed successfully');
    } catch (refetchError) {
      console.error('Refetch error:', refetchError);
      // Continue anyway, the save was successful
    }
    
    toast(t('success.systemSettings.saved'), {
      type: 'success'
    });
    
  } catch (error) {
    console.error('Error in onSave:', error);
    console.error('Error details:', {
      message: error.message,
      graphQLErrors: error.graphQLErrors,
      networkError: error.networkError,
      stack: error.stack
    });
    handleError(error);
  } finally {
    saving.value = false;
  }
}

function onMediaSelected(media) {
  formData.faviconUrl = media.url;
  showMediaManager.value = false;
}

function onFaviconError() {
  console.warn('Favicon could not be loaded:', formData.faviconUrl);
}

function formatDate(dateString) {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    return date.toLocaleString('de-DE', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (error) {
    console.warn('Error formatting date:', error);
    return dateString;
  }
}
</script>

<style scoped>
.favicon-preview {
  width: 32px;
  height: 32px;
  object-fit: contain;
}
</style>