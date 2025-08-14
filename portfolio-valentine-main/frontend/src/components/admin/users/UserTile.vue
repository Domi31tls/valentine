<template>
    <div class="user-tile">
        <div class="user-tile-info property">
            <div class="property-row property-title" :class="{'admin': props.user.role === 'admin'}" @click.stop="showDropdown = !showDropdown">
                <div class="property-field property-field--role">
                    <span :class="{ 'updating': isUpdating, 'success': updateSuccess}">{{ user.role.charAt(0).toUpperCase() + user.role.slice(1) }}</span>
                    <span v-if="isUpdating" class="update-indicator">⏳</span>
                    <span v-if="updateSuccess" class="success-indicator">✓</span>
                </div>

                <!-- Dropdown -->
                <div class="property-dropdown" v-if="showDropdown" @click.stop>
                    <div 
                        class="dropdown-option"
                        @click="selectType('admin')"
                    >
                        Administrator
                    </div>
                    <div 
                        class="dropdown-option"
                        @click="selectType('editor')"
                    >
                        Editor
                    </div>
                </div>
            </div>

            <div class="property-row property-content" @click.stop>
                <div class="property-field">
                    <input 
                        v-model="editableEmail" 
                        @blur="updateEmail"
                        @keyup.enter="updateEmail"
                        type="email"
                        class="email-input"
                        :disabled="isUpdating"
                    />
                    <span v-if="emailUpdateSuccess" class="success-indicator">✓</span>
                </div>
            </div>
            <div class="property-row property-actions" @click.stop>
                <button @click="handleDelete" class="button-secondary">
                    <TrashIcon/>
                </button>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
// Imports
import { ref, computed, onMounted, onUnmounted, watchEffect } from 'vue';
import TrashIcon from '@/Icons/trash.vue';
import type { User } from '@/../../shared/types';

// Props
interface Props {
    user: User;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  edit: [user: User];
  delete: [id: string];
}>();

// States
const showDropdown = ref(false);
const isUpdating = ref(false);
const updateSuccess = ref(false);
const editableEmail = ref('');
const emailUpdateSuccess = ref(false);

// Initialiser editableEmail après que props soit disponible
watchEffect(() => {
  if (props.user?.email) {
    editableEmail.value = props.user.email;
  }
});

// Methods
const handleDelete = () => {
    emit('delete', props.user.id);
};

const selectType = async (role: 'admin' | 'editor') => {
    if (isUpdating.value) return;
    
    isUpdating.value = true;
    showDropdown.value = false;
    
    try {
        // Créer une copie de l'utilisateur avec le nouveau rôle
        const updatedUser = { ...props.user, role };
        
        // Émettre l'événement d'édition
        emit('edit', updatedUser);
        
        // Feedback visuel de succès
        updateSuccess.value = true;
        setTimeout(() => {
            updateSuccess.value = false;
        }, 2000);
        
    } catch (error) {
        console.error('Error updating role:', error);
    } finally {
        isUpdating.value = false;
    }
};

const updateEmail = async () => {
    if (isUpdating.value || editableEmail.value === props.user.email) return;
    
    // Validation basique
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(editableEmail.value)) {
        alert('Format d\'email invalide');
        editableEmail.value = props.user.email; // Reset
        return;
    }
    
    isUpdating.value = true;
    
    try {
        // Créer une copie de l'utilisateur avec le nouvel email
        const updatedUser = { ...props.user, email: editableEmail.value };
        
        // Émettre l'événement d'édition (on réutilisera la même fonction)
        emit('edit', updatedUser);
        
        // Feedback visuel de succès
        emailUpdateSuccess.value = true;
        setTimeout(() => {
            emailUpdateSuccess.value = false;
        }, 2000);
        
    } catch (error) {
        console.error('Error updating email:', error);
        editableEmail.value = props.user.email; // Reset en cas d'erreur
    } finally {
        isUpdating.value = false;
    }
};

</script>

<style scoped lang="scss">
.property-actions {
    display: flex;
    align-items: center;
    gap: var(--spacing-1);
    max-width: fit-content;

    svg {
        width: var(--spacing-4);
        height: var(--spacing-4);
        color: var(--color-error-text)
    }
}

.property-title {
    background-color: var(--color-warning-background);
    text-align: center;

    &.admin {
        background-color: var(--color-error-background);
    }
}

</style>