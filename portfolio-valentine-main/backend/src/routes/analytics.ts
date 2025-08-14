import { Router } from 'express';
import { Analytics } from '../models/Analytics.js';
import { ApiUtils } from '../utils/api.js';
import { requireAuth, requireAdmin } from '../utils/auth.js';

const router = Router();

/**
 * POST /api/analytics/track - Enregistrer une visite (public)
 */
router.post('/analytics/track', async (req, res) => {
  try {
    console.log('Analytics track request body:', req.body);
    const { events } = req.body;
    
    if (!events || !Array.isArray(events)) {
      console.log('Invalid events data:', { events, type: typeof events, isArray: Array.isArray(events) });
      return ApiUtils.error(res, 400, 'Invalid events data');
    }
    
    // Obtenir l'IP réelle du client
    const clientIP = req.ip || 
                     req.connection.remoteAddress || 
                     req.headers['x-forwarded-for']?.toString().split(',')[0] ||
                     req.headers['x-real-ip']?.toString() ||
                     '127.0.0.1';
    
    const userAgent = req.headers['user-agent'] || '';
    
    // Traiter chaque événement
    for (const event of events.slice(0, 10)) { // Limiter à 10 événements par batch
      try {
        // Générer les identifiants anonymes
        const sessionId = Analytics.generateSessionId(clientIP, userAgent);
        const ipHash = Analytics.hashIP(clientIP);
        const userAgentHash = Analytics.hashUserAgent(userAgent);
        
        // Détecter automatiquement la source de trafic si pas fournie
        let { source, medium } = Analytics.detectTrafficSource(event.referrer);
        
        // Utiliser les paramètres UTM s'ils sont présents
        if (event.source) source = event.source;
        if (event.medium) medium = event.medium;
        
        // Enrichir les données avec les détections automatiques
        const deviceType = event.device_type || Analytics.detectDeviceType(userAgent);
        const os = event.os || Analytics.detectOS(userAgent);
        const browser = event.browser || Analytics.detectBrowser(userAgent);
        
        // Enregistrer la visite
        await Analytics.recordVisit({
          session_id: sessionId,
          page_path: event.page_path,
          referrer: event.referrer,
          source,
          medium,
          campaign: event.campaign,
          device_type: deviceType,
          os,
          browser,
          country: event.country,
          language: event.language,
          screen_resolution: event.screen_resolution,
          ip_hash: ipHash,
          user_agent_hash: userAgentHash
        });
        
      } catch (eventError) {
        console.error('Error processing analytics event:', eventError);
        // Continuer avec les autres événements même si un échoue
      }
    }
    
    ApiUtils.success(res, { tracked: events.length }, 'Events tracked successfully');
    
  } catch (error) {
    console.error('Error tracking analytics:', error);
    ApiUtils.error(res, 500, 'Failed to track events');
  }
});

/**
 * GET /api/analytics/stats - Obtenir les statistiques (protégé)
 */
router.get('/analytics/stats', requireAuth, async (req, res) => {
  try {
    const { startDate, endDate, period = '30' } = req.query;
    
    // Calculer les dates par défaut (30 derniers jours)
    const end = endDate ? new Date(endDate as string) : new Date();
    const start = startDate ? new Date(startDate as string) : new Date();
    
    if (!startDate) {
      start.setDate(start.getDate() - parseInt(period as string));
    }
    
    const startDateStr = start.toISOString().split('T')[0];
    const endDateStr = end.toISOString().split('T')[0];
    
    const stats = Analytics.getStats(startDateStr, endDateStr);
    
    ApiUtils.success(res, {
      ...stats,
      period: {
        start: startDateStr,
        end: endDateStr,
        days: Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
      }
    });
    
  } catch (error) {
    console.error('Error getting analytics stats:', error);
    ApiUtils.error(res, 500, 'Failed to get analytics stats');
  }
});

/**
 * GET /api/analytics/realtime - Statistiques en temps réel (protégé)
 */
router.get('/analytics/realtime', requireAuth, async (req, res) => {
  try {
    const stats = Analytics.getRealTimeStats();
    ApiUtils.success(res, stats);
    
  } catch (error) {
    console.error('Error getting real-time stats:', error);
    ApiUtils.error(res, 500, 'Failed to get real-time stats');
  }
});

