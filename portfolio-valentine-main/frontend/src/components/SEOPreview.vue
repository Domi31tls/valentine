<template>
  <div class="seo-preview">
    <div class="preview-header">
      <h3>📱 Aperçu partage réseaux sociaux</h3>
      <p class="preview-subtitle">Voici comment votre contenu apparaîtra sur Google, Facebook, Twitter, etc.</p>
    </div>

    <div class="preview-grid">
      <!-- Google Search Preview -->
      <div class="preview-card google-preview">
        <div class="preview-label">🔍 Google Search</div>
        <div class="google-result">
          <div class="google-url">{{ cleanUrl }}</div>
          <div class="google-title">{{ title }}</div>
          <div class="google-snippet">{{ description }}</div>
        </div>
      </div>

      <!-- Facebook Preview -->
      <div class="preview-card facebook-preview">
        <div class="preview-label">📘 Facebook</div>
        <div class="facebook-card">
          <div v-if="image" class="facebook-image">
            <img :src="image" :alt="title" />
          </div>
          <div class="facebook-content">
            <div class="facebook-domain">{{ domain }}</div>
            <div class="facebook-title">{{ title }}</div>
            <div class="facebook-description">{{ truncateText(description, 80) }}</div>
          </div>
        </div>
      </div>

      <!-- Twitter Preview -->
      <div class="preview-card twitter-preview">
        <div class="preview-label">🐦 Twitter</div>
        <div class="twitter-card">
          <div v-if="image" class="twitter-image">
            <img :src="image" :alt="title" />
          </div>
          <div class="twitter-content">
            <div class="twitter-title">{{ title }}</div>
            <div class="twitter-description">{{ truncateText(description, 60) }}</div>
            <div class="twitter-domain">{{ domain }}</div>
          </div>
        </div>
      </div>

      <!-- LinkedIn Preview -->
      <div class="preview-card linkedin-preview">
        <div class="preview-label">💼 LinkedIn</div>
        <div class="linkedin-card">
          <div v-if="image" class="linkedin-image">
            <img :src="image" :alt="title" />
          </div>
          <div class="linkedin-content">
            <div class="linkedin-title">{{ title }}</div>
            <div class="linkedin-description">{{ truncateText(description, 100) }}</div>
            <div class="linkedin-domain">{{ domain }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- SEO Score -->
    <div class="seo-score">
      <div class="score-header">
        <h4>📊 Score SEO</h4>
        <div class="score-badge" :class="scoreClass">
          {{ seoScore }}/100
        </div>
      </div>
      
      <div class="score-details">
        <div class="score-item" :class="{ good: title.length >= 30 && title.length <= 60, warning: title.length < 30 || title.length > 60 }">
          <span class="score-icon">{{ title.length >= 30 && title.length <= 60 ? '✅' : '⚠️' }}</span>
          <span class="score-text">Titre: {{ title.length }} caractères (optimal: 30-60)</span>
        </div>
        
        <div class="score-item" :class="{ good: description.length >= 120 && description.length <= 160, warning: description.length < 120 || description.length > 160 }">
          <span class="score-icon">{{ description.length >= 120 && description.length <= 160 ? '✅' : '⚠️' }}</span>
          <span class="score-text">Description: {{ description.length }} caractères (optimal: 120-160)</span>
        </div>
        
        <div class="score-item" :class="{ good: !!image, warning: !image }">
          <span class="score-icon">{{ image ? '✅' : '❌' }}</span>
          <span class="score-text">Image Open Graph: {{ image ? 'Présente' : 'Manquante' }}</span>
        </div>
        
        <div class="score-item" :class="{ good: keywords && keywords.length >= 3, warning: !keywords || keywords.length < 3 }">
          <span class="score-icon">{{ keywords && keywords.length >= 3 ? '✅' : '⚠️' }}</span>
          <span class="score-text">Mots-clés: {{ keywords ? keywords.length : 0 }} (optimal: 3+)</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

interface Props {
  title: string;
  description: string;
  image?: string;
  url?: string;
  keywords?: string[];
}

const props = defineProps<Props>();

// Computed properties
const domain = computed(() => {
  try {
    return new URL(props.url || 'https://valentine-arnaly.com').hostname;
  } catch {
    return 'valentine-arnaly.com';
  }
});

const cleanUrl = computed(() => {
  return (props.url || 'https://valentine-arnaly.com').replace(/^https?:\/\//, '');
});

const seoScore = computed(() => {
  let score = 0;
  
  // Title score (25 points)
  if (props.title.length >= 30 && props.title.length <= 60) {
    score += 25;
  } else if (props.title.length >= 15 && props.title.length <= 80) {
    score += 15;
  } else if (props.title.length > 0) {
    score += 5;
  }
  
  // Description score (25 points)
  if (props.description.length >= 120 && props.description.length <= 160) {
    score += 25;
  } else if (props.description.length >= 80 && props.description.length <= 200) {
    score += 15;
  } else if (props.description.length > 0) {
    score += 5;
  }
  
  // Image score (25 points)
  if (props.image) {
    score += 25;
  }
  
  // Keywords score (25 points)
  if (props.keywords && props.keywords.length >= 3) {
    score += 25;
  } else if (props.keywords && props.keywords.length >= 1) {
    score += 15;
  }
  
  return Math.min(100, score);
});

const scoreClass = computed(() => {
  if (seoScore.value >= 80) return 'excellent';
  if (seoScore.value >= 60) return 'good';
  if (seoScore.value >= 40) return 'warning';
  return 'poor';
});

// Methods
const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
};
</script>

<style scoped lang="scss">
@import '../styles/variables.scss';

.seo-preview {
  background: $color-white;
  border: 1px solid $color-gray-light;
  border-radius: 12px;
  padding: 2rem;
  margin: 2rem 0;
}

.preview-header {
  text-align: center;
  margin-bottom: 2rem;
  
  h3 {
    color: $color-gray-dark;
    margin: 0 0 0.5rem 0;
    font-size: 1.5rem;
  }
  
  .preview-subtitle {
    color: $color-gray-medium;
    margin: 0;
    font-size: 0.9rem;
  }
}

.preview-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.preview-card {
  border: 1px solid $color-gray-light;
  border-radius: 8px;
  overflow: hidden;
  
  .preview-label {
    background: lighten($color-gray-light, 3%);
    padding: 0.5rem 1rem;
    font-size: 0.85rem;
    font-weight: 600;
    color: $color-gray-dark;
    border-bottom: 1px solid $color-gray-light;
  }
}

// Google Preview
.google-preview {
  .google-result {
    padding: 1rem;
    
    .google-url {
      color: #1a0dab;
      font-size: 0.8rem;
      margin-bottom: 0.25rem;
    }
    
    .google-title {
      color: #1a0dab;
      font-size: 1.1rem;
      font-weight: 400;
      text-decoration: underline;
      margin-bottom: 0.25rem;
      cursor: pointer;
      
      &:hover {
        text-decoration: none;
      }
    }
    
    .google-snippet {
      color: #4d5156;
      font-size: 0.85rem;
      line-height: 1.4;
    }
  }
}

// Facebook Preview
.facebook-preview {
  .facebook-card {
    .facebook-image {
      aspect-ratio: 1.91/1;
      overflow: hidden;
      
      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
    }
    
    .facebook-content {
      padding: 1rem;
      
      .facebook-domain {
        color: #65676b;
        font-size: 0.75rem;
        text-transform: uppercase;
        margin-bottom: 0.25rem;
      }
      
      .facebook-title {
        color: #1c1e21;
        font-size: 1rem;
        font-weight: 600;
        line-height: 1.3;
        margin-bottom: 0.25rem;
      }
      
      .facebook-description {
        color: #65676b;
        font-size: 0.85rem;
        line-height: 1.3;
      }
    }
  }
}

// Twitter Preview
.twitter-preview {
  .twitter-card {
    .twitter-image {
      aspect-ratio: 2/1;
      overflow: hidden;
      
      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
    }
    
    .twitter-content {
      padding: 1rem;
      
      .twitter-title {
        color: #0f1419;
        font-size: 0.95rem;
        font-weight: 400;
        line-height: 1.3;
        margin-bottom: 0.25rem;
      }
      
      .twitter-description {
        color: #536471;
        font-size: 0.85rem;
        line-height: 1.3;
        margin-bottom: 0.5rem;
      }
      
      .twitter-domain {
        color: #536471;
        font-size: 0.8rem;
      }
    }
  }
}

// LinkedIn Preview
.linkedin-preview {
  .linkedin-card {
    .linkedin-image {
      aspect-ratio: 1.91/1;
      overflow: hidden;
      
      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
    }
    
    .linkedin-content {
      padding: 1rem;
      
      .linkedin-title {
        color: #000000;
        font-size: 1rem;
        font-weight: 600;
        line-height: 1.3;
        margin-bottom: 0.25rem;
      }
      
      .linkedin-description {
        color: #666666;
        font-size: 0.85rem;
        line-height: 1.3;
        margin-bottom: 0.5rem;
      }
      
      .linkedin-domain {
        color: #666666;
        font-size: 0.8rem;
        text-transform: uppercase;
      }
    }
  }
}

// SEO Score
.seo-score {
  background: lighten($color-gray-light, 4%);
  border: 1px solid $color-gray-light;
  border-radius: 8px;
  padding: 1.5rem;
  
  .score-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
    
    h4 {
      color: $color-gray-dark;
      margin: 0;
      font-size: 1.2rem;
    }
    
    .score-badge {
      padding: 0.5rem 1rem;
      border-radius: 20px;
      font-weight: 700;
      font-size: 0.9rem;
      
      &.excellent {
        background: #d1fae5;
        color: #065f46;
      }
      
      &.good {
        background: #fef3c7;
        color: #92400e;
      }
      
      &.warning {
        background: #fed7aa;
        color: #9a3412;
      }
      
      &.poor {
        background: #fee2e2;
        color: #991b1b;
      }
    }
  }
  
  .score-details {
    display: grid;
    gap: 0.5rem;
    
    .score-item {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem;
      border-radius: 6px;
      
      &.good {
        background: rgba(209, 250, 229, 0.3);
      }
      
      &.warning {
        background: rgba(254, 243, 199, 0.3);
      }
      
      .score-icon {
        font-size: 0.9rem;
      }
      
      .score-text {
        font-size: 0.85rem;
        color: $color-gray-medium;
      }
    }
  }
}

@media (max-width: 768px) {
  .preview-grid {
    grid-template-columns: 1fr;
  }
  
  .score-header {
    flex-direction: column;
    gap: 1rem;
    text-align: center;
  }
}
</style>
