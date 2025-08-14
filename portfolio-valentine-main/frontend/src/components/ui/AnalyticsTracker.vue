<template>
  <!-- Analytics tracker - invisible component -->
</template>

<script setup>
import { onMounted, onUnmounted } from 'vue'

// Configuration
const ANALYTICS_ENDPOINT = '/api/analytics/track'
const BATCH_SIZE = 5
const BATCH_TIMEOUT = 30000 // 30 secondes

// Queue pour le batch des événements
let eventQueue = []
let batchTimer = null

// Détecter le pays via l'API de géolocalisation
const detectCountry = async () => {
  try {
    // Utiliser une API gratuite pour détecter le pays
    const response = await fetch('https://ipapi.co/json/')
    if (response.ok) {
      const data = await response.json()
      return data.country_code || 'Unknown'
    }
  } catch (error) {
    console.debug('Country detection failed:', error)
  }
  return 'Unknown'
}

// Extraire les paramètres UTM de l'URL
const getUTMParams = () => {
  const params = new URLSearchParams(window.location.search)
  return {
    source: params.get('utm_source'),
    medium: params.get('utm_medium'), 
    campaign: params.get('utm_campaign')
  }
}

// Détecter le type d'appareil
const getDeviceInfo = () => {
  const ua = navigator.userAgent
  
  let deviceType = 'desktop'
  if (/mobile|android|iphone|ipod|blackberry|windows phone/i.test(ua)) {
    deviceType = 'mobile'
  } else if (/tablet|ipad|kindle|silk/i.test(ua)) {
    deviceType = 'tablet'
  }
  
  let os = 'Unknown'
  if (ua.includes('Windows')) os = 'Windows'
  else if (ua.includes('Macintosh') || ua.includes('Mac OS')) os = 'macOS'
  else if (ua.includes('Linux')) os = 'Linux'
  else if (ua.includes('Android')) os = 'Android'
  else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS'
  
  let browser = 'Unknown'
  if (ua.includes('Firefox')) browser = 'Firefox'
  else if (ua.includes('Chrome') && !ua.includes('Edg')) browser = 'Chrome'
  else if (ua.includes('Safari') && !ua.includes('Chrome')) browser = 'Safari'
  else if (ua.includes('Edg')) browser = 'Edge'
  else if (ua.includes('Opera')) browser = 'Opera'
  
  return { deviceType, os, browser }
}

// Obtenir la résolution d'écran
const getScreenResolution = () => {
  return `${screen.width}x${screen.height}`
}

// Créer les données d'événement
const createEventData = async () => {
  const utm = getUTMParams()
  const device = getDeviceInfo()
  const country = await detectCountry()
  
  return {
    page_path: window.location.pathname,
    referrer: document.referrer || null,
    source: utm.source,
    medium: utm.medium,
    campaign: utm.campaign,
    device_type: device.deviceType,
    os: device.os,
    browser: device.browser,
    country: country,
    language: navigator.language || navigator.userLanguage || 'Unknown',
    screen_resolution: getScreenResolution(),
    timestamp: new Date().toISOString()
  }
}

// Envoyer les événements par batch
const sendBatch = async (events) => {
  if (events.length === 0) return
  
  try {
    await fetch(ANALYTICS_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ events }),
      keepalive: true // Important pour les événements de fermeture de page
    })
    console.debug('Analytics batch sent:', events.length, 'events')
  } catch (error) {
    console.debug('Analytics batch failed:', error)
  }
}

// Ajouter un événement à la queue
const trackEvent = async () => {
  const eventData = await createEventData()
  eventQueue.push(eventData)
  
  // Envoyer immédiatement si la queue est pleine
  if (eventQueue.length >= BATCH_SIZE) {
    await sendBatch([...eventQueue])
    eventQueue = []
    clearTimeout(batchTimer)
    batchTimer = null
  } else if (!batchTimer) {
    // Programmer l'envoi après le timeout si pas encore fait
    batchTimer = setTimeout(async () => {
      await sendBatch([...eventQueue])
      eventQueue = []
      batchTimer = null
    }, BATCH_TIMEOUT)
  }
}

