<template>
  <div class="substack-editor">
    <!-- Top Navigation Bar -->
    <div class="top-nav">
      <div class="nav-left">
        <button @click="goBack" class="nav-btn">
          ← Retour
        </button>
      </div>
      
      <div class="nav-center">
        <div class="save-status" :class="saveStatusClass">
          {{ saveStatusText }}
        </div>
      </div>
      
      <div class="nav-right">
        <button @click="openPreview" class="nav-btn secondary">
          👁️ Aperçu
        </button>
        <button @click="publish" class="nav-btn primary" :disabled="!hasChanges && isPublished">
          {{ isPublished ? '✓ Publié' : '📤 Publier' }}
        </button>
      </div>
    </div>

    <!-- Editor Header Toolbar -->
    <div class="editor-header">
      <div class="toolbar-section">
        <!-- Undo/Redo -->
        <div class="toolbar-group">
          <button @click="undo" class="toolbar-btn" title="Annuler (Ctrl+Z)">
            ↶
          </button>
          <button @click="redo" class="toolbar-btn" title="Rétablir (Ctrl+Shift+Z)">
            ↷
          </button>
        </div>

        <div class="toolbar-divider"></div>

        <!-- Style Dropdown -->
        <div class="toolbar-group">
          <select @change="formatBlock($event.target.value)" class="style-dropdown">
            <option value="">Style</option>
            <option value="p">Texte normal</option>
            <option value="h1">Titre 1</option>
            <option value="h2">Titre 2</option>
            <option value="h3">Titre 3</option>
            <option value="h4">Titre 4</option>
            <option value="blockquote">Citation</option>
          </select>
        </div>

        <div class="toolbar-divider"></div>

        <!-- Text Formatting -->
        <div class="toolbar-group">
          <button @click="formatText('bold')" class="toolbar-btn" :class="{active: isActive('bold')}" title="Gras (Ctrl+B)">
            <strong>B</strong>
          </button>
          <button @click="formatText('italic')" class="toolbar-btn" :class="{active: isActive('italic')}" title="Italique (Ctrl+I)">
            <em>I</em>
          </button>
          <button @click="formatText('underline')" class="toolbar-btn" :class="{active: isActive('underline')}" title="Souligner (Ctrl+U)">
            <u>U</u>
          </button>
          <button @click="formatText('strikeThrough')" class="toolbar-btn" :class="{active: isActive('strikeThrough')}" title="Barrer (Ctrl+Shift+X)">
            <s>S</s>
          </button>
        </div>

        <div class="toolbar-divider"></div>

        <!-- Links & Media -->
        <div class="toolbar-group">
          <button @click="createLink" class="toolbar-btn" title="Lien (Ctrl+K)">
            🔗
          </button>
          <button @click="insertImage" class="toolbar-btn" title="Insérer image">
            🖼️
          </button>
          <button @click="insertQuote" class="toolbar-btn" title="Insérer citation">
            💬
          </button>
        </div>

        <div class="toolbar-divider"></div>

        <!-- Lists -->
        <div class="toolbar-group">
          <button @click="formatText('insertUnorderedList')" class="toolbar-btn" :class="{active: isActive('insertUnorderedList')}" title="Liste à puces">
            • 
          </button>
          <button @click="formatText('insertOrderedList')" class="toolbar-btn" :class="{active: isActive('insertOrderedList')}" title="Liste numérotée">
            1.
          </button>
        </div>

        <div class="toolbar-divider"></div>

        <!-- Separator -->
        <div class="toolbar-group">
          <button @click="insertSeparator" class="toolbar-btn" title="Séparateur">
            ―――
          </button>
        </div>
      </div>
    </div>

    <!-- Main Editor Content -->
    <div class="editor-content">
      <!-- Title Field -->
      <div class="title-section">
        <input 
          v-model="title" 
          @input="onTitleChange"
          type="text" 
          class="title-input" 
          placeholder="Titre de votre article..."
        />
      </div>

      <!-- Rich Text Editor -->
      <div 
        ref="contentEditor"
        class="content-editor"
        contenteditable="true"
        @input="onContentInput"
        @keydown="onKeydown"
        @paste="onPaste"
        @focus="onEditorFocus"
        data-placeholder="Commencez à écrire votre contenu..."
      ></div>
    </div>

    <!-- Preview Modal -->
    <div v-if="showPreview" class="preview-modal">
      <div class="preview-modal-content">
        <div class="preview-header">
          <h2>Aperçu</h2>
          <button @click="closePreview" class="close-btn">✕</button>
        </div>
        <div class="preview-content">
          <h1 class="preview-title">{{ title }}</h1>
          <div class="preview-meta">
            <small>Dernière modification : {{ formatDate(lastModified) }}</small>
          </div>
          <div class="preview-body" v-html="content"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed, watch } from 'vue'

