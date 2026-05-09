# louna-monorepo

Monorepo regroupant les agents marketing autonomes et l'infrastructure partagée.

## Projets

| Workspace | Description | Statut |
|-----------|-------------|--------|
| [`apps/louna-marketing`](./apps/louna-marketing) | Agent **marketing** Louna&Co — contenu, DM clientes, courriels, rapports | 🚧 Sprint 1 |
| [`apps/louna-bizdev`](./apps/louna-bizdev) | Agent **développement d'affaires** Louna&Co — prospection partenaires Social Club | 🌱 Sprint 1 (skeleton + BRIEF) |
| [`packages/shared`](./packages/shared) | Code transversal (logger, errors, wrappers) | Skeleton |

## Infrastructure partagée (au niveau du repo)

Une seule stack Docker héberge n8n + Postgres + Qdrant + Redis + Nginx pour **tous les agents**. Chacun est un dossier de workflows et de code dans `apps/`.

```
automation/
├── docker-compose.yml          ← stack commune (n8n, Postgres, Redis, Qdrant, Nginx)
├── nginx/                      ← reverse proxy
├── scripts/                    ← setup VPS, deploy, backup
├── docs/                       ← architecture, deployment, runbook, ADR
├── packages/
│   └── shared/                 ← code transversal
└── apps/
    ├── louna-marketing/        ← agent marketing (contenu, DM, courriels)
    └── louna-bizdev/           ← agent dev d'affaires (partenariats Social Club)
```

Conventions de nommage des workflows n8n : `MKT_*` pour marketing, `BIZ_*` pour bizdev.
HubSpot CRM unique, segmenté par type d'objet (`client_contact` vs `partner_contact`).
Voir [`docs/decisions.md` ADR-0006](./docs/decisions.md) pour le détail du split.

## Stack technique

| Couche | Technologie |
|--------|-------------|
| Orchestration | n8n self-hosted (Hostinger KVM 2, Ubuntu 24.04) |
| Persistance | PostgreSQL 16 |
| Queue | Redis 7 |
| Vector DB | Qdrant self-hosted |
| LLM | Anthropic Claude (Opus 4.7 + Haiku 4.5) |
| Reverse proxy | Nginx + Let's Encrypt |
| Code custom | Node.js 20 LTS + TypeScript strict, npm workspaces |

## Démarrage rapide

> Pré-requis : Node.js 20 LTS, npm 10+, Docker + Docker Compose.

```bash
# Une seule install pour tout le monorepo
npm install

# Lint + typecheck sur tout le monorepo
npm run lint
npm run typecheck

# Tests sur tous les workspaces
npm test

# Health check de l'agent Louna
npm run health-check

# Stack Docker partagée
docker compose up -d
```

## Conventions

- **Workspaces npm** : un workspace par app (`apps/*`) et par package partagé (`packages/*`).
- **Imports cross-package** : `@louna/shared` depuis n'importe quel workspace.
- **Imports app-internes** : alias `@/agent/*`, `@/tools/*`, etc. (configurés par tsconfig.json par app).
- **Commits** : Conventional Commits (`feat(louna-agent):`, `fix(shared):`, `docs:`, etc.).
- **Branches** : `feat/*`, `fix/*`, `chore/*`.
- **TypeScript strict** + ESLint + Prettier appliqués via Husky pre-commit (à la racine, sur tous les workspaces).

## Ajouter un nouveau projet

1. `mkdir apps/mon-projet`
2. Copie `apps/louna-agent/package.json` et adapte le `name`.
3. Copie `apps/louna-agent/tsconfig.json` (déjà configuré pour étendre la base).
4. Crée la structure `src/`, `tests/`, etc.
5. `npm install` à la racine — npm linkera automatiquement le nouveau workspace.

## Documentation

- [`apps/louna-agent/BRIEF.md`](./apps/louna-agent/BRIEF.md) — spécification de l'agent Louna
- [`docs/architecture.md`](./docs/architecture.md) — architecture infrastructure partagée
- [`docs/deployment.md`](./docs/deployment.md) — procédure de déploiement
- [`docs/runbook.md`](./docs/runbook.md) — procédures d'incident
- [`docs/api-keys.md`](./docs/api-keys.md) — gestion des clés API
- [`docs/decisions.md`](./docs/decisions.md) — Architecture Decision Records

## Licence

Propriétaire — Louna&Co. Tous droits réservés.