// Envoyer immédiatement la queue restante
const flushQueue = async () => {
  if (eventQueue.length > 0) {
    await sendBatch([...eventQueue])
    eventQueue = []
  }
  if (batchTimer) {
    clearTimeout(batchTimer)
    batchTimer = null
  }
}

// Tracker la visite initiale
const trackPageView = () => {
  // Délai court pour s'assurer que la page est chargée
  setTimeout(trackEvent, 500)
}

// Tracker les changements de page (SPA)
const trackRouteChange = () => {
  let currentPath = window.location.pathname
  
  // Observer les changements d'historique
  const originalPushState = history.pushState
  const originalReplaceState = history.replaceState
  
  history.pushState = function(...args) {
    originalPushState.apply(this, args)
    setTimeout(() => {
      if (window.location.pathname !== currentPath) {
        currentPath = window.location.pathname
        trackEvent()
      }
    }, 100)
  }
  
  history.replaceState = function(...args) {
    originalReplaceState.apply(this, args)
    setTimeout(() => {
      if (window.location.pathname !== currentPath) {
        currentPath = window.location.pathname
        trackEvent()
      }
    }, 100)
  }
  
  // Écouter les événements popstate (bouton retour)
  window.addEventListener('popstate', () => {
    setTimeout(() => {
      if (window.location.pathname !== currentPath) {
        currentPath = window.location.pathname
        trackEvent()
      }
    }, 100)
  })
}

// Gestion de la fermeture de page
const handlePageUnload = () => {
  // Envoyer la queue restante avant de fermer
  navigator.sendBeacon?.(
    ANALYTICS_ENDPOINT, 
    JSON.stringify({ events: eventQueue })
  ) || flushQueue()
}

// Gestion de la visibilité de la page
const handleVisibilityChange = () => {
  if (document.visibilityState === 'hidden') {
    flushQueue()
  }
}

// Lifecycle
onMounted(() => {
  // Vérifier si l'analytics est activé (respect de la vie privée)
  const doNotTrack = navigator.doNotTrack === '1' || 
                     window.doNotTrack === '1' || 
                     navigator.msDoNotTrack === '1'
  
  if (doNotTrack) {
    console.debug('Analytics disabled: Do Not Track enabled')
    return
  }
  
  // Vérifier le localStorage pour le consentement
  const analyticsConsent = localStorage.getItem('analytics-consent')
  if (analyticsConsent === 'denied') {
    console.debug('Analytics disabled: User consent denied')
    return
  }
  
  // Démarrer le tracking
  console.debug('Analytics tracking started')
  
  // Tracker la page actuelle
  trackPageView()
  
  // Écouter les changements de route
  trackRouteChange()
  
  // Gestion des événements de fermeture
  window.addEventListener('beforeunload', handlePageUnload)
  window.addEventListener('unload', handlePageUnload)
  document.addEventListener('visibilitychange', handleVisibilityChange)
})

onUnmounted(() => {
  // Nettoyer les listeners
  window.removeEventListener('beforeunload', handlePageUnload)
  window.removeEventListener('unload', handlePageUnload)
  document.removeEventListener('visibilitychange', handleVisibilityChange)
  
  // Vider la queue
  flushQueue()
})

// Exposer une fonction globale pour le consentement manuel
if (typeof window !== 'undefined') {
  window.setAnalyticsConsent = (consent) => {
    localStorage.setItem('analytics-consent', consent ? 'granted' : 'denied')
    if (!consent) {
      // Si le consentement est retiré, vider la queue sans l'envoyer
      eventQueue = []
      if (batchTimer) {
        clearTimeout(batchTimer)
        batchTimer = null
      }
    }
  }
  
  window.getAnalyticsConsent = () => {
    return localStorage.getItem('analytics-consent')
  }
}
</script>

<style scoped>
/* Composant invisible */
</style>