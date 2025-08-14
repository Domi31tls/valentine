<template>
    <aside class="admin-sidebar" :class="{ 'collapsed': isCollapsed }">
        <div class="admin-sidebar-header">
            <div class="admin-sidebar-header__logo">
                <h2>Admin</h2>
            </div>
            <button @click="toggleSidebar" class="admin-sidebar-header__button button">
                <ArrowLeftBar :class="{ 'rotate': isCollapsed }"/>
            </button>
        </div>

        <nav class="admin-sidebar-nav">
            
            <div class="nav-container" 
                v-for="menu in MenuItems" 
                :key="menu.name">
                <div class="nav-section" v-if="menu.access === 'admin' && isAdmin || !menu.access">
                    <h3 class="nav-section__title">{{ menu.name }}</h3>
                    <ul class="nav-section__list">
                        <li class="nav-section__item" 
                        v-for="item in menu.items" :key="item.name">
                            <a 
                            :href="item.path" 
                            :class="{ active: currentPath === item.path }"
                            class="nav-section__link">
                                <component :is="item.icon" class="nav-section__icon" v-if="item.icon"/>
                                <span class="nav-section__text">{{ item.name }}</span>
                            </a>
                        </li>
                    </ul>
                </div>
            </div>
        </nav>
        <div class="admin-sidebar-footer">
            <!-- Toujours afficher la même structure pour éviter l'hydratation mismatch -->
            <div class="user-section">
                <div v-show="user" class="user-section__user" @click="showDropdown = !showDropdown">
                    <div class="user-section__user-avatar">
                    {{ user?.name?.charAt(0)?.toUpperCase() || 'AA' }}
                    </div>
                    <div class="user-section__user-details">
                    <span class="user-section__user-details__name">{{ user?.name || '' }}</span>
                    <span class="user-section__user-details__email">{{ user?.email || '' }}</span>
                    </div>
                    <div class="user-section__user-actions">
                        <TriangleDown class="user-section__user-actions__icon" />
                    </div>
                </div>
                <div v-if="showDropdown" class="user-section__dropdown">
                    <a href="/" class="user-section__dropdown-item">Voir le portfolio</a>
                    <button @click="handleLogout" class="user-section__dropdown-item user-section__dropdown-item--logout">Déconnexion</button>
                </div>
                
                <div v-show="!user" class="user-section__loading">
                    <div class="user-section__loading-spinner"></div>
                </div>
            </div>
        </div>
    </aside>
</template>

<script setup lang="ts">
// Imports
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useAuth } from '@/composables/useAuth';

import ArrowLeftBar from '@/Icons/arrow.left.bar.vue';
import TriangleDown from '@/Icons/triangle.down.vue';

// Const
const MenuItems = [
    {
        name: 'Content',
        access: null,
        items: [
            {
                name: 'Projects',
                path: '/admin/projects',
                icon: null
            },
            {
                name: 'Edits',
                path: '/admin/edits',
                icon: null
            },
            {
                name: 'About',
                path: '/admin/about',
                icon: null
            },
            {
                name: 'SEO',
                path: '/admin/seo',
                icon: null
            }
        ]
    },
    {
        name: 'Admin',
        access: 'admin',
        items: [
            {
                name: 'Users',
                path: '/admin/users',
                icon: null
            },
            {
                name: 'Analytics',
                path: '/admin/analytics',
                icon: null
            }
        ]
    }
]

// States
const isCollapsed = ref(false);
const currentPath = ref('');
const showDropdown = ref(false);
const { authState, logout } = useAuth();
const user = computed(() => authState.user);

// Check if the user is Admin
const isAdmin = computed(() => {
  return user.value?.role === 'admin';
});

// Methods
const toggleSidebar = () => {
    isCollapsed.value = !isCollapsed.value;
};

const handleLogout = async () => {
  showDropdown.value = false;
  await logout();
};

// Fermer le dropdown au clic extérieur
const handleClickOutside = (event: MouseEvent) => {
  const target = event.target as HTMLElement;
  if (!target.closest('.user-actions')) {
    showDropdown.value = false;
  }
};

// Récupérer le chemin actuel
onMounted(() => {
  currentPath.value = window.location.pathname;

});
</script>

<style scoped lang="scss">

