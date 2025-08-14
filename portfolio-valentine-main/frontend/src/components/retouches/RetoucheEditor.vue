<template>
  <div class="retouche-editor">
    <!-- Header d'édition -->
    <div class="editor-header">
      <div class="header-left">
        <button @click="goBack" class="back-button">
          <span class="back-icon">←</span>
          Retouches
        </button>
      </div>
      
      <div class="header-center">
        <div class="save-status" :class="saveStatusClass">
          {{ saveStatusText }}
        </div>
      </div>
      
      <div class="header-right">
        <button 
          @click="save" 
          :disabled="isSaving || !hasChanges"
          class="save-button"
          :class="{ saving: isSaving }"
        >
          {{ isSaving ? 'Saving...' : 'Save' }}
        </button>
      </div>
    </div>
    
    <!-- Loading state -->
    <div v-if="isLoading" class="loading-state">
      <div class="loading-spinner"></div>
      <p>{{ isNew ? 'Preparing new retouche...' : 'Loading retouche...' }}</p>
    </div>
    
    <!-- Error state -->
    <div v-else-if="error" class="error-state">
      <div class="error-icon">⚠️</div>
      <h3>Error loading retouche</h3>
      <p>{{ error }}</p>
      <button @click="loadRetouche" class="retry-button">Retry</button>
    </div>
    
    <!-- Éditeur principal -->
    <div v-else class="editor-content">
      <!-- Titre de la retouche -->
      <div class="retouche-title-section">
        <input
          v-model="retouche.title"
          type="text"
          placeholder="Untitled Retouche"
          class="retouche-title-input"
          @input="markAsChanged"
        />
      </div>
      
      <!-- Upload avant/après -->
      <div class="retouche-images-section">
        <RetoucheImageUpload 
          v-model:before-image="retouche.before_image"
          v-model:after-image="retouche.after_image"
          @change="markAsChanged"
        />
      </div>
      
      <!-- Comparaison (seulement si les deux images sont présentes) -->
      <div v-if="retouche.before_image && retouche.after_image" class="retouche-comparison-section">
        <RetoucheComparison 
          :before-image="retouche.before_image"
          :after-image="retouche.after_image"
        />
      </div>
      
      <!-- Properties -->
      <div class="retouche-properties-section">
        <RetoucheProperties 
          :retouche="retouche"
          :before-image="retouche.before_image"
          :after-image="retouche.after_image"
          @update:retouche="updateRetouche"
          @change="markAsChanged"
        />
      </div>
      
      <!-- SEO Section -->
      <div class="retouche-seo-section">
        <SEOSection 
          :title="retouche.title || 'Sans titre'"
          :description="`Retouche photo : ${retouche.title || 'Sans titre'}`"
          :seo="retouche.seo || {}"
          :type="'retouche'"
          :slug="generateSlug(retouche.title || '')"
          :image="retouche.after_image?.url"
          @update:seo="updateSeo"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import RetoucheImageUpload from './RetoucheImageUpload.vue';
import RetoucheComparison from './RetoucheComparison.vue';
import RetoucheProperties from './RetoucheProperties.vue';
import SEOSection from '../SEOSection.vue';
import type { Retouche, Media, SEOData } from '../../../../shared/types';

interface Props {
  retoucheId: string;
}

const props = defineProps<Props>();

// État réactif
const retouche = ref<Partial<Retouche>>({
  title: '',
  description: '',
  status: 'invisible',
  before_image: undefined,
  after_image: undefined,
  seo: {
    title: '',
    description: '',
    keywords: []
  }
});

const isLoading = ref(true);
const error = ref<string | null>(null);
const isSaving = ref(false);
const hasChanges = ref(false);
const lastSaved = ref<Date | null>(null);

// Computed
const isNew = computed(() => props.retoucheId === 'new');

const saveStatusClass = computed(() => {
  if (isSaving.value) return 'saving';
  if (hasChanges.value) return 'unsaved';
  if (lastSaved.value) return 'saved';
  return '';
});

