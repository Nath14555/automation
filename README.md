# AI Marketing Agency - Automatisation Complete

Systeme d'automatisation complet pour une agence de marketing, avec 12 agents AI specialises couvrant l'ensemble du parcours client.

## Architecture globale de l'agence

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        AI MARKETING AGENCY                              │
│                                                                         │
│  ACQUISITION          CONVERSION         FIDELISATION                   │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐              │
│  │ 1. Stratege  │───▶│ 7. Sales     │───▶│11. Onboarding│              │
│  │    Marketing │    │    Closer    │    │   Specialist │              │
│  └──────┬───────┘    └──────────────┘    └──────┬───────┘              │
│         │                                        │                      │
│  ┌──────▼───────┐    ┌──────────────┐    ┌──────▼───────┐              │
│  │ 2. Content   │    │ 5. Media     │    │12. Retention │              │
│  │    Creator   │    │    Buyer     │    │   Specialist │              │
│  └──────┬───────┘    └──────────────┘    └──────────────┘              │
│         │                                                               │
│  ┌──────▼───────┐    ┌──────────────┐    ┌──────────────┐              │
│  │ 3. Community │    │ 6. Email     │    │ 9. CRM       │              │
│  │    Manager   │    │    Marketer  │    │    Manager   │              │
│  └──────────────┘    └──────────────┘    └──────────────┘              │
│                                                                         │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐              │
│  │ 4. SEO       │    │ 8. Analytics │    │10. Reputation│              │
│  │    Specialist│    │    Analyst   │    │    Manager   │              │
│  └──────────────┘    └──────────────┘    └──────────────┘              │
└─────────────────────────────────────────────────────────────────────────┘
```

## Les 12 agents AI

| # | Agent | Role | Categorie |
|---|-------|------|-----------|
| 1 | **Stratege Marketing** | Analyse marche, definit objectifs, coordonne les agents | Strategy |
| 2 | **Content Creator** | Cree contenu textuel/visuel pour tous les canaux | Content |
| 3 | **Community Manager** | Gere interactions reseaux sociaux, DMs, commentaires | Engagement |
| 4 | **SEO Specialist** | Optimise visibilite organique, audit, mots-cles | Acquisition |
| 5 | **Media Buyer** | Gere campagnes publicitaires, budgets, encheres | Acquisition |
| 6 | **Email Marketer** | Sequences email, newsletters, segmentation | Nurturing |
| 7 | **Sales Closer** | Qualifie leads, follow-up, closing | Conversion |
| 8 | **Analytics Analyst** | Collecte donnees, rapports, insights | Intelligence |
| 9 | **CRM Manager** | Gere base clients, enrichissement, scoring | Operations |
| 10 | **Reputation Manager** | Veille mentions, avis, e-reputation | Brand |
| 11 | **Onboarding Specialist** | Accueil nouveaux clients, setup, formation | Customer Success |
| 12 | **Retention Specialist** | Detection churn, fidelisation, upsell | Customer Success |

## Architecture des workflows (existants)

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  WF-INGEST-META │    │ WF-INGEST-TIKTOK│    │ WF-INGEST-GMAIL │
│   (Webhook)     │    │   (Webhook)     │    │  (Gmail Trigger)│
└────────┬────────┘    └────────┬────────┘    └────────┬────────┘
         │                      │                      │
         └──────────────────────┼──────────────────────┘
                                │
                                ▼
                    ┌───────────────────────┐
                    │    WF-CORE-BRAIN      │
                    │  - Anti-doublon       │
                    │  - Gestion d'etat     │
                    │  - Intentions         │
                    │  - Choix variante     │
                    │  - Garde-fous         │
                    └───────────┬───────────┘
                                │
              ┌─────────────────┼─────────────────┐
              ▼                 ▼                 ▼
    ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
    │ WF-ACTIONS-SEND │ │ WF-ACUITY-BOOK  │ │    Handoff      │
    └─────────────────┘ └─────────────────┘ └─────────────────┘
```

## Tous les workflows

### Existants (Community Manager / Sales Closer)

| Workflow | Description | Trigger |
|----------|-------------|---------|
| `WF-INGEST-META` | Ingestion Meta (Facebook/Instagram) | Webhook |
| `WF-INGEST-TIKTOK` | Ingestion TikTok | Webhook |
| `WF-INGEST-GMAIL` | Ingestion Gmail | Gmail Trigger |
| `WF-CORE-BRAIN` | Cerveau central (logique commune) | Workflow Call |
| `WF-ACTIONS-SEND` | Envoi de messages | Workflow Call |
| `WF-ACUITY-BOOK` | Booking Acuity | Workflow Call |

### Stratege Marketing

| Workflow | Description | Frequence |
|----------|-------------|-----------|
| `WF-STRATEGY-TRENDS` | Veille tendances automatique | Hebdomadaire |
| `WF-STRATEGY-COMPETITOR` | Analyse concurrentielle | Hebdomadaire |
| `WF-STRATEGY-BRIEF` | Generation de briefs creatifs | Manuel |

