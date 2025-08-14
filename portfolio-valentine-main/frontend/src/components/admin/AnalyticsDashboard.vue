<template>
  <div class="analytics-dashboard">
    <div class="dashboard-header">
      <h1>📊 Analytics Dashboard</h1>
      <p class="dashboard-description">
        Statistiques de visites anonymes et respectueuses de la vie privée
      </p>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Chargement des statistiques...</p>
    </div>

    <!-- Error State -->
    <div v-if="error" class="error-state">
      <div class="error-icon">⚠️</div>
      <h3>Erreur de chargement</h3>
      <p>{{ error }}</p>
      <button @click="loadData" class="retry-btn">Réessayer</button>
    </div>

    <!-- Dashboard Content -->
    <div v-if="!loading && !error" class="dashboard-content">
      
      <!-- Real-time Stats -->
      <div class="stats-section">
        <h2>📈 Temps Réel</h2>
        <div class="stats-grid">
          <div class="stat-card realtime">
            <div class="stat-icon">🔴</div>
            <div class="stat-content">
              <div class="stat-number">{{ realTimeStats.visits_10m || 0 }}</div>
              <div class="stat-label">Dernières 10 min</div>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">📊</div>
            <div class="stat-content">
              <div class="stat-number">{{ realTimeStats.visits_1h || 0 }}</div>
              <div class="stat-label">Dernière heure</div>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">📅</div>
            <div class="stat-content">
              <div class="stat-number">{{ realTimeStats.visits_24h || 0 }}</div>
              <div class="stat-label">Dernières 24h</div>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">👥</div>
            <div class="stat-content">
              <div class="stat-number">{{ realTimeStats.unique_visitors_24h || 0 }}</div>
              <div class="stat-label">Visiteurs uniques 24h</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Period Selection -->
      <div class="period-section">
        <h2>📊 Statistiques par Période</h2>
        <div class="period-controls">
          <select v-model="selectedPeriod" @change="loadStats" class="period-select">
            <option value="7">7 derniers jours</option>
            <option value="30">30 derniers jours</option>
            <option value="90">90 derniers jours</option>
            <option value="365">1 an</option>
          </select>
          <div class="custom-period">
            <input type="date" v-model="customStartDate" class="date-input">
            <span>à</span>
            <input type="date" v-model="customEndDate" class="date-input">
            <button @click="loadCustomStats" class="custom-btn">Appliquer</button>
          </div>
        </div>
      </div>

      <!-- General Stats -->
      <div v-if="stats.general" class="stats-section">
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-icon">👁️</div>
            <div class="stat-content">
              <div class="stat-number">{{ stats.general.total_visits?.toLocaleString() || 0 }}</div>
              <div class="stat-label">Total visites</div>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">🧑‍🤝‍🧑</div>
            <div class="stat-content">
              <div class="stat-number">{{ stats.general.unique_visitors?.toLocaleString() || 0 }}</div>
              <div class="stat-label">Visiteurs uniques</div>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">📆</div>
            <div class="stat-content">
              <div class="stat-number">{{ stats.general.active_days || 0 }}</div>
              <div class="stat-label">Jours avec visites</div>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">📊</div>
            <div class="stat-content">
              <div class="stat-number">{{ averageVisitsPerDay }}</div>
              <div class="stat-label">Visites/jour</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Timeline Chart -->
      <div v-if="stats.timeline?.length" class="chart-section">
        <h3>📈 Évolution des Visites</h3>
        <div class="timeline-chart">
          <div class="chart-container">
            <div v-for="day in stats.timeline" :key="day.date" class="chart-bar">
              <div 
                class="bar-fill"
                :style="{ height: getBarHeight(day.visits) + '%' }"
                :title="`${day.date}: ${day.visits} visites, ${day.unique_visitors} visiteurs uniques`"
              ></div>
              <div class="bar-label">{{ formatDate(day.date) }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Top Pages -->
      <div v-if="stats.topPages?.length" class="data-section">
        <h3>📄 Pages les Plus Visitées</h3>
        <div class="data-list">
          <div v-for="page in stats.topPages" :key="page.page_path" class="data-item">
            <div class="data-content">
              <span class="data-main">{{ page.page_path }}</span>
              <span class="data-sub">{{ page.visits }} visites</span>
            </div>
            <div class="data-bar">
              <div 
                class="data-bar-fill"
                :style="{ width: getPercentage(page.visits, stats.topPages[0].visits) + '%' }"
              ></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Traffic Sources -->
      <div v-if="stats.trafficSources?.length" class="data-section">
        <h3>🔗 Sources de Trafic</h3>
        <div class="data-list">
          <div v-for="source in stats.trafficSources" :key="source.source + source.medium" class="data-item">
            <div class="data-content">
              <span class="data-main">{{ getSourceLabel(source.source, source.medium) }}</span>
              <span class="data-sub">{{ source.visits }} visites</span>
            </div>
            <div class="data-bar">
              <div 
                class="data-bar-fill traffic"
                :style="{ width: getPercentage(source.visits, stats.trafficSources[0].visits) + '%' }"
              ></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Devices -->
      <div v-if="stats.devices?.length" class="data-section">
        <h3>📱 Appareils</h3>
        <div class="data-list">
          <div v-for="device in stats.devices" :key="device.device_type" class="data-item">
            <div class="data-content">
              <span class="data-main">{{ getDeviceIcon(device.device_type) }} {{ getDeviceLabel(device.device_type) }}</span>
              <span class="data-sub">{{ device.visits }} visites</span>
            </div>
            <div class="data-bar">
              <div 
                class="data-bar-fill device"
                :style="{ width: getPercentage(device.visits, stats.devices[0].visits) + '%' }"
              ></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Countries -->
      <div v-if="stats.countries?.length" class="data-section">
        <h3>🌍 Pays</h3>
        <div class="data-list">
          <div v-for="country in stats.countries" :key="country.country" class="data-item">
            <div class="data-content">
              <span class="data-main">{{ getCountryFlag(country.country) }} {{ getCountryLabel(country.country) }}</span>
              <span class="data-sub">{{ country.visits }} visites</span>
            </div>
            <div class="data-bar">
              <div 
                class="data-bar-fill country"
                :style="{ width: getPercentage(country.visits, stats.countries[0].visits) + '%' }"
              ></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Export Section -->
      <div class="export-section">
        <h3>📥 Export des Données</h3>
        <div class="export-controls">
          <p>Exporter les données analytics pour analyse externe (format CSV ou JSON)</p>
          <div class="export-buttons">
            <button @click="exportData('json')" class="export-btn" :disabled="exportLoading">
              {{ exportLoading ? 'Export...' : '📊 Export JSON' }}
            </button>
            <button @click="exportData('csv')" class="export-btn" :disabled="exportLoading">
              {{ exportLoading ? 'Export...' : '📋 Export CSV' }}
            </button>
          </div>
          <small class="export-note">
            Les exports respectent la vie privée : aucune donnée personnelle n'est incluse
          </small>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'

// Reactive data
const loading = ref(true)
const error = ref(null)
const stats = ref({})
const realTimeStats = ref({})
const selectedPeriod = ref('30')
const customStartDate = ref('')
const customEndDate = ref('')
const exportLoading = ref(false)

// Computed
const averageVisitsPerDay = computed(() => {
  if (!stats.value.general || !stats.value.general.active_days) return 0
  return Math.round(stats.value.general.total_visits / stats.value.general.active_days)
})

// Methods
const loadData = async () => {
  loading.value = true
  error.value = null
  
  try {
    await Promise.all([loadRealTimeStats(), loadStats()])
  } catch (err) {
    error.value = err.message || 'Erreur lors du chargement des données'
  } finally {
    loading.value = false
  }
}

const loadRealTimeStats = async () => {
  try {
    const response = await fetch('/api/analytics/realtime', { credentials: 'include' })
    if (response.ok) {
      const data = await response.json()
      realTimeStats.value = data.data || {}
    }
  } catch (err) {
    console.error('Error loading real-time stats:', err)
  }
}

const loadStats = async () => {
  try {
    const response = await fetch(`/api/analytics/stats?period=${selectedPeriod.value}`, { 
      credentials: 'include' 
    })
    if (response.ok) {
      const data = await response.json()
      stats.value = data.data || {}
    } else {
      throw new Error('Erreur lors du chargement des statistiques')
    }
  } catch (err) {
    console.error('Error loading stats:', err)
    throw err
  }
}

const loadCustomStats = async () => {
  if (!customStartDate.value || !customEndDate.value) {
    alert('Veuillez sélectionner une date de début et de fin')
    return
  }
  
  loading.value = true
  try {
    const response = await fetch(
      `/api/analytics/stats?startDate=${customStartDate.value}&endDate=${customEndDate.value}`, 
      { credentials: 'include' }
    )
    if (response.ok) {
      const data = await response.json()
      stats.value = data.data || {}
    } else {
      throw new Error('Erreur lors du chargement des statistiques personnalisées')
    }
  } catch (err) {
    error.value = err.message
  } finally {
    loading.value = false
  }
}

const exportData = async (format) => {
  exportLoading.value = true
  try {
    const params = new URLSearchParams({
      format,
      ...(customStartDate.value && customEndDate.value 
        ? { startDate: customStartDate.value, endDate: customEndDate.value }
        : { period: selectedPeriod.value })
    })
    
    const response = await fetch(`/api/analytics/export?${params}`, { 
      credentials: 'include' 
    })
    
    if (response.ok) {
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `analytics-${new Date().toISOString().split('T')[0]}.${format}`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
      showNotification(`✅ Export ${format.toUpperCase()} téléchargé avec succès`)
    } else {
      throw new Error('Erreur lors de l\'export')
    }
  } catch (err) {
    alert('Erreur: ' + err.message)
  } finally {
    exportLoading.value = false
  }
}

// Helper functions
const getBarHeight = (visits) => {
  const maxVisits = Math.max(...stats.value.timeline.map(d => d.visits))
  return maxVisits > 0 ? (visits / maxVisits) * 100 : 0
}

const getPercentage = (value, max) => {
  return max > 0 ? (value / max) * 100 : 0
}

const formatDate = (dateStr) => {
  const date = new Date(dateStr)
  return date.toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' })
}

const getSourceLabel = (source, medium) => {
  if (source === 'direct') return '🔗 Accès direct'
  if (source === 'google') return '🔍 Google'
  if (source === 'facebook') return '📘 Facebook'
  if (source === 'instagram') return '📸 Instagram'
  if (source === 'twitter') return '🐦 Twitter'
  if (source === 'linkedin') return '💼 LinkedIn'
  if (source === 'referral') return '🔗 Référent'
  return `${source} (${medium})`
}

const getDeviceIcon = (device) => {
  if (device === 'mobile') return '📱'
  if (device === 'tablet') return '📟'
  if (device === 'desktop') return '💻'
  return '❓'
}

const getDeviceLabel = (device) => {
  if (device === 'mobile') return 'Mobile'
  if (device === 'tablet') return 'Tablette'
  if (device === 'desktop') return 'Ordinateur'
  return 'Inconnu'
}

const getCountryFlag = (countryCode) => {
  const flags = {
    'FR': '🇫🇷', 'US': '🇺🇸', 'GB': '🇬🇧', 'DE': '🇩🇪', 'ES': '🇪🇸',
    'IT': '🇮🇹', 'CA': '🇨🇦', 'AU': '🇦🇺', 'JP': '🇯🇵', 'CN': '🇨🇳',
    'BR': '🇧🇷', 'IN': '🇮🇳', 'RU': '🇷🇺', 'MX': '🇲🇽', 'NL': '🇳🇱'
  }
  return flags[countryCode] || '🌍'
}

const getCountryLabel = (countryCode) => {
  const countries = {
    'FR': 'France', 'US': 'États-Unis', 'GB': 'Royaume-Uni', 'DE': 'Allemagne',
    'ES': 'Espagne', 'IT': 'Italie', 'CA': 'Canada', 'AU': 'Australie',
    'JP': 'Japon', 'CN': 'Chine', 'BR': 'Brésil', 'IN': 'Inde',
    'RU': 'Russie', 'MX': 'Mexique', 'NL': 'Pays-Bas'
  }
  return countries[countryCode] || countryCode
}

const showNotification = (message) => {
  const toast = document.createElement('div')
  toast.textContent = message
  toast.style.cssText = `
    position: fixed; top: 20px; right: 20px; z-index: 10000;
    background: #10b981; color: white; padding: 1rem 1.5rem;
    border-radius: 8px; font-weight: 500; box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  `
  document.body.appendChild(toast)
  setTimeout(() => toast.remove(), 3000)
}

// Set default custom dates (last 30 days)
const setDefaultDates = () => {
  const end = new Date()
  const start = new Date()
  start.setDate(start.getDate() - 30)
  
  customEndDate.value = end.toISOString().split('T')[0]
  customStartDate.value = start.toISOString().split('T')[0]
}

// Lifecycle
onMounted(() => {
  setDefaultDates()
  loadData()
  
  // Auto-refresh real-time stats every 2 minutes
  const interval = setInterval(loadRealTimeStats, 120000)
  
  // Cleanup on unmount
  return () => clearInterval(interval)
})
</script>

<style lang="scss" scoped>
@import '../../styles/variables.scss';

.analytics-dashboard {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

.dashboard-header {
  text-align: center;
  margin-bottom: 3rem;
  
  h1 {
    font-size: 2.5rem;
    color: $color-gray-dark;
    margin: 0 0 1rem 0;
  }
  
  .dashboard-description {
    color: $color-gray-medium;
    font-size: 1.1rem;
    margin: 0;
  }
}

.loading-state, .error-state {
  text-align: center;
  padding: 4rem 2rem;
  
  .spinner {
    width: 40px;
    height: 40px;
    border: 4px solid $color-gray-light;
    border-top: 4px solid #3b82f6;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin: 0 auto 1rem;
  }
}

.error-state {
  .error-icon {
    font-size: 3rem;
    margin-bottom: 1rem;
  }
  
  .retry-btn {
    background: #3b82f6;
    color: white;
    border: none;
    padding: 0.75rem 1.5rem;
    border-radius: 6px;
    cursor: pointer;
    font-size: 1rem;
    margin-top: 1rem;
    
    &:hover {
      background: #2563eb;
    }
  }
}

.stats-section, .chart-section, .data-section, .export-section {
  margin-bottom: 3rem;
  
  h2, h3 {
    color: $color-gray-dark;
    margin: 0 0 1.5rem 0;
  }
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
}

.stat-card {
  background: $color-white;
  border: 1px solid $color-gray-light;
  border-radius: 12px;
  padding: 1.5rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  transition: box-shadow 0.2s ease;
  
  &:hover {
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  }
  
  &.realtime {
    border-color: #ef4444;
    background: linear-gradient(135deg, #fef2f2 0%, #fff5f5 100%);
  }
  
  .stat-icon {
    font-size: 2rem;
    flex-shrink: 0;
  }
  
  .stat-number {
    font-size: 2rem;
    font-weight: 700;
    color: $color-gray-dark;
    line-height: 1;
  }
  
  .stat-label {
    color: $color-gray-medium;
    font-size: 0.9rem;
    margin-top: 0.25rem;
  }
}

.period-section {
  margin: 3rem 0;
  
  .period-controls {
    display: flex;
    align-items: center;
    gap: 2rem;
    flex-wrap: wrap;
    
    .period-select {
      padding: 0.5rem 1rem;
      border: 1px solid $color-gray-light;
      border-radius: 6px;
      background: $color-white;
      font-size: 1rem;
    }
    
    .custom-period {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      
      .date-input {
        padding: 0.5rem;
        border: 1px solid $color-gray-light;
        border-radius: 6px;
        font-size: 0.9rem;
      }
      
      .custom-btn {
        background: #3b82f6;
        color: white;
        border: none;
        padding: 0.5rem 1rem;
        border-radius: 6px;
        cursor: pointer;
        font-size: 0.9rem;
        
        &:hover {
          background: #2563eb;
        }
      }
    }
  }
}

.timeline-chart {
  background: $color-white;
  border: 1px solid $color-gray-light;
  border-radius: 12px;
  padding: 2rem;
  
  .chart-container {
    display: flex;
    align-items: end;
    gap: 0.5rem;
    height: 200px;
    padding: 1rem 0;
  }
  
  .chart-bar {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    
    .bar-fill {
      background: linear-gradient(to top, #3b82f6, #60a5fa);
      width: 100%;
      min-height: 2px;
      border-radius: 2px 2px 0 0;
      transition: all 0.3s ease;
      cursor: pointer;
      
      &:hover {
        background: linear-gradient(to top, #2563eb, #3b82f6);
      }
    }
    
    .bar-label {
      font-size: 0.7rem;
      color: $color-gray-medium;
      margin-top: 0.5rem;
      writing-mode: vertical-rl;
      text-orientation: mixed;
    }
  }
}

.data-section {
  background: $color-white;
  border: 1px solid $color-gray-light;
  border-radius: 12px;
  padding: 2rem;
}

.data-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.data-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem;
  background: lighten($color-gray-light, 5%);
  border-radius: 8px;
  
  .data-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    
    .data-main {
      font-weight: 600;
      color: $color-gray-dark;
    }
    
    .data-sub {
      font-size: 0.85rem;
      color: $color-gray-medium;
    }
  }
  
  .data-bar {
    width: 120px;
    height: 8px;
    background: lighten($color-gray-light, 2%);
    border-radius: 4px;
    margin-left: 1rem;
    overflow: hidden;
    
    .data-bar-fill {
      height: 100%;
      border-radius: 4px;
      transition: width 0.8s ease;
      
      &:not(.traffic):not(.device):not(.country) {
        background: #3b82f6;
      }
      
      &.traffic { background: #10b981; }
      &.device { background: #f59e0b; }
      &.country { background: #ef4444; }
    }
  }
}

.export-section {
  background: $color-white;
  border: 1px solid $color-gray-light;
  border-radius: 12px;
  padding: 2rem;
  
  .export-controls {
    p {
      color: $color-gray-medium;
      margin-bottom: 1.5rem;
    }
    
    .export-buttons {
      display: flex;
      gap: 1rem;
      margin-bottom: 1rem;
    }
    
    .export-btn {
      background: #3b82f6;
      color: white;
      border: none;
      padding: 0.75rem 1.5rem;
      border-radius: 6px;
      cursor: pointer;
      font-size: 1rem;
      transition: all 0.2s ease;
      
      &:hover:not(:disabled) {
        background: #2563eb;
      }
      
      &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }
    }
    
    .export-note {
      color: $color-gray-medium;
      font-size: 0.8rem;
    }
  }
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@media (max-width: 768px) {
  .analytics-dashboard {
    padding: 1rem;
  }
  
  .stats-grid {
    grid-template-columns: 1fr;
  }
  
  .period-controls {
    flex-direction: column;
    align-items: stretch;
    
    .custom-period {
      justify-content: center;
    }
  }
  
  .data-item {
    flex-direction: column;
    align-items: stretch;
    gap: 1rem;
    
    .data-bar {
      width: 100%;
      margin-left: 0;
    }
  }
  
  .export-buttons {
    flex-direction: column;
  }
}
</style>