const saveStatusText = computed(() => {
  if (isSaving.value) return 'Saving...';
  if (hasChanges.value) return 'Unsaved changes';
  if (lastSaved.value) {
    const now = new Date();
    const diff = Math.round((now.getTime() - lastSaved.value.getTime()) / 1000 / 60);
    if (diff < 1) return 'Saved just now';
    if (diff === 1) return 'Saved 1 minute ago';
    return `Saved ${diff} minutes ago`;
  }
  return 'Draft';
});

// Debounced auto-save
let autoSaveTimeout: NodeJS.Timeout;

const debouncedAutoSave = () => {
  if (autoSaveTimeout) clearTimeout(autoSaveTimeout);
  autoSaveTimeout = setTimeout(() => {
    if (hasChanges.value && !isSaving.value && retouche.value.before_image && retouche.value.after_image) {
      save();
    }
  }, 3000); // 3 secondes pour les retouches
};

// Méthodes
const loadRetouche = async () => {
  if (isNew.value) {
    // Nouveau projet : rester en mode création
    isLoading.value = false;
    return;
  }
  
  try {
    isLoading.value = true;
    error.value = null;
    
    const response = await fetch(`/api/retouches/${props.retoucheId}`, {
      credentials: 'include'
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (data.success) {
      retouche.value = data.data;
      lastSaved.value = new Date();
      hasChanges.value = false;
    } else {
      throw new Error(data.message || 'Failed to load retouche');
    }
    
  } catch (err) {
    console.error('Error loading retouche:', err);
    error.value = err instanceof Error ? err.message : 'Unknown error';
  } finally {
    isLoading.value = false;
  }
};

const save = async () => {
  if (!hasChanges.value || isSaving.value) return;
  
  // Validation : il faut au minimum un titre et les deux images
  if (!retouche.value.title?.trim()) {
    alert('Please enter a title for the retouche');
    return;
  }
  
  if (!retouche.value.before_image || !retouche.value.after_image) {
    alert('Please upload both before and after images');
    return;
  }
  
  try {
    isSaving.value = true;
    
    const payload = {
      title: retouche.value.title,
      description: retouche.value.description || '',
      before_image_id: retouche.value.before_image.id,
      after_image_id: retouche.value.after_image.id,
      status: retouche.value.status || 'invisible',
      seo: retouche.value.seo || {}
    };
    
    const url = isNew.value ? '/api/retouches' : `/api/retouches/${retouche.value.id}`;
    const method = isNew.value ? 'POST' : 'PUT';
    
    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify(payload)
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`HTTP ${response.status}: ${errorData.message || response.statusText}`);
    }
    
    const data = await response.json();
    
    if (data.success) {
      retouche.value = data.data;
      lastSaved.value = new Date();
      hasChanges.value = false;
      
      // Si c'est un nouveau projet, rediriger vers l'URL avec l'ID
      if (isNew.value) {
        const newUrl = `/admin/retouches/${retouche.value.id}`;
        window.history.replaceState({}, '', newUrl);
      }
    } else {
      throw new Error(data.message || 'Failed to save retouche');
    }
    
  } catch (err) {
    console.error('Error saving retouche:', err);
    alert('Error saving retouche. Please try again.');
  } finally {
    isSaving.value = false;
  }
};

const markAsChanged = () => {
  hasChanges.value = true;
  debouncedAutoSave();
};

const updateRetouche = (updatedRetouche: Partial<Retouche>) => {
  retouche.value = { ...retouche.value, ...updatedRetouche };
  markAsChanged();
};

const updateSeo = (seoData: SEOData) => {
  retouche.value.seo = seoData;
  markAsChanged();
};

const generateSlug = (title: string): string => {
  return title
    .toLowerCase()
    .normalize('NFD') // Décomposer les accents
    .replace(/[\u0300-\u036f]/g, '') // Supprimer les accents
    .replace(/[^a-z0-9\s-]/g, '') // Garder seulement lettres, chiffres, espaces et tirets
    .trim()
    .replace(/\s+/g, '-') // Remplacer espaces par tirets
    .replace(/-+/g, '-') // Éviter les tirets multiples
    .substring(0, 50); // Limiter la longueur
};

