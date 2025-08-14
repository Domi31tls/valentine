# 🚀 Guide de Déploiement - Portfolio Valentine

## 📋 Informations Générales

**Type de projet** : Application full-stack avec frontend Astro + backend Node.js  
**Architecture** : Frontend (port 3000) + Backend API (port 3001) + Base de données SQLite  
**Domaine cible** : `valentine-arnaly.com` (ou sous-domaine pour test)

## 🛠 Prérequis Serveur

### Version Node.js
- **Node.js 20.x ou 22.x** (requis pour better-sqlite3)
- **npm** (inclus avec Node.js)

### Système d'exploitation
- **Linux** (Ubuntu 20.04+ ou Debian 10+ recommandé)
- **Architecture** : x64

### Ressources minimales
- **RAM** : 512 MB minimum, 1 GB recommandé
- **Stockage** : 2 GB minimum pour le projet + uploads
- **CPU** : 1 vCore minimum

## 🔧 Configuration Serveur

### 1. Nginx (Reverse Proxy)
Configuration Nginx requise pour router :
- `valentine-arnaly.com` → Frontend Astro (port 3000)
- `valentine-arnaly.com/api/*` → Backend API (port 3001)

```nginx
server {
    listen 80;
    server_name valentine-arnaly.com;
    
    # Frontend Astro
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
    
    # Backend API
    location /api/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 2. SSL/HTTPS (Certbot)
```bash
# Installation Certbot pour HTTPS automatique
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d valentine-arnaly.com
```

### 3. Systemd Services
Deux services à créer pour démarrage automatique :

**Frontend Service** (`/etc/systemd/system/valentine-frontend.service`) :
```ini
[Unit]
Description=Valentine Portfolio Frontend
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/valentine-portfolio/frontend
Environment=NODE_ENV=production
ExecStart=/usr/bin/npm run preview
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

**Backend Service** (`/etc/systemd/system/valentine-backend.service`) :
```ini
[Unit]
Description=Valentine Portfolio Backend
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/valentine-portfolio/backend
Environment=NODE_ENV=production
ExecStart=/usr/bin/npm start
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

## 📁 Structure de Déploiement

### Arborescence recommandée
```
/var/www/valentine-portfolio/
├── frontend/                 # Code frontend Astro
├── backend/                  # Code backend Node.js
├── shared/                   # Types TypeScript partagés
├── .env                      # Variables d'environnement
├── package.json              # Scripts root
└── uploads/                  # Dossier uploads (writable)
```

### Permissions fichiers
```bash
# Propriétaire des fichiers
sudo chown -R www-data:www-data /var/www/valentine-portfolio

