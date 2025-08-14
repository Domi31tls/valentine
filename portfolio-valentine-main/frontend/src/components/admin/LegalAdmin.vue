<template>
  <div class="legal-admin">
    <div class="admin-header">
      <h1>Mentions légales & Colophon</h1>
      <p class="admin-description">
        Gérez le contenu des pages légales et informations du site
      </p>
    </div>

    <!-- Loading state -->
    <div v-if="isLoading" class="loading-state">
      <div class="loading-spinner"></div>
      <p>Chargement des pages légales...</p>
    </div>

    <!-- Error state -->
    <div v-else-if="error" class="error-state">
      <div class="error-icon">⚠️</div>
      <h3>Erreur de chargement</h3>
      <p>{{ error }}</p>
      <button @click="loadPages" class="retry-button">Réessayer</button>
    </div>

    <!-- Interface principale -->
    <div v-else class="legal-sections">
      <!-- Mentions légales -->
      <section class="legal-section">
        <div class="section-header">
          <h2>📋 Mentions légales</h2>
          <div class="section-actions">
            <button 
              @click="saveSection('mentions-legales')"
              :disabled="!hasChanges.mentionsLegales || isSaving.mentionsLegales"
              class="save-button"
              :class="{ saving: isSaving.mentionsLegales }"
            >
              {{ isSaving.mentionsLegales ? 'Sauvegarde...' : 'Sauvegarder' }}
            </button>
          </div>
        </div>

        <div class="section-content">
          <div class="form-group">
            <label for="mentions-title">Titre de la page</label>
            <input
              id="mentions-title"
              v-model="pages.mentionsLegales.title"
              @input="markAsChanged('mentionsLegales')"
              type="text"
              class="form-input"
              placeholder="Mentions Légales"
            />
          </div>

          <div class="form-group">
            <label for="mentions-content">Contenu (Markdown supporté)</label>
            <textarea
              id="mentions-content"
              v-model="pages.mentionsLegales.content"
              @input="markAsChanged('mentionsLegales')"
              class="form-textarea"
              rows="12"
              placeholder="Saisissez le contenu des mentions légales..."
            ></textarea>
          </div>

          <div class="form-group checkbox-group">
            <label class="checkbox-label">
              <input
                v-model="pages.mentionsLegales.is_published"
                @change="markAsChanged('mentionsLegales')"
                type="checkbox"
                class="form-checkbox"
              />
              <span class="checkbox-text">Page publiée</span>
            </label>
          </div>
        </div>
      </section>

      <!-- Colophon -->
      <section class="legal-section">
        <div class="section-header">
          <h2>🎨 Colophon</h2>
          <div class="section-actions">
            <button 
              @click="saveSection('colophon')"
              :disabled="!hasChanges.colophon || isSaving.colophon"
              class="save-button"
              :class="{ saving: isSaving.colophon }"
            >
              {{ isSaving.colophon ? 'Sauvegarde...' : 'Sauvegarder' }}
            </button>
          </div>
        </div>

        <div class="section-content">
          <div class="form-group">
            <label for="colophon-title">Titre de la page</label>
            <input
              id="colophon-title"
              v-model="pages.colophon.title"
              @input="markAsChanged('colophon')"
              type="text"
              class="form-input"
              placeholder="Colophon"
            />
          </div>

          <div class="form-group">
            <label for="colophon-content">Contenu (Markdown supporté)</label>
            <textarea
              id="colophon-content"
              v-model="pages.colophon.content"
              @input="markAsChanged('colophon')"
              class="form-textarea"
              rows="12"
              placeholder="Saisissez le contenu du colophon..."
            ></textarea>
          </div>

          <div class="form-group checkbox-group">
            <label class="checkbox-label">
              <input
                v-model="pages.colophon.is_published"
                @change="markAsChanged('colophon')"
                type="checkbox"
                class="form-checkbox"
              />
              <span class="checkbox-text">Page publiée</span>
            </label>
          </div>
        </div>
      </section>
    </div>

    <!-- Actions globales -->
    <div v-if="!isLoading && !error" class="global-actions">
      <div class="action-group">
        <a href="/mentions-legales" target="_blank" class="preview-link">
          👁️ Prévisualiser mentions légales
        </a>
        <a href="/colophon" target="_blank" class="preview-link">
          👁️ Prévisualiser colophon
        </a>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import type { LegalPage } from '../../../../shared/types';

// État réactif
const isLoading = ref(true);
const error = ref<string | null>(null);

const isSaving = reactive({
  mentionsLegales: false,
  colophon: false
});

const hasChanges = reactive({
  mentionsLegales: false,
  colophon: false
});

const pages = reactive({
  mentionsLegales: {
    title: '',
    content: '',
    is_published: true
  },
  colophon: {
    title: '',
    content: '',
    is_published: true
  }
});

// Méthodes
const loadPages = async () => {
  try {
    isLoading.value = true;
    error.value = null;

    // Charger les deux pages en parallèle
    const [mentionsResponse, colophonResponse] = await Promise.all([
      fetch('/api/legal/mentions-legales', { credentials: 'include' }),
      fetch('/api/legal/colophon', { credentials: 'include' })
    ]);

    // Mentions légales
    if (mentionsResponse.ok) {
      const mentionsData = await mentionsResponse.json();
      if (mentionsData.success && mentionsData.data) {
        pages.mentionsLegales = {
          title: mentionsData.data.title,
          content: mentionsData.data.content,
          is_published: mentionsData.data.is_published
        };
      }
    }

    // Colophon
    if (colophonResponse.ok) {
      const colophonData = await colophonResponse.json();
      if (colophonData.success && colophonData.data) {
        pages.colophon = {
          title: colophonData.data.title,
          content: colophonData.data.content,
          is_published: colophonData.data.is_published
        };
      }
    }

  } catch (err) {
    console.error('Error loading legal pages:', err);
    error.value = err instanceof Error ? err.message : 'Erreur de chargement';
  } finally {
    isLoading.value = false;
  }
};

