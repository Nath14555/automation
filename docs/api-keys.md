# API Keys — Comment et où

> Liste des clés API à obtenir, comment les générer, et politique de rotation.
> **Aucune clé n'est jamais committée dans le repo. Tout passe par `.env`.**

---

## Légende

- 🔴 **Bloquant** : sans cette clé, l'agent ne peut pas fonctionner.
- 🟡 **Important** : feature précise ne marche pas.
- 🟢 **Optionnel** : nice-to-have, dégradation gracieuse.

---

## 🔴 Anthropic (Claude API)

- **Service** : Cerveau de l'agent (Opus 4.7 + Haiku 4.5).
- **Console** : [console.anthropic.com](https://console.anthropic.com)
- **Étapes** :
  1. Crée un compte (carte de crédit obligatoire).
  2. Ajoute des crédits prépayés (~50 CAD pour démarrer).
  3. Settings → API Keys → Create Key.
  4. Donne-lui un nom (`louna-agent-prod`).
  5. Copie-colle dans `.env` : `ANTHROPIC_API_KEY=sk-ant-api03-...`
- **Rotation** : tous les 6 mois, ou immédiatement si fuite suspectée.

---

## 🔴 OpenAI (embeddings)

- **Service** : Embeddings pour Qdrant (`text-embedding-3-small`).
- **Console** : [platform.openai.com](https://platform.openai.com)
- **Étapes** :
  1. Compte OpenAI.
  2. Add billing → ajoute ~10 CAD (les embeddings coûtent quelques centimes par mois).
  3. API keys → Create.
  4. `.env` : `OPENAI_API_KEY=sk-proj-...`
- **Note** : alternative possible plus tard avec embeddings open-source (BGE, E5) hébergés localement, pour Loi 25.

---

## 🟡 Brevo (email marketing)

- **Service** : Newsletter, séquences automatiques.
- **Console** : [app.brevo.com](https://app.brevo.com) → SMTP & API → API Keys
- **Étapes** :
  1. Crée un compte gratuit (jusqu'à 300 emails/jour gratuit).
  2. Plan Business (~12 CAD/mois) si volume.
  3. Génère une API key v3.
  4. `.env` : `BREVO_API_KEY=xkeysib-...`
  5. Configure aussi `BREVO_SENDER_EMAIL=hello@louna-co.com` (à vérifier DKIM/SPF côté domaine).

---

## 🟡 HubSpot (CRM)

- **Service** : Stockage contacts, tracking conversion.
- **Console** : [app.hubspot.com](https://app.hubspot.com) → Settings → Integrations → Private Apps
- **Étapes** :
  1. Compte gratuit (free tier suffit).
  2. Crée une "Private App" (pas une "Public App").
  3. Scopes nécessaires : `crm.objects.contacts.read|write`, `crm.objects.deals.read|write`, `crm.lists.read`, `crm.schemas.contacts.read`.
  4. `.env` : `HUBSPOT_PRIVATE_APP_TOKEN=pat-na1-...`

---

## 🟡 ManyChat (chatbot DM Instagram)

- **Service** : Réception et envoi de DM Instagram.
- **Console** : [manychat.com](https://manychat.com) → Settings → API
- **Étapes** :
  1. Plan Pro (~15 USD/mois).
  2. Connecte la page Instagram Louna&Co.
  3. Génère l'API token.
  4. `.env` : `MANYCHAT_API_TOKEN=...` + `MANYCHAT_PAGE_ID=...`

---

## 🟡 Blotato (publication multi-plateformes)

- **Service** : Programmation IG, FB, TikTok, etc. depuis un seul endpoint.
- **Console** : [blotato.com](https://blotato.com)
- **Étapes** :
  1. Plan ~30 USD/mois.
  2. Connecte les comptes Louna&Co (IG, FB, et TikTok plus tard).
  3. Génère l'API token.
  4. `.env` : `BLOTATO_API_TOKEN=...` + `BLOTATO_WORKSPACE_ID=...`

---

## 🟡 Meta for Developers (IG + FB direct)

- **Service** : Webhooks comments, page tokens (alternative à Blotato pour direct API).
- **Console** : [developers.facebook.com](https://developers.facebook.com)
- **Étapes** :
  1. Crée une app Business.
  2. Ajoute les produits : Instagram Graph API, Webhooks.
  3. Long-lived Page Access Token via Graph API Explorer.
  4. `.env` : `META_APP_ID`, `META_APP_SECRET`, `META_PAGE_ACCESS_TOKEN`, `META_INSTAGRAM_BUSINESS_ID`, `META_WEBHOOK_VERIFY_TOKEN` (tu choisis cette valeur, n8n la vérifiera).

---

## 🟡 Google (GA4 + Calendar)

- **Service** : Analytics du site + calendrier événements Social Club.
- **Console** : [console.cloud.google.com](https://console.cloud.google.com)
- **Étapes** :
  1. Crée un projet GCP.
  2. APIs & Services → Library → active "Google Analytics Data API" et "Google Calendar API".
  3. IAM → Service Accounts → Create.
  4. Génère une clé JSON.
  5. `.env` : `GOOGLE_SERVICE_ACCOUNT_JSON=<contenu JSON sur une seule ligne, échappé>`
  6. Donne au service account l'accès Lecteur sur GA4 et au calendrier (partager le calendrier avec l'email du SA).

---

## 🟢 Image generation

Choisir entre :
- **DALL-E 3** (via OpenAI, déjà configuré) → `IMAGE_GEN_PROVIDER=dalle`
- **Flux** (Black Forest Labs ou Replicate) → `IMAGE_GEN_PROVIDER=flux`

---

## 🟢 ntfy (notifications push)

- **Service** : Push gratuit vers téléphone (alternative : Pushover payant).
- **Console** : [ntfy.sh](https://ntfy.sh)
- **Étapes** :
  1. Choisis un nom de topic unique (genre `louna-agent-alerts-xY7zQ2`).
  2. Installe l'app ntfy sur ton téléphone, abonne-toi au topic.
  3. `.env` : `NTFY_TOPIC=louna-agent-alerts-xY7zQ2`

---

## 🟢 Backblaze B2 (backups)

- **Service** : Storage chiffré pour backups quotidiens.
- **Console** : [backblaze.com/b2](https://www.backblaze.com/b2)
- **Étapes** :
  1. Compte (10 GB gratuit, ~$0.005/GB ensuite).
  2. Create Bucket : `louna-agent-backups` (privé).
  3. App Keys → Create → scope = ce bucket.
  4. `.env` :
     - `BACKUP_S3_ENDPOINT=https://s3.us-west-002.backblazeb2.com` (selon ta région)
     - `BACKUP_S3_BUCKET=louna-agent-backups`
     - `BACKUP_S3_ACCESS_KEY=...`
     - `BACKUP_S3_SECRET_KEY=...`
     - `BACKUP_ENCRYPTION_KEY=$(openssl rand -hex 32)`

---

## 🔐 Politique de rotation

| Type | Fréquence | Procédure |
|------|-----------|-----------|
| Anthropic, OpenAI | 6 mois | Créer la nouvelle clé, mettre à jour `.env`, redémarrer n8n, révoquer l'ancienne |
| Brevo, HubSpot, ManyChat | 12 mois | Idem |
| Postgres, Redis, Qdrant API key | 12 mois ou compromission | Plus délicat — nécessite un downtime court |
| `BACKUP_ENCRYPTION_KEY` | **Jamais** sans plan complet de re-chiffrement | Garder précieusement |

---

## ⚠️ Que faire en cas de fuite suspectée

1. **Révoquer la clé compromise immédiatement** dans la console du service.
2. Auditer les logs (Pino → cherche les dernières utilisations).
3. Générer une nouvelle clé.
4. Mettre à jour `.env` sur le VPS (`scp` ou `nano` direct).
5. `docker compose up -d` pour recharger.
6. Documenter l'incident dans `docs/decisions.md` (ADR).
7. Si données personnelles potentiellement exposées : déclencher la procédure Loi 25.
