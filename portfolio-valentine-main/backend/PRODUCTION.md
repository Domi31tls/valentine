# 🚀 Déploiement en Production

## Suppression des données de développement

Avant de déployer en production, supprimez la migration de développement :

```bash
# Supprimer le fichier de migration de dev
rm src/database/migrations/005_development_seeds.sql

# Ou commenter la ligne dans migrations.ts :
# { version: '005', name: 'Development seeds (DEV ONLY)', file: '005_development_seeds.sql' }
```

## Structure de migration pour la production

Migrations à garder en production :
- ✅ 001: Initial schema
- ✅ 002: Indexes  
- ✅ 003: Seeds (deprecated - ne fait rien)
- ✅ 004: Fix about_page structure
- ❌ 005: Development seeds (À SUPPRIMER)

## Note

La migration 005 contient :
- Un utilisateur admin de test (me@mr-michel.com)
- Des médias, projets et retouches de démonstration
- Des clients et contacts factices

En production, ces données seront créées manuellement via l'interface admin.
