import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { Media } from '../models/Media.js';
import { ApiUtils, validateId, validateRequired } from '../utils/api.js';
import { VALIDATION } from '../utils/constants.js';
import type { MediaCreateInput } from '../../../shared/types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration multer pour l'upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Sauvegarder dans frontend/public/uploads avec structure par date
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    
    // Chemin vers frontend/public/uploads/YYYY/MM
    const uploadPath = path.join(__dirname, '../../../frontend/public/uploads', String(year), month);
    
    // Créer le dossier s'il n'existe pas (synchrone pour multer)
    try {
      fs.mkdirSync(uploadPath, { recursive: true });
    } catch (error) {
      // Le dossier existe déjà, on continue
    }
    
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    // Générer un nom unique
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: VALIDATION.MEDIA.MAX_FILE_SIZE_MB * 1024 * 1024 // 10MB
  },
  fileFilter: function (req, file, cb) {
    if (VALIDATION.MEDIA.ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  }
});

const router = Router();

/**
 * GET /api/media - Liste des médias avec filtres
 */
router.get('/', async (req, res) => {
  try {
    const { limit, offset, page } = ApiUtils.validatePagination(req.query);
    const search = ApiUtils.sanitizeSearchQuery(req.query.search as string);
    const mimeType = req.query.mime_type as string;

    // Récupérer tous les médias (pas de méthode de filtrage avancée pour l'instant)
    const allMedia = Media.findAll(limit * 3, 0); // Récupérer plus pour le filtrage

    // Filtrer les médias
    let filteredMedia = allMedia;

    // Filtre par type MIME
    if (mimeType) {
      filteredMedia = filteredMedia.filter(m => m.mime_type === mimeType);
    }

    // Filtre par recherche
    if (search) {
      filteredMedia = filteredMedia.filter(m => 
        m.filename.toLowerCase().includes(search.toLowerCase()) ||
        m.caption?.toLowerCase().includes(search.toLowerCase()) ||
        m.alt?.toLowerCase().includes(search.toLowerCase())
      );
    }

    // Pagination manuelle
    const total = filteredMedia.length;
    const paginatedMedia = filteredMedia.slice(offset, offset + limit);

    // Formater la réponse
    const response = ApiUtils.formatPaginatedResponse(
      paginatedMedia.map(m => m.toJSON()),
      total,
      page,
      limit
    );

    ApiUtils.success(res, response);

  } catch (error) {
    console.error('Error fetching media:', error);
    ApiUtils.error(res, 500, 'Failed to fetch media');
  }
});

/**
 * GET /api/media/:id - Détail d'un média
 */
router.get('/:id', validateId(), async (req, res) => {
  try {
    const media = Media.findById(req.params.id);

    if (!media) {
      ApiUtils.error(res, 404, 'Media not found');
      return;
    }

    ApiUtils.success(res, media.toJSON());

  } catch (error) {
    console.error('Error fetching media:', error);
    ApiUtils.error(res, 500, 'Failed to fetch media');
  }
});

/**
 * POST /api/media/upload - Upload d'un fichier
 */
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      ApiUtils.error(res, 400, 'No file uploaded');
      return;
    }

    const file = req.file;
    const { caption = '', alt = '' } = req.body;

    // Créer l'URL du fichier accessible via le frontend
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const fileUrl = `/uploads/${year}/${month}/${file.filename}`;

    // Créer le média en base
    const media = Media.create({
      filename: file.originalname,
      url: fileUrl,
      caption: caption || '',
      alt: alt || file.originalname.replace(/\.[^/.]+$/, ''),
      mime_type: file.mimetype,
      size: file.size,
      width: 0, // TODO: Extraire les dimensions de l'image
      height: 0
    });

    console.log(`📋 Media uploaded: ${file.originalname} (${file.size} bytes)`);
    
    ApiUtils.success(res, media.toJSON(), 'Media uploaded successfully');

  } catch (error) {
    console.error('Error uploading media:', error);
    ApiUtils.error(res, 500, 'Failed to upload media');
  }
});

/**
 * POST /api/media - Créer un nouveau média (sans upload de fichier)
 */
