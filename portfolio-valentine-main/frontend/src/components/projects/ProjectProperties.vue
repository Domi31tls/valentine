<template>
  <section class="project-properties">
    <!-- Status -->
    <div class="property">
      <div class="property-row property-title">
        <div class="property-field">
          <span class="property-icon">
            <Sun />
          </span>
          Status
        </div>
      </div>
      <div class="property-row property-content">
        <div class="property-field">
          <select class="property-select" v-model="localProject.status" @change="emitChange">
            <option value="published">Published</option>
            <option value="invisible">Invisible</option>
          </select>
        </div>
      </div>
    </div>
    <!-- Description -->
    <div class="property">
      <div class="property-row property-title">
        <div class="property-field">
          <span class="property-icon">
            <LinesH />
          </span>
          Description
        </div>
      </div>
      <div class="property-row property-content">
        <!-- Contenu -->
        <div class="property-field">
          <textarea 
            v-model="localProject.description"
            @input="emitChange"
            rows="4"
            wrap="soft"
            placeholder="Empty"
          ></textarea>
        </div>
      </div>
    </div>

    <!-- SEO -->
    <div class="property">
      <div class="property-row property-title">
        <div class="property-field">
          <span class="property-icon">
            <TriangleUpCircle />
          </span>
          SEO
        </div>
      </div>
      <div class="property-row property-content">
        <div class="property-field seo-field">
          <div class="seo-score" :class="`score-${seoScoreLevel}`">
            <span class="seo-score-circle"></span>
            <span class="seo-score-text">{{ seoScore }}/100 - {{ seoScoreText }}</span>
          </div>
          <button class="seo-button" @click="emit('open-seo')">
            Configure SEO
          </button>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
// Import
import { ref, computed, watch } from 'vue';
import type { Project, SEOData } from '../../../../shared/types';

import Sun from '@/Icons/sun.vue';
import LinesH from '@/Icons/3.lines.h.vue';
import TriangleUpCircle from '@/Icons/triangle.up.circle.vue';

// Props
interface Props {
  project: Partial<Project>;
}
const props = defineProps<Props>();
const emit = defineEmits<{
  'update:project': [project: Partial<Project>];
  'update:seo': [seo: SEOData];
  'change': [];
  'open-seo': [];
}>();

// States
const localProject = ref<Partial<Project>>({ ...props.project });
const newKeyword = ref('');

// Computed
const keywords = computed({
  get: () => {
    const seoKeywords = localProject.value.seo?.keywords;
    if (Array.isArray(seoKeywords)) {
      return seoKeywords;
    }
    return [];
  },
  set: (value: string[]) => {
    if (!localProject.value.seo) {
      localProject.value.seo = {};
    }
    localProject.value.seo.keywords = value;
    emitChange();
  }
});
const keywordsCount = computed(() => keywords.value.length);
const seoTitleLength = computed(() => 
  (localProject.value.seo?.title || '').length
);
const seoDescriptionLength = computed(() => 
  (localProject.value.seo?.description || '').length
);

// SEO Score calculations
const seoChecks = computed(() => {
  const seo = localProject.value.seo;
  const titleLength = (seo?.title || '').length;
  const descriptionLength = (seo?.description || '').length;
  const keywordsCount = (seo?.keywords || []).length;

  return {
    hasTitle: titleLength > 0,
    titleLength: titleLength >= 30 && titleLength <= 60,
    hasDescription: descriptionLength > 0,
    descriptionLength: descriptionLength >= 120 && descriptionLength <= 160,
    hasKeywords: keywordsCount >= 3 && keywordsCount <= 10
  };
});

const seoScore = computed(() => {
  let score = 0;
  
  // Title checks (30 points max)
  if (seoChecks.value.hasTitle) score += 15;
  if (seoChecks.value.titleLength) score += 15;
  
  // Description checks (30 points max)
  if (seoChecks.value.hasDescription) score += 15;
  if (seoChecks.value.descriptionLength) score += 15;
  
  // Keywords check (20 points max)
  if (seoChecks.value.hasKeywords) score += 20;
  
  // Bonus points for having all basics (20 points max)
  if (seoChecks.value.hasTitle && seoChecks.value.hasDescription) score += 10;
  if ((localProject.value.seo?.keywords || []).length > 0) score += 10;
  
  return Math.min(100, score);
});

const seoScoreLevel = computed(() => {
  if (seoScore.value >= 80) return 'excellent';
  if (seoScore.value >= 60) return 'good';
  if (seoScore.value >= 40) return 'average';
  return 'poor';
});

const seoScoreText = computed(() => {
  if (seoScore.value >= 80) return 'Excellent';
  if (seoScore.value >= 60) return 'Good';
  if (seoScore.value >= 40) return 'Average';
  return 'Needs work';
});

// Watchers
watch(() => props.project, (newProject) => {
  localProject.value = { ...newProject };
}, { deep: true });

// Méthodes
const emitChange = () => {
  emit('update:project', localProject.value);
  emit('change');
};

const addKeyword = () => {
  const keyword = newKeyword.value.trim().replace(/,+$/, '');
  if (keyword && !keywords.value.includes(keyword) && keywords.value.length < 10) {
    keywords.value = [...keywords.value, keyword];
    newKeyword.value = '';
  }
};

const removeKeyword = (index: number) => {
  keywords.value = keywords.value.filter((_, i) => i !== index);
};

const formatDate = (dateString?: string) => {
  if (!dateString) return 'N/A';
  
  const date = new Date(dateString);
  return date.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};
</script>

<style scoped lang="scss">
.project-properties {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--spacing-1);
  align-self: stretch;
}

.seo-field {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-3);
  width: 100%;
}

.seo-score {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
  padding: var(--spacing-2) var(--spacing-3);
  border-radius: var(--border-radius-m);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);

  &.score-excellent {
    background: var(--color-success-background);
    color: var(--color-success-text);
    
    .seo-score-circle {
      background: var(--color-success-text);
    }
  }

  &.score-good {
    background: var(--color-info-background);
    color: var(--color-info-text);
    
    .seo-score-circle {
      background: var(--color-info-text);
    }
  }

  &.score-average {
    background: var(--color-warning-background);
    color: var(--color-warning-text);
    
    .seo-score-circle {
      background: var(--color-warning-text);
    }
  }

  &.score-poor {
    background: var(--color-error-background);
    color: var(--color-error-text);
    
    .seo-score-circle {
      background: var(--color-error-text);
    }
  }

  &-circle {
    width: 8px;
    height: 8px;
    border-radius: var(--border-radius-full);
  }

  &-text {
    font-size: var(--font-size-xs);
  }
}

.seo-button {
  appearance: none;
  border: 1px solid var(--color-background-secondary);
  background: var(--color-background);
  color: var(--color-text-primary);
  padding: var(--spacing-2) var(--spacing-3);
  border-radius: var(--border-radius-m);
  cursor: pointer;
  font-size: var(--font-size-sm);
  transition: all var(--duration-fast);

  &:hover {
    background: var(--color-background-secondary);
    border-color: var(--color-text-secondary);
  }
}
</style>
