import { ref, reactive } from 'vue';

// Types
interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'editor';
  created_at: string;
  updated_at: string;
  last_login_at?: string | null;
}

interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  error: string | null;
}

// Clés localStorage
const STORAGE_KEYS = {
  AUTH_STATE: 'portfolio_auth_state',
  USER_DATA: 'portfolio_user_data'
};

// État global d'authentification
const authState = reactive<AuthState>({
  isAuthenticated: false,
  isLoading: false,
  user: null,
  error: null
});

/**
 * Sauvegarder l'état d'authentification dans localStorage
 */
const saveAuthToStorage = (isAuthenticated: boolean, user: User | null) => {
  try {
    localStorage.setItem(STORAGE_KEYS.AUTH_STATE, JSON.stringify(isAuthenticated));
    if (user) {
      localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEYS.USER_DATA);
    }
  } catch (error) {
    console.warn('Impossible de sauvegarder l\'état d\'authentification:', error);
  }
};

/**
 * Charger l'état d'authentification depuis localStorage
 */
const loadAuthFromStorage = (): { isAuthenticated: boolean; user: User | null } => {
  try {
    const savedAuthState = localStorage.getItem(STORAGE_KEYS.AUTH_STATE);
    const savedUserData = localStorage.getItem(STORAGE_KEYS.USER_DATA);
    
    const isAuthenticated = savedAuthState ? JSON.parse(savedAuthState) : false;
    const user = savedUserData ? JSON.parse(savedUserData) : null;
    
    return { isAuthenticated, user };
  } catch (error) {
    console.warn('Impossible de charger l\'état d\'authentification:', error);
    return { isAuthenticated: false, user: null };
  }
};

/**
 * Nettoyer l'état d'authentification du localStorage
 */
const clearAuthFromStorage = () => {
  try {
    localStorage.removeItem(STORAGE_KEYS.AUTH_STATE);
    localStorage.removeItem(STORAGE_KEYS.USER_DATA);
  } catch (error) {
    console.warn('Impossible de nettoyer l\'état d\'authentification:', error);
  }
};

// Fonction pour récupérer l'utilisateur courant
const fetchCurrentUser = async (): Promise<User | null> => {
  try {
    console.log('📞 Making request to /api/auth/me...');
    
    const response = await fetch('/api/auth/me', {
      method: 'GET',
      credentials: 'include'
    });
    
    console.log('📞 Response status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('📞 Raw response data:', data);
      
      // Vérifier la structure de la réponse
      if (data.success && data.data && data.data.user) {
        console.log('✅ User data received:', data.data.user.name);
        return data.data.user;
      } else if (data.user) {
        // Format alternatif
        console.log('✅ User data received (alt format):', data.user.name);
        return data.user;
      } else {
        console.log('❌ No user in response data:', data);
        return null;
      }
    } else {
      const errorData = await response.json();
      console.log('❌ /api/auth/me failed:', response.status, errorData);
      return null;
    }
  } catch (error) {
    console.error('❌ Erreur lors de la récupération de l\'utilisateur:', error);
    return null;
  }
};

