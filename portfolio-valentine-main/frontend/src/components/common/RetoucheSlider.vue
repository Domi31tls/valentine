<template>
  <article class="retouche-slider">
    
    <div class="retouche-slider__container" ref="sliderContainer">
      
      <!-- Image avant -->
      <div class="retouche-slider__container-image-layer retouche-slider__container-image-layer--before">
        <img 
          :src="retouche.before_image.url" 
          :alt="`${retouche.title} - Before`"
          loading="lazy"
          class="retouche-slider__image"
        >
      </div>
      
      <!-- Image après -->
      <div 
        class="retouche-slider__container-image-layer retouche-slider__container-image-layer--after"
        :style="{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }"
      >
        <img 
          :src="retouche.after_image.url" 
          :alt="`${retouche.title} - After`" 
          loading="lazy"
          class="retouche-slider__image"
        >
      </div>

      <!-- Slider handle -->
      <div 
        class="retouche-slider__slider-handle"
        :style="{ left: `${sliderPosition}%` }"
        @mousedown="startDrag"
        @touchstart="startTouch"
      >
        <div class="retouche-slider__slider-handle-line"></div>
        <div class="retouche-slider__slider-handle-button"></div>
      </div>
    </div>
  </article>
</template>

<script setup lang="ts">
// Import
import { ref, computed, onMounted, onUnmounted } from 'vue'
import type { Retouche } from '@/../../shared/types'

// Props
interface Props {
  retouche: Retouche
}
const props = defineProps<Props>()

// States
const sliderContainer = ref<HTMLElement>()
const sliderPosition = ref(50)
const isDragging = ref(false)
const isHovered = ref(false)
const beforeImageLoaded = ref(false)
const afterImageLoaded = ref(false)

// Computed
const isLoading = computed(() => !beforeImageLoaded.value || !afterImageLoaded.value)

// Handlers
const handleMouseEnter = () => {
  isHovered.value = true
}

const handleMouseLeave = () => {
  isHovered.value = false
}

const handleBeforeImageLoad = () => {
  beforeImageLoaded.value = true
}

const handleAfterImageLoad = () => {
  afterImageLoaded.value = true
}

// Drag handlers
const updateSliderPosition = (clientX: number) => {
  if (!sliderContainer.value) return
  
  const rect = sliderContainer.value.getBoundingClientRect()
  const x = clientX - rect.left
  const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100))
  sliderPosition.value = percentage
}

const startDrag = (event: MouseEvent) => {
  event.preventDefault()
  isDragging.value = true
  
  const handleMouseMove = (e: MouseEvent) => {
    updateSliderPosition(e.clientX)
  }
  
  const handleMouseUp = () => {
    isDragging.value = false
    document.removeEventListener('mousemove', handleMouseMove)
    document.removeEventListener('mouseup', handleMouseUp)
  }
  
  document.addEventListener('mousemove', handleMouseMove)
  document.addEventListener('mouseup', handleMouseUp)
}

const startTouch = (event: TouchEvent) => {
  event.preventDefault()
  isDragging.value = true
  
  const handleTouchMove = (e: TouchEvent) => {
    const touch = e.touches[0]
    updateSliderPosition(touch.clientX)
  }
  
  const handleTouchEnd = () => {
    isDragging.value = false
    document.removeEventListener('touchmove', handleTouchMove)
    document.removeEventListener('touchend', handleTouchEnd)
  }
  
  document.addEventListener('touchmove', handleTouchMove)
  document.addEventListener('touchend', handleTouchEnd)
}
</script>

<style lang="scss" scoped>
.retouche-slider {
  position: relative;
  cursor: pointer;
  border-radius: 8px;
  overflow: hidden;
  transition: transform var(--duration-base) var(--easing-bounce);

  &__container {
    position: relative;
    width: 100%;
    aspect-ratio: 16/10;

    overflow: hidden;
    user-select: none;

    &-image-layer {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;

      &--before {
        z-index: 1;
      }

      &--after {
        z-index: 2;
        transition: clip-path 0.1s ease-out;
      }
    }
  }

  &__slider-handle {
    position: absolute;
    top: 0;
    bottom: 0;
    width: 4px;
    z-index: 3;
    cursor: ew-resize;
    transform: translateX(-50%);
    transition: all 0.2s ease;

    &:hover {
      .retouche-slider__slider-handle-button {
        transform: translate(-50%, -50%) scale(1.1);
        background: rgba(255, 255, 255, 0.9);
      }
    }

    &-line {
      width: 2px;
      height: 100%;
      background: white;
      margin: 0 auto;
    }

    &-button {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: var(--spacing-6);
      height: var(--spacing-6);
      border-radius: var(--border-radius-full);
      background: rgba(255, 255, 255, 0.6);
      backdrop-filter: blur(10px);
      transform-origin: center;

      transition: all var(--duration-fast) var(--easing-bounce);
    }
  }

  &__image {
    width: 100%;
    height: 100%;
    object-fit: cover;
    pointer-events: none;
  }
}
</style>