<template>
  <section class="project-image-zone">

    <!-- Empty Zone or Add Zone -->
    <div
      v-if="images.length === 0"
      @drop="handleDrop"
      @dragover.prevent="handleDragOver"
      @dragenter.prevent="handleDragEnter"
      @dragleave="handleDragLeave"
      @click="openFileDialog"
      class="project-image-zone-upload"
      :class="['empty', { 'drag-over': isDragOver, 'drag-hover': isDragHover }]"
     >
      <div class="project-image-zone-upload--content" v-if="!isDragOver">
        <p>
          No Photos added yet.
        </p>
        <p>
          Drag and Drop or click to add a Photo
        </p>
        <small>
          Supports: JPG, PNG, WebP (max 10MB)
        </small>
      </div>
      <div class="project-image-zone-upload--content" v-else>
        <p>
          Drop images here
        </p>
      </div>
    </div>

    <!-- Images Grid -->
    <div v-else class="project-images-grid">
      <!-- Image Item -->
      <div
        v-for="(image, index) in images"
        :key="image.id"
        class="image-item"
        :class="{
          'drag-preview': isDragPreview(index),
          'drop-target': isDropTarget(index)
        }"
        draggable="true"
        @dragstart="handleDragStart(index, $event)"
        @dragend="handleDragEnd"
        @dragover.prevent="setDropTarget(index)"
        @dragleave="clearDropTarget"
        @drop="handleImageDrop(index, $event)"
      >
        <!-- Image Display -->
        <div class="image-container">
          <img
            v-if="shouldLoadImage(image, index)"
            :src="image.url"
            :alt="image.alt || image.filename"
            @load="onImageLoad(image.id)"
            @error="onImageError(image.id)"
          />
          <div v-else class="image-placeholder" @click="loadImage(image)">
            <span>Load image</span>
          </div>
          
          <!-- Image Overlay -->
          <div class="image-overlay">
            <div class="image-actions">
              <button @click="editImage(image)" class="action-button edit">
                <EditIcon />
              </button>
              <button @click="deleteImage(image.id)" class="action-button delete">
                <TrashIcon />
              </button>
            </div>
          </div>
        </div>

        <!-- Image Info -->
        <div class="image-info">
          <div class="image-filename">{{ image.filename }}</div>
          <div class="image-meta">
            {{ image.width }} × {{ image.height }} • {{ (image.size / 1024 / 1024).toFixed(1) }}MB
          </div>
          <input
            v-model="image.caption"
            @blur="updateImageCaption(image.id, image.caption || '')"
            type="text"
            placeholder="Add caption..."
            class="caption-input"
          />
        </div>
      </div>

      <!-- Add New Image Button -->
      <div class="add-image-button" @click="openFileDialog">
        <div class="add-image-content">
          <PlusIcon />
          <span>Add Image</span>
        </div>
      </div>
    </div>

    <!-- Input file caché -->
    <input
      ref="fileInput"
      type="file"
      multiple
      accept="image/*"
      style="display: none"
      @change="handleFileSelect"
    />

    <!-- Upload Progress Modal -->
    <div v-if="uploading" class="upload-modal">
      <div class="upload-modal-content">
        <h3>Uploading Images</h3>
        <div class="upload-progress">
          <div class="upload-progress-bar">
            <div class="upload-progress-fill" :style="{ width: uploadProgress + '%' }"></div>
          </div>
          <span>{{ Math.round(uploadProgress) }}%</span>
        </div>
        <div class="upload-files">
          <div
            v-for="(file, index) in uploadFileProgress"
            :key="index"
            class="upload-file"
            :class="file.status"
          >
            <span class="file-name">{{ file.name }}</span>
            <span class="file-status">{{ getFileStatusText(file.status) }}</span>
            <div class="file-progress-bar">
              <div class="file-progress-fill" :style="{ width: file.progress + '%' }"></div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Edit Image Modal -->
    <div v-if="editingImage" class="edit-modal">
      <div class="edit-modal-overlay" @click="closeEditModal"></div>
      <div class="edit-modal-content">
        <div class="edit-modal-header">
          <h3>Edit Image</h3>
          <button @click="closeEditModal" class="close-button">×</button>
        </div>
        
        <div class="edit-modal-body">
          <div class="edit-preview">
            <img :src="editingImage.url" :alt="editingImage.alt" />
          </div>
          
          <div class="edit-form">
            <div class="form-field">
              <label>Filename</label>
              <input v-model="editingImage.filename" type="text" />
            </div>
            
            <div class="form-field">
              <label>Alt Text</label>
              <input v-model="editingImage.alt" type="text" placeholder="Describe the image..." />
            </div>
            
            <div class="form-field">
              <label>Caption</label>
              <textarea v-model="editingImage.caption" rows="3" placeholder="Image caption..."></textarea>
            </div>
            
            <div class="form-actions">
              <button @click="closeEditModal" class="button-secondary">Cancel</button>
              <button @click="saveImageEdit" class="button-primary">Save Changes</button>
            </div>
          </div>
        </div>
      </div>
    </div>

  </section>
