-- Migration 007: SEO Settings (robots.txt, meta tags, verification codes)

-- Table pour les paramètres SEO
CREATE TABLE IF NOT EXISTS seo_settings (
  id INTEGER PRIMARY KEY DEFAULT 1,
  -- Informations de base
  site_name TEXT DEFAULT 'Valentine Arnaly Photography',
  author_name TEXT DEFAULT 'Valentine Arnaly',
  contact_email TEXT DEFAULT '',
  location TEXT DEFAULT 'Tarbes, France',
  
  -- Robots.txt mode
  robots_mode TEXT DEFAULT 'allow_all' CHECK (robots_mode IN ('allow_all', 'protect_admin', 'block_all')),
  
  -- Codes de vérification
  google_verification TEXT DEFAULT '',
  facebook_verification TEXT DEFAULT '',
  pinterest_verification TEXT DEFAULT '',
  bing_verification TEXT DEFAULT '',
  
  -- Meta tags additionnels
  default_language TEXT DEFAULT 'fr',
  copyright_text TEXT DEFAULT '',
  
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Insérer les paramètres par défaut
INSERT OR IGNORE INTO seo_settings (id, site_name, author_name, location, robots_mode, default_language, updated_at)
VALUES (1, 'Valentine Arnaly Photography', 'Valentine Arnaly', 'Tarbes, France', 'allow_all', 'fr', datetime('now'));
