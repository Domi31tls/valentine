// Route pour servir le sitemap.xml publiquement
export async function GET() {
  try {
    // Faire une requête vers l'API backend pour récupérer le sitemap
    const response = await fetch('/api/sitemap.xml');
    
    if (!response.ok) {
      throw new Error('Failed to fetch sitemap from backend');
    }
    
    const sitemapXml = await response.text();
    
    return new Response(sitemapXml, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=3600', // Cache 1 heure
      },
    });
  } catch (error) {
    console.error('Error serving sitemap:', error);
    
    // Sitemap minimal en cas d'erreur
    const fallbackSitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://valentine-arnaly.com/</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>`;
    
    return new Response(fallbackSitemap, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml',
      },
    });
  }
}
