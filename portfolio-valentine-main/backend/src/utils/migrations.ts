import DatabaseManager from './database.js';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Système de migrations pour la base de données
 */
class MigrationManager {
  
  /**
   * Créer la table des migrations
   */
  static createMigrationsTable(): void {
    const sql = `
      CREATE TABLE IF NOT EXISTS migrations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        version TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        executed_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `;
    
    DatabaseManager.exec(sql);
    console.log('✅ Migrations table created');
  }

  /**
   * Vérifier si une migration a été exécutée
   */
  static isMigrationExecuted(version: string): boolean {
    const stmt = DatabaseManager.prepare('SELECT COUNT(*) as count FROM migrations WHERE version = ?');
    const result = stmt.get(version) as { count: number };
    return result.count > 0;
  }

  /**
   * Marquer une migration comme exécutée
   */
  static markMigrationExecuted(version: string, name: string): void {
    const stmt = DatabaseManager.prepare(
      'INSERT INTO migrations (version, name) VALUES (?, ?)'
    );
    stmt.run(version, name);
  }

  /**
   * Exécuter toutes les migrations
   */
  static async runMigrations(): Promise<void> {
    console.log('🔄 Starting database migrations...');
    
    // Créer la table des migrations
    this.createMigrationsTable();
    
    // Liste des migrations à exécuter
    const migrations = [
      { version: '001', name: 'Initial schema', file: '001_initial_schema.sql' },
      { version: '002', name: 'Indexes', file: '002_indexes.sql' },
      { version: '003', name: 'Seeds (deprecated)', file: '003_seeds.sql' },
      { version: '004', name: 'Fix about_page structure', file: '004_fix_about_page.sql' },
      { version: '005', name: 'Development seeds (DEV ONLY)', file: '005_development_seeds.sql' }
    ];
    
    for (const migration of migrations) {
      if (!this.isMigrationExecuted(migration.version)) {
        console.log(`⏳ Running migration ${migration.version}: ${migration.name}`);
        
        try {
          await this.executeMigrationFile(migration.file);
          this.markMigrationExecuted(migration.version, migration.name);
          console.log(`✅ Migration ${migration.version} completed`);
        } catch (error) {
          console.error(`❌ Migration ${migration.version} failed:`, error);
          throw error;
        }
      } else {
        console.log(`⏭️  Migration ${migration.version} already executed`);
      }
    }
    
    console.log('🎉 All migrations completed!');
  }

  /**
  * Exécuter un fichier de migration
  */
  private static async executeMigrationFile(filename: string): Promise<void> {
  const migrationPath = join(__dirname, '..', 'database', 'migrations', filename);
  
  try {
  console.log(`📂 Reading migration file: ${migrationPath}`);
  
  // Migrations spéciales qui nécessitent de la logique conditionnelle
  if (filename === '004_fix_about_page.sql') {
    await this.executeAboutPageMigration();
      return;
  }
  
  // Migrations normales - exécuter le fichier SQL
  const sql = readFileSync(migrationPath, 'utf8');
  console.log(`🔄 Executing SQL migration: ${filename}`);
  DatabaseManager.exec(sql);
  console.log(`✅ Migration ${filename} executed successfully`);
  } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        console.warn(`⚠️  Migration file not found: ${filename}`);
        throw new Error(`Migration file not found: ${filename}`);
      } else {
        console.error(`❌ Error executing migration ${filename}:`, error);
        throw error;
      }
    }
  }

  /**
   * Migration spéciale pour about_page (avec logique conditionnelle)
   */
  private static async executeAboutPageMigration(): Promise<void> {
    console.log('🔧 Fixing about_page table structure...');
    
    try {
      // Vérifier la structure actuelle de la table
      const tableInfo = DatabaseManager.prepare(`PRAGMA table_info(about_page)`).all() as any[];
      const hasContentColumn = tableInfo.some(col => col.name === 'content');
      const hasImagesColumn = tableInfo.some(col => col.name === 'images');
      
      console.log(`Current about_page structure: content=${hasContentColumn}, images=${hasImagesColumn}`);
      
      // Ajouter la colonne content si elle n'existe pas
      if (!hasContentColumn) {
        console.log('🔄 Adding content column...');
        DatabaseManager.exec(`ALTER TABLE about_page ADD COLUMN content TEXT DEFAULT '';`);
        console.log('✅ Added content column');
      }
      
      // Ajouter la colonne images si elle n'existe pas
      if (!hasImagesColumn) {
        console.log('🔄 Adding images column...');
        DatabaseManager.exec(`ALTER TABLE about_page ADD COLUMN images TEXT DEFAULT '[]';`);
        console.log('✅ Added images column');
      }
      
      // Créer une entrée par défaut si la table est vide
      const existingData = DatabaseManager.prepare('SELECT COUNT(*) as count FROM about_page').get() as any;
      if (existingData.count === 0) {
        console.log('🔄 Creating default about page entry...');
        DatabaseManager.prepare(`
          INSERT INTO about_page (id, exergue, content, images, updated_at)
          VALUES (1, 'Photographe passionné de capturer les moments uniques', 'Bienvenue sur mon portfolio !', '[]', ?)
        `).run(new Date().toISOString());
        console.log('✅ Default about page entry created');
      }
      
      console.log('✅ about_page structure fixed successfully');
      
    } catch (error) {
      console.error('❌ Error fixing about_page structure:', error);
      throw error;
    }
  }
}

export default MigrationManager;
