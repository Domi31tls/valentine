/**
 * Composable pour les appels API génériques avec loading states
 */
import { ref } from 'vue';

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

interface UseApiState<T = any> {
  data: import('vue').Ref<T | null>;
  isLoading: import('vue').Ref<boolean>;
  error: import('vue').Ref<string | null>;
  execute: () => Promise<void>;
  refresh: () => Promise<void>;
}

// Configuration de l'URL de base
const getApiBaseUrl = (): string => {
  // En développement, utiliser le proxy Astro vers le backend
  // En production, utiliser l'URL publique configurée
  if (import.meta.env.PUBLIC_API_URL) {
    return import.meta.env.PUBLIC_API_URL;
  }
  
  // En développement, utiliser le proxy Astro 
  return '/api';  // Cela sera proxifié vers localhost:3001 par astro.config.mjs
};

// Fonction utilitaire pour construire l'URL complète
const buildUrl = (endpoint: string): string => {
  const baseUrl = getApiBaseUrl();
  
  // Si l'endpoint commence déjà par /api, on l'utilise tel quel avec la base
  if (endpoint.startsWith('/api/')) {
    return `${baseUrl.replace('/api', '')}${endpoint}`;
  }
  
  // Sinon, on ajoute /api si nécessaire
  if (endpoint.startsWith('/')) {
    return `${baseUrl}${endpoint.replace('/api', '')}`;
  }
  
  return `${baseUrl}/${endpoint}`;
};

export const useApi = () => {
  
  /**
   * Faire une requête GET
   */
  const fetchData = async <T = any>(endpoint: string): Promise<ApiResponse<T>> => {
    const url = buildUrl(endpoint);
    try {
      const response = await fetch(url, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error || data.message || `HTTP ${response.status}`
        };
      }

      return {
        success: true,
        data: data.data || data
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur de connexion'
      };
    }
  };

  /**
   * Faire une requête POST/PUT/PATCH/DELETE
   */
  const postData = async <T = any>(
    url: string, 
    body: any, 
    method: 'POST' | 'PUT' | 'PATCH' | 'DELETE' = 'POST'
  ): Promise<ApiResponse<T>> => {
    try {
      const isFormData = body instanceof FormData;
      
      const headers: HeadersInit = {
        'credentials': 'include'
      };
      
      // Ne pas définir Content-Type pour FormData (le navigateur le fait automatiquement)
      if (!isFormData) {
        headers['Content-Type'] = 'application/json';
      }

      const response = await fetch(url, {
        method,
        credentials: 'include',
        headers,
        body: isFormData ? body : JSON.stringify(body)
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error || data.message || `HTTP ${response.status}`
        };
      }

      return {
        success: true,
        data: data.data || data,
        message: data.message
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur de connexion'
      };
    }
  };

  /**
   * Upload de fichier
   */
  const uploadFile = async (file: File, additionalData?: Record<string, string>): Promise<ApiResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    
    if (additionalData) {
      Object.entries(additionalData).forEach(([key, value]) => {
        formData.append(key, value);
      });
    }

    return postData('/api/media', formData, 'POST');
  };

  /**
   * Hook avec état de loading intégré pour les requêtes GET
   */
  const useAsyncData = <T = any>(
    endpoint: string,
    options: {
      immediate?: boolean;
      transform?: (data: any) => T;
    } = {}
  ): UseApiState<T> => {
    const data = ref<T | null>(null);
    const isLoading = ref(false);
    const error = ref<string | null>(null);

    const execute = async () => {
      isLoading.value = true;
      error.value = null;

      try {
        const response = await fetchData<T>(endpoint);
        
        if (response.success && response.data) {
          data.value = options.transform 
            ? options.transform(response.data) 
            : response.data;
        } else {
          error.value = response.error || 'Erreur lors du chargement';
        }
      } catch (err) {
        error.value = err instanceof Error ? err.message : 'Erreur inconnue';
      } finally {
        isLoading.value = false;
      }
    };

    const refresh = execute;

    // Exécution immédiate si demandée (par défaut)
    if (options.immediate !== false) {
      execute();
    }

    return {
      data,
      isLoading,
      error,
      execute,
      refresh
    };
  };

  /**
   * Hook avec état de loading pour les mutations (POST/PUT/DELETE)
   */
  const useMutation = <TData = any, TVariables = any>(
    mutationFn: (variables: TVariables) => Promise<ApiResponse<TData>>,
    options: {
      onSuccess?: (data: TData) => void;
      onError?: (error: string) => void;
    } = {}
  ) => {
    const data = ref<TData | null>(null);
    const isLoading = ref(false);
    const error = ref<string | null>(null);

    const mutate = async (variables: TVariables) => {
      isLoading.value = true;
      error.value = null;

      try {
        const response = await mutationFn(variables);
        
        if (response.success) {
          data.value = response.data || null;
          options.onSuccess?.(response.data);
        } else {
          error.value = response.error || 'Erreur lors de la mutation';
          options.onError?.(error.value);
        }
      } catch (err) {
        error.value = err instanceof Error ? err.message : 'Erreur inconnue';
        options.onError?.(error.value);
      } finally {
        isLoading.value = false;
      }
    };

    return {
      data,
      isLoading,
      error,
      mutate
    };
  };

  return {
    fetchData,
    postData,
    uploadFile,
    useAsyncData,
    useMutation
  };
};
