// Route pour servir robots.txt publiquement
export async function GET() {
  try {
    // Faire une requête vers l'API backend pour récupérer robots.txt
    const response = await fetch('/api/seo/robots.txt');
    
    if (!response.ok) {
      throw new Error('Failed to fetch robots.txt from backend');
    }
    
    const robotsTxt = await response.text();
    
    return new Response(robotsTxt, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain',
        'Cache-Control': 'public, max-age=3600', // Cache 1 heure
      },
    });
  } catch (error) {
    console.error('Error serving robots.txt:', error);
    
    // Robots.txt minimal en cas d'erreur
    const fallbackRobots = `User-agent: *
Allow: /

Sitemap: https://valentine-arnaly.com/sitemap.xml`;
    
    return new Response(fallbackRobots, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain',
      },
    });
  }
}
