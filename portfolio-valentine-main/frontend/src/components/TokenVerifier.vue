<template>
  <div class="token-verifier">
    <!-- État de chargement -->
    <div v-if="state === 'loading'" class="loading-state">
      <div class="spinner-large"></div>
      <h3>Vérification en cours...</h3>
      <p>Nous validons votre lien magique</p>
    </div>

    <!-- Succès -->
    <div v-else-if="state === 'success'" class="success-state">
      <div class="success-icon">✅</div>
      <h3>Connexion réussie !</h3>
      <p>Vous allez être redirigé vers l'administration...</p>
      <div class="redirect-info">
        <div class="progress-bar">
          <div class="progress-fill" :style="{ width: progressWidth + '%' }"></div>
        </div>
        <small>Redirection dans {{ countdown }}s</small>
      </div>
    </div>

    <!-- Erreur -->
    <div v-else-if="state === 'error'" class="error-state">
      <div class="error-icon">❌</div>
      <h3>{{ errorTitle }}</h3>
      <p>{{ errorMessage }}</p>
      
      <div class="error-actions">
        <a href="/admin/login" class="retry-button">
          Demander un nouveau lien
        </a>
        <a href="/" class="home-button">
          Retour au portfolio
        </a>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useAuth } from '../composables/useAuth';

type VerifyState = 'loading' | 'success' | 'error';

const state = ref<VerifyState>('loading');
const errorTitle = ref('');
const errorMessage = ref('');
const countdown = ref(3);
const progressWidth = ref(0);

// Utiliser le composable d'authentification
const { checkAuth, updateAuthState } = useAuth();

onMounted(async () => {
  // Récupérer le token depuis l'URL
  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get('token');
  
  if (!token) {
    showError(
      'Lien invalide',
      'Le lien que vous avez utilisé ne contient pas de token valide.'
    );
    return;
  }
  
  try {
    const response = await fetch(`/api/auth/verify?token=${token}`, {
      method: 'GET',
      credentials: 'include'
    });
    
    const data = await response.json();
    
    if (response.ok) {
      state.value = 'success';
      
      // IMPORTANT: Vérifier et sauvegarder l'état d'authentification
      await checkAuth();
      
      startRedirectCountdown();
    } else {
      // Gestion des différents types d'erreurs
      switch (response.status) {
        case 404:
          showError(
            'Token invalide',
            'Ce lien de connexion n\'existe pas ou a déjà été utilisé.'
          );
          break;
        case 410:
          showError(
            'Lien expiré',
            'Ce lien de connexion a expiré. Les liens magiques sont valides pendant 15 minutes.'
          );
          break;
        default:
          showError(
            'Erreur de vérification',
            data.message || 'Une erreur est survenue lors de la vérification.'
          );
      }
    }
  } catch (error) {
    showError(
      'Erreur de connexion',
      'Impossible de se connecter au serveur. Veuillez réessayer.'
    );
  }
});

const showError = (title: string, message: string) => {
  state.value = 'error';
  errorTitle.value = title;
  errorMessage.value = message;
};

const startRedirectCountdown = () => {
  const interval = setInterval(() => {
    countdown.value--;
    progressWidth.value = ((3 - countdown.value) / 3) * 100;
    
    if (countdown.value <= 0) {
      clearInterval(interval);
      window.location.href = '/admin';
    }
  }, 1000);
};
</script>

<style scoped lang="scss">
@import '../styles/variables.scss';

.token-verifier {
  width: 100%;
  text-align: center;
}

.loading-state, .success-state, .error-state {
  padding: 1rem 0;
  
  h3 {
    color: $color-gray-dark;
    margin: 1rem 0;
    font-size: 1.5rem;
  }
  
  p {
    color: $color-gray-medium;
    margin: 0 0 1rem 0;
    line-height: 1.5;
  }
}

.spinner-large {
  width: 48px;
  height: 48px;
  margin: 0 auto 1rem;
  border: 4px solid $color-gray-light;
  border-top: 4px solid $color-gray-dark;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.success-icon, .error-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
}

.redirect-info {
  margin-top: 2rem;
  
  .progress-bar {
    width: 100%;
    height: 4px;
    background: $color-gray-light;
    border-radius: 2px;
    overflow: hidden;
    margin-bottom: 0.5rem;
    
    .progress-fill {
      height: 100%;
      background: $color-gray-dark;
      transition: width 1s linear;
    }
  }
  
  small {
    color: $color-gray-medium;
    font-size: 0.8rem;
  }
}

.error-actions {
  margin-top: 2rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  
  .retry-button {
    background: $color-gray-dark;
    color: $color-white;
    padding: 0.875rem 1.5rem;
    border-radius: 8px;
    text-decoration: none;
    font-weight: 600;
    transition: all 0.3s ease;
    
    &:hover {
      background: lighten($color-gray-dark, 10%);
      transform: translateY(-2px);
    }
  }
  
  .home-button {
    color: $color-gray-medium;
    text-decoration: none;
    padding: 0.75rem 1.5rem;
    border: 2px solid $color-gray-light;
    border-radius: 8px;
    transition: all 0.3s ease;
    
    &:hover {
      color: $color-gray-dark;
      border-color: $color-gray-dark;
    }
  }
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@media (max-width: 768px) {
  .error-actions {
    .retry-button, .home-button {
      padding: 1rem;
      font-size: 0.9rem;
    }
  }
}
</style>