### Content Creator

| Workflow | Description | Frequence |
|----------|-------------|-----------|
| `WF-CONTENT-SOCIAL` | Generation et publication posts | Quotidienne |
| `WF-CONTENT-BLOG` | Creation d'articles SEO | Hebdomadaire |
| `WF-CONTENT-VIDEO-SCRIPT` | Scripts video | Manuel |
| `WF-CONTENT-VISUAL` | Generation de visuels | A la demande |
| `WF-CONTENT-CALENDAR` | Calendrier editorial | Hebdomadaire |

### Community Manager

| Workflow | Description | Frequence |
|----------|-------------|-----------|
| `WF-COMMUNITY-COMMENTS` | Gestion des commentaires | Temps reel |
| `WF-COMMUNITY-ENGAGE` | Engagement proactif | 3x/jour |
| `WF-COMMUNITY-MODERATE` | Moderation automatique | Temps reel |
| `WF-COMMUNITY-PUBLISH` | Publication programmee | Programmee |

### SEO Specialist

| Workflow | Description | Frequence |
|----------|-------------|-----------|
| `WF-SEO-AUDIT` | Audit technique | Hebdomadaire |
| `WF-SEO-KEYWORDS` | Recherche mots-cles | Hebdomadaire |
| `WF-SEO-TRACKING` | Suivi des positions | Quotidienne |
| `WF-SEO-CONTENT` | Optimisation contenu | A la demande |
| `WF-SEO-REPORT` | Rapport SEO | Hebdomadaire |

### Media Buyer

| Workflow | Description | Frequence |
|----------|-------------|-----------|
| `WF-ADS-CREATE` | Creation de campagnes | Manuel |
| `WF-ADS-OPTIMIZE` | Optimisation encheres | Toutes les 4h |
| `WF-ADS-BUDGET` | Gestion budgetaire | Quotidienne |
| `WF-ADS-REPORT` | Rapport publicitaire | Quotidienne |
| `WF-ADS-ALERT` | Alertes performance | Toutes les 2h |

### Email Marketer

| Workflow | Description | Frequence |
|----------|-------------|-----------|
| `WF-EMAIL-SEQUENCE` | Sequences automatisees | A la demande |
| `WF-EMAIL-NEWSLETTER` | Newsletter | Hebdomadaire |
| `WF-EMAIL-SEGMENT` | Segmentation | Quotidienne |
| `WF-EMAIL-AB-TEST` | Tests A/B | A la demande |
| `WF-EMAIL-REPORT` | Rapport email | Hebdomadaire |
| `WF-EMAIL-CLEANUP` | Nettoyage liste | Mensuelle |

### Sales Closer

| Workflow | Description | Frequence |
|----------|-------------|-----------|
| `WF-SALES-QUALIFY` | Qualification leads | Temps reel |
| `WF-SALES-FOLLOWUP` | Follow-up automatique | 2x/jour |
| `WF-SALES-PROPOSAL` | Propositions commerciales | A la demande |
| `WF-SALES-PIPELINE` | Pipeline management | Quotidienne |

### Analytics Analyst

| Workflow | Description | Frequence |
|----------|-------------|-----------|
| `WF-ANALYTICS-COLLECT` | Collecte multi-source | Quotidienne |
| `WF-ANALYTICS-DASHBOARD` | Mise a jour dashboards | Quotidienne |
| `WF-ANALYTICS-REPORT` | Rapports performance | Hebdomadaire |
| `WF-ANALYTICS-ALERT` | Alertes KPI | Toutes les 3h |
| `WF-ANALYTICS-ATTRIBUTION` | Attribution multi-canal | Quotidienne |

### CRM Manager

| Workflow | Description | Frequence |
|----------|-------------|-----------|
| `WF-CRM-ENRICH` | Enrichissement leads | Temps reel |
| `WF-CRM-DEDUPE` | Deduplication | Quotidienne |
| `WF-CRM-SCORE` | Lead scoring | Temps reel |
| `WF-CRM-SYNC` | Synchronisation | Toutes les 30min |
| `WF-CRM-CLEAN` | Nettoyage donnees | Hebdomadaire |

### Reputation Manager

| Workflow | Description | Frequence |
|----------|-------------|-----------|
| `WF-REPUTATION-MONITOR` | Veille mentions | Toutes les 2h |
| `WF-REPUTATION-REVIEW` | Gestion avis | Temps reel |
| `WF-REPUTATION-SENTIMENT` | Analyse sentiment | Quotidienne |
| `WF-REPUTATION-REQUEST` | Demandes d'avis | Post-service |
| `WF-REPUTATION-CRISIS` | Detection crise | Horaire |

### Onboarding Specialist

