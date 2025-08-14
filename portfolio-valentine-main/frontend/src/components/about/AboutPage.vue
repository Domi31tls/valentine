<template>
  <div class="about-page">

    <!-- Section Hero -->
    <section class="about-page__hero slide-up wide-container">
      <h1>{{ aboutData.exergue }}</h1>
    </section>

    <!-- Section Presentation-->
    <section class="about-page__presentation slide-up wide-container">
      <div class="about-page__presentation__content">
        <div 
        v-for="textProp in aboutData.content" 
        :key="textProp.id || textProp.title" 
        class="about-page__presentation__content-section">
          <h2>{{ textProp.title }}</h2>
          <div v-html="textProp.content"></div>
        </div>
      </div>
      <div class="about-page__presentation__image">
        <img 
            src="/uploads/about/valentine-portrait.jpg" 
            alt="Valentine Arnaly Portrait" 
            class="portrait-image"
            loading="lazy"
          />
      </div>
    </section>

    <!-- Section Clients -->
    <section class="about-page__clients slide-up wide-container">
      <h2 class="about-page__clients__title">Selected clients</h2>
      <div class="about-page__clients__list">
        <div 
          v-if="aboutData.clients && aboutData.clients.length > 0"
          v-for="(client, index) in aboutData.clients" 
          :key="client.id" 
          class="about-page__clients__item">
          <span class="client-name">{{ client.name }}</span>
          <span 
            v-if="index < aboutData.clients.length - 1"
            class="client-separator"
          >
            /
          </span>
        </div>
        <div v-else class="about-page__clients__item">
          <p>No clients found</p>
        </div>
      </div>
    </section>

    <!-- Section Contacts -->
    <section class="about-page__contacts slide-up wide-container">
      <h2 class="about-page__contacts__title">Get in touch</h2>
      <div class="about-page__contacts__list">
        <div 
          v-if="aboutData.contacts && aboutData.contacts.length > 0"
          v-for="(contact, index) in aboutData.contacts" 
          :key="contact.id" 
          class="about-page__contacts__item">
          <a 
            v-if="contact.type === 'email'"
            :href="`mailto:${contact.value}`" 
            class="contact-email"
          >
            {{ contact.value }}
          </a>
          
          <!-- Téléphone -->
          <a 
            v-else-if="contact.type === 'phone'"
            :href="`tel:${contact.value}`" 
            class="contact-phone"
          >
            {{ contact.label || contact.value }}
          </a>
          
          <!-- Réseaux sociaux et sites web -->
          <a 
            v-else
            :href="formatContactUrl(contact)" 
            target="_blank" 
            rel="noopener" 
            class="social-link"
          >
            {{ contact.label }}
          </a>
        </div>
        <div v-else class="about-page__contacts__item">
          <p>No contacts found</p>
        </div>
      </div>
    </section>
    
  </div>
  <AboutFooter client:only="vue" />
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useApi } from '@/composables/useApi';
import AboutFooter from '@/components/ui/AboutFooter.vue';

// Types pour les données About
interface AboutData {
  exergue: string
  content: Array<{
    id?: string
    title: string
    content: string
  }>
  clients: Array<{
    id: string
    name: string
    logo_url?: string
    website_url?: string
  }>
  contacts: Array<{
    id: string
    type: string
    label: string
    value: string
  }>
}

// States
const isLoading = ref(true);
const error = ref<string | null>(null);
const aboutData = ref<AboutData>({
  exergue: '',
  content: [],
  clients: [],
  contacts: []
})

const { fetchData } = useApi();

// Methods
const loadAboutData = async () => {
  try {
    isLoading.value = true
    error.value = null
    
    const response = await fetchData('/api/public/about')
    
    if (response.success && response.data?.data) {
      aboutData.value = response.data.data
    } else {
      error.value = response.error || 'Failed to load about data'
    }
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Unknown error'
    console.error('Erreur chargement About:', err)
  } finally {
    isLoading.value = false
  }
}

const formatContactUrl = (contact: any): string => {
  // Si la valeur contient déjà http, on la retourne telle quelle
  if (contact.value.startsWith('http')) {
    return contact.value
  }
  
  // Sinon, on formate selon le type
  switch (contact.type) {
    case 'instagram':
      return `https://instagram.com/${contact.value.replace('@', '')}`
    case 'linkedin':
      return `https://linkedin.com/in/${contact.value}`
    case 'website':
      return contact.value.startsWith('http') ? contact.value : `https://${contact.value}`
    default:
      return contact.value
  }
}

// Lifecycle
onMounted(() => {
  loadAboutData()
})
</script>

<style scoped lang="scss">
.about-page {
  padding-block: var(--spacing-10);

  &__hero {
    display: flex;
    min-height: 50vh;
    padding: var(--spacing-6);
    flex-direction: column;
    justify-content: center;
    align-items: center;
    align-self: stretch;

    h1 {
      font-size: var(--font-size-4xl);
      font-weight: var(--font-weight-bold);
      letter-spacing: -3%;
      line-height: var(--line-height-tight);
      max-width: 75ch;
    }
  }

  &__presentation {
    display: grid;
    grid-template-columns: 2fr 1fr;
    gap: var(--spacing-6);
    padding-block: var(--spacing-6) var(--spacing-12);
    animation-delay: 0.5s;

    @media (max-width: 768px) {
      display: flex;
      flex-direction: column-reverse;
    }

    &__content {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-6);
      
      &-section {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        gap: var(--spacing-3);
        align-self: stretch;
        
        h2 {
          font-size: var(--font-size-2xl);
          font-weight: var(--font-weight-bold);
          line-height: var(--line-height-tight);
          text-transform: uppercase;
        }

        div {
          max-width: 75ch;
          line-height: var(--line-height-relaxed);
        }
      }
    }

    &__image {
      width: 100%;
      aspect-ratio: 3 / 4;
      overflow: hidden;
      border-radius: var(--border-radius-l);

      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
    }
  }

  &__clients {
    display: grid;
    grid-template-columns: 1fr 2fr;
    gap: var(--spacing-6);
    padding-block: var(--spacing-12);

    animation-delay: 1s;

    @media (max-width: 968px) {
      grid-template-columns: 1fr;
      gap: var(--spacing-4);
    }

    &__title {
      font-size: var(--font-size-3xl);
      font-weight: var(--font-weight-bold);
      line-height: var(--line-height-tight);
    }

    &__list {
      display: flex;
      flex-wrap: wrap;
      gap: var(--spacing-2);
      align-items: center;
      font-size: var(--font-size-l);
      line-height: var(--line-height-relaxed);
      justify-self: flex-end;

      @media (max-width: 968px) {
        justify-self: flex-start;
      }
    }
  }

  &__contacts {
    display: grid;
    grid-template-columns: 1fr 2fr;
    gap: var(--spacing-6);
    padding-block: var(--spacing-12);

    animation-delay: 1s;

    @media (max-width: 968px) {
      grid-template-columns: 1fr;
      gap: var(--spacing-4);
    }

    &__title {
      font-size: var(--font-size-3xl);
      font-weight: var(--font-weight-bold);
      line-height: var(--line-height-tight);
    }

    &__list {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-2);
      align-items: center;
      font-size: var(--font-size-l);
      line-height: var(--line-height-relaxed);
      justify-self: flex-end;

      @media (max-width: 968px) {
        justify-self: flex-start;
      }

      a {
        color: inherit;
      }
    }
    
  }
}
</style>