</template>

<script setup lang="ts">
// Import
import { ref, computed, onMounted, onUnmounted } from 'vue';
import type { Media } from '../../../../shared/types';
import EditIcon from '@/Icons/edit.vue';
import TrashIcon from '@/Icons/trash.vue';
import PlusIcon from '@/Icons/plus.vue';

// Props
interface Props {
  modelValue: Media[];
  maxImages?: number;
  maxFileSize?: number; // en MB
  lazyLoadThreshold?: number; // Nombre d'images à charger immédiatement
}
const props = withDefaults(defineProps<Props>(), {
  maxImages: 50,
  maxFileSize: 10,
  lazyLoadThreshold: 6
});
const emit = defineEmits<{
  'update:modelValue': [images: Media[]];
  'change': [];
}>();

// States
const fileInput = ref<HTMLInputElement>();
const editingImage = ref<Media | null>(null);

// Drag & Drop
const isDragOver = ref(false);
const isDragHover = ref(false);
const dragCounter = ref(0);
const draggingIndex = ref<number | null>(null);
const dropTargetIndex = ref<number | null>(null);

// Upload avec progress par fichier
const uploading = ref(false);
const uploadQueue = ref<File[]>([]);
const uploadProgress = ref(0);
const uploadFileProgress = ref<Array<{
  name: string;
  progress: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
}>>([]);

// Lazy loading - utiliser les IDs au lieu des indices
const imageLoaded = ref<Record<string, boolean>>({});
const lazyLoadedImages = ref<Set<string>>(new Set());

// Computed
const images = computed({
  get: () => props.modelValue,
  set: (value) => {
    emit('update:modelValue', value);
    emit('change');
  }
});

// Helpers
const shouldLoadImage = (image: Media, index: number) => {
  return index < props.lazyLoadThreshold || lazyLoadedImages.value.has(image.id);
};

const loadImage = (image: Media) => {
  lazyLoadedImages.value.add(image.id);
};

const onImageLoad = (imageId: string) => {
  imageLoaded.value[imageId] = true;
};

const onImageError = (imageId: string) => {
  imageLoaded.value[imageId] = false;
};

// Drag visual optimisé
const handleDragEnter = (event: DragEvent) => {
  event.preventDefault();
  dragCounter.value++;
  isDragOver.value = true;
  
  // Effet hover amélioré
  setTimeout(() => {
    isDragHover.value = true;
  }, 50);
};

const handleDragOver = (event: DragEvent) => {
  event.preventDefault();
  isDragOver.value = true;
};

const handleDragLeave = (event: DragEvent) => {
  event.preventDefault();
  dragCounter.value--;
  
  if (dragCounter.value === 0) {
    isDragOver.value = false;
    isDragHover.value = false;
  }
};

const handleDrop = (event: DragEvent) => {
  event.preventDefault();
  isDragOver.value = false;
  isDragHover.value = false;
  dragCounter.value = 0;
  
  if (event.dataTransfer?.files) {
    handleFiles(Array.from(event.dataTransfer.files));
  }
};
const handleDragStart = (index: number, event: DragEvent) => {
  draggingIndex.value = index;
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', index.toString());
    
    // Amélioration visuelle : ghost image personnalisée
    const img = event.target as HTMLImageElement;
    if (img.tagName === 'IMG') {
      event.dataTransfer.setDragImage(img, 50, 50);
    }
  }
};

