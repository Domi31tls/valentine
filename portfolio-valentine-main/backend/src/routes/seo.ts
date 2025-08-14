import { Router } from 'express';
import { Project } from '../models/Project.js';
import { Retouche } from '../models/Retouche.js';
import { SEOSettings } from '../models/SEOSettings.js';
import { ApiUtils } from '../utils/api.js';
import { requireAuth } from '../utils/auth.js';

const router = Router();

/**
 * GET /api/sitemap.xml - Génération automatique du sitemap
 */
router.get('/sitemap.xml', async (req, res) => {
  try {
    // Définir les URLs de base
    const baseUrl = process.env.SITE_URL || 'https://valentine-arnaly.com';
    const now = new Date().toISOString();
    
    // Pages statiques
    const staticPages = [
      { url: '/', priority: '1.0', changefreq: 'weekly' },
      { url: '/projets', priority: '0.9', changefreq: 'daily' },
      { url: '/retouches', priority: '0.9', changefreq: 'daily' },
      { url: '/about', priority: '0.8', changefreq: 'monthly' },
      { url: '/contact', priority: '0.7', changefreq: 'monthly' },
      { url: '/mentions-legales', priority: '0.3', changefreq: 'yearly' }
    ];

    // Récupérer les projets publiés
    const projects = Project.findAll({ status: 'published', limit: 1000, offset: 0 });
    
    // Récupérer les retouches publiées  
    const retouches = Retouche.findAll({ status: 'published', limit: 1000, offset: 0 });

    // Construire le XML du sitemap
    let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;

    // Ajouter les pages statiques
    staticPages.forEach(page => {
      sitemap += `
  <url>
    <loc>${baseUrl}${page.url}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`;
    });

    // Ajouter les projets
    projects.forEach(project => {
      const slug = generateSlug(project.title);
      sitemap += `
  <url>
    <loc>${baseUrl}/projets/${slug}</loc>
    <lastmod>${project.updated_at}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>`;
    });

    // Ajouter les retouches
    retouches.forEach(retouche => {
      const slug = generateSlug(retouche.title);
      sitemap += `
  <url>
    <loc>${baseUrl}/retouches/${slug}</loc>
    <lastmod>${retouche.updated_at}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`;
    });

    sitemap += `
</urlset>`;

    // Retourner le XML avec les bons headers
    res.set({
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600' // Cache 1 heure
    });
    
    res.send(sitemap);

  } catch (error) {
    console.error('Error generating sitemap:', error);
    ApiUtils.error(res, 500, 'Failed to generate sitemap');
  }
});

/**
 * GET /api/seo/meta/:type/:id - Métadonnées pour une page spécifique
 */
router.get('/meta/:type/:id', async (req, res) => {
  try {
    const { type, id } = req.params;
    const baseUrl = process.env.SITE_URL || 'https://valentine-arnaly.com';
    
    let meta: any = {
      title: 'Valentine Arnaly - Photographe',
      description: 'Portfolio de Valentine Arnaly, photographe professionnelle spécialisée en portrait et reportage.',
      image: `${baseUrl}/uploads/default-og.jpg`,
      url: baseUrl
    };

    if (type === 'project') {
      const project = Project.findById(id);
      if (project) {
        const projectData = project.toJSON();
        const slug = generateSlug(projectData.title);
        
        meta = {
          title: projectData.seo?.title || `${projectData.title} - Valentine Arnaly`,
          description: projectData.seo?.description || projectData.description || meta.description,
          image: projectData.seo?.ogImage?.url || projectData.images[0]?.url || meta.image,
          url: `${baseUrl}/projets/${slug}`,
          type: 'article',
          keywords: projectData.seo?.keywords || []
        };
      }
    } else if (type === 'retouche') {
      const retouche = Retouche.findById(id);
      if (retouche) {
        const retoucheData = retouche.toJSON();
        const slug = generateSlug(retoucheData.title);
        
        meta = {
          title: retoucheData.seo?.title || `${retoucheData.title} - Retouche Photo`,
          description: retoucheData.seo?.description || `Exemple de retouche photo : ${retoucheData.title}`,
          image: retoucheData.seo?.ogImage?.url || retoucheData.after_image?.url || meta.image,
          url: `${baseUrl}/retouches/${slug}`,
          type: 'article',
          keywords: retoucheData.seo?.keywords || []
        };
      }
    }

    ApiUtils.success(res, meta);

  } catch (error) {
    console.error('Error getting meta data:', error);
    ApiUtils.error(res, 500, 'Failed to get meta data');
  }
});

