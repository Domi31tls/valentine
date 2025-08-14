-- Migration 001: Schéma initial
-- Création de toutes les tables de base

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role TEXT DEFAULT 'editor',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Sessions table
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  token TEXT UNIQUE NOT NULL,
  expires_at DATETIME NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Media table (centrale pour tous les médias)
CREATE TABLE IF NOT EXISTS media (
  id TEXT PRIMARY KEY,
  filename TEXT NOT NULL,
  url TEXT NOT NULL,
  caption TEXT,
  alt TEXT,
  mime_type TEXT NOT NULL,
  size INTEGER,
  width INTEGER,
  height INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Projects table
CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'published',
  is_draft BOOLEAN DEFAULT false,
  images TEXT, -- JSON array of media IDs
  seo_title TEXT,
  seo_description TEXT,
  seo_keywords TEXT, -- JSON array
  seo_og_image TEXT, -- Media ID
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Retouches table
CREATE TABLE IF NOT EXISTS retouches (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  before_image TEXT NOT NULL, -- Media ID
  after_image TEXT NOT NULL, -- Media ID
  status TEXT DEFAULT 'published',
  seo_title TEXT,
  seo_description TEXT,
  seo_keywords TEXT, -- JSON array
  seo_og_image TEXT, -- Media ID
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- About page table (une seule ligne) - SANS content pour commencer
CREATE TABLE IF NOT EXISTS about_page (
  id INTEGER PRIMARY KEY DEFAULT 1,
  exergue TEXT NOT NULL,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Clients table
CREATE TABLE IF NOT EXISTS clients (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  logo_url TEXT, -- URL externe ou media ID
  order_index INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Contacts table
CREATE TABLE IF NOT EXISTS contacts (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL, -- email/phone/instagram/website
  label TEXT NOT NULL,
  value TEXT NOT NULL,
  is_visible BOOLEAN DEFAULT true,
  order_index INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Analytics events table
CREATE TABLE IF NOT EXISTS analytics_events (
  id TEXT PRIMARY KEY,
  page TEXT NOT NULL,
  referrer TEXT,
  country TEXT,
  device TEXT,
  user_agent TEXT,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);
