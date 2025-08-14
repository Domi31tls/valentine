# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Tech Stack

**Frontend**: Astro + Vue 3 + TypeScript + SCSS
- Port 3000 - Astro with Vue integration for interactive components
- Hybrid rendering mode for dynamic routes
- SCSS with design system variables

**Backend**: Express + TypeScript + SQLite  
- Port 3001 - Express API server
- SQLite database with better-sqlite3
- Magic link authentication with sessions

**Architecture**: Separated frontend/backend with API communication

## Development Commands

### Start Development Servers
```bash
# Start both frontend + backend concurrently (recommended)
npm run dev

# Or start separately
npm run dev:frontend  # Astro dev server on :3000
npm run dev:backend   # Express API server on :3001
```

### Build & Deploy
```bash
# Build both
npm run build

# Build separately  
npm run build:frontend  # Astro build
npm run build:backend   # TypeScript compilation

# Preview frontend build
npm run preview
```

### Database Operations
```bash
cd backend
# Database will auto-migrate on server start
# Check backend/src/database/migrations/ for schema changes
```

## Architecture Overview

### Page Structure
- **Homepage** (`/`): Hero section + project grid + retouches grid (single page design)
- **About** (`/about`): Complete about page with dynamic content
- **Admin** (`/admin/*`): Protected admin interface with magic link auth
- **Modals**: Full-screen project and retouche details (no dedicated pages for `/projects` or `/retouches`)

### Project Grid System
Three alternating patterns displayed line by line:
1. **Pattern 1/3**: 1 small + 1 large image
2. **Pattern 3/1**: 1 large + 1 small image  
3. **Pattern centered**: Single centered image

### Retouches System
- Before/after slider using clip-path technology
- Interactive draggable handle with mouse/touch support
- Grid display on homepage with background differentiation from projects

## Data Models & Database

### Core Entities
- **Media**: Central media management (images, files)
- **Project**: Photo projects with multiple images and SEO
- **Retouche**: Before/after editing comparisons  
- **User**: Admin authentication with roles (admin/editor)
- **AboutPage**: Modular about page with properties
- **LegalPage**: Legal pages (mentions, colophon)
- **SEOSettings**: Site-wide SEO configuration

### Database Architecture
- **SQLite** with better-sqlite3 for performance
- **Auto-migrations** on server startup from `backend/src/database/migrations/`
- **Raw SQL** approach (no ORM) for better control
- **Media centralization** - single table for all file management
- **JSON relations** for performance optimization

### Key Features
- **Magic Link Authentication**: Passwordless login via email
- **Auto-save**: Debounced saving across admin interfaces
- **SEO Automation**: Auto-generation of slugs, meta tags, sitemaps
- **Advanced Upload**: Drag & drop with progress bars and validation
- **Responsive Grids**: Complex alternating patterns with mobile adaptation

## API Endpoints

### Public APIs (no auth required)
```bash
GET /api/public/hero          # Random content for hero section
GET /api/public/projects      # Published projects with pagination
GET /api/public/retouches     # Published retouches with pagination
GET /api/about                # About page content
GET /api/legal                # Legal pages (mentions, colophon)
GET /sitemap.xml              # Auto-generated sitemap
```

### Admin APIs (authentication required)
```bash
# Projects CRUD
GET|POST|PUT|DELETE /api/projects[/:id]

# Retouches CRUD  
GET|POST|PUT|DELETE /api/retouches[/:id]

# Media management
GET|POST|PUT|DELETE /api/media[/:id]

# User management (admin only)
GET|POST /api/users
PUT /api/users/:id/role
DELETE /api/users/:id

# Content management
PUT /api/about                # Update about page
PUT /api/legal                # Update legal pages
```

### Utility APIs
```bash
GET /api/health               # Health check
GET /api/stats                # Dashboard statistics
GET /api/search               # Global search
GET /api/debug                # Development debugging
```

## File Structure & Key Directories

