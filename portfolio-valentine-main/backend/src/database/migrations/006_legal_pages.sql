-- Migration 006: Legal pages (mentions légales, colophon)

-- Table pour les pages légales
CREATE TABLE IF NOT EXISTS legal_pages (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL, -- 'mentions-legales', 'colophon', etc.
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  is_published BOOLEAN DEFAULT true,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Insérer les pages par défaut
INSERT OR IGNORE INTO legal_pages (id, type, title, content, is_published, updated_at)
VALUES 
  (
    'mentions-legales',
    'mentions-legales',
    'Mentions Légales',
    'Cette page contient les mentions légales du site de Valentine Arnaly, photographe professionnel.

## Éditeur du site

**Valentine Arnaly**
Photographe professionnel
Email : contact@valentine-arnaly.com

## Hébergement

Le site est hébergé par [Votre hébergeur]
Adresse : [Adresse de l''hébergeur]

## Propriété intellectuelle

Toutes les photographies présentes sur ce site sont la propriété exclusive de Valentine Arnaly. 
Toute reproduction, même partielle, est interdite sans autorisation écrite préalable.

## Données personnelles

Les données personnelles collectées via le formulaire de contact sont utilisées uniquement pour répondre à vos demandes.
Elles ne sont jamais transmises à des tiers.

## Cookies

Ce site utilise des cookies pour améliorer votre expérience de navigation et pour des statistiques anonymes.',
    true,
    datetime('now')
  ),
  (
    'colophon',
    'colophon',
    'Colophon',
    'Ce site a été conçu et développé avec passion pour mettre en valeur le travail photographique de Valentine Arnaly.

## Technologies utilisées

- **Frontend** : Astro + Vue.js + TypeScript
- **Backend** : Node.js + Express + SQLite
- **Design** : SCSS avec variables design
- **Optimisation** : Images optimisées, SEO automatisé

## Typographies

- **Titres** : [Nom de la police titres]
- **Texte** : [Nom de la police texte]

## Crédits

- **Développement** : [Votre nom ou agence]
- **Design** : [Designer si différent]
- **Photographies** : Valentine Arnaly (sauf mention contraire)

---

*Dernière mise à jour : ' || datetime('now') || '*',
    true,
    datetime('now')
  );
