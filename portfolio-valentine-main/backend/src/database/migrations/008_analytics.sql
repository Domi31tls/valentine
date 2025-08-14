-- Migration 008: Analytics tracking system

-- Table pour les visites anonymes
CREATE TABLE IF NOT EXISTS analytics_visits (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  -- Identifiant de session anonyme (hash)
  session_id TEXT NOT NULL,
  -- Page visitée
  page_path TEXT NOT NULL,
  -- Référent (d'où vient l'utilisateur)
  referrer TEXT,
  -- Source détectée (google, facebook, direct, etc.)
  source TEXT,
  -- Médium (organic, social, referral, direct, etc.)
  medium TEXT,
  -- Campagne UTM si présente
  campaign TEXT,
  -- Appareil (desktop, mobile, tablet)
  device_type TEXT,
  -- Système d'exploitation
  os TEXT,
  -- Navigateur
  browser TEXT,
  -- Pays (détecté via IP ou header)
  country TEXT,
  -- Langue du navigateur
  language TEXT,
  -- Résolution écran
  screen_resolution TEXT,
  -- Timestamp de la visite
  visited_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  -- IP hashée pour éviter le tracking personnel
  ip_hash TEXT,
  -- User agent hashé
  user_agent_hash TEXT
);

-- Table pour les statistiques agrégées par jour
CREATE TABLE IF NOT EXISTS analytics_daily_stats (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date DATE NOT NULL,
  -- Nombre total de visites
  total_visits INTEGER DEFAULT 0,
  -- Nombre de visiteurs uniques (basé sur session_id)
  unique_visitors INTEGER DEFAULT 0,
  -- Pages les plus visitées (JSON)
  top_pages TEXT, -- JSON: [{"path": "/", "visits": 123}]
  -- Sources de trafic (JSON)
  traffic_sources TEXT, -- JSON: {"google": 45, "direct": 30, "facebook": 25}
  -- Appareils (JSON)
  devices TEXT, -- JSON: {"desktop": 60, "mobile": 35, "tablet": 5}
  -- Pays (JSON)
  countries TEXT, -- JSON: {"FR": 70, "US": 20, "DE": 10}
  -- Timestamp de mise à jour
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(date)
);

-- Index pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS idx_analytics_visits_session_date ON analytics_visits(session_id, visited_at);
CREATE INDEX IF NOT EXISTS idx_analytics_visits_page ON analytics_visits(page_path);
CREATE INDEX IF NOT EXISTS idx_analytics_visits_source ON analytics_visits(source, medium);
CREATE INDEX IF NOT EXISTS idx_analytics_visits_date ON analytics_visits(visited_at);
CREATE INDEX IF NOT EXISTS idx_analytics_daily_stats_date ON analytics_daily_stats(date);

-- Trigger pour mettre à jour les stats quotidiennes
CREATE TRIGGER IF NOT EXISTS update_daily_stats_after_visit
AFTER INSERT ON analytics_visits
BEGIN
  INSERT OR REPLACE INTO analytics_daily_stats (
    date, 
    total_visits, 
    unique_visitors,
    updated_at
  ) 
  SELECT 
    date(NEW.visited_at) as date,
    COUNT(*) as total_visits,
    COUNT(DISTINCT session_id) as unique_visitors,
    datetime('now') as updated_at
  FROM analytics_visits 
  WHERE date(visited_at) = date(NEW.visited_at);
END;