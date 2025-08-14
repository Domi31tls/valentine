import DatabaseManager from '../utils/database.js';
import { randomUUID } from 'crypto';
import { Media } from './Media.js';
import type { Retouche as RetoucheType, SEOData } from '../../../shared/types.js';

/**
 * Modèle Retouche avec hydratation paresseuse des médias
 */
export class Retouche {
  id: string;
  title: string;
  before_image_id: string;
  after_image_id: string;
  status: 'published' | 'invisible';
  seo_title?: string;
  seo_description?: string;
  seo_keywords?: string; // JSON array
  seo_og_image?: string; // Media ID
  created_at: Date;
  updated_at: Date;
  
  // Cache pour les images hydratées
  private _before_image?: Media;
  private _after_image?: Media;
  private _seo?: SEOData;

  constructor(data: any) {
    this.id = data.id;
    this.title = data.title;
    this.before_image_id = data.before_image;
    this.after_image_id = data.after_image;
    this.status = data.status;
    this.seo_title = data.seo_title;
    this.seo_description = data.seo_description;
    this.seo_keywords = data.seo_keywords;
    this.seo_og_image = data.seo_og_image;
    this.created_at = new Date(data.created_at);
    this.updated_at = new Date(data.updated_at);
  }

  /**
   * Hydratation paresseuse de l'image avant
   */
  get before_image(): Media {
    if (!this._before_image) {
      const media = Media.findById(this.before_image_id);
      if (!media) {
        throw new Error(`Before image not found: ${this.before_image_id}`);
      }
      this._before_image = media;
    }
    return this._before_image;
  }

