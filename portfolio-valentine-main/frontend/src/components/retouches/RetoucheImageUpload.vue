<template>
    <div class="retouche-image-upload">
      <h3>Before & After Images</h3>
      <p class="upload-description">Upload your before and after images to showcase the transformation</p>
      
      <div class="upload-container">
        <!-- Zone Before -->
        <div class="upload-zone before-zone">
          <h4 class="zone-title">
            <span class="zone-icon">📷</span>
            Before Image
          </h4>
          
          <div 
            v-if="!beforeImage"
            @drop="handleDrop($event, 'before')"
            @dragover.prevent
            @dragenter.prevent="handleDragEnter('before')"
            @dragleave="handleDragLeave('before')"
            @click="openFileDialog('before')"
            :class="['drop-zone', { 'drag-over': beforeDragOver }]"
          >
            <div class="drop-content">
              <div class="drop-icon">⬆️</div>
              <h4>Drop before image here</h4>
              <p>or click to browse</p>
              <small>JPG, PNG, WebP (max 10MB)</small>
            </div>
          </div>
          
          <div v-else class="image-preview">
            <img :src="beforeImage.url" :alt="beforeImage.alt" class="preview-img" />
            
            <div class="image-overlay">
              <div class="image-actions">
                <button @click="editImage(beforeImage)" class="action-btn edit" title="Edit">
                  ✏️
                </button>
                <button @click="removeImage('before')" class="action-btn delete" title="Remove">
                  🗑️
                </button>
              </div>
              
              <div class="image-info">
                <div class="image-dimensions" v-if="beforeImage.width && beforeImage.height">
                  {{ beforeImage.width }}×{{ beforeImage.height }}
                </div>
              </div>
            </div>
            
            <div class="image-caption">
              <input
                v-model="beforeImage.caption"
                type="text"
                placeholder="Before caption..."
                class="caption-input"
                @input="updateImageCaption(beforeImage.id, $event.target.value)"
              />
            </div>
          </div>
        </div>
        
        <!-- Zone After -->
        <div class="upload-zone after-zone">
          <h4 class="zone-title">
            <span class="zone-icon">✨</span>
            After Image
          </h4>
          
          <div 
            v-if="!afterImage"
            @drop="handleDrop($event, 'after')"
            @dragover.prevent
            @dragenter.prevent="handleDragEnter('after')"
            @dragleave="handleDragLeave('after')"
            @click="openFileDialog('after')"
            :class="['drop-zone', { 'drag-over': afterDragOver }]"
          >
            <div class="drop-content">
              <div class="drop-icon">⬆️</div>
              <h4>Drop after image here</h4>
              <p>or click to browse</p>
              <small>JPG, PNG, WebP (max 10MB)</small>
            </div>
          </div>
          
          <div v-else class="image-preview">
            <img :src="afterImage.url" :alt="afterImage.alt" class="preview-img" />
            
            <div class="image-overlay">
              <div class="image-actions">
                <button @click="editImage(afterImage)" class="action-btn edit" title="Edit">
                  ✏️
                </button>
                <button @click="removeImage('after')" class="action-btn delete" title="Remove">
                  🗑️
                </button>
              </div>
              
              <div class="image-info">
                <div class="image-dimensions" v-if="afterImage.width && afterImage.height">
                  {{ afterImage.width }}×{{ afterImage.height }}
                </div>
              </div>
            </div>
            
            <div class="image-caption">
              <input
                v-model="afterImage.caption"
                type="text"
                placeholder="After caption..."
                class="caption-input"
                @input="updateImageCaption(afterImage.id, $event.target.value)"
              />
            </div>
          </div>
        </div>
      </div>
      
      <!-- Validation et recommendations -->
      <div v-if="beforeImage && afterImage" class="validation-panel">
        <div class="validation-header">
          <h4>
            <span class="validation-icon">🔍</span>
            Image Analysis
          </h4>
        </div>
        
        <div class="validation-grid">
          <div class="validation-item">
            <span class="item-label">Dimensions:</span>
            <span class="item-value" :class="dimensionsMatch ? 'success' : 'warning'">
              {{ dimensionsMatch ? '✅ Matching' : '⚠️ Different sizes' }}
            </span>
          </div>
          
          <div class="validation-item">
            <span class="item-label">Aspect Ratio:</span>
            <span class="item-value" :class="aspectRatioMatch ? 'success' : 'warning'">
              {{ aspectRatioMatch ? '✅ Matching' : '⚠️ Different ratios' }}
            </span>
          </div>
          
          <div class="validation-item">
            <span class="item-label">File Sizes:</span>
            <span class="item-value">
              Before: {{ formatFileSize(beforeImage.size) }} | After: {{ formatFileSize(afterImage.size) }}
            </span>
          </div>
        </div>
        
        <div v-if="!dimensionsMatch || !aspectRatioMatch" class="recommendations">
          <h5>💡 Recommendations:</h5>
          <ul>
            <li v-if="!dimensionsMatch">Consider resizing images to match dimensions for better comparison</li>
            <li v-if="!aspectRatioMatch">Different aspect ratios may affect the slider comparison display</li>
            <li>Optimal comparison works best with identical dimensions and aspect ratios</li>
          </ul>
        </div>
      </div>
      
      <!-- Inputs file cachés -->
      <input
        ref="beforeFileInput"
        type="file"
        accept="image/*"
        style="display: none"
        @change="handleFileSelect($event, 'before')"
      />
      
      <input
        ref="afterFileInput"
        type="file"
        accept="image/*"
        style="display: none"
        @change="handleFileSelect($event, 'after')"
      />
      
      <!-- Upload overlay -->
      <div v-if="uploading" class="upload-overlay">
        <div class="upload-progress">
          <div class="progress-spinner"></div>
          <p>Uploading {{ uploadingType }} image...</p>
          <div class="progress-bar">
            <div class="progress-fill" :style="{ width: uploadProgress + '%' }"></div>
          </div>
        </div>
      </div>
      
      <!-- Modal d'édition -->
      <div v-if="editingImage" class="image-edit-modal" @click.self="closeEditModal">
        <div class="modal-content">
          <div class="modal-header">
            <h3>Edit Image</h3>
            <button @click="closeEditModal" class="close-btn">×</button>
          </div>
          
          <div class="modal-body">
            <div class="edit-preview">
              <img :src="editingImage.url" :alt="editingImage.filename" />
            </div>
            
            <div class="edit-fields">
              <div class="field">
                <label>Caption</label>
                <input
                  v-model="editingImage.caption"
                  type="text"
                  placeholder="Image caption..."
                />
              </div>
              
              <div class="field">
                <label>Alt text</label>
                <input
                  v-model="editingImage.alt"
                  type="text"
                  placeholder="Descriptive alt text..."
                />
              </div>
              
              <div class="field">
                <label>Filename</label>
                <input
                  v-model="editingImage.filename"
                  type="text"
                  placeholder="filename.jpg"
                />
              </div>
            </div>
          </div>
          
          <div class="modal-footer">
            <button @click="closeEditModal" class="btn-cancel">Cancel</button>
            <button @click="saveImageEdit" class="btn-save">Save Changes</button>
          </div>
        </div>
      </div>
    </div>
  </template>
  
  <script setup lang="ts">
  import { ref, computed } from 'vue';
  import type { Media } from '../../../../shared/types';
  
  interface Props {
    beforeImage?: Media;
    afterImage?: Media;
  }
  
  const props = defineProps<Props>();
  
  const emit = defineEmits<{
    'update:beforeImage': [image: Media | undefined];
    'update:afterImage': [image: Media | undefined];
    'change': [];
  }>();
  
  // État local
  const beforeFileInput = ref<HTMLInputElement>();
  const afterFileInput = ref<HTMLInputElement>();
  const beforeDragOver = ref(false);
  const afterDragOver = ref(false);
  const uploading = ref(false);
  const uploadingType = ref<'before' | 'after' | null>(null);
  const uploadProgress = ref(0);
  const editingImage = ref<Media | null>(null);
  
  // Computed
  const beforeImage = computed({
    get: () => props.beforeImage,
    set: (value) => emit('update:beforeImage', value)
  });
  
  const afterImage = computed({
    get: () => props.afterImage,
    set: (value) => emit('update:afterImage', value)
  });
  
  const dimensionsMatch = computed(() => {
    if (!beforeImage.value || !afterImage.value) return true;
    return beforeImage.value.width === afterImage.value.width && 
           beforeImage.value.height === afterImage.value.height;
  });
  
  const aspectRatioMatch = computed(() => {
    if (!beforeImage.value || !afterImage.value) return true;
    const beforeRatio = beforeImage.value.width / beforeImage.value.height;
    const afterRatio = afterImage.value.width / afterImage.value.height;
    return Math.abs(beforeRatio - afterRatio) < 0.01; // Tolérance de 1%
  });
  
  // Méthodes
  const openFileDialog = (type: 'before' | 'after') => {
    if (type === 'before') {
      beforeFileInput.value?.click();
    } else {
      afterFileInput.value?.click();
    }
  };
  
  const handleFileSelect = (event: Event, type: 'before' | 'after') => {
    const target = event.target as HTMLInputElement;
    if (target.files && target.files.length > 0) {
      handleFiles([target.files[0]], type);
    }
    target.value = ''; // Reset input
  };
  
  const handleDrop = (event: DragEvent, type: 'before' | 'after') => {
    event.preventDefault();
    if (type === 'before') {
      beforeDragOver.value = false;
    } else {
      afterDragOver.value = false;
    }
    
    if (event.dataTransfer?.files) {
      handleFiles(Array.from(event.dataTransfer.files), type);
    }
  };
  
  const handleDragEnter = (type: 'before' | 'after') => {
    if (type === 'before') {
      beforeDragOver.value = true;
    } else {
      afterDragOver.value = true;
    }
  };
  
  const handleDragLeave = (type: 'before' | 'after') => {
    if (type === 'before') {
      beforeDragOver.value = false;
    } else {
      afterDragOver.value = false;
    }
  };
  
  const handleFiles = async (files: File[], type: 'before' | 'after') => {
    if (files.length === 0) return;
    
    const file = files[0];
    
    // Validation
    const error = validateFile(file);
    if (error) {
      alert(error);
      return;
    }
    
    await uploadFile(file, type);
  };
  
  const validateFile = (file: File): string | null => {
    if (!file.type.startsWith('image/')) {
      return `${file.name} is not a valid image file`;
    }
    
    const sizeInMB = file.size / (1024 * 1024);
    if (sizeInMB > 10) {
      return `${file.name} is too large (${sizeInMB.toFixed(1)}MB). Maximum size is 10MB`;
    }
    
    return null;
  };
  
  const uploadFile = async (file: File, type: 'before' | 'after') => {
    try {
      uploading.value = true;
      uploadingType.value = type;
      uploadProgress.value = 0;
      
      const formData = new FormData();
      formData.append('file', file);
      formData.append('caption', type === 'before' ? 'Before' : 'After');
      formData.append('alt', `${type === 'before' ? 'Before' : 'After'} - ${file.name.replace(/\.[^/.]+$/, '')}`);
      
      // Simuler le progress
      const progressInterval = setInterval(() => {
        uploadProgress.value = Math.min(90, uploadProgress.value + Math.random() * 30);
      }, 100);
      
      const response = await fetch('/api/media/upload', {
        method: 'POST',
        credentials: 'include',
        body: formData
      });
      
      clearInterval(progressInterval);
      uploadProgress.value = 100;
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`HTTP ${response.status}: ${errorData.message || response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        if (type === 'before') {
          beforeImage.value = data.data;
        } else {
          afterImage.value = data.data;
        }
        emit('change');
      } else {
        throw new Error(data.message || 'Upload failed');
      }
      
    } catch (error) {
      console.error(`Error uploading ${type} image:`, error);
      alert(`Error uploading ${type} image. Please try again.`);
    } finally {
      uploading.value = false;
      uploadingType.value = null;
      uploadProgress.value = 0;
    }
  };
  
  const removeImage = (type: 'before' | 'after') => {
    if (type === 'before') {
      beforeImage.value = undefined;
    } else {
      afterImage.value = undefined;
    }
    emit('change');
  };
  
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
        // Mettre à jour l'image correspondante
        if (beforeImage.value?.id === editingImage.value.id) {
          beforeImage.value = data.data;
        } else if (afterImage.value?.id === editingImage.value.id) {
          afterImage.value = data.data;
        }
        
        emit('change');
        closeEditModal();
      } else {
        throw new Error(data.message || 'Update failed');
      }
      
    } catch (error) {
      console.error('Error updating image:', error);
      alert('Error updating image. Please try again.');
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
  
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)}MB`;
  };
  </script>
  
  <style scoped lang="scss">
  @import '../../styles/variables.scss';
  
  .retouche-image-upload {
    margin-bottom: 2rem;
    
    h3 {
      color: $color-gray-dark;
      margin: 0 0 0.5rem 0;
      font-size: 1.25rem;
      font-weight: 600;
    }
    
    .upload-description {
      color: $color-gray-medium;
      margin: 0 0 2rem 0;
      font-size: 0.95rem;
    }
  }
  
  .upload-container {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 2rem;
    margin-bottom: 2rem;
    
    .upload-zone {
      .zone-title {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        margin: 0 0 1rem 0;
        font-size: 1rem;
        font-weight: 600;
        color: $color-gray-dark;
        
        .zone-icon {
          font-size: 1.2rem;
        }
      }
      
      .drop-zone {
        border: 2px dashed $color-gray-light;
        border-radius: 12px;
        padding: 3rem 2rem;
        text-align: center;
        background: lighten($color-gray-light, 5%);
        cursor: pointer;
        transition: all 0.3s ease;
        min-height: 200px;
        display: flex;
        align-items: center;
        justify-content: center;
        
        &:hover,
        &.drag-over {
          border-color: $color-gray-dark;
          background: lighten($color-gray-light, 3%);
          transform: translateY(-2px);
        }
        
        .drop-content {
          .drop-icon {
            font-size: 2.5rem;
            margin-bottom: 1rem;
            opacity: 0.7;
          }
          
          h4 {
            color: $color-gray-dark;
            margin: 0 0 0.5rem 0;
            font-size: 1.1rem;
            font-weight: 600;
          }
          
          p {
            color: $color-gray-medium;
            margin: 0 0 1rem 0;
          }
          
          small {
            color: $color-gray-medium;
            font-size: 0.8rem;
          }
        }
      }
      
      .image-preview {
        position: relative;
        border-radius: 12px;
        overflow: hidden;
        background: $color-white;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        
        .preview-img {
          width: 100%;
          height: 200px;
          object-fit: cover;
          display: block;
        }
        
                .image-overlay {
          position: absolute;
          inset: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0;
          transition: opacity 0.3s ease;
          
          .image-actions {
            display: flex;
            gap: 0.5rem;
            
            .action-btn {
              background: rgba(255, 255, 255, 0.9);
              border: none;
              border-radius: 50%;
              width: 36px;
              height: 36px;
              display: flex;
              align-items: center;
              justify-content: center;
              cursor: pointer;
              transition: all 0.3s ease;
              
              &:hover {
                background: $color-white;
                transform: scale(1.1);
              }
              
              &.delete:hover {
                background: #fee2e2;
                color: #dc2626;
              }
            }
          }
          
          .image-info {
            position: absolute;
            bottom: 8px;
            left: 8px;
            
            .image-dimensions {
              background: rgba(0, 0, 0, 0.8);
              color: white;
              padding: 2px 6px;
              border-radius: 4px;
              font-size: 0.7rem;
              font-weight: 500;
            }
          }
        }
        
        &:hover .image-overlay {
          opacity: 1;
        }
        
        .image-caption {
          padding: 0.75rem;
          
          .caption-input {
            width: 100%;
            border: none;
            outline: none;
            background: transparent;
            font-size: 0.85rem;
            color: $color-gray-medium;
            
            &::placeholder {
              color: lighten($color-gray-medium, 20%);
            }
            
            &:focus {
              color: $color-gray-dark;
            }
          }
        }
      }
    }
  }
  
  .validation-panel {
    background: lighten($color-gray-light, 5%);
    border-radius: 12px;
    padding: 1.5rem;
    
    .validation-header {
      h4 {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        margin: 0 0 1rem 0;
        font-size: 1rem;
        font-weight: 600;
        color: $color-gray-dark;
        
        .validation-icon {
          font-size: 1.2rem;
        }
      }
    }
    
    .validation-grid {
      display: grid;
      gap: 0.75rem;
      margin-bottom: 1rem;
      
      .validation-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        
        .item-label {
          font-weight: 500;
          color: $color-gray-dark;
          font-size: 0.9rem;
        }
        
        .item-value {
          font-size: 0.85rem;
          font-weight: 500;
          
          &.success {
            color: #065f46;
          }
          
          &.warning {
            color: #92400e;
          }
        }
      }
    }
    
    .recommendations {
      border-top: 1px solid $color-gray-light;
      padding-top: 1rem;
      
      h5 {
        margin: 0 0 0.75rem 0;
        font-size: 0.9rem;
        font-weight: 600;
        color: $color-gray-dark;
      }
      
      ul {
        margin: 0;
        padding-left: 1.25rem;
        
        li {
          color: $color-gray-medium;
          font-size: 0.85rem;
          margin-bottom: 0.25rem;
          line-height: 1.4;
        }
      }
    }
  }
  
  .upload-overlay {
    position: absolute;
    inset: 0;
    background: rgba(255, 255, 255, 0.95);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10;
    border-radius: 12px;
    
    .upload-progress {
      text-align: center;
      
      .progress-spinner {
        width: 40px;
        height: 40px;
        margin: 0 auto 1rem;
        border: 3px solid $color-gray-light;
        border-top: 3px solid $color-gray-dark;
        border-radius: 50%;
        animation: spin 1s linear infinite;
      }
      
      p {
        color: $color-gray-dark;
        margin: 0 0 1rem 0;
        font-weight: 500;
      }
      
      .progress-bar {
        width: 200px;
        height: 4px;
        background: $color-gray-light;
        border-radius: 2px;
        overflow: hidden;
        
        .progress-fill {
          height: 100%;
          background: $color-gray-dark;
          transition: width 0.3s ease;
        }
      }
    }
  }
  
  .image-edit-modal {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 100;
    
    .modal-content {
      background: $color-white;
      border-radius: 12px;
      max-width: 500px;
      width: 90%;
      max-height: 80vh;
      overflow: hidden;
      
      .modal-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 1.5rem;
        border-bottom: 1px solid $color-gray-light;
        
        h3 {
          margin: 0;
          color: $color-gray-dark;
        }
        
        .close-btn {
          background: none;
          border: none;
          font-size: 1.5rem;
          cursor: pointer;
          color: $color-gray-medium;
          
          &:hover {
            color: $color-gray-dark;
          }
        }
      }
      
      .modal-body {
        padding: 1.5rem;
        
        .edit-preview {
          margin-bottom: 1.5rem;
          
          img {
            width: 100%;
            max-height: 200px;
            object-fit: cover;
            border-radius: 8px;
          }
        }
        
        .edit-fields {
          .field {
            margin-bottom: 1rem;
            
            label {
              display: block;
              margin-bottom: 0.5rem;
              font-weight: 500;
              color: $color-gray-dark;
            }
            
            input {
              width: 100%;
              padding: 0.75rem;
              border: 1px solid $color-gray-light;
              border-radius: 6px;
              font-size: 0.9rem;
              
              &:focus {
                outline: none;
                border-color: $color-gray-dark;
              }
            }
          }
        }
      }
      
      .modal-footer {
        display: flex;
        gap: 1rem;
        justify-content: flex-end;
        padding: 1.5rem;
        border-top: 1px solid $color-gray-light;
        
        .btn-cancel {
          background: none;
          border: 1px solid $color-gray-light;
          color: $color-gray-medium;
          padding: 0.75rem 1.5rem;
          border-radius: 6px;
          cursor: pointer;
          
          &:hover {
            background: $color-gray-light;
          }
        }
        
        .btn-save {
          background: $color-gray-dark;
          color: $color-white;
          border: none;
          padding: 0.75rem 1.5rem;
          border-radius: 6px;
          cursor: pointer;
          
          &:hover {
            background: lighten($color-gray-dark, 10%);
          }
        }
      }
    }
  }
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  
  @media (max-width: 768px) {
    .upload-container {
      grid-template-columns: 1fr;
      gap: 1.5rem;
      
      .upload-zone {
        .drop-zone {
          padding: 2rem 1rem;
          min-height: 150px;
          
          .drop-content {
            .drop-icon {
              font-size: 2rem;
            }
            
            h4 {
              font-size: 1rem;
            }
          }
        }
        
        .image-preview {
          .preview-img {
            height: 150px;
          }
        }
      }
    }
    
    .validation-grid {
      grid-template-columns: 1fr !important;
      
      .validation-item {
        flex-direction: column;
        align-items: flex-start !important;
        gap: 0.25rem;
      }
    }
  }
  </style>