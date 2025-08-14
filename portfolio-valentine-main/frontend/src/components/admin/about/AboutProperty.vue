<template>
  <div 
    class="about-property"
    :class="{ 'dragging': isDragging }"
  >
    <!-- Grip handle -->
    <div 
      class="about-property-grip" 
      draggable="true"
      @dragstart="onDragStart"
      @dragend="onDragEnd"
      @click="showDropdown = !showDropdown"
    >
      <div class="about-property-grip__handle">
        <div class="grip-dot"></div>
        <div class="grip-dot"></div>
        <div class="grip-dot"></div>
        <div class="grip-dot"></div>
        <div class="grip-dot"></div>
        <div class="grip-dot"></div>
      </div>

      <!-- Dropdown -->
      <div class="property-dropdown" v-if="showDropdown" @click.stop>
        <div class="dropdown-option" @click="onDuplicate">
          Duplicate
        </div>
        <div class="dropdown-option" @click="onDelete">
          Delete
        </div>
      </div>
    </div>

    <!-- Property content -->
    <div class="about-property-content">
      <!-- Property editor -->
      <div class="about-property-editor">
        <!-- Text property -->
        <AboutPropertyText
          v-if="property.type === 'text'"
          :data="property.data"
          @update="onUpdate"
        />

        <!-- Client property -->
        <AboutPropertyClient
          v-else-if="property.type === 'client'"
          :data="property.data"
          @update="onUpdate"
        />

        <!-- Contact property -->
        <AboutPropertyContact
          v-else-if="property.type === 'contact'"
          :data="property.data"
          @update="onUpdate"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue';
import AboutPropertyText from '@/components/admin/about/AboutPropertyText.vue';
import AboutPropertyClient from '@/components/admin/about/AboutPropertyClient.vue';
import AboutPropertyContact from '@/components/admin/about/AboutPropertyContact.vue';
import type { AboutProperty as AboutPropertyType } from '@/../../shared/types';

interface Props {
  property: AboutPropertyType;
  index: number;
}

interface Emits {
  (e: 'update', index: number, property: AboutPropertyType): void;
  (e: 'delete', index: number): void;
  (e: 'duplicate', index: number): void;
  (e: 'dragstart', event: DragEvent, index: number): void;
  (e: 'dragend'): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const isDragging = ref(false);
const showDropdown = ref(false);

// Methods
const onUpdate = (newData: any) => {
  const updatedProperty = {
    ...props.property,
    data: newData
  };
  emit('update', props.index, updatedProperty);
};

const onDelete = () => {
  if (confirm('Êtes-vous sûr de vouloir supprimer cette propriété ?')) {
    emit('delete', props.index);
    showDropdown.value = false;
  }
};

const onDuplicate = () => {
  emit('duplicate', props.index);
  showDropdown.value = false;
};

const onDragStart = (event: DragEvent) => {
  isDragging.value = true;
  showDropdown.value = false;
  console.log('drag :', props.property.data.name)
  emit('dragstart', event, props.index);
};

const onDragEnd = () => {
  isDragging.value = false;
  emit('dragend');
};

// Gestion intelligente des clics extérieurs
const handleOutsideClick = (event: Event) => {
  const target = event.target as HTMLElement;
  
  // Ne pas fermer si on clique dans le dropdown ou sur le trigger
  if (!target.closest('.property-dropdown') && !target.closest('.about-property')) {
    showDropdown.value = false;
  }
};

// Lifecycle
onMounted(() => {
  document.addEventListener('click', handleOutsideClick);
});

onUnmounted(() => {
  document.removeEventListener('click', handleOutsideClick);
});
</script>

<style scoped lang="scss">
.about-property {
  display: flex;
  align-items: flex-start;
  align-self: stretch;
  flex: 1;
  
  &.dragging {
    opacity: 0.5;
    transform: rotate(2deg);
  }

  &-grip {
    width: var(--spacing-3);
    padding: var(--spacing-2);
    border-radius: var(--border-radius-s);
    cursor: grab; 
    position: relative;

    transition: background-color var(--transition-base), color var(--transition-easing-spring);

    height: fit-content;
    min-height: var(--spacing-7);
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 1;

    &:hover {
      background-color: var(--color-background-secondary);
      opacity: 1;
    }
    
    &:active {
      cursor: grabbing;
    }

    &__handle {
      width: 100%;

      display: grid;
      grid-template-columns: repeat(2, 1fr);
      justify-content: center;
      align-items: center;
      gap: var(--spacing-1);

      .grip-dot {
        background-color: var(--color-text-secondary);
        width: var(--spacing-1-2);
        height: var(--spacing-1-2);
        border-radius: var(--border-radius-full);
      }
    }
  }

  &-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    align-self: stretch;
    gap: var(--spacing-2);
  }

  &-editor {
    width: 100%;
  }
}

.dropdown-option {
  padding: var(--spacing-1) 0;
  cursor: pointer;
  
  &:hover {
    background-color: var(--color-background-secondary);
  }
}
</style>
