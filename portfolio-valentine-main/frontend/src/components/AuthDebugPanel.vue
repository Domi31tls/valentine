<template>
  <div class="auth-debug-panel">
    <h1>🔍 Debug Authentification</h1>
    
    <!-- Informations instantanées -->
    <div class="debug-section">
      <h2>📊 État actuel</h2>
      <div class="info-grid">
        <div class="info-card">
          <h3>AuthState (Mémoire)</h3>
          <div class="code-block">
            <pre>{{ JSON.stringify(authState, null, 2) }}</pre>
          </div>
        </div>
        
        <div class="info-card">
          <h3>LocalStorage</h3>
          <div class="code-block">
            <pre>{{ storageData }}</pre>
          </div>
        </div>
        
        <div class="info-card">
          <h3>Cookies (via JS)</h3>
          <div class="code-block">
            <pre>{{ cookieData }}</pre>
          </div>
        </div>
      </div>
    </div>

    <!-- Tests manuels -->
    <div class="debug-section">
      <h2>🧪 Tests manuels</h2>
      <div class="button-group">
        <button @click="testApiAuthMe" class="debug-btn primary">
          Test /api/auth/me
        </button>
        <button @click="testForceSync" class="debug-btn primary">
          Test forceSync()
        </button>
        <button @click="testCheckAuth" class="debug-btn">
          Test checkAuth()
        </button>
        <button @click="testLoadStorage" class="debug-btn">
          Test loadStoredAuth()
        </button>
        <button @click="clearAllAuth" class="debug-btn danger">
          Clear All Auth
        </button>
        <button @click="clearAllSessions" class="debug-btn danger">
          Clear All Sessions (Server)
        </button>
      </div>
    </div>

    <!-- Logs en temps réel -->
    <div class="debug-section">
      <h2>📝 Logs</h2>
      <div class="logs-container">
        <div 
          v-for="(log, index) in logs" 
          :key="index" 
          :class="['log-entry', log.type]"
        >
          <span class="log-time">{{ log.timestamp }}</span>
          <span class="log-message">{{ log.message }}</span>
          <div v-if="log.data" class="log-data">
            <pre>{{ JSON.stringify(log.data, null, 2) }}</pre>
          </div>
        </div>
      </div>
      <button @click="clearLogs" class="debug-btn small">Clear Logs</button>
    </div>

    <!-- Actions rapides -->
    <div class="debug-section">
      <h2>⚡ Actions rapides</h2>
      <div class="button-group">
        <a href="/admin/login" class="debug-btn">Aller à Login</a>
        <a href="/admin" class="debug-btn">Aller à Admin</a>
        <button @click="refresh" class="debug-btn">Refresh Data</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useAuth } from '../composables/useAuth';

interface LogEntry {
  timestamp: string;
  type: 'info' | 'success' | 'error' | 'warning';
  message: string;
  data?: any;
}

// État et données
const { authState, checkAuth, loadStoredAuth, clearAuthFromStorage, forceSync } = useAuth();
const logs = ref<LogEntry[]>([]);
const storageData = ref('');
const cookieData = ref('');

// Fonctions de logging
const addLog = (type: LogEntry['type'], message: string, data?: any) => {
  logs.value.unshift({
    timestamp: new Date().toLocaleTimeString(),
    type,
    message,
    data
  });
  
  // Garder seulement les 20 derniers logs
  if (logs.value.length > 20) {
    logs.value = logs.value.slice(0, 20);
  }
};

// Fonction pour lire les cookies
const getCookies = () => {
  const cookies: Record<string, string> = {};
  document.cookie.split(';').forEach(cookie => {
    const [name, value] = cookie.trim().split('=');
    if (name && value) {
      cookies[name] = value;
    }
  });
  return cookies;
};

// Fonction pour lire localStorage
const getStorageData = () => {
  try {
    const authState = localStorage.getItem('portfolio_auth_state');
    const userData = localStorage.getItem('portfolio_user_data');
    
    return {
      auth_state: authState ? JSON.parse(authState) : null,
      user_data: userData ? JSON.parse(userData) : null
    };
  } catch (error) {
    return { error: error.message };
  }
};

// Refresh des données
const refresh = () => {
  storageData.value = JSON.stringify(getStorageData(), null, 2);
  cookieData.value = JSON.stringify(getCookies(), null, 2);
  addLog('info', 'Data refreshed');
};

// Tests manuels
const testApiAuthMe = async () => {
  try {
    addLog('info', 'Testing /api/auth/me...');
    
    const response = await fetch('/api/auth/me', {
      method: 'GET',
      credentials: 'include'
    });
    
    const data = await response.json();
    
    if (response.ok) {
      addLog('success', `/api/auth/me returned ${response.status}`, data);
    } else {
      addLog('error', `/api/auth/me returned ${response.status}`, data);
    }
  } catch (error) {
    addLog('error', 'Failed to test /api/auth/me', error.message);
  }
};

const testForceSync = async () => {
  try {
    addLog('info', 'Testing forceSync()...');
    const result = await forceSync();
    addLog('success', `forceSync() returned: ${result}`, { 
      result, 
      authState: { ...authState } 
    });
    refresh();
  } catch (error) {
    addLog('error', 'forceSync() failed', error.message);
  }
};

