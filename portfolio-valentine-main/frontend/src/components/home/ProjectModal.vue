<template>
  <Teleport to="body">
    <div 
      class="project-modal-overlay"
      @click="handleOverlayClick"
      @keydown.esc="closeModal"
      tabindex="0"
      ref="modalOverlay"
    >
      <div class="project-modal" @click.stop>
        <!-- Header modal -->
        <header class="modal-header">
          <div class="header-content">
            <div class="project-info">
              <h1 class="modal-title">{{ project.title }}</h1>
              <p v-if="project.description" class="modal-subtitle">{{ project.description }}</p>
            </div>
            
            <button 
              class="close-button" 
              @click="closeModal"
              aria-label="Fermer la modal"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
          
          <!-- Navigation images -->
          <div v-if="project.images && project.images.length > 1" class="image-navigation">
            <button 
              @click="previousImage" 
              :disabled="currentImageIndex === 0"
              class="nav-button prev"
              aria-label="Image précédente"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="15,18 9,12 15,6"></polyline>
              </svg>
            </button>
            
            <span class="image-counter">
              {{ currentImageIndex + 1 }} / {{ project.images.length }}
            </span>
            
            <button 
              @click="nextImage" 
              :disabled="currentImageIndex === project.images.length - 1"
              class="nav-button next"
              aria-label="Image suivante"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="9,18 15,12 9,6"></polyline>
              </svg>
            </button>
          </div>
        </header>

        <!-- Contenu principal -->
        <main class="modal-content">
          <!-- Galerie d'images -->
          <div class="image-gallery" v-if="project.images && project.images.length > 0">
            <div class="main-image-container">
              <img
                :src="currentImage.url || currentImage.file_path"
                :alt="currentImage.alt || currentImage.alt_text || project.title"
                class="main-image"
                @load="handleImageLoad"
                @error="handleImageError"
              />
              
              <!-- Loading indicator -->
              <div v-if="imageLoading" class="image-loading">
                <div class="loading-spinner"></div>
              </div>
            </div>
            
            <!-- Thumbnails (si plusieurs images) -->
            <div v-if="project.images.length > 1" class="thumbnails-container">
              <div class="thumbnails-scroll">
                <button
                  v-for="(image, index) in project.images"
                  :key="image.id"
                  class="thumbnail"
                  :class="{ active: index === currentImageIndex }"
                  @click="setCurrentImage(index)"
                >
                  <img
                    :src="image.url || image.file_path"
                    :alt="image.alt || image.alt_text || `${project.title} - Image ${index + 1}`"
                    loading="lazy"
                  />
                </button>
              </div>
            </div>
          </div>
          
          <!-- Placeholder si pas d'images -->
          <div v-else class="no-images">
            <div class="no-images-icon">📷</div>
            <p>Aucune image disponible</p>
          </div>
        </main>

        <!-- Sidebar avec détails -->
        <aside class="modal-sidebar">
          <div class="sidebar-content">
            <!-- Métadonnées projet -->
            <section class="project-details">
              <h3 class="section-title">Détails</h3>
              
              <div class="detail-item" v-if="project.seo_keywords">
                <span class="detail-label">Catégories</span>
                <div class="categories">
                  <span 
                    v-for="keyword in keywords" 
                    :key="keyword"
                    class="category-tag"
                  >
                    {{ keyword }}
                  </span>
                </div>
              </div>
              
              <div class="detail-item" v-if="project.images">
                <span class="detail-label">Images</span>
                <span class="detail-value">{{ project.images.length }} {{ project.images.length > 1 ? 'images' : 'image' }}</span>
              </div>
              
              <div class="detail-item" v-if="project.created_at">
                <span class="detail-label">Créé le</span>
                <span class="detail-value">{{ formatDate(project.created_at) }}</span>
              </div>
            </section>
            
            <!-- Actions -->
            <section class="project-actions">
              <button 
                v-if="project.images && project.images.length > 0" 
                @click="downloadCurrentImage"
                class="action-button download"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="7,10 12,15 17,10"></polyline>
                  <line x1="12" y1="15" x2="12" y2="3"></line>
                </svg>
                Télécharger l'image
              </button>
            </section>
          </div>
        </aside>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick, defineEmits } from 'vue'