```
portfolio-valentine/
├── frontend/                    # Astro frontend (port 3000)
│   ├── src/
│   │   ├── pages/              # Astro pages (routing)
│   │   ├── components/         # Vue components
│   │   │   ├── admin/         # Admin interface components
│   │   │   ├── projects/      # Project management UI
│   │   │   └── retouches/     # Retouches management UI
│   │   ├── composables/       # Vue composables
│   │   │   ├── useApi.ts      # API communication
│   │   │   ├── useAuth.ts     # Authentication state
│   │   │   └── useDebounce.ts # Debounced operations
│   │   ├── layouts/           # Astro layouts
│   │   └── styles/            # SCSS styles with variables
│   ├── public/uploads/        # User uploaded files
│   └── astro.config.mjs       # Astro configuration
├── backend/                   # Express API server (port 3001)
│   ├── src/
│   │   ├── routes/            # API route handlers
│   │   │   └── public/        # Public API routes (no auth)
│   │   ├── models/            # Database models (TypeScript)
│   │   ├── utils/             # Utilities (database, files, etc.)
│   │   ├── services/          # Business logic (email, etc.)
│   │   └── database/          # SQLite files & migrations
│   └── server.ts              # Express app entry point
└── shared/
    └── types.ts               # Shared TypeScript types
```

## Authentication & Security

### Magic Link Authentication
- **Passwordless** login system via email links
- **Session-based** authentication using express-session
- **Role-based** access control (admin/editor)
- **Token verification** for secure admin access

### File Upload Security
- **Multer** middleware for secure file handling
- **MIME type** validation and file size limits
- **Organized storage** in `public/uploads/YYYY/MM/` structure
- **Access control** via authentication middleware

### API Security
- **CORS** configured for frontend-backend communication
- **Session tokens** for authenticated requests
- **Input validation** with configurable constants
- **Error handling** middleware for consistent responses

## Configuration Constants

Located in `backend/src/utils/constants.ts`:
```typescript
DEFAULT_LIMIT: 42              # API pagination limit
PROJECT.TITLE_MAX_LENGTH: 100  # Project title validation
MEDIA.MAX_FILE_SIZE_MB: 10    # File upload size limit
SEO.TITLE_MAX_LENGTH: 60      # SEO title validation
```

## Development Guidelines

### Code Patterns & Conventions
- **TypeScript**: Strict typing throughout the codebase
- **Vue 3 Composition API**: Use composables for shared logic
- **Auto-save**: Implement debounced saving for better UX
- **Error Handling**: Use consistent error response format
- **File Organization**: Group related functionality in dedicated directories

### Working with Media/Files
- **Upload Storage**: Files go to `frontend/public/uploads/YYYY/MM/`
- **URL Structure**: Accessible as `/uploads/YYYY/MM/filename.ext`
- **Validation**: Check MIME types and file size limits
- **Centralized Model**: Use Media model for all file references

### Database Patterns
- **Models Location**: `backend/src/models/[Entity].ts`
- **Migrations**: Auto-run on server start from `database/migrations/`
- **Raw SQL**: Direct SQLite queries (no ORM) for performance
- **Relations**: Store as JSON for complex relationships

### Authentication Flow
- **Magic Links**: Email-based passwordless authentication
- **Session Management**: Express sessions with secure tokens
- **Role Guards**: Use `requireAdmin()` middleware for protected routes
- **Frontend Auth**: Use `useAuth()` composable for auth state

## Testing & Debug Features

### Debug Tools
```bash
# Frontend debug interface
http://localhost:3000/debug      # Full Vue debug panel with stats

# Backend debug APIs  
GET /api/debug                   # System info and statistics
GET /api/health                  # Basic health check
GET /api/health-detailed         # Comprehensive system status
```

### Admin Authentication Test
```bash
# For development, admin user exists:
# Email: me@mr-michel.com
# Use magic link login at /admin/login
```

## Key Technical Notes

### Image Upload System
- **Storage**: Files saved to `public/uploads/YYYY/MM/`
- **Proxy Setup**: API proxy in `astro.config.mjs` only for `/api` routes
- **Static Files**: Images served directly by Astro (not proxied to backend)

### Before/After Slider Technology
- **Clip-path CSS**: Revolutionary slider effect using `clip-path` property
- **Touch Support**: Draggable handle with mouse and touch events
- **Performance**: GPU-accelerated animations with smooth transitions

### SEO Features
- **Auto Sitemap**: Generated at `/sitemap.xml` from published content
- **Meta Tags**: Dynamic Open Graph and Twitter card generation
- **Slug Generation**: SEO-friendly URLs auto-generated from titles
- **JSON-LD**: Structured data for search engines

### Important Code Patterns
- **API Responses**: Use consistent `{success, data, message}` format
- **Composables**: Put shared logic in `frontend/src/composables/`
- **Shared Types**: All TypeScript types in `shared/types.ts`
- **Constants**: Configurable values in `backend/src/utils/constants.ts`
