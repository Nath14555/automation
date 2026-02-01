# Automation Workflows

Systeme d'automatisation multi-canal pour la gestion des conversations et bookings.

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  WF-INGEST-META │    │ WF-INGEST-TIKTOK│    │ WF-INGEST-GMAIL │
│   (Webhook)     │    │   (Webhook)     │    │  (Gmail Trigger)│
└────────┬────────┘    └────────┬────────┘    └────────┬────────┘
         │                      │                      │
         │    Normalize         │    Normalize         │    Normalize
         │                      │                      │
         └──────────────────────┼──────────────────────┘
                                │
                                ▼
                    ┌───────────────────────┐
                    │    WF-CORE-BRAIN      │
                    │  - Anti-doublon       │
                    │  - Gestion d'état     │
                    │  - Intentions         │
                    │  - Choix variante     │
                    │  - Garde-fous         │
                    └───────────┬───────────┘
                                │
              ┌─────────────────┼─────────────────┐
              │                 │                 │
              ▼                 ▼                 ▼
    ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
    │ WF-ACTIONS-SEND │ │ WF-ACUITY-BOOK  │ │    Handoff      │
    │  - Wait random  │ │  - Booking      │ │   (humain)      │
    │  - Envoi canal  │ │  - Confirmation │ │                 │
    │  - Log + stage  │ │  - Log          │ │                 │
    └─────────────────┘ └─────────────────┘ └─────────────────┘
```

## Workflows

| Workflow | Description | Trigger |
|----------|-------------|---------|
| `WF-INGEST-META` | Ingestion Meta (Facebook/Instagram) | Webhook |
| `WF-INGEST-TIKTOK` | Ingestion TikTok | Webhook |
| `WF-INGEST-GMAIL` | Ingestion Gmail | Gmail Trigger |
| `WF-CORE-BRAIN` | Cerveau central (logique commune) | Workflow Call |
| `WF-ACTIONS-SEND` | Envoi de messages | Workflow Call |
| `WF-ACUITY-BOOK` | Booking Acuity | Workflow Call |

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

1. Importer les workflows dans n8n
2. Configurer les credentials (Meta, TikTok, Gmail, Acuity)
3. Configurer les webhooks URLs
4. Activer les workflows

## Variables d'environnement

- `SUPABASE_URL` - URL Supabase pour le stockage
- `SUPABASE_KEY` - Cle API Supabase
- `OPENAI_API_KEY` - Cle API OpenAI pour le brain
- `META_ACCESS_TOKEN` - Token Meta
- `ACUITY_USER_ID` - ID utilisateur Acuity
- `ACUITY_API_KEY` - Cle API Acuity
