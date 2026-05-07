# louna-agent

Agent marketing autonome pour **Louna&Co** — studio Pilates Mat & hub bien-être féminin (Marché Central, Ahuntsic-Cartierville, Montréal).

> **Bouge. Connecte. Deviens.**

## Vue d'ensemble

Système d'agent marketing capable de gérer la majorité des tâches marketing quotidiennes (création de contenu, publication multi-plateformes, réponses aux DM, séquences courriel, rapports analytiques) avec une supervision humaine d'environ 1 h/semaine.

- **Bilingue** : FR-QC prioritaire, EN-MTL secondaire
- **Conforme** : Loi 25 du Québec (renseignements personnels)
- **Architecture** : 6 couches (déclencheurs → orchestrateur n8n → cerveau Claude → base de connaissances Qdrant → outils MCP/API → garde-fous)

Voir [`BRIEF.md`](./BRIEF.md) pour la spécification complète.

## Stack

| Couche | Technologie |
|--------|-------------|
| Orchestration | n8n self-hosted (Hetzner CCX13, Ubuntu 24.04) |
| Persistance | PostgreSQL 16 |
| Queue | Redis 7 |
| Vector DB | Qdrant self-hosted |
| LLM | Anthropic Claude (Opus 4.7 + Haiku 4.5) |
| Reverse proxy | Nginx + Let's Encrypt |
| Code custom | Node.js 20 LTS + TypeScript strict |
| CI/CD | GitHub Actions |

## Structure

```
louna-agent/
├── docs/                # Architecture, deployment, runbook, ADR
├── n8n-workflows/       # Exports JSON versionnés
├── prompts/             # Prompt système et sous-prompts
├── knowledge-base/      # Source pour Qdrant (7 catégories)
├── scripts/             # setup.sh, deploy.sh, backup.sh, seed, health-check
├── src/                 # Code TypeScript custom
│   ├── agent/           # Decision engine, tool registry, guardrails
│   ├── tools/           # Wrappers API (Blotato, ManyChat, Brevo, HubSpot, Analytics, Image gen)
│   ├── knowledge/       # Vector store, embedder, RAG retriever
│   ├── monitoring/      # Crisis detector, budget tracker, escalation
│   └── utils/           # Logger, config, errors
└── tests/               # Vitest (unit + integration)
```

## Développement

> Pré-requis : Node.js 20 LTS, npm 10+, Docker + Docker Compose.

```bash
# Installation des dépendances
npm install

# Lint + typecheck
npm run lint
npm run typecheck

# Tests
npm test

# Stack Docker (n8n + Postgres + Redis + Qdrant + Nginx)
docker compose up -d
```

## État du projet

🚧 **Sprint 1 — Bootstrap** (en cours). Voir [`docs/sprint-01-report.md`](./docs/sprint-01-report.md) une fois publié.

## Conventions

- **Commits** : Conventional Commits (`feat:`, `fix:`, `docs:`, `chore:`, `refactor:`, `test:`)
- **Branches** : `feat/*`, `fix/*`, `chore/*`
- **TypeScript strict** + ESLint + Prettier appliqués via Husky pre-commit
- **Sécurité** : aucun secret en clair dans le repo, tout passe par `.env` validé via `zod`

## Licence

Propriétaire — Louna&Co. Tous droits réservés.
