<template>
  <section class="retouche-grid container" v-if="!loading && retouches.length > 0">
    <RetoucheSlider v-for="retouche in retouches" :key="retouche.id" :retouche="retouche" />
  </section>

  <section class="retouche-grid container" v-if="loading">
    <GridSkeleton pattern="full" :animated="true" />
  </section>

  <section class="retouche-grid container" v-if="!loading && retouches.length === 0">
    <p>No editing published yet</p>
  </section>
</template>

<script setup lang="ts">
// Imports
import { ref, onMounted, onUnmounted } from 'vue'
import type { Retouche } from '@/../../shared/types'

import RetoucheSlider from '@/components/common/RetoucheSlider.vue'
import GridSkeleton from '@/components/loading/GridSkeleton.vue'

// État
const loading = ref(false)
const retouches = ref<Retouche[]>([])

// Fetch retouches
const fetchRetouches = async () => {
  try {
    loading.value = true
    
    const response = await fetch(`/api/public/retouches?status=published`)
    
    if (!response.ok) {
      throw new Error('Erreur lors du chargement des retouches')
    }
    
    const data = await response.json()
    retouches.value = data.data || []
    
  } catch (error) {
    console.error('Erreur:', error)
    retouches.value = []
  } finally {
    loading.value = false
  }
}

// Lifecycle
onMounted(() => {
  fetchRetouches()
})

</script>

<style scoped lang="scss">
.retouche-grid {
  width: 100%;
  display: flex;
  flex-direction: column;

  padding-block: calc(var(--spacing-10) * 2) var(--spacing-10);
  gap: var(--spacing-10);
}

.empty-state {
  text-align: center;
  padding: var(--spacing-3xl) 0;
  color: var(--color-text-secondary);
  font-size: var(--font-size-m);
}
</style>