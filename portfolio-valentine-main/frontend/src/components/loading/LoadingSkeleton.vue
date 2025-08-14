<template>
  <div class="loading-skeleton" :class="skeletonClass">
    <div 
      v-if="type === 'text'" 
      class="skeleton-line"
      :style="lineStyle"
    ></div>
    
    <div 
      v-else-if="type === 'image'" 
      class="skeleton-image"
      :style="imageStyle"
    ></div>
    
    <div 
      v-else-if="type === 'card'" 
      class="skeleton-card"
    >
      <div class="skeleton-image skeleton-card-image"></div>
      <div class="skeleton-card-content">
        <div class="skeleton-line skeleton-title"></div>
        <div class="skeleton-line skeleton-subtitle"></div>
      </div>
    </div>
    
    <div 
      v-else-if="type === 'grid-item'" 
      class="skeleton-grid-item"
    >
      <div class="skeleton-image skeleton-grid-image"></div>
      <div class="skeleton-overlay">
        <div class="skeleton-line skeleton-grid-title"></div>
      </div>
    </div>
    
    <!-- Skeleton par défaut -->
    <div 
      v-else 
      class="skeleton-block"
      :style="blockStyle"
    ></div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

interface Props {
  type?: 'text' | 'image' | 'card' | 'grid-item' | 'block';
  width?: string | number;
  height?: string | number;
  lines?: number;
  animated?: boolean;
  rounded?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  type: 'block',
  width: '100%',
  height: '20px',
  lines: 1,
  animated: true,
  rounded: true
});

const skeletonClass = computed(() => ({
  'skeleton-animated': props.animated,
  'skeleton-rounded': props.rounded
}));

const lineStyle = computed(() => ({
  width: typeof props.width === 'number' ? `${props.width}px` : props.width,
  height: typeof props.height === 'number' ? `${props.height}px` : props.height
}));

const imageStyle = computed(() => ({
  width: typeof props.width === 'number' ? `${props.width}px` : props.width,
  height: typeof props.height === 'number' ? `${props.height}px` : props.height
}));

const blockStyle = computed(() => ({
  width: typeof props.width === 'number' ? `${props.width}px` : props.width,
  height: typeof props.height === 'number' ? `${props.height}px` : props.height
}));
</script>

<style scoped lang="scss">
.loading-skeleton {
  --skeleton-bg: #f0f0f0;
  --skeleton-shimmer: #e8e8e8;
  --skeleton-radius: 4px;
  
  .skeleton-line,
  .skeleton-image,
  .skeleton-block {
    background: var(--skeleton-bg);
    position: relative;
    overflow: hidden;
    
    &.skeleton-rounded {
      border-radius: var(--skeleton-radius);
    }
  }
  
  // Animation de shimmer subtile
  &.skeleton-animated {
    .skeleton-line,
    .skeleton-image,
    .skeleton-block,
    .skeleton-card-image,
    .skeleton-grid-image {
      &::after {
        content: '';
        position: absolute;
        top: 0;
        left: -100%;
        width: 100%;
        height: 100%;
        background: linear-gradient(
          90deg,
          transparent,
          var(--skeleton-shimmer) 50%,
          transparent
        );
        animation: shimmer 1.5s infinite ease-in-out;
      }
    }
  }
  
  // Skeleton pour cartes
  .skeleton-card {
    background: transparent;
    
    .skeleton-card-image {
      width: 100%;
      height: 200px;
      background: var(--skeleton-bg);
      border-radius: var(--skeleton-radius);
      margin-bottom: 12px;
    }
    
    .skeleton-card-content {
      .skeleton-title {
        height: 20px;
        width: 80%;
        background: var(--skeleton-bg);
        border-radius: var(--skeleton-radius);
        margin-bottom: 8px;
      }
      
      .skeleton-subtitle {
        height: 16px;
        width: 60%;
        background: var(--skeleton-bg);
        border-radius: var(--skeleton-radius);
      }
    }
  }
  
  // Skeleton pour items de grid
  .skeleton-grid-item {
    position: relative;
    background: transparent;
    
    .skeleton-grid-image {
      width: 100%;
      height: 300px;
      background: var(--skeleton-bg);
      border-radius: var(--skeleton-radius);
    }
    
    .skeleton-overlay {
      position: absolute;
      bottom: 16px;
      left: 16px;
      right: 16px;
      
      .skeleton-grid-title {
        height: 18px;
        width: 70%;
        background: rgba(255, 255, 255, 0.9);
        border-radius: var(--skeleton-radius);
        backdrop-filter: blur(4px);
      }
    }
  }
}

// Animation keyframe
@keyframes shimmer {
  0% {
    left: -100%;
  }
  100% {
    left: 100%;
  }
}

// Mode sombre
@media (prefers-color-scheme: dark) {
  .loading-skeleton {
    --skeleton-bg: #2a2a2a;
    --skeleton-shimmer: #3a3a3a;
  }
}

// Versions subtiles pour les interfaces pro
.skeleton-subtle {
  --skeleton-bg: #fafafa;
  --skeleton-shimmer: #f5f5f5;
  
  &.skeleton-animated {
    .skeleton-line,
    .skeleton-image,
    .skeleton-block,
    .skeleton-card-image,
    .skeleton-grid-image {
      &::after {
        animation-duration: 2s;
        opacity: 0.6;
      }
    }
  }
}

// Responsive
@media (max-width: 768px) {
  .skeleton-card .skeleton-card-image {
    height: 150px;
  }
  
  .skeleton-grid-item .skeleton-grid-image {
    height: 200px;
  }
}</style>