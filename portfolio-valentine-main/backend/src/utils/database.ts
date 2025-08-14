import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Chemin vers la base de données
const DB_PATH = join(__dirname, '..', 'database', 'portfolio.db');
const DB_DIR = dirname(DB_PATH);

// Créer le dossier database s'il n'existe pas
if (!existsSync(DB_DIR)) {
  mkdirSync(DB_DIR, { recursive: true });
}

/**
 * Connexion à la base de données SQLite
 */
class DatabaseManager {
  private static instance: Database.Database | null = null;

  /**
   * Obtenir l'instance de la base de données
   */
  static getInstance(): Database.Database {
    if (!DatabaseManager.instance) {
      DatabaseManager.instance = new Database(DB_PATH);
      
      // Configuration pour les performances
      DatabaseManager.instance.pragma('journal_mode = WAL');
      DatabaseManager.instance.pragma('synchronous = NORMAL');
      DatabaseManager.instance.pragma('cache_size = 1000');
      DatabaseManager.instance.pragma('foreign_keys = ON');
      
      console.log('✅ Database connected:', DB_PATH);
    }
    
    return DatabaseManager.instance;
  }

  /**
   * Fermer la connexion
   */
  static close(): void {
    if (DatabaseManager.instance) {
      DatabaseManager.instance.close();
      DatabaseManager.instance = null;
      console.log('🔒 Database connection closed');
    }
  }

  /**
   * Exécuter une requête avec gestion d'erreur
   */
  static exec(sql: string): void {
    try {
      const db = DatabaseManager.getInstance();
      db.exec(sql);
    } catch (error) {
      console.error('❌ Database error:', error);
      throw error;
    }
  }

  /**
   * Préparer une requête
   */
  static prepare(sql: string): Database.Statement {
    const db = DatabaseManager.getInstance();
    return db.prepare(sql);
  }
}

export default DatabaseManager;
