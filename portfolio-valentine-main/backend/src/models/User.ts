import DatabaseManager from '../utils/database.js';
import { randomUUID } from 'crypto';

/**
 * Modèle User pour l'authentification et la gestion des utilisateurs
 */
export interface UserData {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'editor';
  created_at: string;
  updated_at: string;
  last_login_at?: string | null;
}

export class User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'editor';
  created_at: string;
  updated_at: string;
  last_login_at?: string | null;

  constructor(data: any) {
    this.id = data.id;
    this.email = data.email;
    this.name = data.name;
    this.role = data.role || 'editor';
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
    this.last_login_at = data.last_login_at || null;
  }

  /**
   * Créer un nouvel utilisateur
   */
  static create(email: string, name: string = '', role: 'admin' | 'editor' = 'editor'): User {
    const id = randomUUID();
    const now = new Date().toISOString();
    
    const stmt = DatabaseManager.prepare(`
      INSERT INTO users (id, email, name, role, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    stmt.run(id, email, name, role, now, now);

    return new User({
      id,
      email,
      name,
      role,
      created_at: now,
      updated_at: now,
      last_login_at: null
    });
  }

  /**
   * Trouver un utilisateur par email
   */
  static findByEmail(email: string): User | null {
    const stmt = DatabaseManager.prepare('SELECT * FROM users WHERE email = ?');
    const row = stmt.get(email) as any;
    
    if (!row) return null;
    
    return new User(row);
  }

  /**
   * Trouver un utilisateur par ID
   */
  static findById(id: string): User | null {
    const stmt = DatabaseManager.prepare('SELECT * FROM users WHERE id = ?');
    const row = stmt.get(id) as any;
    
    if (!row) return null;
    
    return new User(row);
  }

  /**
   * Lister tous les utilisateurs
   */
  static findAll(): User[] {
    const stmt = DatabaseManager.prepare('SELECT * FROM users ORDER BY created_at DESC');
    const rows = stmt.all() as any[];
    
    return rows.map(row => new User(row));
  }

  /**
   * Supprimer un utilisateur
   */
  static delete(id: string): boolean {
    const stmt = DatabaseManager.prepare('DELETE FROM users WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }

  /**
   * Mettre à jour le rôle d'un utilisateur
   */
  static updateRole(id: string, role: 'admin' | 'editor'): boolean {
    const stmt = DatabaseManager.prepare(`
      UPDATE users 
      SET role = ?, updated_at = ? 
      WHERE id = ?
    `);
    const result = stmt.run(role, new Date().toISOString(), id);
    return result.changes > 0;
  }

  /**
   * Mettre à jour l'email d'un utilisateur
   */
  static updateEmail(id: string, email: string): boolean {
    const stmt = DatabaseManager.prepare(`
      UPDATE users 
      SET email = ?, updated_at = ? 
      WHERE id = ?
    `);
    const result = stmt.run(email, new Date().toISOString(), id);
    return result.changes > 0;
  }

  /**
   * Mettre à jour la dernière connexion
   */
  updateLastLogin(): void {
    const now = new Date().toISOString();
    const stmt = DatabaseManager.prepare(`
      UPDATE users 
      SET last_login_at = ?, updated_at = ? 
      WHERE id = ?
    `);
    stmt.run(now, now, this.id);
    this.last_login_at = now;
    this.updated_at = now;
  }

  /**
   * Mettre à jour un utilisateur
   */
  update(data: Partial<Omit<UserData, 'id' | 'created_at'>>): void {
    const fields = [];
    const values = [];

    if (data.email !== undefined) {
      fields.push('email = ?');
      values.push(data.email);
    }
    if (data.name !== undefined) {
      fields.push('name = ?');
      values.push(data.name);
    }
    if (data.role !== undefined) {
      fields.push('role = ?');
      values.push(data.role);
    }

    if (fields.length === 0) return;

    // Ajouter updated_at
    fields.push('updated_at = ?');
    values.push(new Date().toISOString());

    values.push(this.id);
    const stmt = DatabaseManager.prepare(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`);
    stmt.run(...values);

    // Mettre à jour les propriétés locales
    Object.assign(this, data);
    this.updated_at = new Date().toISOString();
  }

  /**
   * Convertir en objet plain pour l'API
   */
  toJSON(): UserData {
    return {
      id: this.id,
      email: this.email,
      name: this.name,
      role: this.role,
      created_at: this.created_at,
      updated_at: this.updated_at,
      last_login_at: this.last_login_at
    };
  }
}

// Export des fonctions utilitaires pour l'API
export const getAllUsers = (): UserData[] => {
  return User.findAll().map(u => u.toJSON());
};

export const getUserById = async (id: string): Promise<UserData | null> => {
  const user = User.findById(id);
  return user ? user.toJSON() : null;
};

export const getUserByEmail = async (email: string): Promise<UserData | null> => {
  const user = User.findByEmail(email);
  return user ? user.toJSON() : null;
};

export const createUser = async (email: string, role: 'admin' | 'editor' = 'editor'): Promise<string> => {
  const user = User.create(email, email.split('@')[0], role);
  return user.id;
};

export const deleteUser = async (id: string): Promise<boolean> => {
  return User.delete(id);
};

export const updateUserRole = async (id: string, role: 'admin' | 'editor'): Promise<boolean> => {
  return User.updateRole(id, role);
};

export const updateUserEmail = async (id: string, email: string): Promise<boolean> => {
  return User.updateEmail(id, email);
};

export default User;
