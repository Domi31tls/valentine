import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { User } from '../models/User.js';
import { Session } from '../models/Session.js';
import { EmailService } from '../services/email.js';
import { ApiUtils, validateRequired } from '../utils/api.js';
import { VALIDATION } from '../utils/constants.js';
import type { LoginInput, AuthResponse } from '../../../shared/types.js';

const router = Router();

// Rate limiting pour les magic links
const magicLinkLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 heure
  max: parseInt(process.env.RATE_LIMIT_MAGIC_LINK || '5'), // 5 tentatives par heure par IP
  message: {
    success: false,
    message: 'Trop de demandes de connexion. Réessayez dans une heure.',
    error: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Identifier par IP et email pour éviter l'abus
  keyGenerator: (req) => {
    return `${req.ip}-${req.body?.email || 'unknown'}`;
  },
  // Réinitialiser le compteur en cas de succès
  skipSuccessfulRequests: false,
  // Réinitialiser pour les échecs aussi (pour éviter l'abus)
  skipFailedRequests: false
});

/**
 * POST /api/auth/login - Demander un magic link
 */
router.post('/login', magicLinkLimiter, validateRequired(['email']), async (req, res) => {
  try {
    const { email }: LoginInput = req.body;

    // Validation de l'email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      ApiUtils.error(res, 400, 'Invalid email format');
      return;
    }

    if (email.length > VALIDATION.USER.EMAIL_MAX_LENGTH) {
      ApiUtils.error(res, 400, `Email must be less than ${VALIDATION.USER.EMAIL_MAX_LENGTH} characters`);
      return;
    }

    // Vérifier si l'utilisateur existe
    const user = User.findByEmail(email);
    if (!user) {
      console.log(`🔐 Login attempt for non-existent email: ${email}`);
      
      ApiUtils.error(res, 401, 'Cet email n\'est pas autorisé à accéder à l\'administration. Contactez l\'administrateur pour obtenir un accès.');
      return;
    }

    // Nettoyer les anciennes sessions expirées
    Session.cleanupExpiredSessions();

    // Créer une session temporaire pour le magic link (15 minutes)
    const magicLinkSession = Session.create(user.id, 15);

    // Construire le lien magique
    const baseUrl = process.env.SITE_URL || 'http://localhost:3000';
    const magicLink = `${baseUrl}/admin/verify?token=${magicLinkSession.token}`;

    // Envoyer l'email
    const emailSent = await EmailService.sendMagicLink(
      user.email,
      user.name,
      magicLink
    );

    if (!emailSent) {
      // Supprimer la session si l'email n'a pas pu être envoyé
      Session.delete(magicLinkSession.id);
      ApiUtils.error(res, 500, 'Failed to send magic link email');
      return;
    }

    // Log pour la sécurité
    console.log(`🔐 Magic link sent to ${user.email} (${user.name})`);

    const response: AuthResponse = {
      success: true,
      message: 'Un lien de connexion vous a été envoyé par email.'
    };

    ApiUtils.success(res, response);

  } catch (error) {
    console.error('Auth login error:', error);
    ApiUtils.error(res, 500, 'Authentication failed');
  }
});

/**
 * GET /api/auth/verify - Vérifier le token du magic link
 */
router.get('/verify', async (req, res) => {
  try {
    const { token } = req.query;

    if (!token || typeof token !== 'string') {
      ApiUtils.error(res, 400, 'Token is required');
      return;
    }

    // Trouver la session par token
    const magicLinkSession = Session.findByToken(token);
    if (!magicLinkSession) {
      ApiUtils.error(res, 401, 'Invalid or expired token');
      return;
    }

    // Récupérer l'utilisateur
    const user = magicLinkSession.user;
    if (!user) {
      ApiUtils.error(res, 401, 'User not found');
      return;
    }

    // Marquer la session magic link comme utilisée (la supprime)
    magicLinkSession.markAsUsed();

    // Créer une session longue durée pour l'utilisateur connecté
    const authSession = Session.createLongLived(user.id);

    // Envoyer une notification de connexion
    EmailService.sendLoginNotification(
      user.email,
      user.name,
      new Date(),
      req.get('User-Agent')
    );

    // Log pour la sécurité
    console.log(`✅ User authenticated successfully: ${user.email} (${user.name})`);

    const response: AuthResponse = {
      success: true,
      message: 'Authentication successful',
      user: user.toJSON(),
      token: authSession.token
    };

    // Définir le cookie de session
    res.cookie('session_token', authSession.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax', // Plus permissif que 'strict'
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 jours
      path: '/' // Assurer que le cookie est disponible partout
    });

    ApiUtils.success(res, response);

  } catch (error) {
    console.error('Auth verify error:', error);
    ApiUtils.error(res, 500, 'Token verification failed');
  }
});

/**
 * POST /api/auth/logout - Déconnexion
 */
router.post('/logout', async (req, res) => {
  try {
    const sessionToken = req.cookies.session_token || req.headers.authorization?.replace('Bearer ', '');

    if (sessionToken) {
      // Supprimer la session
      const deleted = Session.deleteByToken(sessionToken);
      if (deleted) {
        console.log('🔐 User logged out successfully');
      }
    }

    // Supprimer le cookie
    res.clearCookie('session_token');

    ApiUtils.success(res, {
      success: true,
      message: 'Logout successful'
    });

  } catch (error) {
    console.error('Auth logout error:', error);
    ApiUtils.error(res, 500, 'Logout failed');
  }
});

