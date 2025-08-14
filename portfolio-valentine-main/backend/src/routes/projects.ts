import { Router } from 'express';
import { Project } from '../models/Project.js';
import { Media } from '../models/Media.js';
import { ApiUtils, validateId, validateRequired } from '../utils/api.js';
import { VALIDATION } from '../utils/constants.js';
import type { ProjectCreateInput, ProjectUpdateInput } from '../../../shared/types.js';

const router = Router();

/**
 * GET /api/projects - Liste des projets avec filtres
 */
router.get('/', async (req, res) => {
  try {
    const { limit, offset, page } = ApiUtils.validatePagination(req.query);
    const status = ApiUtils.validateStatus(req.query.status as string);
    const search = ApiUtils.sanitizeSearchQuery(req.query.search as string);

    // Récupérer les projets avec filtres
    const projects = Project.findAll({
      status,
      limit,
      offset
    });

    // Filtrer par recherche si nécessaire
    const filteredProjects = search 
      ? projects.filter(p => 
          p.title.toLowerCase().includes(search.toLowerCase()) ||
          p.description?.toLowerCase().includes(search.toLowerCase())
        )
      : projects;

    // Compter le total
    const total = Project.count(status);

    // Formater la réponse
    const response = ApiUtils.formatPaginatedResponse(
      filteredProjects.map(p => p.toJSON()),
      total,
      page,
      limit
    );

    ApiUtils.success(res, response);

  } catch (error) {
    console.error('Error fetching projects:', error);
    ApiUtils.error(res, 500, 'Failed to fetch projects');
  }
});

/**
 * GET /api/projects/:id - Détail d'un projet
 */
router.get('/:id', validateId(), async (req, res) => {
  try {
    const project = Project.findById(req.params.id);

    if (!project) {
      ApiUtils.error(res, 404, 'Project not found');
      return;
    }

    ApiUtils.success(res, project.toJSON());

  } catch (error) {
    console.error('Error fetching project:', error);
    ApiUtils.error(res, 500, 'Failed to fetch project');
  }
});

/**
 * POST /api/projects - Créer un nouveau projet
 */
router.post('/', validateRequired(['status']), async (req, res) => {
  try {
    const data: ProjectCreateInput = req.body;

    // Le titre peut être vide (approche Notion) - on valide seulement s'il est fourni
    if (data.title && (data.title.length < VALIDATION.PROJECT.TITLE_MIN_LENGTH || 
        data.title.length > VALIDATION.PROJECT.TITLE_MAX_LENGTH)) {
      ApiUtils.error(res, 400, 
        `Title must be between ${VALIDATION.PROJECT.TITLE_MIN_LENGTH} and ${VALIDATION.PROJECT.TITLE_MAX_LENGTH} characters`
      );
      return;
    }

    if (data.description && data.description.length > VALIDATION.PROJECT.DESCRIPTION_MAX_LENGTH) {
      ApiUtils.error(res, 400, 
        `Description must be less than ${VALIDATION.PROJECT.DESCRIPTION_MAX_LENGTH} characters`
      );
      return;
    }

    // Validation des images
    if (data.images && data.images.length > VALIDATION.PROJECT.MAX_IMAGES) {
      ApiUtils.error(res, 400, 
        `Maximum ${VALIDATION.PROJECT.MAX_IMAGES} images allowed`
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
    if (data.images && data.images.length > 0) {
      const imageIds = data.images.map(img => img.id);
      const existingImages = Media.findByIds(imageIds);
      
      if (existingImages.length !== imageIds.length) {
        ApiUtils.error(res, 400, 'Some images do not exist');
        return;
      }
    }

    // Créer le projet
    const project = Project.create({
      ...data,
      images: data.images || [],
      seo: data.seo || {}
    });

    ApiUtils.success(res, project.toJSON(), 'Project created successfully');

  } catch (error) {
    console.error('Error creating project:', error);
    ApiUtils.error(res, 500, 'Failed to create project');
  }
});

/**
 * PUT /api/projects/:id - Modifier un projet
 */
router.put('/:id', validateId(), async (req, res) => {
  try {
    const project = Project.findById(req.params.id);

    if (!project) {
      ApiUtils.error(res, 404, 'Project not found');
      return;
    }

    const data: Partial<ProjectUpdateInput> = req.body;

    // Validation des longueurs si les champs sont fournis
    if (data.title !== undefined) {
      if (data.title.length < VALIDATION.PROJECT.TITLE_MIN_LENGTH || 
          data.title.length > VALIDATION.PROJECT.TITLE_MAX_LENGTH) {
        ApiUtils.error(res, 400, 
          `Title must be between ${VALIDATION.PROJECT.TITLE_MIN_LENGTH} and ${VALIDATION.PROJECT.TITLE_MAX_LENGTH} characters`
        );
        return;
      }
    }

    if (data.description !== undefined && data.description && 
        data.description.length > VALIDATION.PROJECT.DESCRIPTION_MAX_LENGTH) {
      ApiUtils.error(res, 400, 
        `Description must be less than ${VALIDATION.PROJECT.DESCRIPTION_MAX_LENGTH} characters`
      );
      return;
    }

    // Validation des images
    if (data.images && data.images.length > VALIDATION.PROJECT.MAX_IMAGES) {
      ApiUtils.error(res, 400, 
        `Maximum ${VALIDATION.PROJECT.MAX_IMAGES} images allowed`
      );
      return;
    }

    // Vérifier que les images existent
    if (data.images && data.images.length > 0) {
      const imageIds = data.images.map(img => img.id);
      const existingImages = Media.findByIds(imageIds);
      
      if (existingImages.length !== imageIds.length) {
        ApiUtils.error(res, 400, 'Some images do not exist');
        return;
      }
    }

    // Mettre à jour le projet
    project.update(data);

    ApiUtils.success(res, project.toJSON(), 'Project updated successfully');

  } catch (error) {
    console.error('Error updating project:', error);
    ApiUtils.error(res, 500, 'Failed to update project');
  }
});

/**
 * DELETE /api/projects/:id - Supprimer un projet
 */
router.delete('/:id', validateId(), async (req, res) => {
  try {
    const project = Project.findById(req.params.id);

    if (!project) {
      ApiUtils.error(res, 404, 'Project not found');
      return;
    }

    const deleted = Project.delete(req.params.id);

    if (!deleted) {
      ApiUtils.error(res, 500, 'Failed to delete project');
      return;
    }

    ApiUtils.success(res, null, 'Project deleted successfully');

  } catch (error) {
    console.error('Error deleting project:', error);
    ApiUtils.error(res, 500, 'Failed to delete project');
  }
});

export default router;
