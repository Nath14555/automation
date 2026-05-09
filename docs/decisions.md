# Architecture Decision Records (ADR)

Toute décision technique non triviale est consignée ici, par ordre chronologique.
Format : ID · Date · Statut · Contexte · Décision · Conséquences.

---

## ADR-0001 — Wipe & rebuild du dépôt

- **Date** : 2026-05-07
- **Statut** : Accepté
- **Contexte** : Le dépôt `nath14555/automation` contenait un système préexistant de gestion de conversations multi-canal (workflows n8n Meta/TikTok/Gmail, booking Acuity, persistance Supabase, brain OpenAI). Le BRIEF Louna&Co exige une stack différente : Anthropic Claude, Postgres self-hosted, Qdrant, ManyChat/Brevo/HubSpot/Blotato.
- **Décision** : Effacer entièrement l'existant (fichiers + historique git) et reconstruire à partir de zéro selon le BRIEF. Décision validée par Lou.
- **Conséquences** :
  - Aucune dépendance ou compatibilité à conserver avec l'ancien système.
  - Force-push sur `claude/louna-agent-setup-Q8llh` requis pour synchroniser la remote.
  - L'ancien historique reste consultable via les sauvegardes locales/forks éventuels mais n'est plus dans le repo.

## ADR-0002 — Acuity retiré du périmètre

- **Date** : 2026-05-07
- **Statut** : Accepté
- **Contexte** : Le BRIEF mentionnait une « plateforme de réservation » sans la nommer. L'existant utilisait Acuity. Lou a confirmé qu'Acuity n'est plus utilisé.
- **Décision** : Aucun outil dédié à Acuity. La réservation se fera directement sur le site Louna&Co (probablement via plugin WordPress, à confirmer).
- **Conséquences** :
  - Pas de wrapper Acuity dans `src/tools/`.
  - Le webhook « plateforme de réservation » de la couche 1 ciblera l'événement de réservation WordPress (Webhook REST ou plugin Webhooks) — à finaliser en Phase 2.
  - Pas bloquant pour Sprint 1.

## ADR-0003 — TypeScript strict + ESLint flat config + Prettier + Husky