// Props
const props = defineProps({
  pageType: {
    type: String,
    required: true
  },
  initialTitle: {
    type: String,
    default: ''
  },
  initialContent: {
    type: String,
    default: ''
  }
})

// Emits
const emit = defineEmits(['close', 'save'])

// Reactive data
const title = ref(props.initialTitle)
const content = ref(props.initialContent)
const contentEditor = ref(null)
const hasChanges = ref(false)
const isSaving = ref(false)
const isPublished = ref(false)
const lastModified = ref(new Date())
const showPreview = ref(false)

// Auto-save state
const autoSaveInterval = ref(null)
const AUTOSAVE_DELAY = 3000 // 3 seconds

// Computed
const saveStatusClass = computed(() => {
  if (isSaving.value) return 'saving'
  if (!hasChanges.value) return 'saved'
  return 'unsaved'
})

const saveStatusText = computed(() => {
  if (isSaving.value) return 'Enregistrement...'
  if (!hasChanges.value) return 'Enregistré'
  return 'Brouillon'
})

// Methods
const goBack = () => {
  if (hasChanges.value) {
    const confirmLeave = confirm('Vous avez des modifications non enregistrées. Voulez-vous vraiment quitter ?')
    if (!confirmLeave) return
  }
  
  // Redirect to SEO admin page
  window.location.href = '/admin/seo'
}

const onTitleChange = () => {
  markAsChanged()
}

const onContentInput = (event) => {
  content.value = event.target.innerHTML
  markAsChanged()
}

const onEditorFocus = () => {
  // When editor gains focus, set content if empty
  if (contentEditor.value && !contentEditor.value.innerHTML.trim()) {
    contentEditor.value.innerHTML = content.value || ''
  }
}

const setEditorContent = (htmlContent) => {
  if (contentEditor.value) {
    contentEditor.value.innerHTML = htmlContent
    content.value = htmlContent
  }
}

const markAsChanged = () => {
  hasChanges.value = true
  lastModified.value = new Date()
  
  // Clear existing auto-save timer
  if (autoSaveInterval.value) {
    clearTimeout(autoSaveInterval.value)
  }
  
  // Set new auto-save timer
  autoSaveInterval.value = setTimeout(() => {
    if (hasChanges.value) {
      autoSave()
    }
  }, AUTOSAVE_DELAY)
}

const autoSave = async () => {
  if (!hasChanges.value) return
  
  try {
    isSaving.value = true
    await saveContent(false) // Save as draft
  } catch (error) {
    console.error('Auto-save failed:', error)
  } finally {
    isSaving.value = false
  }
}