/**
 * GET /api/auth/me - Informations de l'utilisateur connecté
 */
router.get('/me', async (req, res) => {
  // Empêcher la mise en cache de cette route
  res.set({
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0'
  });
  
  try {
    const sessionToken = req.cookies.session_token || req.headers.authorization?.replace('Bearer ', '');

    if (!sessionToken) {
      ApiUtils.error(res, 401, 'No authentication token provided');
      return;
    }

    // Trouver la session
    const session = Session.findByToken(sessionToken);
    if (!session) {
      ApiUtils.error(res, 401, 'Invalid or expired token');
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

    ApiUtils.success(res, {
      user: user.toJSON(),
      session: session.toSafeJSON()
    });

  } catch (error) {
    console.error('Auth me error:', error);
    ApiUtils.error(res, 500, 'Failed to get user information');
  }
});

/**
 * GET /api/auth/sessions - Lister les sessions actives de l'utilisateur
 */
router.get('/sessions', async (req, res) => {
  try {
    const authToken = req.cookies.session_token || req.headers.authorization?.replace('Bearer ', '');

    if (!authToken) {
      ApiUtils.error(res, 401, 'No authentication token provided');
      return;
    }

    // Trouver la session courante
    const currentSession = Session.findByToken(authToken);
    if (!currentSession) {
      ApiUtils.error(res, 401, 'Invalid or expired token');
      return;
    }

    // Récupérer toutes les sessions actives de l'utilisateur
    const activeSessions = Session.findActiveByUserId(currentSession.user_id);

    ApiUtils.success(res, {
      sessions: activeSessions.map(s => ({
        ...s.toSafeJSON(),
        is_current: s.id === currentSession.id
      }))
    });

  } catch (error) {
    console.error('Auth sessions error:', error);
    ApiUtils.error(res, 500, 'Failed to get sessions');
  }
});

/**
 * DELETE /api/auth/sessions/:id - Supprimer une session spécifique
 */
router.delete('/sessions/:id', async (req, res) => {
  try {
    const authToken = req.cookies.session_token || req.headers.authorization?.replace('Bearer ', '');

    if (!authToken) {
      ApiUtils.error(res, 401, 'No authentication token provided');
      return;
    }

    // Trouver la session courante
    const currentSession = Session.findByToken(authToken);
    if (!currentSession) {
      ApiUtils.error(res, 401, 'Invalid or expired token');
      return;
    }

    const sessionIdToDelete = req.params.id;

    // Vérifier que la session à supprimer appartient à l'utilisateur
    const sessionToDelete = Session.findActiveByUserId(currentSession.user_id)
      .find(s => s.id === sessionIdToDelete);

    if (!sessionToDelete) {
      ApiUtils.error(res, 404, 'Session not found');
      return;
    }

    // Supprimer la session
    const deleted = Session.delete(sessionIdToDelete);
    if (!deleted) {
      ApiUtils.error(res, 500, 'Failed to delete session');
      return;
    }

    // Si l'utilisateur supprime sa session courante, supprimer aussi le cookie
    if (sessionIdToDelete === currentSession.id) {
      res.clearCookie('session_token');
    }

    ApiUtils.success(res, {
      success: true,
      message: 'Session deleted successfully'
    });

  } catch (error) {
    console.error('Auth delete session error:', error);
    ApiUtils.error(res, 500, 'Failed to delete session');
  }
});

/**
 * POST /api/auth/logout-all - Déconnexion de toutes les sessions
 */
router.post('/logout-all', async (req, res) => {
  try {
    const authToken = req.cookies.session_token || req.headers.authorization?.replace('Bearer ', '');

    if (!authToken) {
      ApiUtils.error(res, 401, 'No authentication token provided');
      return;
    }

    // Trouver la session courante
    const currentSession = Session.findByToken(authToken);
    if (!currentSession) {
      ApiUtils.error(res, 401, 'Invalid or expired token');
      return;
    }

    // Supprimer toutes les sessions de l'utilisateur
    const deletedCount = Session.deleteAllByUserId(currentSession.user_id);

    // Supprimer le cookie
    res.clearCookie('session_token');

    console.log(`🔐 User logged out from all sessions: ${deletedCount} sessions deleted`);

    ApiUtils.success(res, {
      success: true,
      message: `Logged out from ${deletedCount} sessions`
    });

  } catch (error) {
    console.error('Auth logout-all error:', error);
    ApiUtils.error(res, 500, 'Failed to logout from all sessions');
  }
});

/**
 * GET /api/auth/status - Vérifier l'état d'authentification
 */
router.get('/status', async (req, res) => {
  try {
    const authToken = req.cookies.session_token || req.headers.authorization?.replace('Bearer ', '');

    if (!authToken) {
      ApiUtils.success(res, {
        authenticated: false,
        message: 'No authentication token'
      });
      return;
    }

    // Trouver la session
    const session = Session.findByToken(authToken);
    if (!session) {
      ApiUtils.success(res, {
        authenticated: false,
        message: 'Invalid or expired token'
      });
      return;
    }

    // Récupérer l'utilisateur
    const user = session.user;
    if (!user) {
      ApiUtils.success(res, {
        authenticated: false,
        message: 'User not found'
      });
      return;
    }

    ApiUtils.success(res, {
      authenticated: true,
      user: user.toJSON(),
      session: session.toSafeJSON()
    });

  } catch (error) {
    console.error('Auth status error:', error);
    ApiUtils.success(res, {
      authenticated: false,
      message: 'Authentication check failed'
    });
  }
});

export default router;
