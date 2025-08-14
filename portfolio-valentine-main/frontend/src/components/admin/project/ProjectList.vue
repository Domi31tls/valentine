<template>
  <div class="project-list">
    <!-- Header -->
    <div class="project-list-header">
      <div class="project-list-header-left">
        <h1 class="project-list-header__title page-heading">Projects</h1>
        <span class="project-list-header__count">{{ filteredProjects.length }} projet{{ filteredProjects.length > 1 ? 's' : '' }}</span>
      </div>
      
      <div class="project-list-header-right">
        <button @click="createProject" class="button-primary">
          Add New
        </button>
      </div>
    </div>
    
    <!-- Controls -->
    <div class="list-controls">
      <!-- Search -->
      <div class="list-controls__search">
        <MagnifiyingGlassIcon />
        <input 
          v-model="searchQuery"
          type="text" 
          placeholder="Search projects..."
          class="search-input"
        />
      </div>
      
      <div class="list-controls__selects">
        <!-- Filters -->
        <div class="list-controls__filter">
          <select v-model="filterStatus" class="filter-select">
            <option value="">All Status</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
            <option value="archived">Archived</option>
          </select>
        </div>

        <!-- Sorting -->
        <div class="list-controls__sort">
          <select v-model="sortBy" class="sort-select">
            <option value="updated_at">Last modified</option>
            <option value="created_at">Date created</option>
            <option value="title">Title</option>
            <option value="status">Status</option>
            <option value="category">Category</option>
          </select>
          
          <button @click="sortOrder = sortOrder === 'asc' ? 'desc' : 'asc'" class="sort-order button">
            {{ sortOrder === 'asc' ? '↑' : '↓' }}
          </button>
        </div>
      </div>

    </div>
    
    <!-- Loading state -->
    <div v-if="isLoading" class="loading-state">
      <div class="loading-spinner"></div>
      <p>Loading projects...</p>
    </div>
    
    <!-- Error state -->
    <div v-else-if="error" class="error-state">
      <div class="error-icon">⚠️</div>
      <h3>Error loading projects</h3>
      <p>{{ error }}</p>
      <button @click="loadProjects" class="retry-button">Retry</button>
    </div>
    
    <!-- Empty state -->
    <div v-else-if="filteredProjects.length === 0 && !searchQuery" class="empty-state">
      <div class="empty-state-icon"><CameraIcon /></div>
      <h3>No projects yet</h3>
      <p>Create your first project to get started</p>
      <button @click="createProject" class="btn-create-first button-primary">
        Create your first project
      </button>
    </div>
    
    <!-- No results -->
    <div v-else-if="filteredProjects.length === 0 && searchQuery" class="no-results">
      <div class="no-results-icon"><MagnifiyingGlassIcon /></div>
      <h3>No projects found</h3>
      <p>Try adjusting your search or filters</p>
    </div>
    
    <!-- Projects grid -->
    <div v-else class="projects-grid">
      <ProjectTile
        v-for="project in paginatedProjects"
        :key="project.id"
        :project="project"
        @edit="editProject"
        @preview="previewProject"
        @duplicate="duplicateProject"
        @delete="deleteProject"
      />
    </div>
    
    <!-- Pagination -->
    <div v-if="totalPages > 1" class="pagination">
      <button 
        @click="currentPage--" 
        :disabled="currentPage === 1"
        class="pagination-button"
      >
        ← Previous
      </button>
      
      <span class="pagination-info">
        Page {{ currentPage }} of {{ totalPages }}
      </span>
      
      <button 
        @click="currentPage++" 
        :disabled="currentPage === totalPages"
        class="pagination-button"
      >
        Next →
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import ProjectTile from '@/components/admin/project/ProjectTile.vue';
import type { Project } from '@/../../shared/types';
import MagnifiyingGlassIcon from '@/Icons/magnifiying.glass.vue';
import CameraIcon from '@/Icons/camera.vue';

// État réactif
const projects = ref<Project[]>([]);
const isLoading = ref(true);
const error = ref<string | null>(null);

// Filtres et tri
const searchQuery = ref('');
const sortBy = ref<'updated_at' | 'created_at' | 'title' | 'status' | 'category'>('updated_at');
const sortOrder = ref<'asc' | 'desc'>('desc');
const filterStatus = ref('');
const filterCategory = ref('');

