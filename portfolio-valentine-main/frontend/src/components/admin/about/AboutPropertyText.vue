<template>
  <div class="property">
    <div class="property-row property-title">
      <!-- Titre -->
      <div class="property-field">
        <input 
          v-model="localData.title"
          @input="onUpdate"
          type="text"
          placeholder="Title"
        />
      </div>
    </div>

    <div class="property-row property-content">
      <!-- Contenu -->
      <div class="property-field">
        <textarea 
          v-model="localData.content"
          @input="onUpdate"
          rows="4"
          wrap="soft"
          placeholder="Empty"
        ></textarea>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, watch } from 'vue';
import type { TextProperty } from '@/../../shared/types';

interface Props {
  data: TextProperty;
}

interface Emits {
  (e: 'update', data: TextProperty): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

// Local reactive copy
const localData = reactive<TextProperty>({
  title: props.data.title || '',
  content: props.data.content || ''
});

// Watch for prop changes
watch(() => props.data, (newData) => {
  localData.title = newData.title || '';
  localData.content = newData.content || '';
}, { deep: true });

// Methods
const onUpdate = () => {
  emit('update', { ...localData });
};
</script>
