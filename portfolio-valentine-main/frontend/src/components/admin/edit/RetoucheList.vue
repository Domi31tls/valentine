<template>
  <div class="retouche-list">
    <!-- Header -->
    <div class="retouche-list-header">
      <div class="retouche-list-header-left">
        <h1 class="retouche-list-header__title page-heading">Retouches</h1>
        <span class="retouche-list-header__count">{{ filteredRetouches.length }} retouche{{ filteredRetouches.length > 1 ? 's' : '' }}</span>
      </div>
      
      <div class="retouche-list-header-right">
        <button @click="createRetouche" class="button-primary">
          Add New
        </button>
      </div>
    </div>
    
    <!-- Filtres et recherche -->
    <div class="list-controls">
      <!-- Search -->
      <div class="list-controls__search">
        <MagnifiyingGlassIcon />
        <input 
          v-model="searchQuery"
          type="text" 
          placeholder="Search edits..."
          class="search-input"
        />
      </div>

      <div class="list-controls__selects">
        <!-- Filters -->
        <div class="list-controls__filter">
          <select v-model="statusFilter" class="filter-select">
            <option value="">All Status</option>
            <option value="published">Published</option>
            <option value="invisible">Invisible</option>
          </select>
        </div>

      </div>
    </div>
    
    <!-- État de chargement -->
    <div v-if="isLoading" class="loading-state">
      <div class="loading-spinner"></div>
      <p>Loading retouches...</p>
    </div>
    
    <!-- État d'erreur -->
    <div v-else-if="error" class="error-state">
      <div class="error-icon">⚠️</div>
      <h3>Error loading retouches</h3>
      <p>{{ error }}</p>
      <button @click="loadRetouches" class="retry-button">Retry</button>
    </div>
    
    <!-- État vide -->
    <div v-else-if="retouches.length === 0 && !searchQuery" class="empty-state">
      <div class="empty-state-icon">✨</div>
      <h3>No Edits yet</h3>
      <p>Create your first before & after transformation</p>
      <button @click="createRetouche" class="create-button button-primary">
        Create First Edit
      </button>
    </div>

    <!-- No results -->
    <div v-else-if="filteredRetouches.length === 0 && searchQuery" class="no-results">
      <div class="no-results-icon"><MagnifiyingGlassIcon /></div>
      <h3>No Edits found</h3>
      <p>Try adjusting your search or filters</p>
    </div>
    
    <!-- Liste des retouches -->
    <div v-else class="edits-grid">
      <RetoucheTile
          v-for="retouche in paginatedRetouches"
          :key="retouche.id"
          :retouche="retouche"
          :view-mode="viewMode"
          @update="handleRetoucheUpdate"
          @delete="handleRetoucheDelete"
        />
      </div>
      
      <!-- Pagination -->
      <div v-if="totalPages > 1" class="pagination">
        <button 
          @click="goToPage(currentPage - 1)"
          :disabled="currentPage === 1"
          class="pagination-btn"
        >
          ← Previous
        </button>
        
        <div class="pagination-info">
          Page {{ currentPage }} of {{ totalPages }}
        </div>
        
        <button 
          @click="goToPage(currentPage + 1)"
          :disabled="currentPage === totalPages"
          class="pagination-btn"
        >
          Next →
        </button>
      </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import RetoucheTile from './RetoucheTile.vue';
import type { Retouche } from '../../../../shared/types';
import MagnifiyingGlassIcon from '@/Icons/magnifiying.glass.vue';

// État réactif
const retouches = ref<Retouche[]>([]);
const isLoading = ref(true);
const error = ref<string | null>(null);

// Filtres et recherche
const searchQuery = ref('');
const statusFilter = ref('');
const viewMode = ref<'grid' | 'list'>('grid');

// Pagination
const currentPage = ref(1);
const itemsPerPage = ref(12);

// Computed
const filteredRetouches = computed(() => {
  let filtered = [...retouches.value]; // Assurer que c'est un tableau
  
  // Filtre par recherche
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    filtered = filtered.filter(retouche => 
      retouche.title.toLowerCase().includes(query) ||
      retouche.description?.toLowerCase().includes(query)
    );
  }
  
  // Filtre par status
  if (statusFilter.value) {
    filtered = filtered.filter(retouche => retouche.status === statusFilter.value);
  }
  
  return filtered;
});

const totalPages = computed(() => {
  return Math.ceil(filteredRetouches.value.length / itemsPerPage.value);
});

const paginatedRetouches = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value;
  const end = start + itemsPerPage.value;
  return filteredRetouches.value.slice(start, end);
});

const createRetouche = () => {
  window.location.href = '/admin/edits/new';
};