const markAsChanged = (section: 'mentionsLegales' | 'colophon') => {
  hasChanges[section] = true;
};

const saveSection = async (section: 'mentionsLegales' | 'colophon') => {
  try {
    const sectionKey = section === 'mentionsLegales' ? 'mentionsLegales' : 'colophon';
    const apiType = section === 'mentionsLegales' ? 'mentions-legales' : 'colophon';
    
    isSaving[sectionKey] = true;

    const response = await fetch(`/api/legal/${apiType}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify(pages[sectionKey])
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    if (data.success) {
      hasChanges[sectionKey] = false;
      console.log(`✅ ${section} saved successfully`);
    } else {
      throw new Error(data.message || 'Failed to save');
    }

  } catch (err) {
    console.error(`Error saving ${section}:`, err);
    alert(`Erreur lors de la sauvegarde : ${err instanceof Error ? err.message : 'Erreur inconnue'}`);
  } finally {
    isSaving[sectionKey] = false;
  }
};

// Lifecycle
onMounted(() => {
  loadPages();
});
</script>

<style scoped lang="scss">
@import '../../styles/variables.scss';

.legal-admin {
  .admin-header {
    margin-bottom: 3rem;
    text-align: center;
    
    h1 {
      font-size: 2.5rem;
      font-weight: 700;
      color: $color-gray-dark;
      margin: 0 0 0.5rem 0;
    }
    
    .admin-description {
      color: $color-gray-medium;
      font-size: 1.1rem;
      margin: 0;
    }
  }
}

.loading-state, .error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  text-align: center;
  
  .loading-spinner {
    width: 40px;
    height: 40px;
    margin-bottom: 1rem;
    border: 3px solid $color-gray-light;
    border-top: 3px solid $color-gray-dark;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }
  
  .error-icon {
    font-size: 3rem;
    margin-bottom: 1rem;
  }
  
  h3 {
    color: $color-gray-dark;
    margin: 0 0 0.5rem 0;
    font-size: 1.25rem;
  }
  
  p {
    color: $color-gray-medium;
    margin: 0 0 1.5rem 0;
  }
  
  .retry-button {
    background: $color-gray-dark;
    color: $color-white;
    border: none;
    border-radius: 8px;
    padding: 0.75rem 1.5rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    
    &:hover {
      background: lighten($color-gray-dark, 10%);
    }
  }
}

.legal-sections {
  display: grid;
  gap: 3rem;
  margin-bottom: 3rem;
}

.legal-section {
  background: $color-white;
  border: 1px solid $color-gray-light;
  border-radius: 12px;
  overflow: hidden;
  
  .section-header {
    background: lighten($color-gray-light, 3%);
    padding: 1.5rem 2rem;
    border-bottom: 1px solid $color-gray-light;
    display: flex;
    justify-content: space-between;
    align-items: center;
    
    h2 {
      font-size: 1.5rem;
      font-weight: 600;
      color: $color-gray-dark;
      margin: 0;
    }
    
    .save-button {
      background: $color-gray-dark;
      color: $color-white;
      border: none;
      border-radius: 6px;
      padding: 0.75rem 1.5rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
      
      &:hover:not(:disabled) {
        background: lighten($color-gray-dark, 10%);
      }
      
      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
      
      &.saving {
        background: #f59e0b;
      }
    }
  }
  
  .section-content {
    padding: 2rem;
  }
}

.form-group {
  margin-bottom: 1.5rem;
  
  label {
    display: block;
    font-weight: 600;
    color: $color-gray-dark;
    margin-bottom: 0.5rem;
  }
  
  .form-input, .form-textarea {
    width: 100%;
    border: 1px solid $color-gray-light;
    border-radius: 8px;
    padding: 0.75rem 1rem;
    font-size: 1rem;
    transition: border-color 0.3s ease;
    
    &:focus {
      outline: none;
      border-color: $color-gray-dark;
    }
  }
  
  .form-textarea {
    resize: vertical;
    min-height: 200px;
    font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
    font-size: 0.9rem;
    line-height: 1.6;
  }
  
  &.checkbox-group {
    .checkbox-label {
      display: flex;
      align-items: center;
      cursor: pointer;
      
      .form-checkbox {
        margin-right: 0.5rem;
        width: auto;
      }
      
      .checkbox-text {
        color: $color-gray-dark;
        font-weight: 500;
      }
    }
  }
}

.global-actions {
  background: lighten($color-gray-light, 4%);
  border: 1px solid $color-gray-light;
  border-radius: 12px;
  padding: 2rem;
  text-align: center;
  
  .action-group {
    display: flex;
    gap: 1rem;
    justify-content: center;
    
    .preview-link {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      background: $color-white;
      color: $color-gray-dark;
      text-decoration: none;
      border: 1px solid $color-gray-light;
      border-radius: 8px;
      padding: 0.75rem 1.5rem;
      font-weight: 500;
      transition: all 0.3s ease;
      
      &:hover {
        background: $color-gray-dark;
        color: $color-white;
        border-color: $color-gray-dark;
      }
    }
  }
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@media (max-width: 768px) {
  .legal-section {
    .section-header {
      flex-direction: column;
      gap: 1rem;
      text-align: center;
    }
    
    .section-content {
      padding: 1.5rem;
    }
  }
  
  .global-actions {
    .action-group {
      flex-direction: column;
      
      .preview-link {
        justify-content: center;
      }
    }
  }
}
</style>