.admin-sidebar {
    width: 300px;
    height: 100vh;
    position: sticky;
    top: 0;
    left: 0;
    padding: var(--spacing-5);
    padding-right: 0;

    display: flex;
    flex-direction: column;
    gap: var(--spacing-5);

    transition: width var(--transition-fast) var(--transition-easing-spring);

    &.collapsed {
        width: 80px;

        .admin-sidebar-header__logo {
            display: none;
        }

        .user-section__user-details {
            display: none;
        }
    }

    &-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding-block: var(--spacing-5);
        height: var(--spacing-7);

        &__button {
            color: var(--color-text-inverted);

            &:hover {
                background-color: var(--color-background-inverted-secondary);
            }

            & .rotate {
                transform: rotate(180deg);
            }
        }

        &__logo {
            font-size: var(--font-size-l);
        }
    }

    &-nav {
        flex: 1;

        display: flex;
        flex-direction: column;
        gap: var(--spacing-3);
    }
}


.nav-section {
    display: flex;
    padding-block: var(--spacing-5);
    flex-direction: column;
    justify-content: center;
    align-items: flex-start;
    gap: var(--spacing-6);
    align-self: stretch;

    &__title {
        font-size: var(--font-size-s);
        font-weight: var(--font-weight-medium);
        color: var(--color-text-secondary);
    }

    &__list {
        flex: 1;
        width: 100%;
        display: flex;
        flex-direction: column;
        gap: var(--spacing-1);
    }

    &__item {
        display: inline-flex;
        align-items: center;
        justify-content: flex-start;
        
    }

    &__link {
        display: flex;
        align-items: center;
        gap: var(--spacing-2);
        text-decoration: none;
        color: inherit;

        width: 100%;

        padding: var(--spacing-5);
        border-radius: var(--border-radius-m);

        transition: all var(--transition-slow) var(--transition-easing-ease-in-out);

        &:hover, &.active {
            background-color: var(--color-background);
            color: var(--color-text);
        }
    }
}

.user-section {
    position: relative;
    width: 100%;

    &__user {
        display: flex;
        align-items: center;
        gap: var(--spacing-2);
        padding: var(--spacing-2);
        border-radius: var(--border-radius-l);
        transition: all var(--transition-slow) var(--transition-easing-ease-in-out);

        border: 1px solid var(--color-background-inverted-secondary);
        cursor: pointer;

        &:hover {
            background-color: var(--color-background-inverted-secondary);

            .user-section__user{
                &-avatar {
                    background-color: var(--color-background-inverted);
                }
                &-details__email {
                    color: var(--color-text-inverted);
                } 
            }
                
        }

        &-avatar {
            width: var(--spacing-7);
            aspect-ratio: 1;
            border-radius: var(--border-radius-full);
            background-color: var(--color-background-inverted-secondary);
            color: var(--color-text-inverted);
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: var(--font-weight-medium);
            font-size: var(--font-size-s);
            transition: all var(--transition-slow) var(--transition-easing-ease-in-out);
        }

        &-details {
            flex: 1;
            display: flex;
            flex-direction: column;
            align-items: flex-start;
            gap: 0;

            &__name {
                font-size: var(--font-size-s);
                font-weight: var(--font-weight-medium);

            }

            &__email {
                font-size: var(--font-size-xs);
                color: var(--color-text-secondary);
                transition: all var(--transition-slow) var(--transition-easing-ease-in-out);
            }
        }

        &-actions {
            display: flex;
            align-items: center;
            justify-content: center;

            &__icon {
                width: var(--spacing-4);
                aspect-ratio: 1;
            }
        }
    }

    &__dropdown {
        position: absolute;
        bottom: 100%;
        left: 0;
        width: 100%;
        min-width: 200px;

        padding: var(--spacing-1);
        margin-bottom: var(--spacing-2);

        background-color: var(--color-background);
        border-radius: var(--border-radius-l);
        border: 1px solid var(--color-background-secondary);
       
        z-index: 100;

        &-item {
            display: inline-flex;
            align-items: center;
            justify-content: flex-start;
            width: 100%;

            color: var(--color-text);
            text-decoration: none;

            padding: var(--spacing-5);
            border-radius: var(--border-radius-m);
            transition: all var(--transition-slow) var(--transition-easing-ease-in-out);

            &:hover {
                background-color: var(--color-background-secondary);
            }

            &--logout {
                color: var(--color-error-text);
            }
        }
    }
}



</style>
