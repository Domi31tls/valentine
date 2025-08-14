<template>
  <div class="mode-switch">
    <button 
      class="mode-btn" 
      :class="{ active: currentMode === 'photo' }"
      @click="setMode('photo')"
    >
      Photographie
    </button>
    <button 
      class="mode-btn" 
      :class="{ active: currentMode === 'retouche' }"
      @click="setMode('retouche')"
    >
      Retouche
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

// Props
interface Props {
  initialMode?: 'photo' | 'retouche';
}

const props = withDefaults(defineProps<Props>(), {
  initialMode: 'photo'
});

// Emit pour communiquer avec le parent
const emit = defineEmits<{
  modeChange: [mode: 'photo' | 'retouche'];
}>();

// État local
const currentMode = ref<'photo' | 'retouche'>(props.initialMode);

/**
 * Change le mode et émet l'événement
 */
const setMode = (mode: 'photo' | 'retouche') => {
  currentMode.value = mode;
  emit('modeChange', mode);
  console.log('Mode changé vers:', mode);
};
</script>

<style lang="scss" scoped>
.mode-switch {
  display: flex;
  background-color: $color-gray-lightest;
  border-radius: $border-radius-lg;
  padding: $space-1;
  justify-content: center;
  max-width: 300px;
  
  @media (max-width: $breakpoint-lg) {
    margin: 0 auto;
  }
}

.mode-btn {
  flex: 1;
  padding: $space-3 $space-4;
  background: transparent;
  border: none;
  border-radius: $border-radius;
  font-size: $font-size-sm;
  font-weight: $font-weight-medium;
  color: $text-secondary;
  cursor: pointer;
  transition: all $transition-fast;
  
  &.active {
    background-color: $background;
    color: $text-primary;
    box-shadow: $shadow-sm;
  }
  
  &:hover:not(.active) {
    color: $text-primary;
  }
}
</style>