/**
 * Génère un slug SEO-friendly à partir d'un titre
 */
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .normalize('NFD') // Décomposer les accents
    .replace(/[\u0300-\u036f]/g, '') // Supprimer les accents
    .replace(/[^a-z0-9\s-]/g, '') // Garder seulement lettres, chiffres, espaces et tirets
    .trim()
    .replace(/\s+/g, '-') // Remplacer espaces par tirets
    .replace(/-+/g, '-') // Éviter les tirets multiples
    .substring(0, 50); // Limiter la longueur
}

/**
 * GET /api/seo/settings - Récupérer les paramètres SEO
 */
router.get('/seo/settings', async (req, res) => {
  try {
    const settings = SEOSettings.get();
    ApiUtils.success(res, settings.toJSON());
  } catch (error) {
    console.error('Error fetching SEO settings:', error);
    ApiUtils.error(res, 500, 'Failed to fetch SEO settings');
  }
});

/**
 * PUT /api/seo/settings - Mettre à jour les paramètres SEO (protégé)
 */
router.put('/seo/settings', requireAuth, async (req, res) => {
  try {
    const settings = SEOSettings.get();
    settings.update(req.body);
    
    ApiUtils.success(res, settings.toJSON(), 'SEO settings updated successfully');
  } catch (error) {
    console.error('Error updating SEO settings:', error);
    ApiUtils.error(res, 500, 'Failed to update SEO settings');
  }
});

/**
 * GET /api/seo/robots.txt - Générer robots.txt
 */
router.get('/seo/robots.txt', async (req, res) => {
  try {
    const settings = SEOSettings.get();
    const robotsTxt = settings.generateRobotsTxt();
    
    res.set({
      'Content-Type': 'text/plain',
      'Cache-Control': 'public, max-age=3600'
    });
    
    res.send(robotsTxt);
  } catch (error) {
    console.error('Error generating robots.txt:', error);
    ApiUtils.error(res, 500, 'Failed to generate robots.txt');
  }
});

/**
 * PUT /api/seo/robots - Mettre à jour le mode robots.txt (protégé)
 */
router.put('/seo/robots', requireAuth, async (req, res) => {
  try {
    const { mode } = req.body;
    
    // Valider le mode
    const validModes = ['allow_all', 'protect_admin', 'block_all'];
    const modeMap: { [key: string]: string } = {
      'everyone': 'allow_all',
      'secured': 'protect_admin', 
      'invisible': 'block_all'
    };
    
    const robotsMode = modeMap[mode] || mode;
    
    if (!validModes.includes(robotsMode)) {
      return ApiUtils.error(res, 400, 'Invalid robots mode');
    }
    
    const settings = SEOSettings.get();
    settings.update({ robots_mode: robotsMode as any });
    
    ApiUtils.success(res, { 
      robots_mode: robotsMode,
      robots_description: settings.getRobotsModeDescription() 
    }, 'Robots.txt mode updated successfully');
  } catch (error) {
    console.error('Error updating robots mode:', error);
    ApiUtils.error(res, 500, 'Failed to update robots mode');
  }
});

/**
 * GET /api/seo/status - Obtenir le statut SEO
 */
router.get('/seo/status', async (req, res) => {
  try {
    const settings = SEOSettings.get();
    const status = settings.getSEOStatus();
    
    ApiUtils.success(res, {
      ...status,
      robots_mode: settings.robots_mode,
      robots_description: settings.getRobotsModeDescription()
    });
  } catch (error) {
    console.error('Error fetching SEO status:', error);
    ApiUtils.error(res, 500, 'Failed to fetch SEO status');
  }
});

export default router;
