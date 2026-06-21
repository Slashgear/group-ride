# Implementation Plan

## Overview

Cinq éléments à livrer : la commande `/past-rides` (Discord + Telegram), une FAQ, un guide de migration SQLite→PostgreSQL, un enrichissement du troubleshooting Telegram, et le schema JSON-LD sur la landing.

## Architecture Decisions

- `findPast()` retourne les rides dont `date < now()`, triés par date DESC, limité à 10. Ça couvre les rides closed, cancelled et active dont la date est dépassée — sans dépendre du statut, qui peut être en retard si le scheduler n'a pas tourné.
- Pas de nouveau fichier de migration SQL : `findPast()` ne touche pas au schéma, juste une nouvelle query.
- Le JSON-LD est injecté dans `LandingPage.astro` (un seul composant qui sert FR et EN) avec les champs dynamiques issus des props `t`.
- Les tâches doc (FAQ, migration, troubleshooting) sont indépendantes et peuvent être faites dans n'importe quel ordre après le checkpoint 1.

## Dependency Graph

```
Task 1 — findPast() port + SQLite + Postgres
    │
    ├── Task 2 — /past-rides Discord
    └── Task 3 — /past-rides Telegram

Task 4 — FAQ doc          (indépendant)
Task 5 — Migration guide  (indépendant)
Task 6 — Troubleshooting Telegram  (indépendant)
Task 7 — JSON-LD landing  (indépendant)
```

---

## Phase 1 — Fondation `/past-rides`

### Task 1 — `findPast()` sur le port et les deux implémentations

**Description:** Ajouter `findPast(limit?: number): Promise<Ride[]>` au port `RideRepository`, l'implémenter dans `SqliteRideRepository` et `PostgresRideRepository`. La query : `WHERE date < now() ORDER BY date DESC LIMIT {limit}`. Ajouter un test unitaire sur le service (via mock repo) et un test de smoke dans le fichier de test du service existant.

**Acceptance criteria:**

- [ ] `RideRepository` port expose `findPast(limit?: number): Promise<Ride[]>`
- [ ] SQLite : retourne les rides dont `date < datetime('now')`, DESC, limité à 10 par défaut
- [ ] Postgres : même comportement avec `NOW()`
- [ ] Les mocks dans les tests existants exposent la méthode (pour éviter les erreurs TypeScript)
- [ ] `bun test` passe

**Verification:**

- [ ] `bun test` — 0 fail
- [ ] `bun run typecheck` — 0 error

**Dependencies:** None

**Files likely touched:**

- `src/domain/ports/ride.repository.ts`
- `src/adapters/database/sqlite/ride.repo.ts`
- `src/adapters/database/postgres/ride.repo.ts`
- `tests/services/ride.service.test.ts` (mock à mettre à jour)
- `tests/services/scheduler.service.test.ts` (mock à mettre à jour)

**Estimated scope:** M

---

### Task 2 — `/past-rides` Discord

