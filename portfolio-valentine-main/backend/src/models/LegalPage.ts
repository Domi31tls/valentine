import DatabaseManager from '../utils/database.js';

export interface LegalPageData {
  id: string;
  type: string;
  title: string;
  content: string;
  is_published: boolean;
  updated_at: Date;
}

export class LegalPage {
  id: string;
  type: string;
  title: string;
  content: string;
  is_published: boolean;
  updated_at: Date;

  constructor(data: LegalPageData) {
    this.id = data.id;
    this.type = data.type;
    this.title = data.title;
    this.content = data.content;
    this.is_published = data.is_published;
    this.updated_at = data.updated_at;
  }

  /**
   * Convertir en objet JSON
   */
  toJSON(): LegalPageData {
    return {
      id: this.id,
      type: this.type,
      title: this.title,
      content: this.content,
      is_published: this.is_published,
      updated_at: this.updated_at
    };
  }

  /**
   * Récupérer une page légale par son ID/type
   */
  static findById(id: string): LegalPage | null {
    try {
      const db = DatabaseManager.getInstance();
      const query = `
        SELECT id, type, title, content, is_published, updated_at
        FROM legal_pages 
        WHERE id = ?
      `;
      
      const row = db.prepare(query).get(id) as any;
      
      if (!row) return null;
      
      return new LegalPage({
        id: row.id,
        type: row.type,
        title: row.title,
        content: row.content,
        is_published: Boolean(row.is_published),
        updated_at: new Date(row.updated_at)
      });
      
    } catch (error) {
      console.error('Error finding legal page by id:', error);
      return null;
    }
  }

  /**
   * Récupérer une page légale par son type
   */
  static findByType(type: string): LegalPage | null {
    try {
      const db = DatabaseManager.getInstance();
      const query = `
        SELECT id, type, title, content, is_published, updated_at
        FROM legal_pages 
        WHERE type = ?
      `;
      
      const row = db.prepare(query).get(type) as any;
      
      if (!row) return null;
      
      return new LegalPage({
        id: row.id,
        type: row.type,
        title: row.title,
        content: row.content,
        is_published: Boolean(row.is_published),
        updated_at: new Date(row.updated_at)
      });
      
    } catch (error) {
      console.error('Error finding legal page by type:', error);
      return null;
    }
  }

  /**
   * Récupérer toutes les pages légales
   */
  static findAll(): LegalPage[] {
    try {
      const db = DatabaseManager.getInstance();
      const query = `
        SELECT id, type, title, content, is_published, updated_at
        FROM legal_pages 
        ORDER BY type ASC
      `;
      
      const rows = db.prepare(query).all() as any[];
      
      return rows.map(row => new LegalPage({
        id: row.id,
        type: row.type,
        title: row.title,
        content: row.content,
        is_published: Boolean(row.is_published),
        updated_at: new Date(row.updated_at)
      }));
      
    } catch (error) {
      console.error('Error finding all legal pages:', error);
      return [];
    }
  }

  /**
   * Mettre à jour une page légale
   */
  update(data: Partial<Omit<LegalPageData, 'id' | 'updated_at'>>): void {
    try {
      const db = DatabaseManager.getInstance();
      
      // Construire la requête dynamiquement
      const updateFields: string[] = [];
      const values: any[] = [];
      
      if (data.title !== undefined) {
        updateFields.push('title = ?');
        values.push(data.title);
      }
      
      if (data.content !== undefined) {
        updateFields.push('content = ?');
        values.push(data.content);
      }
      
      if (data.is_published !== undefined) {
        updateFields.push('is_published = ?');
        values.push(data.is_published ? 1 : 0);
      }
      
      updateFields.push('updated_at = ?');
      values.push(new Date().toISOString());
      
      values.push(this.id);
      
      const query = `
        UPDATE legal_pages 
        SET ${updateFields.join(', ')}
        WHERE id = ?
      `;
      
      db.prepare(query).run(...values);
      
      // Mettre à jour l'instance
      if (data.title !== undefined) this.title = data.title;
      if (data.content !== undefined) this.content = data.content;
      if (data.is_published !== undefined) this.is_published = data.is_published;
      this.updated_at = new Date();
      
    } catch (error) {
      console.error('Error updating legal page:', error);
      throw new Error('Failed to update legal page');
    }
  }

  /**
   * Créer une nouvelle page légale
   */
  static create(data: Omit<LegalPageData, 'updated_at'>): LegalPage {
    try {
      const db = DatabaseManager.getInstance();
      const now = new Date().toISOString();
      
      const query = `
        INSERT INTO legal_pages (id, type, title, content, is_published, updated_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `;
      
      db.prepare(query).run(
        data.id,
        data.type,
        data.title,
        data.content,
        data.is_published ? 1 : 0,
        now
      );
      
      return new LegalPage({
        ...data,
        updated_at: new Date(now)
      });
      
    } catch (error) {
      console.error('Error creating legal page:', error);
      throw new Error('Failed to create legal page');
    }
  }

  /**
   * Supprimer une page légale
   */
  static delete(id: string): boolean {
    try {
      const db = DatabaseManager.getInstance();
      const query = 'DELETE FROM legal_pages WHERE id = ?';
      const result = db.prepare(query).run(id);
      
      return result.changes > 0;
      
    } catch (error) {
      console.error('Error deleting legal page:', error);
      return false;
    }
  }

  /**
   * Vérifier si une page légale existe
   */
  static exists(id: string): boolean {
    try {
      const db = DatabaseManager.getInstance();
      const query = 'SELECT 1 FROM legal_pages WHERE id = ? LIMIT 1';
      const result = db.prepare(query).get(id);
      
      return result !== undefined;
      
    } catch (error) {
      console.error('Error checking legal page existence:', error);
      return false;
    }
  }
}

export default LegalPage;