const handleDragEnd = () => {
  draggingIndex.value = null;
  dropTargetIndex.value = null;
};

const setDropTarget = (index: number) => {
  if (draggingIndex.value !== null && draggingIndex.value !== index) {
    dropTargetIndex.value = index;
  }
};

const clearDropTarget = () => {
  dropTargetIndex.value = null;
};

const isDropTarget = (index: number) => {
  return dropTargetIndex.value === index;
};

const isDragPreview = (index: number) => {
  return draggingIndex.value === index;
};

const handleImageDrop = (targetIndex: number, event: DragEvent) => {
  event.preventDefault();
  
  const sourceIndex = parseInt(event.dataTransfer?.getData('text/plain') || '');
  
  if (sourceIndex !== targetIndex && !isNaN(sourceIndex)) {
    reorderImages(sourceIndex, targetIndex);
  }
  
  draggingIndex.value = null;
  dropTargetIndex.value = null;
};

const reorderImages = (fromIndex: number, toIndex: number) => {
  const newImages = [...images.value];
  const [removed] = newImages.splice(fromIndex, 1);
  newImages.splice(toIndex, 0, removed);
  images.value = newImages;
};

// Upload amélioré avec progress par fichier
const handleFiles = async (files: File[]) => {
  const validFiles: File[] = [];
  const errors: string[] = [];
  
  // Valider chaque fichier
  for (const file of files) {
    const error = validateFile(file);
    if (error) {
      errors.push(error);
    } else {
      validFiles.push(file);
    }
  }
  
  // Afficher les erreurs
  if (errors.length > 0) {
    alert(errors.join('\n'));
  }
  
  // Uploader les fichiers valides
  if (validFiles.length > 0) {
    await uploadFiles(validFiles);
  }
};

// Methods
const uploadFiles = async (files: File[]) => {
  uploading.value = true;
  uploadQueue.value = files;
  uploadProgress.value = 0;
  
  // Initialiser le progress par fichier
  uploadFileProgress.value = files.map(file => ({
    name: file.name,
    progress: 0,
    status: 'pending' as const
  }));
  
  try {
    const uploadedImages: Media[] = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const fileProgress = uploadFileProgress.value[i];
      
      // Marquer comme en cours
      fileProgress.status = 'uploading';
      
      // Upload du fichier avec progress
      const uploadedImage = await uploadSingleFile(file, (progress) => {
        fileProgress.progress = progress;
        
        // Calculer le progress global
        const totalProgress = uploadFileProgress.value.reduce((sum, fp) => sum + fp.progress, 0);
        uploadProgress.value = totalProgress / files.length;
      });
      
      if (uploadedImage) {
        uploadedImages.push(uploadedImage);
        fileProgress.status = 'success';
        fileProgress.progress = 100;
      } else {
        fileProgress.status = 'error';
      }
    }
    
    // Ajouter les images uploadées
    if (uploadedImages.length > 0) {
      images.value = [...images.value, ...uploadedImages];
    }
    
  } catch (error) {
    console.error('Upload error:', error);
    alert('Error uploading files. Please try again.');
  } finally {
    uploading.value = false;
    uploadQueue.value = [];
    uploadProgress.value = 0;
    uploadFileProgress.value = [];
  }
};

const uploadSingleFile = async (file: File, onProgress: (progress: number) => void): Promise<Media | null> => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('caption', '');
    formData.append('alt', generateSmartAltText(file.name));
    
    // Simuler le progress (dans un vrai projet, utiliser XMLHttpRequest avec progress)
    const progressInterval = setInterval(() => {
      onProgress(Math.min(90, Math.random() * 80 + 10));
    }, 100);
    
    const response = await fetch('/api/media/upload', {
      method: 'POST',
      credentials: 'include',
      body: formData
    });
    
    clearInterval(progressInterval);
    onProgress(100);
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`HTTP ${response.status}: ${errorData.message || response.statusText}`);
    }
    
    const data = await response.json();
    
    if (data.success) {
      return data.data;
    } else {
      throw new Error(data.message || 'Upload failed');
    }
    
  } catch (error) {
    console.error(`Error uploading ${file.name}:`, error);
    return null;
  }
};