/**
 * GET /api/analytics/export - Exporter les données (protégé admin)
 */
router.get('/analytics/export', requireAdmin, async (req, res) => {
  try {
    const { startDate, endDate, format = 'json' } = req.query;
    
    // Calculer les dates par défaut (30 derniers jours)
    const end = endDate ? new Date(endDate as string) : new Date();
    const start = startDate ? new Date(startDate as string) : new Date();
    
    if (!startDate) {
      start.setDate(start.getDate() - 30);
    }
    
    const startDateStr = start.toISOString().split('T')[0];
    const endDateStr = end.toISOString().split('T')[0];
    
    const visits = Analytics.getAllVisitsForExport(startDateStr, endDateStr);
    
    if (format === 'csv') {
      // Exporter en CSV
      const headers = [
        'Page', 'Référent', 'Source', 'Medium', 'Campagne',
        'Appareil', 'OS', 'Navigateur', 'Pays', 'Langue', 'Date'
      ];
      
      const csvData = [
        headers.join(','),
        ...visits.map((visit: any) => [
          `"${visit.page_path || ''}"`,
          `"${visit.referrer || ''}"`,
          `"${visit.source || ''}"`,
          `"${visit.medium || ''}"`,
          `"${visit.campaign || ''}"`,
          `"${visit.device_type || ''}"`,
          `"${visit.os || ''}"`,
          `"${visit.browser || ''}"`,
          `"${visit.country || ''}"`,
          `"${visit.language || ''}"`,
          `"${visit.visited_at || ''}"`
        ].join(','))
      ].join('\n');
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="analytics-${startDateStr}-to-${endDateStr}.csv"`);
      res.send(csvData);
      
    } else {
      // Exporter en JSON
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="analytics-${startDateStr}-to-${endDateStr}.json"`);
      res.json({
        export_info: {
          start_date: startDateStr,
          end_date: endDateStr,
          total_visits: visits.length,
          exported_at: new Date().toISOString()
        },
        visits
      });
    }
    
  } catch (error) {
    console.error('Error exporting analytics:', error);
    ApiUtils.error(res, 500, 'Failed to export analytics data');
  }
});

/**
 * DELETE /api/analytics/cleanup - Nettoyer les anciennes données (protégé admin)
 */
router.delete('/analytics/cleanup', requireAdmin, async (req, res) => {
  try {
    const { days = 365 } = req.query;
    const daysToKeep = parseInt(days as string);
    
    if (isNaN(daysToKeep) || daysToKeep < 30) {
      return ApiUtils.error(res, 400, 'Days to keep must be at least 30');
    }
    
    const deletedCount = Analytics.cleanOldData(daysToKeep);
    
    ApiUtils.success(res, { deleted_visits: deletedCount }, `Cleaned ${deletedCount} old analytics records`);
    
  } catch (error) {
    console.error('Error cleaning analytics data:', error);
    ApiUtils.error(res, 500, 'Failed to clean analytics data');
  }
});

/**
 * GET /api/analytics/overview - Vue d'ensemble des analytics (protégé)
 */
router.get('/analytics/overview', requireAuth, async (req, res) => {
  try {
    // Statistiques des 7 derniers jours
    const last7Days = Analytics.getStats(
      new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      new Date().toISOString().split('T')[0]
    );
    
    // Statistiques des 30 derniers jours
    const last30Days = Analytics.getStats(
      new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      new Date().toISOString().split('T')[0]
    );
    
    // Temps réel
    const realtime = Analytics.getRealTimeStats();
    
    ApiUtils.success(res, {
      realtime,
      last7Days: {
        ...last7Days.general,
        period: '7 days'
      },
      last30Days: {
        ...last30Days.general,
        period: '30 days'
      },
      summary: {
        topPages: last30Days.topPages.slice(0, 5),
        topSources: last30Days.trafficSources.slice(0, 5),
        topCountries: last30Days.countries.slice(0, 5)
      }
    });
    
  } catch (error) {
    console.error('Error getting analytics overview:', error);
    ApiUtils.error(res, 500, 'Failed to get analytics overview');
  }
});

export default router;