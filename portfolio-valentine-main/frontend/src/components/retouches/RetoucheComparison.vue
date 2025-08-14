<template>
    <div class="retouche-comparison">
      <div class="comparison-header">
        <h3>Before & After Comparison</h3>
        
        <div class="comparison-controls">
          <div class="mode-selector">
            <button 
              v-for="mode in comparisonModes"
              :key="mode.value"
              @click="currentMode = mode.value"
              :class="['mode-btn', { active: currentMode === mode.value }]"
              :title="mode.label"
            >
              {{ mode.icon }}
            </button>
          </div>
          
          <button 
            @click="toggleFullscreen"
            class="fullscreen-btn"
            title="Fullscreen (F)"
          >
            {{ isFullscreen ? '🗗' : '⛶' }}
          </button>
        </div>
      </div>
      
      <!-- Comparaison principale -->
      <div 
        ref="comparisonContainer"
        :class="['comparison-container', `mode-${currentMode}`, { fullscreen: isFullscreen }]"
        @mousemove="handleMouseMove"
        @touchmove="handleTouchMove"
        @click="handleClick"
      >
        <!-- Image avant -->
        <div class="before-container">
          <img 
            :src="beforeImage.url" 
            :alt="beforeImage.alt" 
            class="comparison-image before-image"
            draggable="false"
          />
          <div class="image-label before-label">Before</div>
        </div>
        
        <!-- Image après avec masque -->
        <div 
          class="after-container"
          :style="getAfterImageStyle()"
        >
          <img 
            :src="afterImage.url" 
            :alt="afterImage.alt" 
            class="comparison-image after-image"
            draggable="false"
          />
          <div class="image-label after-label">After</div>
        </div>
        
        <!-- Slider de contrôle -->
        <div 
          v-if="currentMode === 'split'"
          class="comparison-slider"
          :style="{ left: sliderPosition + '%' }"
          @mousedown="startDrag"
          @touchstart="startDrag"
        >
          <div class="slider-line"></div>
          <div class="slider-handle">
            <div class="handle-icon">⟷</div>
          </div>
        </div>
        
        <!-- Mode fade overlay -->
        <div 
          v-if="currentMode === 'fade'"
          class="fade-overlay"
          :style="{ opacity: fadeOpacity }"
        >
          <!-- Contrôle fade -->
          <div class="fade-control">
            <input
              v-model="fadeOpacity"
              type="range"
              min="0"
              max="1"
              step="0.01"
              class="fade-slider"
            />
            <div class="fade-labels">
              <span>Before</span>
              <span>After</span>
            </div>
          </div>
        </div>
        
        <!-- Indicateurs de position -->
        <div class="position-indicator">
          {{ Math.round(sliderPosition) }}% After
        </div>
        
        <!-- Instructions -->
        <div class="instructions">
          <div v-if="currentMode === 'split'" class="instruction-text">
            {{ isMobile ? 'Tap and drag' : 'Click and drag' }} to compare
          </div>
          <div v-else-if="currentMode === 'fade'" class="instruction-text">
            Use slider to fade between images
          </div>
          <div v-else class="instruction-text">
            {{ isMobile ? 'Tap' : 'Click' }} to toggle between before and after
          </div>
        </div>
        
        <!-- Bouton de fermeture en mode fullscreen -->
        <button 
          v-if="isFullscreen"
          @click="exitFullscreen"
          class="fullscreen-close"
          title="Exit fullscreen (Esc)"
        >
          ×
        </button>
      </div>
      
      <!-- Métadonnées des images -->
      <div class="comparison-meta">
        <div class="meta-grid">
          <div class="meta-item">
            <h4>Before Image</h4>
            <div class="meta-details">
              <span>{{ beforeImage.width }}×{{ beforeImage.height }}px</span>
              <span>{{ formatFileSize(beforeImage.size) }}</span>
            </div>
          </div>
          
          <div class="meta-item">
            <h4>After Image</h4>
            <div class="meta-details">
              <span>{{ afterImage.width }}×{{ afterImage.height }}px</span>
              <span>{{ formatFileSize(afterImage.size) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </template>
  
  <script setup lang="ts">
  import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue';
  import type { Media } from '../../../../shared/types';
  
  interface Props {
    beforeImage: Media;
    afterImage: Media;
  }
  
  const props = defineProps<Props>();
  
  // Types de comparaison
  const comparisonModes = [
    { value: 'split', label: 'Split View', icon: '↔️' },
    { value: 'fade', label: 'Fade Transition', icon: '🔄' },
    { value: 'toggle', label: 'Click Toggle', icon: '⚡' }
  ] as const;
  
  type ComparisonMode = typeof comparisonModes[number]['value'];
  
  // État réactif
  const comparisonContainer = ref<HTMLElement>();
  const currentMode = ref<ComparisonMode>('split');
  const sliderPosition = ref(50);
  const fadeOpacity = ref(0.5);
  const isDragging = ref(false);
  const isFullscreen = ref(false);
  const showAfter = ref(false);
  
  // Détection mobile
  const isMobile = ref(false);
  
  // Computed
  const getAfterImageStyle = () => {
    switch (currentMode.value) {
      case 'split':
        return {
          clipPath: `polygon(${sliderPosition.value}% 0, 100% 0, 100% 100%, ${sliderPosition.value}% 100%)`
        };
      case 'fade':
        return {
          opacity: fadeOpacity.value
        };
      case 'toggle':
        return {
          opacity: showAfter.value ? 1 : 0
        };
      default:
        return {};
    }
  };
  
  // Méthodes de gestion du slider
  const handleMouseMove = (event: MouseEvent) => {
    if (currentMode.value === 'split' && !isDragging.value) {
      updateSliderPosition(event);
    }
  };
  
  const handleTouchMove = (event: TouchEvent) => {
    if (currentMode.value === 'split') {
      event.preventDefault();
      updateSliderPosition(event.touches[0]);
    }
  };
  
  const handleClick = (event: MouseEvent) => {
    if (currentMode.value === 'toggle') {
      showAfter.value = !showAfter.value;
    } else if (currentMode.value === 'split') {
      updateSliderPosition(event);
    }
  };
  
  const updateSliderPosition = (event: MouseEvent | Touch) => {
    if (!comparisonContainer.value) return;
    
    const rect = comparisonContainer.value.getBoundingClientRect();
    const position = ((event.clientX - rect.left) / rect.width) * 100;
    sliderPosition.value = Math.max(0, Math.min(100, position));
  };
  
  const startDrag = (event: MouseEvent | TouchEvent) => {
    event.preventDefault();
    isDragging.value = true;
    
    const moveHandler = (e: MouseEvent | TouchEvent) => {
      if (!isDragging.value) return;
      
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      updateSliderPosition({ clientX } as MouseEvent);
    };
    
    const endHandler = () => {
      isDragging.value = false;
      document.removeEventListener('mousemove', moveHandler);
      document.removeEventListener('mouseup', endHandler);
      document.removeEventListener('touchmove', moveHandler);
      document.removeEventListener('touchend', endHandler);
    };
    
    document.addEventListener('mousemove', moveHandler);
    document.addEventListener('mouseup', endHandler);
    document.addEventListener('touchmove', moveHandler, { passive: false });
    document.addEventListener('touchend', endHandler);
  };
  
  // Fullscreen
  const toggleFullscreen = async () => {
    if (!isFullscreen.value) {
      try {
        if (comparisonContainer.value?.requestFullscreen) {
          await comparisonContainer.value.requestFullscreen();
        }
      } catch (error) {
        console.error('Error entering fullscreen:', error);
      }
    } else {
      exitFullscreen();
    }
  };
  
  const exitFullscreen = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    }
  };
  
  const handleFullscreenChange = () => {
    isFullscreen.value = !!document.fullscreenElement;
  };
  
  // Raccourcis clavier
  const handleKeyboard = (event: KeyboardEvent) => {
    switch (event.key) {
      case 'f':
      case 'F':
        event.preventDefault();
        toggleFullscreen();
        break;
      case ' ':
        event.preventDefault();
        if (currentMode.value === 'toggle') {
          showAfter.value = !showAfter.value;
        }
        break;
      case 'Escape':
        if (isFullscreen.value) {
          exitFullscreen();
        }
        break;
      case '1':
        currentMode.value = 'split';
        break;
      case '2':
        currentMode.value = 'fade';
        break;
      case '3':
        currentMode.value = 'toggle';
        break;
    }
  };
  
  // Utilitaires
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)}MB`;
  };
  
  const detectMobile = () => {
    isMobile.value = window.innerWidth <= 768 || 'ontouchstart' in window;
  };
  
  // Lifecycle
  onMounted(() => {
    detectMobile();
    window.addEventListener('resize', detectMobile);
    window.addEventListener('keydown', handleKeyboard);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
  });
  
  onUnmounted(() => {
    window.removeEventListener('resize', detectMobile);
    window.removeEventListener('keydown', handleKeyboard);
    document.removeEventListener('fullscreenchange', handleFullscreenChange);
  });
  </script>
  
  <style scoped lang="scss">
  @import '../../styles/variables.scss';
  
  .retouche-comparison {
    margin-bottom: 2rem;
  }
  
  .comparison-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 1.5rem;
    
    h3 {
      margin: 0;
      color: $color-gray-dark;
      font-size: 1.25rem;
      font-weight: 600;
    }
    
    .comparison-controls {
      display: flex;
      align-items: center;
      gap: 1rem;
      
      .mode-selector {
        display: flex;
        background: $color-white;
        border: 1px solid $color-gray-light;
        border-radius: 8px;
        overflow: hidden;
        
        .mode-btn {
          background: none;
          border: none;
          padding: 0.5rem 0.75rem;
          cursor: pointer;
          font-size: 1rem;
          transition: all 0.3s ease;
          border-right: 1px solid $color-gray-light;
          
          &:last-child {
            border-right: none;
          }
          
          &:hover {
            background: lighten($color-gray-light, 3%);
          }
          
          &.active {
            background: $color-gray-dark;
            color: $color-white;
          }
        }
      }
      
      .fullscreen-btn {
        background: $color-white;
        border: 1px solid $color-gray-light;
        border-radius: 6px;
        padding: 0.5rem;
        cursor: pointer;
        font-size: 1rem;
        transition: all 0.3s ease;
        
        &:hover {
          background: lighten($color-gray-light, 3%);
        }
      }
    }
  }
  
  .comparison-container {
    position: relative;
    width: 100%;
    aspect-ratio: 16/10;
    border-radius: 12px;
    overflow: hidden;
    background: $color-gray-dark;
    cursor: crosshair;
    user-select: none;
    
    &.fullscreen {
      position: fixed !important;
      inset: 0 !important;
      z-index: 9999 !important;
      border-radius: 0 !important;
      aspect-ratio: auto !important;
      height: 100vh !important;
      width: 100vw !important;
      background: black;
      
      .comparison-image {
        object-fit: contain !important;
      }
      
      .fullscreen-close {
        display: block;
      }
    }
    
    &.mode-toggle {
      cursor: pointer;
    }
    
    .before-container,
    .after-container {
      position: absolute;
      inset: 0;
      
      .comparison-image {
        width: 100%;
        height: 100%;
        object-fit: cover;
        display: block;
      }
      
      .image-label {
        position: absolute;
        top: 1rem;
        padding: 0.5rem 1rem;
        background: rgba(0, 0, 0, 0.8);
        color: white;
        font-size: 0.9rem;
        font-weight: 600;
        border-radius: 6px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      
      .before-label {
        left: 1rem;
      }
      
      .after-label {
        right: 1rem;
      }
    }
    
    .after-container {
      transition: opacity 0.3s ease, clip-path 0.1s ease;
    }
    
    .comparison-slider {
      position: absolute;
      top: 0;
      bottom: 0;
      width: 4px;
      cursor: ew-resize;
      z-index: 10;
      
      .slider-line {
        position: absolute;
        inset: 0;
        background: rgba(255, 255, 255, 0.8);
        box-shadow: 0 0 10px rgba(0, 0, 0, 0.3);
      }
      
      .slider-handle {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 40px;
        height: 40px;
        background: rgba(255, 255, 255, 0.95);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 2px 12px rgba(0, 0, 0, 0.3);
        transition: all 0.3s ease;
        
        &:hover {
          background: white;
          transform: translate(-50%, -50%) scale(1.1);
        }
        
        .handle-icon {
          font-size: 1.2rem;
          color: $color-gray-dark;
          font-weight: bold;
        }
      }
    }
    
    .fade-overlay {
      position: absolute;
      bottom: 2rem;
      left: 50%;
      transform: translateX(-50%);
      
      .fade-control {
        background: rgba(0, 0, 0, 0.8);
        padding: 1rem 1.5rem;
        border-radius: 8px;
        min-width: 200px;
        
        .fade-slider {
          width: 100%;
          margin-bottom: 0.5rem;
          cursor: pointer;
        }
        
        .fade-labels {
          display: flex;
          justify-content: space-between;
          color: white;
          font-size: 0.8rem;
          font-weight: 500;
        }
      }
    }
    
    .position-indicator {
      position: absolute;
      top: 1rem;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(0, 0, 0, 0.8);
      color: white;
      padding: 0.5rem 1rem;
      border-radius: 6px;
      font-size: 0.9rem;
      font-weight: 600;
      pointer-events: none;
    }
    
    .instructions {
      position: absolute;
      bottom: 1rem;
      left: 50%;
      transform: translateX(-50%);
      
      .instruction-text {
        background: rgba(0, 0, 0, 0.8);
        color: white;
        padding: 0.5rem 1rem;
        border-radius: 6px;
        font-size: 0.85rem;
        text-align: center;
        pointer-events: none;
      }
    }
    
    .fullscreen-close {
      display: none;
      position: absolute;
      top: 2rem;
      right: 2rem;
      background: rgba(0, 0, 0, 0.8);
      color: white;
      border: none;
      border-radius: 50%;
      width: 40px;
      height: 40px;
      font-size: 1.5rem;
      cursor: pointer;
      transition: all 0.3s ease;
      z-index: 100;
      
      &:hover {
        background: rgba(0, 0, 0, 0.9);
        transform: scale(1.1);
      }
    }
  }
  
  .comparison-meta {
    margin-top: 1.5rem;
    
    .meta-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1.5rem;
      
      .meta-item {
        background: lighten($color-gray-light, 5%);
        padding: 1rem;
        border-radius: 8px;
        
        h4 {
          margin: 0 0 0.5rem 0;
          font-size: 0.9rem;
          font-weight: 600;
          color: $color-gray-dark;
        }
        
        .meta-details {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
          
          span {
            font-size: 0.85rem;
            color: $color-gray-medium;
          }
        }
      }
    }
  }
  
  @media (max-width: 768px) {
    .comparison-header {
      flex-direction: column;
      gap: 1rem;
      align-items: stretch;
      
      .comparison-controls {
        justify-content: space-between;
        
        .mode-selector {
          flex: 1;
          
          .mode-btn {
            flex: 1;
            text-align: center;
          }
        }
      }
    }
    
    .comparison-container {
      aspect-ratio: 4/3;
      
      .image-label {
        top: 0.5rem !important;
        padding: 0.25rem 0.5rem !important;
        font-size: 0.8rem !important;
      }
      
      .before-label {
        left: 0.5rem !important;
      }
      
      .after-label {
        right: 0.5rem !important;
      }
      
      .position-indicator,
      .instructions {
        display: none; // Masquer sur mobile pour plus de clarté
      }
      
      .fade-overlay {
        bottom: 1rem;
        
        .fade-control {
          padding: 0.75rem 1rem;
          min-width: 150px;
        }
      }
      
      .comparison-slider {
        .slider-handle {
          width: 35px;
          height: 35px;
          
          .handle-icon {
            font-size: 1rem;
          }
        }
      }
    }
    
    .comparison-meta {
      .meta-grid {
        grid-template-columns: 1fr;
        gap: 1rem;
      }
    }
  }
  
  // Animations pour les transitions
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  
  .comparison-container {
    .after-container {
      &.mode-toggle {
        transition: opacity 0.4s ease;
      }
    }
  }
  
  // États de focus et accessibilité
  .comparison-container:focus-visible {
    outline: 2px solid $color-gray-dark;
    outline-offset: 2px;
  }
  
  .mode-btn:focus-visible,
  .fullscreen-btn:focus-visible {
    outline: 2px solid $color-gray-dark;
    outline-offset: 2px;
  }
  
  // Mode sombre pour fullscreen
  .comparison-container.fullscreen {
    .position-indicator,
    .instructions .instruction-text,
    .fade-overlay .fade-control {
      background: rgba(255, 255, 255, 0.9);
      color: $color-gray-dark;
    }
    
    .image-label {
      background: rgba(255, 255, 255, 0.9);
      color: $color-gray-dark;
    }
  }
  </style>