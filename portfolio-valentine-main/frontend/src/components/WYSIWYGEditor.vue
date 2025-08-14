<template>
  <div class="wysiwyg-editor">
    <div class="editor-toolbar">
      <div class="toolbar-group">
        <button @click="execCommand('bold')" class="toolbar-btn" :class="{ active: isActive('bold') }">
          <strong>B</strong>
        </button>
        <button @click="execCommand('italic')" class="toolbar-btn" :class="{ active: isActive('italic') }">
          <em>I</em>
        </button>
        <button @click="execCommand('underline')" class="toolbar-btn" :class="{ active: isActive('underline') }">
          <u>U</u>
        </button>
      </div>
      
      <div class="toolbar-group">
        <button @click="execCommand('formatBlock', 'h2')" class="toolbar-btn">H2</button>
        <button @click="execCommand('formatBlock', 'h3')" class="toolbar-btn">H3</button>
        <button @click="execCommand('formatBlock', 'p')" class="toolbar-btn">P</button>
      </div>
      
      <div class="toolbar-group">
        <button @click="execCommand('insertUnorderedList')" class="toolbar-btn">
          • Liste
        </button>
        <button @click="execCommand('insertOrderedList')" class="toolbar-btn">
          1. Liste
        </button>
      </div>
      
      <div class="toolbar-group">
        <button @click="insertLink" class="toolbar-btn">
          🔗 Lien
        </button>
        <button @click="execCommand('removeFormat')" class="toolbar-btn">
          🧹 Nettoyer
        </button>
      </div>
      
      <div class="toolbar-group">
        <button @click="toggleView" class="toolbar-btn view-toggle" :class="{ active: showHTML }">
          {{ showHTML ? '👁️ Aperçu' : '💻 HTML' }}
        </button>
      </div>
    </div>
    
    <div class="editor-content">
      <!-- Mode WYSIWYG -->
      <div
        v-show="!showHTML"
        ref="editor"
        class="content-editor"
        contenteditable="true"
        @input="handleInput"
        @keydown="handleKeydown"
        @paste="handlePaste"
        v-html="modelValue"
      ></div>
      
      <!-- Mode HTML -->
      <textarea
        v-show="showHTML"
        v-model="htmlContent"
        @input="updateFromHTML"
        class="html-editor"
        placeholder="Saisissez votre HTML ici..."
      ></textarea>
    </div>
    
    <div class="editor-footer">
      <div class="word-count">
        {{ wordCount }} mots • {{ charCount }} caractères
      </div>
      <div class="editor-tips">
        💡 <strong>Astuce:</strong> Utilisez Ctrl+B pour gras, Ctrl+I pour italique, Ctrl+K pour un lien
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, onMounted } from 'vue';

interface Props {
  modelValue: string;
}

interface Emits {
  (e: 'update:modelValue', value: string): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

// Refs
const editor = ref<HTMLElement>();
const showHTML = ref(false);
const htmlContent = ref(props.modelValue);

// Computed
const wordCount = computed(() => {
  const text = editor.value?.textContent || '';
  return text.trim() ? text.trim().split(/\s+/).length : 0;
});

const charCount = computed(() => {
  return editor.value?.textContent?.length || 0;
});

// Methods
const execCommand = (command: string, value?: string) => {
  document.execCommand(command, false, value);
  editor.value?.focus();
  handleInput();
};

const isActive = (command: string): boolean => {
  return document.queryCommandState(command);
};

const insertLink = () => {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return;
  
  const range = selection.getRangeAt(0);
  const selectedText = range.toString();
  
  const url = prompt('Entrez l\'URL du lien:', 'https://');
  if (!url) return;
  
  if (selectedText) {
    // Il y a du texte sélectionné
    execCommand('createLink', url);
  } else {
    // Pas de texte sélectionné, insérer un nouveau lien
    const linkText = prompt('Texte du lien:', url);
    if (!linkText) return;
    
    const link = document.createElement('a');
    link.href = url;
    link.textContent = linkText;
    link.target = '_blank';
    
    range.insertNode(link);
    selection.removeAllRanges();
  }
  
  handleInput();
};

const handleInput = () => {
  if (editor.value) {
    emit('update:modelValue', editor.value.innerHTML);
  }
};

const handleKeydown = (e: KeyboardEvent) => {
  // Raccourcis clavier
  if (e.ctrlKey || e.metaKey) {
    switch (e.key) {
      case 'b':
        e.preventDefault();
        execCommand('bold');
        break;
      case 'i':
        e.preventDefault();
        execCommand('italic');
        break;
      case 'u':
        e.preventDefault();
        execCommand('underline');
        break;
      case 'k':
        e.preventDefault();
        insertLink();
        break;
    }
  }
  
  // Améliorer l'expérience d'édition
  if (e.key === 'Enter') {
    // Éviter les divs imbriqués
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const currentElement = range.startContainer.parentElement;
      
      if (currentElement?.tagName === 'DIV' && currentElement !== editor.value) {
        e.preventDefault();
        execCommand('formatBlock', 'p');
      }
    }
  }
};

