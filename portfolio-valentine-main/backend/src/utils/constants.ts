// ===========================================
// CONSTANTES DE CONFIGURATION - API
// ===========================================

/**
 * Pagination
 */
export const API_PAGINATION = {
  DEFAULT_LIMIT: 42, // La réponse à la question fondamentale ! 🚀
  MAX_LIMIT: 100,
  DEFAULT_PAGE: 1
} as const;

/**
 * Validation des données
 */
export const VALIDATION = {
  PROJECT: {
    TITLE_MIN_LENGTH: 0, // Autorise les titres vides (approche Notion)
    TITLE_MAX_LENGTH: 100,
    DESCRIPTION_MAX_LENGTH: 1000,
    MAX_IMAGES: 50
  },
  RETOUCHE: {
    TITLE_MIN_LENGTH: 2,
    TITLE_MAX_LENGTH: 100
  },
  MEDIA: {
    FILENAME_MAX_LENGTH: 255,
    CAPTION_MAX_LENGTH: 500,
    ALT_MAX_LENGTH: 255,
    MAX_FILE_SIZE_MB: 10,
    ALLOWED_MIME_TYPES: [
      'image/jpeg',
      'image/jpg', 
      'image/png',
      'image/webp',
      'image/svg+xml'
    ]
  },
  USER: {
    EMAIL_MAX_LENGTH: 255,
    NAME_MIN_LENGTH: 2,
    NAME_MAX_LENGTH: 100
  },
  SEO: {
    TITLE_MAX_LENGTH: 60,
    DESCRIPTION_MAX_LENGTH: 160,
    KEYWORDS_MAX_COUNT: 10
  },
  ABOUT: {
    EXERGUE_MIN_LENGTH: 10,
    EXERGUE_MAX_LENGTH: 1000,
    CONTENT_MAX_LENGTH: 10000
  },
  CLIENT: {
    NAME_MIN_LENGTH: 2,
    NAME_MAX_LENGTH: 100
  },
  CONTACT: {
    LABEL_MAX_LENGTH: 100,
    VALUE_MAX_LENGTH: 255
  }
} as const;

/**
 * Statuts disponibles
 */
export const STATUS = {
  PUBLISHED: 'published',
  INVISIBLE: 'invisible'
} as const;

/**
 * Types de contact
 */
export const CONTACT_TYPES = {
  EMAIL: 'email',
  PHONE: 'phone',
  INSTAGRAM: 'instagram',
  WEBSITE: 'website',
  LINKEDIN: 'linkedin',
  TWITTER: 'twitter'
} as const;

/**
 * Types d'appareils pour analytics
 */
export const DEVICE_TYPES = {
  MOBILE: 'mobile',
  TABLET: 'tablet',
  DESKTOP: 'desktop'
} as const;

/**
 * Messages d'erreur standards
 */
export const ERROR_MESSAGES = {
  VALIDATION_FAILED: 'Validation failed',
  NOT_FOUND: 'Resource not found',
  UNAUTHORIZED: 'Unauthorized',
  FORBIDDEN: 'Forbidden',
  INTERNAL_ERROR: 'Internal server error',
  INVALID_ID: 'Invalid ID format',
  DUPLICATE_ENTRY: 'Duplicate entry',
  FILE_TOO_LARGE: 'File too large',
  INVALID_FILE_TYPE: 'Invalid file type',
  REQUIRED_FIELD: 'Required field missing'
} as const;

/**
 * Codes d'erreur personnalisés
 */
export const ERROR_CODES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  DUPLICATE_ENTRY: 'DUPLICATE_ENTRY',
  FILE_ERROR: 'FILE_ERROR'
} as const;

/**
 * Headers de réponse
 */
export const RESPONSE_HEADERS = {
  CONTENT_TYPE_JSON: 'application/json',
  CACHE_CONTROL_NO_CACHE: 'no-cache, no-store, must-revalidate',
  CACHE_CONTROL_PUBLIC: 'public, max-age=3600'
} as const;

/**
 * Ordre de tri par défaut
 */
export const DEFAULT_SORT = {
  PROJECTS: 'created_at DESC',
  RETOUCHES: 'created_at DESC',
  MEDIA: 'created_at DESC',
  CLIENTS: 'order_index ASC',
  CONTACTS: 'order_index ASC'
} as const;
