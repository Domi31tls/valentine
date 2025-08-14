import { Router } from 'express';
import DatabaseManager from '../../utils/database.js';
import { ApiUtils } from '../../utils/api.js';

const router = Router();

/**
 * GET /api/public/about
 * Récupère les données publiques de la page About
 * (exergue, propriétés text, clients, contacts)
 */
router.get('/about', async (req, res) => {
  try {
    // Récupérer les données about_page
    const aboutStmt = DatabaseManager.prepare('SELECT * FROM about_page WHERE id = 1');
    const aboutData = aboutStmt.get() as any;

    // Récupérer les clients
    const clientsStmt = DatabaseManager.prepare('SELECT * FROM clients ORDER BY order_index ASC');
    const clients = clientsStmt.all() as any[];

    // Récupérer les contacts visibles
    const contactsStmt = DatabaseManager.prepare('SELECT * FROM contacts WHERE is_visible = 1 ORDER BY order_index ASC');
    const contacts = contactsStmt.all() as any[];

    // Structure par défaut si pas de données
    const defaultExergue = "Valentine Arnaly is a photographer based in Toulouse, specializing in improving the brand image.";
    
    // Construire la réponse
    const response = {
      exergue: aboutData?.exergue || defaultExergue,
      content: [], // Propriétés text parsées
      clients: clients.map(client => ({
        id: client.id,
        name: client.name,
        logo_url: client.logo_url,
        website_url: client.website_url
      })),
      contacts: contacts.map(contact => ({
        id: contact.id,
        type: contact.type,
        label: contact.label,
        value: contact.value
      }))
    };

    // Parser les propriétés text du contenu JSON si elles existent
    if (aboutData && aboutData.content) {
      try {
        const parsedContent = JSON.parse(aboutData.content);
        if (Array.isArray(parsedContent)) {
          response.content = parsedContent
            .filter(prop => prop.type === 'text' && prop.data?.title && prop.data?.content)
            .map(prop => ({
              id: prop.id,
              title: prop.data.title,
              content: prop.data.content
            }))
            .sort((a, b) => (parsedContent.find(p => p.id === a.id)?.order || 0) - (parsedContent.find(p => p.id === b.id)?.order || 0));
        }
      } catch (parseError) {
        console.warn('Failed to parse about content JSON:', parseError);
      }
    }

    ApiUtils.sendSuccess(res, {
      data: response
    });

  } catch (error) {
    console.error('Erreur récupération page About:', error);
    ApiUtils.sendError(res, 500, 'Erreur serveur lors de la récupération de la page About');
  }
});

export default router;