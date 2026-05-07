# BRIEF — Agent Marketing Autonome Louna&Co

> Document de référence pour Claude Code. À lire en premier avant toute action.
> Version 1.0 · Mai 2026

---

## 1. Mission du projet

Tu construis l'infrastructure technique d'un **agent marketing autonome** pour **Louna&Co**, un studio Pilates Mat et hub bien-être féminin situé au Marché Central, Ahuntsic-Cartierville (Montréal). L'agent sera capable de gérer la majorité des tâches marketing quotidiennes (création de contenu, publication multi-plateformes, réponses aux DM, séquences de courriels, rapports analytiques) avec une supervision humaine minimale d'environ une heure par semaine.

Les fondatrices sont **Lou** et **Amina Dakirellah** (avec **Nathalie** comme future co-actionnaire). La signature de marque est **« Bouge. Connecte. Deviens. »**

Le système doit être bilingue (français québécois prioritaire, anglais montréalais secondaire), conforme à la **Loi 25 du Québec** sur la protection des renseignements personnels, et conçu pour évoluer avec la croissance de l'entreprise.

---

## 2. Architecture en 6 couches

### Couche 1 — Déclencheurs

Sources d'événements qui mettent l'agent en action :

- **Cron jobs** : 6h00 (planification quotidienne), 20h00 (rapport quotidien), lundi 8h00 (rapport hebdomadaire), polling toutes les heures pour les conversations en attente.
- **Webhooks** : plateforme de réservation (nouvelle réservation, abandon, annulation), HubSpot (nouveau contact, changement de statut), Brevo (nouvelle inscription infolettre), WordPress (formulaire contact). Authentification HMAC obligatoire.
- **Polling** : commentaires Instagram (toutes les 5 min, back-off exponentiel sur erreurs).

> **Note réservation** : la réservation se fait directement sur le site de Louna&Co (probablement plugin WordPress). Acuity n'est plus utilisé. La plateforme finale sera déterminée plus tard et n'est pas bloquante pour le Sprint 1.

### Couche 2 — Orchestrateur n8n

- **n8n self-hosted** sur VPS Hetzner CCX13 (~25 CAD/mois).
- Persistance **PostgreSQL** + queue **Redis**.
- Reverse proxy **Nginx** + SSL **Let's Encrypt**.
- Convention de nommage des workflows : `TRG_*` (triggers), `EVT_*` (events), `MSG_*` (messaging), `RPT_*` (reports).
- Versioning : export JSON régulier vers dépôt Git privé.

### Couche 3 — Cerveau Claude

- **API Claude Anthropic** : Opus 4.7 pour décisions complexes, Haiku 4.5 pour tâches simples (stratégie hybride pour optimiser les coûts).
- Prompt système de ~15 000 mots à finaliser avec Lou (voir section 6).
- Function calling pour invoquer les outils.
- Budget API estimé : ~140 CAD/mois pour ~500-1500 appels.

### Couche 4 — Base de connaissances (vector DB)

- **Qdrant self-hosted** sur le même VPS (gratuit).
- 7 catégories de contenu indexées :
  1. Document de positionnement et voix de marque (chunks de ~500 mots)
  2. Description des 6 piliers de contenu avec exemples
  3. Profils des 3 clientes types
  4. Liste complète des cours (descriptions, durées, niveaux, tarifs)
  5. Calendrier événements Social Club passés et à venir
  6. Historique des 50 derniers posts avec métriques
  7. FAQ des questions fréquentes
- **RAG** systématique avant toute génération de contenu ou décision.

### Couche 5 — Boîte à outils (MCP servers + APIs)

| Outil                         | Service                  | Coût/mois (CAD) |
| ----------------------------- | ------------------------ | --------------- |
| Génération images             | DALL-E 3 ou Flux         | ~12 $           |
| Génération vidéos             | Runway Gen-3 (optionnel) | ~20 $           |
| Publication multi-plateformes | Blotato (MCP officiel)   | ~40 $           |
| Chatbot DM                    | ManyChat Pro (API)       | ~40 $           |
| Email marketing               | Brevo (API)              | ~12 $           |
| CRM                           | HubSpot (API, free tier) | 0 $             |
| Analytics                     | GA4 + Meta Marketing API | 0 $             |
| Calendrier                    | Google Calendar API      | 0 $             |
| Site web                      | WordPress.com Premium    | ~11 $           |

### Couche 6 — Garde-fous (3 niveaux)

1. **Prompt système** : règles strictes (jamais de tarifs non vérifiés, jamais de questions médicales, jamais de politique/religion, jamais de jugement corporel).
2. **Validateurs programmatiques n8n** : tonalité, budget, détection de crise (flux RSS news QC/MTL).
3. **Escalade humaine** : conversations émotionnellement complexes, clientes VIP, décisions financières >100 $, faible confiance de l'agent (<0.7).

---

## 3. Stack technique précise

```
Infrastructure
├── VPS Hetzner CCX13 (Ubuntu 24.04 LTS)
├── Docker + Docker Compose
├── Nginx (reverse proxy)
└── Let's Encrypt (SSL auto-renew)

Services dockerisés
├── n8n (latest stable)
├── PostgreSQL 16 (n8n persistence)
├── Redis 7 (n8n queue)
├── Qdrant (vector DB)
└── Watchtower (auto-update containers)

Code
├── Node.js 20 LTS (workflows custom)
├── TypeScript (typage strict)
├── Anthropic SDK (@anthropic-ai/sdk)
├── n8n Custom Nodes API (pour nodes spécifiques)
└── Vitest (tests unitaires)

Développement
├── GitHub (repo privé)
├── GitHub Actions (CI/CD)
├── Conventional Commits
└── Husky + lint-staged (pre-commit hooks)
```