  /**
   * Hydratation paresseuse de l'image après
   */
  get after_image(): Media {
    if (!this._after_image) {
      const media = Media.findById(this.after_image_id);
      if (!media) {
        throw new Error(`After image not found: ${this.after_image_id}`);
      }
      this._after_image = media;
    }
    return this._after_image;
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
   * Créer une nouvelle retouche
   */
  static create(data: Omit<RetoucheType, 'id' | 'created_at' | 'updated_at'>): Retouche {
    const id = randomUUID();
    const now = new Date();
    
    const stmt = DatabaseManager.prepare(`
      INSERT INTO retouches (
        id, title, before_image, after_image, status,
        seo_title, seo_description, seo_keywords, seo_og_image,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      data.title,
      data.before_image.id,
      data.after_image.id,
      data.status,
      data.seo.title || null,
      data.seo.description || null,
      data.seo.keywords ? JSON.stringify(data.seo.keywords) : null,
      data.seo.ogImage?.id || null,
      now.toISOString(),
      now.toISOString()
    );

    return new Retouche({
      id,
      title: data.title,
      before_image: data.before_image.id,
      after_image: data.after_image.id,
      status: data.status,
      seo_title: data.seo.title,
      seo_description: data.seo.description,
      seo_keywords: data.seo.keywords ? JSON.stringify(data.seo.keywords) : null,
      seo_og_image: data.seo.ogImage?.id,
      created_at: now.toISOString(),
      updated_at: now.toISOString()
    });
  }

  /**
   * Trouver une retouche par ID
   */
  static findById(id: string): Retouche | null {
    const stmt = DatabaseManager.prepare('SELECT * FROM retouches WHERE id = ?');
    const row = stmt.get(id) as any;
    
    if (!row) return null;
    
    return new Retouche(row);
  }

  /**
   * Lister toutes les retouches avec pagination et filtre
   */
  static findAll(options: {
    status?: 'published' | 'invisible';
    limit?: number;
    offset?: number;
  } = {}): Retouche[] {
    const { status, limit = 50, offset = 0 } = options;
    
    let sql = 'SELECT * FROM retouches';
    const params: any[] = [];
    
    if (status) {
      sql += ' WHERE status = ?';
      params.push(status);
    }
    
    sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);
    
    const stmt = DatabaseManager.prepare(sql);
    const rows = stmt.all(...params) as any[];
    
    return rows.map(row => new Retouche(row));
  }

  /**
   * Compter les retouches
   */
  static count(status?: 'published' | 'invisible'): number {
    let sql = 'SELECT COUNT(*) as count FROM retouches';
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
   * Compter les retouches avec des images
   */
  static countWithImages(): number {
    const stmt = DatabaseManager.prepare(`
      SELECT COUNT(*) as count FROM retouches 
      WHERE status = 'published' 
      AND before_image IS NOT NULL 
      AND after_image IS NOT NULL
    `);
    
    const result = stmt.get() as { count: number };
    return result.count;
  }

  /**
   * Hydrater une retouche avec ses relations (pour compatibilité)
   */
  static hydrateRelations(retouche: Retouche): Retouche {
    // Les relations sont déjà hydratées automatiquement via les getters
    // Cette méthode existe pour compatibilité avec l'API
    return retouche;
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
   * Obtenir la description depuis le SEO ou générer une description par défaut
   */
  get description(): string {
    return this.seo.description || `Retouche photo : ${this.title}`;
  }

  /**
   * Supprimer une retouche
   */
  static delete(id: string): boolean {
    const stmt = DatabaseManager.prepare('DELETE FROM retouches WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }

  /**
   * Mettre à jour une retouche
   */
  update(data: Partial<Omit<RetoucheType, 'id' | 'created_at'>>): void {
    const fields = [];
    const values = [];

    if (data.title !== undefined) {
      fields.push('title = ?');
      values.push(data.title);
    }
    if (data.status !== undefined) {
      fields.push('status = ?');
      values.push(data.status);
    }
    if (data.before_image !== undefined) {
      fields.push('before_image = ?');
      values.push(data.before_image.id);
      this._before_image = data.before_image; // Mettre à jour le cache
    }
    if (data.after_image !== undefined) {
      fields.push('after_image = ?');
      values.push(data.after_image.id);
      this._after_image = data.after_image; // Mettre à jour le cache
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
    const stmt = DatabaseManager.prepare(`UPDATE retouches SET ${fields.join(', ')} WHERE id = ?`);
    stmt.run(...values);

    // Mettre à jour les propriétés locales
    Object.assign(this, data);
    this.updated_at = new Date();
    
    // Invalider les caches
    this._before_image = undefined;
    this._after_image = undefined;
    this._seo = undefined;
  }

  /**
   * Récupérer des retouches aléatoires publiées
   */
  static getRandomPublished(count: number = 1): Retouche[] {
    const stmt = DatabaseManager.prepare(`
      SELECT * FROM retouches 
      WHERE status = 'published'
        AND before_image IS NOT NULL 
        AND after_image IS NOT NULL
      ORDER BY RANDOM() 
      LIMIT ?
    `);
    
    const rows = stmt.all(count);
    return rows.map(row => new Retouche(row));
  }

  /**
   * Compter les retouches publiées avec images
   */
  static countPublished(): number {
    const stmt = DatabaseManager.prepare(`
      SELECT COUNT(*) as count 
      FROM retouches 
      WHERE status = 'published'
        AND before_image IS NOT NULL 
        AND after_image IS NOT NULL
    `);
    
    const result = stmt.get() as { count: number };
    return result.count;
  }

  /**
   * Récupérer des retouches publiées avec images pour l'API publique
   */
  static getPublishedWithImages(limit: number = 12, offset: number = 0): { retouches: Retouche[], total: number } {
    // Compter le total
    const countStmt = DatabaseManager.prepare(`
      SELECT COUNT(*) as count 
      FROM retouches 
      WHERE status = 'published'
        AND before_image IS NOT NULL 
        AND after_image IS NOT NULL
    `);
    const totalResult = countStmt.get() as { count: number };
    const total = totalResult.count;

    // Récupérer les retouches
    const stmt = DatabaseManager.prepare(`
      SELECT * FROM retouches 
      WHERE status = 'published'
        AND before_image IS NOT NULL 
        AND after_image IS NOT NULL
      ORDER BY created_at DESC 
      LIMIT ? OFFSET ?
    `);
    
    const rows = stmt.all(limit, offset);
    const retouches = rows.map(row => new Retouche(row));
    
    return { retouches, total };
  }

  /**
   * Convertir en objet plain pour l'API
   */
  toJSON(): RetoucheType {
    return {
      id: this.id,
      title: this.title,
      before_image: this.before_image.toJSON(),
      after_image: this.after_image.toJSON(),
      status: this.status,
      seo: this.seo,
      created_at: this.created_at,
      updated_at: this.updated_at
    };
  }
}

export default Retouche;