const saveContent = async (publish = false) => {
  try {
    isSaving.value = true
    
    const contentData = {
      title: title.value,
      content: content.value,
      is_published: publish,
      updated_at: new Date().toISOString()
    }
    
    const response = await fetch(`/api/legal/${props.pageType}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(contentData)
    })
    
    if (response.ok) {
      hasChanges.value = false
      isPublished.value = publish
      emit('save', { title: title.value, content: content.value, published: publish })
      showNotification(publish ? '✅ Article publié !' : '✅ Brouillon enregistré')
    } else {
      throw new Error('Failed to save content')
    }
  } catch (error) {
    console.error('Save failed:', error)
    showNotification('❌ Erreur lors de l\'enregistrement', 'error')
    throw error
  } finally {
    isSaving.value = false
  }
}

const publish = async () => {
  if (!title.value.trim()) {
    alert('Veuillez saisir un titre avant de publier.')
    return
  }
  
  if (!content.value.trim()) {
    alert('Veuillez saisir du contenu avant de publier.')
    return
  }
  
  await saveContent(true)
}

// Editor commands
const formatText = (command) => {
  document.execCommand(command, false, null)
  contentEditor.value?.focus()
}

const formatBlock = (tagName) => {
  if (!tagName) return
  document.execCommand('formatBlock', false, tagName)
  contentEditor.value?.focus()
}

const undo = () => {
  document.execCommand('undo')
  onContentInput()
}

const redo = () => {
  document.execCommand('redo')
  onContentInput()
}

const createLink = () => {
  const selection = window.getSelection()
  const selectedText = selection.toString()
  
  if (!selectedText) {
    alert('Veuillez sélectionner du texte pour créer un lien.')
    return
  }
  
  const url = prompt('Entrez l\'URL du lien:', 'https://')
  if (url && url !== 'https://') {
    document.execCommand('createLink', false, url)
  }
  contentEditor.value?.focus()
}

const insertImage = () => {
  const url = prompt('Entrez l\'URL de l\'image:', 'https://')
  if (url && url !== 'https://') {
    document.execCommand('insertHTML', false, `<img src="${url}" alt="Image" style="max-width: 100%; height: auto;" />`)
  }
  contentEditor.value?.focus()
}

const insertQuote = () => {
  const selection = window.getSelection()
  const selectedText = selection.toString()
  
  if (selectedText) {
    document.execCommand('formatBlock', false, 'blockquote')
  } else {
    document.execCommand('insertHTML', false, '<blockquote>Votre citation ici...</blockquote>')
  }
  contentEditor.value?.focus()
}

const insertSeparator = () => {
  document.execCommand('insertHTML', false, '<hr class="content-separator" />')
  contentEditor.value?.focus()
}

const isActive = (command) => {
  try {
    return document.queryCommandState(command)
  } catch (e) {
    return false
  }
}

// Keyboard shortcuts
const onKeydown = (e) => {
  // Ctrl/Cmd shortcuts
  if (e.ctrlKey || e.metaKey) {
    switch (e.key.toLowerCase()) {
      case 'b':
        e.preventDefault()
        formatText('bold')
        break
      case 'i':
        e.preventDefault()
        formatText('italic')
        break
      case 'u':
        e.preventDefault()
        formatText('underline')
        break
      case 'k':
        e.preventDefault()
        createLink()
        break
      case 's':
        e.preventDefault()
        autoSave()
        break
      case 'z':
        if (e.shiftKey) {
          e.preventDefault()
          redo()
        } else {
          e.preventDefault()
          undo()
        }
        break
      case 'x':
        if (e.shiftKey) {
          e.preventDefault()
          formatText('strikeThrough')
        }
        break
    }
  }
}

const onPaste = (e) => {
  // Allow paste but clean up formatting
  setTimeout(() => {
    onContentInput()
  }, 10)
}

// Preview
const openPreview = () => {
  showPreview.value = true
}

const closePreview = () => {
  showPreview.value = false
}

// Notifications
const showNotification = (message, type = 'success') => {
  const toast = document.createElement('div')
  toast.textContent = message
  toast.style.cssText = `
    position: fixed; top: 20px; right: 20px; z-index: 10000;
    background: ${type === 'error' ? '#ef4444' : '#10b981'}; 
    color: white; padding: 1rem 1.5rem;
    border-radius: 8px; font-weight: 500; box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  `
  document.body.appendChild(toast)
  setTimeout(() => toast.remove(), 3000)
}

const formatDate = (date) => {
  if (!date) return 'Jamais'
  
  const now = new Date()
  const targetDate = new Date(date)
  const diffInMinutes = Math.floor((now - targetDate) / (1000 * 60))
  
  if (diffInMinutes < 1) return 'À l\'instant'
  if (diffInMinutes < 60) return `il y a ${diffInMinutes} min`
  if (diffInMinutes < 60 * 24) return `il y a ${Math.floor(diffInMinutes / 60)}h`
  
  return targetDate.toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// Load existing content
const loadContent = async () => {
  try {
    const response = await fetch(`/api/legal/${props.pageType}`, { credentials: 'include' })
    if (response.ok) {
      const data = await response.json()
      if (data.success && data.data) {
        title.value = data.data.title || getDefaultTitle()
        content.value = data.data.content || getDefaultContent()
        isPublished.value = data.data.is_published || false
        if (data.data.updated_at) {
          lastModified.value = new Date(data.data.updated_at)
        }
      } else {
        // No existing content, use defaults
        title.value = getDefaultTitle()
        content.value = getDefaultContent()
      }
    } else {
      // API call failed, use defaults
      title.value = getDefaultTitle()
      content.value = getDefaultContent()
    }
    
    // Update editor content after a small delay to ensure DOM is ready
    setTimeout(() => {
      setEditorContent(content.value)
    }, 100)
  } catch (error) {
    console.error('Failed to load content:', error)
    title.value = getDefaultTitle()
    content.value = getDefaultContent()
  }
}

const getDefaultTitle = () => {
  if (props.pageType === 'mentions-legales') {
    return 'Mentions Légales'
  } else {
    return 'Colophon'
  }
}

const getDefaultContent = () => {
  if (props.pageType === 'mentions-legales') {
    return `<p>Éditeur du site :</p><p><strong>Valentine Arnaly</strong><br>Photographe professionnel</p>`
  } else {
    return `<p>Ce site a été conçu et développé avec soin pour mettre en valeur le travail photographique de Valentine Arnaly.</p>`
  }
}

// Lifecycle
onMounted(() => {
  // Always load content from API
  loadContent()
  
  // Focus on title input after content is loaded
  setTimeout(() => {
    const titleInput = document.querySelector('.title-input')
    if (titleInput) {
      titleInput.focus()
    }
  }, 200)
})

onUnmounted(() => {
  if (autoSaveInterval.value) {
    clearTimeout(autoSaveInterval.value)
  }
})

// Watch for prop changes
watch(() => props.initialContent, (newContent) => {
  if (newContent) {
    setEditorContent(newContent)
  }
})

watch(() => props.initialTitle, (newTitle) => {
  if (newTitle) {
    title.value = newTitle
  }
})
</script>

<style lang="scss" scoped>
@import '../../styles/variables.scss';

.substack-editor {
  min-height: 100vh;
  background: $color-white;
  display: flex;
  flex-direction: column;
}

// Top Navigation
.top-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 2rem;
  border-bottom: 1px solid $color-gray-light;
  background: $color-white;
  position: sticky;
  top: 0;
  z-index: 100;

  .nav-left, .nav-right {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .nav-center {
    flex: 1;
    text-align: center;
  }

  .nav-btn {
    padding: 0.5rem 1rem;
    border: 1px solid $color-gray-light;
    border-radius: 6px;
    background: $color-white;
    cursor: pointer;
    font-size: 0.9rem;
    font-weight: 500;
    transition: all 0.2s ease;

    &:hover {
      background: $color-gray-light;
    }

    &.primary {
      background: #3b82f6;
      color: white;
      border-color: #3b82f6;

      &:hover:not(:disabled) {
        background: #2563eb;
      }

      &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }
    }

    &.secondary {
      color: $color-gray-medium;
    }
  }

  .save-status {
    font-size: 0.85rem;
    font-weight: 500;

    &.saved {
      color: #10b981;
    }

    &.saving {
      color: #f59e0b;
    }

    &.unsaved {
      color: $color-gray-medium;
    }
  }
}

// Editor Header Toolbar
.editor-header {
  padding: 1rem 2rem;
  border-bottom: 1px solid $color-gray-light;
  background: lighten($color-gray-light, 5%);
  
  .toolbar-section {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex-wrap: wrap;
  }

  .toolbar-group {
    display: flex;
    align-items: center;
    gap: 0.25rem;
  }

  .toolbar-btn {
    background: $color-white;
    border: 1px solid $color-gray-light;
    padding: 0.4rem 0.6rem;
    border-radius: 4px;
    font-size: 0.85rem;
    cursor: pointer;
    transition: all 0.2s ease;
    min-width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;

    &:hover {
      background: $color-gray-light;
      border-color: $color-gray-medium;
    }

    &.active {
      background: $color-gray-dark;
      color: $color-white;
      border-color: $color-gray-dark;
    }
  }

  .style-dropdown {
    padding: 0.4rem 0.6rem;
    border: 1px solid $color-gray-light;
    border-radius: 4px;
    background: $color-white;
    font-size: 0.85rem;
    cursor: pointer;

    &:focus {
      outline: none;
      border-color: #3b82f6;
    }
  }

  .toolbar-divider {
    width: 1px;
    height: 24px;
    background: $color-gray-light;
    margin: 0 0.5rem;
  }
}

// Main Editor Content
.editor-content {
  flex: 1;
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
  width: 100%;

  .title-section {
    margin-bottom: 2rem;

    .title-input {
      width: 100%;
      font-size: 2.5rem;
      font-weight: 700;
      border: none;
      outline: none;
      color: $color-gray-dark;
      line-height: 1.2;
      padding: 0;
      background: transparent;

      &::placeholder {
        color: $color-gray-medium;
        opacity: 0.7;
      }

      &:focus {
        outline: none;
      }
    }
  }

  .content-editor {
    min-height: 500px;
    font-size: 1.1rem;
    line-height: 1.8;
    color: $color-gray-dark;
    outline: none;
    direction: ltr;
    text-align: left;
    unicode-bidi: normal;

    &:empty::before {
      content: attr(data-placeholder);
      color: $color-gray-medium;
      opacity: 0.7;
      pointer-events: none;
    }

    &:focus {
      outline: none;
    }

    // Content styling
    :deep(h1), :deep(h2), :deep(h3), :deep(h4) {
      margin: 2rem 0 1rem 0;
      font-weight: 600;
      line-height: 1.3;

      &:first-child {
        margin-top: 0;
      }
    }

    :deep(h1) { font-size: 2.5rem; }
    :deep(h2) { font-size: 2rem; }
    :deep(h3) { font-size: 1.5rem; }
    :deep(h4) { font-size: 1.25rem; }

    :deep(p) {
      margin: 1.5rem 0;

      &:first-child {
        margin-top: 0;
      }

      &:last-child {
        margin-bottom: 0;
      }
    }

    :deep(blockquote) {
      margin: 2rem 0;
      padding: 1rem 1.5rem;
      border-left: 4px solid $color-gray-light;
      background: lighten($color-gray-light, 3%);
      font-style: italic;
      color: $color-gray-medium;
    }

    :deep(ul), :deep(ol) {
      margin: 1.5rem 0;
      padding-left: 2rem;

      li {
        margin: 0.5rem 0;
      }
    }

    :deep(a) {
      color: #3b82f6;
      text-decoration: underline;

      &:hover {
        text-decoration: none;
      }
    }

    :deep(img) {
      max-width: 100%;
      height: auto;
      margin: 1.5rem 0;
      border-radius: 8px;
    }

    :deep(.content-separator) {
      margin: 3rem 0;
      border: none;
      height: 1px;
      background: $color-gray-light;
    }

    :deep(strong) {
      font-weight: 600;
    }
  }
}

// Preview Modal
.preview-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
}

.preview-modal-content {
  background: white;
  width: 90%;
  max-width: 800px;
  max-height: 90vh;
  border-radius: 12px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid $color-gray-light;

  h2 {
    margin: 0;
    color: $color-gray-dark;
  }

  .close-btn {
    background: none;
    border: none;
    font-size: 1.5rem;
    cursor: pointer;
    color: $color-gray-medium;

    &:hover {
      color: $color-gray-dark;
    }
  }
}

.preview-content {
  padding: 2rem;
  overflow-y: auto;
  flex: 1;

  .preview-title {
    font-size: 2.5rem;
    font-weight: 700;
    margin: 0 0 1rem 0;
    color: $color-gray-dark;
    line-height: 1.2;
  }

  .preview-meta {
    margin-bottom: 2rem;
    padding-bottom: 1rem;
    border-bottom: 1px solid $color-gray-light;
    color: $color-gray-medium;
  }

  .preview-body {
    font-size: 1.1rem;
    line-height: 1.8;
    color: $color-gray-dark;
  }
}

// Responsive
@media (max-width: 768px) {
  .top-nav {
    padding: 0.75rem 1rem;
    flex-wrap: wrap;
    gap: 0.5rem;

    .nav-center {
      order: 3;
      flex: 100%;
      margin-top: 0.5rem;
    }
  }

  .editor-header {
    padding: 1rem;

    .toolbar-section {
      gap: 0.25rem;
    }
  }

  .editor-content {
    padding: 1rem;

    .title-input {
      font-size: 2rem;
    }

    .content-editor {
      font-size: 1rem;
    }
  }

  .preview-modal-content {
    width: 95%;
    max-height: 95vh;
  }
}
</style>