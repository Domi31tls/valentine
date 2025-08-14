<template>
  <div class="about-editor">
    <!-- Header -->
    <div class="about-editor-header">
      <div class="about-editor-header-left">
        <h1 class="about-editor-header__title page-heading">About</h1>
        <span class="about-editor-header__sub">Update the about me content</span>
      </div>
      <div class="about-editor-header-right">
        <div class="about-editor-header__indicator" :class="{ 'saving': isSaving, 'saved': !hasUnsavedChanges }">
          <span>{{ saveStatus }}</span>
        </div>
        <button class="button-primary" @click="savePage" :disabled="isSaving">
          Save
        </button>
      </div>
    </div>

    <!-- Loading state -->
    <div v-if="isLoading" class="loading-state">
      <div class="spinner"></div>
      <p>Chargement de la page About...</p>
    </div>

    <!-- Error state -->
    <div v-else-if="error" class="error-state">
      <div class="error-icon">⚠️</div>
      <h3>Error loading projects</h3>
      <p>{{ error }}</p>
      <button class="button-primary" @click="fetchAboutPage">Réessayer</button>
    </div>

    <!-- Editor content -->
    <div v-else class="about-editor-content">
      <!-- Exergue section -->
      <div class="exergue-section">
        <label class="exergue-section__title">Exergue</label>
        <div class="exergue-section__input-wrapper">
          <textarea 
            v-model="aboutData.exergue"
            @input="onExergueChange"
            class="exergue-section__input"
            placeholder="Votre citation ou présentation principale..."
            rows="3"
          ></textarea>
          <div class="exergue-section__info">
            <span class="char-count" :class="{ 'warning': exergueLength > 300 }">
              {{ exergueLength }} caractères
            </span>
          </div>
        </div>
      </div>

      <!-- Properties section -->
      <div class="properties-section">

        <!-- Properties list -->
        <div class="properties-list" @dragover="onDragOver" @drop="onDrop">
          <!-- Content -->
          <div class="properties-list__category">
            <h3 class="properties-list__category-title">Content</h3>
            <div class="properties-list__category-items">
              <div 
                class="properties-list__category-item" 
                :key="property.id" 
                v-for="(property, index) in aboutData.properties.filter(p => p.type === 'text')"
                :class="{ 'drag-target': isDragTarget(property.id) }"
                @dragover.prevent="onItemDragOver($event, property.id)"
                @dragleave="onItemDragLeave"
                @drop="onItemDrop($event, property.id)"
              >
                <div class="drop-indicator" v-if="showDropIndicator === property.id"></div>
                <AboutProperty
                  :property="property"
                  :index="getGlobalIndex(property.id)"
                  @update="updateProperty"
                  @delete="deleteProperty"
                  @duplicate="duplicateProperty"
                  @dragstart="onDragStart"
                  @dragend="onDragEnd"
                />
              </div>
              
              <!-- Zone de drop à la fin de Content -->
              <div 
                class="drop-zone-end"
                @dragover.prevent="onEndZoneDragOver($event, 'text')"
                @dragleave="onItemDragLeave"
                @drop="onEndZoneDrop($event, 'text')"
                :class="{ 'active': showDropIndicator === 'end-text' }"
              >
                <div class="drop-indicator" v-if="showDropIndicator === 'end-text'"></div>
              </div>
            </div>
            <button @click="addProperty('text')" class="property-button">
              <PlusIcon/>
              Add property
            </button>
          </div>

          <!-- Clients -->
          <div class="properties-list__category">
            <h3 class="properties-list__category-title">Clients</h3>
            <div class="properties-list__category-items">
              <div 
                class="properties-list__category-item" 
                :key="property.id" 
                v-for="(property, index) in aboutData.properties.filter(p => p.type === 'client')"
                :class="{ 'drag-target': isDragTarget(property.id) }"
                @dragover.prevent="onItemDragOver($event, property.id)"
                @dragleave="onItemDragLeave"
                @drop="onItemDrop($event, property.id)"
              >
                <div class="drop-indicator" v-if="showDropIndicator === property.id"></div>
                <AboutProperty
                  :property="property"
                  :index="getGlobalIndex(property.id)"
                  @update="updateProperty"
                  @delete="deleteProperty"
                  @duplicate="duplicateProperty"
                  @dragstart="onDragStart"
                  @dragend="onDragEnd"
                />
              </div>
            </div>

            <!-- Zone de drop à la fin de Clients -->
            <div 
                class="drop-zone-end"
                @dragover.prevent="onEndZoneDragOver($event, 'client')"
                @dragleave="onItemDragLeave"
                @drop="onEndZoneDrop($event, 'client')"
                :class="{ 'active': showDropIndicator === 'end-client' }"
              >
                <div class="drop-indicator" v-if="showDropIndicator === 'end-client'"></div>
              </div>
            <button @click="addProperty('client')" class="property-button">
              <PlusIcon/>
              Add property
            </button>
          </div>

          <!-- Contacts -->
          <div class="properties-list__category">
            <h3 class="properties-list__category-title">Contacts</h3>
            <div class="properties-list__category-items">
              <div 
                class="properties-list__category-item" 
                :key="property.id" 
                v-for="(property, index) in aboutData.properties.filter(p => p.type === 'contact')"
                :class="{ 'drag-target': isDragTarget(property.id) }"
                @dragover.prevent="onItemDragOver($event, property.id)"
                @dragleave="onItemDragLeave"
                @drop="onItemDrop($event, property.id)"
              >
                <div class="drop-indicator" v-if="showDropIndicator === property.id"></div>
                <AboutProperty
                  :property="property"
                  :index="getGlobalIndex(property.id)"
                  @update="updateProperty"
                  @delete="deleteProperty"
                  @duplicate="duplicateProperty"
                  @dragstart="onDragStart"
                  @dragend="onDragEnd"
                />
              </div>
            </div>
            <!-- Zone de drop à la fin de Contacts -->
            <div 
                class="drop-zone-end"
                @dragover.prevent="onEndZoneDragOver($event, 'contact')"
                @dragleave="onItemDragLeave"
                @drop="onEndZoneDrop($event, 'contact')"
                :class="{ 'active': showDropIndicator === 'end-contact' }"
              >
                <div class="drop-indicator" v-if="showDropIndicator === 'end-contact'"></div>
              </div>
            <button @click="addProperty('contact')" class="property-button">
              <PlusIcon/>
              Add property
            </button>
          </div>
        </div>

        <!-- Empty state -->
        <div v-if="aboutData.properties.length === 0" class="empty-state">
          <div class="empty-state-icon"><CameraIcon /></div>
          <h3>No Content yet</h3>
          <p>Add text, client and contact properties to make you about page</p>
          <button class="button-primary" @click="showAddMenu = true">
            Add the first property
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted, watch } from 'vue';
import { useApi } from '@/composables/useApi';
import { useDebounce } from '@/composables/useDebounce';
import AboutProperty from '@/components/admin/about/AboutProperty.vue';
import type { AboutPage, AboutProperty as AboutPropertyType } from '@/../../shared/types';
import PlusIcon from '@/Icons/plus.vue';

