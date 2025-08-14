import DatabaseManager from '../utils/database.js';
import { randomBytes } from 'crypto';
import { User } from './User.js';
import type { Session as SessionType } from '../../../shared/types.js';

/**
 * Modèle Session pour l'authentification
 */
export class Session {
  id: string;
  user_id: string;
  token: string;
  expires_at: Date;
  created_at: Date;
  
  // Cache pour l'utilisateur hydraté
  private _user?: User;

  constructor(data: any) {
    this.id = data.id;
    this.user_id = data.user_id;
    this.token = data.token;
    this.expires_at = new Date(data.expires_at);
    this.created_at = new Date(data.created_at);
  }

  /**
   * Hydratation paresseuse de l'utilisateur
   */
  get user(): User | null {
    if (!this._user) {
      this._user = User.findById(this.user_id) || undefined;
    }
    return this._user || null;
  }

  /**
   * Vérifier si la session est encore valide
   */
  get isValid(): boolean {
    return new Date() < this.expires_at;
  }

  /**
   * Vérifier si la session expire bientôt (dans moins de 1 heure)
   */
  get isExpiringSoon(): boolean {
    const oneHour = 60 * 60 * 1000;
    return (this.expires_at.getTime() - Date.now()) < oneHour;
  }

  /**
   * Générer un token aléatoire sécurisé
   */
  private static generateToken(): string {
    // Générer 32 bytes aléatoires (256 bits)
    const buffer = randomBytes(32);
    return buffer.toString('hex');
  }

  /**
   * Créer une nouvelle session
   */
  static create(userId: string, expiresInMinutes: number = 15): Session {
    const id = randomBytes(16).toString('hex');
    const token = this.generateToken();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + (expiresInMinutes * 60 * 1000));

    const stmt = DatabaseManager.prepare(`
      INSERT INTO sessions (id, user_id, token, expires_at, created_at)
      VALUES (?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      userId,
      token,
      expiresAt.toISOString(),
      now.toISOString()
    );

    return new Session({
      id,
      user_id: userId,
      token,
      expires_at: expiresAt.toISOString(),
      created_at: now.toISOString()
    });
  }

  /**
   * Trouver une session par token
   */
  static findByToken(token: string): Session | null {
    const stmt = DatabaseManager.prepare('SELECT * FROM sessions WHERE token = ?');
    const row = stmt.get(token) as any;
    
    if (!row) return null;
    
    const session = new Session(row);
    
    // Vérifier si la session est encore valide
    if (!session.isValid) {
      // Supprimer la session expirée
      this.delete(session.id);
      return null;
    }
    
    return session;
  }

  /**
   * Trouver toutes les sessions actives d'un utilisateur
   */
  static findActiveByUserId(userId: string): Session[] {
    const stmt = DatabaseManager.prepare(`
      SELECT * FROM sessions 
      WHERE user_id = ? AND expires_at > datetime('now')
      ORDER BY created_at DESC
    `);
    
    const rows = stmt.all(userId) as any[];
    return rows.map(row => new Session(row));
  }

  /**
   * Supprimer une session
   */
  static delete(sessionId: string): boolean {
    const stmt = DatabaseManager.prepare('DELETE FROM sessions WHERE id = ?');
    const result = stmt.run(sessionId);
    return result.changes > 0;
  }

  /**
   * Supprimer une session par token
   */
  static deleteByToken(token: string): boolean {
    const stmt = DatabaseManager.prepare('DELETE FROM sessions WHERE token = ?');
    const result = stmt.run(token);
    return result.changes > 0;
  }

  /**
   * Supprimer toutes les sessions d'un utilisateur
   */
  static deleteAllByUserId(userId: string): number {
    const stmt = DatabaseManager.prepare('DELETE FROM sessions WHERE user_id = ?');
    const result = stmt.run(userId);
    return result.changes;
  }

  /**
   * Nettoyer les sessions expirées (à exécuter périodiquement)
   */
  static cleanupExpiredSessions(): number {
    const stmt = DatabaseManager.prepare(`
      DELETE FROM sessions 
      WHERE expires_at < datetime('now')
    `);
    
    const result = stmt.run();
    
    if (result.changes > 0) {
      console.log(`🧹 Cleaned up ${result.changes} expired sessions`);
    }
    
    return result.changes;
  }

  /**
   * Créer une session longue durée (pour "Remember me")
   */
  static createLongLived(userId: string): Session {
    return this.create(userId, 60 * 24 * 30); // 30 jours
  }

  /**
   * Étendre la durée de vie d'une session
   */
  extendSession(additionalMinutes: number = 15): void {
    const newExpiresAt = new Date(this.expires_at.getTime() + (additionalMinutes * 60 * 1000));
    
    const stmt = DatabaseManager.prepare(`
      UPDATE sessions 
      SET expires_at = ? 
      WHERE id = ?
    `);
    
    stmt.run(newExpiresAt.toISOString(), this.id);
    this.expires_at = newExpiresAt;
  }

  /**
   * Marquer une session comme utilisée (pour les magic links)
   */
  markAsUsed(): void {
    // Pour les magic links, on supprime la session après utilisation
    Session.delete(this.id);
  }

  /**
   * Convertir en objet plain pour l'API
   */
  toJSON(): SessionType {
    return {
      id: this.id,
      user_id: this.user_id,
      token: this.token,
      expires_at: this.expires_at,
      created_at: this.created_at
    };
  }

  /**
   * Convertir en objet sécurisé (sans token)
   */
  toSafeJSON(): Omit<SessionType, 'token'> {
    return {
      id: this.id,
      user_id: this.user_id,
      expires_at: this.expires_at,
      created_at: this.created_at
    };
  }

  /**
   * Trouver toutes les sessions (pour debug)
   */
  static findAll(): Session[] {
    const stmt = DatabaseManager.prepare('SELECT * FROM sessions ORDER BY created_at DESC');
    const rows = stmt.all() as any[];
    return rows.map(row => new Session(row));
  }

  /**
   * Supprimer toutes les sessions (pour debug)
   */
  static clearAll(): number {
    const stmt = DatabaseManager.prepare('DELETE FROM sessions');
    const result = stmt.run();
    console.log(`🧼 Debug: Cleared ${result.changes} sessions`);
    return result.changes;
  }
}

export default Session;
