import DatabaseManager from '../utils/database.js';

export interface SEOSettingsData {
  id: number;
  site_name: string;
  author_name: string;
  contact_email: string;
  location: string;
  robots_mode: 'allow_all' | 'protect_admin' | 'block_all';
  google_verification: string;
  facebook_verification: string;
  pinterest_verification: string;
  bing_verification: string;
  default_language: string;
  copyright_text: string;
  updated_at: Date;
}

export class SEOSettings {
  id: number;
  site_name: string;
  author_name: string;
  contact_email: string;
  location: string;
  robots_mode: 'allow_all' | 'protect_admin' | 'block_all';
  google_verification: string;
  facebook_verification: string;
  pinterest_verification: string;
  bing_verification: string;
  default_language: string;
  copyright_text: string;
  updated_at: Date;

  constructor(data: SEOSettingsData) {
    this.id = data.id;
    this.site_name = data.site_name;
    this.author_name = data.author_name;
    this.contact_email = data.contact_email;
    this.location = data.location;
    this.robots_mode = data.robots_mode;
    this.google_verification = data.google_verification;
    this.facebook_verification = data.facebook_verification;
    this.pinterest_verification = data.pinterest_verification;
    this.bing_verification = data.bing_verification;
    this.default_language = data.default_language;
    this.copyright_text = data.copyright_text;
    this.updated_at = data.updated_at;
  }

  /**
   * Convertir en objet JSON
   */
  toJSON(): SEOSettingsData {
    return {
      id: this.id,
      site_name: this.site_name,
      author_name: this.author_name,
      contact_email: this.contact_email,
      location: this.location,
      robots_mode: this.robots_mode,
      google_verification: this.google_verification,
      facebook_verification: this.facebook_verification,
      pinterest_verification: this.pinterest_verification,
      bing_verification: this.bing_verification,
      default_language: this.default_language,
      copyright_text: this.copyright_text,
      updated_at: this.updated_at
    };
  }

  /**
   * Récupérer les paramètres SEO (singleton)
   */
  static get(): SEOSettings {
    try {
      const db = DatabaseManager.getInstance();
      const query = `
        SELECT id, site_name, author_name, contact_email, location, robots_mode,
               google_verification, facebook_verification, pinterest_verification, bing_verification,
               default_language, copyright_text, updated_at
        FROM seo_settings 
        WHERE id = 1
      `;
      
      const row = db.prepare(query).get() as any;
      
      if (!row) {
        // Créer les paramètres par défaut s'ils n'existent pas
        return SEOSettings.createDefault();
      }
      
      return new SEOSettings({
        id: row.id,
        site_name: row.site_name,
        author_name: row.author_name,
        contact_email: row.contact_email || '',
        location: row.location,
        robots_mode: row.robots_mode,
        google_verification: row.google_verification || '',
        facebook_verification: row.facebook_verification || '',
        pinterest_verification: row.pinterest_verification || '',
        bing_verification: row.bing_verification || '',
        default_language: row.default_language,
        copyright_text: row.copyright_text || '',
        updated_at: new Date(row.updated_at)
      });
      
    } catch (error) {
      console.error('Error getting SEO settings:', error);
      return SEOSettings.createDefault();
    }
  }

  /**
   * Créer les paramètres par défaut
   */
  static createDefault(): SEOSettings {
    const defaultData: SEOSettingsData = {
      id: 1,
      site_name: 'Valentine Arnaly Photography',
      author_name: 'Valentine Arnaly',
      contact_email: '',
      location: 'Tarbes, France',
      robots_mode: 'allow_all',
      google_verification: '',
      facebook_verification: '',
      pinterest_verification: '',
      bing_verification: '',
      default_language: 'fr',
      copyright_text: '',
      updated_at: new Date()
    };

    return new SEOSettings(defaultData);
  }

