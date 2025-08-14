import { existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Utilitaires pour la gestion des fichiers et uploads
 */
export class FileUtils {
  
  /**
   * Chemin de base pour les uploads
   */
  private static get uploadsBasePath(): string {
    return join(__dirname, '../../../frontend/public/uploads');
  }

  /**
   * Générer un chemin d'upload basé sur la date
   */
  static generateUploadPath(date: Date = new Date()): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `${year}/${month}`;
  }

  /**
   * Créer automatiquement les dossiers nécessaires
   */
  static ensureUploadDirectories(subPath?: string): string {
    const datePath = this.generateUploadPath();
    let fullPath = join(this.uploadsBasePath, datePath);
    
    if (subPath) {
      fullPath = join(fullPath, subPath);
    }
    
    // Créer les dossiers récursivement s'ils n'existent pas
    if (!existsSync(fullPath)) {
      mkdirSync(fullPath, { recursive: true });
      console.log(`📁 Created upload directory: ${fullPath}`);
    }
    
    return fullPath;
  }

  /**
   * Obtenir le chemin relatif pour l'URL
   */
  static getRelativeUploadPath(subPath?: string): string {
    const datePath = this.generateUploadPath();
    return subPath ? `/uploads/${datePath}/${subPath}` : `/uploads/${datePath}`;
  }

  /**
   * Générer un nom de fichier unique
   */
  static generateUniqueFilename(originalName: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    const extension = originalName.split('.').pop() || '';
    const baseName = originalName.split('.').slice(0, -1).join('.');
    
    // Nettoyer le nom de base
    const cleanBaseName = baseName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
    
    return `${cleanBaseName}-${timestamp}-${random}.${extension}`;
  }

  /**
   * Créer la structure complète pour un type de média
   */
  static createMediaStructure(type: 'projects' | 'retouches' | 'about' | 'clients'): {
    fullPath: string;
    relativePath: string;
    urlPath: string;
  } {
    const fullPath = this.ensureUploadDirectories(type);
    const relativePath = this.getRelativeUploadPath(type);
    const urlPath = relativePath; // Astro sert les fichiers depuis /public/
    
    return {
      fullPath,
      relativePath,
      urlPath
    };
  }

  /**
   * Valider le type MIME d'un fichier
   */
  static validateMimeType(mimeType: string): boolean {
    const allowedTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp',
      'image/svg+xml'
    ];
    
    return allowedTypes.includes(mimeType);
  }

  /**
   * Valider la taille d'un fichier
   */
  static validateFileSize(size: number, maxSizeMB: number = 10): boolean {
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    return size <= maxSizeBytes;
  }

  /**
   * Obtenir les informations d'un fichier pour la base de données
   */
  static getFileInfo(file: {
    filename: string;
    mimeType: string;
    size: number;
    width?: number;
    height?: number;
  }, type: 'projects' | 'retouches' | 'about' | 'clients'): {
    filename: string;
    url: string;
    mime_type: string;
    size: number;
    width: number;
    height: number;
  } {
    const uniqueFilename = this.generateUniqueFilename(file.filename);
    const { urlPath } = this.createMediaStructure(type);
    
    return {
      filename: uniqueFilename,
      url: `${urlPath}/${uniqueFilename}`,
      mime_type: file.mimeType,
      size: file.size,
      width: file.width || 0,
      height: file.height || 0
    };
  }
}

export default FileUtils;
