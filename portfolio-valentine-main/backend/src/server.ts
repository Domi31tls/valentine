import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import dotenv from 'dotenv';

// Load environment variables from root .env file
const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
dotenv.config({ path: resolve(rootDir, '.env') });

// Import des utilitaires database
import DatabaseManager from './utils/database.js';
import MigrationManager from './utils/migrations.js';

// Import des utilitaires API et auth
import { apiLogger, errorHandler } from './utils/api.js';
import { cleanupExpiredSessions, securityHeaders, requireAuth, requireAdmin } from './utils/auth.js';
import { EmailService } from './services/email.js';

// Import des routes
import projectsRoutes from './routes/projects.js';
import retouchesRoutes from './routes/retouches.js';
import mediaRoutes from './routes/media.js';
import aboutRoutes from './routes/about.js';
import utilsRoutes from './routes/utils.js';
import debugRoutes from './routes/debug.js';
import authRoutes from './routes/auth.js';
import authDebugRoutes from './routes/auth-debug.js';
import usersRoutes from './routes/users.js';
import seoRoutes from './routes/seo.js';
import legalRoutes from './routes/legal.js';
import analyticsRoutes from './routes/analytics.js';

// Import des modèles pour les tests
import { User } from './models/User.js';
import { Media } from './models/Media.js';
import { Project } from './models/Project.js';
import { Retouche } from './models/Retouche.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware de base
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json({ limit: '10mb' })); // Limite pour les uploads
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Servir les fichiers statiques en production
if (process.env.NODE_ENV === 'production') {
  // Servir le frontend Astro builded
  app.use(express.static(resolve(__dirname, '../../frontend/dist')));
  
  // Servir les uploads depuis le frontend
  app.use('/uploads', express.static(resolve(__dirname, '../../frontend/dist/uploads')));
}

// Middleware de sécurité
app.use(securityHeaders);

// Middleware de logging API
app.use('/api', apiLogger);

// Middleware de nettoyage des sessions
app.use(cleanupExpiredSessions);

/**
 * Initialiser la base de données et les services au démarrage
 */
async function initializeDatabase() {
  try {
    console.log('🔄 Initializing database...');
    
    // Exécuter les migrations
    await MigrationManager.runMigrations();
    
    // Les seeds sont maintenant dans la migration 005
    console.log('🌱 Seeds are now handled by migration 005');
    
    // Vérifier la configuration email
    const emailConfigured = await EmailService.verifyConfiguration();
    if (!emailConfigured) {
      console.warn('⚠️  Email service not configured properly - magic links may not work');
    }
    
    console.log('✅ Database initialized successfully');
    
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    process.exit(1);
  }
}

// ===========================================
// ROUTES DE BASE
// ===========================================

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: '✅ Backend TypeScript + SQLite + API REST opérationnel',
    timestamp: new Date().toISOString(),
    database: 'connected',
    api_version: '1.0.0'
  });
});

app.get('/api/test', (req, res) => {
  res.json({ 
    message: '✅ API Express + TypeScript + SQLite fonctionnelle',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    features: [
      'Projects CRUD',
      'Retouches CRUD', 
      'Media CRUD',
      'About page',
      'Clients management',
      'Contacts management',
      'Search',
      'Statistics'
    ]
  });
});

// ===========================================
// ROUTES DE TEST (anciennes)
// ===========================================

/**
 * Route de test de la base de données
 */
app.get('/api/db-status', async (req, res) => {
  try {
    // Tester la connexion
    const db = DatabaseManager.getInstance();
    
    // Compter les enregistrements dans chaque table
    const stats = {
      users: User.findAll().length,
      media: Media.findAll(10).length,
      projects: Project.count(),
      retouches: Retouche.count(),
      database_path: process.env.DATABASE_PATH || 'default',
      connected: true
    };
    
    res.json({
      status: 'ok',
      message: '✅ Database SQLite operational',
      stats
    });
    
  } catch (error: unknown) {
    console.error('Database status error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Database connection failed',
      error: error instanceof Error ? error.message : 'An unknown error occurred'
    });
  }
});

/**
 * Route de test des données
 */
