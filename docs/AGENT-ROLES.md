# Agents AI - Agence de Marketing Automatisee

## Vue d'ensemble

Architecture complete des agents AI pour une agence de marketing, de la prospection a la fidelisation.

```
┌─────────────────────────────────────────────────────────────────────┐
│                    AGENCE DE MARKETING AI                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌───────────┐       │
│  │ STRATEGE  │  │ CONTENT   │  │ COMMUNITY │  │ SEO       │       │
│  │ MARKETING │→ │ CREATOR   │→ │ MANAGER   │→ │ SPECIALIST│       │
│  └─────┬─────┘  └─────┬─────┘  └─────┬─────┘  └─────┬─────┘       │
│        │               │               │               │            │
│  ┌─────▼─────┐  ┌─────▼─────┐  ┌─────▼─────┐  ┌─────▼─────┐       │
│  │ MEDIA     │  │ EMAIL     │  │ SALES     │  │ ANALYTICS │       │
│  │ BUYER     │  │ MARKETER  │  │ CLOSER    │  │ ANALYST   │       │
│  └─────┬─────┘  └─────┬─────┘  └─────┬─────┘  └─────┬─────┘       │
│        │               │               │               │            │
│  ┌─────▼─────┐  ┌─────▼─────┐  ┌─────▼─────┐  ┌─────▼─────┐       │
│  │ CRM       │  │ REPUTATION│  │ ONBOARDING│  │ RETENTION │       │
│  │ MANAGER   │  │ MANAGER   │  │ SPECIALIST│  │ SPECIALIST│       │
│  └───────────┘  └───────────┘  └───────────┘  └───────────┘       │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 1. STRATEGE MARKETING (AI Marketing Strategist)

**Role:** Cerveau strategique de l'agence. Analyse le marche, definit les objectifs et coordonne les autres agents.

### Taches automatisees

| Tache | Description | Frequence | Outils |
|-------|-------------|-----------|--------|
| Analyse concurrentielle | Scraper et analyser les strategies des concurrents | Hebdomadaire | Apify, Browse AI, Claude |
| Recherche de tendances | Identifier les tendances du marche et les opportunites | Quotidienne | Google Trends API, Social Listening |
| Definition des personas | Creer/mettre a jour les profils d'audience cible | Mensuelle | CRM Data, Analytics, Claude |
| Planification de campagne | Generer un plan de campagne avec budget et KPIs | Mensuelle | Google Sheets, Claude |
| Brief creatif | Produire des briefs detailles pour le Content Creator | Par campagne | Notion/Docs, Claude |
| Rapport strategique | Synthetiser les performances et recommandations | Hebdomadaire | Analytics, Claude |

### Workflows n8n

- `WF-STRATEGY-TRENDS` - Veille tendances automatique
- `WF-STRATEGY-COMPETITOR` - Analyse concurrentielle
- `WF-STRATEGY-BRIEF` - Generation de briefs

### Inputs/Outputs

```json
{
  "input": {
    "market_data": "donnees marche/industrie",
    "competitor_urls": ["url1", "url2"],
    "business_goals": "objectifs du client",
    "budget": 5000
  },
  "output": {
    "campaign_plan": {
      "objectives": ["obj1", "obj2"],
      "channels": ["meta", "tiktok", "email"],
      "budget_allocation": {},
      "timeline": {},
      "kpis": {}
    },
    "creative_brief": {},
    "competitor_analysis": {}
  }
}
```

---

## 2. CONTENT CREATOR (AI Content Creator)

**Role:** Cree tout le contenu textuel et visuel. Redige, adapte et optimise le contenu pour chaque canal.

### Taches automatisees

| Tache | Description | Frequence | Outils |
|-------|-------------|-----------|--------|
| Redaction posts reseaux sociaux | Generer des posts adaptes a chaque plateforme | Quotidienne | Claude, Buffer/Hootsuite API |
| Creation de captions | Ecrire des legendes engageantes pour les visuels | Par besoin | Claude |
| Redaction articles de blog | Produire des articles SEO-optimises | Hebdomadaire | Claude, WordPress API |
| Scripts video | Ecrire des scripts pour Reels/TikTok/YouTube | Hebdomadaire | Claude |
| Adaptation multi-plateforme | Adapter un contenu pour differentes plateformes | Par contenu | Claude |
| Generation de visuels | Creer des visuels avec prompts IA | Par besoin | DALL-E/Midjourney API, Canva API |
| Calendrier editorial | Planifier et organiser le contenu a publier | Hebdomadaire | Google Sheets, Notion API |
| A/B copy variants | Generer des variantes de textes pour tests | Par campagne | Claude |

### Workflows n8n

- `WF-CONTENT-SOCIAL` - Generation et publication posts sociaux
- `WF-CONTENT-BLOG` - Creation et publication articles
- `WF-CONTENT-VIDEO-SCRIPT` - Scripts video automatises
- `WF-CONTENT-VISUAL` - Generation de visuels
- `WF-CONTENT-CALENDAR` - Gestion calendrier editorial

### Inputs/Outputs

```json
{
  "input": {
    "brief": "brief creatif du stratege",
    "brand_voice": "ton et style de la marque",
    "platform": "meta|tiktok|linkedin|blog",
    "content_type": "post|article|script|caption",
    "keywords": ["mot1", "mot2"],
    "visual_style": "style visuel souhaite"
  },
  "output": {
    "content": "contenu genere",
    "variants": ["variante_a", "variante_b"],
    "hashtags": ["#tag1", "#tag2"],
    "visual_prompt": "prompt pour generation visuelle",
    "visual_url": "url du visuel genere",
    "scheduled_at": "2026-03-20T10:00:00Z"
  }
}
```

---

## 3. COMMUNITY MANAGER (AI Community Manager)

**Role:** Gere les interactions sur les reseaux sociaux. Repond aux commentaires, DMs, et maintient l'engagement.

### Taches automatisees

| Tache | Description | Frequence | Outils |
|-------|-------------|-----------|--------|
| Reponse aux DMs | Repondre aux messages prives sur toutes les plateformes | Temps reel | Meta API, TikTok API, Claude |
| Reponse aux commentaires | Repondre aux commentaires sur les posts | Temps reel | Meta API, YouTube API, Claude |
| Moderation | Filtrer et supprimer les commentaires inappropries | Temps reel | Claude, Platform APIs |
| Engagement proactif | Liker/commenter sur des posts pertinents de l'industrie | Quotidienne | Platform APIs, Claude |
| Gestion de crise | Detecter et escalader les commentaires negatifs | Temps reel | Sentiment Analysis, Claude |
| Rapport d'engagement | Synthetiser les metriques d'engagement | Quotidienne | Platform APIs |
| Publication programmee | Publier le contenu selon le calendrier | Programmee | Buffer/Hootsuite API |

### Workflows n8n (existants + nouveaux)

- `WF-INGEST-META` - *(existant)* Ingestion Meta
- `WF-INGEST-TIKTOK` - *(existant)* Ingestion TikTok
- `WF-INGEST-GMAIL` - *(existant)* Ingestion Gmail
- `WF-CORE-BRAIN` - *(existant)* Cerveau central
- `WF-COMMUNITY-COMMENTS` - Gestion des commentaires
- `WF-COMMUNITY-ENGAGE` - Engagement proactif
- `WF-COMMUNITY-MODERATE` - Moderation automatique
- `WF-COMMUNITY-PUBLISH` - Publication programmee

### Inputs/Outputs

```json
{
  "input": {
    "source": "meta|tiktok|gmail|linkedin|youtube",
    "interaction_type": "dm|comment|mention|review",
    "content": "message recu",
    "sender_info": {},
    "sentiment": "positive|neutral|negative",
    "conversation_history": []
  },
  "output": {
    "reply": "reponse generee",
    "action": "reply|escalate|moderate|ignore",
    "sentiment_score": 0.85,
    "escalation_reason": null,
    "engagement_metrics": {}
  }
}
```

---

## 4. SEO SPECIALIST (AI SEO Specialist)

**Role:** Optimise la presence en ligne pour les moteurs de recherche. Analyse, recommande et implemente les ameliorations SEO.

### Taches automatisees

| Tache | Description | Frequence | Outils |
|-------|-------------|-----------|--------|
| Audit SEO technique | Scanner le site pour les problemes techniques | Hebdomadaire | Screaming Frog API, Lighthouse |
| Recherche de mots-cles | Identifier les mots-cles pertinents et opportunites | Hebdomadaire | Ahrefs/SEMrush API, Claude |
| Optimisation on-page | Suggerer des ameliorations de meta tags, structure | Par page | Claude, WordPress API |
| Suivi des positions | Tracker les positions sur les mots-cles cibles | Quotidienne | Ahrefs/SEMrush API |
| Analyse des backlinks | Surveiller et analyser le profil de liens | Hebdomadaire | Ahrefs API |
| Optimisation du contenu | Analyser et optimiser le contenu existant | Hebdomadaire | Claude, Surfer SEO API |
| Rapport SEO | Generer un rapport de performance SEO | Hebdomadaire | Google Search Console API |
| Schema markup | Generer le balisage schema.org structure | Par page | Claude |

### Workflows n8n

- `WF-SEO-AUDIT` - Audit technique automatise
- `WF-SEO-KEYWORDS` - Recherche de mots-cles
- `WF-SEO-TRACKING` - Suivi des positions
- `WF-SEO-CONTENT` - Optimisation du contenu
- `WF-SEO-REPORT` - Rapports automatises

### Inputs/Outputs

```json
{
  "input": {
    "website_url": "https://example.com",
    "target_keywords": ["mot1", "mot2"],
    "competitors": ["concurrent1.com"],
    "page_url": "url a optimiser"
  },
  "output": {
    "audit_results": {
      "score": 85,
      "issues": [],
      "recommendations": []
    },
    "keyword_opportunities": [],
    "position_changes": [],
    "optimized_meta": {
      "title": "",
      "description": "",
      "h1": ""
    }
  }
}
```

---

## 5. MEDIA BUYER (AI Media Buyer)

**Role:** Gere les campagnes publicitaires payantes. Optimise les budgets, cree les audiences et ajuste les encheres.

### Taches automatisees

| Tache | Description | Frequence | Outils |
|-------|-------------|-----------|--------|
| Creation de campagnes | Configurer les campagnes publicitaires | Par campagne | Meta Ads API, Google Ads API, TikTok Ads API |
| Optimisation des encheres | Ajuster les encheres selon les performances | Quotidienne | Ads APIs, Claude |
| Gestion des audiences | Creer et optimiser les audiences cibles | Hebdomadaire | Ads APIs, CRM Data |
| Allocation budgetaire | Redistribuer le budget vers les campagnes performantes | Quotidienne | Ads APIs, Claude |
| A/B testing | Lancer et analyser des tests A/B sur les ads | Continue | Ads APIs |
| Detection d'anomalies | Alerter sur les depenses anormales ou baisses de perf | Temps reel | Ads APIs, Claude |
| Rapport publicitaire | Generer les rapports de performance ads | Quotidienne | Ads APIs, Google Sheets |
| Retargeting | Configurer les audiences de retargeting | Hebdomadaire | Ads APIs, Pixel Data |

### Workflows n8n

- `WF-ADS-CREATE` - Creation de campagnes
- `WF-ADS-OPTIMIZE` - Optimisation automatique
- `WF-ADS-BUDGET` - Gestion budgetaire
- `WF-ADS-REPORT` - Rapports publicitaires
- `WF-ADS-ALERT` - Alertes de performance

### Inputs/Outputs

```json
{
  "input": {
    "campaign_brief": "objectifs de la campagne",
    "budget": 1000,
    "platforms": ["meta", "google", "tiktok"],
    "audience_criteria": {},
    "creatives": [],
    "duration": "7d"
  },
  "output": {
    "campaign_ids": {},
    "performance": {
      "spend": 500,
      "impressions": 50000,
      "clicks": 2500,
      "conversions": 50,
      "cpa": 10,
      "roas": 3.5
    },
    "optimizations_applied": [],
    "alerts": []
  }
}
```

---

## 6. EMAIL MARKETER (AI Email Marketer)

**Role:** Gere l'ensemble de la strategie email: sequences, newsletters, segmentation et optimisation.

### Taches automatisees

| Tache | Description | Frequence | Outils |
|-------|-------------|-----------|--------|
| Redaction d'emails | Ecrire des emails de vente, nurturing, newsletters | Par campagne | Claude |
| Sequences automatisees | Creer des sequences d'emails automatisees (drip) | Par funnel | Mailchimp/ActiveCampaign API |
| Segmentation | Segmenter les listes selon le comportement | Quotidienne | CRM API, Claude |
| A/B testing | Tester les sujets, contenu et heures d'envoi | Par campagne | Email Platform API |
| Nettoyage de liste | Identifier et supprimer les emails inactifs | Mensuelle | Email Platform API |
| Personnalisation | Adapter le contenu selon le segment | Par envoi | Claude, Email Platform API |
| Rapport email | Analyser les taux d'ouverture, clics, conversions | Hebdomadaire | Email Platform API |
| Reengagement | Creer des campagnes pour reactiver les inactifs | Mensuelle | Email Platform API, Claude |

### Workflows n8n

- `WF-EMAIL-SEQUENCE` - Creation de sequences
- `WF-EMAIL-NEWSLETTER` - Newsletter automatisee
- `WF-EMAIL-SEGMENT` - Segmentation automatique
- `WF-EMAIL-AB-TEST` - Tests A/B
- `WF-EMAIL-REPORT` - Rapports email
- `WF-EMAIL-CLEANUP` - Nettoyage de liste

### Inputs/Outputs

```json
{
  "input": {
    "campaign_type": "sequence|newsletter|reengagement",
    "segment": "new_leads|customers|inactive",
    "subject_line": "objet de l'email",
    "content_brief": "description du contenu",
    "cta": "action souhaitee",
    "personalization_fields": ["prenom", "entreprise"]
  },
  "output": {
    "email_html": "contenu HTML genere",
    "subject_variants": ["sujet_a", "sujet_b"],
    "send_time": "2026-03-20T09:00:00Z",
    "segment_size": 2500,
    "metrics": {
      "open_rate": 0.32,
      "click_rate": 0.08,
      "conversion_rate": 0.02
    }
  }
}
```

---

## 7. SALES CLOSER (AI Sales Closer)

**Role:** Convertit les prospects qualifies en clients. Gere le processus de vente du premier contact a la signature.

### Taches automatisees

| Tache | Description | Frequence | Outils |
|-------|-------------|-----------|--------|
| Qualification des leads | Scorer et qualifier les leads entrants | Temps reel | CRM, Claude |
| Suivi automatique | Envoyer des follow-ups aux prospects | Programmee | Email/SMS API, Claude |
| Proposition commerciale | Generer des propositions personnalisees | Par lead | Claude, Google Docs API |
| Booking de calls | Planifier les appels de vente | Temps reel | Acuity/Calendly API |
| Objection handling | Preparer des reponses aux objections courantes | Par interaction | Claude |
| Pipeline management | Mettre a jour le CRM et le pipeline de vente | Temps reel | CRM API |
| Relance intelligente | Relancer les prospects au bon moment | Programmee | CRM, Claude |
| Closing scripts | Generer des scripts de closing adaptes | Par prospect | Claude |

### Workflows n8n (existants + nouveaux)

- `WF-ACUITY-BOOK` - *(existant)* Booking Acuity
- `WF-ACTIONS-SEND` - *(existant)* Envoi de messages
- `WF-SALES-QUALIFY` - Qualification automatique
- `WF-SALES-FOLLOWUP` - Sequences de suivi
- `WF-SALES-PROPOSAL` - Generation de propositions
- `WF-SALES-PIPELINE` - Gestion du pipeline

### Inputs/Outputs

```json
{
  "input": {
    "lead": {
      "name": "John Doe",
      "email": "john@example.com",
      "source": "meta_ad",
      "interest": "service demande",
      "budget_range": "1000-5000"
    },
    "conversation_history": [],
    "pipeline_stage": "new|contacted|qualified|proposal|negotiation|closed"
  },
  "output": {
    "lead_score": 85,
    "qualification": "hot|warm|cold",
    "next_action": "send_proposal|schedule_call|follow_up|nurture",
    "proposal": {},
    "follow_up_message": "",
    "follow_up_date": "2026-03-18T10:00:00Z"
  }
}
```

---

## 8. ANALYTICS ANALYST (AI Analytics Analyst)

**Role:** Collecte, analyse et interprete toutes les donnees marketing. Produit des insights actionnables.

### Taches automatisees

| Tache | Description | Frequence | Outils |
|-------|-------------|-----------|--------|
| Collecte de donnees | Agreger les donnees de toutes les sources | Quotidienne | APIs multiples, Supabase |
| Dashboard automatise | Mettre a jour les dashboards de performance | Temps reel | Google Data Studio, Metabase |
| Rapports de performance | Generer des rapports detailles | Hebdomadaire/Mensuelle | Claude, Google Sheets |
| Attribution | Analyser l'attribution multi-canal | Quotidienne | GA4 API, UTM Data |
| Prediction de tendances | Predire les performances futures | Hebdomadaire | Claude, Data historiques |
| Alertes KPI | Alerter quand un KPI depasse un seuil | Temps reel | Supabase, Slack API |
| ROI par canal | Calculer le ROI de chaque canal marketing | Hebdomadaire | Multi-source data |
| Cohort analysis | Analyser les cohortes de clients | Mensuelle | CRM Data, Claude |

### Workflows n8n

- `WF-ANALYTICS-COLLECT` - Collecte multi-source
- `WF-ANALYTICS-DASHBOARD` - Mise a jour dashboards
- `WF-ANALYTICS-REPORT` - Rapports automatises
- `WF-ANALYTICS-ALERT` - Alertes KPI
- `WF-ANALYTICS-ATTRIBUTION` - Attribution multi-canal

### Inputs/Outputs

```json
{
  "input": {
    "date_range": {"start": "2026-03-01", "end": "2026-03-15"},
    "channels": ["meta", "google", "email", "organic"],
    "metrics": ["revenue", "leads", "cost", "conversions"],
    "granularity": "daily|weekly|monthly"
  },
  "output": {
    "summary": {
      "total_revenue": 50000,
      "total_leads": 500,
      "total_cost": 10000,
      "overall_roas": 5.0
    },
    "channel_breakdown": {},
    "trends": [],
    "anomalies": [],
    "recommendations": [],
    "forecast": {}
  }
}
```

---

## 9. CRM MANAGER (AI CRM Manager)

**Role:** Gere la base de donnees clients, l'hygiene des donnees et l'automatisation CRM.

### Taches automatisees

| Tache | Description | Frequence | Outils |
|-------|-------------|-----------|--------|
| Enrichissement de leads | Enrichir les profils avec des donnees externes | Par nouveau lead | Clearbit/Apollo API, Claude |
| Deduplication | Identifier et fusionner les doublons | Quotidienne | CRM API, Claude |
| Scoring automatique | Attribuer un score aux leads selon l'activite | Temps reel | CRM API, Claude |
| Tagging automatique | Categoriser les contacts automatiquement | Temps reel | CRM API, Claude |
| Nettoyage des donnees | Verifier et corriger les donnees invalides | Hebdomadaire | CRM API |
| Sync multi-plateforme | Synchroniser les donnees entre les outils | Temps reel | APIs multiples |
| Lifecycle management | Gerer les transitions de stage du client | Temps reel | CRM API |
| Rapport CRM | Analyser la sante de la base de donnees | Mensuelle | CRM API, Claude |

### Workflows n8n

- `WF-CRM-ENRICH` - Enrichissement de leads
- `WF-CRM-DEDUPE` - Deduplication
- `WF-CRM-SCORE` - Lead scoring
- `WF-CRM-SYNC` - Synchronisation multi-plateforme
- `WF-CRM-CLEAN` - Nettoyage automatique

### Inputs/Outputs

```json
{
  "input": {
    "contact": {
      "email": "john@example.com",
      "name": "John Doe",
      "source": "meta_ad"
    },
    "activity": {
      "page_views": 15,
      "email_opens": 5,
      "last_interaction": "2026-03-14"
    }
  },
  "output": {
    "enriched_profile": {
      "company": "Acme Corp",
      "title": "Marketing Director",
      "linkedin": "url",
      "revenue_estimate": "1M-5M"
    },
    "lead_score": 72,
    "tags": ["b2b", "decision_maker", "high_value"],
    "lifecycle_stage": "mql",
    "duplicates_found": []
  }
}
```

---

## 10. REPUTATION MANAGER (AI Reputation Manager)

**Role:** Surveille et gere la reputation en ligne. Gere les avis, les mentions et la e-reputation.

### Taches automatisees

| Tache | Description | Frequence | Outils |
|-------|-------------|-----------|--------|
| Veille mentions | Surveiller les mentions de la marque | Temps reel | Mention/Brand24 API, Google Alerts |
| Reponse aux avis | Repondre aux avis Google, Facebook, Trustpilot | Quotidienne | Platform APIs, Claude |
| Analyse de sentiment | Analyser le sentiment global envers la marque | Quotidienne | Claude, NLP APIs |
| Demande d'avis | Solliciter des avis aupres des clients satisfaits | Post-service | Email/SMS API |
| Gestion de crise | Detecter et alerter sur les crises potentielles | Temps reel | Social Listening, Claude |
| Rapport reputation | Generer un rapport de e-reputation | Hebdomadaire | Multi-source, Claude |

### Workflows n8n

- `WF-REPUTATION-MONITOR` - Veille mentions
- `WF-REPUTATION-REVIEW` - Gestion des avis
- `WF-REPUTATION-SENTIMENT` - Analyse de sentiment
- `WF-REPUTATION-REQUEST` - Demandes d'avis
- `WF-REPUTATION-CRISIS` - Detection de crise

---

## 11. ONBOARDING SPECIALIST (AI Onboarding Specialist)

**Role:** Gere l'integration des nouveaux clients. Automatise le processus d'accueil et de mise en route.

### Taches automatisees

| Tache | Description | Frequence | Outils |
|-------|-------------|-----------|--------|
| Welcome sequence | Envoyer la sequence d'accueil personnalisee | Par nouveau client | Email API, Claude |
| Collecte d'informations | Envoyer et traiter les questionnaires d'onboarding | Par nouveau client | Typeform/Google Forms API |
| Setup de compte | Configurer les acces et outils pour le client | Par nouveau client | APIs multiples |
| Formation automatisee | Envoyer des tutoriels et guides personnalises | Par nouveau client | Email API, LMS API |
| Check-in automatique | Programmer des points de suivi | J+7, J+14, J+30 | Email/SMS API, Claude |
| Satisfaction survey | Envoyer un sondage de satisfaction | J+30 | Typeform API |

### Workflows n8n

- `WF-ONBOARD-WELCOME` - Sequence d'accueil
- `WF-ONBOARD-SETUP` - Configuration automatique
- `WF-ONBOARD-CHECKIN` - Points de suivi
- `WF-ONBOARD-SURVEY` - Sondages de satisfaction

---

## 12. RETENTION SPECIALIST (AI Retention Specialist)

**Role:** Fidelise les clients existants. Detecte les risques de churn et cree des campagnes de retention.

### Taches automatisees

| Tache | Description | Frequence | Outils |
|-------|-------------|-----------|--------|
| Detection de churn | Identifier les clients a risque de depart | Quotidienne | CRM Data, Claude |
| Campagnes de retention | Creer des offres personnalisees de retention | Par client a risque | Email API, Claude |
| Programme de fidelite | Gerer les points et recompenses | Continue | CRM API |
| Upsell/Cross-sell | Identifier les opportunites de vente additionnelle | Hebdomadaire | CRM Data, Claude |
| Anniversary campaigns | Envoyer des messages aux dates cles | Programmee | Email/SMS API |
| NPS surveys | Envoyer et analyser les sondages NPS | Trimestrielle | Typeform API, Claude |
| Win-back campaigns | Reactiver les anciens clients | Mensuelle | Email API, Claude |
| Client health score | Calculer un score de sante client | Quotidienne | CRM Data, Claude |

### Workflows n8n

- `WF-RETAIN-CHURN` - Detection de churn
- `WF-RETAIN-CAMPAIGN` - Campagnes de retention
- `WF-RETAIN-UPSELL` - Upsell automatise
- `WF-RETAIN-WINBACK` - Win-back campaigns
- `WF-RETAIN-NPS` - Sondages NPS

---

## Flux de donnees entre agents

```
                    ┌─────────────┐
                    │  STRATEGE   │
                    │  MARKETING  │
                    └──────┬──────┘
                           │ Brief & Strategy
              ┌────────────┼────────────┐
              ▼            ▼            ▼
       ┌──────────┐ ┌──────────┐ ┌──────────┐
       │ CONTENT  │ │  MEDIA   │ │   SEO    │
       │ CREATOR  │ │  BUYER   │ │SPECIALIST│
       └────┬─────┘ └────┬─────┘ └────┬─────┘
            │             │             │
            ▼             ▼             ▼
       ┌──────────┐ ┌──────────┐ ┌──────────┐
       │COMMUNITY │ │  EMAIL   │ │ANALYTICS │
       │ MANAGER  │ │ MARKETER │ │ ANALYST  │
       └────┬─────┘ └────┬─────┘ └────┬─────┘
            │             │             │
            └─────────────┼─────────────┘
                          ▼
                   ┌──────────────┐
                   │ SALES CLOSER │
                   └──────┬───────┘
                          │
              ┌───────────┼───────────┐
              ▼           ▼           ▼
       ┌──────────┐ ┌──────────┐ ┌──────────┐
       │   CRM    │ │ONBOARDING│ │REPUTATION│
       │ MANAGER  │ │SPECIALIST│ │ MANAGER  │
       └──────────┘ └────┬─────┘ └──────────┘
                         ▼
                  ┌──────────────┐
                  │  RETENTION   │
                  │ SPECIALIST   │
                  └──────────────┘
```

## Stack technologique recommande

| Categorie | Outil | Usage |
|-----------|-------|-------|
| Orchestration | **n8n** | Workflows et automatisation |
| AI/LLM | **Claude API** | Generation de contenu, analyse, decisions |
| Base de donnees | **Supabase** | Stockage des donnees et API |
| CRM | **HubSpot/GoHighLevel** | Gestion des contacts et pipeline |
| Email | **ActiveCampaign/Mailchimp** | Email marketing |
| Social Media | **Meta API, TikTok API** | Gestion reseaux sociaux |
| Ads | **Meta Ads, Google Ads, TikTok Ads** | Publicite payante |
| SEO | **Ahrefs/SEMrush API** | Analyse SEO |
| Analytics | **GA4, Google Data Studio** | Analyse et dashboards |
| Scheduling | **Acuity/Calendly** | Prise de rendez-vous |
| Communication | **Slack/Discord** | Notifications internes |
| Storage | **Google Drive/Notion** | Documents et assets |