// Reactive state
const aboutData = reactive<AboutPage>({
  id: 1,
  exergue: '',
  properties: [],
  updated_at: new Date()
});

const isLoading = ref(true);
const isSaving = ref(false);
const hasUnsavedChanges = ref(false);
const error = ref<string | null>(null);
const showAddMenu = ref(false);
const draggedPropertyId = ref<string | null>(null);
const showDropIndicator = ref<string | null>(null);

// API composable
const { fetchData, postData } = useApi();

// Computed properties
const exergueLength = computed(() => aboutData.exergue.length);

const saveStatus = computed(() => {
  if (isSaving.value) return 'Saving...';
  if (hasUnsavedChanges.value) return 'Draft';
  return 'Saved';
});

// Debounced auto-save
const debouncedSave = useDebounce(() => {
  if (hasUnsavedChanges.value && !isSaving.value) {
    savePage();
  }
}, 2000);

// Watchers
watch(
  () => aboutData.exergue,
  () => {
    hasUnsavedChanges.value = true;
    debouncedSave();
  }
);

watch(
  () => aboutData.properties,
  () => {
    hasUnsavedChanges.value = true;
    debouncedSave();
  },
  { deep: true }
);

// Methods
const fetchAboutPage = async () => {
  try {
    isLoading.value = true;
    error.value = null;
    
    const response = await fetchData('/api/about');
    
    if (response.success && response.data) {
      Object.assign(aboutData, response.data);
      hasUnsavedChanges.value = false;
    } else {
      error.value = response.error || 'Erreur lors du chargement';
    }
  } catch (err) {
    error.value = 'Erreur de connexion';
    console.error('Error fetching about page:', err);
  } finally {
    isLoading.value = false;
  }
};