import type { Project, Media } from '@/../../shared/types'

interface Props {
  project: Project
}

const props = defineProps<Props>()

// Events
const emit = defineEmits<{
  close: []
}>()

// État
const modalOverlay = ref<HTMLElement>()
const currentImageIndex = ref(0)
const imageLoading = ref(false)

// Image actuelle
const currentImage = computed((): Media => {
  if (!props.project.images || props.project.images.length === 0) {
    throw new Error('Aucune image disponible')
  }
  return props.project.images[currentImageIndex.value]
})

// Keywords formatés
const keywords = computed(() => {
  if (!props.project.seo_keywords) return []
  return props.project.seo_keywords.split(',').map(k => k.trim()).filter(Boolean)
})

// Navigation images
const nextImage = () => {
  if (!props.project.images) return
  if (currentImageIndex.value < props.project.images.length - 1) {
    currentImageIndex.value++
  }
}

const previousImage = () => {
  if (currentImageIndex.value > 0) {
    currentImageIndex.value--
  }
}

const setCurrentImage = (index: number) => {
  currentImageIndex.value = index
}

// Handlers
const closeModal = () => {
  emit('close')
}

const handleOverlayClick = (event: MouseEvent) => {
  if (event.target === modalOverlay.value) {
    closeModal()
  }
}

const handleImageLoad = () => {
  imageLoading.value = false
}

const handleImageError = () => {
  imageLoading.value = false
  console.error('Erreur de chargement de l\'image')
}

const downloadCurrentImage = () => {
  if (!currentImage.value) return
  
  const link = document.createElement('a')
  link.href = currentImage.value.file_path
  link.download = `${props.project.title}-${currentImageIndex.value + 1}.jpg`
  link.click()
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

// Gestion clavier
const handleKeydown = (event: KeyboardEvent) => {
  switch (event.key) {
    case 'Escape':
      closeModal()
      break
    case 'ArrowLeft':
      event.preventDefault()
      previousImage()
      break
    case 'ArrowRight':
      event.preventDefault()
      nextImage()
      break
  }
}

// Lifecycle
onMounted(async () => {
  // Focus sur la modal pour la navigation clavier
  await nextTick()
  modalOverlay.value?.focus()
  
  // Ajouter listener clavier
  document.addEventListener('keydown', handleKeydown)
  
  // Démarrer avec l'image principale si elle existe
  if (props.project.images && props.project.images.length > 0) {
    const primaryIndex = props.project.images.findIndex(img => img.is_primary)
    if (primaryIndex !== -1) {
      currentImageIndex.value = primaryIndex
    }
  }
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
})
</script>

<style lang="scss" scoped>
.project-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.95);
  backdrop-filter: blur(10px);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-lg);
  outline: none;
  
  animation: fadeIn 0.3s ease;
}

.project-modal {
  width: 100%;
  height: 100%;
  max-width: 1400px;
  max-height: 900px;
  background: var(--color-background);
  border-radius: 12px;
  display: grid;
  grid-template-areas: 
    "header header"
    "content sidebar";
  grid-template-rows: auto 1fr;
  grid-template-columns: 1fr 300px;
  overflow: hidden;
  
  animation: slideUp 0.4s ease;
  
  @media (max-width: 1024px) {
    grid-template-areas: 
      "header"
      "content"
      "sidebar";
    grid-template-rows: auto 1fr auto;
    grid-template-columns: 1fr;
    max-height: 95vh;
  }
  
  @media (max-width: 768px) {
    margin: var(--spacing-md);
    border-radius: 8px;
  }
}

// Header
.modal-header {
  grid-area: header;
  padding: var(--spacing-lg);
  border-bottom: 1px solid var(--color-border);
  background: var(--color-background);
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: var(--spacing-md);
}

.project-info {
  flex: 1;
  margin-right: var(--spacing-lg);
}

.modal-title {
  font-size: 1.8rem;
  font-weight: 600;
  color: var(--color-text);
  margin: 0 0 var(--spacing-xs);
  line-height: 1.2;
}

.modal-subtitle {
  font-size: 1rem;
  color: var(--color-text-secondary);
  margin: 0;
  line-height: 1.4;
}

