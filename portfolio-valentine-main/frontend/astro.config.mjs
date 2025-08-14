import { defineConfig } from 'astro/config';
import vue from '@astrojs/vue';

// https://astro.build/config
export default defineConfig({
  integrations: [vue()],
  
  // Configuration SCSS
  vite: {
    // Configuration du proxy SEULEMENT pour l'API
    server: {
      proxy: {
        '/api': {
          target: 'http://localhost:3001',
          changeOrigin: true,
          secure: false
        }
        // ❌ SUPPRIMÉ le proxy /uploads car les fichiers sont dans public/
        // Les images doivent être servies directement par Astro depuis public/uploads
      }
    }
  },
  
  // Configuration de développement
  server: {
    port: 3000,
    host: true
  },
  
  // Configuration pour la production - Mode hybrid pour les routes dynamiques
  output: 'hybrid',
  
  // Configuration du build
  build: {
    assets: 'assets'
  }
});