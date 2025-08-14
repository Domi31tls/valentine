<template>
  <div class="seo-sidepanel" :class="{ 'is-open': isOpen }">
    <div class="seo-sidepanel-overlay" @click="$emit('close')"></div>
    <div class="seo-sidepanel-content">
      <!-- Header -->
      <div class="seo-sidepanel-header">
        <div class="seo-sidepanel-header-left">
          <h3>SEO Settings</h3>
          <div class="seo-score" :class="`score-${seoScoreLevel}`">
            <span class="seo-score-value">{{ seoScore }}/100</span>
            <span class="seo-score-label">{{ seoScoreText }}</span>
          </div>
        </div>
        <button class="seo-sidepanel-close" @click="$emit('close')">
          <XMarkIcon />
        </button>
      </div>

      <!-- SEO Form -->
      <div class="seo-sidepanel-form">
        <!-- Title -->
        <div class="seo-field">
          <label>SEO Title</label>
          <input
            v-model="localSeo.title"
            type="text"
            placeholder="Enter SEO title..."
            maxlength="60"
            @input="updateSeo"
          />
          <div class="seo-field-info">
            <span :class="{ 'text-warning': seoTitleLength > 60, 'text-error': seoTitleLength > 70 }">
              {{ seoTitleLength }}/60 characters
            </span>
          </div>
        </div>

        <!-- Description -->
        <div class="seo-field">
          <label>SEO Description</label>
          <textarea
            v-model="localSeo.description"
            placeholder="Enter SEO description..."
            maxlength="160"
            rows="3"
            @input="updateSeo"
          ></textarea>
          <div class="seo-field-info">
            <span :class="{ 'text-warning': seoDescriptionLength > 160, 'text-error': seoDescriptionLength > 180 }">
              {{ seoDescriptionLength }}/160 characters
            </span>
          </div>
        </div>

        <!-- Keywords -->
        <div class="seo-field">
          <label>Keywords</label>
          <div class="keywords-container">
            <div class="keywords-list" v-if="keywords.length > 0">
              <span
                v-for="(keyword, index) in keywords"
                :key="index"
                class="keyword-tag"
              >
                {{ keyword }}
                <button @click="removeKeyword(index)" class="keyword-remove">×</button>
              </span>
            </div>
            <div class="keyword-input-container">
              <input
                v-model="newKeyword"
                type="text"
                placeholder="Add keyword..."
                @keyup.enter="addKeyword"
                @keyup.comma="addKeyword"
              />
              <button @click="addKeyword" class="keyword-add">Add</button>
            </div>
          </div>
          <div class="seo-field-info">
            <span :class="{ 'text-warning': keywords.length > 10 }">
              {{ keywords.length }}/10 keywords
            </span>
          </div>
        </div>

        <!-- SEO Checks -->
        <div class="seo-checks">
          <h4>SEO Analysis</h4>
          <div class="seo-check-list">
            <div class="seo-check" :class="seoChecks.hasTitle ? 'check-pass' : 'check-fail'">
              <span class="check-icon">{{ seoChecks.hasTitle ? '✓' : '×' }}</span>
              <span>SEO title is present</span>
            </div>
            <div class="seo-check" :class="seoChecks.titleLength ? 'check-pass' : 'check-warn'">
              <span class="check-icon">{{ seoChecks.titleLength ? '✓' : '⚠' }}</span>
              <span>SEO title length is optimal (30-60 chars)</span>
            </div>
            <div class="seo-check" :class="seoChecks.hasDescription ? 'check-pass' : 'check-fail'">
              <span class="check-icon">{{ seoChecks.hasDescription ? '✓' : '×' }}</span>
              <span>SEO description is present</span>
            </div>
            <div class="seo-check" :class="seoChecks.descriptionLength ? 'check-pass' : 'check-warn'">
              <span class="check-icon">{{ seoChecks.descriptionLength ? '✓' : '⚠' }}</span>
              <span>SEO description length is optimal (120-160 chars)</span>
            </div>
            <div class="seo-check" :class="seoChecks.hasKeywords ? 'check-pass' : 'check-warn'">
              <span class="check-icon">{{ seoChecks.hasKeywords ? '✓' : '⚠' }}</span>
              <span>Keywords are present (3-10 recommended)</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Preview -->
      <div class="seo-preview">
        <h4>Search Preview</h4>
        <div class="search-result-preview">
          <div class="search-url">{{ previewUrl }}</div>
          <div class="search-title">{{ previewTitle }}</div>
          <div class="search-description">{{ previewDescription }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import type { SEOData } from '../../../../shared/types';
import XMarkIcon from '@/Icons/xmark.vue';

interface Props {
  isOpen: boolean;
  seo: SEOData;
  projectTitle?: string;
}

const props = withDefaults(defineProps<Props>(), {
  projectTitle: ''
});

const emit = defineEmits<{
  'close': [];
  'update:seo': [seo: SEOData];
}>();

// Local state
const localSeo = ref<SEOData>({ ...props.seo });
const newKeyword = ref('');

// Computed
const keywords = computed({
  get: () => localSeo.value.keywords || [],
  set: (value: string[]) => {
    localSeo.value.keywords = value;
    updateSeo();
  }
});

const seoTitleLength = computed(() => (localSeo.value.title || '').length);
const seoDescriptionLength = computed(() => (localSeo.value.description || '').length);

const seoChecks = computed(() => ({
  hasTitle: seoTitleLength.value > 0,
  titleLength: seoTitleLength.value >= 30 && seoTitleLength.value <= 60,
  hasDescription: seoDescriptionLength.value > 0,
  descriptionLength: seoDescriptionLength.value >= 120 && seoDescriptionLength.value <= 160,
  hasKeywords: keywords.value.length >= 3 && keywords.value.length <= 10
}));

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
  if (keywords.value.length > 0) score += 10;
  
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

const previewTitle = computed(() => {
  return localSeo.value.title || props.projectTitle || 'Untitled Project';
});

const previewDescription = computed(() => {
  return localSeo.value.description || 'No description available for this project.';
});

const previewUrl = computed(() => {
  const slug = (props.projectTitle || 'untitled-project')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-');
  return `valentine-arnaly.com/projects/${slug}`;
});

// Methods
const updateSeo = () => {
  emit('update:seo', { ...localSeo.value });
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

// Watch for prop changes
watch(() => props.seo, (newSeo) => {
  localSeo.value = { ...newSeo };
}, { deep: true });
</script>

<style scoped lang="scss">
.seo-sidepanel {
  position: fixed;
  top: 0;
  right: 0;
  width: 100%;
  height: 100%;
  z-index: 1000;
  pointer-events: none;
  opacity: 0;
  transition: opacity var(--duration-base) var(--easing-ease-in-out);

  &.is-open {
    pointer-events: all;
    opacity: 1;

    .seo-sidepanel-content {
      transform: translateX(0);
    }
  }

  &-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.5);
    backdrop-filter: blur(4px);
  }

  &-content {
    position: absolute;
    top: 0;
    right: 0;
    width: 480px;
    height: 100%;
    background: var(--color-background);
    box-shadow: -4px 0 24px rgba(0, 0, 0, 0.15);
    transform: translateX(100%);
    transition: transform var(--duration-base) var(--easing-ease-in-out);
    overflow-y: auto;
    display: flex;
    flex-direction: column;

    @media (max-width: 640px) {
      width: 100%;
    }
  }

  &-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--spacing-6);
    border-bottom: 1px solid var(--color-background-secondary);
    flex-shrink: 0;

    &-left {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-2);

      h3 {
        font-size: var(--font-size-xl);
        font-weight: var(--font-weight-bold);
        margin: 0;
      }
    }
  }

  &-close {
    appearance: none;
    border: none;
    background: transparent;
    cursor: pointer;
    padding: var(--spacing-2);
    border-radius: var(--border-radius-m);
    color: var(--color-text-secondary);
    transition: all var(--duration-fast);

    &:hover {
      background: var(--color-background-secondary);
      color: var(--color-text-primary);
    }

    svg {
      width: 20px;
      height: 20px;
    }
  }

  &-form {
    padding: var(--spacing-6);
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: var(--spacing-6);
  }
}

