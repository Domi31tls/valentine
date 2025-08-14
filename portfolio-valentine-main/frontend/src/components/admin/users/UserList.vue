<template>
  <div class="users-list">
     <!-- Header -->
     <div class="users-list-header">
      <div class="users-list-header-left">
        <h1 class="users-list-header__title page-heading">Users</h1>
        <span class="users-list-header__count">Manage or access {{ users.length }} user{{ users.length > 1 ? 's' : '' }}</span>
      </div>
      
      <div class="users-list-header-right">
        <button @click="showUserForm = true" class="button-primary" :disabled="isLoading">
          Add New
        </button>
      </div>
    </div>

    <!-- Controls -->
    <div class="list-controls">
       <!-- Search -->
       <div class="list-controls__search">
        <span>🔍</span>
        <input 
          v-model="searchQuery"
          type="text" 
          placeholder="Search users..."
          class="search-input"
        />
      </div>

      <div class="list-controls__selects">
        <!-- Sorting -->
        <div class="list-controls__sort">
          <select v-model="sortBy" class="sort-select">
            <option value="updated_at">Last modified</option>
            <option value="created_at">Date created</option>

            <option value="email">Email</option>
            <option value="role">Role</option>
          </select>
          
          <button @click="sortOrder = sortOrder === 'asc' ? 'desc' : 'asc'" class="sort-order button">
            {{ sortOrder === 'asc' ? '↑' : '↓' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Loading state -->
    <div v-if="isLoading" class="loading-state">
      <div class="loading-spinner"></div>
      <p>Loading users...</p>
    </div>

    <!-- Error state -->
    <div v-else-if="error" class="error-state">
      <div class="error-icon">⚠️</div>
      <h3>Error loading users</h3>
      <p>{{ error }}</p>
      <button @click="loadUsers" class="retry-button">Retry</button>
    </div>

    <!-- Empty state -->
    <div v-if="!isLoading && !error && filteredUsers.length === 0 && !searchQuery" class="empty-state">
      <div class="empty-state-icon">👤</div>
      <h3>No users yet</h3>
      <p>Create your first user to get started</p>
      <button @click="showUserForm = true" class="btn-create-first button-primary">
        Create your first user
      </button>
    </div>
    
    <!-- No results -->
    <div v-else-if="!isLoading && !error && filteredUsers.length === 0 && searchQuery" class="no-results">
      <div class="no-results-icon">🔍</div>
      <h3>No users found</h3>
      <p>Try adjusting your search or filters</p>
    </div>

    <!-- Users grid -->
    <div v-else-if="!isLoading && !error && filteredUsers.length > 0" class="users-grid">
      <UserTile
        v-for="user in paginatedUsers"
        :key="user.id"
        :user="user"
        @edit="editUser"
        @delete="deleteUser"
      />
    </div>

    <!-- User Form Modal -->
    <UserForm 
      v-if="showUserForm" 
      @close="showUserForm = false"
      @user-created="handleUserCreated"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useAuth } from '@/composables/useAuth';
import { useApi } from '@/composables/useApi';
import type { User } from '@/../../shared/types';
import UserForm from '@/components/admin/users/UserForm.vue';
import UserTile from '@/components/admin/users/UserTile.vue';

// Icônes remplacées par des emojis


// État
const users = ref<User[]>([]);
const isLoading = ref(false);
const error = ref('');
const showUserForm = ref(false);

// Composables
const { fetchData, postData } = useApi();

// Filtres et tri
const searchQuery = ref('');
const sortBy = ref<'updated_at' | 'created_at' | 'email' | 'role'>('updated_at');
const sortOrder = ref<'asc' | 'desc'>('desc');
const filterRole = ref('');

// Pagination
const currentPage = ref(1);
const itemsPerPage = 50;

// Computed
const filteredUsers = computed(() => {
  let filtered = users.value;
  
  // Search
  if (searchQuery.value) {
    filtered = filtered.filter(user =>
      user.email.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      user.role.toLowerCase().includes(searchQuery.value.toLowerCase())
    );
  }

  // Role
  if (filterRole.value) {
    filtered = filtered.filter(user => user.role === filterRole.value);
  }

  // Sort
  filtered = filtered.sort((a, b) => {
    const sortKey = sortBy.value;
    const order = sortOrder.value === 'asc' ? 1 : -1;
    
    if (a[sortKey] < b[sortKey]) return -1 * order;
    if (a[sortKey] > b[sortKey]) return 1 * order;
    return 0;
  });

  return filtered;
});

const paginatedUsers = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage;
  const end = start + itemsPerPage;
  const result = filteredUsers.value.slice(start, end);
  
  return result;
});

const totalPages = computed(() => 
  Math.ceil(filteredUsers.value.length / itemsPerPage)
);

// Méthodes
const loadUsers = async () => {
  try {
    isLoading.value = true;
    error.value = null;
    
    const response = await fetchData(`/api/users`);
    console.log('📞 API Response data:', response);

    if (response.success) {
      // Vérifier la structure de la réponse
      const usersData = response.data;

      if (Array.isArray(usersData)) {
        // Structure simple : data est directement un tableau
        users.value = usersData;
      } else if (usersData && Array.isArray(usersData.data)) {
        // Structure paginée : data.data contient le tableau
        users.value = usersData.data;
        console.log('📊 Pagination info:', usersData.pagination); 
      } else {
        console.warn('⚠️ Unexpected data structure:', usersData);
        users.value = [];
      }

      console.log('✅ Utilisateurs chargés:', users.value.length);
      console.log('📋 Utilisateurs détail:', users.value);
      console.log('🔍 Premier utilisateur structure:', users.value[0]);
    } else {
      throw new Error(data.message || 'Failed to load users');
    }
    
  } catch (err) {
    console.error('❌ Erreur chargement utilisateurs:', err);
    error.value = err instanceof Error ? err.message : 'Unknown error';
  } finally {
    isLoading.value = false;
  }
};

