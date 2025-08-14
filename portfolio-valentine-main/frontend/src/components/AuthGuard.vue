<template>
  <div class="auth-guard">
    <!-- État de chargement -->
    <div v-if="isLoading" class="loading-state">
      <div class="spinner"></div>
      <p>Vérification de l'authentification...</p>
    </div>
    
    <!-- Erreur d'authentification -->
    <div v-else-if="error && showError" class="error-state">
      <div class="error-icon">⚠️</div>
      <h3>Erreur d'authentification</h3>
      <p>{{ error }}</p>
      <button @click="retry" class="retry-button">Réessayer</button>
    </div>
    
    <!-- Contenu protégé (si authentifié) -->
    <div v-else-if="isAuthenticated" class="protected-content">
      <slot />
    </div>
    
    <!-- Redirection en cours -->
    <div v-else class="redirect-state">
      <div class="redirect-icon">🔒</div>
      <h3>Accès restreint</h3>
      <p>Vous devez être connecté pour accéder à cette page.</p>
      <p><small>Redirection vers la page de connexion...</small></p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useAuth } from '../composables/useAuth';

// Props
interface Props {
  redirectTo?: string;
  showError?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  redirectTo: '/admin/login',
  showError: false
});

// Composable auth
const { forceSync, authState } = useAuth();

// État local
const isLoading = ref(true);
const error = ref<string | null>(null);

// Computed
const isAuthenticated = computed(() => authState.isAuthenticated);

// Fonction de retry
const retry = async () => {
  error.value = null;
  isLoading.value = true;
  await checkAuthentication();
};

// Vérification de l'authentification
const checkAuthentication = async () => {
  try {
    console.log('🛡️ AuthGuard: Checking authentication...');
    
    // Force la synchronisation avec le serveur
    const isAuth = await forceSync();
    
    console.log('🛡️ AuthGuard: Auth result:', isAuth);
    
    if (!isAuth) {
      if (props.showError) {
        error.value = 'Vous devez être connecté pour accéder à cette page.';
      } else {
        console.log('🛡️ AuthGuard: Redirecting to login...');
        // Redirection immédiate
        setTimeout(() => {
          window.location.href = props.redirectTo;
        }, 1500);
      }
    } else {
      console.log('🛡️ AuthGuard: Access granted!');
    }
  } catch (err) {
    console.error('🛡️ AuthGuard: Error:', err);
    error.value = err instanceof Error ? err.message : 'Erreur d\'authentification';
  } finally {
    isLoading.value = false;
  }
};

// Montage du composant
onMounted(async () => {
  await checkAuthentication();
});
</script>

<style scoped lang="scss">
@import '../styles/variables.scss';

.auth-guard {
  width: 100%;
  min-height: 200px;
}

.loading-state, .error-state, .redirect-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 2rem;
  text-align: center;
  
  .spinner {
    width: 32px;
    height: 32px;
    margin-bottom: 1rem;
    border: 3px solid $color-gray-light;
    border-top: 3px solid $color-gray-dark;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }
  
  .error-icon, .redirect-icon {
    font-size: 3rem;
    margin-bottom: 1rem;
  }
  
  h3 {
    color: $color-gray-dark;
    margin: 0 0 1rem 0;
    font-size: 1.5rem;
  }
  
  p {
    color: $color-gray-medium;
    margin: 0 0 1rem 0;
    line-height: 1.5;
    
    small {
      font-size: 0.8rem;
      opacity: 0.8;
    }
  }
  
  .retry-button {
    background: $color-gray-dark;
    color: $color-white;
    padding: 0.75rem 1.5rem;
    border: none;
    border-radius: 8px;
    font-size: 0.9rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    
    &:hover {
      background: lighten($color-gray-dark, 10%);
      transform: translateY(-2px);
    }
  }
}

.protected-content {
  width: 100%;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@media (max-width: 768px) {
  .loading-state, .error-state, .redirect-state {
    padding: 2rem 1rem;
    
    h3 {
      font-size: 1.25rem;
    }
  }
}
</style>
