import { Router } from 'express';
import { Retouche } from '../../models/Retouche.js';
import { ApiUtils } from '../../utils/api.js';

const router = Router();

/**
 * GET /api/public/retouches - Liste des retouches publiées
 */
router.get('/', async (req, res) => {
  try {
    const { 
      limit = 12, 
      offset = 0,
      status = 'published'
    } = req.query;

    // Validation des paramètres
    const validatedLimit = Math.min(Number(limit) || 12, 50);
    const validatedOffset = Math.max(Number(offset) || 0, 0);

    // Récupérer les retouches avec leurs images
    const { retouches, total } = Retouche.getPublishedWithImages(validatedLimit, validatedOffset);

    // Préparer la réponse
    const response = {
      success: true,
      data: retouches.map(retouche => retouche.toJSON()),
      pagination: {
        total,
        limit: validatedLimit,
        offset: validatedOffset,
        has_more: (validatedOffset + validatedLimit) < total
      }
    };

    res.json(response);

  } catch (error) {
    console.error('Erreur lors de la récupération des retouches publiques:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur interne du serveur'
    });
  }
});

/**
 * GET /api/public/retouches/stats - Statistiques des retouches publiques
 */
router.get('/stats', async (req, res) => {
  try {
    const publishedCount = Retouche.countPublished();
    
    res.json({
      success: true,
      data: {
        total_published: publishedCount,
        total_with_images: publishedCount
      }
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des stats retouches:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur interne du serveur'
    });
  }
});

/**
 * GET /api/public/retouches/:id - Détail d'une retouche publiée
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!ApiUtils.isValidID(id)) {
      return res.status(400).json({
        success: false,
        error: 'ID de retouche invalide'
      });
    }

    // Récupérer la retouche
    const retouche = Retouche.findById(id);

    if (!retouche) {
      return res.status(404).json({
        success: false,
        error: 'Retouche non trouvée'
      });
    }

    // Vérifier que la retouche est publiée
    if (retouche.status !== 'published') {
      return res.status(404).json({
        success: false,
        error: 'Retouche non disponible'
      });
    }

    res.json({
      success: true,
      data: retouche.toJSON()
    });

  } catch (error) {
    console.error('Erreur lors de la récupération de la retouche:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur interne du serveur'
    });
  }
});

export default router;
