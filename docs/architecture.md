# Architecture

> Vue d'ensemble de l'infrastructure et du flux de données pour `louna-agent`.
> Référence : `BRIEF.md` sections 2 et 3.

## Diagramme global

```
                       ┌─────────────────────────────────────────┐
                       │          DÉCLENCHEURS (Couche 1)        │
                       │  cron 6h/20h · webhooks HMAC · polling  │
                       └────────────────────┬────────────────────┘
                                            │
                                            ▼
                       ┌─────────────────────────────────────────┐
                       │     ORCHESTRATEUR n8n (Couche 2)        │
                       │   TRG_* · EVT_* · MSG_* · RPT_*         │
                       └────────────────────┬────────────────────┘
                                            │
                          ┌─────────────────┼─────────────────┐
                          │                 │                 │
                          ▼                 ▼                 ▼
              ┌───────────────────┐  ┌──────────┐   ┌──────────────────┐
              │  CERVEAU CLAUDE   │  │  RAG     │◄──│ KNOWLEDGE BASE   │
              │  (Couche 3)       │◄─┤ retrieval│   │ Qdrant (Couche 4)│
              │  Opus 4.7 + Haiku │  └──────────┘   │ 7 catégories     │
              └─────────┬─────────┘                 └──────────────────┘
                        │ function calling
                        ▼
              ┌───────────────────────────────────────────────────┐
              │           OUTILS (Couche 5)                       │
              │  Blotato · ManyChat · Brevo · HubSpot · GA4 ·     │
              │  Meta · Google Calendar · WordPress · Image gen   │
              └───────────────────────────────────────────────────┘

   Tout passe par les ┌─────────────────────────────────────────┐
   GARDE-FOUS  →      │ 1. Prompt système (interdits absolus)   │
                      │ 2. Validateurs n8n (tonalité, budget…)  │
                      │ 3. Escalade humaine (Lou via ntfy)      │
                      └─────────────────────────────────────────┘
```

## Topologie réseau (VPS)

```
                          ┌──────────────────────────────┐
                          │         INTERNET             │
                          └──────────────┬───────────────┘
                                         │ 80/443
                                         ▼
                          ┌──────────────────────────────┐
                          │   UFW firewall (22/80/443)   │
                          └──────────────┬───────────────┘
                                         │
                                         ▼
                          ┌──────────────────────────────┐
                          │   Nginx (Docker, network=web)│
                          │   TLS termination · vhost    │
                          │   n8n.louna-co.com → :5678   │
                          └──────────────┬───────────────┘
                                         │
                                         ▼
       ┌──────────────────────────────────────────────────────────┐
       │             Docker network: web                          │
       │   ┌─────────────┐                                        │
       │   │    n8n      │ ◄─── editor + webhooks (HTTPS only)    │
       │   └─────┬───────┘                                        │
       └─────────┼────────────────────────────────────────────────┘
                 │
       ┌─────────┼────────────────────────────────────────────────┐
       │         ▼   Docker network: internal (no public exposure)│
       │   ┌──────────┐   ┌────────┐   ┌─────────┐                │
       │   │ postgres │   │ redis  │   │ qdrant  │                │
       │   └──────────┘   └────────┘   └─────────┘                │
       └──────────────────────────────────────────────────────────┘
```

## Volumes persistants (Docker)

| Volume            | Mount                              | Backup |
| ----------------- | ---------------------------------- | ------ |
| `postgres-data`   | n8n DB                             | daily (pg_dump) |
| `redis-data`      | n8n queue persistence              | non (transient) |
| `qdrant-data`     | knowledge base embeddings          | daily (snapshot) |
| `n8n-data`        | n8n credentials, workflows, settings | daily (tarball) |
| `letsencrypt`     | TLS certs (host-mounted)           | weekly |
| `certbot-webroot` | http-01 challenge files            | non (transient) |

## Flux de données — exemples

### A. Création d'un post Instagram (cron 6h)

1. **TRG_Daily_Planning** (n8n) → exécute à 06:00.
2. Récupère le calendrier éditorial (Google Calendar) + posts récents (Meta API).
3. Appelle Claude (Opus 4.7) avec prompt système + RAG (Qdrant : `brand-voice`, `content-pillars`, `post-history`).
4. Claude propose 3 variantes via function calling.
5. Validateurs n8n : tonalité, longueur, mots interdits.
6. Génère visuel via DALL-E 3.
7. Programme le post via Blotato pour 11:00.
8. Log dans Postgres + notif ntfy à Lou.

### B. Réponse à un DM Instagram

1. **MSG_Instagram_DM** (n8n webhook depuis ManyChat).
2. Vérifie HMAC signature.
3. RAG sur Qdrant : `faq` + historique de conversation.
4. Claude (Haiku 4.5 si simple, Opus 4.7 si émotionnel) → réponse + score de confidence.
5. Si `confidence < 0.7` ou détection émotionnelle → escalade Lou (ntfy + queue tableau de bord).
6. Sinon : envoi via ManyChat API + log Postgres.

## Stack technique

Voir [`BRIEF.md` section 3](../BRIEF.md). Détails de chaque service dans `docker-compose.yml`.

## Sécurité

- TLS 1.2+ uniquement (Nginx config).
- HSTS, CSP, X-Frame-Options actifs.
- n8n derrière Basic Auth Nginx (en plus de l'auth interne n8n).
- Postgres/Redis/Qdrant **jamais** exposés directement (réseau Docker `internal`).
- Tous les secrets dans `.env` (mode 600, owner `lounaops`).
- Audit trail complet via Pino → JSON structuré → futur agrégateur (Loki ou Datadog en Phase 2).

## Observabilité (Phase 2)

À ajouter en Phase 2 :
- Dashboard de santé (uptime, latence, taux d'erreur Claude API).
- Alertes ntfy sur échec workflow ≥3 fois consécutives.
- Métriques business : nb posts/jour, nb DM répondus, conversion DM → réservation.

## Évolutivité

- VPS upgradeable sans migration (Hostinger KVM 2 → KVM 4 → KVM 8 selon charge).
- Postgres + Qdrant peuvent être migrés vers managed services (Neon, Qdrant Cloud) sans réécriture si la charge dépasse le VPS.
- n8n queue mode (Redis) permet déjà d'ajouter des workers horizontalement.
