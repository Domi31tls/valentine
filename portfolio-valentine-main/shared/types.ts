// ===========================================
// TYPES PARTAGÉS - Portfolio Valentine
// ===========================================

export interface Media {
  id: string;
  filename: string;
  url: string;
  caption?: string;
  alt?: string;
  mime_type: string;
  size: number;
  width: number;
  height: number;
  created_at: Date;
}

export interface Project {
  id: string;
  title: string;
  description?: string;
  status: 'published' | 'invisible';
  is_draft: boolean; // If not saved we show the `not saved since`
  images: Media[];
  seo: SEOData;
  created_at: Date;
  updated_at: Date;
}

export interface Retouche {
  id: string;
  title: string;
  before_image: Media;
  after_image: Media;
  status: 'published' | 'invisible';
  seo: SEOData;
  created_at: Date;
  updated_at: Date;
}

export interface SEOData {
  title?: string;
  description?: string;
  keywords?: string[];
  ogImage?: Media;
}

export interface AboutPage {
  id: number;
  exergue: string;
  properties: AboutProperty[];
  updated_at: Date;
}

export interface AboutProperty {
  id: string;
  type: 'text' | 'client' | 'contact';
  order: number;
  data: TextProperty | ClientProperty | ContactProperty;
}

export interface TextProperty {
  title: string;
  content: string;
}

export interface ClientProperty {
  name: string;
  logo_url?: string;
  website_url?: string;
}

export interface ContactProperty {
  label: string;
  url: string;
}

// Legacy types - maintenant intégrés dans AboutProperty
export interface Client {
  id: string;
  name: string;
  logo?: Media | string; // si on veut chercher le lien du logo ou si on l'upload sur le site
  order_index: number;
  created_at: Date;
}

export interface Contact {
  id: string;
  type: string; // email/phone/instagram/website
  label: string;
  value: string;
  is_visible: boolean;
  order_index: number;
  created_at: Date;
}

export interface AnalyticsEvent {
  id: string;
  page: string;
  referrer?: string;
  country?: string;
  device: 'mobile' | 'tablet' | 'desktop';
  user_agent: string;
  timestamp: Date;
}

export interface LegalPage {
  id: string;
  type: string;
  title: string;
  content: string;
  is_published: boolean;
  updated_at: Date;
}

export interface SEOSettings {
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

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'editor';
  created_at: string;
  updated_at: string;
  last_login_at?: string | null;
}

export interface Session {
  id: string;
  user_id: string;
  token: string;
  expires_at: Date;
  created_at: Date;
}

// ===========================================
// TYPES POUR LES API
// ===========================================

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Types pour les formulaires
export interface ProjectCreateInput {
  title: string;
  description?: string;
  status: 'published' | 'invisible';
  is_draft: boolean;
  images: Media[];
  seo: SEOData;
}

export interface ProjectUpdateInput extends Partial<ProjectCreateInput> {
  id: string;
}

export interface RetoucheCreateInput {
  title: string;
  before_image: Media;
  after_image: Media;
  status: 'published' | 'invisible';
  seo: SEOData;
}

export interface RetoucheUpdateInput extends Partial<RetoucheCreateInput> {
  id: string;
}

export interface MediaCreateInput {
  filename: string;
  url: string;
  caption?: string;
  alt?: string;
  mime_type: string;
  size: number;
  width: number;
  height: number;
}

// Types pour l'authentification
export interface LoginInput {
  email: string;
}

export interface UserCreateInput {
  email: string;
  role?: 'admin' | 'editor';
}

export interface UserUpdateInput {
  email?: string;
  name?: string;
  role?: 'admin' | 'editor';
}

export interface LegalPageCreateInput {
  id: string;
  type: string;
  title: string;
  content: string;
  is_published?: boolean;
}

export interface LegalPageUpdateInput {
  title?: string;
  content?: string;
  is_published?: boolean;
}

export interface SEOSettingsUpdateInput {
  site_name?: string;
  author_name?: string;
  contact_email?: string;
  location?: string;
  robots_mode?: 'allow_all' | 'protect_admin' | 'block_all';
  google_verification?: string;
  facebook_verification?: string;
  pinterest_verification?: string;
  bing_verification?: string;
  default_language?: string;
  copyright_text?: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  user?: User;
  token?: string;
}

// Types pour les uploads
export interface UploadResponse {
  success: boolean;
  media: Media;
  message: string;
}

// Types pour les listes avec pagination
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Types pour les filtres
export interface ProjectFilters {
  status?: 'published' | 'invisible';
  limit?: number;
  page?: number;
  search?: string;
}

export interface RetoucheFilters {
  status?: 'published' | 'invisible';
  limit?: number;
  page?: number;
  search?: string;
}

export interface MediaFilters {
  mime_type?: string;
  limit?: number;
  page?: number;
  search?: string;
}

// Types pour les statistiques
export interface AnalyticsData {
  page_views: number;
  unique_visitors: number;
  popular_projects: Array<{
    project_id: string;
    title: string;
    views: number;
  }>;
  period: string;
}

// Types pour les erreurs
export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}
