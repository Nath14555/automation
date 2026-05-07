# Deployment

> Procédure de déploiement initial et mises à jour pour `louna-agent`.

---

## Pré-requis

- VPS Ubuntu 24.04 LTS (Hostinger KVM 2 minimum, ou équivalent)
- Domaine `louna-co.com` avec accès au DNS
- Compte Anthropic + clé API
- (Optionnel à ce stade) clés OpenAI, Brevo, HubSpot, etc.
- Clé SSH publique sur ta machine locale (ED25519 recommandé)

---

## Procédure complète — premier déploiement

### 1. DNS — pointer le sous-domaine vers le VPS

Chez ton registrar (où `louna-co.com` est enregistré) :

```
Type   Nom   Valeur            TTL
A      n8n   <IP du VPS>       300
```

Vérifie la propagation : `dig n8n.louna-co.com +short` doit retourner l'IP du VPS.

### 2. Provisionner le VPS

Chez Hostinger :
- Plan : VPS KVM 2 (8 GB RAM, 100 GB SSD)
- OS : **Ubuntu 24.04 LTS**
- Région : UK ou Lituanie (RGPD/Loi 25)
- Hostname : `louna-agent`

Récupère :
- IP publique du VPS
- Mot de passe root initial

### 3. Première connexion + setup

Sur ta machine locale :

```bash
# Génère une clé SSH si tu n'en as pas
ssh-keygen -t ed25519 -C "louna-agent" -f ~/.ssh/louna-agent

# Copie ta clé sur le VPS (entre le mot de passe root au prompt)
ssh-copy-id -i ~/.ssh/louna-agent.pub root@<vps-ip>

# Connecte-toi en root pour le setup initial
ssh -i ~/.ssh/louna-agent root@<vps-ip>
```

Sur le VPS, en root :

```bash
# Clone le repo
git clone https://github.com/Nath14555/automation.git /root/louna-agent
cd /root/louna-agent

# Lance le setup (passe ta clé publique en argument)
SSH_PUBLIC_KEY="$(cat ~/.ssh/authorized_keys | head -1)" \
LE_EMAIL="lou@louna-co.com" \
bash scripts/setup.sh
```

Le script va :
- Mettre à jour le système
- Créer l'utilisateur `lounaops` avec sudo passwordless
- Désactiver le SSH par mot de passe et le login root
- Configurer UFW (ports 22, 80, 443)
- Installer fail2ban
- Installer Docker + Compose
- Tenter d'obtenir un certificat Let's Encrypt pour `n8n.louna-co.com` (si DNS prêt)

### 4. Déconnexion + reconnexion en `lounaops`

```bash
# Déconnecte-toi du root
exit

# Reconnecte-toi en lounaops
ssh -i ~/.ssh/louna-agent lounaops@<vps-ip>
```

### 5. Configuration de l'environnement

```bash
cd /root/louna-agent  # ou clone-le dans /home/lounaops/louna-agent

cp .env.example .env
chmod 600 .env
nano .env  # remplir toutes les clés
```

**Variables obligatoires pour le premier boot** :
- `N8N_HOST=n8n.louna-co.com`
- `N8N_ENCRYPTION_KEY=<générer 32 chars : openssl rand -hex 32>`
- `N8N_BASIC_AUTH_USER` + `N8N_BASIC_AUTH_PASSWORD`
- `POSTGRES_DB=n8n` + `POSTGRES_USER=n8n` + `POSTGRES_PASSWORD=<openssl rand -hex 24>`
- `REDIS_PASSWORD=<openssl rand -hex 24>`
- `QDRANT_API_KEY=<openssl rand -hex 32>`
- `ANTHROPIC_API_KEY=sk-ant-...`

### 6. Premier boot

```bash
docker compose up -d
docker compose ps   # vérifie que tous les services sont healthy
docker compose logs -f n8n   # suis les logs jusqu'à "Editor is now accessible"
```

### 7. Vérification

- Accède à `https://n8n.louna-co.com` → tu devrais voir l'écran de login Basic Auth, puis l'éditeur n8n.
- Lance le health check : `npm install && npm run health-check`

---

## Mises à jour

```bash
# Sur le VPS, en lounaops
cd ~/louna-agent
./scripts/deploy.sh
```

Watchtower met aussi à jour automatiquement les images chaque nuit à 03:00.
Tu peux désactiver l'auto-update d'un service précis en lui ajoutant le label
`com.centurylinklabs.watchtower.enable=false` dans `docker-compose.yml`.

---

## Backups

Configure le cron une fois pour toutes :

```bash
sudo crontab -u lounaops -e
```

Ajoute :
```cron
0 2 * * * /home/lounaops/louna-agent/scripts/backup.sh >> /var/log/louna-backup.log 2>&1
```

Vérifie que `BACKUP_S3_*` et `BACKUP_ENCRYPTION_KEY` sont remplis dans `.env`.

---

## Restauration

Voir [`docs/runbook.md`](./runbook.md) pour les procédures de restauration et incident.

---

## Troubleshooting express

| Problème | Diagnostic | Action |
|----------|-----------|--------|
| 502 Bad Gateway sur n8n | Container n8n down | `docker compose logs n8n` |
| Cert expired | `letsencrypt` volume corrompu ou renew failed | `sudo certbot renew --force-renewal` |
| n8n login boucle | Mauvais `N8N_BASIC_AUTH_PASSWORD` | Édit `.env` puis `docker compose up -d` |
| Out of memory | Workflows trop gros | Augmenter swap ou upgrade VPS |
| Postgres connection refused | Mot de passe désynchronisé | Vérifier `POSTGRES_PASSWORD` cohérent entre `postgres` et `n8n` |