const testAuthDebug = async () => {
  try {
    addLog('info', 'Testing /api/auth/debug...');
    
    const response = await fetch('/api/auth/debug', {
      method: 'GET',
      credentials: 'include'
    });
    
    const data = await response.json();
    
    if (response.ok) {
      addLog('success', `/api/auth/debug returned ${response.status}`, data);
    } else {
      addLog('error', `/api/auth/debug returned ${response.status}`, data);
    }
  } catch (error) {
    addLog('error', 'Failed to test /api/auth/debug', error.message);
  }
};

const clearAllSessions = async () => {
  try {
    addLog('info', 'Clearing all sessions on server...');
    
    const response = await fetch('/api/auth/debug/clear-all', {
      method: 'POST',
      credentials: 'include'
    });
    
    const data = await response.json();
    
    if (response.ok) {
      addLog('success', 'All sessions cleared on server', data);
    } else {
      addLog('error', 'Failed to clear sessions on server', data);
    }
    
    refresh();
  } catch (error) {
    addLog('error', 'Failed to clear sessions', error.message);
  }
};

const testCheckAuth = async () => {
  try {
    addLog('info', 'Testing checkAuth()...');
    const result = await checkAuth();
    addLog('success', `checkAuth() returned: ${result}`, { 
      result, 
      authState: { ...authState } 
    });
    refresh();
  } catch (error) {
    addLog('error', 'checkAuth() failed', error.message);
  }
};

const testLoadStorage = () => {
  try {
    addLog('info', 'Testing loadStoredAuth()...');
    const result = loadStoredAuth();
    addLog('success', `loadStoredAuth() returned: ${result}`, { 
      result, 
      authState: { ...authState } 
    });
    refresh();
  } catch (error) {
    addLog('error', 'loadStoredAuth() failed', error.message);
  }
};

const clearAllAuth = () => {
  clearAuthFromStorage();
  authState.isAuthenticated = false;
  authState.user = null;
  authState.error = null;
  
  addLog('warning', 'All auth data cleared');
  refresh();
};

const clearLogs = () => {
  logs.value = [];
};

// Initialisation
onMounted(() => {
  addLog('info', 'Debug panel loaded');
  refresh();
  
  // Auto-refresh toutes les 2 secondes
  setInterval(refresh, 2000);
});
</script>

<style scoped lang="scss">
.auth-debug-panel {
  max-width: 1200px;
  margin: 0 auto;
  
  h1 {
    color: #333;
    margin-bottom: 2rem;
  }
  
  h2 {
    color: #555;
    margin-bottom: 1rem;
    border-bottom: 2px solid #eee;
    padding-bottom: 0.5rem;
  }
  
  h3 {
    color: #666;
    margin-bottom: 0.5rem;
    font-size: 1rem;
  }
}

.debug-section {
  background: white;
  border-radius: 8px;
  padding: 1.5rem;
  margin-bottom: 2rem;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1rem;
}

.info-card {
  border: 1px solid #ddd;
  border-radius: 6px;
  padding: 1rem;
  background: #f8f9fa;
}

.code-block {
  background: #2d3748;
  color: #e2e8f0;
  padding: 1rem;
  border-radius: 4px;
  overflow-x: auto;
  font-family: 'Courier New', monospace;
  font-size: 0.8rem;
  
  pre {
    margin: 0;
    white-space: pre-wrap;
  }
}

.button-group {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.debug-btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
  text-decoration: none;
  display: inline-block;
  text-align: center;
  transition: all 0.2s;
  
  &.primary {
    background: #3182ce;
    color: white;
    
    &:hover {
      background: #2c5aa0;
    }
  }
  
  &.danger {
    background: #e53e3e;
    color: white;
    
    &:hover {
      background: #c53030;
    }
  }
  
  &.small {
    padding: 0.5rem 1rem;
    font-size: 0.875rem;
  }
  
  &:not(.primary):not(.danger) {
    background: #edf2f7;
    color: #4a5568;
    
    &:hover {
      background: #e2e8f0;
    }
  }
}

.logs-container {
  max-height: 400px;
  overflow-y: auto;
  border: 1px solid #ddd;
  border-radius: 6px;
  padding: 1rem;
  background: #f8f9fa;
  margin-bottom: 1rem;
}

.log-entry {
  margin-bottom: 0.5rem;
  padding: 0.5rem;
  border-radius: 4px;
  font-size: 0.875rem;
  
  &.info {
    background: #e6f3ff;
    color: #0366d6;
  }
  
  &.success {
    background: #d4edda;
    color: #155724;
  }
  
  &.error {
    background: #f8d7da;
    color: #721c24;
  }
  
  &.warning {
    background: #fff3cd;
    color: #856404;
  }
}

.log-time {
  font-weight: 600;
  margin-right: 0.5rem;
}

.log-data {
  margin-top: 0.5rem;
  background: #2d3748;
  color: #e2e8f0;
  padding: 0.5rem;
  border-radius: 4px;
  font-family: 'Courier New', monospace;
  font-size: 0.75rem;
  
  pre {
    margin: 0;
    white-space: pre-wrap;
  }
}
</style>