// Pagination
const currentPage = ref(1);
const itemsPerPage = 24;

// Computed
const filteredProjects = computed(() => {
  let filtered = projects.value;
  
  // Search
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    filtered = filtered.filter(project => 
      (project.title?.toLowerCase().includes(query) || false) ||
      (project.description?.toLowerCase().includes(query) || false)
    );
  }
  
  // Filter by status
  if (filterStatus.value) {
    filtered = filtered.filter(project => project.status === filterStatus.value);
  }
  
  // Filter by category
  if (filterCategory.value) {
    filtered = filtered.filter(project => project.category === filterCategory.value);
  }
  
  // Sort
  filtered.sort((a, b) => {
    let aValue: any;
    let bValue: any;
    
    switch (sortBy.value) {
      case 'title':
        aValue = a.title?.toLowerCase() || 'sans titre';
        bValue = b.title?.toLowerCase() || 'sans titre';
        break;
      case 'status':
        aValue = a.status;
        bValue = b.status;
        break;
      case 'category':
        aValue = a.category;
        bValue = b.category;
        break;
      case 'created_at':
        aValue = new Date(a.created_at);
        bValue = new Date(b.created_at);
        break;
      default: // updated_at
        aValue = new Date(a.updated_at);
        bValue = new Date(b.updated_at);
        break;
    }
    
    if (aValue < bValue) return sortOrder.value === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortOrder.value === 'asc' ? 1 : -1;
    return 0;
  });
  
  return filtered;
});

const totalPages = computed(() => 
  Math.ceil(filteredProjects.value.length / itemsPerPage)
);

const paginatedProjects = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage;
  const end = start + itemsPerPage;
  return filteredProjects.value.slice(start, end);
});

// Méthodes
const loadProjects = async () => {
  try {
    isLoading.value = true;
    error.value = null;
    
    console.log('📞 Loading projects from API...');
    
    const response = await fetch('/api/projects', {
      credentials: 'include'
    });
    
    console.log('📞 API Response status:', response.status);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('📞 API Response data:', data);
    
    if (data.success) {
      // Vérifier la structure de la réponse
      const projectsData = data.data;
      
      if (Array.isArray(projectsData)) {
        // Structure simple : data est directement un tableau
        projects.value = projectsData;
      } else if (projectsData && Array.isArray(projectsData.data)) {
        // Structure paginée : data.data contient le tableau
        projects.value = projectsData.data;
        console.log('📊 Pagination info:', projectsData.pagination);
      } else {
        console.warn('⚠️ Unexpected data structure:', projectsData);
        projects.value = [];
      }
      
      console.log('✅ Projects loaded:', projects.value.length);
    } else {
      throw new Error(data.message || 'Failed to load projects');
    }
    
  } catch (err) {
    console.error('❌ Error loading projects:', err);
    error.value = err instanceof Error ? err.message : 'Unknown error';
  } finally {
    isLoading.value = false;
  }
};

const createProject = () => {
  window.location.href = '/admin/projects/new';
};

const editProject = (id: string) => {
  window.location.href = `/admin/projects/${id}`;
};

const previewProject = (id: string) => {
  // TODO: Implémenter la preview
  console.log('Preview project:', id);
};

const duplicateProject = async (id: string) => {
  try {
    // TODO: Implémenter la duplication
    console.log('Duplicate project:', id);
  } catch (err) {
    console.error('Error duplicating project:', err);
  }
};

const deleteProject = async (id: string) => {
  try {
    const response = await fetch(`/api/projects/${id}`, {
      method: 'DELETE',
      credentials: 'include'
    });
    
    if (!response.ok) {
      throw new Error('Failed to delete project');
    }
    
    // Recharger la liste
    await loadProjects();
    
  } catch (err) {
    console.error('Error deleting project:', err);
    alert('Error deleting project. Please try again.');
  }
};

// Watchers pour reset pagination
watch([searchQuery, filterStatus, filterCategory], () => {
  currentPage.value = 1;
});

// Initialisation
onMounted(() => {
  loadProjects();
});
</script>

<style scoped lang="scss">
.project-list {
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

.projects-grid {
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
</style>