const savePage = async () => {
  try {
    isSaving.value = true;
    error.value = null;
    
    const response = await postData('/api/about', {
      exergue: aboutData.exergue,
      properties: aboutData.properties
    }, 'PUT');
    
    if (response.success) {
      hasUnsavedChanges.value = false;
      aboutData.updated_at = new Date();
    } else {
      error.value = response.error || 'Erreur lors de la sauvegarde';
    }
  } catch (err) {
    error.value = 'Erreur de connexion';
    console.error('Error saving about page:', err);
  } finally {
    isSaving.value = false;
  }
};

const onExergueChange = () => {
  hasUnsavedChanges.value = true;
};

const addProperty = (type: 'text' | 'client' | 'contact') => {
  const newProperty: AboutPropertyType = {
    id: `prop_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type,
    order: aboutData.properties.length,
    data: getDefaultPropertyData(type)
  };
  
  aboutData.properties.push(newProperty);
  showAddMenu.value = false;
  hasUnsavedChanges.value = true;
};

const getDefaultPropertyData = (type: string) => {
  switch (type) {
    case 'text':
      return { title: '', content: '' };
    case 'client':
      return { name: '', logo_url: '', website_url: '' };
    case 'contact':
      return { label: '', url: '' };
    default:
      return {};
  }
};

const updateProperty = (index: number, updatedProperty: AboutPropertyType) => {
  if (index >= 0 && index < aboutData.properties.length) {
    aboutData.properties[index] = updatedProperty;
    hasUnsavedChanges.value = true;
  }
};

const deleteProperty = (index: number) => {
  if (index >= 0 && index < aboutData.properties.length) {
    aboutData.properties.splice(index, 1);
    // Réorganiser les index
    aboutData.properties.forEach((prop, i) => {
      prop.order = i;
    });
    hasUnsavedChanges.value = true;
  }
};

const duplicateProperty = (index: number) => {
  if (index >= 0 && index < aboutData.properties.length) {
    const originalProperty = aboutData.properties[index];
    const duplicatedProperty: AboutPropertyType = {
      id: `prop_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: originalProperty.type,
      order: originalProperty.order + 1,
      data: { ...originalProperty.data }
    };
    
    aboutData.properties.splice(index + 1, 0, duplicatedProperty);
    // Réorganiser les index
    aboutData.properties.forEach((prop, i) => {
      prop.order = i;
    });
    hasUnsavedChanges.value = true;
  }
};

const getGlobalIndex = (propertyId: string): number => {
  return aboutData.properties.findIndex(p => p.id === propertyId);
};

// Drag & Drop handlers
const onDragStart = (event: DragEvent, index: number) => {
  const property = aboutData.properties[index];
  if (property) {
    draggedPropertyId.value = property.id;
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', property.id);
    }
  }
};

const onDragEnd = () => {
  draggedPropertyId.value = null;
  showDropIndicator.value = null;
};

const onDragOver = (event: DragEvent) => {
  event.preventDefault();
  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = 'move';
  }
};

const onItemDragOver = (event: DragEvent, targetPropertyId: string) => {
  event.preventDefault();
  event.stopPropagation();
  
  if (draggedPropertyId.value && draggedPropertyId.value !== targetPropertyId) {
    showDropIndicator.value = targetPropertyId;
  }
};

const onItemDragLeave = (event: DragEvent) => {
  // Ne masquer l'indicateur que si on quitte vraiment l'élément
  const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
  const x = event.clientX;
  const y = event.clientY;
  
  if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
    showDropIndicator.value = null;
  }
};

const onItemDrop = (event: DragEvent, targetPropertyId: string) => {
  event.preventDefault();
  event.stopPropagation();
  
  if (!draggedPropertyId.value || draggedPropertyId.value === targetPropertyId) {
    return;
  }
  
  const draggedIndex = aboutData.properties.findIndex(p => p.id === draggedPropertyId.value);
  const targetIndex = aboutData.properties.findIndex(p => p.id === targetPropertyId);
  
  if (draggedIndex !== -1 && targetIndex !== -1 && draggedIndex !== targetIndex) {
    // Déterminer si on drop avant ou après l'élément cible
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    const dropY = event.clientY;
    const elementCenter = rect.top + rect.height / 2;
    const insertAfter = dropY > elementCenter;
    
    const finalTargetIndex = insertAfter ? targetIndex + 1 : targetIndex;
    
    // Déplacer l'élément
    const draggedProperty = aboutData.properties[draggedIndex];
    aboutData.properties.splice(draggedIndex, 1);
    
    // Ajuster l'index si nécessaire
    const adjustedIndex = draggedIndex < finalTargetIndex ? finalTargetIndex - 1 : finalTargetIndex;
    aboutData.properties.splice(adjustedIndex, 0, draggedProperty);
    
    // Réorganiser les index
    aboutData.properties.forEach((prop, i) => {
      prop.order = i;
    });
    
    hasUnsavedChanges.value = true;
  }
  
  draggedPropertyId.value = null;
  showDropIndicator.value = null;
};

