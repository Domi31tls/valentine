<template>
    <footer class="footer">
        <section class="content container">
            <div class="content-title">
                <h2>Let's Talk</h2>
            </div>
            <div class="content-main" v-if="footerData && footerData.contacts.length > 0">
                <template v-for="contact in footerData.contacts" :key="contact.id">
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
                </template>
            </div>
        </section>
        <section class="bottom">
            <ul class="bottom-list">
                <li class="bottom-item" aria-hidden="true">
                    <span>Available for hire</span>
                </li>
                <li class="bottom-item" aria-hidden="true">
                    <span>✦</span>
                </li>
                <li class="bottom-item" aria-hidden="true">
                    <span>Available for hire</span>
                </li>
                <li class="bottom-item" aria-hidden="true">
                    <span>✦</span>
                </li>
                <li class="bottom-item" aria-hidden="true">
                    <span>Available for hire</span>
                </li>
                <li class="bottom-item" aria-hidden="true">
                    <span>✦</span>
                </li>
                <li class="bottom-item" aria-hidden="true">
                    <span>Available for hire</span>
                </li>
                <li class="bottom-item" aria-hidden="true">
                    <span>✦</span>
                </li>
                <li class="bottom-item" aria-hidden="true">
                    <span>Available for hire</span>
                </li>
                <li class="bottom-item" aria-hidden="true">
                    <span>✦</span>
                </li>
                <li class="bottom-item" aria-hidden="true">
                    <span>Available for hire</span>
                </li>
                <li class="bottom-item" aria-hidden="true">
                    <span>✦</span>
                </li>
                <li class="bottom-item" aria-hidden="true">
                    <span>Available for hire</span>
                </li>
                <li class="bottom-item" aria-hidden="true">
                    <span>✦</span>
                </li>
                <li class="bottom-item" aria-hidden="true">
                    <span>Available for hire</span>
                </li>
                <li class="bottom-item" aria-hidden="true">
                    <span>✦</span>
                </li>
                <li class="bottom-item" aria-hidden="true">
                    <span>Available for hire</span>
                </li>
                <li class="bottom-item" aria-hidden="true">
                    <span>✦</span>
                </li>
                <li class="bottom-item" aria-hidden="true">
                    <span>Available for hire</span>
                </li>
                <li class="bottom-item" aria-hidden="true">
                    <span>✦</span>
                </li>
            </ul>
        </section>
    </footer>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useApi } from '@/composables/useApi'

// Types pour les données About
interface FooterData {
  contacts: Array<{
    id: string
    type: string
    label: string
    value: string
  }>
}

// État
const footerData = ref<FooterData | null>(null)
const isLoading = ref(false)
const { fetchData } = useApi()

// Méthodes
const loadFooterData = async () => {
    try {
        isLoading.value = true

        const response = await fetchData('/api/public/about')
        console.log('FooterData:', response.data)

        if (response.success && response.data?.data) {
            footerData.value = response.data.data
        } else {
            console.error(response.error || 'Failed to load about data')
        }

    } catch (error) {
        console.error('Erreur lors de la récupération des données Footer:', error)
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

// Appel à l'API
onMounted(async () => {
    await loadFooterData()
})
</script>

<style lang="scss" scoped>

.footer {
    background: var(--color-background);
}

.content {
    padding-block: var(--spacing-12);
    display: flex;
    flex-direction: column;
    gap: var(--spacing-6);

    &-title {
        font-size: calc(var(--font-size-2xl) * 2);
        font-weight: var(--font-weight-bold);
    }

    &-main {
        display: flex;
        flex-direction: column;
        gap: var(--spacing-3);

        a {
            color: inherit;
            width: fit-content;
        }
    }
}

.bottom {
    display: flex;
    width: 100%;
    height: 100%;
    max-width: 100%;
    max-height: 100%;
    place-items: center;
    margin: 0px;
    padding: 10px;
    list-style-type: none;
    opacity: 1;
    mask-image: linear-gradient(to right, rgba(0, 0, 0, 0) 0%, rgb(0, 0, 0) 12.5%, rgb(0, 0, 0) 87.5%, rgba(0, 0, 0, 0) 100%);
    overflow: hidden;

    &-list {
        display: flex;
        width: 100%;
        height: 100%;
        max-width: 100%;
        max-height: 100%;
        place-items: center;
        margin: 0;
        padding: 0;
        list-style-type: none;
        text-indent: none;
        gap: var(--spacing-6);
        position: relative;
        flex-direction: row;
        will-change: transform;
        transform: translateX(-0px);

        animation: slider 3s linear infinite;
    }

    &-item {
        will-change: transform;

        span {
            text-wrap: nowrap;
            flex-shrink: 0;
            align-content: center;
            align-items: center;
            display: flex;
            flex-direction: row;
            flex-wrap: nowrap;
            gap: 10px;
            height: 27px;
            justify-content: center;
            overflow: visible;
            padding: 0;
            position: relative;
            width: min-content;
        }
    }
}

@keyframes slider {
    0% {
        transform: translateX(0);
    }
    100% {
        transform: translateX(-11.2%);
    }
}
</style>