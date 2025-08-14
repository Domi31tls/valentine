import { Router } from 'express';
import { Retouche } from '../models/Retouche.js';
import { Media } from '../models/Media.js';
import { ApiUtils, validateId, validateRequired } from '../utils/api.js';
import { VALIDATION } from '../utils/constants.js';
import type { RetoucheCreateInput, RetoucheUpdateInput } from '../../../shared/types.js';

const router = Router();

/**
 * GET /api/retouches - Liste des retouches avec filtres
 */
router.get('/', async (req, res) => {
  try {
    const { limit, offset, page } = ApiUtils.validatePagination(req.query);
    const status = ApiUtils.validateStatus(req.query.status as string);
    const search = ApiUtils.sanitizeSearchQuery(req.query.search as string);

    // Récupérer les retouches avec filtres
    const retouches = Retouche.findAll({
      status,
      limit,
      offset
    });

    // Filtrer par recherche si nécessaire
    const filteredRetouches = search 
      ? retouches.filter(r => 
          r.title.toLowerCase().includes(search.toLowerCase())
        )
      : retouches;

    // Compter le total
    const total = Retouche.count(status);

    // Formater la réponse
    const response = ApiUtils.formatPaginatedResponse(
      filteredRetouches.map(r => r.toJSON()),
      total,
      page,
      limit
    );

    ApiUtils.success(res, response);

  } catch (error) {
    console.error('Error fetching retouches:', error);
    ApiUtils.error(res, 500, 'Failed to fetch retouches');
  }
});

/**
 * GET /api/retouches/:id - Détail d'une retouche
 */
router.get('/:id', validateId(), async (req, res) => {
  try {
    const retouche = Retouche.findById(req.params.id);

    if (!retouche) {
      ApiUtils.error(res, 404, 'Retouche not found');
      return;
    }

    ApiUtils.success(res, retouche.toJSON());

  } catch (error) {
    console.error('Error fetching retouche:', error);
    ApiUtils.error(res, 500, 'Failed to fetch retouche');
  }
});

/**
 * POST /api/retouches - Créer une nouvelle retouche
 */
router.post('/', validateRequired(['title', 'before_image', 'after_image', 'status']), async (req, res) => {
  try {
    const data: RetoucheCreateInput = req.body;

    // Validation des longueurs
    if (data.title.length < VALIDATION.RETOUCHE.TITLE_MIN_LENGTH || 
        data.title.length > VALIDATION.RETOUCHE.TITLE_MAX_LENGTH) {
      ApiUtils.error(res, 400, 
        `Title must be between ${VALIDATION.RETOUCHE.TITLE_MIN_LENGTH} and ${VALIDATION.RETOUCHE.TITLE_MAX_LENGTH} characters`
      );
      return;
    }

    // Validation du SEO
    if (data.seo?.title && data.seo.title.length > VALIDATION.SEO.TITLE_MAX_LENGTH) {
      ApiUtils.error(res, 400, 
        `SEO title must be less than ${VALIDATION.SEO.TITLE_MAX_LENGTH} characters`
      );
      return;
    }

    if (data.seo?.description && data.seo.description.length > VALIDATION.SEO.DESCRIPTION_MAX_LENGTH) {
      ApiUtils.error(res, 400, 
        `SEO description must be less than ${VALIDATION.SEO.DESCRIPTION_MAX_LENGTH} characters`
      );
      return;
    }

    // Vérifier que les images existent
    const beforeImage = Media.findById(data.before_image.id);
    const afterImage = Media.findById(data.after_image.id);

    if (!beforeImage) {
      ApiUtils.error(res, 400, 'Before image does not exist');
      return;
    }

    if (!afterImage) {
      ApiUtils.error(res, 400, 'After image does not exist');
      return;
    }

    // Créer la retouche
    const retouche = Retouche.create({
      ...data,
      before_image: beforeImage,
      after_image: afterImage,
      seo: data.seo || {}
    });

    ApiUtils.success(res, retouche.toJSON(), 'Retouche created successfully');

  } catch (error) {
    console.error('Error creating retouche:', error);
    ApiUtils.error(res, 500, 'Failed to create retouche');
  }
});

/**
 * PUT /api/retouches/:id - Modifier une retouche
 */
router.put('/:id', validateId(), async (req, res) => {
  try {
    const retouche = Retouche.findById(req.params.id);

    if (!retouche) {
      ApiUtils.error(res, 404, 'Retouche not found');
      return;
    }

    const data: Partial<RetoucheUpdateInput> = req.body;

    // Validation des longueurs si les champs sont fournis
    if (data.title !== undefined) {
      if (data.title.length < VALIDATION.RETOUCHE.TITLE_MIN_LENGTH || 
          data.title.length > VALIDATION.RETOUCHE.TITLE_MAX_LENGTH) {
        ApiUtils.error(res, 400, 
          `Title must be between ${VALIDATION.RETOUCHE.TITLE_MIN_LENGTH} and ${VALIDATION.RETOUCHE.TITLE_MAX_LENGTH} characters`
        );
        return;
      }
    }

    // Validation du SEO
    if (data.seo?.title && data.seo.title.length > VALIDATION.SEO.TITLE_MAX_LENGTH) {
      ApiUtils.error(res, 400, 
        `SEO title must be less than ${VALIDATION.SEO.TITLE_MAX_LENGTH} characters`
      );
      return;
    }

    if (data.seo?.description && data.seo.description.length > VALIDATION.SEO.DESCRIPTION_MAX_LENGTH) {
      ApiUtils.error(res, 400, 
        `SEO description must be less than ${VALIDATION.SEO.DESCRIPTION_MAX_LENGTH} characters`
      );
      return;
    }

    // Vérifier que les images existent si elles sont modifiées
    if (data.before_image) {
      const beforeImage = Media.findById(data.before_image.id);
      if (!beforeImage) {
        ApiUtils.error(res, 400, 'Before image does not exist');
        return;
      }
    }

    if (data.after_image) {
      const afterImage = Media.findById(data.after_image.id);
      if (!afterImage) {
        ApiUtils.error(res, 400, 'After image does not exist');
        return;
      }
    }

    // Mettre à jour la retouche
    retouche.update(data);

    ApiUtils.success(res, retouche.toJSON(), 'Retouche updated successfully');

  } catch (error) {
    console.error('Error updating retouche:', error);
    ApiUtils.error(res, 500, 'Failed to update retouche');
  }
});

/**
 * DELETE /api/retouches/:id - Supprimer une retouche
 */
router.delete('/:id', validateId(), async (req, res) => {
  try {
    const retouche = Retouche.findById(req.params.id);

    if (!retouche) {
      ApiUtils.error(res, 404, 'Retouche not found');
      return;
    }

    const deleted = Retouche.delete(req.params.id);

    if (!deleted) {
      ApiUtils.error(res, 500, 'Failed to delete retouche');
      return;
    }

    ApiUtils.success(res, null, 'Retouche deleted successfully');

  } catch (error) {
    console.error('Error deleting retouche:', error);
    ApiUtils.error(res, 500, 'Failed to delete retouche');
  }
});

export default router;