// Utilitaires
const validateFile = (file: File): string | null => {
  if (!file.type.startsWith('image/')) {
    return `${file.name} is not a valid image file`;
  }
  
  const sizeInMB = file.size / (1024 * 1024);
  if (sizeInMB > props.maxFileSize) {
    return `${file.name} is too large (${sizeInMB.toFixed(1)}MB). Maximum size is ${props.maxFileSize}MB`;
  }
  
  if (images.value.length >= props.maxImages) {
    return `Maximum ${props.maxImages} images allowed`;
  }
  
  return null;
};

const generateSmartAltText = (filename: string): string => {
  return filename
    .replace(/\.[^/.]+$/, '') // Remove extension
    .replace(/[-_]/g, ' ')    // Replace dashes/underscores
    .replace(/([a-z])([A-Z])/g, '$1 $2') // CamelCase to spaces
    .replace(/\b\w/g, l => l.toUpperCase()) // Title case
    .trim();
};

const getAspectRatio = (width: number, height: number): string => {
  const gcd = (a: number, b: number): number => b === 0 ? a : gcd(b, a % b);
  const divisor = gcd(width, height);
  return `${width / divisor}:${height / divisor}`;
};

const getFileStatusText = (status: string): string => {
  switch (status) {
    case 'pending': return 'Pending...';
    case 'uploading': return 'Uploading...';
    case 'success': return 'Complete';
    case 'error': return 'Error';
    default: return '';
  }
};

// Actions sur les images
const editImage = (image: Media) => {
  editingImage.value = { ...image };
};

const closeEditModal = () => {
  editingImage.value = null;
};

const saveImageEdit = async () => {
  if (!editingImage.value) return;
  
  try {
    const response = await fetch(`/api/media/${editingImage.value.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({
        caption: editingImage.value.caption,
        alt: editingImage.value.alt,
        filename: editingImage.value.filename
      })
    });
    
    if (!response.ok) {
      throw new Error('Failed to update image');
    }
    
    const data = await response.json();
    
    if (data.success) {
      const index = images.value.findIndex(img => img.id === editingImage.value!.id);
      if (index !== -1) {
        const newImages = [...images.value];
        newImages[index] = data.data;
        images.value = newImages;
      }
      
      closeEditModal();
    } else {
      throw new Error(data.message || 'Update failed');
    }
    
  } catch (error) {
    console.error('Error updating image:', error);
    alert('Error updating image. Please try again.');
  }
};

const deleteImage = async (imageId: string) => {
  if (!confirm('Are you sure you want to delete this image?')) {
    return;
  }
  
  try {
    const response = await fetch(`/api/media/${imageId}`, {
      method: 'DELETE',
      credentials: 'include'
    });
    
    if (response.ok) {
      images.value = images.value.filter(img => img.id !== imageId);
    } else {
      throw new Error('Failed to delete image');
    }
    
  } catch (error) {
    console.error('Error deleting image:', error);
    alert('Error deleting image. Please try again.');
  }
};

const updateImageCaption = async (imageId: string, caption: string) => {
  try {
    const response = await fetch(`/api/media/${imageId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({ caption })
    });
    
    if (!response.ok) {
      console.error('Failed to update caption');
    }
    
  } catch (error) {
    console.error('Error updating caption:', error);
  }
};

// Interface
const openFileDialog = () => {
  fileInput.value?.click();
};

const handleFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement;
  if (target.files && target.files.length > 0) {
    handleFiles(Array.from(target.files));
  }
  target.value = '';
};

// Lifecycle
onMounted(() => {
  // Précharger les premières images
  images.value.slice(0, props.lazyLoadThreshold).forEach((image) => {
    lazyLoadedImages.value.add(image.id);
    imageLoaded.value[image.id] = false;
  });
});

onUnmounted(() => {
  // Cleanup
  dragCounter.value = 0;
  isDragOver.value = false;
  isDragHover.value = false;
});
</script>