const goBack = () => {
  if (hasChanges.value) {
    if (confirm('You have unsaved changes. Are you sure you want to leave?')) {
      window.location.href = '/admin/retouches';
    }
  } else {
    window.location.href = '/admin/retouches';
  }
};

// Gestion de la navigation
const handleBeforeUnload = (event: BeforeUnloadEvent) => {
  if (hasChanges.value) {
    event.preventDefault();
    event.returnValue = '';
  }
};

// Lifecycle
onMounted(() => {
  loadRetouche();
  window.addEventListener('beforeunload', handleBeforeUnload);
});

onBeforeUnmount(() => {
  if (autoSaveTimeout) clearTimeout(autoSaveTimeout);
  window.removeEventListener('beforeunload', handleBeforeUnload);
});
</script>

<style scoped lang="scss">
@import '../../styles/variables.scss';

.retouche-editor {
  min-height: 100vh;
  background: $color-white;
}

.editor-header {
  position: sticky;
  top: 0;
  z-index: 100;
  background: $color-white;
  border-bottom: 1px solid $color-gray-light;
  padding: 1rem 2rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  
  .header-left {
    .back-button {
      background: none;
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      color: $color-gray-medium;
      font-size: 0.9rem;
      font-weight: 500;
      transition: color 0.3s ease;
      
      &:hover {
        color: $color-gray-dark;
      }
      
      .back-icon {
        font-size: 1.2rem;
      }
    }
  }
  
  .header-center {
    .save-status {
      font-size: 0.85rem;
      font-weight: 500;
      padding: 0.25rem 0.75rem;
      border-radius: 12px;
      
      &.saving {
        background: #fef3c7;
        color: #92400e;
      }
      
      &.unsaved {
        background: #fee2e2;
        color: #991b1b;
      }
      
      &.saved {
        background: #d1fae5;
        color: #065f46;
      }
    }
  }
  
  .header-right {
    .save-button {
      background: $color-gray-dark;
      color: $color-white;
      border: none;
      border-radius: 6px;
      padding: 0.75rem 1.5rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
      
      &:hover:not(:disabled) {
        background: lighten($color-gray-dark, 10%);
      }
      
      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
      
      &.saving {
        background: #f59e0b;
      }
    }
  }
}

.loading-state, .error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  text-align: center;
  
  .loading-spinner {
    width: 40px;
    height: 40px;
    margin-bottom: 1rem;
    border: 3px solid $color-gray-light;
    border-top: 3px solid $color-gray-dark;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }
  
  .error-icon {
    font-size: 3rem;
    margin-bottom: 1rem;
  }
  
  h3 {
    color: $color-gray-dark;
    margin: 0 0 0.5rem 0;
    font-size: 1.25rem;
  }
  
  p {
    color: $color-gray-medium;
    margin: 0 0 1.5rem 0;
  }
  
  .retry-button {
    background: $color-gray-dark;
    color: $color-white;
    border: none;
    border-radius: 8px;
    padding: 0.75rem 1.5rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    
    &:hover {
      background: lighten($color-gray-dark, 10%);
    }
  }
}

.editor-content {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

.retouche-title-section {
  margin-bottom: 3rem;
  
  .retouche-title-input {
    width: 100%;
    border: none;
    outline: none;
    font-size: 2.5rem;
    font-weight: 700;
    color: $color-gray-dark;
    background: transparent;
    padding: 0.5rem 0;
    
    &::placeholder {
      color: $color-gray-light;
    }
    
    &:focus {
      background: lighten($color-gray-light, 5%);
      border-radius: 8px;
      padding: 0.5rem 1rem;
    }
  }
}

.retouche-images-section {
  margin-bottom: 3rem;
}

.retouche-comparison-section {
  margin-bottom: 3rem;
}

.retouche-properties-section {
  // Styles gérés par RetoucheProperties.vue
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@media (max-width: 768px) {
  .editor-header {
    padding: 1rem;
    flex-direction: column;
    gap: 1rem;
    
    .header-center, .header-right {
      width: 100%;
      display: flex;
      justify-content: center;
    }
  }
  
  .editor-content {
    padding: 1rem;
  }
  
  .retouche-title-section {
    .retouche-title-input {
      font-size: 2rem;
    }
  }
}
</style>
