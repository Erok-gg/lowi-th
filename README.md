# lowi-th

Site statique servi sur **lowi.asia** — pitch deck LOWI (16 slides, autoportant :
police et images embarquées, aucune dépendance externe).

## Historique

Ce dépôt a été remis à zéro le **2026-08-27**. L'intégralité de l'état antérieur
— dashboard Next.js, `legal/`, `contracts/`, et les 192 commits d'historique —
est conservée dans le dépôt **privé** `Erok-gg/lowi-th-archive`
(copie vérifiée fichier par fichier : 569/569 avant suppression).

Rien n'a été perdu. Pour retrouver un fichier :

```
gh repo clone Erok-gg/lowi-th-archive
```

## Structure

```
index.html    le deck, autoportant
vercel.json   en-têtes de sécurité
```

## Déploiement

Vercel, projet `lowi-dashboard`, branche `main`.
**Répertoire racine : `/`** et framework **« Other »** — la configuration
précédente pointait vers `dashboard/`, qui n'existe plus.
