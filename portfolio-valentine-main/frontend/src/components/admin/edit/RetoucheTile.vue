<template>
  <div class="edits-tile" @click="navigateToEdit">
    <div class="edits-tile-preview">
      <div class="edits-tile-preview__image before-image">
        <img v-if="retouche.before_image" :src="retouche.before_image.url" :alt="retouche.before_image.alt" />
        <div class="edits-tile-preview__placeholder" v-else>
          <Camera />
          Before
        </div>
      </div>
      <div class="edits-tile-preview__image after-image">
        <img v-if="retouche.after_image" :src="retouche.after_image.url" :alt="retouche.after_image.alt" />
        <div class="edits-tile-preview__placeholder" v-else>
          <Camera />
          After
        </div>
      </div>
    </div>
    
    <div class="edits-tile-info">
      <div class="edits-tile-info__content">
        <div class="edits-tile-info__meta">
          <span>{{ formatDate(retouche.created_at) }}</span>
          <h3>{{ retouche.title || 'Untitled' }}</h3>
        </div>
        <div class="edits-tile-info__status"
        :class="{ 'published': retouche.status === 'published' }"
        ></div>
      </div>
    </div>

    <div class="edits-tile-actions" @click.stop>
      <button 
      @click="showDropdown = !showDropdown"
      class="button edits-tile-actions__button"
      >
        <ThreeDotsV />
      </button>
    </div>
      
    <div class="edits-tile-dropdown" v-if="showDropdown">
      <ul>
        <li class="edits-tile-dropdown-item" v-for="item in dropdownItems" :key="item.action">
          <button @click="handleDropdownAction(item.action)" :class="item.class">{{ item.name }}</button>
        </li>
      </ul>
    </div>
      

  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import type { Retouche } from '@/../../shared/types';

import Camera from '@/Icons/camera.vue';
import ThreeDotsV from '@/Icons/3.dots.v.vue';

interface Props {
  retouche: Retouche;
  viewMode: 'grid' | 'list';
}

const props = defineProps<Props>();

const emit = defineEmits<{
  'update': [retoucheId: string, updates: Partial<Retouche>];
  'delete': [retoucheId: string];
}>();

// État local
const showDropdown = ref(false);
const dropdownItems = [
  {
    name: 'Edit',
    action: 'edit',
  },
  {
    name: props.retouche.status === 'published' ? 'Make Invisible' : 'Publish',
    action: 'publish',
  },
  {
    name: 'Delete',
    action: 'delete',
    class: 'danger',
  }
]

// Méthodes de navigation
const navigateToEdit = () => {
  window.location.href = `/admin/edits/${props.retouche.id}`;
};

const handleDropdownAction = (action: string) => {
  switch (action) {
    case 'edit':
      navigateToEdit();
      break;
    case 'publish':
      toggleStatus();
      break;
    case 'delete':
      deleteRetouche();
      break;
  }
  showDropdown.value = false;
};

// Actions
const toggleDropdown = () => {
  showDropdown.value = !showDropdown.value;
};

const toggleStatus = () => {
  const newStatus = props.retouche.status === 'published' ? 'invisible' : 'published';
  emit('update', props.retouche.id, { status: newStatus });
  showDropdown.value = false;
};

const deleteRetouche = () => {
  if (confirm('Are you sure you want to delete this retouche?')) {
    emit('delete', props.retouche.id);
  }
  showDropdown.value = false;
};

// Utilitaires
const formatDate = (date: Date) => {
  const d = new Date(date);
  return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
};

// Fermer le menu d'actions quand on clique ailleurs
const handleClickOutside = (event: Event) => {
  const target = event.target as HTMLElement;
  if (!target.closest('.retouche-actions')) {
    showDropdown.value = false;
  }
};

onMounted(() => {
  document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
});
</script>

<style scoped lang="scss">
.edits-tile {
  aspect-ratio: 4 / 3;
  position: relative;
  cursor: pointer;
  transition: all var(--transition-slow) var(--transition-easing-ease-in-out);

  &-preview {
    width: 100%;
    height: 100%;
    overflow: hidden;
    border-radius: var(--border-radius-m);
    display: flex;
    flex-direction: row;
    gap: 0;

    position: relative;

    &:hover {
      .edits-tile-preview__image, .edits-tile-preview__placeholder {
        transform: scale(1.05);
      }
    }

    &__image {
      width: 50%;
      height: 100%;

      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
    }

    &__placeholder {
      display: flex;
      justify-content: center;
      align-items: center;
      flex-direction: column;
      gap: var(--spacing-2);
      width: 50%;
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
