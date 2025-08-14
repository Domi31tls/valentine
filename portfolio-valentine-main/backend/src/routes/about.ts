import { Router } from 'express';
import DatabaseManager from '../utils/database.js';
import { ApiUtils, validateId, validateRequired } from '../utils/api.js';
import { VALIDATION } from '../utils/constants.js';
import { randomUUID } from 'crypto';

const router = Router();

// ===========================================
// ABOUT PAGE
// ===========================================

/**
 * GET /api/about - Récupérer la page About avec propriétés modulaires
 * Combine les données de about_page, clients, et contacts
 */
router.get('/', async (req, res) => {
  try {
    console.log('GET /api/about - Fetching data...');

    // Récupérer les données about_page
    const aboutStmt = DatabaseManager.prepare('SELECT * FROM about_page WHERE id = 1');
    const aboutData = aboutStmt.get() as any;
    console.log('About data:', aboutData ? 'found' : 'not found');

    // Récupérer les clients
    const clientsStmt = DatabaseManager.prepare('SELECT * FROM clients ORDER BY order_index ASC');
    const clients = clientsStmt.all() as any[];
    console.log('Clients found:', clients.length);

    // Récupérer les contacts
    const contactsStmt = DatabaseManager.prepare('SELECT * FROM contacts WHERE is_visible = 1 ORDER BY order_index ASC');
    const contacts = contactsStmt.all() as any[];
    console.log('Contacts found:', contacts.length);

    // Construire les propriétés modulaires
    const properties = [];
    let order = 0;

    // Ajouter les propriétés text depuis le contenu JSON
    if (aboutData && aboutData.content) {
      try {
        // Essayer de parser le contenu comme JSON
        const parsedContent = JSON.parse(aboutData.content);
        if (Array.isArray(parsedContent)) {
          parsedContent.forEach(textProp => {
            properties.push({
              id: textProp.id || `text_${order}`,
              type: 'text',
              order: order++,
              data: {
                title: textProp.data?.title || 'À propos',
                content: textProp.data?.content || ''
              }
            });
          });
        } else {
          // Fallback pour l'ancien format HTML
          properties.push({
            id: 'about_content',
            type: 'text',
            order: order++,
            data: {
              title: 'À propos',
              content: aboutData.content
            }
          });
        }
      } catch {
        // Fallback pour l'ancien format HTML
        properties.push({
          id: 'about_content',
          type: 'text',
          order: order++,
          data: {
            title: 'À propos',
            content: aboutData.content
          }
        });
      }
    }

    // Ajouter les clients comme propriétés client
    clients.forEach(client => {
      properties.push({
        id: `client_${client.id}`,
        type: 'client',
        order: order++,
        data: {
          name: client.name || '',
          logo_url: client.logo_url || '',
          website_url: '' // Pas dans l'ancienne structure
        }
      });
    });

    // Ajouter les contacts comme propriétés contact
    contacts.forEach(contact => {
      properties.push({
        id: `contact_${contact.id}`,
        type: 'contact',
        order: order++,
        data: {
          label: contact.label || '',
          url: contact.value || ''
        }
      });
    });

    const response = {
      id: 1,
      exergue: aboutData ? (aboutData.exergue || '') : '',
      properties,
      updated_at: aboutData ? new Date(aboutData.updated_at) : new Date()
    };

    console.log('Response prepared with', properties.length, 'properties');
    ApiUtils.success(res, response);

  } catch (error) {
    console.error('❌ Error fetching about page:', error);
    ApiUtils.error(res, 500, 'Failed to fetch about page: ' + (error instanceof Error ? error.message : 'Unknown error'));
  }
});

/**
 * PUT /api/about - Modifier la page About avec propriétés modulaires
 * Décompose les propriétés modulaires pour les sauvegarder dans les tables existantes
 */