| Workflow | Description | Frequence |
|----------|-------------|-----------|
| `WF-ONBOARD-WELCOME` | Sequence d'accueil | Par nouveau client |
| `WF-ONBOARD-SETUP` | Configuration compte | Par nouveau client |
| `WF-ONBOARD-CHECKIN` | Points de suivi | J+7, J+14, J+30 |
| `WF-ONBOARD-SURVEY` | Sondage satisfaction | J+30 |

### Retention Specialist

| Workflow | Description | Frequence |
|----------|-------------|-----------|
| `WF-RETAIN-CHURN` | Detection churn | Quotidienne |
| `WF-RETAIN-CAMPAIGN` | Campagnes retention | A la demande |
| `WF-RETAIN-UPSELL` | Upsell automatise | Hebdomadaire |
| `WF-RETAIN-WINBACK` | Win-back | Mensuelle |
| `WF-RETAIN-NPS` | Sondages NPS | Trimestrielle |

## Structure du projet

```
automation/
├── README.md
├── agents/                          # Configurations des 12 agents AI
│   ├── orchestrator.json            # Orchestrateur central
│   ├── 01-marketing-strategist.json
│   ├── 02-content-creator.json
│   ├── 03-community-manager.json
│   ├── 04-seo-specialist.json
│   ├── 05-media-buyer.json
│   ├── 06-email-marketer.json
│   ├── 07-sales-closer.json
│   ├── 08-analytics-analyst.json
│   ├── 09-crm-manager.json
│   ├── 10-reputation-manager.json
│   ├── 11-onboarding-specialist.json
│   └── 12-retention-specialist.json
├── docs/
│   └── AGENT-ROLES.md               # Documentation detaillee des roles
├── schemas/
│   ├── supabase-schema.sql          # Schema de base (conversations, messages)
│   └── supabase-agents-schema.sql   # Schema etendu (leads, campagnes, etc.)
├── workflows/                       # Workflows n8n existants
│   ├── WF-ACTIONS-SEND.json
│   ├── WF-ACUITY-BOOK.json
│   ├── WF-CORE-BRAIN.json
│   ├── WF-INGEST-GMAIL.json
│   ├── WF-INGEST-META.json
│   └── WF-INGEST-TIKTOK.json
└── n8n-all-workflows.json
```

## Structure des donnees normalisees

```json
{
  "source": "meta|tiktok|gmail",
  "conversation_id": "unique_id",
  "sender_id": "user_identifier",
  "sender_name": "User Name",
  "message": "contenu du message",
  "timestamp": "2024-01-01T12:00:00Z",
  "metadata": {
    "platform_specific": "data"
  }
}
```

## Outputs du Brain

```json
{
  "reply_text": "Reponse a envoyer",
  "action": "send|book|handoff|none",
  "handoff": true|false,
  "stage": "new|qualified|booking|closed",
  "intent": "greeting|question|booking|complaint|other"
}
```

## Installation

1. Importer les workflows existants dans n8n
2. Configurer les credentials (Meta, TikTok, Gmail, Acuity)
3. Configurer les webhooks URLs
4. Executer `supabase-schema.sql` puis `supabase-agents-schema.sql`
5. Configurer les agents dans l'orchestrateur
6. Activer les workflows

## Variables d'environnement

### Core
- `SUPABASE_URL` - URL Supabase pour le stockage
- `SUPABASE_KEY` - Cle API Supabase
- `OPENAI_API_KEY` - Cle API OpenAI pour le brain
- `ANTHROPIC_API_KEY` - Cle API Claude pour les agents

### Plateformes sociales
- `META_ACCESS_TOKEN` - Token Meta
- `TIKTOK_ACCESS_TOKEN` - Token TikTok
- `LINKEDIN_ACCESS_TOKEN` - Token LinkedIn
- `YOUTUBE_API_KEY` - Cle API YouTube

### Publicite
- `META_ADS_ACCESS_TOKEN` - Token Meta Ads
- `GOOGLE_ADS_DEVELOPER_TOKEN` - Token Google Ads
- `TIKTOK_ADS_ACCESS_TOKEN` - Token TikTok Ads

### Email
- `ACTIVECAMPAIGN_API_KEY` - Cle API ActiveCampaign
- `ACTIVECAMPAIGN_URL` - URL ActiveCampaign

### SEO
- `AHREFS_API_KEY` - Cle API Ahrefs
- `GOOGLE_SEARCH_CONSOLE_KEY` - Cle Google Search Console

### CRM & Booking
- `HUBSPOT_API_KEY` - Cle API HubSpot
- `ACUITY_USER_ID` - ID utilisateur Acuity
- `ACUITY_API_KEY` - Cle API Acuity

### Enrichissement
- `CLEARBIT_API_KEY` - Cle API Clearbit
- `APOLLO_API_KEY` - Cle API Apollo

### Notifications
- `SLACK_WEBHOOK_URL` - Webhook Slack pour les notifications
