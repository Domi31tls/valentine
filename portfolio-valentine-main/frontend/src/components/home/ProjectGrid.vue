<template>
  <section class="project-grid container" v-if="!loading && projects.length > 0">
    <div class="project-grid__row" 
      v-for="(row, rowIndex) in groupedProjects" 
      :key="`row-${rowIndex}`"
      :class="getRowPattern(rowIndex)">
        <ProjectCard 
          v-for="project in row"
          :key="project.id"
          :project="project" 
          @click="openModal(project)" />
    </div>
  </section>

  <section class="project-grid container" v-if="loading">
    <GridSkeleton pattern="full" :animated="true" />
  </section>

  <section class="project-grid container" v-if="!loading && projects.length === 0">
    <p>Aucun projet publié pour le moment</p>
  </section>
</template>

<script setup lang="ts">
//import
import { ref, computed, onMounted, defineEmits } from 'vue'
import type { Project } from '@/../../shared/types'

import GridSkeleton from '@/components/loading/GridSkeleton.vue'
import ProjectCard from '@/components/home/ProjectCard.vue'

const loading = ref(false)
const projects = ref<Project[]>([])
const selectedProject = ref<Project | null>(null)

const groupedProjects = computed(() => {
  const rows: Project[][] = [];
  let currentIndex = 0;

  while (currentIndex < projects.value.length) {
    const rowIndex = rows.length;
    const pattern = getRowPattern(rowIndex);
    
    let rowSize = 2; // Par défaut 2 projets par ligne
    if (pattern === 'pattern-centered' && projects.value.length - currentIndex >= 1) {
      rowSize = 1; // Pattern centered = 1 projet
    }
    
    const row = projects.value.slice(currentIndex, currentIndex + rowSize);
    if (row.length > 0) {
      rows.push(row);
    }
    
    currentIndex += rowSize;
  }

  return rows;
})

// Methods

const openModal = (project: Project) => {
  emit('openModal', project)
}

// Logique des patterns alternés
const getRowPattern = (rowIndex: number): string => {
  const patterns = ['pattern-1-3', 'pattern-3-1', 'pattern-centered']
  return patterns[rowIndex % patterns.length]
}

const emit = defineEmits<{
  openModal: [project: Project]
}>()


// Lifecycle
onMounted(() => {
  fetchProjects()
})

async function fetchProjects() {
  try {
    loading.value = true
    
    const response = await fetch(`/api/public/projects?status=published`)
    
    if (!response.ok) {
      throw new Error('Erreur lors du chargement des projets')
    }
    
    const data = await response.json()
    projects.value = data.data || []
    
  } catch (error) {
    console.error('Erreur:', error)
    projects.value = []
  } finally {
    loading.value = false
  }
}

</script>

<style scoped lang="scss">
.project-grid {
  width: 100%;
  display: flex;
  flex-direction: column;

  padding-block: calc(var(--spacing-10) * 2) var(--spacing-10);
  gap: var(--spacing-10);

  &__row {
    width: 100%;
    display: grid;
    gap: var(--spacing-5);

    &.pattern-1-3 {
      grid-template-columns: 1fr 3fr;
    }

    &.pattern-3-1 {
      grid-template-columns: 3fr 1fr;
    }

    &.pattern-centered {
      grid-template-columns: 1fr;
      justify-content: center;
    }

    &.pattern-1-3, &.pattern-3-1, &.pattern-centered {
      @media (max-width: 768px) {
        grid-template-columns: 1fr;
      }
    }
  }
}

.empty-state {
  text-align: center;
  padding: var(--spacing-3xl) 0;
  color: var(--color-text-secondary);
  font-size: var(--font-size-m);
}
</style>