  /**
   * Mettre à jour les paramètres SEO
   */
  update(data: Partial<Omit<SEOSettingsData, 'id' | 'updated_at'>>): void {
    try {
      const db = DatabaseManager.getInstance();
      
      // Construire la requête dynamiquement
      const updateFields: string[] = [];
      const values: any[] = [];
      
      const allowedFields = [
        'site_name', 'author_name', 'contact_email', 'location', 'robots_mode',
        'google_verification', 'facebook_verification', 'pinterest_verification', 
        'bing_verification', 'default_language', 'copyright_text'
      ];
      
      allowedFields.forEach(field => {
        if (data[field as keyof typeof data] !== undefined) {
          updateFields.push(`${field} = ?`);
          values.push(data[field as keyof typeof data]);
        }
      });
      
      if (updateFields.length === 0) return;
      
      updateFields.push('updated_at = ?');
      values.push(new Date().toISOString());
      values.push(1); // WHERE id = 1
      
      const query = `
        UPDATE seo_settings 
        SET ${updateFields.join(', ')}
        WHERE id = ?
      `;
      
      const result = db.prepare(query).run(...values);
      
      if (result.changes === 0) {
        // Créer l'enregistrement s'il n'existe pas
        this.createInDatabase(data);
      } else {
        // Mettre à jour l'instance
        Object.assign(this, data);
        this.updated_at = new Date();
      }
      
    } catch (error) {
      console.error('Error updating SEO settings:', error);
      throw new Error('Failed to update SEO settings');
    }
  }

  /**
   * Créer l'enregistrement en base
   */
  private createInDatabase(data: Partial<Omit<SEOSettingsData, 'id' | 'updated_at'>>): void {
    const db = DatabaseManager.getInstance();
    const now = new Date().toISOString();
    
    const query = `
      INSERT OR REPLACE INTO seo_settings (
        id, site_name, author_name, contact_email, location, robots_mode,
        google_verification, facebook_verification, pinterest_verification, bing_verification,
        default_language, copyright_text, updated_at
      ) VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    db.prepare(query).run(
      data.site_name || this.site_name,
      data.author_name || this.author_name,
      data.contact_email || this.contact_email,
      data.location || this.location,
      data.robots_mode || this.robots_mode,
      data.google_verification || this.google_verification,
      data.facebook_verification || this.facebook_verification,
      data.pinterest_verification || this.pinterest_verification,
      data.bing_verification || this.bing_verification,
      data.default_language || this.default_language,
      data.copyright_text || this.copyright_text,
      now
    );
  }

  /**
   * Générer le contenu robots.txt selon le mode
   */
  generateRobotsTxt(): string {
    const baseUrl = process.env.SITE_URL || 'https://valentine-arnaly.com';
    
    switch (this.robots_mode) {
      case 'allow_all':
        return `User-agent: *
Allow: /

# Sitemap
Sitemap: ${baseUrl}/sitemap.xml`;

      case 'protect_admin':
        return `User-agent: *
Allow: /
Disallow: /admin/
Disallow: /api/

# Sitemap
Sitemap: ${baseUrl}/sitemap.xml`;

      case 'block_all':
        return `User-agent: *
Disallow: /`;

      default:
        return this.generateRobotsTxt(); // Fallback
    }
  }

  /**
   * Obtenir la description du mode robots en français
   */
  getRobotsModeDescription(): string {
    switch (this.robots_mode) {
      case 'allow_all':
        return 'Google peut voir et indexer tout le site (recommandé)';
      case 'protect_admin':
        return 'Google voit le site mais pas la partie administration';
      case 'block_all':
        return 'Google ne peut pas voir le site (maintenance)';
      default:
        return 'Mode inconnu';
    }
  }

  /**
   * Obtenir le statut SEO
   */
  getSEOStatus(): {
    overall: 'good' | 'warning' | 'error';
    checks: Array<{
      name: string;
      status: 'good' | 'warning' | 'missing';
      description: string;
    }>;
  } {
    const checks = [
      {
        name: 'Site visible',
        status: this.robots_mode !== 'block_all' ? 'good' : 'warning' as const,
        description: this.robots_mode !== 'block_all' 
          ? 'Votre site est visible par Google' 
          : 'Votre site est en mode maintenance'
      },
      {
        name: 'Informations de base',
        status: this.author_name && this.location ? 'good' : 'warning' as const,
        description: this.author_name && this.location
          ? 'Informations du photographe complètes'
          : 'Certaines informations manquent'
      },
      {
        name: 'Email de contact',
        status: this.contact_email ? 'good' : 'missing' as const,
        description: this.contact_email 
          ? 'Email de contact renseigné'
          : 'Email de contact manquant'
      },
      {
        name: 'Vérification Google',
        status: this.google_verification ? 'good' : 'missing' as const,
        description: this.google_verification
          ? 'Site vérifié par Google'
          : 'Verification Google manquante'
      }
    ];

    const goodCount = checks.filter(c => c.status === 'good').length;
    const overall = goodCount >= 3 ? 'good' : goodCount >= 2 ? 'warning' : 'error';

    return { overall, checks };
  }
}

export default SEOSettings;
