import { Router } from 'express';
import { Project } from '../../models/Project.js';
import { ApiUtils } from '../../utils/api.js';

const router = Router();

/**
 * GET /api/public/projects - Liste des projets publiés
 */
router.get('/', async (req, res) => {
  try {
    const { 
      limit = 20, 
      offset = 0,
      status = 'published'
    } = req.query;

    // Validation des paramètres
    const validatedLimit = Math.min(Number(limit) || 20, 100);
    const validatedOffset = Math.max(Number(offset) || 0, 0);

    // Récupérer les projets avec leurs images
    const { projects, total } = Project.getPublishedWithImages(validatedLimit, validatedOffset);

    // Préparer la réponse
    const response = {
      success: true,
      data: projects.map(project => project.toJSON()),
      pagination: {
        total,
        limit: validatedLimit,
        offset: validatedOffset,
        has_more: (validatedOffset + validatedLimit) < total
      }
    };

    res.json(response);

  } catch (error) {
    console.error('Erreur lors de la récupération des projets publics:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur interne du serveur'
    });
  }
});

/**
 * GET /api/public/projects/stats - Statistiques des projets publics
 */
router.get('/stats', async (req, res) => {
  try {
    const publishedCount = Project.countPublished();
    
    res.json({
      success: true,
      data: {
        total_published: publishedCount,
        total_with_images: publishedCount
      }
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des stats projets:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur interne du serveur'
    });
  }
});

/**
 * GET /api/public/projects/:id - Détail d'un projet publié
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!ApiUtils.isValidID(id)) {
      return res.status(400).json({
        success: false,
        error: 'ID de projet invalide'
      });
    }

    // Récupérer le projet
    const project = Project.findById(id);

    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Projet non trouvé'
      });
    }

    // Vérifier que le projet est publié
    if (project.status !== 'published') {
      return res.status(404).json({
        success: false,
        error: 'Projet non disponible'
      });
    }

    res.json({
      success: true,
      data: project.toJSON()
    });

  } catch (error) {
    console.error('Erreur lors de la récupération du projet:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur interne du serveur'
    });
  }
});

export default router;