**Description:** Créer `src/adapters/messaging/discord/commands/past-rides.ts`, enregistrer la commande dans `deploy-commands.ts` et `start.ts`. Afficher les 5 dernières sorties avec date, lieu, distance/D+ si présents, et le statut (✅ closed / ❌ cancelled). Pas de boutons (rides terminées — pas d'action possible). Réponse éphémère comme `/rides`.

**Acceptance criteria:**

- [ ] `/past-rides` apparaît dans la liste des commandes Discord après démarrage
- [ ] Affiche jusqu'à 5 rides passées, triées par date DESC
- [ ] Chaque ride affiche : date, meetingPoint, distanceKm (si set), elevationGain (si set), statut
- [ ] Message "No past rides yet." si historique vide
- [ ] Réponse éphémère

**Verification:**

- [ ] `bun test` — 0 fail
- [ ] `bun run typecheck` — 0 error

**Dependencies:** Task 1

**Files likely touched:**

- `src/adapters/messaging/discord/commands/past-rides.ts` (nouveau)
- `src/adapters/messaging/discord/deploy-commands.ts`
- `src/adapters/messaging/discord/start.ts`

**Estimated scope:** S

---

### Task 3 — `/pastrides` Telegram

**Description:** Créer `src/adapters/messaging/telegram/commands/past-rides.ts`, enregistrer dans `start.ts` et `setMyCommands`. Même logique que Discord. Note : Telegram n'autorise pas le tiret dans les noms de commandes, donc `/pastrides`.

**Acceptance criteria:**

- [ ] `/pastrides` répond avec la liste des 5 dernières sorties
- [ ] Même champs que Discord (date, lieu, distance, D+, statut)
- [ ] Message "No past rides yet." si vide
- [ ] Commande visible dans le menu Telegram

**Verification:**

- [ ] `bun test` — 0 fail
- [ ] `bun run typecheck` — 0 error

**Dependencies:** Task 1

**Files likely touched:**

- `src/adapters/messaging/telegram/commands/past-rides.ts` (nouveau)
- `src/adapters/messaging/telegram/start.ts`

**Estimated scope:** S

---

## Checkpoint 1 — Après Tasks 1-3

- [ ] `bun run fmt:check && bun run lint && bun test` — tout vert
- [ ] Les deux commandes répondent correctement (test manuel ou vérification des mocks)
- [ ] Review humaine avant de continuer

---

## Phase 2 — Documentation & SEO (indépendant)

### Task 4 — Page FAQ

**Description:** Créer `website/src/content/docs/docs/faq.md`. Couvrir : supprimer un ride fermé (impossible, pourquoi), TZ et reminders (TZ du serveur, pas de l'utilisateur), GPX import failure (causes courantes), SQLite vs PostgreSQL (quand choisir quoi), que se passe-t-il si le bot est hors ligne pendant un reminder, comment retrouver son TELEGRAM_GROUP_CHAT_ID, comment réinviter le bot Discord.

**Acceptance criteria:**

- [ ] Fichier créé avec frontmatter Starlight valide (`title`, `description`)
- [ ] Minimum 7 questions/réponses couvrant les thèmes listés
- [ ] Liens vers les pages de doc existantes là où pertinent

**Verification:**

- [ ] Le site build sans erreur : `cd website && bun run build`

**Dependencies:** None

**Files likely touched:**

- `website/src/content/docs/docs/faq.md` (nouveau)

**Estimated scope:** S

---

### Task 5 — Guide de migration SQLite → PostgreSQL

**Description:** Créer `website/src/content/docs/docs/migration.md`. Couvrir : prérequis (psql, accès à la DB SQLite), export des rides depuis SQLite (sqlite3 .dump ou SELECT + INSERT), création du schéma Postgres (lien vers le fichier SQL), import des données, changement de la variable `DATABASE_URL`, vérification. Inclure les commandes shell exactes.

**Acceptance criteria:**

- [ ] Fichier créé avec frontmatter valide
- [ ] Étapes numérotées avec les commandes shell copiables
- [ ] Mention des gotchas (types de dates, boolean 0/1 vs true/false, IDs en texte vs entier)

**Verification:**

- [ ] `cd website && bun run build` — 0 erreur

**Dependencies:** None

**Files likely touched:**

- `website/src/content/docs/docs/migration.md` (nouveau)

**Estimated scope:** S

---

### Task 6 — Troubleshooting Telegram enrichi

**Description:** Enrichir la section Telegram de `troubleshooting.md` pour atteindre la parité avec la section Discord. Cas à ajouter : bot expulsé du groupe et ré-invitation, commandes qui n'apparaissent pas dans le menu (@BotFather setcommands), conversation guidée `/newride` interrompue (comment la relancer), bot qui ne reçoit pas les messages (allowed_updates, admin rights), reminder qui ne part pas (TZ, scheduler, bot hors ligne).

**Acceptance criteria:**

- [ ] 4-5 nouveaux cas Telegram documentés
- [ ] Parité qualitative avec la section Discord (même niveau de détail)

**Verification:**

- [ ] `cd website && bun run build` — 0 erreur

**Dependencies:** None

**Files likely touched:**

- `website/src/content/docs/docs/troubleshooting.md`

**Estimated scope:** S

---

### Task 7 — JSON-LD SoftwareApplication sur la landing

**Description:** Ajouter un bloc `<script type="application/ld+json">` dans le `<head>` de `LandingPage.astro` avec le schema `SoftwareApplication`. Champs : `name`, `description` (depuis `t.heroSub`), `applicationCategory: "UtilitiesApplication"`, `operatingSystem: "Discord, Telegram"`, `offers.price: "0"`, `url` (canonicalUrl), `codeRepository` (GitHub), `license`. Doit être rendu côté serveur (pas de JS client).

**Acceptance criteria:**

- [ ] `<script type="application/ld+json">` présent dans le HTML généré
- [ ] JSON valide, parseable
- [ ] `@type: "SoftwareApplication"` présent
- [ ] `offers.price` = "0" et `offers.priceCurrency` = "EUR"
- [ ] Valide sur Google Rich Results Test (vérification manuelle)

**Verification:**

- [ ] `cd website && bun run build` — 0 erreur
- [ ] `grep -r "SoftwareApplication" website/dist/` trouve le schema dans les deux pages (FR + EN)

**Dependencies:** None

**Files likely touched:**

- `website/src/components/LandingPage.astro`

**Estimated scope:** XS

---

## Checkpoint Final

- [ ] `bun run fmt:check && bun run lint && bun test` — tout vert
- [ ] `cd website && bun run build` — 0 erreur
- [ ] Commit et push

## Risks and Mitigations

| Risk                                                                                 | Impact | Mitigation                                                   |
| ------------------------------------------------------------------------------------ | ------ | ------------------------------------------------------------ |
| Telegram interdit le tiret dans les noms de commandes                                | Moyen  | Utiliser `/pastrides` (sans tiret)                           |
| `findPast()` retourne des rides active dont la date est passée (scheduler en retard) | Faible | Intentionnel — on affiche l'état réel, pas l'état idéal      |
| Le build Astro/Starlight échoue si le frontmatter est invalide                       | Moyen  | Vérifier le format exact des pages existantes avant d'écrire |
| JSON-LD invalide si les champs dynamiques contiennent des caractères spéciaux        | Faible | Utiliser `JSON.stringify()` pour sérialiser proprement       |
