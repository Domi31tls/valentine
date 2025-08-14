<template>
  <article class="project-card" :class="[{ 'is-loading': isLoading }]">

    <!-- Image principale -->
    <div class="project-card__image-container" @click="handleClick">
      <img
        v-if="project.images.length > 0"
        class="project-card__image"
        loading="lazy"
        :src="project.images[0].url"
        :alt="project.title"
      />

      <div v-else class="project-card__placeholder">
        <div class="project-card__placeholder-icon">📷</div>
        <div class="project-card__placeholder-text">Aucune image</div>
      </div>
    </div>

    <!-- Nombre d'images -->
    <div class="project-card__image-count">
      1 / {{ project.images.length }}
    </div>

  </article>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { Project } from '@/../../shared/types'

interface Props {
  project: Project
}

const props = defineProps<Props>()
const emit = defineEmits<{
  click: [project: Project]
}>()

const isLoading = ref(false)

const handleClick = () => {
  emit('click', props.project)
}
</script>

<style scoped lang="scss">
.project-card {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  justify-content: center;
  gap: var(--spacing-1);


  &__image-container {
    width: 100%;
    cursor: pointer;
  }

  &__image {
    width: 100%;
    height: 100%;
    object-fit: fill;

    border-radius: var(--border-radius-m);
  }

  &__image-count {
    font-size: var(--font-size-m);
  }

  &__placeholder {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--color-background-secondary);
    border-radius: var(--border-radius-m);

    &-icon, &-text {
      font-size: var(--font-size-l);
      color: var(--color-text-secondary);
    }
  }
}


</style>
