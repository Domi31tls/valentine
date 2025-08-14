-- Migration 002: Index pour les performances
-- Création des index pour optimiser les requêtes

-- Index pour les médias
CREATE INDEX IF NOT EXISTS idx_media_filename ON media(filename);
CREATE INDEX IF NOT EXISTS idx_media_mime_type ON media(mime_type);

-- Index pour les projets
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_created_at ON projects(created_at);

-- Index pour les retouches
CREATE INDEX IF NOT EXISTS idx_retouches_status ON retouches(status);
CREATE INDEX IF NOT EXISTS idx_retouches_created_at ON retouches(created_at);

-- Index pour les sessions
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);

-- Index pour les analytics
CREATE INDEX IF NOT EXISTS idx_analytics_page ON analytics_events(page);
CREATE INDEX IF NOT EXISTS idx_analytics_timestamp ON analytics_events(timestamp);

-- Index pour les clients
CREATE INDEX IF NOT EXISTS idx_clients_order ON clients(order_index);

-- Index pour les contacts
CREATE INDEX IF NOT EXISTS idx_contacts_visible ON contacts(is_visible);
CREATE INDEX IF NOT EXISTS idx_contacts_order ON contacts(order_index);
