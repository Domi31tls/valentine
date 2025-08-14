import { Request, Response, NextFunction } from 'express';
import { Session } from '../models/Session.js';
import { ApiUtils } from './api.js';

/**
 * Interface pour étendre l'objet Request avec les informations d'authentification
 */
export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
  session?: {
    id: string;
    expires_at: Date;
    created_at: Date;
  };
}

/**
 * Middleware pour vérifier l'authentification
 */
export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  try {
    // Récupérer le token depuis les cookies ou l'header Authorization
    const authToken = req.cookies.session_token || req.headers.authorization?.replace('Bearer ', '');

    if (!authToken) {
      ApiUtils.error(res, 401, 'Authentication required');
      return;
    }

    // Trouver la session
    const session = Session.findByToken(authToken);
    if (!session) {
      ApiUtils.error(res, 401, 'Invalid or expired session');
      return;
    }

    // Récupérer l'utilisateur
    const user = session.user;
    if (!user) {
      ApiUtils.error(res, 401, 'User not found');
      return;
    }

    // Étendre la session si elle expire bientôt
    if (session.isExpiringSoon) {
      session.extendSession(60 * 24); // Étendre de 24 heures
    }

    // Ajouter les informations d'authentification à la requête
    req.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role
    };

    req.session = {
      id: session.id,
      expires_at: session.expires_at,
      created_at: session.created_at
    };

    next();

  } catch (error) {
    console.error('Auth middleware error:', error);
    ApiUtils.error(res, 500, 'Authentication check failed');
  }
}

/**
 * Middleware pour vérifier l'authentification optionnelle
 * (ajoute les infos user si connecté, mais ne bloque pas si non connecté)
 */
export function optionalAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  try {
    // Récupérer le token depuis les cookies ou l'header Authorization
    const authToken = req.cookies.session_token || req.headers.authorization?.replace('Bearer ', '');

    if (!authToken) {
      // Pas de token, on continue sans authentification
      next();
      return;
    }

    // Trouver la session
    const session = Session.findByToken(authToken);
    if (!session) {
      // Token invalide, on continue sans authentification
      next();
      return;
    }

    // Récupérer l'utilisateur
    const user = session.user;
    if (!user) {
      // Utilisateur non trouvé, on continue sans authentification
      next();
      return;
    }

    // Étendre la session si elle expire bientôt
    if (session.isExpiringSoon) {
      session.extendSession(60 * 24); // Étendre de 24 heures
    }

    // Ajouter les informations d'authentification à la requête
    req.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role
    };

    req.session = {
      id: session.id,
      expires_at: session.expires_at,
      created_at: session.created_at
    };

    next();

  } catch (error) {
    console.error('Optional auth middleware error:', error);
    // En cas d'erreur, on continue sans authentification
    next();
  }
}

/**
 * Middleware pour vérifier le rôle de l'utilisateur
 */
export function requireRole(roles: string | string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      ApiUtils.error(res, 401, 'Authentication required');
      return;
    }

    const requiredRoles = Array.isArray(roles) ? roles : [roles];
    
    if (!requiredRoles.includes(req.user.role)) {
      ApiUtils.error(res, 403, 'Insufficient permissions');
      return;
    }

    next();
  };
}

/**
 * Middleware pour vérifier que l'utilisateur est admin
 */
export function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  return requireRole('admin')(req, res, next);
}

/**
 * Middleware pour logger les actions d'authentification
 */
export function logAuthAction(action: string) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    const ip = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent');
    const userInfo = req.user ? `${req.user.name} (${req.user.email})` : 'Anonymous';
    
    console.log(`🔐 Auth action: ${action} - User: ${userInfo} - IP: ${ip} - UA: ${userAgent}`);
    
    next();
  };
}

/**
 * Middleware pour nettoyer les sessions expirées périodiquement
 */
export function cleanupExpiredSessions(req: Request, res: Response, next: NextFunction): void {
  try {
    // Nettoyer les sessions expirées toutes les heures
    const now = Date.now();
    const lastCleanup = (global as any).lastSessionCleanup || 0;
    const hourInMs = 60 * 60 * 1000;
    
    if (now - lastCleanup > hourInMs) {
      Session.cleanupExpiredSessions();
      (global as any).lastSessionCleanup = now;
    }
    
    next();
  } catch (error) {
    console.error('Session cleanup error:', error);
    next(); // Continue même en cas d'erreur
  }
}

/**
 * Middleware pour ajouter des headers de sécurité
 */
export function securityHeaders(req: Request, res: Response, next: NextFunction): void {
  // Empêcher le clickjacking
  res.setHeader('X-Frame-Options', 'DENY');
  
  // Empêcher le sniffing de type MIME
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // Empêcher l'exécution de scripts inline
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // Forcer HTTPS en production
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  
  next();
}

export default {
  requireAuth,
  optionalAuth,
  requireRole,
  requireAdmin,
  logAuthAction,
  cleanupExpiredSessions,
  securityHeaders
};