app.get('/api/test-data', async (req, res) => {
  try {
    // Récupérer quelques données de test
    const users = User.findAll();
    const projects = Project.findAll({ limit: 3 });
    const retouches = Retouche.findAll({ limit: 3 });
    const media = Media.findAll(5);
    
    res.json({
      status: 'ok',
      message: '✅ Test data retrieved successfully',
      data: {
        users: users.map(u => u.toJSON()),
        projects: projects.map(p => p.toJSON()),
        retouches: retouches.map(r => r.toJSON()),
        media: media.map(m => m.toJSON())
      },
      counts: {
        users: users.length,
        projects: projects.length,
        retouches: retouches.length,
        media: media.length
      }
    });
    
  } catch (error: unknown) {
    console.error('Test data error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve test data',
      error: error instanceof Error ? error.message : 'An unknown error occurred'
    });
  }
});

/**
 * Route pour créer un média de test
 */
app.post('/api/test-media', async (req, res) => {
  try {
    const mediaData = {
      filename: `test-${Date.now()}.jpg`,
      url: `/uploads/test/test-${Date.now()}.jpg`,
      caption: 'Image de test créée via API',
      alt: 'Test image',
      mime_type: 'image/jpeg',
      size: 1024000,
      width: 800,
      height: 600
    };
    
    const media = Media.create(mediaData);
    
    res.json({
      status: 'ok',
      message: '✅ Test media created successfully',
      data: media.toJSON()
    });
    
  } catch (error: unknown) {
    console.error('Create media error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to create test media',
      error: error instanceof Error ? error.message : 'An unknown error occurred'
    });
  }
});

/**
 * Route pour tester les relations
 */
app.get('/api/test-relations', async (req, res) => {
  try {
    // Tester l'hydratation des relations
    const projects = Project.findAll({ limit: 1 });
    const retouches = Retouche.findAll({ limit: 1 });
    
    const result = {
      status: 'ok',
      message: '✅ Relations hydration working',
      tests: {
        project_with_images: projects.length > 0 ? {
          id: projects[0].id,
          title: projects[0].title,
          images_count: projects[0].images.length,
          first_image: projects[0].images[0]?.toJSON() || null,
          seo: projects[0].seo
        } : null,
        
        retouche_with_images: retouches.length > 0 ? {
          id: retouches[0].id,
          title: retouches[0].title,
          before_image: retouches[0].before_image.toJSON(),
          after_image: retouches[0].after_image.toJSON(),
          seo: retouches[0].seo
        } : null
      }
    };
    
    res.json(result);
    
  } catch (error: unknown) {
    console.error('Relations test error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Relations test failed',
      error: error instanceof Error ? error.message : 'An unknown error occurred'
    });
  }
});

// ===========================================
// ROUTES API REST
// ===========================================

// Routes principales
app.use('/api/auth', authRoutes); // Routes d'authentification
app.use('/api/auth', authDebugRoutes); // Routes de debug auth

// Routes publiques (pas de protection)
app.use('/api', utilsRoutes); // /api/stats, /api/search, /api/health-detailed
app.use('/api', debugRoutes); // /api/debug
app.use('/api', seoRoutes); // /api/sitemap.xml, /api/seo/meta/:type/:id
app.use('/api', legalRoutes); // /api/legal, /api/legal/:type (GET public, PUT protégé)
app.use('/api', analyticsRoutes); // /api/analytics/track (POST public), /api/analytics/stats (GET protégé)

// Routes publiques pour le frontend
import heroRoutes from './routes/public/hero.js';
import projectsPublicRoutes from './routes/public/projects.js';
import retouchesPublicRoutes from './routes/public/retouches.js';
import aboutPublicRoutes from './routes/public/about.js';
app.use('/api/public', heroRoutes); // /api/public/hero, /api/public/hero/stats
app.use('/api/public/projects', projectsPublicRoutes); // /api/public/projects
app.use('/api/public/retouches', retouchesPublicRoutes); // /api/public/retouches
app.use('/api/public', aboutPublicRoutes); // /api/public/about

// Routes protégées (nécessitent une authentification)
app.use('/api/projects', requireAuth, projectsRoutes);
app.use('/api/retouches', requireAuth, retouchesRoutes);
app.use('/api/media', requireAuth, mediaRoutes);
app.use('/api/about', requireAuth, aboutRoutes); // /api/about
app.use('/api/users', usersRoutes); // Protection admin intégrée dans les routes

