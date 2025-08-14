<template>
  <BaseEditor
    editor-type="project"
    :is-new="isNew"
    :is-loading="isLoading"
    :is-saving="isSaving"
    :has-changes="hasChanges"
    :error="error"
    @save="save"
    @back="goBack"
    @retry="loadProject"
  >
    <!-- Slot content: contenu spécifique au projet -->
    <template #content="{ isNew, isSaving, hasChanges }">
      <div class="project-content">
        <div class="project-main">
          <!-- Zone images -->
          <div class="project-images-section">
            <h3>Project Images</h3>
            <ProjectImageZone 
              :images="currentProject?.images || []"
              :project-id="currentProject?.id"
              :disabled="isSaving"
              @images-updated="handleImagesUpdated"
            />
          </div>
          
          <!-- Properties panel -->
          <div class="project-properties-section">
            <h3>Project Properties</h3>
            <ProjectProperties
              v-if="currentProject"
              :project="currentProject"
              :disabled="isSaving"
              @project-updated="handleProjectUpdated"
            />
          </div>
        </div>
      </div>
    </template>
    
    <!-- Slot shortcuts: raccourcis spécifiques -->
    <template #shortcuts>
      <div class="shortcut">
        <kbd>Ctrl</kbd> + <kbd>U</kbd>
        <span>Upload Image</span>
      </div>
      <div class="shortcut">
        <kbd>Ctrl</kbd> + <kbd>P</kbd>
        <span>Preview Project</span>
      </div>
    </template>
  </BaseEditor>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import BaseEditor from '../BaseEditor.vue'
import ProjectImageZone from './ProjectImageZone.vue'
import ProjectProperties from './ProjectProperties.vue'
import { useApi } from '../../composables/useApi'
import { useDebounce } from '../../composables/useDebounce'
import type { Project } from '../../../shared/types'

// Props
interface Props {
  id?: string
}

const props = defineProps<Props>()

// Composables  
const route = useRoute()
const router = useRouter()
const { fetchData, postData } = useApi()
const { debounce } = useDebounce()

// État
const currentProject = ref<Project | null>(null)
const isLoading = ref(true)
const isSaving = ref(false)
const error = ref<string | null>(null)
const hasUnsavedChanges = ref(false)

// Computed
const isNew = computed(() => !props.id || props.id === 'new')
const hasChanges = computed(() => hasUnsavedChanges.value)

// Méthodes
const loadProject = async () => {
  if (isNew.value) {
    // Nouveau projet
    currentProject.value = createNewProject()
    isLoading.value = false
    return
  }

  try {
    isLoading.value = true
    error.value = null
    
    const response = await fetchData(`/api/projects/${props.id}`)
    
    if (response.success) {
      currentProject.value = response.data
    } else {
      error.value = response.error || 'Failed to load project'
    }
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Unknown error'
  } finally {
    isLoading.value = false
  }
}

const createNewProject = (): Project => ({
  id: 'temp-' + Date.now(),
  title: '',
  description: '',
  status: 'invisible' as const,
  is_draft: true,
  images: [],
  seo: {},
  created_at: new Date(),
  updated_at: new Date()
})

const save = async () => {
  if (!currentProject.value) return

  try {
    isSaving.value = true
    
    const endpoint = isNew.value ? '/api/projects' : `/api/projects/${currentProject.value.id}`
    const method = isNew.value ? 'POST' : 'PUT'
    
    const response = await postData(endpoint, currentProject.value, method)
    
    if (response.success) {
      hasUnsavedChanges.value = false
      
      // Si nouveau projet, rediriger vers l'ID réel
      if (isNew.value && response.data?.id) {
        router.replace(`/admin/projects/${response.data.id}`)
      }
    } else {
      throw new Error(response.error || 'Save failed')
    }
  } catch (err) {
    console.error('Save error:', err)
    alert('Save failed: ' + (err instanceof Error ? err.message : 'Unknown error'))
  } finally {
    isSaving.value = false
  }
}

const goBack = () => {
  router.push('/admin/projects')
}

const handleProjectUpdated = (updatedProject: Project) => {
  currentProject.value = updatedProject
  hasUnsavedChanges.value = true
  
  // Auto-save avec debounce
  debouncedSave()
}

const handleImagesUpdated = (images: any[]) => {
  if (currentProject.value) {
    currentProject.value.images = images
    hasUnsavedChanges.value = true
    debouncedSave()
  }
}

// Auto-save avec debounce
const debouncedSave = debounce(() => {
  if (hasUnsavedChanges.value && !isSaving.value) {
    save()
  }
}, 2000)

// Lifecycle
onMounted(() => {
  loadProject()
})

// Watch pour changements d'ID
watch(() => props.id, () => {
  loadProject()
})
</script>

<style scoped lang="scss">
.project-content {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.project-main {
  flex: 1;
  display: grid;
  grid-template-columns: 1fr 350px;
  gap: 2rem;
  padding: 2rem;
  overflow: hidden;
}

.project-images-section {
  overflow-y: auto;
  
  h3 {
    margin-bottom: 1rem;
    color: var(--color-gray-dark, #333);
  }
}

.project-properties-section {
  border-left: 1px solid var(--color-gray-light, #e0e0e0);
  padding-left: 2rem;
  overflow-y: auto;
  
  h3 {
    margin-bottom: 1rem;
    color: var(--color-gray-dark, #333);
  }
}

/* Responsive */
@media (max-width: 768px) {
  .project-main {
    grid-template-columns: 1fr;
    gap: 1rem;
    padding: 1rem;
  }
  
  .project-properties-section {
    border-left: none;
    border-top: 1px solid var(--color-gray-light, #e0e0e0);
    padding-left: 0;
    padding-top: 1rem;
  }
}
</style>