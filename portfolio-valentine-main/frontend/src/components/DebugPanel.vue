<template>
  <div class="debug-panel">
    <!-- Header -->
    <div class="debug-header">
      <div class="container">
        <h1>🛠️ Debug Panel</h1>
        <p>Portfolio Valentine Arnaly - Development Dashboard</p>
        <div class="debug-actions">
          <button @click="refreshData" class="btn btn-primary" :disabled="loading">
            {{ loading ? '🔄 Loading...' : '🔄 Refresh' }}
          </button>
          <button @click="toggleAutoRefresh" class="btn btn-secondary">
            {{ autoRefresh ? '⏸️ Stop Auto' : '▶️ Start Auto' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading && !debugData" class="loading-state">
      <div class="container">
        <div class="loading-spinner">
          <div class="spinner"></div>
          <p>Loading debug data...</p>
        </div>
      </div>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="error-state">
      <div class="container">
        <div class="error-message">
          <h3>❌ Error Loading Debug Data</h3>
          <p>{{ error }}</p>
          <button @click="refreshData" class="btn btn-primary">Try Again</button>
        </div>
      </div>
    </div>

    <!-- Debug Content -->
    <div v-else-if="debugData" class="debug-content">
      <div class="container">
        
        <!-- Stats Grid -->
        <div class="stats-grid">
          <div class="stat-card">
            <h3>📊 System Status</h3>
            <div class="stat-item">
              <span>Database</span>
              <span class="stat-value">
                <span 
                  class="status-indicator" 
                  :class="debugData.database.connected ? 'status-ok' : 'status-error'"
                ></span>
                {{ debugData.database.connected ? 'Connected' : 'Disconnected' }}
              </span>
            </div>
            <div class="stat-item">
              <span>Node.js</span>
              <span class="stat-value">{{ debugData.system.node_version }}</span>
            </div>
            <div class="stat-item">
              <span>Platform</span>
              <span class="stat-value">{{ debugData.system.platform }} {{ debugData.system.arch }}</span>
            </div>
            <div class="stat-item">
              <span>Uptime</span>
              <span class="stat-value">{{ formatUptime(debugData.system.uptime) }}</span>
            </div>
          </div>

          <div class="stat-card">
            <h3>💾 Database Stats</h3>
            <div class="stat-item">
              <span>Size</span>
              <span class="stat-value">{{ debugData.database.size_mb }} MB</span>
            </div>
            <div class="stat-item">
              <span>Tables</span>
              <span class="stat-value">{{ debugData.database.tables?.length || 0 }}</span>
            </div>
            <div v-for="table in debugData.database.tables" :key="table.name" class="stat-item">
              <span>{{ table.name }}</span>
              <span class="stat-value">{{ table.count }}</span>
            </div>
          </div>

          <div class="stat-card">
            <h3>📈 Content Stats</h3>
            <div class="stat-item">
              <span>Projects</span>
              <span class="stat-value">
                {{ debugData.counts.projects.total }} 
                ({{ debugData.counts.projects.published }} published)
              </span>
            </div>
            <div class="stat-item">
              <span>Retouches</span>
              <span class="stat-value">
                {{ debugData.counts.retouches.total }} 
                ({{ debugData.counts.retouches.published }} published)
              </span>
            </div>
            <div class="stat-item">
              <span>Media</span>
              <span class="stat-value">{{ debugData.counts.media.total }}</span>
            </div>
            <div class="stat-item">
              <span>Users</span>
              <span class="stat-value">{{ debugData.counts.users.total }}</span>
            </div>
          </div>

          <div class="stat-card">
            <h3>🖥️ Memory Usage</h3>
            <div class="stat-item">
              <span>Heap Used</span>
              <span class="stat-value">{{ debugData.system.memory.used }} MB</span>
            </div>
            <div class="stat-item">
              <span>Heap Total</span>
              <span class="stat-value">{{ debugData.system.memory.total }} MB</span>
            </div>
            <div class="stat-item">
              <span>External</span>
              <span class="stat-value">{{ debugData.system.memory.external }} MB</span>
            </div>
          </div>
        </div>

        <!-- API Endpoints -->
        <div class="endpoints-section">
          <h2>🔗 API Endpoints</h2>
          <div class="endpoints-grid">
            <div v-for="category in debugData.endpoints" :key="category.category" class="endpoint-category">
              <h3>{{ category.category }}</h3>
              <div class="endpoint-list">
                <div 
                  v-for="route in category.routes" 
                  :key="route.path"
                  class="endpoint-item"
                  @click="testEndpoint(route.method, route.path)"
                >
                  <span class="method" :class="route.method">{{ route.method }}</span>
                  <span class="endpoint-path">{{ route.path }}</span>
                  <span class="endpoint-description">{{ route.description }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Sample Data -->
        <div class="sample-data-section">
          <h2>🧪 Sample Data</h2>
          <div class="sample-grid">
            <div class="sample-item">
              <h4>Recent Projects</h4>
              <pre>{{ JSON.stringify(debugData.sample_data.projects, null, 2) }}</pre>
            </div>
            <div class="sample-item">
              <h4>Recent Media</h4>
              <pre>{{ JSON.stringify(debugData.sample_data.media, null, 2) }}</pre>
            </div>
            <div class="sample-item">
              <h4>Configuration</h4>
              <pre>{{ JSON.stringify(debugData.configuration, null, 2) }}</pre>
            </div>
          </div>
        </div>

        <!-- Timestamp -->
        <div class="timestamp">
          <p>Generated at: {{ new Date(debugData.timestamp).toLocaleString() }}</p>
          <p v-if="autoRefresh">Auto-refresh: {{ autoRefreshCountdown }}s</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';

// État réactif
const debugData = ref<any>(null);
const loading = ref(false);
const error = ref<string | null>(null);
const autoRefresh = ref(false);
const autoRefreshCountdown = ref(30);

// Timers
let refreshTimer: NodeJS.Timeout | null = null;
let countdownTimer: NodeJS.Timeout | null = null;

/**
 * Récupérer les données de debug depuis l'API
 */
async function fetchDebugData() {
  try {
    loading.value = true;
    error.value = null;
    
    const response = await fetch('/api/debug');
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const result = await response.json();
    
    if (result.success) {
      debugData.value = result.data;
    } else {
      throw new Error(result.error || 'Unknown error');
    }
    
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to fetch debug data';
    console.error('Debug data fetch error:', err);
  } finally {
    loading.value = false;
  }
}

/**
 * Rafraîchir les données manuellement
 */
async function refreshData() {
  await fetchDebugData();
}

/**
 * Basculer l'auto-refresh
 */
function toggleAutoRefresh() {
  autoRefresh.value = !autoRefresh.value;
  
  if (autoRefresh.value) {
    startAutoRefresh();
  } else {
    stopAutoRefresh();
  }
}

/**
 * Démarrer l'auto-refresh
 */
function startAutoRefresh() {
  stopAutoRefresh(); // Nettoyer les timers existants
  
  autoRefreshCountdown.value = 30;
  
  // Timer pour le refresh
  refreshTimer = setInterval(async () => {
    await fetchDebugData();
    autoRefreshCountdown.value = 30;
  }, 30000);
  
  // Timer pour le countdown
  countdownTimer = setInterval(() => {
    autoRefreshCountdown.value--;
    if (autoRefreshCountdown.value <= 0) {
      autoRefreshCountdown.value = 30;
    }
  }, 1000);
}

/**
 * Arrêter l'auto-refresh
 */
function stopAutoRefresh() {
  if (refreshTimer) {
    clearInterval(refreshTimer);
    refreshTimer = null;
  }
  
  if (countdownTimer) {
    clearInterval(countdownTimer);
    countdownTimer = null;
  }
}

/**
 * Tester un endpoint
 */
function testEndpoint(method: string, path: string) {
  const baseUrl = '';
  const url = '/api' + path;
  
  if (method === 'GET') {
    window.open(url, '_blank');
  } else {
    navigator.clipboard.writeText(url).then(() => {
      alert(`URL copied to clipboard: ${url}`);
    });
  }
}

/**
 * Formater l'uptime
 */
function formatUptime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  } else {
    return `${minutes}m`;
  }
}

// Lifecycle
onMounted(() => {
  fetchDebugData();
});

onUnmounted(() => {
  stopAutoRefresh();
});
</script>

<style lang="scss" scoped>
.debug-panel {
  min-height: 100vh;
  background-color: $color-gray-lightest;
}

.debug-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: $space-16 0;
  text-align: center;
  
  h1 {
    font-size: 2.5rem;
    margin-bottom: $space-2;
  }
  
  p {
    font-size: 1.2rem;
    opacity: 0.9;
    margin-bottom: $space-6;
  }
}

