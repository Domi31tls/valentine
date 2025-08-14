import DatabaseManager from '../utils/database.js';
import { randomUUID } from 'crypto';
import { Media } from './Media.js';
import type { Project as ProjectType, SEOData } from '../../../shared/types.js';

/**
 * Modèle Project avec hydratation paresseuse des médias
 */
export class Project {
  id: string;
  title: string;
  description?: string;
  status: 'published' | 'invisible';
  is_draft: boolean;
  private images_json: string; // JSON des IDs des médias
  seo_title?: string;
  seo_description?: string;
  seo_keywords?: string; // JSON array
  seo_og_image?: string; // Media ID
  created_at: Date;
  updated_at: Date;
  
  // Cache pour les images hydratées
  private _images?: Media[];
  private _seo?: SEOData;

  constructor(data: any) {
    this.id = data.id;
    this.title = data.title;
    this.description = data.description;
    this.status = data.status;
    this.is_draft = Boolean(data.is_draft);
    this.images_json = data.images || '[]';
    this.seo_title = data.seo_title;
    this.seo_description = data.seo_description;
    this.seo_keywords = data.seo_keywords;
    this.seo_og_image = data.seo_og_image;
    this.created_at = new Date(data.created_at);
    this.updated_at = new Date(data.updated_at);
  }

  /**
   * Hydratation paresseuse des images
   */
  get images(): Media[] {
    if (!this._images) {
      try {
        const imageIds = JSON.parse(this.images_json) as string[];
        this._images = Media.findByIds(imageIds);
      } catch {
        this._images = [];
      }
    }
    return this._images;
  }

  /**
   * Setter pour les images
   */
  set images(medias: Media[]) {
    this._images = medias;
    this.images_json = JSON.stringify(medias.map(m => m.id));
  }

  /**
   * Hydratation paresseuse du SEO
   */
  get seo(): SEOData {
    if (!this._seo) {
      let keywords: string[] = [];
      try {
        keywords = this.seo_keywords ? JSON.parse(this.seo_keywords) : [];
      } catch {
        keywords = [];
      }

      let ogImage: Media | undefined;
      if (this.seo_og_image) {
        ogImage = Media.findById(this.seo_og_image) || undefined;
      }

      this._seo = {
        title: this.seo_title,
        description: this.seo_description,
        keywords,
        ogImage
      };
    }
    return this._seo;
  }

  /**
   * Setter pour le SEO
   */
  set seo(seoData: SEOData) {
    this._seo = seoData;
    this.seo_title = seoData.title;
    this.seo_description = seoData.description;
    this.seo_keywords = seoData.keywords ? JSON.stringify(seoData.keywords) : undefined;
    this.seo_og_image = seoData.ogImage?.id;
  }