// Composable principal
export const useAuth = () => {
  
  /**
   * Mettre à jour l'état d'authentification (mémoire + localStorage)
   */
  const updateAuthState = (isAuthenticated: boolean, user: User | null, error: string | null = null) => {
    authState.isAuthenticated = isAuthenticated;
    authState.user = user;
    authState.error = error;
    
    // Sauvegarder dans localStorage
    saveAuthToStorage(isAuthenticated, user);
    
    console.log('🔐 Auth state updated:', { isAuthenticated, user: user?.name, error });
  };
  
  /**
   * Charger l'état depuis localStorage (pour l'initialisation rapide)
   */
  const loadStoredAuth = () => {
    console.log('📦 Loading auth from localStorage...');
    const { isAuthenticated, user } = loadAuthFromStorage();
    
    console.log('📦 localStorage data:', { isAuthenticated, user: user?.name });
    
    if (isAuthenticated && user) {
      authState.isAuthenticated = isAuthenticated;
      authState.user = user;
      console.log('✅ Auth state loaded from storage:', user.name);
      return true;
    } else {
      console.log('❌ No valid auth in localStorage');
      return false;
    }
  };
  
  /**
   * Vérifier le statut d'authentification (avec synchronisation serveur)
   */
  const checkAuth = async (skipServerCheck = false) => {
    authState.isLoading = true;
    authState.error = null;
    
    try {
      console.log('🔍 checkAuth() called, skipServerCheck:', skipServerCheck);
      
      // Si on doit skiper la vérification serveur, utiliser seulement localStorage
      if (skipServerCheck) {
        const hasStoredAuth = loadStoredAuth();
        authState.isLoading = false;
        console.log('📦 Skip server check, localStorage result:', hasStoredAuth);
        return hasStoredAuth;
      }
      
      // Vérification complète avec le serveur
      console.log('📞 Fetching current user from server...');
      const user = await fetchCurrentUser();
      
      if (user) {
        console.log('✅ User found, updating auth state:', user.name);
        updateAuthState(true, user);
      } else {
        console.log('❌ No user found, clearing auth state');
        updateAuthState(false, null);
        clearAuthFromStorage();
      }
      
      console.log('🔍 checkAuth() final result:', authState.isAuthenticated);
      return authState.isAuthenticated;
      
    } catch (error) {
      const errorMessage = 'Erreur lors de la vérification de l\'authentification';
      console.error('❌ checkAuth() error:', error);
      updateAuthState(false, null, errorMessage);
      clearAuthFromStorage();
      return false;
    } finally {
      authState.isLoading = false;
    }
  };
  
  /**
   * Demander un magic link
   */
  const login = async (email: string) => {
    authState.isLoading = true;
    authState.error = null;
    
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
        credentials: 'include'
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Erreur lors de la demande de connexion');
      }
      
      return { success: true, message: 'Email envoyé avec succès' };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erreur de connexion';
      authState.error = message;
      return { success: false, message };
    } finally {
      authState.isLoading = false;
    }
  };
  
  /**
   * Déconnexion
   */
  const logout = async () => {
    authState.isLoading = true;
    authState.error = null;
    
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      });
      
      if (response.ok) {
        updateAuthState(false, null);
        clearAuthFromStorage();
        
        // Rediriger vers la page de connexion
        window.location.href = '/admin/login';
      } else {
        throw new Error('Erreur lors de la déconnexion');
      }
    } catch (error) {
      authState.error = error instanceof Error ? error.message : 'Erreur de déconnexion';
    } finally {
      authState.isLoading = false;
    }
  };
  
  /**
   * Vérifier si l'utilisateur est connecté (avec vérification serveur)
   */
  const requireAuth = async () => {
    const isAuth = await checkAuth();
    
    if (!isAuth) {
      // Rediriger vers la page de connexion
      window.location.href = '/admin/login';
      return false;
    }
    
    return true;
  };
  
  /**
   * Vérifier si l'utilisateur est admin
   */
  const requireAdmin = async () => {
    const isAuth = await checkAuth();
    
    if (!isAuth) {
      // Rediriger vers la page de connexion
      window.location.href = '/admin/login';
      return false;
    }
    
    if (!authState.user || authState.user.role !== 'admin') {
      // Rediriger vers le dashboard si pas admin
      window.location.href = '/admin';
      return false;
    }
    
    return true;
  };
  
  /**
   * Vérifier si l'utilisateur actuel est admin
   */
  const isAdmin = () => {
    return authState.user?.role === 'admin';
  };
  
  /**
   * Vérifier si l'utilisateur actuel est éditeur
   */
  const isEditor = () => {
    return authState.user?.role === 'editor';
  };
  
  /**
   * Initialiser l'authentification (à appeler au montage des composants)
   */
  const initAuth = async (fastMode = false) => {
    console.log('🚀 initAuth called, fastMode:', fastMode);
    
    if (fastMode) {
      // Mode rapide : charger depuis localStorage d'abord
      const hasStoredAuth = loadStoredAuth();
      if (hasStoredAuth) {
        // Vérifier en arrière-plan sans bloquer l'interface
        setTimeout(() => checkAuth(), 100);
        return true;
      }
    }
    
    // Mode normal : vérification complète
    if (!authState.isAuthenticated && !authState.isLoading) {
      return await checkAuth();
    }
    
    return authState.isAuthenticated;
  };

  /**
   * Forcer la synchronisation avec le serveur (pour debug et init)
   */
  const forceSync = async () => {
    console.log('🔄 Forcing sync with server...');
    return await checkAuth(false);
  };
  
  return {
    // État réactif
    authState,
    
    // Propriétés computed
    isAuthenticated: () => authState.isAuthenticated,
    isLoading: () => authState.isLoading,
    user: () => authState.user,
    error: () => authState.error,
    
    // Méthodes
    login,
    logout,
    checkAuth,
    requireAuth,
    requireAdmin,
    initAuth,
    forceSync,
    updateAuthState,
    loadStoredAuth,
    clearAuthFromStorage,
    
    // Rôles
    isAdmin,
    isEditor
  };
};

// Export pour usage direct
export { authState };
