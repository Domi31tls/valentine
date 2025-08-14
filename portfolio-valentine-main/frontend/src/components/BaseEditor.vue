<template>
  <div :class="editorClass">
    <!-- Header d'édition commun -->
    <div class="editor-header">
      <div class="header-left">
        <button @click="goBack" class="back-button">
          <span class="back-icon">←</span>
          {{ backButtonText }}
        </button>
      </div>
      
      <div class="header-center">
        <div class="save-status" :class="saveStatusClass">
          {{ saveStatusText }}
        </div>
      </div>
      
      <div class="header-right">
        <button 
          @click="handleSave" 
          :disabled="saveDisabled"
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
      <p>{{ loadingText }}</p>
    </div>
    
    <!-- Error state -->
    <div v-else-if="error" class="error-state">
      <div class="error-icon">⚠️</div>
      <h3>{{ errorTitle }}</h3>
      <p>{{ error }}</p>
      <button @click="handleRetry" class="retry-button">
        Try Again
      </button>
    </div>
    
    <!-- Contenu de l'éditeur (slot) -->
    <div v-else class="editor-content">
      <slot 
        name="content"
        :isNew="isNew"
        :isSaving="isSaving"
        :hasChanges="hasChanges"
      />
    </div>
    
    <!-- Help panel (commun) -->
    <div v-if="showHelp" class="help-panel" @click="showHelp = false">
      <div class="help-content" @click.stop>
        <h3>Keyboard Shortcuts</h3>
        <div class="shortcuts">
          <div class="shortcut">
            <kbd>Ctrl</kbd> + <kbd>S</kbd>
            <span>Save</span>
          </div>
          <div class="shortcut">
            <kbd>Ctrl</kbd> + <kbd>K</kbd>
            <span>Toggle Search</span>
          </div>
          <div class="shortcut">
            <kbd>Ctrl</kbd> + <kbd>H</kbd>
            <span>Show Help</span>
          </div>
          <div class="shortcut">
            <kbd>Esc</kbd>
            <span>Go Back</span>
          </div>
        </div>
        <slot name="shortcuts" />
        <button @click="showHelp = false" class="close-help">
          Close
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'

interface Props {
  // Configuration de base
  editorType: 'project' | 'retouche' | string
  isNew?: boolean
  isLoading?: boolean
  isSaving?: boolean
  hasChanges?: boolean
  error?: string | null
  
  // Textes personnalisables
  backButtonText?: string
  loadingText?: string
  errorTitle?: string
}

const props = withDefaults(defineProps<Props>(), {
  isNew: false,
  isLoading: false,
  isSaving: false,
  hasChanges: false,
  error: null,
  backButtonText: '',
  loadingText: '',
  errorTitle: ''
})

// Emit events
const emit = defineEmits<{
  save: []
  back: []
  retry: []
}>()

// État local
const showHelp = ref(false)

// Computed properties
const editorClass = computed(() => `${props.editorType}-editor`)

const saveStatusClass = computed(() => {
  if (props.isSaving) return 'saving'
  if (props.hasChanges) return 'unsaved'
  return 'saved'
})

const saveStatusText = computed(() => {
  if (props.isSaving) return 'Saving...'
  if (props.hasChanges) return 'Unsaved changes'
  return 'All changes saved'
})

const saveDisabled = computed(() => {
  return props.isSaving || (!props.hasChanges && !props.isNew)
})

// Textes par défaut basés sur le type
const defaultLoadingText = computed(() => {
  const action = props.isNew ? 'Preparing new' : 'Loading'
  return props.loadingText || `${action} ${props.editorType}...`
})

const defaultErrorTitle = computed(() => {
  return props.errorTitle || `Error loading ${props.editorType}`
})

const defaultBackButtonText = computed(() => {
  if (props.backButtonText) return props.backButtonText
  return props.editorType.charAt(0).toUpperCase() + props.editorType.slice(1) + 's'
})

// Event handlers
const handleSave = () => {
  emit('save')
}

const goBack = () => {
  emit('back')
}

const handleRetry = () => {
  emit('retry')
}

// Keyboard shortcuts
const handleKeydown = (event: KeyboardEvent) => {
  if (event.ctrlKey || event.metaKey) {
    switch (event.key) {
      case 's':
        event.preventDefault()
        if (!saveDisabled.value) {
          handleSave()
        }
        break
      case 'k':
        event.preventDefault()
        // Toggle search - sera géré par le composant parent
        break
      case 'h':
        event.preventDefault()
        showHelp.value = !showHelp.value
        break
    }
  } else if (event.key === 'Escape') {
    if (showHelp.value) {
      showHelp.value = false
    } else {
      goBack()
    }
  }
}

// Lifecycle
onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
})
</script>

<style scoped lang="scss">
/* Styles communs pour tous les éditeurs */
.project-editor,
.retouche-editor {
  height: 100vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  background: var(--color-gray-lightest, #fafafa);
}

.editor-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 2rem;
  background: white;
  border-bottom: 1px solid var(--color-gray-light, #e0e0e0);
  z-index: 100;
  position: sticky;
  top: 0;
}

.header-left,
.header-center,
.header-right {
  flex: 1;
  display: flex;
  align-items: center;
}

.header-center {
  justify-content: center;
}

.header-right {
  justify-content: flex-end;
}

.back-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: transparent;
  border: 1px solid var(--color-gray-light, #e0e0e0);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background: var(--color-gray-lightest, #fafafa);
  }
}

.back-icon {
  font-size: 1.2rem;
  color: var(--color-gray-dark, #333);
}

.save-status {
  padding: 0.25rem 0.75rem;
  border-radius: 4px;
  font-size: 0.875rem;
  font-weight: 500;
  transition: all 0.2s ease;
  
  &.saving {
    background: var(--color-orange-light, #fff3e0);
    color: var(--color-orange-dark, #e65100);
  }
  
  &.unsaved {
    background: var(--color-red-light, #ffebee);
    color: var(--color-red-dark, #c62828);
  }
  
  &.saved {
    background: var(--color-green-light, #e8f5e8);
    color: var(--color-green-dark, #2e7d32);
  }
}

.save-button {
  padding: 0.75rem 1.5rem;
  background: var(--color-gray-dark, #333);
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s ease;
  
  &:hover:not(:disabled) {
    background: var(--color-black, #000);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  &.saving {
    background: var(--color-orange-dark, #e65100);
  }
}

.loading-state,
.error-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  text-align: center;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid var(--color-gray-light, #e0e0e0);
  border-top: 3px solid var(--color-gray-dark, #333);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.error-state h3 {
  margin-bottom: 0.5rem;
  color: var(--color-red-dark, #c62828);
}

.retry-button {
  margin-top: 1rem;
  padding: 0.5rem 1rem;
  background: var(--color-gray-dark, #333);
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.editor-content {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.help-panel {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.help-content {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  max-width: 400px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
}

.help-content h3 {
  margin-bottom: 1rem;
  text-align: center;
}

.shortcuts {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
}

.shortcut {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.5rem 0;
  border-bottom: 1px solid var(--color-gray-light, #e0e0e0);
  
  &:last-child {
    border-bottom: none;
  }
}

kbd {
  padding: 0.25rem 0.5rem;
  background: var(--color-gray-lightest, #fafafa);
  border: 1px solid var(--color-gray-light, #e0e0e0);
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 500;
}

.close-help {
  width: 100%;
  padding: 0.75rem;
  background: var(--color-gray-dark, #333);
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}
</style>