import { Request, Response, NextFunction } from 'express';
import { ApiResponse, ApiError } from '../../../shared/types.js';
import { ERROR_CODES, ERROR_MESSAGES, API_PAGINATION } from './constants.js';

/**
 * Utilitaires pour les réponses API
 */
export class ApiUtils {
  
  /**
   * Réponse de succès standardisée
   */
  static success<T>(res: Response, data: T, message?: string): void {
    const response: ApiResponse<T> = {
      success: true,
      data,
      message
    };
    res.json(response);
  }

  /**
   * Réponse d'erreur standardisée
   */
  static error(
    res: Response, 
    statusCode: number, 
    message: string, 
    code?: string,
    details?: Record<string, unknown>
  ): void {
    const response: ApiResponse = {
      success: false,
      error: message
    };
    
    // Log pour le debugging
    console.error(`API Error ${statusCode}:`, { message, code, details });
    
    res.status(statusCode).json(response);
  }

  /**
   * Alias pour sendSuccess (compatibilité)
   */
  static sendSuccess<T>(res: Response, data: T, message?: string): void {
    return this.success(res, data, message);
  }

  /**
   * Alias pour sendError (compatibilité)
   */
  static sendError(
    res: Response, 
    statusCode: number, 
    message: string, 
    code?: string,
    details?: Record<string, unknown>
  ): void {
    return this.error(res, statusCode, message, code, details);
  }

  /**
   * Validation d'un ID (UUID ou ID de développement)
   */
  static isValidID(id: string): boolean {
    // UUID standard
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    
    // ID de développement (format: type-001, type-002, etc.)
    const devIdRegex = /^[a-z]+-[a-z0-9-]+$/i;
    
    return uuidRegex.test(id) || devIdRegex.test(id);
  }

  /**
   * Validation d'un UUID strict (pour compatibilité)
   */
  static isValidUUID(uuid: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  }

  /**
   * Validation des paramètres de pagination
   */
  static validatePagination(query: any): { limit: number; offset: number; page: number } {
    const page = Math.max(1, parseInt(query.page) || API_PAGINATION.DEFAULT_PAGE);
    const limit = Math.min(
      API_PAGINATION.MAX_LIMIT, 
      Math.max(1, parseInt(query.limit) || API_PAGINATION.DEFAULT_LIMIT)
    );
    const offset = (page - 1) * limit;

    return { limit, offset, page };
  }

  /**
   * Nettoyer une chaîne pour la recherche
   */
  static sanitizeSearchQuery(query?: string): string | undefined {
    if (!query || typeof query !== 'string') return undefined;
    
    return query
      .trim()
      .replace(/[<>]/g, '') // Supprimer les caractères HTML
      .substring(0, 100); // Limiter la longueur
  }

  /**
   * Valider le statut
   */
  static validateStatus(status?: string): 'published' | 'invisible' | undefined {
    if (!status) return undefined;
    return ['published', 'invisible'].includes(status) ? status as 'published' | 'invisible' : undefined;
  }

  /**
   * Formater une réponse paginée
   */
  static formatPaginatedResponse<T>(
    data: T[], 
    total: number, 
    page: number, 
    limit: number
  ): {
    data: T[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  } {
    const totalPages = Math.ceil(total / limit);
    
    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    };
  }
}

/**
 * Middleware de validation des IDs
 */
export function validateId(paramName: string = 'id') {
  return (req: Request, res: Response, next: NextFunction): void => {
    const id = req.params[paramName];
    
    if (!id || !ApiUtils.isValidID(id)) {
      ApiUtils.error(res, 400, ERROR_MESSAGES.INVALID_ID, ERROR_CODES.VALIDATION_ERROR);
      return;
    }
    
    next();
  };
}

/**
 * Middleware de gestion d'erreurs global
 */
export function errorHandler(
  err: Error, 
  req: Request, 
  res: Response, 
  next: NextFunction
): void {
  console.error('Unhandled error:', err);
  
  // Erreurs spécifiques de la base de données
  if (err.message.includes('UNIQUE constraint failed')) {
    ApiUtils.error(res, 409, ERROR_MESSAGES.DUPLICATE_ENTRY, ERROR_CODES.DUPLICATE_ENTRY);
    return;
  }
  
  // Erreur générique
  ApiUtils.error(res, 500, ERROR_MESSAGES.INTERNAL_ERROR, ERROR_CODES.INTERNAL_ERROR, {
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
}

/**
 * Validation simple des champs requis
 */
export function isRequired(value: any, fieldName?: string): boolean {
  return value !== undefined && value !== null && value !== '';
}

/**
 * Validation d'email
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validation d'enum
 */
export function validateEnum(value: any, allowedValues: string[]): boolean {
  return allowedValues.includes(value);
}

/**
 * Middleware de validation des champs requis
 */
export function validateRequired(fields: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const missing = fields.filter(field => {
      const value = req.body[field];
      return value === undefined || value === null || value === '';
    });
    
    if (missing.length > 0) {
      ApiUtils.error(
        res, 
        400, 
        `${ERROR_MESSAGES.REQUIRED_FIELD}: ${missing.join(', ')}`,
        ERROR_CODES.VALIDATION_ERROR,
        { missingFields: missing }
      );
      return;
    }
    
    next();
  };
}

/**
 * Middleware pour logger les requêtes API
 */
export function apiLogger(req: Request, res: Response, next: NextFunction): void {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const { method, originalUrl, ip } = req;
    const { statusCode } = res;
    
    console.log(`${method} ${originalUrl} - ${statusCode} - ${duration}ms - ${ip}`);
  });
  
  next();
}

export default ApiUtils;
