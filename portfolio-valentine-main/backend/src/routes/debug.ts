import { Router } from 'express';
import { Project } from '../models/Project.js';
import { Retouche } from '../models/Retouche.js';
import { Media } from '../models/Media.js';
import { User } from '../models/User.js';
import DatabaseManager from '../utils/database.js';
import { ApiUtils } from '../utils/api.js';
import { API_PAGINATION, VALIDATION } from '../utils/constants.js';

const router = Router();

/**
 * GET /api/debug - Données de debug en JSON pour le frontend
 */
router.get('/debug', async (req, res) => {
  try {
    const stats = await getCompleteStats();
    ApiUtils.success(res, stats);
  } catch (error) {
    console.error('Error fetching debug data:', error);
    ApiUtils.error(res, 500, 'Failed to fetch debug data');
  }
});

/**
 * Récupérer toutes les statistiques complètes
 */
async function getCompleteStats() {
  // Stats de base
  const projectsTotal = Project.count();
  const projectsPublished = Project.count('published');
  const projectsInvisible = Project.count('invisible');
  
  const retouchesTotal = Retouche.count();
  const retouchesPublished = Retouche.count('published');
  const retouchesInvisible = Retouche.count('invisible');
  
  const mediaTotal = Media.findAll(1000).length;
  const usersTotal = User.findAll().length;
  
  // Stats clients et contacts
  const clientsStmt = DatabaseManager.prepare('SELECT COUNT(*) as count FROM clients');
  const clientsResult = clientsStmt.get() as { count: number };
  
  const contactsStmt = DatabaseManager.prepare('SELECT COUNT(*) as count FROM contacts');
  const contactsResult = contactsStmt.get() as { count: number };
  
  // Stats de la base de données
  const dbStats = getDatabaseStats();
  
  // Informations système
  const systemInfo = {
    node_version: process.version,
    platform: process.platform,
    arch: process.arch,
    uptime: process.uptime(),
    memory: {
      used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
      external: Math.round(process.memoryUsage().external / 1024 / 1024)
    },
    cpu_usage: process.cpuUsage()
  };
  
  // Récupérer des échantillons de données
  const sampleData = {
    projects: Project.findAll({ limit: 3 }).map(p => ({
      id: p.id,
      title: p.title,
      status: p.status,
      is_draft: p.is_draft,
      images_count: p.images.length,
      created_at: p.created_at
    })),
    retouches: Retouche.findAll({ limit: 3 }).map(r => ({
      id: r.id,
      title: r.title,
      status: r.status,
      created_at: r.created_at
    })),
    media: Media.findAll(3).map(m => ({
      id: m.id,
      filename: m.filename,
      mime_type: m.mime_type,
      size: m.size,
      created_at: m.created_at
    })),
    users: User.findAll().map(u => ({
      id: u.id,
      email: u.email,
      name: u.name,
      role: u.role,
      created_at: u.created_at
    }))
  };

  // Liste des endpoints avec descriptions
  const endpoints = [
    {
      category: 'Projects',
      routes: [
        { method: 'GET', path: '/api/projects', description: 'Liste des projets avec filtres (status, search, limit, page)' },
        { method: 'POST', path: '/api/projects', description: 'Créer un nouveau projet' },
        { method: 'GET', path: '/api/projects/:id', description: 'Détail d\'un projet' },
        { method: 'PUT', path: '/api/projects/:id', description: 'Modifier un projet' },
        { method: 'DELETE', path: '/api/projects/:id', description: 'Supprimer un projet' }
      ]
    },
    {
      category: 'Retouches',
      routes: [
        { method: 'GET', path: '/api/retouches', description: 'Liste des retouches avec filtres' },
        { method: 'POST', path: '/api/retouches', description: 'Créer une nouvelle retouche' },
        { method: 'GET', path: '/api/retouches/:id', description: 'Détail d\'une retouche' },
        { method: 'PUT', path: '/api/retouches/:id', description: 'Modifier une retouche' },
        { method: 'DELETE', path: '/api/retouches/:id', description: 'Supprimer une retouche' }
      ]
    },
    {
      category: 'Media',
      routes: [
        { method: 'GET', path: '/api/media', description: 'Liste des médias avec filtres (mime_type, search)' },
        { method: 'POST', path: '/api/media', description: 'Créer un nouveau média' },
        { method: 'GET', path: '/api/media/:id', description: 'Détail d\'un média' },
        { method: 'PUT', path: '/api/media/:id', description: 'Modifier un média' },
        { method: 'DELETE', path: '/api/media/:id', description: 'Supprimer un média' },
        { method: 'GET', path: '/api/media/types', description: 'Types MIME supportés' }
      ]
    },
    {
      category: 'About & Content',
      routes: [
        { method: 'GET', path: '/api/about', description: 'Récupérer la page About' },
        { method: 'PUT', path: '/api/about', description: 'Modifier la page About' },
        { method: 'GET', path: '/api/clients', description: 'Liste des clients' },
        { method: 'POST', path: '/api/clients', description: 'Créer un client' },
        { method: 'PUT', path: '/api/clients/:id', description: 'Modifier un client' },
        { method: 'DELETE', path: '/api/clients/:id', description: 'Supprimer un client' },
        { method: 'GET', path: '/api/contacts', description: 'Liste des contacts' },
        { method: 'POST', path: '/api/contacts', description: 'Créer un contact' },
        { method: 'PUT', path: '/api/contacts/:id', description: 'Modifier un contact' },
        { method: 'DELETE', path: '/api/contacts/:id', description: 'Supprimer un contact' }
      ]
    },
    {
      category: 'Utilities',
      routes: [
        { method: 'GET', path: '/api/stats', description: 'Statistiques du dashboard' },
        { method: 'GET', path: '/api/search', description: 'Recherche globale (?q=query)' },
        { method: 'GET', path: '/api/health', description: 'Status de base' },
        { method: 'GET', path: '/api/health-detailed', description: 'Status détaillé' },
        { method: 'GET', path: '/api/config', description: 'Configuration publique' }
      ]
    },
    {
      category: 'Debug & Test',
      routes: [
        { method: 'GET', path: '/api/debug', description: 'Données de debug' },
        { method: 'GET', path: '/api/db-status', description: 'Status de la base de données' },
        { method: 'GET', path: '/api/test-data', description: 'Données de test' },
        { method: 'POST', path: '/api/test-media', description: 'Créer un média de test' },
        { method: 'GET', path: '/api/test-relations', description: 'Tester les relations' }
      ]
    }
  ];

  return {
    timestamp: new Date(),
    system: systemInfo,
    database: dbStats,
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
    sample_data: sampleData,
    endpoints,
    configuration: {
      pagination: API_PAGINATION,
      validation: VALIDATION
    }
  };
}

/**
 * Récupérer les statistiques de la base de données
 */
function getDatabaseStats() {
  try {
    const db = DatabaseManager.getInstance();
    
    // Taille de la base de données
    const sizeStmt = db.prepare("SELECT page_count * page_size as size FROM pragma_page_count(), pragma_page_size()");
    const sizeResult = sizeStmt.get() as { size: number };
    
    // Liste des tables
    const tablesStmt = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'");
    const tables = tablesStmt.all() as { name: string }[];
    
    // Statistiques par table
    const tableStats = tables.map(table => {
      const countStmt = db.prepare(`SELECT COUNT(*) as count FROM ${table.name}`);
      const countResult = countStmt.get() as { count: number };
      return {
        name: table.name,
        count: countResult.count
      };
    });
    
    return {
      connected: true,
      size_bytes: sizeResult.size,
      size_mb: Math.round(sizeResult.size / 1024 / 1024 * 100) / 100,
      tables: tableStats
    };
    
  } catch (error) {
    return {
      connected: false,
      error: error.message
    };
  }
}

export default router;
