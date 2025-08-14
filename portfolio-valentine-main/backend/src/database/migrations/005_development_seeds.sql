-- Migration 005: Seeds de développement (À SUPPRIMER EN PRODUCTION)
-- Cette migration contient les données de test pour le développement

-- Utilisateur admin par défaut
INSERT OR IGNORE INTO users (id, email, name, role, created_at, updated_at)
VALUES ('user-admin-001', 'me@mr-michel.com', 'Michel Rodriguez', 'admin', datetime('now'), datetime('now'));

-- Médias de test
INSERT OR IGNORE INTO media (id, filename, url, caption, alt, mime_type, size, width, height, created_at)
VALUES 
  ('media-001', 'hero-01.jpg', '/uploads/hero-01.jpg', 'Photo de couverture', 'Belle photo de portrait', 'image/jpeg', 2048000, 1920, 1280, datetime('now')),
  ('media-002', 'project-01.jpg', '/uploads/project-01.jpg', 'Projet photo 1', 'Projet de photographie', 'image/jpeg', 1536000, 1600, 1200, datetime('now')),
  ('media-003', 'retouche-before.jpg', '/uploads/retouche-before.jpg', 'Avant retouche', 'Photo avant retouche', 'image/jpeg', 1024000, 1200, 800, datetime('now')),
  ('media-004', 'retouche-after.jpg', '/uploads/retouche-after.jpg', 'Après retouche', 'Photo après retouche', 'image/jpeg', 1024000, 1200, 800, datetime('now'));

-- Projets de test
INSERT OR IGNORE INTO projects (id, title, description, status, is_draft, images, seo_title, seo_description, seo_keywords, seo_og_image, created_at, updated_at)
VALUES 
  ('project-001', 'Séance Portrait Studio', 'Une séance photo en studio avec éclairage naturel', 'published', false, '["media-001", "media-002"]', 'Séance Portrait Studio - Portfolio', 'Découvrez cette magnifique séance portrait réalisée en studio', '["portrait", "studio", "photographie"]', 'media-001', datetime('now'), datetime('now')),
  ('project-002', 'Mariage Champêtre', 'Reportage photo de mariage dans un cadre champêtre', 'published', false, '["media-002"]', 'Mariage Champêtre - Photographie', 'Reportage photo de mariage romantique à la campagne', '["mariage", "champêtre", "reportage"]', 'media-002', datetime('now'), datetime('now'));

-- Retouches de test
INSERT OR IGNORE INTO retouches (id, title, before_image, after_image, status, seo_title, seo_description, seo_keywords, seo_og_image, created_at, updated_at)
VALUES 
  ('retouche-001', 'Correction de luminosité', 'media-003', 'media-004', 'published', 'Retouche Correction Luminosité', 'Exemple de retouche photo pour correction de luminosité', '["retouche", "luminosité", "correction"]', 'media-004', datetime('now'), datetime('now'));

-- Page About par défaut
INSERT OR IGNORE INTO about_page (id, exergue, content, images, updated_at)
VALUES (1, 'Photographe passionné de capturer les moments uniques', 'Bienvenue sur mon portfolio ! Je suis spécialisé dans la photographie de portrait et les reportages.', '["media-001"]', datetime('now'));

-- Clients de test
INSERT OR IGNORE INTO clients (id, name, logo_url, order_index, created_at)
VALUES 
  ('client-1751642493795-mqxdo9c19', 'Studio Creative', '/uploads/logos/studio-creative.png', 0, datetime('now')),
  ('client-1751642493795-o5t5u4lua', 'Mariage & Co', '/uploads/logos/mariage-co.png', 1, datetime('now')),
  ('client-1751642493796-lhjq14zds', 'Event Agency', '/uploads/logos/event-agency.png', 2, datetime('now'));

-- Contacts de test
INSERT OR IGNORE INTO contacts (id, type, label, value, is_visible, order_index, created_at)
VALUES 
  ('contact-1751642493796-z0mi8zezg', 'email', 'Email', 'contact@portfolio.com', 1, 0, datetime('now')),
  ('contact-1751642493796-hr3bejoja', 'phone', 'Téléphone', '+33 1 23 45 67 89', 1, 1, datetime('now')),
  ('contact-1751642493796-meace4bkh', 'instagram', 'Instagram', 'https://instagram.com/photographer', 1, 2, datetime('now'));