<style scoped lang="scss">
.project-image-zone {
  position: relative;
  width: 100%;
  min-height: 60vh;
  display: flex;
  align-self: stretch;
  flex: 1 0 0;

  &-upload {
    cursor: pointer;
    display: flex;
    padding: var(--spacing-6);
    flex-direction: column;
    justify-content: center;
    align-items: center;
    flex: 1 0 0;
    align-self: stretch;
    
    border-radius: var(--border-radius-l);
    border: 2px dashed var(--color-background-secondary);
    transition: all var(--duration-base) var(--easing-ease-in-out);

    &:hover {
      border-color: var(--color-text);
      background-color: var(--color-background-secondary);
    }

    &.drag-over {
      border-color: var(--color-info-text);
      background-color: var(--color-info-background);
      color: var(--color-info-text);
    }

    &--content {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      color: var(--color-text-secondary);
    }
  }
}

// Images Grid Styles
.project-images-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: var(--spacing-4);
  width: 100%;
  padding: var(--spacing-4);
}

.image-item {
  position: relative;
  border-radius: var(--border-radius-m);
  background: var(--color-background);
  border: 1px solid var(--color-background-secondary);
  overflow: hidden;
  transition: all var(--duration-fast);
  cursor: grab;

  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    transform: translateY(-2px);

    .image-overlay {
      opacity: 1;
    }
  }

  &.drag-preview {
    opacity: 0.5;
    transform: rotate(5deg);
  }

  &.drop-target {
    border-color: var(--color-info-text);
    background: var(--color-info-background);
  }

  &:active {
    cursor: grabbing;
  }
}

.image-container {
  position: relative;
  aspect-ratio: 4/3;
  overflow: hidden;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform var(--duration-fast);
  }

  &:hover img {
    transform: scale(1.05);
  }
}

.image-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  background: var(--color-background-secondary);
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: all var(--duration-fast);

  &:hover {
    background: var(--color-background);
    color: var(--color-text-primary);
  }
}

.image-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  opacity: 0;
  transition: opacity var(--duration-fast);
  display: flex;
  align-items: center;
  justify-content: center;
}

.image-actions {
  display: flex;
  gap: var(--spacing-2);
}

.action-button {
  appearance: none;
  border: none;
  background: var(--color-background);
  color: var(--color-text-primary);
  width: 36px;
  height: 36px;
  border-radius: var(--border-radius-full);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--duration-fast);

  svg {
    width: 16px;
    height: 16px;
  }

  &.edit:hover {
    background: var(--color-info-text);
    color: white;
  }

  &.delete:hover {
    background: var(--color-error-text);
    color: white;
  }
}

.image-info {
  padding: var(--spacing-3);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2);
}

.image-filename {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-primary);
  word-break: break-word;
}

.image-meta {
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
}

.caption-input {
  appearance: none;
  border: 1px solid var(--color-background-secondary);
  border-radius: var(--border-radius-s);
  padding: var(--spacing-2);
  font-size: var(--font-size-xs);
  background: var(--color-background);
  color: var(--color-text-primary);
  transition: border-color var(--duration-fast);

  &:focus {
    outline: none;
    border-color: var(--color-info-text);
  }

  &::placeholder {
    color: var(--color-text-secondary);
  }
}

.add-image-button {
  display: flex;
  align-items: center;
  justify-content: center;
  aspect-ratio: 4/3;
  border: 2px dashed var(--color-background-secondary);
  border-radius: var(--border-radius-m);
  cursor: pointer;
  transition: all var(--duration-fast);
  color: var(--color-text-secondary);

  &:hover {
    border-color: var(--color-text);
    background: var(--color-background-secondary);
    color: var(--color-text-primary);
  }
}

.add-image-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-2);

  svg {
    width: 24px;
    height: 24px;
  }

  span {
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-medium);
  }
}

// Upload Modal Styles
.upload-modal {
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

.upload-modal-content {
  background: var(--color-background);
  border-radius: var(--border-radius-l);
  padding: var(--spacing-6);
  max-width: 480px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;

  h3 {
    margin: 0 0 var(--spacing-4) 0;
    font-size: var(--font-size-lg);
    font-weight: var(--font-weight-bold);
  }
}

.upload-progress {
  display: flex;
  align-items: center;
  gap: var(--spacing-3);
  margin-bottom: var(--spacing-4);

  span {
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-medium);
    color: var(--color-text-secondary);
  }
}

