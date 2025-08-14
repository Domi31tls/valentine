<template>
  <div class="homepage" :class="`mode-${currentMode}`">
    <!-- Hero Section -->
    <section class="hero slide-up">
      <div class="hero__title">
        <h1>Valentine Arnaly</h1>
        <h2>Photographer/Editing</h2>
      </div>
      <!-- Image Random-->
      <div class="hero__image" ref="heroImageRef">
        <img 
          :src="imageSrc"
          :alt="randomContent?.data.title || randomImage?.alt || 'Random portfolio image'"
          :style="{ transform: `translateY(${scrollY * 0.5}px)` }"
        />
      </div>
    </section>

    <!-- Transition -->
    <section class="transition"></section>

    <!-- Switch mode principal -->
    <section class="switch-mode">
      <span class="switch-mode__title">Photography</span>
      <label class="switch-mode__toggle">
        <input type="checkbox" 
          value="photo" 
          @change="switchMode"
        />
        <span class="switch-mode__slider"></span>
      </label>
      <span class="switch-mode__title">Editing</span>
    </section>

    <!-- Contenu principal selon le mode -->
    <main class="main-content">
      <!-- Mode Photo : Grille projets -->
      <ProjectGrid client:only="vue"
        v-if="currentMode === 'photo'"
        @open-modal="openProjectModal"
      />

      <!-- Mode Retouche : Grille retouches (sans modals) -->
      <RetoucheGrid client:only="vue"
        v-if="currentMode === 'retouche'" 
      />
    </main>

    <!-- Modal Project (seulement en mode photo) -->
    <ProjectModal client:only="vue"
      v-if="selectedProject && currentMode === 'photo'"
      :project="selectedProject"
      @close="closeProjectModal"
    />
  </div>

  <!-- Footer -->
  <Footer client:only="vue" />
</template>

<script setup lang="ts">
// Imports
import { ref, onMounted, onUnmounted, computed } from 'vue'
import type { Project, Retouche } from '@/../../shared/types'

import ProjectGrid from '@/components/home/ProjectGrid.vue'
import RetoucheGrid from '@/components/home/RetoucheGrid.vue'
import ProjectModal from '@/components/home/ProjectModal.vue'
import { useApi } from '@/composables/useApi'
import Footer from '@/components/ui/Footer.vue'

interface Props {
  initialMode?: 'photo' | 'retouche'
}

const props = withDefaults(defineProps<Props>(), {
  initialMode: 'photo'
})

// État
const currentMode = ref<'photo' | 'retouche'>(props.initialMode)
const loading = ref(false)
const stats = ref<{ projects: number, retouches: number } | null>(null)
const randomContent = ref<{ type: 'project' | 'retouche', data: Project | Retouche } | null>(null)
const randomImage = ref<any | null>(null)
const selectedProject = ref<Project | null>(null)
const heroImageRef = ref<HTMLElement | null>(null)
const scrollY = ref(0)

// Composables
const { fetchData } = useApi()
const imageSrc = computed(() => {
  // Priorité à l'image aléatoire dédiée
  if (randomImage.value?.url) {
    return randomImage.value.url;
  }
  
  // Fallback sur le contenu aléatoire des projets/retouches
  const data = randomContent.value?.data;
  if (data && 'images' in data) {
    const images = data.images;
    if (Array.isArray(images) && images.length > 0) {
      const randomIndex = Math.floor(Math.random() * images.length);
      return images[randomIndex].url;
    }
  }
  
  // Retourner une chaîne vide si aucune image disponible
  return '';
});


// Switch de mode
const switchMode = async () => {
  currentMode.value === 'photo' ? currentMode.value = 'retouche' : currentMode.value = 'photo'
  await refreshContent()
}

// Récupérer une image aléatoire
const loadRandomImage = async () => {
  try {
    const response = await fetchData('/api/public/hero/image')
    
    if (response.success && response.data) {
      randomImage.value = response.data
    }
  } catch (error) {
    console.error('Erreur récupération image aléatoire:', error)
  }
}

// Refresh du contenu aléatoire
const refreshContent = async () => {
  try {
    loading.value = true
    
    const endpoint = currentMode.value === 'photo' 
      ? '/api/public/hero?mode=photo&count=1'
      : '/api/public/hero?mode=retouche&count=1'
    
    const response = await fetchData(endpoint)
    
    if (response.success && response.data && response.data.length > 0) {
      randomContent.value = {
        type: currentMode.value === 'photo' ? 'project' : 'retouche',
        data: response.data[0]
      }
    }
    
  } catch (error) {
    console.error('Erreur refresh:', error)
  } finally {
    loading.value = false
  }
}

// Modal project
const openProjectModal = (project: Project) => {
  selectedProject.value = project
  console.log(selectedProject.value)
  document.body.style.overflow = 'hidden'
}

