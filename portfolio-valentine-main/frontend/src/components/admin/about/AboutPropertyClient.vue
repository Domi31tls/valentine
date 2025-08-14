<template>
  <div class="property">
    <div class="property-row property-title">
      <!-- Nom du client -->
      <div class="property-field">
        <input 
          v-model="localData.name"
          @input="onUpdate"
          type="text"
          placeholder="Title"
        />
      </div>
    </div>

    <div class="property-row property-content" @click="handleContentClick">
      <!-- Contenu logo -->
      <div class="property-field">
        <div v-if="localData.logo_url" class="logo-preview">
          <img :src="localData.logo_url" :alt="localData.name" />
        </div>
        <span v-else class="empty-text">Empty</span>
      </div>

      <!-- Dropdown -->
      <div class="property-dropdown" v-if="showDropdown" @click.stop>
        <div class="dropdown-option" @click="handleUploadClick" :disabled="isUploading">
          <span class="option-icon">🖼️</span>
          {{ isUploading ? 'Uploading...' : 'Upload an image' }}
        </div>
        <div class="dropdown-option paste-option" @click="showPasteInput = true">
          or ⌘+V to paste an image link
        </div>
        <div v-if="localData.logo_url" class="dropdown-option remove-option" @click="removeLogo">
          Remove
        </div>
        
        <!-- Input pour coller URL -->
        <div v-if="showPasteInput" class="paste-input">
          <input 
            v-model="pasteUrl"
            @keydown.enter="applyPasteUrl"
            @keydown.escape="cancelPaste"
            type="url"
            placeholder="Paste image URL..."
            ref="pasteInputRef"
          />
        </div>
      </div>
    </div>

    <!-- Input file caché -->
    <input 
      ref="fileInput"
      type="file"
      accept="image/*"
      @change="onFileSelected"
      style="display: none"
    />
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, watch, nextTick, onMounted, onUnmounted } from 'vue';
import { useApi } from '@/composables/useApi';
import type { ClientProperty } from '@/../../shared/types';

interface Props {
  data: ClientProperty;
}

interface Emits {
  (e: 'update', data: ClientProperty): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

// Refs
const showDropdown = ref(false);
const showPasteInput = ref(false);
const fileInput = ref<HTMLInputElement | null>(null);
const pasteInputRef = ref<HTMLInputElement | null>(null);
const isUploading = ref(false);
const pasteUrl = ref('');

// Local reactive copy
const localData = reactive<ClientProperty>({
  name: props.data.name || '',
  logo_url: props.data.logo_url || '',
  website_url: props.data.website_url || ''
});

// API composable
const { postData } = useApi();

// Watch for prop changes
watch(() => props.data, (newData) => {
  localData.name = newData.name || '';
  localData.logo_url = newData.logo_url || '';
  localData.website_url = newData.website_url || '';
}, { deep: true });

// Watch showPasteInput pour focus
watch(showPasteInput, async (show) => {
  if (show) {
    await nextTick();
    pasteInputRef.value?.focus();
  }
});

// Methods
const onUpdate = () => {
  emit('update', { ...localData });
};

const handleContentClick = () => {
  console.log('Content clicked! Current showDropdown:', showDropdown.value);
  showDropdown.value = !showDropdown.value;
  console.log('New showDropdown:', showDropdown.value);
};

const handleUploadClick = (event: Event) => {
  
  event.preventDefault();
  event.stopPropagation();
  
  triggerFileInput();
};

const triggerFileInput = () => {
  console.log('triggerFileInput called');
  showDropdown.value = false;
  
  if (fileInput.value) {
    console.log('Clicking file input...');
    fileInput.value.click();
  } else {
    console.error('fileInput.value is null!');
  }
};

const onFileSelected = async (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  
  if (!file) return;

  // Validation
  if (file.size > 2 * 1024 * 1024) {
    alert('Le fichier est trop volumineux (max 2MB)');
    return;
  }

  if (!file.type.startsWith('image/')) {
    alert('Seuls les fichiers image sont acceptés');
    return;
  }

  try {
    isUploading.value = true;
    console.log('Starting upload...'); // Debug
    
    // Créer FormData pour multer
    const formData = new FormData();
    formData.append('file', file);
    formData.append('caption', `Logo du client ${localData.name || ''}`);
    formData.append('alt', `Logo ${localData.name || 'client'}`);

    // Upload via API upload route
    const response = await postData('/api/media/upload', formData);
    
    console.log('Upload response:', response); // Debug
    
    if (response.success && response.data) {
      localData.logo_url = response.data.url;
      onUpdate();
      console.log('Upload successful, logo URL:', response.data.url); // Debug
    } else {
      console.error('Upload failed:', response);
      alert('Erreur lors de l\'upload du logo');
    }
  } catch (error) {
    console.error('Upload error:', error);
    alert('Erreur lors de l\'upload');
  } finally {
    isUploading.value = false;
    // Reset file input
    if (target) target.value = '';
  }
};

const applyPasteUrl = () => {
  const url = pasteUrl.value.trim();
  if (url) {
    localData.logo_url = url;
    onUpdate();
  }
  pasteUrl.value = '';
  showPasteInput.value = false;
  showDropdown.value = false;
};

const cancelPaste = () => {
  pasteUrl.value = '';
  showPasteInput.value = false;
};

const removeLogo = () => {
  localData.logo_url = '';
  onUpdate();
  showDropdown.value = false;
};

// Gestion intelligente des clics extérieurs
const handleOutsideClick = (event: Event) => {
  const target = event.target as HTMLElement;
  
  // Ne pas fermer si on clique dans le dropdown ou sur le trigger
  if (!target.closest('.property-dropdown') && !target.closest('.property-content')) {
    showDropdown.value = false;
    showPasteInput.value = false;
  }
};

// Lifecycle
onMounted(() => {
  document.addEventListener('click', handleOutsideClick);
});

onUnmounted(() => {
  document.removeEventListener('click', handleOutsideClick);
});
</script>

<style scoped lang="scss">
.logo-preview {
  display: flex;
  align-items: center;
  
  img {
    width: 24px;
    height: 24px;
    object-fit: contain;
    border-radius: var(--border-radius-xs);
  }
}

.empty-text {
  color: var(--color-text-tertiary);
  font-style: italic;
}

.dropdown-option {
  padding: var(--spacing-2);
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
  pointer-events: all !important;
  
  &:hover:not(:disabled) {
    background-color: var(--color-background-secondary);
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
  
  &.paste-option {
    color: var(--color-text-secondary);
    font-size: 0.9em;
    padding: var(--spacing-1) var(--spacing-2);
  }
  
  &.remove-option {
    color: var(--color-text-secondary);
  }
  
  .option-icon {
    font-size: 1.2em;
  }
}

.paste-input {
  margin-top: var(--spacing-2);
  
  input {
    width: 100%;
    padding: var(--spacing-1);
    border: 1px solid var(--color-background-secondary);
    border-radius: var(--border-radius-s);
  }
}
</style>