.seo-score {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
  padding: var(--spacing-1) var(--spacing-3);
  border-radius: var(--border-radius-full);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);

  &.score-excellent {
    background: var(--color-success-background);
    color: var(--color-success-text);
  }

  &.score-good {
    background: var(--color-info-background);
    color: var(--color-info-text);
  }

  &.score-average {
    background: var(--color-warning-background);
    color: var(--color-warning-text);
  }

  &.score-poor {
    background: var(--color-error-background);
    color: var(--color-error-text);
  }

  &-value {
    font-weight: var(--font-weight-bold);
  }
}

.seo-field {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2);

  label {
    font-weight: var(--font-weight-medium);
    font-size: var(--font-size-sm);
    color: var(--color-text-primary);
  }

  input, textarea {
    appearance: none;
    border: 1px solid var(--color-background-secondary);
    border-radius: var(--border-radius-m);
    padding: var(--spacing-3);
    font-size: var(--font-size-base);
    background: var(--color-background);
    color: var(--color-text-primary);
    transition: border-color var(--duration-fast);

    &:focus {
      outline: none;
      border-color: var(--color-info-text);
    }

    &::placeholder {
      color: var(--color-text-secondary);
    }
  }

  textarea {
    resize: vertical;
    min-height: 80px;
  }

  &-info {
    font-size: var(--font-size-xs);
    color: var(--color-text-secondary);

    .text-warning {
      color: var(--color-warning-text);
    }

    .text-error {
      color: var(--color-error-text);
    }
  }
}

