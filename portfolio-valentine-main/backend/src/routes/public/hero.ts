import { Router } from 'express';
import { Project } from '../../models/Project.js';
import { Retouche } from '../../models/Retouche.js';
import { Media } from '../../models/Media.js';
import { ApiUtils } from '../../utils/api.js';

const router = Router();

/**
 * GET /api/public/hero
 * Récupère du contenu aléatoire pour la section hero
 * Query params:
 * - mode: 'photo' | 'retouche' (défaut: 'photo')
 * - count: nombre d'éléments à récupérer (défaut: 1)
 */
router.get('/hero', async (req, res) => {
  try {
    const mode = (req.query.mode as string) || 'photo';
    const count = parseInt(req.query.count as string) || 1;

    // Validation
    if (!['photo', 'retouche'].includes(mode)) {
      return ApiUtils.sendError(res, 400, 'Mode doit être "photo" ou "retouche"');
    }

    if (count < 1 || count > 10) {
      return ApiUtils.sendError(res, 400, 'Count doit être entre 1 et 10');
    }

    let content: any[] = [];

    if (mode === 'photo') {
      // Récupérer des projets aléatoires avec leurs images
      const projects = Project.getRandomPublished(count);
      
      content = projects.map(project => ({
        ...project.toJSON(),
        type: 'project'
      }));
    } else {
      // Récupérer des retouches aléatoires
      const retouches = Retouche.getRandomPublished(count);
      
      content = retouches.map(retouche => ({
        ...retouche.toJSON(),
        type: 'retouche'
      }));
    }

    // Si aucun contenu trouvé
    if (content.length === 0) {
      return ApiUtils.sendSuccess(res, {
        data: [],
        message: `Aucun ${mode === 'photo' ? 'projet' : 'retouche'} publié trouvé`
      });
    }

    // Structure de réponse cohérente avec le frontend
    ApiUtils.sendSuccess(res, {
      data: content,
      mode,
      total: content.length
    });

  } catch (error) {
    console.error('Erreur récupération hero:', error);
    ApiUtils.sendError(res, 500, 'Erreur serveur lors de la récupération du contenu hero');
  }
});

/**
 * GET /api/public/hero/stats
 * Récupère les statistiques pour la section hero
 */
router.get('/hero/stats', async (req, res) => {
  try {
    const projectsCount = Project.countPublished();
    const retouchesCount = Retouche.countPublished();

    // Structure de réponse cohérente
    ApiUtils.sendSuccess(res, {
      data: {
        projects: projectsCount,
        retouches: retouchesCount,
        total: projectsCount + retouchesCount
      }
    });

  } catch (error) {
    console.error('Erreur récupération stats hero:', error);
    ApiUtils.sendError(res, 500, 'Erreur serveur lors de la récupération des statistiques');
  }
});

/**
 * GET /api/public/hero/image
 * Récupère une image aléatoire de tous les médias disponibles
 */
router.get('/hero/image', async (req, res) => {
  try {
    // Récupérer tous les médias disponibles
    const allMedia = Media.findAll(1000, 0); // Récupérer jusqu'à 1000 médias
    
    if (allMedia.length === 0) {
      return ApiUtils.sendSuccess(res, {
        data: null,
        message: 'Aucune image disponible'
      });
    }

    // Sélectionner une image aléatoire
    const randomIndex = Math.floor(Math.random() * allMedia.length);
    const randomImage = allMedia[randomIndex];

    ApiUtils.sendSuccess(res, {
      data: randomImage.toJSON(),
      total: allMedia.length
    });

  } catch (error) {
    console.error('Erreur récupération image aléatoire:', error);
    ApiUtils.sendError(res, 500, 'Erreur serveur lors de la récupération de l\'image aléatoire');
  }
});

export default router;