const onDrop = (event: DragEvent) => {
  event.preventDefault();
  // Fallback si le drop ne se fait pas sur un item spécifique
  draggedPropertyId.value = null;
  showDropIndicator.value = null;
};

const isDragTarget = (propertyId: string): boolean => {
  return draggedPropertyId.value !== null && draggedPropertyId.value !== propertyId;
};

// Méthodes pour les zones de drop de fin
const onEndZoneDragOver = (event: DragEvent, categoryType: string) => {
  event.preventDefault();
  event.stopPropagation();
  
  if (draggedPropertyId.value) {
    showDropIndicator.value = `end-${categoryType}`;
  }
};

const onEndZoneDrop = (event: DragEvent, categoryType: string) => {
  event.preventDefault();
  event.stopPropagation();
  
  if (!draggedPropertyId.value) return;
  
  const draggedIndex = aboutData.properties.findIndex(p => p.id === draggedPropertyId.value);
  if (draggedIndex === -1) return;
  
  // Trouver le dernier élément de cette catégorie
  const categoryProperties = aboutData.properties.filter(p => p.type === categoryType);
  if (categoryProperties.length === 0) {
    // Aucun élément dans cette catégorie, placer à la fin selon l'ordre des catégories
    const draggedProperty = aboutData.properties[draggedIndex];
    aboutData.properties.splice(draggedIndex, 1);
    
    // Déterminer la position selon l'ordre des catégories
    let insertIndex = aboutData.properties.length;
    if (categoryType === 'text') {
      insertIndex = 0;
    } else if (categoryType === 'client') {
      const lastTextIndex = aboutData.properties.findLastIndex(p => p.type === 'text');
      insertIndex = lastTextIndex + 1;
    }
    // Pour 'contact', on insert à la fin
    
    aboutData.properties.splice(insertIndex, 0, draggedProperty);
  } else {
    // Placer après le dernier élément de cette catégorie
    const lastCategoryProperty = categoryProperties[categoryProperties.length - 1];
    const lastCategoryIndex = aboutData.properties.findIndex(p => p.id === lastCategoryProperty.id);
    
    const draggedProperty = aboutData.properties[draggedIndex];
    aboutData.properties.splice(draggedIndex, 1);
    
    // Ajuster l'index si nécessaire
    const adjustedIndex = draggedIndex < lastCategoryIndex ? lastCategoryIndex : lastCategoryIndex + 1;
    aboutData.properties.splice(adjustedIndex, 0, draggedProperty);
  }
  
  // Réorganiser les index
  aboutData.properties.forEach((prop, i) => {
    prop.order = i;
  });
  
  hasUnsavedChanges.value = true;
  draggedPropertyId.value = null;
  showDropIndicator.value = null;
};

// Lifecycle
onMounted(() => {
  fetchAboutPage();
});

// Keyboard shortcuts
const handleKeyboardShortcuts = (event: KeyboardEvent) => {
  if (event.ctrlKey || event.metaKey) {
    switch (event.code) {
      case 'KeyS':
        event.preventDefault();
        savePage();
        break;
      case 'KeyN':
        event.preventDefault();
        showAddMenu.value = !showAddMenu.value;
        break;
    }
  }
};

onMounted(() => {
  document.addEventListener('keydown', handleKeyboardShortcuts);
});

// Cleanup
onUnmounted(() => {
  document.removeEventListener('keydown', handleKeyboardShortcuts);
});
</script>