const closeProjectModal = () => {
  selectedProject.value = null
  document.body.style.overflow = ''
}

// Parallax effect
const handleScroll = () => {
  scrollY.value = window.scrollY
}

const setupParallax = () => {
  window.addEventListener('scroll', handleScroll, { passive: true })
}

const cleanupParallax = () => {
  window.removeEventListener('scroll', handleScroll)
}

// Lifecycle
onMounted(async () => {
  await Promise.all([
    refreshContent(),
    loadRandomImage()
  ])
  setupParallax()
})

onUnmounted(() => {
  cleanupParallax()
})
</script>

<style lang="scss" scoped>
.homepage {
  min-height: 100vh;

  .hero {

    min-height: 100vh;
    padding-bottom: 100px;
    position: sticky;
    top: 0;
    z-index: -1;

    display: flex;
    align-items: flex-end;
    justify-content: center;
    background-color: var(--color-background);

    &__title {
      position: relative;
      width: fit-content;

      h1 {
        font-size: 20vw;
        font-weight: var(--font-weight-black);
        line-height: 80%;
        leading-trim: both;
        text-edge: cap;
      }

      h2 {
        position: absolute;
        bottom: 0;
        right: var(--spacing-8);
        text-align: right;
        leading-trim: both;
        text-edge: cap;

        font-family: var(--font-family-secondary);
        font-style: italic;
        font-size: var(--font-size-2xl);
      }

      @media (max-width: 1060px) {
        display: flex;
        flex-direction: column;
        gap: var(--spacing-5);

        h2 {
          position: relative;
        }
      }
    }

    &__image {
      position: absolute;
      top: 50%;
      right: 5vw;
      transform: translateY(-50%);
      width: 300px;
      aspect-ratio: 3 / 4;
      border-radius: var(--border-radius-m);
      overflow: hidden;
      z-index: -10;

      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        will-change: transform;
        transition: transform 0.1s ease-out;
      }

      @media (max-width: 768px) {
        position: relative;
        top: auto;
        right: auto;
        margin: var(--spacing-6) auto 0;
        width: 200px;
        transform: none;
      }
    }
  }

  .transition {
    height: 100vh;
    width: 100%;
    mask: linear-gradient(to bottom, transparent, var(--color-background));
    backdrop-filter: blur(50px);
    z-index: 1;
    position: relative;

    &::after {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: linear-gradient(to bottom, transparent, var(--color-background));
    }
  }

  .switch-mode {
    display: flex;
    padding: var(--spacing-12) 0 var(--spacing-8) 0;
    justify-content: center;
    align-items: center;
    gap: var(--spacing-5);
    align-self: stretch;
    background-color: var(--color-background);
    transition: background-color var(--duration-base) var(--easing-spring);


    &__toggle {
      position: relative;
      display: inline-block;
      width: var(--spacing-6);
      height: var(--spacing-5);
      border-radius: var(--border-radius-full);
      background-color: var(--color-background-secondary);
      transition: background-color var(--duration-base) var(--easing-spring);
      cursor: pointer;

      input {
        opacity: 0;
        appearance: none;
        width: 0;
        height: 0;
      }

      .switch-mode__slider {
        position: absolute;
        top: 2px;
        left: 2px;
        height: calc(100% - 4px);
        aspect-ratio: 1;
        border-radius: var(--border-radius-full);
        background-color: var(--color-background);
        transition: all var(--duration-base) var(--easing-spring);


        &:hover {
          background-color: #ccc;
        }
      }
    }

    &__title {
      font-size: var(--font-size-m);
      width: 100px;
    }
  }
}

.main-content {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  align-self: stretch;
  width: 100%;

  background-color: var(--color-background);
  transition: background-color var(--duration-base) var(--easing-spring);
}

.mode-retouche {
  .hero {
    background-color: var(--color-background-dark);
  }

  .transition {
    &::after {
      background-color: linear-gradient(to bottom, transparent, var(--color-background-dark));
    }
  }

  .switch-mode {
    background-color: var(--color-background-dark);

    &__toggle {
      background-color: var(--color-background-dark-secondary);

      .switch-mode__slider {
        left: auto;
        right: 2px;
        background-color: var(--color-background-dark);
      }
    }
  }

  .main-content {
    background-color: var(--color-background-dark);
  }
}
</style>

<style lang="scss">
body:has(.mode-photo) {
  background-color: var(--color-background);
  transition: background-color var(--duration-base) var(--easing-spring);
  color: var(--color-text);
}

body:has(.mode-retouche) {
  background-color: var(--color-background-dark);
  transition: background-color var(--duration-base) var(--easing-spring);

  color: var(--color-text-inverted);
}

body:has(.mode-retouche) .hamburger-line {
  background: var(--color-text-inverted) !important;
}
body:has(.mode-retouche) .footer {
  background: var(--color-background-dark) !important;
}
</style>