.debug-actions {
  display: flex;
  gap: $space-4;
  justify-content: center;
  flex-wrap: wrap;
}

.loading-state, .error-state {
  padding: $space-16 0;
  text-align: center;
}

.loading-spinner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: $space-4;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid $color-gray-lighter;
  border-top: 4px solid $primary;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error-message {
  background: white;
  padding: $space-8;
  border-radius: $border-radius-lg;
  border-left: 4px solid #dc3545;
  max-width: 500px;
  margin: 0 auto;
}

.debug-content {
  padding: $space-8 0;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: $space-6;
  margin-bottom: $space-12;
}

.stat-card {
  background: white;
  padding: $space-8;
  border-radius: $border-radius-lg;
  box-shadow: $shadow;
  border-left: 4px solid #667eea;
  
  h3 {
    color: #667eea;
    margin-bottom: $space-4;
    font-size: 1.3rem;
  }
}

.stat-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: $space-2 0;
  border-bottom: 1px solid $color-gray-lightest;
  
  &:last-child {
    border-bottom: none;
  }
}

.stat-value {
  font-weight: $font-weight-semibold;
  color: $text-primary;
  display: flex;
  align-items: center;
  gap: $space-2;
}

.status-indicator {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  
  &.status-ok {
    background-color: #22c55e;
  }
  
  &.status-error {
    background-color: #dc3545;
  }
}

