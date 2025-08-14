<template>
  <div class="user-form-overlay" @click.self="$emit('close')">
    <div class="user-form-modal">
      <div class="modal-header">
        <h3>Ajouter un utilisateur</h3>
        <button @click="$emit('close')" class="close-btn" type="button">
          <i class="icon-close"></i>
        </button>
      </div>

      <form @submit.prevent="createUser" class="user-form">
        <div class="form-group">
          <label for="email">Email *</label>
          <input
            id="email"
            v-model="formData.email"
            type="email"
            placeholder="utilisateur@exemple.com"
            required
            :disabled="loading"
            class="form-input"
            :class="{ 'error': errors.email }"
          >
          <span v-if="errors.email" class="error-text">{{ errors.email }}</span>
        </div>

        <div class="form-group">
          <label for="role">Rôle</label>
          <select
            id="role"
            v-model="formData.role"
            :disabled="loading"
            class="form-select"
          >
            <option value="editor">Éditeur</option>
            <option value="admin">Administrateur</option>
          </select>
          <p class="form-help">
            <strong>Éditeur :</strong> Peut modifier les projets et retouches<br>
            <strong>Administrateur :</strong> Accès complet à toutes les fonctionnalités
          </p>
        </div>

        <div v-if="error" class="error-message">
          {{ error }}
        </div>

        <div class="form-actions">
          <button 
            type="button" 
            @click="$emit('close')"
            class="btn btn-secondary"
            :disabled="loading"
          >
            Annuler
          </button>
          <button 
            type="submit" 
            class="button-primary"
            :disabled="loading || !isFormValid"
          >
            <span v-if="loading">Création...</span>
            <span v-else>Créer l'utilisateur</span>
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, reactive } from 'vue';

const API_BASE = import.meta.env.PUBLIC_API_URL || '';

// Émissions
const emit = defineEmits(['close', 'user-created']);

// État du formulaire
const formData = reactive({
  email: '',
  role: 'editor'
});

const loading = ref(false);
const error = ref('');
const errors = reactive({
  email: ''
});

// Validation
const isFormValid = computed(() => {
  return formData.email && 
         isValidEmail(formData.email) &&
         !Object.values(errors).some(error => error);
});

/**
 * Valider une adresse email
 */
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Valider le formulaire
 */
const validateForm = () => {
  errors.email = '';
  
  if (!formData.email) {
    errors.email = 'L\'email est requis';
    return false;
  }
  
  if (!isValidEmail(formData.email)) {
    errors.email = 'Format d\'email invalide';
    return false;
  }
  
  return true;
};

/**
 * Créer un nouvel utilisateur
 */
const createUser = async () => {
  if (!validateForm()) return;
  
  loading.value = true;
  error.value = '';
  
  try {
    const response = await fetch(`${API_BASE}/api/users`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: formData.email.trim(),
        role: formData.role
      })
    });

    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Erreur lors de la création de l\'utilisateur');
    }

    // Émettre l'événement avec les données de l'utilisateur créé
    const newUser = {
      id: result.data.id,
      email: formData.email.trim(),
      name: formData.email.split('@')[0], // Nom par défaut
      role: formData.role,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      last_login_at: null
    };
    
    emit('user-created', newUser);
    console.log('✅ Utilisateur créé:', newUser.email);
    
  } catch (err) {
    console.error('❌ Erreur création utilisateur:', err);
    error.value = err.message || 'Erreur lors de la création';
  } finally {
    loading.value = false;
  }
};

/**
 * Gérer la fermeture avec Escape
 */
const handleKeydown = (event) => {
  if (event.key === 'Escape') {
    emit('close');
  }
};

// Écouter les touches du clavier
document.addEventListener('keydown', handleKeydown);

// Nettoyer l'écouteur lors de la destruction
const cleanup = () => {
  document.removeEventListener('keydown', handleKeydown);
};

// Auto-focus sur le champ email
const focusEmail = () => {
  setTimeout(() => {
    const emailInput = document.getElementById('email');
    if (emailInput) {
      emailInput.focus();
    }
  }, 100);
};

// Focus automatique
focusEmail();

// Cleanup
defineExpose({ cleanup });
</script>

<style scoped>
.user-form-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

.user-form-modal {
  background: var(--color-background);
  border-radius: 8px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem 1.5rem 0;
  border-bottom: 1px solid var(--color-border);
  margin-bottom: 1.5rem;
}

.modal-header h3 {
  margin: 0;
  color: var(--color-text);
  font-size: 1.25rem;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: var(--color-text-secondary);
  padding: 0.25rem;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.close-btn:hover {
  background: var(--color-border);
  color: var(--color-text);
}

.user-form {
  padding: 0 1.5rem 1.5rem;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: var(--color-text);
  font-size: 0.9rem;
}

.form-input,
.form-select {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid var(--color-border);
  border-radius: 4px;
  background: var(--color-background);
  color: var(--color-text);
  font-size: 0.9rem;
  transition: border-color 0.2s ease;
}

.form-input:focus,
.form-select:focus {
  outline: none;
  border-color: var(--color-accent);
  box-shadow: 0 0 0 3px var(--color-accent-light);
}

.form-input.error {
  border-color: #ef4444;
}

.form-input:disabled,
.form-select:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.form-help {
  margin-top: 0.5rem;
  font-size: 0.8rem;
  color: var(--color-text-secondary);
  line-height: 1.4;
}

.error-text {
  display: block;
  margin-top: 0.25rem;
  font-size: 0.8rem;
  color: #ef4444;
}

.error-message {
  padding: 0.75rem;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 4px;
  color: #dc2626;
  font-size: 0.9rem;
  margin-bottom: 1rem;
}

.form-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 2rem;
  padding-top: 1rem;
  border-top: 1px solid var(--color-border);
}

.btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 4px;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  min-width: 120px;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-secondary {
  background: var(--color-border);
  color: var(--color-text);
}

.btn-secondary:hover:not(:disabled) {
  background: var(--color-text-secondary);
  color: var(--color-background);
}

.btn-primary {
  background: var(--color-accent);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: var(--color-accent-hover);
}

/* Icône de fermeture */
.icon-close::before {
  content: '×';
}

/* Responsive */
@media (max-width: 768px) {
  .user-form-overlay {
    padding: 0.5rem;
  }
  
  .modal-header {
    padding: 1rem 1rem 0;
    margin-bottom: 1rem;
  }
  
  .user-form {
    padding: 0 1rem 1rem;
  }
  
  .form-actions {
    flex-direction: column;
  }
  
  .btn {
    width: 100%;
  }
}
</style>
