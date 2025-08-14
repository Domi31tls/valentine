<template>
  <div class="seo-sections">
    <!-- Sitemap Section -->
    <div class="seo-card">
      <div class="card-header">
        <h3>🗺️ Sitemap</h3>
        <p>Helps the search engines to discover and index all the pages.</p>
      </div>
      <div class="card-content">
        <a href="/sitemap.xml" target="_blank" class="btn-primary">See Sitemap</a>
      </div>
    </div>

    <!-- Visibility Section -->
    <div class="seo-card">
      <div class="card-header">
        <h3>👁️ Visibility</h3>
        <p>Indicate your visibility for Google and Search Engine</p>
      </div>
      <div class="card-content">
        <div class="visibility-options">
          <label class="radio-option" :class="{ active: visibility === 'everyone' }">
            <input type="radio" v-model="visibility" value="everyone" @change="updateVisibility" />
            <span class="radio-content">
              <strong>Everyone</strong>
              <small>Visible to all</small>
            </span>
          </label>
          
          <label class="radio-option" :class="{ active: visibility === 'secured' }">
            <input type="radio" v-model="visibility" value="secured" @change="updateVisibility" />
            <span class="radio-content">
              <strong>Secured</strong>
              <small>Robots can't see admin</small>
            </span>
          </label>
          
          <label class="radio-option" :class="{ active: visibility === 'invisible' }">
            <input type="radio" v-model="visibility" value="invisible" @change="updateVisibility" />
            <span class="radio-content">
              <strong>Invisible</strong>
              <small>Completely hidden</small>
            </span>
          </label>
        </div>
      </div>
    </div>

    <!-- Verification Codes Section -->
    <div class="seo-card">
      <div class="card-header">
        <h3>🔍 Google Search Console</h3>
        <p>Confirms ownership of your website, allowing you to access valuable insights and data.</p>
      </div>
      <div class="card-content">
        <input 
          type="text" 
          v-model="verificationCodes.google" 
          @input="markAsChanged"
          placeholder="Enter Google verification code"
          class="verification-input"
        />
      </div>
    </div>

    <div class="seo-card">
      <div class="card-header">
        <h3>📘 Facebook Pixel</h3>
        <p>Track user interactions on your website, enabling you to gather essential data.</p>
      </div>
      <div class="card-content">
        <input 
          type="text" 
          v-model="verificationCodes.facebook" 
          @input="markAsChanged"
          placeholder="Enter Facebook Pixel code"
          class="verification-input"
        />
      </div>
    </div>

    <div class="seo-card">
      <div class="card-header">
        <h3>📌 Pinterest</h3>
        <p>Confirms your website's authenticity, enhancing your brand's credibility.</p>
      </div>
      <div class="card-content">
        <input 
          type="text" 
          v-model="verificationCodes.pinterest" 
          @input="markAsChanged"
          placeholder="Enter Pinterest verification code"
          class="verification-input"
        />
      </div>
    </div>

    <!-- Legal Pages Section -->
    <div class="seo-card">
      <div class="card-header">
        <h3>⚖️ Legal Notice</h3>
        <p>Edit and manage your Legal Notice</p>
      </div>
      <div class="card-content">
        <a href="/admin/editor/mentions-legales" class="btn-secondary">Edit</a>
      </div>
    </div>

    <div class="seo-card">
      <div class="card-header">
        <h3>📝 Colophon</h3>
        <p>Edit and manage your Colophon</p>
      </div>
      <div class="card-content">
        <a href="/admin/editor/colophon" class="btn-secondary">Edit</a>
      </div>
    </div>

    <!-- Save Button -->
    <div class="save-section" v-if="hasChanges">
      <button @click="saveSettings" :disabled="isSaving" class="btn-primary save-btn">
        {{ isSaving ? 'Saving...' : 'Save Changes' }}
      </button>
    </div>

  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

// Reactive data
const visibility = ref('everyone')
const verificationCodes = ref({
  google: '',
  facebook: '',
  pinterest: ''
})
const hasChanges = ref(false)
const isSaving = ref(false)

// Methods
const loadSettings = async () => {
  try {
    const response = await fetch('/api/seo/settings', { credentials: 'include' })
    if (response.ok) {
      const data = await response.json()
      if (data.success && data.data) {
        // Map database values to frontend values
        const modeMap = {
          'allow_all': 'everyone',
          'protect_admin': 'secured',
          'block_all': 'invisible'
        }
        visibility.value = modeMap[data.data.robots_mode] || 'everyone'
        verificationCodes.value.google = data.data.google_verification || ''
        verificationCodes.value.facebook = data.data.facebook_verification || ''
        verificationCodes.value.pinterest = data.data.pinterest_verification || ''
      }
    }
  } catch (err) {
    console.error('Error loading settings:', err)
  }
}