.endpoints-section {
  margin-bottom: $space-12;
  
  h2 {
    text-align: center;
    margin-bottom: $space-8;
    font-size: 2rem;
  }
}

.endpoints-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: $space-6;
}

.endpoint-category {
  background: white;
  border-radius: $border-radius-lg;
  overflow: hidden;
  box-shadow: $shadow;
  
  h3 {
    background: #667eea;
    color: white;
    padding: $space-4;
    margin: 0;
    font-size: 1.2rem;
  }
}

.endpoint-list {
  padding: 0;
}

.endpoint-item {
  display: flex;
  align-items: center;
  padding: $space-3 $space-4;
  border-bottom: 1px solid $color-gray-lightest;
  cursor: pointer;
  transition: background-color $transition-fast;
  
  &:hover {
    background-color: $color-gray-lightest;
  }
  
  &:last-child {
    border-bottom: none;
  }
}

.method {
  font-weight: $font-weight-bold;
  padding: $space-1 $space-2;
  border-radius: $border-radius;
  font-size: $font-size-xs;
  margin-right: $space-3;
  min-width: 50px;
  text-align: center;
  
  &.GET {
    background: #28a745;
    color: white;
  }
  
  &.POST {
    background: #007bff;
    color: white;
  }
  
  &.PUT {
    background: #ffc107;
    color: black;
  }
  
  &.DELETE {
    background: #dc3545;
    color: white;
  }
}

.endpoint-path {
  font-family: 'Courier New', monospace;
  font-weight: $font-weight-medium;
  margin-right: $space-3;
  min-width: 200px;
  font-size: $font-size-sm;
}

.endpoint-description {
  color: $text-secondary;
  flex: 1;
  font-size: $font-size-sm;
}

.sample-data-section {
  margin-bottom: $space-12;
  
  h2 {
    text-align: center;
    margin-bottom: $space-8;
    font-size: 1.8rem;
  }
}

.sample-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: $space-6;
}

.sample-item {
  background: white;
  padding: $space-6;
  border-radius: $border-radius-lg;
  box-shadow: $shadow;
  
  h4 {
    color: #667eea;
    margin-bottom: $space-4;
  }
  
  pre {
    background: $color-gray-lightest;
    padding: $space-4;
    border-radius: $border-radius;
    overflow-x: auto;
    font-size: $font-size-sm;
    line-height: 1.4;
  }
}

.timestamp {
  text-align: center;
  padding: $space-6;
  background: white;
  border-radius: $border-radius-lg;
  color: $text-secondary;
  box-shadow: $shadow;
  
  p {
    margin-bottom: $space-2;
    
    &:last-child {
      margin-bottom: 0;
    }
  }
}

// Responsive
@media (max-width: $breakpoint-md) {
  .debug-actions {
    flex-direction: column;
    align-items: center;
  }
  
  .endpoints-grid,
  .sample-grid {
    grid-template-columns: 1fr;
  }
  
  .endpoint-item {
    flex-direction: column;
    align-items: flex-start;
    gap: $space-2;
  }
  
  .endpoint-path {
    min-width: unset;
  }
}
</style>