const handlePaste = (e: ClipboardEvent) => {
  e.preventDefault();
  
  const text = e.clipboardData?.getData('text/plain') || '';
  const html = e.clipboardData?.getData('text/html') || '';
  
  if (html && html.includes('<')) {
    // Nettoyer le HTML collé
    const cleanHTML = html
      .replace(/<script[^>]*>.*?<\/script>/gi, '')
      .replace(/<style[^>]*>.*?<\/style>/gi, '')
      .replace(/class="[^"]*"/gi, '')
      .replace(/style="[^"]*"/gi, '')
      .replace(/<span[^>]*>/gi, '')
      .replace(/<\/span>/gi, '');
    
    execCommand('insertHTML', cleanHTML);
  } else {
    execCommand('insertText', text);
  }
};

const toggleView = () => {
  if (showHTML.value) {
    // Passer du mode HTML au mode WYSIWYG
    showHTML.value = false;
    nextTick(() => {
      if (editor.value) {
        editor.value.innerHTML = htmlContent.value;
        editor.value.focus();
      }
    });
  } else {
    // Passer du mode WYSIWYG au mode HTML
    if (editor.value) {
      htmlContent.value = editor.value.innerHTML;
    }
    showHTML.value = true;
  }
};

const updateFromHTML = () => {
  emit('update:modelValue', htmlContent.value);
};

// Lifecycle
onMounted(() => {
  if (editor.value) {
    editor.value.innerHTML = props.modelValue;
  }
});
</script>

<style scoped lang="scss">
@import '../../styles/variables.scss';

.wysiwyg-editor {
  background: $color-white;
  border: 1px solid $color-gray-light;
  border-radius: 12px;
  overflow: hidden;
}

.editor-toolbar {
  background: lighten($color-gray-light, 3%);
  padding: 1rem;
  border-bottom: 1px solid $color-gray-light;
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  
  .toolbar-group {
    display: flex;
    gap: 0.25rem;
    
    .toolbar-btn {
      background: $color-white;
      border: 1px solid $color-gray-light;
      border-radius: 4px;
      padding: 0.5rem 0.75rem;
      font-size: 0.85rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
      
      &:hover {
        background: $color-gray-dark;
        color: $color-white;
        border-color: $color-gray-dark;
      }
      
      &.active {
        background: $color-gray-dark;
        color: $color-white;
        border-color: $color-gray-dark;
      }
      
      &.view-toggle {
        background: lighten($color-gray-light, 2%);
        
        &.active {
          background: #3b82f6;
          border-color: #3b82f6;
        }
      }
    }
  }
}

.editor-content {
  position: relative;
  min-height: 400px;
  
  .content-editor {
    padding: 2rem;
    min-height: 400px;
    outline: none;
    line-height: 1.7;
    font-size: 1rem;
    color: $color-gray-dark;
    
    &:empty::before {
      content: 'Commencez à taper votre contenu ici...';
      color: $color-gray-light;
      pointer-events: none;
    }
    
    // Styles pour le contenu édité
    h1, h2, h3, h4, h5, h6 {
      color: $color-gray-dark;
      font-weight: 600;
      margin: 1.5rem 0 1rem 0;
      
      &:first-child {
        margin-top: 0;
      }
    }
    
    h2 {
      font-size: 1.8rem;
      border-bottom: 2px solid $color-gray-light;
      padding-bottom: 0.5rem;
    }
    
    h3 {
      font-size: 1.4rem;
    }
    
    p {
      margin: 1rem 0;
      
      &:first-child {
        margin-top: 0;
      }
      
      &:last-child {
        margin-bottom: 0;
      }
    }
    
    ul, ol {
      margin: 1rem 0;
      padding-left: 2rem;
      
      li {
        margin: 0.5rem 0;
      }
    }
    
    a {
      color: #3b82f6;
      text-decoration: underline;
      
      &:hover {
        color: #1d4ed8;
      }
    }
    
    strong {
      font-weight: 600;
    }
    
    em {
      font-style: italic;
    }
    
    blockquote {
      border-left: 4px solid $color-gray-light;
      padding-left: 1rem;
      margin: 1.5rem 0;
      color: $color-gray-medium;
      font-style: italic;
    }
    
    code {
      background: lighten($color-gray-light, 3%);
      padding: 0.2rem 0.4rem;
      border-radius: 4px;
      font-family: 'Monaco', 'Menlo', monospace;
      font-size: 0.9rem;
    }
  }
  
  .html-editor {
    width: 100%;
    min-height: 400px;
    padding: 2rem;
    border: none;
    outline: none;
    font-family: 'Monaco', 'Menlo', monospace;
    font-size: 0.9rem;
    line-height: 1.6;
    color: $color-gray-dark;
    background: lighten($color-gray-light, 5%);
    resize: vertical;
  }
}

.editor-footer {
  background: lighten($color-gray-light, 4%);
  padding: 1rem 2rem;
  border-top: 1px solid $color-gray-light;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.85rem;
  
  .word-count {
    color: $color-gray-medium;
    font-weight: 500;
  }
  
  .editor-tips {
    color: $color-gray-medium;
    
    strong {
      color: $color-gray-dark;
    }
  }
}

@media (max-width: 768px) {
  .editor-toolbar {
    padding: 0.75rem;
    gap: 0.5rem;
    
    .toolbar-group {
      .toolbar-btn {
        padding: 0.4rem 0.6rem;
        font-size: 0.8rem;
      }
    }
  }
  
  .editor-content {
    .content-editor, .html-editor {
      padding: 1.5rem;
    }
  }
  
  .editor-footer {
    flex-direction: column;
    gap: 0.5rem;
    align-items: flex-start;
    
    .editor-tips {
      font-size: 0.8rem;
    }
  }
}
</style>