router.put('/', validateRequired(['exergue', 'properties']), async (req, res) => {
  try {
    const { exergue, properties } = req.body;

    console.log('PUT /api/about - Received data:', { exergue, properties });

    // Validation de l'exergue
    if (exergue.length < VALIDATION.ABOUT.EXERGUE_MIN_LENGTH || 
        exergue.length > VALIDATION.ABOUT.EXERGUE_MAX_LENGTH) {
      ApiUtils.error(res, 400, 
        `Exergue must be between ${VALIDATION.ABOUT.EXERGUE_MIN_LENGTH} and ${VALIDATION.ABOUT.EXERGUE_MAX_LENGTH} characters`
      );
      return;
    }

    // Validation des propriétés
    if (!Array.isArray(properties)) {
      ApiUtils.error(res, 400, 'Properties must be an array');
      return;
    }

    // Séparer les propriétés par type
    const textProperties = properties.filter(p => p.type === 'text');
    const clientProperties = properties.filter(p => p.type === 'client');
    const contactProperties = properties.filter(p => p.type === 'contact');

    console.log('Separated properties:', {
      text: textProperties.length,
      client: clientProperties.length,
      contact: contactProperties.length
    });

    // Construire le contenu à partir des propriétés text
    // Conserver la structure JSON pour préserver les titres individuels
    const content = JSON.stringify(textProperties) || 'Contenu par défaut';

    try {
      // Utiliser une transaction SQLite directement sur l'instance
      const db = DatabaseManager.getInstance();
      const saveData = db.transaction(() => {
        // Mettre à jour about_page
        const aboutStmt = db.prepare(`
          INSERT OR REPLACE INTO about_page (id, exergue, content, updated_at)
          VALUES (1, ?, ?, ?)
        `);
        aboutStmt.run(exergue, content, new Date().toISOString());
        console.log('✅ About page updated');

        // Supprimer les anciens clients et contacts
        const deleteClientsStmt = db.prepare('DELETE FROM clients');
        const deleteContactsStmt = db.prepare('DELETE FROM contacts');
        deleteClientsStmt.run();
        deleteContactsStmt.run();
        console.log('✅ Old clients and contacts deleted');

        // Insérer les nouveaux clients
        if (clientProperties.length > 0) {
          const clientStmt = db.prepare(`
            INSERT INTO clients (id, name, logo_url, order_index, created_at)
            VALUES (?, ?, ?, ?, ?)
          `);
          
          clientProperties.forEach((property, index) => {
            const id = randomUUID(); // Toujours générer un nouvel UUID
            clientStmt.run(
              id,
              property.data.name || 'Client sans nom',
              property.data.logo_url || null,
              index,
              new Date().toISOString()
            );
          });
          console.log(`✅ ${clientProperties.length} clients inserted`);
        }

        // Insérer les nouveaux contacts
        if (contactProperties.length > 0) {
          const contactStmt = db.prepare(`
            INSERT INTO contacts (id, type, label, value, is_visible, order_index, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
          `);
          
          contactProperties.forEach((property, index) => {
            const id = randomUUID(); // Toujours générer un nouvel UUID
            // Détecter le type depuis l'URL
            const type = detectContactType(property.data.url || '');
            
            contactStmt.run(
              id,
              type,
              property.data.label || 'Contact',
              property.data.url || '',
              1, // visible
              index,
              new Date().toISOString()
            );
          });
          console.log(`✅ ${contactProperties.length} contacts inserted`);
        }
      });

      // Exécuter la transaction
      saveData();
      console.log('✅ Transaction completed successfully');

      ApiUtils.success(res, {
        id: 1,
        exergue,
        properties,
        updated_at: new Date()
      }, 'About page updated successfully');

    } catch (dbError) {
      console.error('❌ Database transaction error:', dbError);
      ApiUtils.error(res, 500, 'Database transaction failed: ' + (dbError instanceof Error ? dbError.message : 'Unknown error'));
    }

  } catch (error) {
    console.error('❌ Error updating about page:', error);
    ApiUtils.error(res, 500, 'Failed to update about page: ' + (error instanceof Error ? error.message : 'Unknown error'));
  }
});

/**
 * Utilitaire pour détecter le type de contact à partir de l'URL
 */
function detectContactType(url: string): string {
  const urlLower = url.toLowerCase();
  
  if (urlLower.includes('@') || urlLower.startsWith('mailto:')) {
    return 'email';
  }
  if (urlLower.includes('instagram.com') || urlLower.includes('ig.me')) {
    return 'instagram';
  }
  if (urlLower.includes('facebook.com') || urlLower.includes('fb.me')) {
    return 'facebook';
  }
  if (urlLower.includes('twitter.com') || urlLower.includes('x.com')) {
    return 'twitter';
  }
  if (urlLower.includes('linkedin.com')) {
    return 'linkedin';
  }
  if (urlLower.match(/^[\+]?[\d\s\-\(\)]+$/)) {
    return 'phone';
  }
  
  return 'website';
}

// ===========================================
// LEGACY ROUTES (DEPRECATED)
// ===========================================
// Ces routes sont désormais intégrées dans la page About
// avec un système de propriétés modulaires.
// Elles restent pour compatibilité mais ne sont plus utilisées.

// Clients et contacts sont maintenant gérés via /api/about
// avec des propriétés de type 'client' et 'contact'

export default router;
