<template>
  <div class="login-form">
    <!-- État initial : Saisie email -->
    <form v-if="state === 'idle'" @submit.prevent="handleLogin" class="email-form">
      <div class="input-group">
        <label for="email">Adresse email</label>
        <input 
          id="email"
          v-model="email"
          type="email"
          required
          placeholder="votre@email.com"
          :disabled="isLoading"
          class="email-input"
        />
      </div>
      
      <button type="submit" :disabled="isLoading || !email" class="login-button">
        <span v-if="isLoading" class="spinner"></span>
        {{ isLoading ? 'Envoi en cours...' : 'Envoyer le lien magique' }}
      </button>
    </form>

    <!-- État : Email envoyé -->
    <div v-else-if="state === 'sent'" class="success-message">
      <div class="success-icon">✉️</div>
      <h3>Email envoyé !</h3>
      <p>
        Nous avons envoyé un lien magique à<br>
        <strong>{{ email }}</strong>
      </p>
      <p class="instruction">
        Cliquez sur le lien dans votre email pour vous connecter.
        <br>
        <small>Le lien expire dans 15 minutes.</small>
      </p>
      
      <button @click="resetForm" class="reset-button">
        Utiliser un autre email
      </button>
    </div>

    <!-- État : Erreur -->
    <div v-else-if="state === 'error'" class="error-message">
      <div class="error-icon">🚫</div>
      <h3>Accès refusé</h3>
      <p>{{ errorMessage }}</p>
      
      <!-- Instructions spécifiques pour l'accès non autorisé -->
      <div v-if="isUnauthorizedError" class="contact-info">
        <p><strong>Comment obtenir l'accès ?</strong></p>
        <p>Contactez Valentine pour qu'elle vous ajoute à la liste des utilisateurs autorisés.</p>
      </div>
      
      <button @click="resetForm" class="reset-button">
        Réessayer avec un autre email
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';

// États du formulaire
type FormState = 'idle' | 'sent' | 'error';

const state = ref<FormState>('idle');
const email = ref('');
const isLoading = ref(false);
const errorMessage = ref('');

// Détecter si c'est une erreur d'autorisation
const isUnauthorizedError = computed(() => {
  return errorMessage.value.includes('pas autorisé') || 
         errorMessage.value.includes('Contactez l\'administrateur');
});

// Vérifier si l'utilisateur est déjà connecté
// Note: Cette vérification est désactivée pour éviter les boucles de redirection
// L'AuthGuard s'occupe déjà de la protection des routes
/*
onMounted(async () => {
  try {
    const response = await fetch('/api/auth/me', {
      credentials: 'include'
    });
    
    if (response.ok) {
      // Déjà connecté, rediriger vers l'admin
      window.location.href = '/admin';
    }
  } catch (error) {
    // Pas connecté, continuer normalement
  }
});
*/

const handleLogin = async () => {
  if (!email.value) return;
  
  isLoading.value = true;
  state.value = 'idle';
  
  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: email.value
      })
    });
    
    const data = await response.json();
    
    if (response.ok) {
      state.value = 'sent';
    } else {
      state.value = 'error';
      errorMessage.value = data.message || 'Une erreur est survenue';
    }
  } catch (error) {
    state.value = 'error';
    errorMessage.value = 'Impossible de se connecter au serveur';
  } finally {
    isLoading.value = false;
  }
};

const resetForm = () => {
  state.value = 'idle';
  email.value = '';
  errorMessage.value = '';
  isLoading.value = false;
};
</script>

<style scoped lang="scss">
@import '../styles/variables.scss';

.login-form {
  width: 100%;
}

.email-form {
  .input-group {
    margin-bottom: 1.5rem;
    text-align: left;
    
    label {
      display: block;
      margin-bottom: 0.5rem;
      font-weight: 600;
      color: $color-gray-dark;
      font-size: 0.9rem;
    }
    
    .email-input {
      width: 100%;
      padding: 0.875rem 1rem;
      border: 2px solid $color-gray-light;
      border-radius: 8px;
      font-size: 1rem;
      transition: all 0.3s ease;
      background: $color-white;
      
      &:focus {
        outline: none;
        border-color: $color-gray-dark;
        box-shadow: 0 0 0 3px rgba(0, 0, 0, 0.1);
      }
      
      &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }
      
      &::placeholder {
        color: $color-gray-medium;
      }
    }
  }
  
  .login-button {
    width: 100%;
    padding: 1rem 2rem;
    background: $color-gray-dark;
    color: $color-white;
    border: none;
    border-radius: 8px;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    position: relative;
    
    &:hover:not(:disabled) {
      background: lighten($color-gray-dark, 10%);
      transform: translateY(-2px);
    }
    
    &:disabled {
      opacity: 0.6;
      cursor: not-allowed;
      transform: none;
    }
    
    .spinner {
      display: inline-block;
      width: 16px;
      height: 16px;
      margin-right: 0.5rem;
      border: 2px solid transparent;
      border-top: 2px solid currentColor;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }
  }
}

.success-message, .error-message {
  text-align: center;
  padding: 1rem 0;
  
  .success-icon, .error-icon {
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
    
    strong {
      color: $color-gray-dark;
    }
    
    small {
      font-size: 0.8rem;
      opacity: 0.8;
    }
  }
  
  .instruction {
    background: lighten($color-gray-light, 5%);
    padding: 1rem;
    border-radius: 8px;
    margin: 1.5rem 0;
    font-size: 0.9rem;
  }
  
  .contact-info {
    background: #fef3c7;
    border: 1px solid #f59e0b;
    padding: 1rem;
    border-radius: 8px;
    margin: 1.5rem 0;
    font-size: 0.9rem;
    
    p {
      margin: 0 0 0.5rem 0;
      color: #92400e;
      
      &:last-child {
        margin-bottom: 0;
      }
      
      strong {
        color: #78350f;
      }
    }
  }
  
  .reset-button {
    background: transparent;
    color: $color-gray-medium;
    border: 2px solid $color-gray-light;
    padding: 0.75rem 1.5rem;
    border-radius: 8px;
    font-size: 0.9rem;
    cursor: pointer;
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
</style>
