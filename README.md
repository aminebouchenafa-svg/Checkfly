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

L'appartenance à la flotte 737NG (qui est CDB, qui est OPL, qui a quitté ou
rejoint le secteur) vit dans `lib/seed-data.ts`, versionné avec le code —
c'est la source de vérité pour les *effectifs*. À chaque départ/arrivée, ce
fichier est mis à jour et poussé sur GitHub.

## Tableau de bord public éditable (`dashboard-artifact/`)

En plus de l'app Next.js, un tableau de bord autonome est publié comme
Claude Artifact (lien partagé séparément) pour consultation et saisie sans
serveur à héberger. C'est une page HTML unique, self-contained, qui utilise
la capacité `artifact` de Claude pour s'auto-republier à chaque modification :
toucher un pilote ouvre un formulaire (date dernier contrôle simulateur,
dernier contrôle en ligne, validité anglais) et "Enregistrer" sauvegarde une
nouvelle version de la page elle-même — aucune base de données externe.

Sources dans `dashboard-artifact/` :
- `dashboard.css` — palette/typo/composants
- `head-template.html`, `skeleton-template.html` — structure HTML statique
- `app-logic.js` — rendu, filtre, formulaire d'édition, republication

Pour reconstruire le fichier à publier (après un changement d'effectif dans
`lib/seed-data.ts`, ou une modification des sources ci-dessus) :

```bash
npm run build:dashboard
```

Écrit `dashboard-export.html` (non versionné) à la racine — c'est le fichier à
republier via l'outil Artifact. **Attention** : ceci repart de
`lib/seed-data.ts` avec les dates simulateur/contrôle en ligne/anglais
vierges. Si des dates ont été saisies directement sur la page publiée depuis
le dernier export, relire d'abord son contenu actuel (action `read` de
l'outil Artifact) et fusionner ces dates dans le nouvel export avant de
republier, pour ne pas les écraser.

## Notes techniques

- Next.js 15 (App Router) + TypeScript + Tailwind CSS
- Base de données SQLite locale via `better-sqlite3` (aucun serveur de base de
  données à installer)
- Aucune authentification n'est implémentée — outil interne à usage local ; à
  ajouter avant toute exposition publique.
