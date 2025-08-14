<template>
  <div class="seo-section">
    <div class="section-header">
      <h3>🔍 SEO & Métadonnées</h3>
      <button @click="togglePreview" class="preview-toggle" :class="{ active: showPreview }">
        {{ showPreview ? '📝 Masquer aperçu' : '📱 Aperçu SEO' }}
      </button>
    </div>

    <!-- Formulaires SEO -->
    <div class="seo-form">
      <div class="form-row">
        <div class="form-group">
          <label>Titre SEO (30-60 caractères)</label>
          <input
            v-model="localSeo.title"
            @input="updateSeo"
            type="text"
            class="seo-input"
            :class="{ warning: titleWarning, good: titleGood }"
            :placeholder="`${title} - Valentine Arnaly`"
            maxlength="100"
          />
          <div class="char-count" :class="{ warning: titleWarning, good: titleGood }">
            {{ (localSeo.title || '').length }}/60 caractères
          </div>
        </div>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label>Description SEO (120-160 caractères)</label>
          <textarea
            v-model="localSeo.description"
            @input="updateSeo"
            class="seo-textarea"
            :class="{ warning: descWarning, good: descGood }"
            :placeholder="getDescriptionPlaceholder()"
            maxlength="200"
            rows="3"
          ></textarea>
          <div class="char-count" :class="{ warning: descWarning, good: descGood }">
            {{ (localSeo.description || '').length }}/160 caractères
          </div>
        </div>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label>Mots-clés (séparés par des virgules)</label>
          <input
            v-model="keywordsString"
            @input="updateKeywords"
            type="text"
            class="seo-input"
            :placeholder="getKeywordsPlaceholder()"
          />
          <div class="keywords-preview">
            <span 
              v-for="keyword in localSeo.keywords" 
              :key="keyword" 
              class="keyword-tag"
            >
              {{ keyword }}
            </span>
          </div>
        </div>
      </div>

      <!-- Auto-génération -->
      <div class="auto-generate">
        <button @click="autoGenerateSeo" class="auto-btn" :disabled="!title">
          ✨ Auto-générer SEO
        </button>
        <span class="auto-hint">Génère automatiquement des métadonnées optimisées</span>
      </div>
    </div>

    <!-- Aperçu SEO -->
    <div v-if="showPreview" class="seo-preview-container">
      <SEOPreview
        :title="getSeoTitle()"
        :description="getSeoDescription()"
        :image="ogImage"
        :url="getSeoUrl()"
        :keywords="localSeo.keywords"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import SEOPreview from './SEOPreview.vue';
import type { SEOData } from '../../../shared/types';

interface Props {
  title: string;
  description?: string;
  seo: SEOData;
  type: 'project' | 'retouche';
  slug?: string;
  image?: string;
}

