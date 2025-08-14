<template>
  <div class="project-tile" @click="handleClick">
    <div class="project-tile-thumbnail">
      <img 
        v-if="thumbnailUrl" 
        :src="thumbnailUrl" 
        :alt="project.title || 'Untitled'"
        class="project-tile-thumbnail__image"
      />
      <div v-else class="project-tile-thumbnail__placeholder">
        <Camera />
        <span>No Image Yet</span>
      </div>
    </div>

    <div class="project-tile-info">
      <div class="project-tile-info__content">
        <div class="project-tile-info__meta">
          <span>{{ formatDate(project.created_at) }}</span>
          <h3>{{ project.title || 'Untitled' }}</h3>
        </div>
        <div class="project-tile-info__status"
        :class="{ 'published': project.status === 'published' }"
        ></div>
      </div>
    </div>

    <div class="project-tile-actions" @click.stop>
      <button 
      @click="showDropdown = !showDropdown"
      class="button project-tile-actions__button"
      >
        <ThreeDotsV />
      </button>
    </div>
      
    <div class="project-tile-dropdown" v-if="showDropdown">
      <ul>
        <li class="project-tile-dropdown-item" v-for="item in dropdownItems" :key="item.action">
          <button @click="handleDropdownAction(item.action)" :class="item.class">{{ item.name }}</button>
        </li>
      </ul>
    </div>
      

  </div>
</template>

<script setup lang="ts">
// Imports
import { ref, computed, onMounted, onUnmounted } from 'vue';
import type { Project } from '@/../../shared/types';

import Camera from '@/Icons/camera.vue';
import ThreeDotsV from '@/Icons/3.dots.v.vue';

// Props
interface Props {
  project: Project;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  edit: [id: string];
  preview: [id: string];
  duplicate: [id: string];
  delete: [id: string];
}>();

const dropdownItems = [
  {
    name: 'Edit',
    action: 'edit',
  },
  {
    name: 'Preview',
    action: 'preview',
  },
  {
    name: 'Duplicate',
    action: 'duplicate',
  },
  {
    name: 'Delete',
    action: 'delete',
    class: 'danger',
  }
]
  

// States
const showDropdown = ref(false);
const thumbnailUrl = computed(() => {
  if (props.project.images && props.project.images.length > 0) {
    return props.project.images[0].url;
  }
  return null;
});

// Methods
const handleClick = () => {
  if (!showDropdown.value) {
    handleDropdownAction('edit');
  }
};

const handleDropdownAction = (action: string) => {
  if (action === 'delete') {
    if (confirm(`Êtes-vous sûr de vouloir supprimer "${props.project.title || 'ce projet'}" ?`)) {
      emit(action, props.project.id);
    }
    showDropdown.value = false;
    return;
  }
  // @ts-ignore
  emit(action, props.project.id);
  showDropdown.value = false;
};

// Fermer le dropdown au clic extérieur
const handleClickOutside = (event: MouseEvent) => {
  const target = event.target as HTMLElement;
  if (!target.closest('.project-tile-actions')) {
    showDropdown.value = false;
  }
};

// Utils
const formatDate = (date: Date) => {
  const d = new Date(date);
  return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
};


onMounted(() => {
  document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
});
</script>

<style scoped lang="scss">
.project-tile {
  aspect-ratio: 4 / 3;
  position: relative;
  cursor: pointer;
  transition: all var(--transition-slow) var(--transition-easing-ease-in-out);

  &-thumbnail {
    width: 100%;
    height: 100%;
    overflow: hidden;
    border-radius: var(--border-radius-m);

    position: relative;

    &:hover {
      img, .project-tile-thumbnail__placeholder {
        transform: scale(1.05);
      }
    }


    &__image {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: all var(--transition-base) var(--transition-easing-bounce);
    }

    &__placeholder {
      display: flex;
      justify-content: center;
      align-items: center;
      flex-direction: column;
      gap: var(--spacing-2);
      width: 100%;
      height: 100%;
      background-color: var(--color-background-secondary);
      transition: all var(--transition-base) var(--transition-easing-bounce);
    }
  }

  &-info {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    padding: var(--spacing-1);
    
    &__content {
      position: relative;
      padding: var(--spacing-2);

      background: var(--color-background);
      border-radius: var(--border-radius-s);
    }

    &__meta {
      display: flex;
      flex-direction: column;
      gap: 0;

      h3 {
        font-size: var(--font-size-m);
        font-weight: var(--font-weight-bold);
      }
      
      span {
        font-size: var(--font-size-xs);
      }
    }

    &__status {
      position: absolute;
      top: var(--spacing-2);
      right: var(--spacing-2);
      width: var(--spacing-2);
      height: var(--spacing-2);

      background-color: var(--color-neutral-3);
      border-radius: var(--border-radius-full);

      &.published {
        background-color: var(--color-success-text);
      }
    }
  }

  &-actions {
    position: absolute;
    top: var(--spacing-2);
    right: var(--spacing-2);

    &__button {
      background-color: var(--color-background);

      &:hover {
        background-color: var(--color-background-secondary);
      }
    }
  }

  &-dropdown {
    position: absolute;
    top: var(--spacing-7);
    right: var(--spacing-2);
    width: 100%;
    max-width: 200px;
    padding: var(--spacing-2);
    background-color: var(--color-background);
    border-radius: var(--border-radius-m);
    border: 1px solid var(--color-background-secondary);
    z-index: 100;

    &-item {
      display: inline-flex;
      align-items: center;
      justify-content: flex-start;
      width: 100%;

      color: var(--color-text);
      text-decoration: none;

      padding: var(--spacing-2);
      border-radius: var(--border-radius-s);
      transition: all var(--transition-slow) var(--transition-easing-ease-in-out);

      &:hover {
        background-color: var(--color-background-secondary);
      }

      & .danger {
        color: var(--color-error-text);
      }
    }
  }
}
  
</style>