// Watchers
watch([searchQuery, statusFilter], () => {
  currentPage.value = 1; // Reset pagination when filters change
});

// Méthodes
const loadRetouches = async () => {
  try {
    isLoading.value = true;
    error.value = null;
    
    const response = await fetch('/api/retouches?limit=100', {
      credentials: 'include'
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (data.success) {
      // L'API retourne une réponse paginée : data.data contient { data: [...], pagination: {...} }
      const responseData = data.data;
      retouches.value = Array.isArray(responseData.data) ? responseData.data : 
                       Array.isArray(responseData) ? responseData : 
                       Array.isArray(data.data) ? data.data : [];
      console.log('Loaded retouches:', retouches.value);
    } else {
      throw new Error(data.message || 'Failed to load retouches');
    }
    
  } catch (err) {
    console.error('Error loading retouches:', err);
    error.value = err instanceof Error ? err.message : 'Unknown error';
    // En cas d'erreur, s'assurer que retouches est un tableau vide
    retouches.value = [];
  } finally {
    isLoading.value = false;
  }
};

const handleRetoucheUpdate = async (retoucheId: string, updates: Partial<Retouche>) => {
  try {
    const response = await fetch(`/api/retouches/${retoucheId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify(updates)
    });
    
    if (response.ok) {
      const data = await response.json();
      if (data.success) {
        // Mettre à jour la retouche dans la liste
        const index = retouches.value.findIndex(r => r.id === retoucheId);
        if (index !== -1) {
          retouches.value[index] = data.data;
        }
      }
    }
  } catch (error) {
    console.error('Error updating retouche:', error);
  }
};

const handleRetoucheDelete = async (retoucheId: string) => {
  if (!confirm('Are you sure you want to delete this retouche?')) {
    return;
  }
  
  try {
    const response = await fetch(`/api/retouches/${retoucheId}`, {
      method: 'DELETE',
      credentials: 'include'
    });
    
    if (response.ok) {
      // Supprimer de la liste
      retouches.value = retouches.value.filter(r => r.id !== retoucheId);
    } else {
      throw new Error('Failed to delete retouche');
    }
  } catch (error) {
    console.error('Error deleting retouche:', error);
    alert('Error deleting retouche. Please try again.');
  }
};

const goToPage = (page: number) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page;
  }
};

// Lifecycle
onMounted(() => {
  loadRetouches();
});
</script>

<style scoped lang="scss">
.retouche-list {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-7);

    &-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: var(--spacing-6);

      &-left {
        display: flex;
        flex-direction: column;
        gap: 0;
      }

      &__count {
        color: var(--color-text-secondary);
      }
    }
}

.list-controls {
  display: grid;
  grid-template-columns: repeat(3, minmax(200px, 1fr));
  align-items: center;
  gap: var(--spacing-3);

  @media (max-width: 1024px) {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-4);
  }

  &__search {
    display: flex;
    align-items: center;
    gap: var(--spacing-1);
    width: 100%;

    padding: var(--spacing-2) var(--spacing-3);
    border-radius: var(--border-radius-m);
    background: var(--color-background-secondary);

    input {
      background: none;
      border: none;
      outline: none;
      color: var(--color-text);
      width: 100%;

      &::placeholder {
        color: var(--color-text);
        opacity: 0.3;
      }
    }

  }

  &__selects {
    display: flex;
    gap: var(--spacing-3);
    align-items: center;
    justify-content: flex-end;
    align-self: stretch;

    grid-column: 3 / span 1;

    select {
      background-color: var(--color-background-secondary);
      color: var(--color-text);
      border-radius: var(--border-radius-m);
      padding: var(--spacing-2) var(--spacing-3);
      border: none;
      outline: none;
      cursor: pointer;
      appearance: none;

      &::after {
        content: '▼';
        margin-left: var(--spacing-2);
      }
    }

    .sort-order {
      background-color: var(--color-background-secondary);
    }
  }
}

.empty-state, .no-results {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding-block: var(--spacing-6);
  gap: var(--spacing-3);

  &-icon svg {
    width: var(--spacing-6);
    height: var(--spacing-6);
  }
  

  h3 {
    font-size: var(--font-size-l);
    font-weight: var(--font-weight-bold);
    line-height: var(--line-height-tight);
    margin: 0;
  }
  p {
    font-size: var(--font-size-m);
    color: var(--color-text-secondary);

    margin-bottom: var(--spacing-6);
  }
}

.edits-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(200px, 1fr));
  gap: var(--spacing-3);

  @media (max-width: 1024px) {
    grid-template-columns: repeat(2, minmax(200px, 1fr));
  }

  @media (max-width: 768px) {
    grid-template-columns: repeat(1, minmax(200px, 1fr));
  }
}
</style>
