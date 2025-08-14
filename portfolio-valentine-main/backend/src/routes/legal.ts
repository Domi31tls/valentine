import { Router } from 'express';
import { LegalPage } from '../models/LegalPage.js';
import { ApiUtils, validateRequired } from '../utils/api.js';
import { requireAuth } from '../utils/auth.js';

const router = Router();

/**
 * GET /api/legal - Liste des pages légales
 */
router.get('/legal', async (req, res) => {
  try {
    const pages = LegalPage.findAll();
    ApiUtils.success(res, pages.map(p => p.toJSON()));
  } catch (error) {
    console.error('Error fetching legal pages:', error);
    ApiUtils.error(res, 500, 'Failed to fetch legal pages');
  }
});

/**
 * GET /api/legal/:type - Récupérer une page légale par type
 */
router.get('/legal/:type', async (req, res) => {
  try {
    const { type } = req.params;
    const page = LegalPage.findByType(type);

    if (!page) {
      ApiUtils.error(res, 404, 'Legal page not found');
      return;
    }

    ApiUtils.success(res, page.toJSON());
  } catch (error) {
    console.error('Error fetching legal page:', error);
    ApiUtils.error(res, 500, 'Failed to fetch legal page');
  }
});

/**
 * PUT /api/legal/:type - Modifier une page légale (protégé)
 */
router.put('/legal/:type', requireAuth, validateRequired(['title', 'content']), async (req, res) => {
  try {
    const { type } = req.params;
    const { title, content, is_published } = req.body;

    let page = LegalPage.findByType(type);

    if (!page) {
      // Créer la page si elle n'existe pas
      const newPageData = {
        id: type,
        type,
        title,
        content,
        is_published: is_published !== undefined ? is_published : true
      };
      
      page = LegalPage.create(newPageData);
    } else {
      // Mettre à jour la page existante
      page.update({
        title,
        content,
        is_published: is_published !== undefined ? is_published : page.is_published
      });
    }

    ApiUtils.success(res, page.toJSON(), 'Legal page updated successfully');
  } catch (error) {
    console.error('Error updating legal page:', error);
    ApiUtils.error(res, 500, 'Failed to update legal page');
  }
});

export default router;
