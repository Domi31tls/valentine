import { Router } from 'express';
import { Session } from '../models/Session.js';
import { User } from '../models/User.js';
import { ApiUtils } from '../utils/api.js';

const router = Router();

/**
 * GET /api/auth/debug - Debug complet de l'authentification
 */
router.get('/debug', async (req, res) => {
  try {
    const sessionToken = req.cookies.session_token;
    const authHeader = req.headers.authorization;
    
    const debugInfo = {
      timestamp: new Date().toISOString(),
      request: {
        cookies: {
          session_token: sessionToken ? '***EXISTS***' : null,
          all_cookies: Object.keys(req.cookies)
        },
        headers: {
          authorization: authHeader ? '***EXISTS***' : null,
          user_agent: req.get('User-Agent'),
          origin: req.get('Origin'),
          referer: req.get('Referer')
        }
      },
      session: null,
      user: null,
      error: null
    };

    if (sessionToken) {
      try {
        // Trouver la session
        const session = Session.findByToken(sessionToken);
        
        if (session) {
          debugInfo.session = {
            id: session.id,
            user_id: session.user_id,
            expires_at: session.expires_at,
            created_at: session.created_at,
            is_valid: session.isValid,
            is_expiring_soon: session.isExpiringSoon
          };
          
          // Récupérer l'utilisateur
          const user = session.user;
          if (user) {
            debugInfo.user = {
              id: user.id,
              email: user.email,
              name: user.name,
              role: user.role,
              created_at: user.created_at
            };
          } else {
            debugInfo.error = 'Session found but user not found';
          }
        } else {
          debugInfo.error = 'Session not found or expired';
        }
      } catch (error) {
        debugInfo.error = `Session lookup error: ${error.message}`;
      }
    } else {
      debugInfo.error = 'No session token provided';
    }

    // Statistiques globales
    const allSessions = Session.findAll?.() || [];
    const allUsers = User.findAll();
    
    debugInfo.stats = {
      total_sessions: allSessions.length,
      active_sessions: allSessions.filter(s => s.isValid).length,
      total_users: allUsers.length
    };

    ApiUtils.success(res, debugInfo);

  } catch (error) {
    console.error('Auth debug error:', error);
    ApiUtils.error(res, 500, 'Debug failed', { error: error.message });
  }
});

/**
 * POST /api/auth/debug/clear-all - Nettoyer toutes les sessions (debug only)
 */
router.post('/debug/clear-all', async (req, res) => {
  try {
    // En développement seulement
    if (process.env.NODE_ENV === 'production') {
      ApiUtils.error(res, 403, 'Debug endpoint not available in production');
      return;
    }

    // Supprimer toutes les sessions
    const deletedCount = Session.clearAll?.() || 0;
    
    ApiUtils.success(res, {
      message: `Cleared ${deletedCount} sessions`,
      deleted_count: deletedCount
    });

  } catch (error) {
    console.error('Clear all sessions error:', error);
    ApiUtils.error(res, 500, 'Clear failed', { error: error.message });
  }
});

export default router;