.keywords-container {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-3);
}

.keywords-list {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-2);
}

.keyword-tag {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-1);
  padding: var(--spacing-1) var(--spacing-2);
  background: var(--color-info-background);
  color: var(--color-info-text);
  border-radius: var(--border-radius-s);
  font-size: var(--font-size-sm);

  .keyword-remove {
    appearance: none;
    border: none;
    background: transparent;
    cursor: pointer;
    color: inherit;
    font-size: var(--font-size-base);
    line-height: 1;
    padding: 0;
    margin-left: var(--spacing-1);

    &:hover {
      color: var(--color-error-text);
    }
  }
}

.keyword-input-container {
  display: flex;
  gap: var(--spacing-2);

  input {
    flex: 1;
  }

  .keyword-add {
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
    }
  }
}

.seo-checks {
  h4 {
    font-size: var(--font-size-base);
    font-weight: var(--font-weight-medium);
    margin: 0 0 var(--spacing-3) 0;
  }
}

.seo-check-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2);
}

.seo-check {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
  font-size: var(--font-size-sm);

  .check-icon {
    width: 16px;
    text-align: center;
    font-weight: var(--font-weight-bold);
  }

  &.check-pass {
    color: var(--color-success-text);
  }

  &.check-warn {
    color: var(--color-warning-text);
  }

  &.check-fail {
    color: var(--color-error-text);
  }
}

.seo-preview {
  padding: var(--spacing-6);
  border-top: 1px solid var(--color-background-secondary);
  background: var(--color-background-secondary);

  h4 {
    font-size: var(--font-size-base);
    font-weight: var(--font-weight-medium);
    margin: 0 0 var(--spacing-4) 0;
  }
}

.search-result-preview {
  padding: var(--spacing-4);
  background: white;
  border-radius: var(--border-radius-m);
  border: 1px solid #e0e0e0;

  .search-url {
    color: #1a73e8;
    font-size: 14px;
    margin-bottom: 2px;
  }

  .search-title {
    color: #1a0dab;
    font-size: 18px;
    font-weight: 400;
    line-height: 1.3;
    margin-bottom: 4px;
    cursor: pointer;

    &:hover {
      text-decoration: underline;
    }
  }

  .search-description {
    color: #4d5156;
    font-size: 14px;
    line-height: 1.4;
  }
}
</style>