router.post('/', validateRequired(['filename', 'url', 'mime_type', 'size']), async (req, res) => {
  try {
    const data: MediaCreateInput = req.body;

    // Validation des longueurs
    if (data.filename.length > VALIDATION.MEDIA.FILENAME_MAX_LENGTH) {
      ApiUtils.error(res, 400, 
        `Filename must be less than ${VALIDATION.MEDIA.FILENAME_MAX_LENGTH} characters`
      );
      return;
    }

    if (data.caption && data.caption.length > VALIDATION.MEDIA.CAPTION_MAX_LENGTH) {
      ApiUtils.error(res, 400, 
        `Caption must be less than ${VALIDATION.MEDIA.CAPTION_MAX_LENGTH} characters`
      );
      return;
    }

    if (data.alt && data.alt.length > VALIDATION.MEDIA.ALT_MAX_LENGTH) {
      ApiUtils.error(res, 400, 
        `Alt text must be less than ${VALIDATION.MEDIA.ALT_MAX_LENGTH} characters`
      );
      return;
    }

    // Validation du type MIME
    if (!VALIDATION.MEDIA.ALLOWED_MIME_TYPES.includes(data.mime_type)) {
      ApiUtils.error(res, 400, 
        `Invalid MIME type. Allowed types: ${VALIDATION.MEDIA.ALLOWED_MIME_TYPES.join(', ')}`
      );
      return;
    }

    // Validation de la taille
    const maxSizeBytes = VALIDATION.MEDIA.MAX_FILE_SIZE_MB * 1024 * 1024;
    if (data.size > maxSizeBytes) {
      ApiUtils.error(res, 400, 
        `File size must be less than ${VALIDATION.MEDIA.MAX_FILE_SIZE_MB}MB`
      );
      return;
    }

    // Créer le média
    const media = Media.create({
      ...data,
      width: data.width || 0,
      height: data.height || 0
    });

    ApiUtils.success(res, media.toJSON(), 'Media created successfully');

  } catch (error) {
    console.error('Error creating media:', error);
    ApiUtils.error(res, 500, 'Failed to create media');
  }
});

/**
 * PUT /api/media/:id - Modifier un média
 */
router.put('/:id', validateId(), async (req, res) => {
  try {
    const media = Media.findById(req.params.id);

    if (!media) {
      ApiUtils.error(res, 404, 'Media not found');
      return;
    }

    const data: Partial<MediaCreateInput> = req.body;

    // Validation des longueurs si les champs sont fournis
    if (data.filename !== undefined && data.filename.length > VALIDATION.MEDIA.FILENAME_MAX_LENGTH) {
      ApiUtils.error(res, 400, 
        `Filename must be less than ${VALIDATION.MEDIA.FILENAME_MAX_LENGTH} characters`
      );
      return;
    }

    if (data.caption !== undefined && data.caption && data.caption.length > VALIDATION.MEDIA.CAPTION_MAX_LENGTH) {
      ApiUtils.error(res, 400, 
        `Caption must be less than ${VALIDATION.MEDIA.CAPTION_MAX_LENGTH} characters`
      );
      return;
    }

    if (data.alt !== undefined && data.alt && data.alt.length > VALIDATION.MEDIA.ALT_MAX_LENGTH) {
      ApiUtils.error(res, 400, 
        `Alt text must be less than ${VALIDATION.MEDIA.ALT_MAX_LENGTH} characters`
      );
      return;
    }

    // Mettre à jour le média
    media.update(data);

    ApiUtils.success(res, media.toJSON(), 'Media updated successfully');

  } catch (error) {
    console.error('Error updating media:', error);
    ApiUtils.error(res, 500, 'Failed to update media');
  }
});

/**
 * DELETE /api/media/:id - Supprimer un média
 */
router.delete('/:id', validateId(), async (req, res) => {
  try {
    const media = Media.findById(req.params.id);

    if (!media) {
      ApiUtils.error(res, 404, 'Media not found');
      return;
    }

    // TODO: Vérifier que le média n'est pas utilisé dans des projets/retouches
    // avant de le supprimer
    
    const deleted = Media.delete(req.params.id);

    if (!deleted) {
      ApiUtils.error(res, 500, 'Failed to delete media');
      return;
    }

    ApiUtils.success(res, null, 'Media deleted successfully');

  } catch (error) {
    console.error('Error deleting media:', error);
    ApiUtils.error(res, 500, 'Failed to delete media');
  }
});

/**
 * GET /api/media/types - Liste des types MIME supportés
 */
router.get('/types', async (req, res) => {
  try {
    ApiUtils.success(res, {
      allowed_types: VALIDATION.MEDIA.ALLOWED_MIME_TYPES,
      max_size_mb: VALIDATION.MEDIA.MAX_FILE_SIZE_MB
    });
  } catch (error) {
    console.error('Error fetching media types:', error);
    ApiUtils.error(res, 500, 'Failed to fetch media types');
  }
});

export default router;
