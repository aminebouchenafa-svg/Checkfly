# CheckFly — Suivi des licences & contrôles 737NG

Application de suivi pour Fleet Training : liste des commandants de bord (CDB) et
officiers pilotes de ligne (OPL) sur 737NG, avec les échéances de :

- Licence
- Contrôle simulateur (OPC)
- Contrôle en ligne
- Niveau d'anglais (OACI)

Le tableau de bord affiche automatiquement les pilotes dont une échéance approche à
**3 mois**, **2 mois** et **1 mois**, ainsi que celles déjà expirées, classées par
urgence.

## Démarrage

Prérequis : Node.js 20+.

```bash
npm install
npm run dev
```

Ouvrir http://localhost:3000.

Les données sont stockées localement dans un fichier SQLite (`data/checkfly.db`,
créé automatiquement au premier lancement — non versionné). Aucune configuration
externe n'est nécessaire.

Pour un déploiement type production :

```bash
npm run build
npm run start
```

## Utilisation

- **Tableau de bord** (`/`) : liste des alertes en cours, groupées par urgence
  (expiré, ≤ 1 mois, ≤ 2 mois, ≤ 3 mois).
- **Pilotes** (`/pilots`) : liste complète, recherche par nom, filtre par grade
  (CDB / OPL), statut coloré pour chaque échéance.
- **Ajouter un pilote** (`/pilots/new`) : formulaire de saisie (nom, grade,
  échéances).
- Cliquer sur un pilote pour modifier ses informations ou le supprimer.

## Roster (`lib/seed-data.ts`)

Le roster des pilotes 737NG (CDB + OPL) et leurs dates connues vivent dans
`lib/seed-data.ts`, versionné avec le code. C'est la source de vérité :
à chaque départ/arrivée ou nouvelle date d'échéance, ce fichier est mis à jour
et poussé sur GitHub — aucune base de données hébergée n'est nécessaire.

Pour extraire un instantané JSON du roster (avec statuts calculés) — utilisé
pour régénérer le tableau de bord public en lecture seule :

```bash
npm run export:roster
```

Écrit `roster-export.json` (non versionné) à la racine.

## Notes techniques

- Next.js 15 (App Router) + TypeScript + Tailwind CSS
- Base de données SQLite locale via `better-sqlite3` (aucun serveur de base de
  données à installer)
- Aucune authentification n'est implémentée — outil interne à usage local ; à
  ajouter avant toute exposition publique.