# Permissions lecture pour le code
sudo chmod -R 644 /var/www/valentine-portfolio
sudo chmod -R 755 /var/www/valentine-portfolio/*/

# Permissions écriture pour uploads et base de données
sudo chmod -R 755 /var/www/valentine-portfolio/frontend/public/uploads
sudo chmod -R 755 /var/www/valentine-portfolio/backend/src/database
```

## 🔐 Variables d'Environnement

### Fichier `.env` à créer
```bash
# Base
NODE_ENV=production
PORT=3001
FRONTEND_URL=https://valentine-arnaly.com

# Base de données
DATABASE_PATH=/var/www/valentine-portfolio/backend/src/database/portfolio.db

# Email (SMTP)
SMTP_HOST=your-smtp-host.com
SMTP_PORT=587
SMTP_USER=noreply@valentine-arnaly.com
SMTP_PASS=your-smtp-password
SMTP_FROM=noreply@valentine-arnaly.com

# Sécurité
SESSION_SECRET=your-super-secret-session-key-change-this
ENCRYPTION_KEY=your-32-char-encryption-key-here

# Admin par défaut
ADMIN_EMAIL=valentine@valentine-arnaly.com
```

## 🔄 Git Hooks pour Déploiement Automatique

### 1. Repository Git Bare
```bash
# Créer le repo bare sur le serveur
sudo git init --bare /var/git/valentine-portfolio.git
sudo chown -R www-data:www-data /var/git/valentine-portfolio.git
```

### 2. Hook Post-Receive
Créer `/var/git/valentine-portfolio.git/hooks/post-receive` :

```bash
#!/bin/bash
cd /var/www/valentine-portfolio

# Déployer le code
git --git-dir=/var/git/valentine-portfolio.git --work-tree=/var/www/valentine-portfolio checkout -f main

echo "🔄 Déploiement en cours..."

# Installer les dépendances
echo "📦 Installation des dépendances..."
npm install
cd frontend && npm install && cd ..
cd backend && npm install && cd ..

# Build du frontend
echo "🔨 Build du frontend..."
cd frontend && npm run build && cd ..

# Redémarrer les services
echo "🔄 Redémarrage des services..."
sudo systemctl restart valentine-frontend
sudo systemctl restart valentine-backend

echo "✅ Déploiement terminé !"
```

```bash
# Rendre le hook exécutable
sudo chmod +x /var/git/valentine-portfolio.git/hooks/post-receive
```

### 3. Configuration Git Locale (pour push automatique)
```bash
# Ajouter le remote sur votre machine locale
git remote add production www-data@valentine-arnaly.com:/var/git/valentine-portfolio.git

# Pour déployer
git push production main
```

## 🧪 Procédure de Test

### 1. Tests après déploiement
```bash
# Vérifier les services
sudo systemctl status valentine-frontend
sudo systemctl status valentine-backend

# Tester les endpoints
curl https://valentine-arnaly.com/api/health
curl https://valentine-arnaly.com

# Vérifier les logs
sudo journalctl -u valentine-frontend -f
sudo journalctl -u valentine-backend -f
```

### 2. Environnement de test (optionnel)
Créer un sous-domaine `test.valentine-arnaly.com` avec :
- Même configuration mais ports différents (3002/3003)
- Base de données séparée
- Git hook sur branche `develop`

## 📧 Configuration Email (SMTP)

### Options recommandées
1. **SendGrid** (recommandé) : Service fiable, 100 emails/jour gratuits
2. **Mailgun** : Alternative robuste
3. **SMTP hébergeur** : Si Archiv'Tech fournit un SMTP

### Configuration SendGrid exemple
```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your_sendgrid_api_key
SMTP_FROM=noreply@valentine-arnaly.com
```

## 🗄️ Base de Données

### SQLite (actuel - recommandé pour ce projet)
- **Fichier** : `backend/src/database/portfolio.db`
- **Migrations** : Auto-exécutées au démarrage
- **Backup** : Simple copie de fichier

### Commandes utiles
```bash
# Backup base de données
cp /var/www/valentine-portfolio/backend/src/database/portfolio.db /backup/portfolio-$(date +%Y%m%d).db

# Vérifier tables
sqlite3 /var/www/valentine-portfolio/backend/src/database/portfolio.db ".tables"
```

## 🛡️ Sécurité

### Firewall
```bash
# Ouvrir seulement les ports nécessaires
sudo ufw allow 80
sudo ufw allow 443
sudo ufw allow 22  # SSH
sudo ufw enable
```

### Fail2ban (protection SSH)
```bash
sudo apt install fail2ban
sudo systemctl enable fail2ban
```

## 📊 Monitoring

### Logs importants
- Frontend : `sudo journalctl -u valentine-frontend`
- Backend : `sudo journalctl -u valentine-backend`
- Nginx : `/var/log/nginx/access.log` et `/var/log/nginx/error.log`

### Espace disque
```bash
# Vérifier l'espace (uploads peuvent grandir)
df -h /var/www/valentine-portfolio
```

## 🚀 Commandes de Déploiement

### Installation initiale
```bash
# 1. Cloner le projet
git clone https://github.com/votre-repo/portfolio-valentine.git /var/www/valentine-portfolio

# 2. Installer dépendances
cd /var/www/valentine-portfolio
npm install
cd frontend && npm install && cd ..
cd backend && npm install && cd ..

# 3. Créer .env
cp .env.example .env
# Éditer .env avec les bonnes valeurs

# 4. Build frontend
cd frontend && npm run build && cd ..

# 5. Démarrer services
sudo systemctl enable valentine-frontend
sudo systemctl enable valentine-backend
sudo systemctl start valentine-frontend
sudo systemctl start valentine-backend
```

---

## 📞 Contact & Support

**En cas de problème lors du déploiement :**
- Logs détaillés : `sudo journalctl -u valentine-frontend -u valentine-backend --since "1 hour ago"`
- Test API : `curl https://valentine-arnaly.com/api/health`
- Vérification ports : `sudo netstat -tlnp | grep :300`

**Fonctionnalités principales à tester :**
1. ✅ Page d'accueil avec projets
2. ✅ Admin avec connexion magic link
3. ✅ Upload d'images
4. ✅ Analytics (tracking anonyme)
5. ✅ SEO et sitemap automatique