.upload-progress-bar {
  flex: 1;
  height: 8px;
  background: var(--color-background-secondary);
  border-radius: var(--border-radius-full);
  overflow: hidden;
}

.upload-progress-fill {
  height: 100%;
  background: var(--color-info-text);
  transition: width var(--duration-fast);
}

.upload-files {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2);
}

.upload-file {
  display: flex;
  align-items: center;
  gap: var(--spacing-3);
  padding: var(--spacing-2);
  border-radius: var(--border-radius-s);
  font-size: var(--font-size-sm);

  &.pending {
    background: var(--color-background-secondary);
  }

  &.uploading {
    background: var(--color-info-background);
    color: var(--color-info-text);
  }

  &.success {
    background: var(--color-success-background);
    color: var(--color-success-text);
  }

  &.error {
    background: var(--color-error-background);
    color: var(--color-error-text);
  }

  .file-name {
    flex: 1;
    word-break: break-word;
  }

  .file-status {
    font-size: var(--font-size-xs);
  }
}

.file-progress-bar {
  width: 60px;
  height: 4px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: var(--border-radius-full);
  overflow: hidden;
}

.file-progress-fill {
  height: 100%;
  background: currentColor;
  transition: width var(--duration-fast);
}

// Edit Modal Styles
.edit-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.edit-modal-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
}

.edit-modal-content {
  position: relative;
  background: var(--color-background);
  border-radius: var(--border-radius-l);
  max-width: 800px;
  width: 90%;
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.edit-modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-4) var(--spacing-6);
  border-bottom: 1px solid var(--color-background-secondary);

  h3 {
    margin: 0;
    font-size: var(--font-size-lg);
    font-weight: var(--font-weight-bold);
  }

  .close-button {
    appearance: none;
    border: none;
    background: transparent;
    cursor: pointer;
    font-size: 24px;
    color: var(--color-text-secondary);
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: var(--border-radius-s);

    &:hover {
      background: var(--color-background-secondary);
      color: var(--color-text-primary);
    }
  }
}

.edit-modal-body {
  display: flex;
  flex: 1;
  overflow: hidden;

  @media (max-width: 768px) {
    flex-direction: column;
  }
}

.edit-preview {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-background-secondary);
  padding: var(--spacing-4);

  img {
    max-width: 100%;
    max-height: 100%;
    object-fit: contain;
    border-radius: var(--border-radius-m);
  }
}

.edit-form {
  flex: 0 0 300px;
  padding: var(--spacing-6);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-4);
  border-left: 1px solid var(--color-background-secondary);

  @media (max-width: 768px) {
    flex: none;
    border-left: none;
    border-top: 1px solid var(--color-background-secondary);
  }
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2);

  label {
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-medium);
    color: var(--color-text-primary);
  }

  input, textarea {
    appearance: none;
    border: 1px solid var(--color-background-secondary);
    border-radius: var(--border-radius-m);
    padding: var(--spacing-3);
    font-size: var(--font-size-base);
    background: var(--color-background);
    color: var(--color-text-primary);
    transition: border-color var(--duration-fast);

    &:focus {
      outline: none;
      border-color: var(--color-info-text);
    }

    &::placeholder {
      color: var(--color-text-secondary);
    }
  }

  textarea {
    resize: vertical;
    min-height: 80px;
  }
}

.form-actions {
  display: flex;
  gap: var(--spacing-3);
  margin-top: auto;

  button {
    flex: 1;
    appearance: none;
    border: 1px solid var(--color-background-secondary);
    border-radius: var(--border-radius-m);
    padding: var(--spacing-3);
    cursor: pointer;
    font-size: var(--font-size-base);
    transition: all var(--duration-fast);

    &.button-secondary {
      background: var(--color-background);
      color: var(--color-text-primary);

      &:hover {
        background: var(--color-background-secondary);
      }
    }

    &.button-primary {
      background: var(--color-info-text);
      color: white;
      border-color: var(--color-info-text);

      &:hover {
        background: var(--color-info-text);
        opacity: 0.9;
      }
    }
  }
}
</style>

