import { Router } from 'express';
import { Project } from '../models/Project.js';
import { Retouche } from '../models/Retouche.js';
import { Media } from '../models/Media.js';
import { User } from '../models/User.js';
import DatabaseManager from '../utils/database.js';
import { ApiUtils } from '../utils/api.js';

const router = Router();

/**
 * GET /api/stats - Statistiques du dashboard
 */
router.get('/stats', async (req, res) => {
  try {
    // Compter les éléments par type
    const projectsTotal = Project.count();
    const projectsPublished = Project.count('published');
    const projectsInvisible = Project.count('invisible');
    
    const retouchesTotal = Retouche.count();
    const retouchesPublished = Retouche.count('published');
    const retouchesInvisible = Retouche.count('invisible');
    
    const mediaTotal = Media.findAll(1000).length; // Approximation
    const usersTotal = User.findAll().length;
    
    // Compter les clients et contacts
    const clientsStmt = DatabaseManager.prepare('SELECT COUNT(*) as count FROM clients');
    const clientsResult = clientsStmt.get() as { count: number };
    
    const contactsStmt = DatabaseManager.prepare('SELECT COUNT(*) as count FROM contacts');
    const contactsResult = contactsStmt.get() as { count: number };
    
    // Récupérer les derniers projets
    const recentProjects = Project.findAll({ limit: 5 })
      .map(p => ({
        id: p.id,
        title: p.title,
        status: p.status,
        is_draft: p.is_draft,
        created_at: p.created_at
      }));
    
    // Récupérer les dernières retouches
    const recentRetouches = Retouche.findAll({ limit: 5 })
      .map(r => ({
        id: r.id,
        title: r.title,
        status: r.status,
        created_at: r.created_at
      }));
    
    // Récupérer les derniers médias
    const recentMedia = Media.findAll(5)
      .map(m => ({
        id: m.id,
        filename: m.filename,
        mime_type: m.mime_type,
        size: m.size,
        created_at: m.created_at
      }));

    const stats = {
      counts: {
        projects: {
          total: projectsTotal,
          published: projectsPublished,
          invisible: projectsInvisible
        },
        retouches: {
          total: retouchesTotal,
          published: retouchesPublished,
          invisible: retouchesInvisible
        },
        media: {
          total: mediaTotal
        },
        users: {
          total: usersTotal
        },
        clients: {
          total: clientsResult.count
        },
        contacts: {
          total: contactsResult.count
        }
      },
      recent: {
        projects: recentProjects,
        retouches: recentRetouches,
        media: recentMedia
      },
      generated_at: new Date()
    };

    ApiUtils.success(res, stats);

  } catch (error) {
    console.error('Error fetching stats:', error);
    ApiUtils.error(res, 500, 'Failed to fetch stats');
  }
});

/**
 * GET /api/search - Recherche globale
 */
router.get('/search', async (req, res) => {
  try {
    const query = ApiUtils.sanitizeSearchQuery(req.query.q as string);
    
    if (!query || query.length < 2) {
      ApiUtils.error(res, 400, 'Search query must be at least 2 characters');
      return;
    }

    const { limit } = ApiUtils.validatePagination(req.query);
    const searchLimit = Math.min(limit, 20); // Limiter la recherche

    // Rechercher dans les projets
    const allProjects = Project.findAll({ limit: 100 });
    const matchingProjects = allProjects
      .filter(p => 
        p.title.toLowerCase().includes(query.toLowerCase()) ||
        p.description?.toLowerCase().includes(query.toLowerCase())
      )
      .slice(0, searchLimit)
      .map(p => ({
        type: 'project',
        id: p.id,
        title: p.title,
        description: p.description,
        status: p.status,
        created_at: p.created_at
      }));

    // Rechercher dans les retouches
    const allRetouches = Retouche.findAll({ limit: 100 });
    const matchingRetouches = allRetouches
      .filter(r => 
        r.title.toLowerCase().includes(query.toLowerCase())
      )
      .slice(0, searchLimit)
      .map(r => ({
        type: 'retouche',
        id: r.id,
        title: r.title,
        status: r.status,
        created_at: r.created_at
      }));

    // Rechercher dans les médias
    const allMedia = Media.findAll(100);
    const matchingMedia = allMedia
      .filter(m => 
        m.filename.toLowerCase().includes(query.toLowerCase()) ||
        m.caption?.toLowerCase().includes(query.toLowerCase()) ||
        m.alt?.toLowerCase().includes(query.toLowerCase())
      )
      .slice(0, searchLimit)
      .map(m => ({
        type: 'media',
        id: m.id,
        filename: m.filename,
        caption: m.caption,
        url: m.url,
        created_at: m.created_at
      }));

    const results = {
      query,
      projects: matchingProjects,
      retouches: matchingRetouches,
      media: matchingMedia,
      total: matchingProjects.length + matchingRetouches.length + matchingMedia.length
    };

    ApiUtils.success(res, results);

  } catch (error) {
    console.error('Error searching:', error);
    ApiUtils.error(res, 500, 'Failed to search');
  }
});

/**
 * GET /api/health-detailed - Health check détaillé
 */
router.get('/health-detailed', async (req, res) => {
  try {
    // Tester la connexion à la base de données
    const db = DatabaseManager.getInstance();
    
    // Tester quelques requêtes
    const userCount = User.findAll().length;
    const projectCount = Project.count();
    const mediaCount = Media.findAll(1).length;
    
    const health = {
      status: 'healthy',
      timestamp: new Date(),
      database: {
        connected: true,
        counts: {
          users: userCount,
          projects: projectCount,
          media: mediaCount
        }
      },
      api: {
        version: '1.0.0',
        environment: process.env.NODE_ENV || 'development'
      },
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024)
      },
      uptime: process.uptime()
    };

    ApiUtils.success(res, health);

  } catch (error) {
    console.error('Error checking health:', error);
    ApiUtils.error(res, 500, 'Health check failed');
  }
});

/**
 * GET /api/config - Configuration publique de l'API
 */
router.get('/config', async (req, res) => {
  try {
    const config = {
      api: {
        version: '1.0.0',
        pagination: {
          default_limit: 42,
          max_limit: 100
        },
        validation: {
          media: {
            max_size_mb: 10,
            allowed_types: [
              'image/jpeg',
              'image/jpg',
              'image/png',
              'image/webp',
              'image/svg+xml'
            ]
          }
        }
      },
      features: {
        projects: true,
        retouches: true,
        media: true,
        about: true,
        clients: true,
        contacts: true,
        search: true,
        analytics: false // Pas encore implémenté
      }
    };

    ApiUtils.success(res, config);

  } catch (error) {
    console.error('Error fetching config:', error);
    ApiUtils.error(res, 500, 'Failed to fetch config');
  }
});

export default router;
