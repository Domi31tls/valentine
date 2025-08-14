import DatabaseManager from '../utils/database.js';
import crypto from 'crypto';

export interface AnalyticsVisit {
  id?: number;
  session_id: string;
  page_path: string;
  referrer?: string;
  source?: string;
  medium?: string;
  campaign?: string;
  device_type?: string;
  os?: string;
  browser?: string;
  country?: string;
  language?: string;
  screen_resolution?: string;
  visited_at?: Date;
  ip_hash?: string;
  user_agent_hash?: string;
}

export interface DailyStats {
  id?: number;
  date: string;
  total_visits: number;
  unique_visitors: number;
  top_pages?: object;
  traffic_sources?: object;
  devices?: object;
  countries?: object;
  updated_at?: Date;
}

export class Analytics {
  /**
   * Créer un hash anonyme pour l'IP
   */
  static hashIP(ip: string): string {
    return crypto.createHash('sha256').update(ip + 'analytics_salt').digest('hex').substring(0, 16);
  }

  /**
   * Créer un hash anonyme pour le User-Agent
   */
  static hashUserAgent(userAgent: string): string {
    return crypto.createHash('sha256').update(userAgent + 'ua_salt').digest('hex').substring(0, 16);
  }

  /**
   * Générer un ID de session anonyme basé sur l'IP et User-Agent
   */
  static generateSessionId(ip: string, userAgent: string): string {
    const combined = `${ip}_${userAgent}_${new Date().toDateString()}`;
    return crypto.createHash('sha256').update(combined + 'session_salt').digest('hex').substring(0, 24);
  }

  /**
   * Détecter la source de trafic à partir du référent
   */
  static detectTrafficSource(referrer?: string): { source: string; medium: string } {
    if (!referrer) {
      return { source: 'direct', medium: 'direct' };
    }

    const ref = referrer.toLowerCase();
    
    // Moteurs de recherche
    if (ref.includes('google.')) return { source: 'google', medium: 'organic' };
    if (ref.includes('bing.')) return { source: 'bing', medium: 'organic' };
    if (ref.includes('yahoo.')) return { source: 'yahoo', medium: 'organic' };
    if (ref.includes('duckduckgo.')) return { source: 'duckduckgo', medium: 'organic' };
    
    // Réseaux sociaux
    if (ref.includes('facebook.')) return { source: 'facebook', medium: 'social' };
    if (ref.includes('instagram.')) return { source: 'instagram', medium: 'social' };
    if (ref.includes('twitter.') || ref.includes('t.co')) return { source: 'twitter', medium: 'social' };
    if (ref.includes('linkedin.')) return { source: 'linkedin', medium: 'social' };
    if (ref.includes('pinterest.')) return { source: 'pinterest', medium: 'social' };
    if (ref.includes('tiktok.')) return { source: 'tiktok', medium: 'social' };
    
    // Autres référents
    return { source: 'referral', medium: 'referral' };
  }

  /**
   * Détecter le type d'appareil à partir du User-Agent
   */
  static detectDeviceType(userAgent: string): string {
    const ua = userAgent.toLowerCase();
    
    if (/mobile|android|iphone|ipod|blackberry|windows phone/i.test(ua)) {
      return 'mobile';
    }
    
    if (/tablet|ipad|kindle|silk/i.test(ua)) {
      return 'tablet';
    }
    
    return 'desktop';
  }

  /**
   * Détecter le système d'exploitation
   */
  static detectOS(userAgent: string): string {
    const ua = userAgent.toLowerCase();
    
    if (ua.includes('windows')) return 'Windows';
    if (ua.includes('macintosh') || ua.includes('mac os')) return 'macOS';
    if (ua.includes('linux')) return 'Linux';
    if (ua.includes('android')) return 'Android';
    if (ua.includes('iphone') || ua.includes('ipad')) return 'iOS';
    
    return 'Unknown';
  }

  /**
   * Détecter le navigateur
   */
  static detectBrowser(userAgent: string): string {
    const ua = userAgent.toLowerCase();
    
    if (ua.includes('firefox')) return 'Firefox';
    if (ua.includes('chrome') && !ua.includes('edg')) return 'Chrome';
    if (ua.includes('safari') && !ua.includes('chrome')) return 'Safari';
    if (ua.includes('edg')) return 'Edge';
    if (ua.includes('opera')) return 'Opera';
    
    return 'Unknown';
  }

  /**
   * Enregistrer une visite
   */
  static async recordVisit(data: Omit<AnalyticsVisit, 'id' | 'visited_at'>): Promise<void> {
    try {
      const db = DatabaseManager.getInstance();
      
      const query = `
        INSERT INTO analytics_visits (
          session_id, page_path, referrer, source, medium, campaign,
          device_type, os, browser, country, language, screen_resolution,
          ip_hash, user_agent_hash, visited_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
      `;
      
      db.prepare(query).run(
        data.session_id,
        data.page_path,
        data.referrer || null,
        data.source || null,
        data.medium || null,
        data.campaign || null,
        data.device_type || null,
        data.os || null,
        data.browser || null,
        data.country || null,
        data.language || null,
        data.screen_resolution || null,
        data.ip_hash || null,
        data.user_agent_hash || null
      );
      
    } catch (error) {
      console.error('Error recording visit:', error);
      throw new Error('Failed to record visit');
    }
  }