interface Emits {
  (e: 'update:seo', seo: SEOData): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

// État local
const showPreview = ref(false);
const localSeo = ref<SEOData>({ ...props.seo });
const keywordsString = ref((props.seo.keywords || []).join(', '));

// Computed
const titleWarning = computed(() => {
  const len = (localSeo.value.title || '').length;
  return len > 0 && (len < 30 || len > 60);
});

const titleGood = computed(() => {
  const len = (localSeo.value.title || '').length;
  return len >= 30 && len <= 60;
});

const descWarning = computed(() => {
  const len = (localSeo.value.description || '').length;
  return len > 0 && (len < 120 || len > 160);
});

const descGood = computed(() => {
  const len = (localSeo.value.description || '').length;
  return len >= 120 && len <= 160;
});

const ogImage = computed(() => {
  return localSeo.value.ogImage?.url || props.image || '/uploads/default-og.jpg';
});

// Methods
const updateSeo = () => {
  emit('update:seo', { ...localSeo.value });
};

const updateKeywords = () => {
  localSeo.value.keywords = keywordsString.value
    .split(',')
    .map(k => k.trim())
    .filter(k => k.length > 0)
    .slice(0, 10); // Limite à 10 mots-clés
  updateSeo();
};

const togglePreview = () => {
  showPreview.value = !showPreview.value;
};

const getSeoTitle = () => {
  if (localSeo.value.title) return localSeo.value.title;
  return `${props.title} - Valentine Arnaly`;
};

const getSeoDescription = () => {
  if (localSeo.value.description) return localSeo.value.description;
  return getDescriptionPlaceholder();
};

const getSeoUrl = () => {
  const baseUrl = 'https://valentine-arnaly.com';
  if (props.type === 'project') {
    return `${baseUrl}/projets/${props.slug || 'project'}`;
  } else {
    return `${baseUrl}/retouches/${props.slug || 'retouche'}`;
  }
};

const getDescriptionPlaceholder = () => {
  if (props.type === 'project') {
    return `Découvrez "${props.title}", un projet photographique de Valentine Arnaly. ${props.description || 'Portfolio professionnel de photographie.'} Voir plus de projets sur le portfolio.`;
  } else {
    return `Exemple de retouche photo professionnelle : "${props.title}". Découvrez le travail de retouche de Valentine Arnaly avec comparaison avant/après.`;
  }
};

const getKeywordsPlaceholder = () => {
  if (props.type === 'project') {
    return 'photographie, portrait, projet, valentine arnaly';
  } else {
    return 'retouche photo, avant après, correction, valentine arnaly';
  }
};

const autoGenerateSeo = () => {
  // Générer un titre SEO optimisé (30-60 caractères)
  let generatedTitle = props.title;
  if (generatedTitle.length > 45) {
    // Raccourcir le titre si trop long
    generatedTitle = generatedTitle.substring(0, 45) + '...';
  }
  generatedTitle += ' - Valentine Arnaly';
  
  // S'assurer que le titre reste dans la limite
  if (generatedTitle.length > 60) {
    const titleWithoutSuffix = props.title.substring(0, 35);
    generatedTitle = `${titleWithoutSuffix}... - V. Arnaly`;
  }

  // Générer une description SEO optimisée (120-160 caractères)
  let generatedDesc = '';
  if (props.type === 'project') {
    const baseDesc = `Découvrez "${props.title}", projet photo de Valentine Arnaly.`;
    const remaining = 160 - baseDesc.length - 20; // 20 pour la fin
    
    if (props.description && props.description.length <= remaining) {
      generatedDesc = `${baseDesc} ${props.description} Portfolio professionnel.`;
    } else {
      generatedDesc = `${baseDesc} ${props.description?.substring(0, remaining) || 'Photographie professionnelle'}... Voir portfolio.`;
    }
  } else {
    generatedDesc = `Retouche photo "${props.title}" - Exemple de correction professionnelle par Valentine Arnaly. Comparaison avant/après détaillée.`;
  }

  // S'assurer que la description respecte la limite
  if (generatedDesc.length > 160) {
    generatedDesc = generatedDesc.substring(0, 157) + '...';
  }

  // Générer des mots-clés pertinents
  const baseKeywords = ['valentine arnaly', 'photographie'];
  const typeKeywords = props.type === 'project' 
    ? ['projet photo', 'portfolio', 'photographe professionnel']
    : ['retouche photo', 'avant après', 'correction photo'];
    
  const titleKeywords = props.title
    .toLowerCase()
    .split(' ')
    .filter(word => word.length > 3)
    .slice(0, 2);

  const generatedKeywords = [...baseKeywords, ...typeKeywords, ...titleKeywords];

  // Mettre à jour
  localSeo.value = {
    ...localSeo.value,
    title: generatedTitle,
    description: generatedDesc,
    keywords: generatedKeywords
  };
  
  keywordsString.value = generatedKeywords.join(', ');
  updateSeo();
};

// Watch pour synchroniser les props
watch(() => props.seo, (newSeo) => {
  localSeo.value = { ...newSeo };
  keywordsString.value = (newSeo.keywords || []).join(', ');
}, { deep: true });
</script>

<style scoped lang="scss">
@import '../styles/variables.scss';

.seo-section {
  background: $color-white;
  border: 1px solid $color-gray-light;
  border-radius: 12px;
  overflow: hidden;
  margin: 2rem 0;
}

.section-header {
  background: lighten($color-gray-light, 3%);
  padding: 1.5rem 2rem;
  border-bottom: 1px solid $color-gray-light;
  display: flex;
  justify-content: space-between;
  align-items: center;
  
  h3 {
    margin: 0;
    color: $color-gray-dark;
    font-size: 1.3rem;
    font-weight: 600;
  }
  
  .preview-toggle {
    background: $color-white;
    border: 1px solid $color-gray-light;
    border-radius: 6px;
    padding: 0.5rem 1rem;
    font-size: 0.9rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.3s ease;
    
    &:hover, &.active {
      background: $color-gray-dark;
      color: $color-white;
      border-color: $color-gray-dark;
    }
  }
}

.seo-form {
  padding: 2rem;
  
  .form-row {
    margin-bottom: 1.5rem;
    
    &:last-child {
      margin-bottom: 0;
    }
  }
  
  .form-group {
    label {
      display: block;
      font-weight: 600;
      color: $color-gray-dark;
      margin-bottom: 0.5rem;
      font-size: 0.9rem;
    }
    
    .seo-input, .seo-textarea {
      width: 100%;
      border: 2px solid $color-gray-light;
      border-radius: 8px;
      padding: 0.75rem 1rem;
      font-size: 1rem;
      transition: border-color 0.3s ease;
      
      &:focus {
        outline: none;
        border-color: $color-gray-dark;
      }
      
      &.warning {
        border-color: #f59e0b;
        background: #fef3c7;
      }
      
      &.good {
        border-color: #10b981;
        background: #d1fae5;
      }
    }
    
    .seo-textarea {
      resize: vertical;
      min-height: 80px;
    }
    
    .char-count {
      font-size: 0.8rem;
      color: $color-gray-medium;
      margin-top: 0.25rem;
      text-align: right;
      
      &.warning {
        color: #d97706;
        font-weight: 600;
      }
      
      &.good {
        color: #059669;
        font-weight: 600;
      }
    }
    
    .keywords-preview {
      margin-top: 0.5rem;
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      
      .keyword-tag {
        background: lighten($color-gray-light, 3%);
        color: $color-gray-dark;
        padding: 0.25rem 0.5rem;
        border-radius: 12px;
        font-size: 0.8rem;
        font-weight: 500;
      }
    }
  }
}

.auto-generate {
  background: lighten($color-gray-light, 4%);
  border: 1px solid $color-gray-light;
  border-radius: 8px;
  padding: 1rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-top: 1.5rem;
  
  .auto-btn {
    background: $color-gray-dark;
    color: $color-white;
    border: none;
    border-radius: 6px;
    padding: 0.5rem 1rem;
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
  }
  
  .auto-hint {
    color: $color-gray-medium;
    font-size: 0.85rem;
    font-style: italic;
  }
}

.seo-preview-container {
  border-top: 1px solid $color-gray-light;
  padding: 0;
}

@media (max-width: 768px) {
  .section-header {
    flex-direction: column;
    gap: 1rem;
    text-align: center;
  }
  
  .seo-form {
    padding: 1.5rem;
  }
  
  .auto-generate {
    flex-direction: column;
    text-align: center;
  }
}
</style>