---

## 4. Structure du projet

Voir [`README.md`](./README.md) pour l'arborescence à jour.

---

## 5. Plan d'implémentation en 4 phases

### Phase 1 — Fondation technique (semaines 1-3)

**Objectif** : Toute l'infrastructure installée et testée, agent pas encore actif.

**Livrables** :
1. VPS Hetzner provisionné, sécurisé (SSH par clé, firewall UFW, fail2ban).
2. Docker Compose opérationnel avec n8n + PostgreSQL + Redis + Qdrant + Nginx.
3. Domaine configuré avec SSL Let's Encrypt.
4. Tous les comptes API créés et clés stockées dans `.env` (jamais committées).
5. Repo Git privé initialisé avec structure complète.
6. CI/CD GitHub Actions de base (lint + test sur PR).
7. Workflow n8n de test bout en bout : reçoit un trigger, appelle Claude API, log le résultat (sans publier).
8. README.md complet pour permettre à un autre développeur de reprendre le projet.

**Critère de validation** : `docker-compose up` lance la stack complète sans erreur, n8n est accessible via HTTPS, le workflow de test passe.

### Phase 2 — Mode supervisé (semaines 4-6)

**Objectif** : Agent actif mais chaque action validée par Lou avant exécution.

**Livrables** :
1. Prompt système v1.0 rédigé en collaboration avec Lou.
2. Base de connaissances peuplée (7 catégories) et indexée dans Qdrant.
3. Workflows principaux activés en mode review : actions queue dans tableau de bord.
4. Tableau de bord mobile (PWA simple) : voir actions en attente, approuver/modifier/rejeter.
5. Notifications push (Pushover ou ntfy.sh) sur actions critiques.
6. Logging structuré complet.

**Critère de validation** : Lou utilise le tableau de bord pendant 2 semaines, valide ≥80% des actions proposées sans modification majeure.

### Phase 3 — Bascule autonomie progressive (semaines 7-9)

- **Semaine 7** : autonomie sur génération visuels, programmation posts, courriels transactionnels, réponses FAQ exactes, mise à jour CRM.
- **Semaine 8** : autonomie sur publication finale (avec garde-fous), réponses DM avec confidence >0.85.
- **Semaine 9** : autonomie sur séquences courriels, production rapport quotidien.

**Toujours en escalade** : conversations émotionnelles, VIP, décisions >100 $, faible confidence.

### Phase 4 — Optimisation continue (semaines 10-12)

1. Instrumentation analytics : corrélation décisions/KPIs.
2. Workflow hebdomadaire de revue automatique.
3. A/B testing intégré.
4. Versioning du prompt système avec rollback.
5. Documentation finale complète.

---

## 6. Prompt système — Sections obligatoires

Le prompt système final (~15 000 mots) doit contenir minimum ces sections (version starter dans `prompts/system-prompt.md`) :

- A. Identité
- B. Mission et valeurs
- C. Voix de marque
- D. Outils disponibles (function calling)
- E. Règles strictes (interdits absolus)
- F. Critères d'escalade humaine
- G. Processus de décision pour création contenu
- H. Processus de réponse aux DM
- I. Processus de production rapports
- J. Gestion des erreurs

---

## 7. Conventions de code

- **TypeScript strict** : `strict: true`, `noImplicitAny: true`, `strictNullChecks: true`.
- **Imports** : path aliases (`@/agent`, `@/tools`, etc.).
- **Erreurs** : classes d'erreur typées, jamais de `throw "string"`.
- **Logs** : structurés (JSON), niveaux explicites.
- **Secrets** : jamais hard-codés, toujours via `process.env` validé par `zod`.
- **Tests** : couverture minimum 70% sur le code custom.
- **Commits** : Conventional Commits.

---

## 8. Sécurité et conformité

### Loi 25 du Québec

- Consentement explicite pour collecte de données personnelles.
- Politique de confidentialité accessible et claire.
- Mécanisme de demande d'accès/suppression des données.
- Notification en cas de fuite de données dans les délais légaux.
- Hébergement préférablement au Canada ou région conforme RGPD documentée.

### Sécurité technique

- SSH par clés uniquement.
- Firewall UFW : seuls 22, 80, 443 ouverts.
- Fail2ban configuré sur SSH et n8n.
- Mises à jour de sécurité automatiques.
- Sauvegardes chiffrées quotidiennes.
- Audit trail complet.
- Rotation des clés API tous les 6 mois.

---

## 9. Premier sprint

**Sprint 1 — Bootstrap (5 jours)**

1. **Jour 1 matin** : Repo Git, structure de dossiers, README, hooks pre-commit, `.env.example`, `.gitignore`.
2. **Jour 1 après-midi** : VPS Hetzner, `setup.sh` (user, SSH, UFW, fail2ban), Docker.
3. **Jour 2** : `docker-compose.yml` complet, volumes, test local.
4. **Jour 3** : DNS, déploiement, Nginx, Let's Encrypt.
5. **Jour 4** : Comptes API, clés dans `.env`, health-check.
6. **Jour 5** : Workflow n8n bout en bout, CI/CD, rapport de fin de sprint.

**Critère** : stack lance sans erreur, n8n HTTPS, workflow de test passe. **STOP** avant Phase 2 sans validation Lou.

---

## 10. Principes directeurs

1. Construire pour la maintenance, pas pour la démo.
2. L'humain reste maître de l'autonomie.
3. L'authenticité de la marque est non-négociable.
4. Itérer petit, tester souvent.
5. Documenter au fur et à mesure (ADR dans `docs/decisions.md`).
6. Respecter le budget (escalade si dépassement >15%).

---

Bouge. Connecte. Deviens.
