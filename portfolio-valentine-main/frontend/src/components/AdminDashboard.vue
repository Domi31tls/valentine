<template>
  <div class="admin-dashboard">
    <div class="dashboard-header">
      <h1>Dashboard</h1>
      <p>Vue d'ensemble de votre portfolio</p>
    </div>
    
    <!-- Statistiques rapides -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon">🎨</div>
        <div class="stat-content">
          <h3>{{ stats.projects || 0 }}</h3>
          <p>Projets</p>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="stat-icon">✨</div>
        <div class="stat-content">
          <h3>{{ stats.retouches || 0 }}</h3>
          <p>Retouches</p>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="stat-icon">📸</div>
        <div class="stat-content">
          <h3>{{ stats.media || 0 }}</h3>
          <p>Médias</p>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="stat-icon">👥</div>
        <div class="stat-content">
          <h3>{{ stats.clients || 0 }}</h3>
          <p>Clients</p>
        </div>
      </div>
    </div>
    
    <!-- Actions rapides -->
    <div class="quick-actions">
      <h2>Actions rapides</h2>
      <div class="actions-grid">
        <a href="/admin/projects" class="action-card">
          <div class="action-icon">➕</div>
          <div class="action-content">
            <h3>Nouveau projet</h3>
            <p>Créer un nouveau projet</p>
          </div>
        </a>
        
        <a href="/admin/retouches" class="action-card">
          <div class="action-icon">✨</div>
          <div class="action-content">
            <h3>Nouvelle retouche</h3>
            <p>Ajouter une retouche</p>
          </div>
        </a>
        
        <a href="/admin/media" class="action-card">
          <div class="action-icon">📤</div>
          <div class="action-content">
            <h3>Upload média</h3>
            <p>Télécharger des images</p>
          </div>
        </a>
        
        <a href="/admin/about" class="action-card">
          <div class="action-icon">✏️</div>
          <div class="action-content">
            <h3>Éditer à propos</h3>
            <p>Modifier la page about</p>
          </div>
        </a>
      </div>
    </div>
    
    <!-- Activité récente -->
    <div class="recent-activity">
      <h2>Activité récente</h2>
      <div class="activity-list">
        <div v-if="isLoading" class="activity-loading">
          <div class="loading-spinner"></div>
          <p>Chargement des statistiques...</p>
        </div>
        
        <div v-else-if="error" class="activity-error">
          <p>{{ error }}</p>
        </div>
        
        <div v-else class="activity-placeholder">
          <p>Bienvenue dans votre espace d'administration !</p>
          <p>Commencez par créer votre premier projet ou retouche.</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useApi } from '../composables/useApi';

// État local
const stats = ref({
  projects: 0,
  retouches: 0,
  media: 0,
  clients: 0
});

const isLoading = ref(true);
const error = ref<string | null>(null);

// Composables
const { fetchData } = useApi();

// Charger les statistiques
const loadStats = async () => {
  try {
    isLoading.value = true;
    error.value = null;
    
    const response = await fetchData('/api/stats');
    
    if (response.success) {
      stats.value = response.data;
    } else {
      error.value = response.error || 'Erreur lors du chargement des statistiques';
    }
  } catch (err) {
    error.value = 'Impossible de charger les statistiques';
  } finally {
    isLoading.value = false;
  }
};

onMounted(() => {
  loadStats();
});
</script>

<style scoped lang="scss">
@import '../styles/variables.scss';

.admin-dashboard {
  max-width: 1200px;
  margin: 0 auto;
  
  .dashboard-header {
    margin-bottom: 2rem;
    
    h1 {
      color: $color-gray-dark;
      font-size: 2rem;
      font-weight: 700;
      margin: 0 0 0.5rem 0;
    }
    
    p {
      color: $color-gray-medium;
      font-size: 1rem;
      margin: 0;
    }
  }
  
  .stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1.5rem;
    margin-bottom: 3rem;
    
    .stat-card {
      background: $color-white;
      border-radius: 12px;
      padding: 1.5rem;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      display: flex;
      align-items: center;
      gap: 1rem;
      transition: transform 0.3s ease;
      
      &:hover {
        transform: translateY(-2px);
      }
      
      .stat-icon {
        font-size: 2.5rem;
        opacity: 0.8;
      }
      
      .stat-content {
        h3 {
          color: $color-gray-dark;
          font-size: 2rem;
          font-weight: 700;
          margin: 0 0 0.25rem 0;
        }
        
        p {
          color: $color-gray-medium;
          font-size: 0.9rem;
          margin: 0;
        }
      }
    }
  }
  
  .quick-actions {
    margin-bottom: 3rem;
    
    h2 {
      color: $color-gray-dark;
      font-size: 1.5rem;
      font-weight: 600;
      margin: 0 0 1.5rem 0;
    }
    
    .actions-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 1.5rem;
      
      .action-card {
        background: $color-white;
        border-radius: 12px;
        padding: 1.5rem;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        display: flex;
        align-items: center;
        gap: 1rem;
        text-decoration: none;
        transition: all 0.3s ease;
        
        &:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
        }
        
        .action-icon {
          font-size: 2rem;
          opacity: 0.8;
        }
        
        .action-content {
          h3 {
            color: $color-gray-dark;
            font-size: 1.1rem;
            font-weight: 600;
            margin: 0 0 0.25rem 0;
          }
          
          p {
            color: $color-gray-medium;
            font-size: 0.9rem;
            margin: 0;
          }
        }
      }
    }
  }
  
  .recent-activity {
    h2 {
      color: $color-gray-dark;
      font-size: 1.5rem;
      font-weight: 600;
      margin: 0 0 1.5rem 0;
    }
    
    .activity-list {
      background: $color-white;
      border-radius: 12px;
      padding: 2rem;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      min-height: 200px;
      display: flex;
      align-items: center;
      justify-content: center;
      
      .activity-loading {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 1rem;
        color: $color-gray-medium;
        
        .loading-spinner {
          width: 32px;
          height: 32px;
          border: 3px solid $color-gray-light;
          border-top: 3px solid $color-gray-dark;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        
        p {
          margin: 0;
          font-size: 0.9rem;
        }
      }
      
      .activity-error {
        color: #dc2626;
        text-align: center;
        
        p {
          margin: 0;
          font-size: 0.9rem;
        }
      }
      
      .activity-placeholder {
        text-align: center;
        color: $color-gray-medium;
        
        p {
          margin: 0 0 0.5rem 0;
          font-size: 0.9rem;
          
          &:last-child {
            margin-bottom: 0;
          }
        }
      }
    }
  }
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@media (max-width: 768px) {
  .admin-dashboard {
    .stats-grid {
      grid-template-columns: 1fr;
    }
    
    .actions-grid {
      grid-template-columns: 1fr;
    }
    
    .dashboard-header {
      margin-bottom: 1.5rem;
      
      h1 {
        font-size: 1.75rem;
      }
    }
  }
}
</style>
