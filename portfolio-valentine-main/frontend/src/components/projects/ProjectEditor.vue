<template>
  <div class="project-editor">
    <!-- Header -->
    <div class="project-editor-header">
      <div class="project-editor-header-left">
        <button class="button" @click="goBack">
          <ArrowLeftIcon />
        </button>
        <div class="project-editor-header-left-status" :class="saveStatusClass">
          {{ saveStatusText }}
        </div>
      </div>
      <div class="project-editor-header-right">
        <button class="button-primary" @click="save">Save</button>
      </div>
    </div>

    <!-- Loading state -->
    <div v-if="isLoading" class="loading-state">
      <div class="loading-spinner"></div>
      <p>{{ isNew ? 'Preparing new project...' : 'Loading project...' }}</p>
    </div>
    
    <!-- Error state -->
    <div v-else-if="error" class="error-state">
      <div class="error-icon">⚠️</div>
      <h3>Error loading project</h3>
      <p>{{ error }}</p>
      <button @click="loadProject" class="retry-button">Retry</button>
    </div>

    <!-- Éditeur principal -->
    <div v-else class="project-editor-content">
      <div class="project-editor-content-header">
        <input
          v-model="project.title"
          type="text"
          placeholder="Sans titre"
          class="project-editor-content--title"
          @input="markAsChanged"
        />
        <!-- Properties -->
        <ProjectProperties 
        :project="project" 
        @update:project="updateProject"  
        @update:seo="updateSeo"
        @change="markAsChanged"
        @open-seo="showSeoPanel = true" />
      </div>

      <!-- Image Zone -->
      <ProjectImageZone 
        :model-value="project.images || []"
        @update:model-value="updateImages"
        @change="markAsChanged"
      />
    </div>  

    <!-- SEO Side Panel -->
    <SEOSidePanel 
      :is-open="showSeoPanel"
      :seo="project.seo || { title: '', description: '', keywords: [] }"
      :project-title="project.title"
      @close="showSeoPanel = false"
      @update:seo="updateSeo"
    />
  </div>
</template>

<script setup lang="ts">
// Import
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import type { Project, SEOData, Media } from '../../../../shared/types';

import ArrowLeftIcon from '@/Icons/arrow.left.vue';
import ProjectProperties from '@/components/projects/ProjectProperties.vue';
import ProjectImageZone from '@/components/projects/ProjectImageZone.vue';
import SEOSidePanel from '@/components/projects/SEOSidePanel.vue';

// Props
interface Props {
  projectId: string;
}
const props = defineProps<Props>();

// States
const isLoading = ref(true);
const error = ref<string | null>(null);
const isSaving = ref(false);
const hasChanges = ref(false);
const lastSaved = ref<Date | null>(null);
const showSeoPanel = ref(false);
const project = ref<Partial<Project>>({
  title: '',
  description: '',
  status: 'invisible',
  images: [],
  seo: {
    title: '',
    description: '',
    keywords: []
  }
});

// Computed
const isNew = computed(() => !props.projectId || props.projectId === 'new');
const saveStatusClass = computed(() => {
  if (isSaving.value) return 'saving';
  if (hasChanges.value) return 'unsaved';
  if (lastSaved.value) return 'saved';
  return '';
});
const saveStatusText = computed(() => {
  if (isSaving.value) return 'Saving...';
  if (hasChanges.value) return 'Unsaved changes';
  if (lastSaved.value) return 'Saved';
  return 'Draft';
});

