<template>
  <div class="grid-skeleton" :class="gridClass">
    <!-- Pattern 1: small + large -->
    <div v-if="pattern === 'small-large'" class="grid-row pattern-1">
      <div class="grid-item small">
        <LoadingSkeleton type="grid-item" height="280px" />
      </div>
      <div class="grid-item large">
        <LoadingSkeleton type="grid-item" height="420px" />
      </div>
    </div>
    
    <!-- Pattern 2: large + small -->
    <div v-else-if="pattern === 'large-small'" class="grid-row pattern-2">
      <div class="grid-item large">
        <LoadingSkeleton type="grid-item" height="420px" />
      </div>
      <div class="grid-item small">
        <LoadingSkeleton type="grid-item" height="280px" />
      </div>
    </div>
    
    <!-- Pattern 3: centered single -->
    <div v-else-if="pattern === 'centered'" class="grid-row pattern-3">
      <div class="grid-item centered">
        <LoadingSkeleton type="grid-item" height="380px" />
      </div>
    </div>
    
    <!-- Grid complet alternant -->
    <div v-else class="grid-full">
      <div class="grid-row pattern-1">
        <div class="grid-item small">
          <LoadingSkeleton type="grid-item" height="280px" />
        </div>
        <div class="grid-item large">
          <LoadingSkeleton type="grid-item" height="420px" />
        </div>
      </div>
      
      <div class="grid-row pattern-2">
        <div class="grid-item large">
          <LoadingSkeleton type="grid-item" height="420px" />
        </div>
        <div class="grid-item small">
          <LoadingSkeleton type="grid-item" height="280px" />
        </div>
      </div>
      
      <div class="grid-row pattern-3">
        <div class="grid-item centered">
          <LoadingSkeleton type="grid-item" height="380px" />
        </div>
      </div>
      
      <div class="grid-row pattern-1">
        <div class="grid-item small">
          <LoadingSkeleton type="grid-item" height="280px" />
        </div>
        <div class="grid-item large">
          <LoadingSkeleton type="grid-item" height="420px" />
        </div>
      </div>
      
      <div class="grid-row pattern-2">
        <div class="grid-item large">
          <LoadingSkeleton type="grid-item" height="420px" />
        </div>
        <div class="grid-item small">
          <LoadingSkeleton type="grid-item" height="280px" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import LoadingSkeleton from '@/components/loading/LoadingSkeleton.vue';

interface Props {
  pattern?: 'small-large' | 'large-small' | 'centered' | 'full';
  count?: number;
  animated?: boolean;
  spacing?: 'normal' | 'tight' | 'loose';
}

const props = withDefaults(defineProps<Props>(), {
  pattern: 'full',
  count: 5,
  animated: true,
  spacing: 'normal'
});

const gridClass = computed(() => ({
  [`spacing-${props.spacing}`]: true,
  'animated': props.animated
}));
</script>

<style scoped lang="scss">
.grid-skeleton {
  width: 100%;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  
  &.spacing-tight {
    gap: 16px;
  }
  
  &.spacing-normal {
    gap: 24px;
  }
  
  &.spacing-loose {
    gap: 32px;
  }
  
  .grid-row {
    display: flex;
    gap: inherit;
    margin-bottom: 24px;
    
    &:last-child {
      margin-bottom: 0;
    }
    
    // Pattern 1: Small + Large
    &.pattern-1 {
      .grid-item.small {
        flex: 1;
        max-width: 380px;
      }
      
      .grid-item.large {
        flex: 1.618; // Golden ratio
        min-width: 480px;
      }
    }
    
    // Pattern 2: Large + Small 
    &.pattern-2 {
      .grid-item.large {
        flex: 1.618;
        min-width: 480px;
      }
      
      .grid-item.small {
        flex: 1;
        max-width: 380px;
      }
    }
    
    // Pattern 3: Centered
    &.pattern-3 {
      justify-content: center;
      
      .grid-item.centered {
        width: 100%;
        max-width: 560px;
      }
    }
  }
  
  .grid-item {
    position: relative;
    border-radius: 8px;
    overflow: hidden;
    transition: all 0.3s ease;
  }
  
  // Animation d'apparition échelonnée
  &.animated {
    .grid-row {
      opacity: 0;
      animation: fadeInUp 0.6s ease forwards;
      
      &:nth-child(1) { animation-delay: 0.1s; }
      &:nth-child(2) { animation-delay: 0.2s; }
      &:nth-child(3) { animation-delay: 0.3s; }
      &:nth-child(4) { animation-delay: 0.4s; }
      &:nth-child(5) { animation-delay: 0.5s; }
    }
  }
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

// Responsive
@media (max-width: 768px) {
  .grid-skeleton {
    .grid-row {
      flex-direction: column;
      
      .grid-item {
        max-width: none !important;
        min-width: none !important;
      }
    }
  }
}

// Hover effects subtils pour l'interactivité visuelle
.grid-item {
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
  }
}

// Version compacte pour les listes admin
.grid-skeleton.compact {
  .grid-row {
    margin-bottom: 12px;
    
    .grid-item {
      :deep(.skeleton-grid-image) {
        height: 120px;
      }
    }
  }
}

// Version pour retouches (before/after)
.grid-skeleton.retouches {
  .grid-item {
    :deep(.skeleton-grid-image) {
      position: relative;
      
      &::before {
        content: '';
        position: absolute;
        top: 50%;
        left: 50%;
        width: 2px;
        height: 60%;
        background: rgba(255, 255, 255, 0.8);
        transform: translate(-50%, -50%);
        z-index: 2;
      }
      
      &::after {
        content: '';
        position: absolute;
        top: 50%;
        left: 50%;
        width: 20px;
        height: 20px;
        border: 2px solid rgba(255, 255, 255, 0.8);
        border-radius: 50%;
        background: rgba(0, 0, 0, 0.2);
        transform: translate(-50%, -50%);
        z-index: 3;
      }
    }
  }
}</style>