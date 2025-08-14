# 🌍 Configuration des Environnements - Portfolio Valentine

Guide pour comprendre comment les URLs et APIs fonctionnent selon l'environnement.

## 🏗️ Architecture par environnement

### **🏠 Développement Local**

**Configuration actuelle (parfaite) :**
```
Votre machine :
├── Frontend Astro    → localhost:3000
├── Backend Express   → localhost:3001
└── Proxy Astro       → /api → localhost:3001
```

**Comment ça marche :**
1. Vous développez sur `http://localhost:3000`
2. Le frontend appelle `/api/projects`, `/api/auth`, etc.
3. Le proxy Astro (dans `astro.config.mjs`) redirige automatiquement vers `localhost:3001`
4. Pas de problème CORS, tout fonctionne

### **🌍 Serveur de Production**

**Configuration serveur :**
```
Serveur Valentine :
├── Domain             → valentine-arnaly.com
├── Frontend (Nginx)   → Sert les fichiers Astro buildés
├── Backend (Node)     → localhost:3001 (interne)
└── Nginx Proxy        → /api → localhost:3001
```

**Comment ça marche :**
1. Les utilisateurs visitent `https://valentine-arnaly.com`
2. Nginx sert le frontend Astro builded
3. Le frontend appelle `/api/projects`, `/api/auth`, etc.
4. Nginx proxy redirige `/api/*` vers le backend Node.js sur port 3001
5. Même domaine, pas de problème CORS

## 🔄 Workflow de développement

### **Scénario 1 : Développement normal (recommandé)**

```bash
# Développement local complet
npm run dev  # Frontend sur :3000, Backend sur :3001

# Tester, développer, puis push
git push preprod preprod  # Deploy sur preview.valentine-arnaly.com
git push production main  # Deploy sur valentine-arnaly.com
```

### **Scénario 2 : Tester contre le serveur distant**

Si vous voulez tester votre frontend local contre l'API du serveur :

```bash
# Dans frontend/.env
PUBLIC_API_URL=https://preview.valentine-arnaly.com

# Relancer le dev
npm run dev:frontend
# Maintenant votre frontend local utilise l'API distante
```

### **Scénario 3 : Frontend local + Backend distant**

```bash
# Frontend local, backend sur serveur
echo "PUBLIC_API_URL=https://preview.valentine-arnaly.com" > frontend/.env

npm run dev:frontend
# Votre frontend local (localhost:3000) utilise l'API distante
```

## ⚙️ Variables d'environnement

### **Frontend (`frontend/.env`)**

```bash
# Développement local - utilise le proxy Astro
# PUBLIC_API_URL=

# Pour pointer vers un serveur distant
# PUBLIC_API_URL=https://preview.valentine-arnaly.com
```

### **Backend (systemd service)**

```bash
# Production
Environment=NODE_ENV=production
Environment=PORT=3001
Environment=SITE_URL=https://valentine-arnaly.com

# Preprod  
Environment=NODE_ENV=development
Environment=PORT=3002
Environment=SITE_URL=https://preview.valentine-arnaly.com
```

## 🎯 Cas d'usage concrets

### **1. Développement quotidien**
- Gardez tout en local : `npm run dev`
- Push sur preprod pour tester sur serveur
- Validation, puis push production

### **2. Debug avec données serveur**
```bash
# Utiliser l'API distante depuis votre local
echo "PUBLIC_API_URL=https://preview.valentine-arnaly.com" > frontend/.env
npm run dev:frontend
```

### **3. Test de compatibilité**
```bash
# Build local pour tester comme en production
npm run build
npm run preview  # Test du build en local
```

## 🔧 Dépannage URLs

### **Frontend n'arrive pas à joindre l'API**

```bash
# Vérifier la config
console.log(import.meta.env.PUBLIC_API_URL)  # Dans le frontend

# Tester l'API manuellement
curl https://valentine-arnaly.com/api/health
curl https://preview.valentine-arnaly.com/api/health
```

### **CORS errors**
- En local : Vérifiez le proxy Astro dans `astro.config.mjs`
- En production : Vérifiez la config Nginx

### **Wrong API calls**
```bash
# Voir les appels réseau dans DevTools
# Ou activer les logs
echo "DEBUG=true" >> frontend/.env
```

## 💡 Points importants

✅ **En local** : Le proxy Astro gère tout automatiquement
✅ **En production** : Nginx gère tout automatiquement  
✅ **Même domaine** : Pas de problème CORS
✅ **Flexible** : Vous pouvez pointer vers n'importe quelle API

**Vous n'avez rien à changer dans le code !** Tout est déjà configuré pour fonctionner partout. 🚀