// ===========================================
// MIDDLEWARE DE GESTION D'ERREURS
// ===========================================

// Middleware de gestion des erreurs
app.use(errorHandler);

// Route 404 - SEULEMENT pour les routes API
app.use('/api/*', (req, res) => {
  res.status(404).json({
    status: 'error',
    message: 'API route not found',
    path: req.originalUrl,
    available_routes: [
      'GET /api/health',
      'GET /api/test',
      'GET /api/db-status',
      'GET /api/test-data',
      'POST /api/test-media',
      'GET /api/test-relations',
      'GET /api/projects',
      'POST /api/projects',
      'GET /api/projects/:id',
      'PUT /api/projects/:id',
      'DELETE /api/projects/:id',
      'GET /api/retouches',
      'POST /api/retouches',
      'GET /api/retouches/:id',
      'PUT /api/retouches/:id',
      'DELETE /api/retouches/:id',
      'GET /api/media',
      'POST /api/media',
      'GET /api/media/:id',
      'PUT /api/media/:id',
      'DELETE /api/media/:id',
      'GET /api/about',
      'PUT /api/about',
      'GET /api/clients',
      'POST /api/clients',
      'PUT /api/clients/:id',
      'DELETE /api/clients/:id',
      'GET /api/contacts',
      'POST /api/contacts',
      'PUT /api/contacts/:id',
      'DELETE /api/contacts/:id',
      'GET /api/users (admin)',
      'POST /api/users (admin)',
      'PUT /api/users/:id/role (admin)',
      'DELETE /api/users/:id (admin)',
      'GET /api/stats',
      'GET /api/search',
      'GET /api/health-detailed',
      'GET /api/config'
    ]
  });
});

// Route catch-all pour servir le frontend en production (doit être APRÈS les routes API)
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    // Ne pas intercepter les routes API
    if (req.path.startsWith('/api/')) {
      return res.status(404).json({ error: 'API route not found' });
    }
    
    // Servir l'index.html d'Astro pour toutes les autres routes
    res.sendFile(resolve(__dirname, '../../frontend/dist/index.html'));
  });
}

/**
 * Démarrage du serveur
 */
async function startServer() {
  try {
    // Initialiser la base de données
    await initializeDatabase();
    
    // Démarrer le serveur
    app.listen(PORT, () => {
      console.log(`🚀 Backend TypeScript + API REST démarré sur le port ${PORT}`);
      console.log(`📡 API disponible sur http://localhost:${PORT}/api`);
      console.log(`🔍 Health check: http://localhost:${PORT}/api/health`);
      console.log(`🗄️  Database status: http://localhost:${PORT}/api/db-status`);
      console.log(`📊 Statistics: http://localhost:${PORT}/api/stats`);
      console.log(`🔍 Search: http://localhost:${PORT}/api/search?q=test`);
      console.log(`🛠️  Debug data: http://localhost:${PORT}/api/debug`);
      console.log(`📋 All routes: http://localhost:${PORT}/api/404`);
      console.log('');      
      console.log('🌎 Frontend URLs:');
      console.log('  Debug Panel: http://localhost:3000/debug');
      console.log('  Homepage: http://localhost:3000/');
      console.log('  📸 Images: http://localhost:3000/uploads/ (served by Astro)');
      console.log('');
      console.log('🎯 API REST Endpoints:');
      console.log('  Auth: /api/auth');
      console.log('  Projects: /api/projects');
      console.log('  Retouches: /api/retouches');
      console.log('  Media: /api/media');
      console.log('  About: /api/about');
      console.log('  Users: /api/users (admin only)');
      console.log('  Clients: /api/clients');
      console.log('  Contacts: /api/contacts');
      console.log('');
      console.log('✅ Task 1.3 - API REST complète terminée !');
      console.log('🔧 Images upload middleware fixé - servies par Astro');
    });
    
  } catch (error) {
    console.error('❌ Server startup failed:', error);
    process.exit(1);
  }
}

// Gestion propre de l'arrêt
process.on('SIGINT', () => {
  console.log('🔄 Shutting down gracefully...');
  DatabaseManager.close();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('🔄 Shutting down gracefully...');
  DatabaseManager.close();
  process.exit(0);
});

// Démarrer le serveur
startServer();

export default app;