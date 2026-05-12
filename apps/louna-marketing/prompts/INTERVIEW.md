# Interview Lou — Calibrage du prompt système

> Liste structurée des questions ouvertes pour passer le prompt système de **v0.1 (brouillon)** à **v1.0 (production)**.
> À traiter en sessions de 15-20 minutes, dans l'ordre de priorité ci-dessous.

---

## Priorité 1 — Voix et identité (CRITIQUE)

Sans ces réponses, le prompt v1.0 ne peut pas être finalisé. À traiter en premier.

### Q1.1 — Qui parle ?

Quand l'agent répond à une cliente sur Instagram :
- Tu préfères que ça sonne comme **« on »** (l'équipe Louna&Co), comme **« Lou en personne »**, ou les deux selon le contexte ?
- Si « les deux », dans quels cas l'agent peut-il signer « Lou » personnellement ?

### Q1.2 — Comment l'agent signe les courriels ?

Pour la **séquence de bienvenue** : signature « Lou & Mimi » ou « L'équipe Louna&Co » ?
Pour les **courriels d'anniversaire** : on personnalise (« Bonne fête de ma part — Lou »), ou « toute l'équipe » ?
Pour la **newsletter du vendredi** : qui signe ?

### Q1.3 — Tes 5-10 anti-mots personnels

Donne-moi 5 à 10 mots/expressions que **toi personnellement** tu n'utilises JAMAIS et qui sonneraient faux dans la voix de Louna&Co. Ça m'aide à calibrer plus finement que les anti-mots génériques déjà listés.

Exemples possibles : « girlboss », « slay », « babe », « queens », « yass », « relou »…

### Q1.4 — Tutoiement universel ?

Confirme : on tutoie **toujours**, même les nouvelles inscrites qui n'ont jamais mis les pieds au studio ?
Et avec les femmes plus âgées (50, 60, 70 ans) : tu maintiens le tutoiement ?

### Q1.5 — Mimi ou Amina ?

Comment tu préfères qu'on parle d'elle dans les communications publiques ? Et toi : « Lou » seulement ou « Lou Dakirellah » dans les courriels formels ?

---

## Priorité 2 — Données factuelles (BLOQUANT pour réponses correctes)

Sans ces données, l'agent ne peut pas répondre correctement aux DM clientes. Il escaladera tout, ce qui défait l'intérêt.

### Q2.1 — Catalogue des cours

Pour chaque cours offert, j'ai besoin de :
- Nom exact (ex : « Core Basics »)
- Description en 50 mots
- Niveau (débutant / intermédiaire / avancé / tous niveaux)
- Durée
- Effectif maximum
- Tarif unitaire
- Tarif forfait/abonnement (si applicable)
- Cours d'introduction gratuit ? (oui/non)

### Q2.2 — Adresse exacte du studio

- Adresse civique complète
- Étage / suite si applicable
- Particularités d'accès (entrée arrière, sonnette, code, parking, métro le plus proche)

### Q2.3 — Horaires d'ouverture

- Jours et heures d'ouverture
- Politique de réservation (avance minimale, annulation, no-show)

### Q2.4 — Méthodes de paiement et politique d'annulation

- Cartes acceptées
- Délai et frais d'annulation
- Politique de retard

### Q2.5 — Le Social Club — c'est quoi exactement ?

Décris en 100-200 mots :
- Qui peut en faire partie ?
- Cotisation (gratuit / payant) ?
- Fréquence des événements
- Exemples d'événements passés ou à venir
- Quel est l'avantage par rapport à juste prendre des cours ?

---

## Priorité 3 — Personas

### Q3.1 — Tes 3 vraies clientes types

Décris pour chacune en 100-200 mots :
- Nom (réel ou fictif)
- Âge
- Profession / situation
- Là où elle vit (quartier)
- Pourquoi elle est venue chez Louna&Co
- Ce qu'elle craignait avant la première fois
- Ce qu'elle aime maintenant
- Comment elle parle (tu, vous, ton chaleureux ou réservé)

> Ces personas guident l'agent pour adapter sa réponse selon à qui il pense parler.

### Q3.2 — La cliente que tu **ne veux pas** attirer

Décris en 50-100 mots la femme qui n'est PAS la bonne fit pour Louna&Co. Ça aide l'agent à savoir quand poliment ne pas insister.

---

## Priorité 4 — Calendrier éditorial

### Q4.1 — Les 6 piliers de contenu

Confirme ou corrige cette répartition hebdo :

| Jour | Pilier | Exemple concret |
|------|--------|-----------------|
| Lundi | Éducation Pilates | « 3 erreurs courantes en curl-up » |
| Mardi | Témoignage cliente | story d'une cliente (anonyme ou non) |
| Mercredi | Social Club | annonce du prochain événement |
| Jeudi | Coulisses studio | préparation, équipe |
| Vendredi | Réflexion fondatrices | mot de Lou ou Mimi sur un thème |
| Week-end | Inspiration légère | citation, rituel |

Tu changes quoi ? Tu ajoutes quoi ?

### Q4.2 — Les fréquences

- Combien de posts Instagram par semaine ?
- Combien de Reels par semaine ?
- Combien de stories par jour ?
- Combien de newsletters par mois ? (1 par vendredi = 4-5)

---

## Priorité 5 — Rapports et notifications

### Q5.1 — Adresses courriel

- Adresse courriel à laquelle envoyer le **rapport quotidien 20h**
- Adresse courriel pour le **rapport hebdo lundi 8h**
- Idem pour Mimi (en copie ?)

### Q5.2 — Notifications push (escalade urgente)

Tu utilises quoi sur ton téléphone pour les notifications urgentes ?
- ntfy.sh (gratuit, app à installer)
- Pushover (~5 USD une fois)
- SMS Twilio (~10 CAD/mois)
- Email seulement (pas idéal pour urgences)

---

## Priorité 6 — Visuel

### Q6.1 — Médiathèque existante

Tu as déjà une médiathèque de photos du studio ? Si oui :
- Combien de photos disponibles ?
- Format (Drive, Dropbox, dossier local) ?
- Droits d'utilisation OK ?

### Q6.2 — Charte visuelle DALL-E

Confirme ou ajuste la palette pour la génération d'images :
- Lumière naturelle douce ✓
- Beige, brun chaud, terracotta ✓
- Pas de visage identifiable ✓
- Pas de texte sur l'image ✓
- Style photo réaliste (pas illustration) ✓
- Tu veux ajouter quoi ? (ex : végétation, pierre brute, bois clair…)

---

## Priorité 7 — Test final avant passage en autonomie

### Q7.1 — Échantillon de DM passés

Tu peux me partager 20 vrais DM reçus chez Louna&Co (ou des exemples plausibles) avec ce que tu aurais répondu personnellement ? On utilisera ça pour tester la qualité de l'agent avant de le laisser libre.

---

## Format de réponse suggéré

Tu peux répondre :
- Une question à la fois en chat
- Par batch sur une priorité (toute la P1 d'un coup par exemple)
- En document partagé (Google Docs, etc.) si tu préfères structurer
- En audio que tu m'envoies, je transcris

**Le plus efficace** : on prend les questions une par une. Tu réponds quand tu as 5 minutes. Je les intègre au prompt système au fur et à mesure et je commit chaque amélioration.
