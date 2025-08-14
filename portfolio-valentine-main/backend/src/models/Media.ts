import DatabaseManager from '../utils/database.js';
import { randomUUID } from 'crypto';
import type { Media as MediaType } from '../../../shared/types.js';

/**
 * Modèle Media - Table centrale pour tous les médias
 */
export class Media {
  id: string;
  filename: string;
  url: string;
  caption?: string;
  alt?: string;
  mime_type: string;
  size: number;
  width: number;
  height: number;
  created_at: Date;

  constructor(data: MediaType) {
    this.id = data.id;
    this.filename = data.filename;
    this.url = data.url;
    this.caption = data.caption;
    this.alt = data.alt;
    this.mime_type = data.mime_type;
    this.size = data.size;
    this.width = data.width;
    this.height = data.height;
    this.created_at = data.created_at;
  }

  /**
   * Créer un nouveau média
   */
  static create(data: Omit<MediaType, 'id' | 'created_at'>): Media {
    const id = randomUUID();
    const created_at = new Date();

    const stmt = DatabaseManager.prepare(`
      INSERT INTO media (id, filename, url, caption, alt, mime_type, size, width, height, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      data.filename,
      data.url,
      data.caption || null,
      data.alt || null,
      data.mime_type,
      data.size,
      data.width,
      data.height,
      created_at.toISOString()
    );

    return new Media({ ...data, id, created_at });
  }

  /**
   * Trouver un média par ID
   */
  static findById(id: string): Media | null {
    const stmt = DatabaseManager.prepare('SELECT * FROM media WHERE id = ?');
    const row = stmt.get(id) as any;
    
    if (!row) return null;
    
    return new Media({
      ...row,
      created_at: new Date(row.created_at)
    });
  }

  /**
   * Trouver plusieurs médias par IDs
   */
  static findByIds(ids: string[]): Media[] {
    if (ids.length === 0) return [];
    
    const placeholders = ids.map(() => '?').join(',');
    const stmt = DatabaseManager.prepare(`SELECT * FROM media WHERE id IN (${placeholders})`);
    const rows = stmt.all(...ids) as any[];
    
    return rows.map(row => new Media({
      ...row,
      created_at: new Date(row.created_at)
    }));
  }

  /**
   * Lister tous les médias avec pagination
   */
  static findAll(limit = 50, offset = 0): Media[] {
    const stmt = DatabaseManager.prepare(`
      SELECT * FROM media 
      ORDER BY created_at DESC 
      LIMIT ? OFFSET ?
    `);
    
    const rows = stmt.all(limit, offset) as any[];
    
    return rows.map(row => new Media({
      ...row,
      created_at: new Date(row.created_at)
    }));
  }

  /**
   * Supprimer un média
   */
  static delete(id: string): boolean {
    const stmt = DatabaseManager.prepare('DELETE FROM media WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }

  /**
   * Mettre à jour un média
   */
  update(data: Partial<Omit<MediaType, 'id' | 'created_at'>>): void {
    const fields = [];
    const values = [];

    if (data.filename !== undefined) {
      fields.push('filename = ?');
      values.push(data.filename);
    }
    if (data.url !== undefined) {
      fields.push('url = ?');
      values.push(data.url);
    }
    if (data.caption !== undefined) {
      fields.push('caption = ?');
      values.push(data.caption);
    }
    if (data.alt !== undefined) {
      fields.push('alt = ?');
      values.push(data.alt);
    }

    if (fields.length === 0) return;

    values.push(this.id);
    const stmt = DatabaseManager.prepare(`UPDATE media SET ${fields.join(', ')} WHERE id = ?`);
    stmt.run(...values);

    // Mettre à jour les propriétés locales
    Object.assign(this, data);
  }

  /**
   * Convertir en objet plain pour l'API
   */
  toJSON(): MediaType {
    return {
      id: this.id,
      filename: this.filename,
      url: this.url,
      caption: this.caption,
      alt: this.alt,
      mime_type: this.mime_type,
      size: this.size,
      width: this.width,
      height: this.height,
      created_at: this.created_at
    };
  }
}

export default Media;