const createUser = async (userData: { email: string; role?: 'admin' | 'editor' }) => {
  try {
    const response = await postData(`/api/users`, userData, 'POST');
    
    if (!response.success) {
      throw new Error(response.error || 'Failed to create user');
    }
    
    // Recharger la liste
    await loadUsers();
    
  } catch (err) {
    console.error('Error creating user:', err);
    alert('Error creating user. Please try again.');
  }
};

const editUser = async (user: User) => {
  try {
    console.log('✏️ Editing user:', user);
    
    // Détecter quel champ a changé
    const currentUser = users.value.find(u => u.id === user.id);
    if (!currentUser) {
      throw new Error('User not found in current list');
    }
    
    let response;
    let changeType = '';
    
    if (user.role !== currentUser.role) {
      // Changement de rôle
      changeType = 'role';
      console.log('🔄 Role change detected:', currentUser.role, '→', user.role);
      response = await postData(`/api/users/${user.id}/role`, { role: user.role }, 'PUT');
    } else if (user.email !== currentUser.email) {
      // Changement d'email
      changeType = 'email';
      console.log('📧 Email change detected:', currentUser.email, '→', user.email);
      response = await postData(`/api/users/${user.id}/email`, { email: user.email }, 'PUT');
    } else {
      console.log('ℹ️ No changes detected');
      return;
    }
    
    console.log(`✏️ Edit ${changeType} response:`, response);
    
    if (!response.success) {
      throw new Error(response.error || 'Failed to update user');
    }
    
    console.log(`✅ User ${changeType} updated successfully`);
    
    // Recharger la liste
    await loadUsers();
    
  } catch (err) {
    console.error('❌ Error editing user:', err);
    alert(`Error editing user: ${err.message}. Please try again.`);
  }
};

const deleteUser = async (id: string) => {
  // Trouver l'utilisateur pour afficher son email dans la confirmation
  const userToDelete = users.value.find(u => u.id === id);
  const userEmail = userToDelete?.email || 'cet utilisateur';
  
  // Demander confirmation
  if (!confirm(`Êtes-vous sûr de vouloir supprimer ${userEmail} ?`)) {
    return;
  }
  
  try {
    console.log('🗑️ Deleting user:', id);
    
    const response = await postData(`/api/users/${id}`, {}, 'DELETE');
    
    console.log('🗑️ Delete response:', response);
    
    if (!response.success) {
      throw new Error(response.error || 'Failed to delete user');
    }
    
    console.log('✅ User deleted successfully');
    
    // Recharger la liste
    await loadUsers();
    
  } catch (err) {
    console.error('❌ Error deleting user:', err);
    
    // Si l'utilisateur n'existe plus (404), on recharge quand même la liste
    if (err.message.includes('404')) {
      console.log('ℹ️ User already deleted, refreshing list...');
      await loadUsers();
    } else {
      alert(`Error deleting user: ${err.message}. Please try again.`);
    }
  }
};

const handleUserCreated = async (user: User) => {
  showUserForm.value = false;
  await loadUsers();
};


// Chargement initial
onMounted(async () => {
  // Vérifier que l'utilisateur est admin
  const { requireAdmin } = useAuth();
  const isAdmin = await requireAdmin();
  
  if (isAdmin) {
    await loadUsers();
  }
});
</script>

<style scoped lang="scss">
.users-list {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-7);

    &-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: var(--spacing-6);

      &-left {
        display: flex;
        flex-direction: column;
        gap: 0;
      }

      &__count {
        color: var(--color-text-secondary);
      }
    }
}

.list-controls {
  display: grid;
  grid-template-columns: repeat(3, minmax(200px, 1fr));
  align-items: center;
  gap: var(--spacing-3);

  @media (max-width: 1024px) {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-4);
  }

  &__search {
    display: flex;
    align-items: center;
    gap: var(--spacing-1);
    width: 100%;

    padding: var(--spacing-2) var(--spacing-3);
    border-radius: var(--border-radius-m);
    background: var(--color-background-secondary);

    input {
      background: none;
      border: none;
      outline: none;
      color: var(--color-text);
      width: 100%;

      &::placeholder {
        color: var(--color-text);
        opacity: 0.3;
      }
    }

  }

  &__selects {
    display: flex;
    gap: var(--spacing-3);
    align-items: center;
    justify-content: flex-end;
    align-self: stretch;

    grid-column: 3 / span 1;

    select {
      background-color: var(--color-background-secondary);
      color: var(--color-text);
      border-radius: var(--border-radius-m);
      padding: var(--spacing-2) var(--spacing-3);
      border: none;
      outline: none;
      cursor: pointer;
      appearance: none;

      &::after {
        content: '▼';
        margin-left: var(--spacing-2);
      }
    }

    .sort-order {
      background-color: var(--color-background-secondary);
    }
  }
}

.users-grid {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-4);
  max-width: 650px;
}

.loading-state, .error-state, .empty-state, .no-results {
  text-align: center;
  padding: var(--spacing-8);
  
  h3 {
    margin: var(--spacing-4) 0 var(--spacing-2);
    color: var(--color-text);
  }
  
  p {
    color: var(--color-text-secondary);
    margin-bottom: var(--spacing-4);
  }
}

.loading-spinner {
  width: 24px;
  height: 24px;
  border: 2px solid var(--color-border);
  border-top: 2px solid var(--color-accent);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto var(--spacing-2);
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>