const updateVisibility = async () => {
  markAsChanged()
  try {
    await fetch('/api/seo/robots', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ mode: visibility.value })
    })
  } catch (err) {
    console.error('Error updating robots.txt:', err)
  }
}

const saveSettings = async () => {
  try {
    isSaving.value = true
    
    // Map frontend values to database values
    const modeMap = {
      'everyone': 'allow_all',
      'secured': 'protect_admin',
      'invisible': 'block_all'
    }
    
    const settings = {
      robots_mode: modeMap[visibility.value] || 'allow_all',
      google_verification: verificationCodes.value.google,
      facebook_verification: verificationCodes.value.facebook,
      pinterest_verification: verificationCodes.value.pinterest
    }
    
    const response = await fetch('/api/seo/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(settings)
    })
    
    if (response.ok) {
      hasChanges.value = false
      showNotification('✅ Settings saved successfully!')
    } else {
      throw new Error('Failed to save settings')
    }
  } catch (err) {
    alert('Error: ' + err.message)
  } finally {
    isSaving.value = false
  }
}


const markAsChanged = () => {
  hasChanges.value = true
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

// Mount
onMounted(() => {
  loadSettings()
})
</script>

<style lang="scss" scoped>
@import '../../styles/variables.scss';

.seo-sections {
  display: grid;
  gap: 1.5rem;
  margin-top: 2rem;
}

.seo-card {
  background: $color-white;
  border: 1px solid $color-gray-light;
  border-radius: 12px;
  overflow: hidden;
  transition: box-shadow 0.2s ease;
  
  &:hover {
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  }
  
  .card-header {
    padding: 1.5rem;
    border-bottom: 1px solid $color-gray-light;
    background: lighten($color-gray-light, 5%);
    
    h3 {
      margin: 0 0 0.5rem 0;
      font-size: 1.2rem;
      color: $color-gray-dark;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    
    p {
      margin: 0;
      color: $color-gray-medium;
      font-size: 0.9rem;
      line-height: 1.4;
    }
  }
  
  .card-content {
    padding: 1.5rem;
  }
}

.visibility-options {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  
  .radio-option {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 1rem;
    border: 2px solid $color-gray-light;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s ease;
    
    &:hover {
      border-color: $color-gray-medium;
      background: lighten($color-gray-light, 3%);
    }
    
    &.active {
      border-color: #3b82f6;
      background: rgba(59, 130, 246, 0.05);
    }
    
    input[type="radio"] {
      margin: 0;
    }
    
    .radio-content {
      flex: 1;
      
      strong {
        display: block;
        color: $color-gray-dark;
        font-size: 1rem;
        margin-bottom: 0.25rem;
      }
      
      small {
        color: $color-gray-medium;
        font-size: 0.85rem;
      }
    }
  }
}

.verification-input {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 2px solid $color-gray-light;
  border-radius: 8px;
  font-size: 0.95rem;
  transition: border-color 0.2s ease;
  
  &:focus {
    outline: none;
    border-color: #3b82f6;
  }
  
  &::placeholder {
    color: $color-gray-medium;
  }
}

.btn-primary, .btn-secondary {
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-weight: 600;
  text-decoration: none;
  display: inline-block;
  transition: all 0.2s ease;
  cursor: pointer;
  border: none;
  font-size: 0.95rem;
}

.btn-primary {
  background: #3b82f6;
  color: white;
  
  &:hover:not(:disabled) {
    background: #2563eb;
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
}

.btn-secondary {
  background: $color-gray-light;
  color: $color-gray-dark;
  border: 1px solid $color-gray-medium;
  
  &:hover {
    background: $color-gray-medium;
  }
}

.save-section {
  position: sticky;
  bottom: 2rem;
  text-align: center;
  margin-top: 2rem;
  
  .save-btn {
    font-size: 1rem;
    padding: 1rem 2rem;
    box-shadow: 0 4px 20px rgba(59, 130, 246, 0.3);
  }
}


@media (max-width: 768px) {
  .visibility-options .radio-option {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
  
  .editor-modal-content {
    width: 95%;
    max-height: 90vh;
  }
  
  .editor-actions {
    flex-direction: column;
    gap: 1rem;
  }
}
</style>