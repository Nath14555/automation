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