<style scoped lang="scss">
.about-editor {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-7);

    &__input {
    appearance: none;
    border: none;
    outline: none;
    background: var(--color-background-secondary);
    padding: var(--spacing-4);
    border-radius: var(--border-radius-m);
    color: var(--color-text);

    width: 100%;
    min-height: 200px;

    &::placeholder {
      color: var(--color-text);
      opacity: 0.3;
    }

    &-wrapper {
      width: 100%;
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: var(--spacing-1);
    }
    
  }

  &__info {
    font-size: var(--font-size-xs);
    color: var(--color-text-secondary);
  }

  &-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: var(--spacing-6);

      &-left {
        display: flex;
        flex-direction: column;
        gap: 0;
      }

      &__sub {
        color: var(--color-text-secondary);
      }

      &-right {
        display: flex;
        flex-direction: row;
        align-items: center;
        gap: var(--spacing-6);

        @media (max-width: 1024px){
          gap: var(--spacing-3);
        }
      }

      &__indicator {
        font-size: var(--font-size-xs);
        color: var(--color-text-secondary);
        
        position: relative;

        &::before {
          content: '';
          width: var(--spacing-2);
          height: var(--spacing-2);
          border-radius: var(--border-radius-full);

          background-color: var(--color-error-text);

          position: absolute;
          right: 100%;
          top: 50%;
          transform: translateY(-50%);
          margin-right: var(--spacing-1);
        }

        &.saved::before {
          background-color: var(--color-success-text);
        }

        &.saving::before {
          background-color: var(--color-warning-text);
        }
      }
    }

  &-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: var(--spacing-4);
    max-width: 650px;
  }
}

.property-button {
  display: flex;
  width: 200px;
  padding: var(--spacing-2);
  align-items: center;
  gap: var(--spacing-2);
  color: var(--color-text-secondary);
  border-radius: var(--border-radius-s);

  transition: background-color var(--transition-base), color var(--transition-easing-spring);

  &:hover {
    background-color: var(--color-background-secondary);
  }

  & svg {
    width: var(--spacing-4);
    height: var(--spacing-4);
  }
}

.properties-list {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--spacing-6);
  flex: 1 0 0;
  align-self: stretch;

  &__category {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: var(--spacing-4);
    flex: 1;
    width: 100%;

    &-title {
      color: var(--color-text-secondary);
      font-size: var(--font-size-s);
    }
    
    &-items {
      width: 100%;
      display: flex;
      flex-direction: column;
      gap: var(--spacing-2);
    }

    &-item {
      width: 100%;
      position: relative;
      transition: all var(--transition-base);
      
      .drop-indicator {
        position: absolute;
        top: -2px;
        left: 0;
        right: 0;
        height: var(--spacing-1);
        background: linear-gradient(90deg, #007AFF, #5856D6, #007AFF);
        border-radius: var(--spacing-1);
        z-index: 100;
        animation: pulse 0.6s ease-in-out infinite alternate;
      }
    }
  }
}

.exergue-section {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--spacing-4);

  &__title {
    color: var(--color-text-secondary);
    font-size: var(--font-size-s);
  }

  &__input {
    appearance: none;
    border: none;
    outline: none;
    background: var(--color-background-secondary);
    padding: var(--spacing-4);
    border-radius: var(--border-radius-m);
    color: var(--color-text);

    width: 100%;
    min-height: 200px;

    &::placeholder {
      color: var(--color-text);
      opacity: 0.3;
    }

    &-wrapper {
      width: 100%;
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: var(--spacing-1);
    }
    
  }

  &__info {
    font-size: var(--font-size-xs);
    color: var(--color-text-secondary);
  }
}

.property-button {
  display: flex;
  width: 200px;
  padding: var(--spacing-2);
  align-items: center;
  gap: var(--spacing-2);
  color: var(--color-text-secondary);
  border-radius: var(--border-radius-s);

  transition: background-color var(--transition-base), color var(--transition-easing-spring);

  &:hover {
    background-color: var(--color-background-secondary);
  }

  & svg {
    width: var(--spacing-4);
    height: var(--spacing-4);
  }
}

.drop-zone-end {
  width: 100%;
  height: 20px;
  position: relative;
  
  &.active {
    .drop-indicator {
      position: absolute;
      top: 50%;
      left: 0;
      right: 0;
      height: 8px;
      background: linear-gradient(90deg, #007AFF, #5856D6, #007AFF);
      border-radius: var(--spacing-1);
      z-index: 100;
      animation: pulse 0.6s ease-in-out infinite alternate;
      transform: translateY(-50%);
    }
  }
}

// Animations
@keyframes pulse {
  0% {
    opacity: 0.6;
    transform: scaleY(1);
  }
  100% {
    opacity: 1;
    transform: scaleY(1.2);
  }
}
</style>
