# Runbook — Procédures d'incident

> Procédures rapides à appliquer en cas de problème en production.
> Cible : opérateur (Lou ou Nathalie) qui n'est pas développeur.

---

## 0. Coupure d'urgence (kill-switch)

**Si l'agent fait n'importe quoi** (mauvais post, spam, dérive ton) :

```bash
# Sur le VPS, en lounaops
cd ~/louna-agent
docker compose stop n8n
```

L'orchestrateur s'arrête net. Aucune nouvelle action n'est exécutée.
Pour redémarrer : `docker compose start n8n`.

---

## 1. n8n inaccessible (page blanche / 502)

```bash
docker compose ps              # quel service est down ?
docker compose logs --tail=100 n8n
docker compose restart n8n
```

Si Postgres est down :
```bash
docker compose logs --tail=100 postgres
docker compose restart postgres
docker compose restart n8n
```

---

## 2. Quota Anthropic dépassé

Symptôme : erreurs `429 rate_limit_exceeded` dans les logs n8n.

1. Vérifie la console Anthropic : [console.anthropic.com](https://console.anthropic.com)
2. Recharge des crédits si besoin.
3. Le `budget-tracker.ts` doit avoir alerté en amont — vérifier les notifs ntfy.

---

## 3. Restaurer depuis un backup

Récupérer le dernier `.tar.gz.enc` depuis Backblaze B2 :

```bash
docker run --rm \
  -e AWS_ACCESS_KEY_ID="$BACKUP_S3_ACCESS_KEY" \
  -e AWS_SECRET_ACCESS_KEY="$BACKUP_S3_SECRET_KEY" \
  -v "$PWD":/data \
  amazon/aws-cli:latest \
  --endpoint-url "$BACKUP_S3_ENDPOINT" \
  s3 cp "s3://$BACKUP_S3_BUCKET/daily/<filename>.tar.gz.enc" /data/

# Décrypte
openssl enc -d -aes-256-gcm -pbkdf2 -iter 200000 \
  -in <filename>.tar.gz.enc -out <filename>.tar.gz \
  -pass pass:"$BACKUP_ENCRYPTION_KEY"

# Décompresse
tar -xzf <filename>.tar.gz

# Restaure Postgres
docker compose stop n8n
docker compose exec -T postgres psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" < postgres-*.sql

# Restaure n8n volume
docker run --rm \
  -v louna-agent_n8n-data:/dest \
  -v "$PWD":/source \
  alpine sh -c "cd /dest && tar -xzf /source/n8n-*.tar.gz"

docker compose up -d
```

---

## 4. Cert SSL expiré

```bash
sudo certbot renew --force-renewal
docker compose restart nginx
```

---

## 5. Disque plein

```bash
df -h                          # voir l'espace utilisé
docker system prune -a --volumes -f   # ATTENTION : enlève les images/volumes inutilisés
docker compose logs --tail=10 watchtower   # vérifier que watchtower nettoie bien
```

Si toujours plein : upgrade VPS.

---

## 6. Escalade — qui prévenir ?

| Sévérité | Qui prévenir | Comment |
|----------|--------------|---------|
| **Critique** (agent posté du contenu inapproprié) | Lou immédiatement | ntfy + appel téléphone |
| **Haute** (n8n down >15 min) | Lou + Nathalie | ntfy |
| **Moyenne** (1 service en échec, fallback OK) | log + ntfy basse priorité | tableau de bord |
| **Basse** (warning RAG, faible confidence) | log uniquement | dashboard |

---

## 7. Remettre l'agent en mode 100% supervisé

Si on perd confiance dans l'agent et qu'on veut tout repasser en validation manuelle :

1. Édite le prompt système (`prompts/system-prompt.md`) → met "MODE_SUPERVISED=true" en tête.
2. Dans n8n : active le sous-workflow `MODE_REVIEW` qui queue toutes les actions au lieu de les exécuter.
3. Notifie Lou que tout retourne en file d'attente.

(Ce mécanisme sera implémenté en Phase 2.)