- **Date** : 2026-05-07
- **Statut** : Accepté
- **Contexte** : BRIEF section 7 exige TypeScript strict, Conventional Commits, hooks pre-commit.
- **Décision** :
  - `tsconfig.json` avec toutes les options strict activées (`strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, etc.).
  - ESLint v9 en flat config (`eslint.config.js`) avec `typescript-eslint` strict + stylistic.
  - Prettier comme single source of truth pour le formatage.
  - Husky v9 + lint-staged + commitlint pour appliquer les règles avant chaque commit.
- **Conséquences** :
  - Build legèrement plus strict ⇒ moins de bugs en runtime.
  - Toute contribution future doit passer ces gates.
  - Premier `npm install` requis avant que les hooks soient actifs (la commande `prepare` les configure).

## ADR-0004 — Domaine `louna-co.com`

- **Date** : 2026-05-07
- **Statut** : Accepté
- **Contexte** : Le BRIEF mentionnait `louna-co.ca` à titre d'exemple. Lou a confirmé que Louna&Co possède déjà `louna-co.com`.
- **Décision** : Utiliser `louna-co.com` comme domaine principal. Sous-domaine prévu `n8n.louna-co.com` pour l'orchestrateur, `agent.louna-co.com` réservé pour le futur tableau de bord (Phase 2).
- **Conséquences** :
  - DNS A records à pointer vers l'IP du VPS Hetzner (Jour 3).
  - Certificats Let's Encrypt à émettre pour `n8n.louna-co.com` (et plus tard `agent.louna-co.com`).
  - Le site marketing principal `louna-co.com` reste sous WordPress (à confirmer avec Lou — on n'y touche pas dans Sprint 1).

## ADR-0005 — Passage en monorepo (npm workspaces)

- **Date** : 2026-05-07
- **Statut** : Accepté
- **Contexte** : Lou prévoit un deuxième agent (autre automatisation) qui pourrait partager de l'infrastructure (n8n, Postgres, Qdrant) et du code (wrappers Anthropic, helpers n8n, logger, errors) avec `louna-agent`. Garder un seul repo facilite le déploiement, l'observabilité et le partage de code.
- **Décision** :
  - Convertir le repo en **monorepo npm workspaces** (built-in, pas de tooling supplémentaire type Turborepo/Nx pour l'instant).
  - Structure : `apps/*` pour les agents, `packages/*` pour le code partagé.
  - L'infrastructure Docker (`docker-compose.yml`, `nginx/`, `scripts/setup.sh|deploy.sh|backup.sh`) reste à la racine — un seul VPS héberge la stack pour tous les agents.
  - `tsconfig.base.json` à la racine, étendu par chaque workspace.
  - ESLint + Prettier + Husky + commitlint restent à la racine et s'appliquent à tous les workspaces.
- **Conséquences** :
  - `apps/louna-agent/` contient le code, les prompts, la knowledge base, les workflows n8n et le BRIEF de l'agent Louna.
  - `packages/shared/` est un skeleton pour l'instant (export {}). Sera peuplé quand le 2e agent émergera et qu'on identifiera le code à factoriser (probablement : Anthropic wrapper, logger, errors, n8n helpers).
  - Le 2e agent se créera comme `apps/<nom>/` avec son propre `package.json` et `tsconfig.json` étendant la base.
  - Tous les agents partagent la même instance n8n (donc même domaine `n8n.louna-co.com`) ; on les distingue via les conventions de nommage des workflows (préfixe par projet : `LOUNA_TRG_*` vs `<AUTRE>_TRG_*`).
  - Refactor opéré pendant Sprint 1, avant que du code applicatif n'existe — coût de migration minimal.

## ADR-0006 — Split marketing / business development en deux agents

- **Date** : 2026-05-09
- **Statut** : Accepté
- **Contexte** : Lou a confirmé que le 2e agent qu'elle voulait ajouter au monorepo est l'**agent développement d'affaires** (prospection partenaires Social Club), distinct de l'agent marketing (contenu, DM clientes, courriels). Le document produit qu'elle a fourni couvre les deux périmètres mais c'est elle qui veut explicitement deux agents séparés.
- **Décision** :
  - Renommer `apps/louna-agent/` → `apps/louna-marketing/` (package `@louna/marketing`).
  - Créer `apps/louna-bizdev/` (package `@louna/bizdev`) avec la même structure squelette.
  - Frontière fonctionnelle :
    - **`louna-marketing`** = création/publication de contenu (Instagram, Facebook, Reels), réponses DM clientes, séquences Brevo (bienvenue, abandon, anniversaire, réveil), demandes d'avis, rapports marketing.
    - **`louna-bizdev`** = identification de cibles partenaires (yacht clubs, vignobles, country clubs, galeries, spas, hôtels-boutiques), engagement public progressif, transition vers DM, prise de rendez-vous Google Calendar, suivi du pipeline de partenariats, rapports bizdev.
  - **Partagé** :
    - Voix de marque (mêmes prompts de tonalité, même base brand-voice dans Qdrant).
    - Infrastructure (un seul VPS, un seul n8n, un seul Postgres, un seul Qdrant, une seule clé Anthropic).
    - HubSpot CRM unique (segmenté par type d'objet : `client_contact` vs `partner_contact`).
    - Veille contextuelle (un seul flux RSS, alerte les deux agents).
    - Code transversal dans `packages/shared/`.
  - Chaque agent a ses propres workflows n8n préfixés (`MKT_*` vs `BIZ_*`) et ses propres prompts/knowledge-base.
  - Le rapport hebdo du lundi est consolidé en un seul email (les deux agents y contribuent).
- **Conséquences** :
  - Coût d'infra inchangé (même stack pour les deux).
  - Coût Claude API peut augmenter modérément (plus d'appels) mais reste majoritairement Haiku pour le volume.
  - Possibilité de désactiver/mettre en pause un des deux agents indépendamment.
  - Plus de clarté pour Lou sur ce que chaque agent fait, et plus facile pour elle de prioriser quel agent calibrer en premier (probablement marketing avant bizdev).
  - Refactor opéré encore avant l'existence de code applicatif — toujours minimal.

> 📝 **À ajuster plus tard avec Lou** : la frontière exacte entre marketing et bizdev sur les zones grises (qui gère les DM si un partenaire potentiel répond, qui envoie l'email de relance partenaire, etc.).
