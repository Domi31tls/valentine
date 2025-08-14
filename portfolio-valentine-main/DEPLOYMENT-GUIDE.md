# 🚀 Guide de Déploiement - Portfolio Valentine

Guide simple pour déployer le portfolio sur votre serveur avec 2 environnements :
- **PREPROD** : `https://preview.valentine-arnaly.com` (tests)
- **PROD** : `https://valentine-arnaly.com` (site officiel)

## 📋 Ce dont vous avez besoin

- **VPS/Serveur** Linux (Ubuntu 20.04+ ou Debian 11+)
- **Domaine** configuré avec 2 sous-domaines
- **Accès root** ou sudo sur le serveur

## 🛠️ Installation Serveur (30 minutes)

### 1. Préparer le serveur

```bash
# Connexion au serveur
ssh root@votre-serveur.com

# Mise à jour
apt update && apt upgrade -y

# Installation Node.js 20+
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
apt install -y nodejs

# Installation Nginx et Git
apt install -y nginx git certbot python3-certbot-nginx

# Vérification
node --version  # Doit être v20+
nginx -v
```

### 2. Créer la structure

```bash
# Créer les dossiers
mkdir -p /var/www/portfolio-valentine-prod
mkdir -p /var/www/portfolio-valentine-preprod
mkdir -p /var/www/portfolio-valentine-prod.git
mkdir -p /var/www/portfolio-valentine-preprod.git

# Initialiser les repos Git
cd /var/www/portfolio-valentine-prod.git && git init --bare
cd /var/www/portfolio-valentine-preprod.git && git init --bare

# Permissions
chown -R www-data:www-data /var/www/portfolio-valentine-*
```

### 3. Installer les hooks Git

```bash
# Copier les hooks depuis votre projet local
scp hooks/post-receive-prod root@votre-serveur:/var/www/portfolio-valentine-prod.git/hooks/post-receive
scp hooks/post-receive-preprod root@votre-serveur:/var/www/portfolio-valentine-preprod.git/hooks/post-receive

# Rendre exécutables
chmod +x /var/www/portfolio-valentine-prod.git/hooks/post-receive
chmod +x /var/www/portfolio-valentine-preprod.git/hooks/post-receive
chown www-data:www-data /var/www/portfolio-valentine-*.git/hooks/post-receive
```

### 4. Configurer les services

```bash
# Copier les services systemd
scp portfolio-valentine-prod.service root@votre-serveur:/etc/systemd/system/
scp portfolio-valentine-preprod.service root@votre-serveur:/etc/systemd/system/

# IMPORTANT: Éditer les variables d'environnement
nano /etc/systemd/system/portfolio-valentine-prod.service
nano /etc/systemd/system/portfolio-valentine-preprod.service
# Remplacer les URLs, domaines, secrets JWT, etc.

# Activer les services
systemctl daemon-reload
systemctl enable portfolio-valentine-prod
systemctl enable portfolio-valentine-preprod
```

### 5. Configurer Nginx

```bash
# Copier la configuration Nginx
scp nginx-multi-env.conf root@votre-serveur:/etc/nginx/sites-available/portfolio-valentine

# IMPORTANT: Éditer les domaines
nano /etc/nginx/sites-available/portfolio-valentine
# Remplacer valentine-arnaly.com et preview.valentine-arnaly.com par vos vrais domaines

# Activer le site
ln -s /etc/nginx/sites-available/portfolio-valentine /etc/nginx/sites-enabled/
nginx -t  # Tester la config
systemctl reload nginx
```

### 6. Certificats SSL

```bash
# Obtenir les certificats Let's Encrypt
certbot --nginx -d valentine-arnaly.com -d www.valentine-arnaly.com
certbot --nginx -d preview.valentine-arnaly.com

# Auto-renouvellement
echo "0 12 * * * /usr/bin/certbot renew --quiet" | crontab -
```

## 🔄 Configuration Git Local

```bash
# Ajouter les remotes (une seule fois)
git remote add production www-data@votre-serveur.com:/var/www/portfolio-valentine-prod.git
git remote add preprod www-data@votre-serveur.com:/var/www/portfolio-valentine-preprod.git

# Créer la branche preprod si elle n'existe pas
git checkout -b preprod
git push preprod preprod

# Premier déploiement production
git checkout main
git push production main
```

## ✨ Utilisation Quotidienne

### Développement et tests

```bash
# Faire vos modifications
git add .
git commit -m "Nouvelle fonctionnalité"

# Déployer sur PREPROD pour tester
git checkout preprod
git merge main  # ou votre branche
git push preprod preprod
# ➡️ Déploie automatiquement sur https://preview.valentine-arnaly.com
```

### Mise en production (après validation)

```bash
# Après que Valentine ait validé sur preview
git checkout main
git merge preprod
git push production main
# ➡️ Déploie automatiquement sur https://valentine-arnaly.com
```

## 📊 Monitoring

```bash
# Status des services
systemctl status portfolio-valentine-prod
systemctl status portfolio-valentine-preprod

# Logs en temps réel
journalctl -u portfolio-valentine-prod -f
journalctl -u portfolio-valentine-preprod -f

# Logs Nginx
tail -f /var/log/nginx/portfolio-valentine-prod.access.log
tail -f /var/log/nginx/portfolio-valentine-preprod.access.log

# Test de santé
curl https://valentine-arnaly.com/api/health
curl https://preview.valentine-arnaly.com/api/health
```

## 🚨 Dépannage

### Service ne démarre pas
```bash
# Vérifier les logs
journalctl -u portfolio-valentine-prod -n 50

# Vérifier les permissions
chown -R www-data:www-data /var/www/portfolio-valentine-*

# Redémarrer
systemctl restart portfolio-valentine-prod
```

### Nginx erreur
```bash
# Tester la config
nginx -t

# Recharger
systemctl reload nginx

# Vérifier les certificats SSL
certbot certificates
```

### Déploiement échoué
```bash
# Vérifier Node.js version
node --version  # Doit être v20+

# Installation manuelle des deps
cd /var/www/portfolio-valentine-prod
sudo -u www-data npm run install:all
sudo -u www-data npm run build
```

## 🎯 URLs Finales

- **Production** : `https://valentine-arnaly.com`
- **Preview** : `https://preview.valentine-arnaly.com`
- **Admin Prod** : `https://valentine-arnaly.com/admin/login`
- **Admin Preview** : `https://preview.valentine-arnaly.com/admin/login`

**Email admin** : `me@mr-michel.com` (configuré dans les seeds)

---

**C'est tout !** Après configuration, chaque `git push` déploie automatiquement. 🚀