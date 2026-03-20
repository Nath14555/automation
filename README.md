# Automation Workflows

Systeme d'automatisation multi-canal pour la gestion des conversations et bookings.

## Architecture

```
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────────┐
│  WF-INGEST-META │  │ WF-INGEST-TIKTOK│  │ WF-INGEST-GMAIL │  │WF-INGEST-ALIBABA │
│   (Webhook)     │  │   (Webhook)     │  │  (Gmail Trigger)│  │   (Webhook)      │
└────────┬────────┘  └────────┬────────┘  └────────┬────────┘  └────────┬─────────┘
         │                    │                    │                    │
         │  Normalize         │  Normalize         │  Normalize         │  Normalize
         │                    │                    │                    │  + Extract
         └────────────────────┼────────────────────┘                    │  Negotiation
                              │                                         │  Data
                              ▼                                         │
                  ┌───────────────────────┐                             │
                  │    WF-CORE-BRAIN      │                             │
                  │  - Anti-doublon       │                             │
                  │  - Gestion d'état     │                             │
                  │  - Intentions         │                             │
                  │  - Choix variante     │                             │
                  │  - Garde-fous         │                             │
                  └───────────┬───────────┘                             │
                              │                                         │
            ┌─────────────────┼──────────────┐                          │
            │                 │              │                          ▼
            ▼                 ▼              ▼              ┌────────────────────────┐
  ┌─────────────────┐ ┌─────────────┐ ┌──────────┐        │  WF-ALIBABA-NEGOTIATE  │
  │ WF-ACTIONS-SEND │ │WF-ACUITY-BOOK│ │ Handoff  │        │  - Strategie auto      │
  │  - Wait random  │ │ - Booking   │ │ (humain) │        │  - Contre-offre IA     │
  │  - Envoi canal  │ │ - Confirm   │ │          │        │  - Suivi prix          │
  │  - Log + stage  │ │ - Log       │ │          │        │  - Accept/Handoff      │
  └─────────────────┘ └─────────────┘ └──────────┘        └────────────────────────┘
```

## Workflows

| Workflow | Description | Trigger |
|----------|-------------|---------|
| `WF-INGEST-META` | Ingestion Meta (Facebook/Instagram) | Webhook |
| `WF-INGEST-TIKTOK` | Ingestion TikTok | Webhook |
| `WF-INGEST-GMAIL` | Ingestion Gmail | Gmail Trigger |
| `WF-INGEST-ALIBABA` | Ingestion Alibaba (vendeurs/negociation) | Webhook |
| `WF-CORE-BRAIN` | Cerveau central (logique commune) | Workflow Call |
| `WF-ALIBABA-NEGOTIATE` | Cerveau de negociation Alibaba | Workflow Call |
| `WF-ACTIONS-SEND` | Envoi de messages | Workflow Call |
| `WF-ACUITY-BOOK` | Booking Acuity | Workflow Call |

## Structure des donnees normalisees

```json
{
  "source": "meta|tiktok|gmail|alibaba",
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
  "stage": "new|qualified|booking|closed|negotiating|offer_sent|counter_offer|agreed|order_placed",
  "intent": "greeting|question|booking|complaint|other"
}
```

## Negociation Alibaba

### Flux de negociation automatique

```
Vendeur envoie message
        │
        ▼
  Extraction prix/MOQ/incoterms
        │
        ▼
  Chargement etat negociation (Supabase)
        │
        ▼
  Determination strategie
  ┌─────┼─────────────┐
  │     │             │
  ▼     ▼             ▼
Accept  Handoff    Negocier
(prix   (max       (IA genere
cible   rounds     contre-offre)
atteint) atteint)
  │     │             │
  └─────┼─────────────┘
        │
        ▼
  Sauvegarde etat + log + envoi reponse
```

### Strategies de negociation

| Phase | Strategie | Agressivite |
|-------|-----------|-------------|
| `initial_inquiry` | Questions produit, pas de prix | 0.3 |
| `first_counter` | Contre-offre -20-30%, mentionne concurrence | 0.7 |
| `negotiate` | Concessions graduelles, negocie shipping/payment | 0.5 |
| `final_push` | Volume plus grand pour meilleur prix | 0.4 |

### Donnees de negociation trackees

- Historique complet des prix (vendeur et acheteur)
- Meilleure offre recue
- MOQ, incoterms, frais de port
- Nombre de rounds de negociation
- Statut: `initial_contact` → `price_inquiry` → `first_offer` → `negotiating` → `agreed`/`stalled`

### Payload webhook Alibaba

```json
{
  "data": {
    "type": "trade_message",
    "sender_id": "seller123",
    "sender_company": "Shenzhen Electronics Co.",
    "content": "We can offer $2.50/piece for 1000 units FOB Shenzhen",
    "product_name": "USB-C Cable",
    "product_url": "https://alibaba.com/product/...",
    "price": 2.50,
    "moq": 500,
    "currency": "USD"
  }
}
```

## Installation

1. Importer les workflows dans n8n
2. Configurer les credentials (Meta, TikTok, Gmail, Acuity)
3. Configurer les webhooks URLs
4. Activer les workflows

### Bridge Alibaba (dossier `bridge/`)

3 methodes pour connecter Alibaba au webhook :

#### Methode 1 : Tampermonkey (recommande pour debuter)

1. Installer [Tampermonkey](https://www.tampermonkey.net/) dans Chrome/Firefox
2. Creer un nouveau script et coller le contenu de `bridge/alibaba-tampermonkey.user.js`
3. Ouvrir la messagerie Alibaba dans le navigateur
4. Configurer l'URL webhook dans le panneau (coin bas-droit)

#### Methode 2 : Puppeteer (autonome, tourne en arriere-plan)

```bash
cd bridge
cp .env.example .env
nano .env                    # configurer N8N_WEBHOOK_URL + credentials
npm install
HEADLESS=false npm start     # premiere fois: connexion manuelle
npm start                    # ensuite: mode headless avec cookies
```

#### Methode 3 : Email (fallback)

1. Activer les notifications email dans les parametres Alibaba
2. Configurer les acces IMAP dans `.env`

```bash
cd bridge
cp .env.example .env
nano .env                    # configurer IMAP_* + N8N_WEBHOOK_URL
npm install
npm run email-bridge
```

## Variables d'environnement

- `SUPABASE_URL` - URL Supabase pour le stockage
- `SUPABASE_KEY` - Cle API Supabase
- `OPENAI_API_KEY` - Cle API OpenAI pour le brain
- `META_ACCESS_TOKEN` - Token Meta
- `ACUITY_USER_ID` - ID utilisateur Acuity
- `ACUITY_API_KEY` - Cle API Acuity