// Methods
const loadProject = async () => {
  if (isNew.value) {
    // Nouveau projet : créer un projet vide
    await createEmptyProject();
    return;
  }
  
  try {
    isLoading.value = true;
    error.value = null;
    
    const response = await fetch(`/api/projects/${props.projectId}`, {
      credentials: 'include'
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (data.success) {
      project.value = data.data;
      lastSaved.value = new Date();
      hasChanges.value = false;
    } else {
      throw new Error(data.message || 'Failed to load project');
    }
    
  } catch (err) {
    console.error('Error loading project:', err);
    error.value = err instanceof Error ? err.message : 'Unknown error';
  } finally {
    isLoading.value = false;
  }
};

const createEmptyProject = async () => {
  try {
    isLoading.value = true;
    error.value = null;
    
    console.log('🆕 Creating empty project...');
    
    // Créer un projet vide - TOUS les champs sont optionnels selon l'API
    const projectData = {
      title: '', // Titre vide autorisé
      description: '',
      status: 'invisible',
      seo: {
        title: '',
        description: '',
        keywords: []
      }
    };
    
    console.log('🆕 Sending project data:', projectData);
    
    const response = await fetch('/api/projects', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify(projectData)
    });
    
    console.log('🆕 API Response status:', response.status);
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('🆕 API Error:', errorData);
      throw new Error(`HTTP ${response.status}: ${errorData.message || response.statusText}`);
    }
    
    const data = await response.json();
    console.log('🆕 API Response data:', data);
    
    if (data.success) {
      project.value = data.data;
      lastSaved.value = new Date();
      hasChanges.value = false;
      
      console.log('✅ Project created with ID:', project.value.id);
      
      // Rediriger vers l'URL avec l'ID réel
      const newUrl = `/admin/projects/${project.value.id}`;
      window.history.replaceState({}, '', newUrl);
    } else {
      throw new Error(data.message || 'Failed to create project');
    }
    
  } catch (err) {
    console.error('❌ Error creating project:', err);
    error.value = err instanceof Error ? err.message : 'Unknown error';
  } finally {
    isLoading.value = false;
  }
};

const save = async () => {
  if (!hasChanges.value || isSaving.value) return;
  
  try {
    isSaving.value = true;
    
    const response = await fetch(`/api/projects/${project.value.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify(project.value)
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (data.success) {
      project.value = data.data;
      lastSaved.value = new Date();
      hasChanges.value = false;
    } else {
      throw new Error(data.message || 'Failed to save project');
    }
    
  } catch (err) {
    console.error('Error saving project:', err);
    alert('Error saving project. Please try again.');
  } finally {
    isSaving.value = false;
  }
};

const markAsChanged = () => {
  hasChanges.value = true;
};

const updateProject = (updatedProject: Partial<Project>) => {
  project.value = { ...project.value, ...updatedProject };
  markAsChanged();
};

const updateSeo = (seoData: SEOData) => {
  project.value.seo = seoData;
  markAsChanged();
};

const updateImages = (images: Media[]) => {
  project.value.images = images;
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
      window.location.href = '/admin/projects';
    }
  } else {
    window.location.href = '/admin/projects';
  }
};

// Auto-save toutes les 30 secondes
let autoSaveInterval: NodeJS.Timeout;

const setupAutoSave = () => {
  autoSaveInterval = setInterval(() => {
    if (hasChanges.value && !isSaving.value) {
      save();
    }
  }, 30000); // 30 secondes
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
  loadProject();
  setupAutoSave();
  window.addEventListener('beforeunload', handleBeforeUnload);
});

onBeforeUnmount(() => {
  if (autoSaveInterval) {
    clearInterval(autoSaveInterval);
  }
  window.removeEventListener('beforeunload', handleBeforeUnload);
});
</script>

<style scoped lang="scss">
.project-editor {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-6);
  flex-shrink: 0;

  &-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    gap: var(--spacing-6);

    &-left {
      display: flex;
      flex-direction: row;
      align-items: center;
      gap: var(--spacing-6);

      &-status {
        position: relative;
        color: var(--color-text-secondary);

        &::before {
          content: '';
          width: var(--spacing-2);
          height: var(--spacing-2);
          border-radius: var(--border-radius-full);

          background-color: var(--color-background-secondary);

          position: absolute;
          right: 100%;
          top: 50%;
          transform: translate(-50%, -50%);
          margin-right: var(--spacing-1);
        }

        &.saved::before {
          background-color: var(--color-success-text);
        }

        &.saving::before {
          background-color: var(--color-warning-text);
        }

        &.unsaved::before {
          background-color: var(--color-error-text);
        }
      }
    }
  }

  &-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: var(--spacing-6);
    width: 100%;

    &-header {
      display: flex;
      width: 100%;
      max-width: 600px;
      flex-direction: column;
      gap: var(--spacing-6);
    }

    &--title {
      appearance: none;
      border: none;
      outline: none;
      background: transparent;
      color: var(--color-text-primary);
      font-size: var(--font-size-2xl);
      font-weight: var(--font-weight-bold);
      line-height: var(--line-height-tight);

      &::placeholder {
        color: var(--color-neutral-2);
      }
    }
  }
}
</style>