.close-button {
  background: none;
  border: none;
  color: var(--color-text-secondary);
  cursor: pointer;
  padding: var(--spacing-sm);
  border-radius: 6px;
  transition: all 0.2s ease;
  
  &:hover {
    background: var(--color-background-secondary);
    color: var(--color-text);
  }
}

// Navigation images
.image-navigation {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-md);
}

.nav-button {
  background: var(--color-background-secondary);
  border: none;
  color: var(--color-text);
  cursor: pointer;
  padding: var(--spacing-sm);
  border-radius: 6px;
  transition: all 0.2s ease;
  
  &:hover:not(:disabled) {
    background: var(--color-background-inverted);
    color: var(--color-text-inverted);
  }
  
  &:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }
}

.image-counter {
  font-size: 0.9rem;
  color: var(--color-text-secondary);
  font-weight: 500;
  min-width: 60px;
  text-align: center;
}

// Contenu principal
.modal-content {
  grid-area: content;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.image-gallery {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.main-image-container {
  flex: 1;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-background-secondary);
  overflow: hidden;
}

.main-image {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  border-radius: 4px;
}

.image-loading {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid var(--color-border);
  border-top: 3px solid var(--color-text);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

// Thumbnails
.thumbnails-container {
  padding: var(--spacing-lg);
  border-top: 1px solid var(--color-border);
  background: var(--color-background);
}

.thumbnails-scroll {
  display: flex;
  gap: var(--spacing-sm);
  overflow-x: auto;
  padding-bottom: var(--spacing-sm);
}

.thumbnail {
  flex-shrink: 0;
  width: 80px;
  height: 60px;
  border: 2px solid transparent;
  border-radius: 4px;
  overflow: hidden;
  cursor: pointer;
  transition: border-color 0.2s ease;
  background: none;
  padding: 0;
  
  &.active {
    border-color: var(--color-text);
  }
  
  &:hover {
    border-color: var(--color-text-secondary);
  }
  
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}

// Sidebar
.modal-sidebar {
  grid-area: sidebar;
  background: var(--color-background-secondary);
  border-left: 1px solid var(--color-border);
  overflow-y: auto;
  
  @media (max-width: 1024px) {
    border-left: none;
    border-top: 1px solid var(--color-border);
    max-height: 200px;
  }
}

.sidebar-content {
  padding: var(--spacing-lg);
}

.section-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--color-text);
  margin: 0 0 var(--spacing-md);
}

.project-details {
  margin-bottom: var(--spacing-xl);
}

.detail-item {
  margin-bottom: var(--spacing-md);
  
  &:last-child {
    margin-bottom: 0;
  }
}

.detail-label {
  display: block;
  font-size: 0.85rem;
  font-weight: 500;
  color: var(--color-text-secondary);
  margin-bottom: var(--spacing-xs);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.detail-value {
  font-size: 0.95rem;
  color: var(--color-text);
}

.categories {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-xs);
}

.category-tag {
  background: var(--color-background);
  color: var(--color-text);
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: 4px;
  font-size: 0.8rem;
  font-weight: 500;
}

// Actions
.action-button {
  width: 100%;
  background: var(--color-text);
  color: var(--color-text-inverted);
  border: none;
  padding: var(--spacing-md);
  border-radius: 6px;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-sm);
  transition: all 0.2s ease;
  
  &:hover {
    background: var(--color-text-secondary);
  }
}

// No images
.no-images {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--color-text-secondary);
}

.no-images-icon {
  font-size: 3rem;
  margin-bottom: var(--spacing-md);
  opacity: 0.3;
}

// Animations
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from { 
    opacity: 0;
    transform: translateY(20px) scale(0.95);
  }
  to { 
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

// Responsive
@media (max-width: 768px) {
  .project-modal {
    padding: 0;
    border-radius: 0;
    height: 100vh;
  }
  
  .modal-header {
    padding: var(--spacing-md);
  }
  
  .modal-title {
    font-size: 1.4rem;
  }
  
  .thumbnails-container {
    padding: var(--spacing-md);
  }
  
  .sidebar-content {
    padding: var(--spacing-md);
  }
}
</style>
