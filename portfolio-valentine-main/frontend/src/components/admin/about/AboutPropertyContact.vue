<template>
  <div class="property">
    <div class="property-row property-title" @click="showDropdown = !showDropdown">
      <!-- Type de contact -->
      <div class="property-field">
        <component :is="currentType.icon" class="property-field__icon"></component>
        <span>{{ currentLabel }}</span>
      </div>

      <!-- Dropdown -->
      <div class="property-dropdown" v-if="showDropdown" @click.stop>
        <div 
          v-for="type in contactTypes"
          :key="type.id"
          class="dropdown-option"
          @click="selectType(type)"
        >
          <component :is="type.icon" class="dropdown-option__icon"></component>
          {{ type.label }}
        </div>
      </div>
    </div>

    <div class="property-row property-content">
      <!-- Contenu du contact -->
      <div class="property-field">
        <input 
          v-model="localData.url"
          @input="onUpdate"
          type="text"
          :placeholder="currentPlaceholder"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, computed, watch } from 'vue';
import type { ContactProperty } from '@/../../shared/types';
import Letter from '@/Icons/letter.vue';
import Phone from '@/Icons/phone.vue';
import Facebook from '@/Icons/social.facebook.vue';
import Instagram from '@/Icons/social.instagram.vue';
import Twitter from '@/Icons/social.twitter.vue';
import LinkedIn from '@/Icons/social.linkedin.vue';
import Globe from '@/Icons/globe.vue';


interface Props {
  data: ContactProperty;
}

interface Emits {
  (e: 'update', data: ContactProperty): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

// Refs
const showDropdown = ref(false);
const selectedType = ref('email');

// Types de contact prédéfinis
const contactTypes = [
  { id: 'email', label: 'Email', icon: Letter,placeholder: 'contact@exemple.com' },
  { id: 'phone', label: 'Phone', icon: Phone, placeholder: '+33 1 23 45 67 89' },
  { id: 'instagram', label: 'Instagram', icon: Instagram, placeholder: '@username' },
  { id: 'facebook', label: 'Facebook', icon: Facebook, placeholder: 'username' },
  { id: 'twitter', label: 'Twitter', icon: Twitter, placeholder: '@username' },
  { id: 'linkedin', label: 'LinkedIn', icon: LinkedIn, placeholder: 'username' },
  { id: 'website', label: 'Website', icon: Globe, placeholder: 'exemple.com' }
];

// Local reactive copy
const localData = reactive<ContactProperty>({
  label: props.data.label || '',
  url: props.data.url || ''
});

// Détecter le type initial
const detectInitialType = () => {
  const url = localData.url.toLowerCase();
  
  if (url.includes('@') || url.startsWith('mailto:')) return 'email';
  if (url.includes('instagram.com')) return 'instagram';
  if (url.includes('facebook.com')) return 'facebook';
  if (url.includes('twitter.com') || url.includes('x.com')) return 'twitter';
  if (url.includes('linkedin.com')) return 'linkedin';
  if (url.match(/^tel:/) || url.match(/^[\+]?[\d\s\-\(\)]+$/)) return 'phone';
  if (url.startsWith('http') || url.includes('.')) return 'website';
  
  return 'email';
};

// Initialiser le type
selectedType.value = detectInitialType();

// Watch for prop changes
watch(() => props.data, (newData) => {
  localData.label = newData.label || '';
  localData.url = newData.url || '';
  selectedType.value = detectInitialType();
}, { deep: true });

// Computed properties
const currentType = computed(() => {
  return contactTypes.find(type => type.id === selectedType.value) || contactTypes[0];
});

const currentLabel = computed(() => localData.label || currentType.value.label);
const currentPlaceholder = computed(() => currentType.value.placeholder);

// Methods
const selectType = (type: any) => {
  selectedType.value = type.id;
  localData.label = type.label;
  
  // Créer automatiquement le lien selon le type
  if (localData.url) {
    const cleanValue = localData.url.replace(/^(mailto:|tel:|https?:\/\/[^\/]+\/)/, '').replace(/^@/, '');
    
    switch (type.id) {
      case 'email':
        localData.url = cleanValue.includes('@') ? cleanValue : '';
        break;
      case 'phone':
        localData.url = cleanValue;
        break;
      case 'instagram':
        localData.url = `https://instagram.com/${cleanValue}`;
        break;
      case 'facebook':
        localData.url = `https://facebook.com/${cleanValue}`;
        break;
      case 'twitter':
        localData.url = `https://twitter.com/${cleanValue}`;
        break;
      case 'linkedin':
        localData.url = `https://linkedin.com/in/${cleanValue}`;
        break;
      case 'website':
        localData.url = cleanValue.startsWith('http') ? cleanValue : `https://${cleanValue}`;
        break;
    }
  }
  
  showDropdown.value = false;
  onUpdate();
};

const onUpdate = () => {
  emit('update', { ...localData });
};

// Fermer le dropdown
document.addEventListener('click', () => {
  
});
</script>

<style scoped lang="scss">
.property-dropdown {
  max-height: 100px;
  overflow-y: auto;
}

.dropdown-option {
  padding: var(--spacing-1) 0;
  cursor: pointer;
  
  &:hover {
    background-color: var(--color-background-secondary);
  }
}

.property-field, .dropdown-option {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);

  &__icon {
    width: var(--spacing-5);
    height: var(--spacing-5);
    color: var(--color-text);
  }
}
  
</style>