  /**
   * Obtenir les statistiques pour une période
   */
  static getStats(startDate: string, endDate: string) {
    try {
      const db = DatabaseManager.getInstance();
      
      // Statistiques générales
      const generalQuery = `
        SELECT 
          COUNT(*) as total_visits,
          COUNT(DISTINCT session_id) as unique_visitors,
          COUNT(DISTINCT date(visited_at)) as active_days
        FROM analytics_visits 
        WHERE date(visited_at) BETWEEN ? AND ?
      `;
      
      const general = db.prepare(generalQuery).get(startDate, endDate) as any;
      
      // Top pages
      const pagesQuery = `
        SELECT page_path, COUNT(*) as visits
        FROM analytics_visits 
        WHERE date(visited_at) BETWEEN ? AND ?
        GROUP BY page_path
        ORDER BY visits DESC
        LIMIT 10
      `;
      
      const topPages = db.prepare(pagesQuery).all(startDate, endDate);
      
      // Sources de trafic
      const sourcesQuery = `
        SELECT 
          COALESCE(source, 'direct') as source,
          COALESCE(medium, 'direct') as medium,
          COUNT(*) as visits
        FROM analytics_visits 
        WHERE date(visited_at) BETWEEN ? AND ?
        GROUP BY source, medium
        ORDER BY visits DESC
      `;
      
      const trafficSources = db.prepare(sourcesQuery).all(startDate, endDate);
      
      // Appareils
      const devicesQuery = `
        SELECT 
          COALESCE(device_type, 'unknown') as device_type,
          COUNT(*) as visits
        FROM analytics_visits 
        WHERE date(visited_at) BETWEEN ? AND ?
        GROUP BY device_type
        ORDER BY visits DESC
      `;
      
      const devices = db.prepare(devicesQuery).all(startDate, endDate);
      
      // Pays
      const countriesQuery = `
        SELECT 
          COALESCE(country, 'unknown') as country,
          COUNT(*) as visits
        FROM analytics_visits 
        WHERE date(visited_at) BETWEEN ? AND ?
        GROUP BY country
        ORDER BY visits DESC
        LIMIT 10
      `;
      
      const countries = db.prepare(countriesQuery).all(startDate, endDate);
      
      // Évolution temporelle
      const timelineQuery = `
        SELECT 
          date(visited_at) as date,
          COUNT(*) as visits,
          COUNT(DISTINCT session_id) as unique_visitors
        FROM analytics_visits 
        WHERE date(visited_at) BETWEEN ? AND ?
        GROUP BY date(visited_at)
        ORDER BY date
      `;
      
      const timeline = db.prepare(timelineQuery).all(startDate, endDate);
      
      return {
        general,
        topPages,
        trafficSources,
        devices,
        countries,
        timeline
      };
      
    } catch (error) {
      console.error('Error getting analytics stats:', error);
      throw new Error('Failed to get analytics stats');
    }
  }

  /**
   * Obtenir les statistiques en temps réel (dernières 24h)
   */
  static getRealTimeStats() {
    try {
      const db = DatabaseManager.getInstance();
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      const query = `
        SELECT 
          COUNT(*) as visits_24h,
          COUNT(DISTINCT session_id) as unique_visitors_24h,
          COUNT(CASE WHEN visited_at > datetime('now', '-1 hour') THEN 1 END) as visits_1h,
          COUNT(CASE WHEN visited_at > datetime('now', '-10 minutes') THEN 1 END) as visits_10m
        FROM analytics_visits 
        WHERE visited_at > datetime('now', '-24 hours')
      `;
      
      const recentPagesQuery = `
        SELECT page_path, COUNT(*) as visits
        FROM analytics_visits 
        WHERE visited_at > datetime('now', '-24 hours')
        GROUP BY page_path
        ORDER BY visits DESC
        LIMIT 5
      `;
      
      const stats = db.prepare(query).get() as any;
      const recentPages = db.prepare(recentPagesQuery).all();
      
      return {
        ...stats,
        recentPages
      };
      
    } catch (error) {
      console.error('Error getting real-time stats:', error);
      throw new Error('Failed to get real-time stats');
    }
  }

  /**
   * Obtenir toutes les visites pour export
   */
  static getAllVisitsForExport(startDate: string, endDate: string) {
    try {
      const db = DatabaseManager.getInstance();
      
      const query = `
        SELECT 
          page_path,
          referrer,
          source,
          medium,
          campaign,
          device_type,
          os,
          browser,
          country,
          language,
          visited_at
        FROM analytics_visits 
        WHERE date(visited_at) BETWEEN ? AND ?
        ORDER BY visited_at DESC
      `;
      
      return db.prepare(query).all(startDate, endDate);
      
    } catch (error) {
      console.error('Error getting visits for export:', error);
      throw new Error('Failed to get visits for export');
    }
  }

  /**
   * Nettoyer les anciennes données (RGPD)
   */
  static cleanOldData(daysToKeep: number = 365) {
    try {
      const db = DatabaseManager.getInstance();
      
      const query = `
        DELETE FROM analytics_visits 
        WHERE visited_at < datetime('now', '-${daysToKeep} days')
      `;
      
      const result = db.prepare(query).run();
      console.log(`Cleaned ${result.changes} old analytics records`);
      
      return result.changes;
      
    } catch (error) {
      console.error('Error cleaning old analytics data:', error);
      throw new Error('Failed to clean old data');
    }
  }
}

export default Analytics;