  /**
   * Créer un nouveau projet
   */
  static create(data: Omit<ProjectType, 'id' | 'created_at' | 'updated_at'>): Project {
    const id = randomUUID();
    const now = new Date();
    const images_json = JSON.stringify(data.images.map(img => img.id));
    
    const stmt = DatabaseManager.prepare(`
      INSERT INTO projects (
        id, title, description, status, is_draft, images,
        seo_title, seo_description, seo_keywords, seo_og_image,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      data.title,
      data.description || null,
      data.status,
      data.is_draft ? 1 : 0,
      images_json,
      data.seo.title || null,
      data.seo.description || null,
      data.seo.keywords ? JSON.stringify(data.seo.keywords) : null,
      data.seo.ogImage?.id || null,
      now.toISOString(),
      now.toISOString()
    );

    return new Project({
      id,
      ...data,
      images: images_json,
      seo_title: data.seo.title,
      seo_description: data.seo.description,
      seo_keywords: data.seo.keywords ? JSON.stringify(data.seo.keywords) : null,
      seo_og_image: data.seo.ogImage?.id,
      created_at: now.toISOString(),
      updated_at: now.toISOString()
    });
  }

  /**
   * Trouver un projet par ID
   */
  static findById(id: string): Project | null {
    const stmt = DatabaseManager.prepare('SELECT * FROM projects WHERE id = ?');
    const row = stmt.get(id) as any;
    
    if (!row) return null;
    
    return new Project(row);
  }

  /**
   * Lister tous les projets avec pagination et filtre
   */
  static findAll(options: {
    status?: 'published' | 'invisible';
    limit?: number;
    offset?: number;
    includeImages?: boolean;
  } = {}): Project[] {
    const { status, limit = 50, offset = 0, includeImages = true } = options;
    
    let sql = 'SELECT * FROM projects';
    const params: any[] = [];
    
    if (status) {
      sql += ' WHERE status = ?';
      params.push(status);
    }
    
    sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);
    
    const stmt = DatabaseManager.prepare(sql);
    const rows = stmt.all(...params) as any[];
    
    return rows.map(row => new Project(row));
  }

  /**
   * Compter les projets
   */
  static count(status?: 'published' | 'invisible'): number {
    let sql = 'SELECT COUNT(*) as count FROM projects';
    const params: any[] = [];
    
    if (status) {
      sql += ' WHERE status = ?';
      params.push(status);
    }
    
    const stmt = DatabaseManager.prepare(sql);
    const result = stmt.get(...params) as { count: number };
    return result.count;
  }

  /**
   * Compter les projets publiés
   */
  static countPublished(): number {
    return Project.count('published');
  }

  /**
   * Compter les projets avec des images
   */
  static countWithImages(): number {
    const stmt = DatabaseManager.prepare(`
      SELECT COUNT(*) as count FROM projects 
      WHERE status = 'published' 
      AND images != '[]' 
      AND images IS NOT NULL
    `);
    
    const result = stmt.get() as { count: number };
    return result.count;
  }

  /**
   * Hydrater un projet avec ses relations (pour compatibilité)
   */
  static hydrateRelations(project: Project): Project {
    // Les relations sont déjà hydratées automatiquement via les getters
    // Cette méthode existe pour compatibilité avec l'API
    return project;
  }


  /**
   * Générer un slug à partir du titre
   */
  get slug(): string {
    return this.title
      .toLowerCase()
      .replace(/[éèêë]/g, 'e')
      .replace(/[àâä]/g, 'a')
      .replace(/[îï]/g, 'i')
      .replace(/[ôö]/g, 'o')
      .replace(/[ùûü]/g, 'u')
      .replace(/[ç]/g, 'c')
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }

  /**
   * Supprimer un projet
   */
  static delete(id: string): boolean {
    const stmt = DatabaseManager.prepare('DELETE FROM projects WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }

  /**
   * Mettre à jour un projet
   */
  update(data: Partial<Omit<ProjectType, 'id' | 'created_at'>>): void {
    const fields = [];
    const values = [];

    if (data.title !== undefined) {
      fields.push('title = ?');
      values.push(data.title);
    }
    if (data.description !== undefined) {
      fields.push('description = ?');
      values.push(data.description);
    }
    if (data.status !== undefined) {
      fields.push('status = ?');
      values.push(data.status);
    }
    if (data.is_draft !== undefined) {
      fields.push('is_draft = ?');
      values.push(data.is_draft ? 1 : 0);
    }
    if (data.images !== undefined) {
      fields.push('images = ?');
      values.push(JSON.stringify(data.images.map(img => img.id)));
      this.images = data.images; // Mettre à jour le cache
    }
    if (data.seo !== undefined) {
      fields.push('seo_title = ?', 'seo_description = ?', 'seo_keywords = ?', 'seo_og_image = ?');
      values.push(
        data.seo.title || null,
        data.seo.description || null,
        data.seo.keywords ? JSON.stringify(data.seo.keywords) : null,
        data.seo.ogImage?.id || null
      );
      this.seo = data.seo; // Mettre à jour le cache
    }

    if (fields.length === 0) return;

    // Ajouter updated_at
    fields.push('updated_at = ?');
    values.push(new Date().toISOString());

    values.push(this.id);
    const stmt = DatabaseManager.prepare(`UPDATE projects SET ${fields.join(', ')} WHERE id = ?`);
    stmt.run(...values);

    // Mettre à jour les propriétés locales
    Object.assign(this, data);
    this.updated_at = new Date();
    
    // Invalider les caches
    this._images = undefined;
    this._seo = undefined;
  }

  /**
   * Récupérer des projets aléatoires publiés
   */
  static getRandomPublished(count: number = 1): Project[] {
    const stmt = DatabaseManager.prepare(`
      SELECT * FROM projects 
      WHERE status = 'published' AND is_draft = 0
      ORDER BY RANDOM() 
      LIMIT ?
    `);
    
    const rows = stmt.all(count);
    return rows.map(row => new Project(row));
  }

  /**
   * Compter les projets publiés avec images
   */
  static countPublished(): number {
    const stmt = DatabaseManager.prepare(`
      SELECT COUNT(*) as count 
      FROM projects 
      WHERE status = 'published' AND is_draft = 0
        AND images IS NOT NULL 
        AND images != '[]'
    `);
    
    const result = stmt.get() as { count: number };
    return result.count;
  }

  /**
   * Récupérer des projets publiés avec images pour l'API publique
   */
  static getPublishedWithImages(limit: number = 20, offset: number = 0): { projects: Project[], total: number } {
    // Compter le total
    const countStmt = DatabaseManager.prepare(`
      SELECT COUNT(*) as count 
      FROM projects 
      WHERE status = 'published' AND is_draft = 0
        AND images IS NOT NULL 
        AND images != '[]'
    `);
    const totalResult = countStmt.get() as { count: number };
    const total = totalResult.count;

    // Récupérer les projets
    const stmt = DatabaseManager.prepare(`
      SELECT * FROM projects 
      WHERE status = 'published' AND is_draft = 0
        AND images IS NOT NULL 
        AND images != '[]'
      ORDER BY created_at DESC 
      LIMIT ? OFFSET ?
    `);
    
    const rows = stmt.all(limit, offset);
    const projects = rows.map(row => new Project(row));
    
    return { projects, total };
  }

  /**
   * Convertir en objet plain pour l'API
   */
  toJSON(): ProjectType {
    return {
      id: this.id,
      title: this.title,
      description: this.description,
      status: this.status,
      is_draft: this.is_draft,
      images: this.images.map(img => img.toJSON()),
      seo: this.seo,
      created_at: this.created_at,
      updated_at: this.updated_at
    };
  }
}

export default Project;
