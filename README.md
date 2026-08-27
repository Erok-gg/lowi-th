# lowi-th

Site servi sur **lowi.asia**. Application Next.js minimale dont le seul rôle est
d'exposer deux documents HTML autoportants (police et images embarquées, aucune
dépendance externe).

| URL | Contenu |
|---|---|
| `/` | Dossier investisseur défilable — 16 sections + 5 annexes |
| `/deck` | Le diaporama, 16 slides |

## Pourquoi Next.js pour deux fichiers statiques

Le projet Vercel est configuré sur le préréglage Next.js. Plutôt que de réécrire
160 Ko de HTML en JSX — ce qui ferait diverger la source du deck — les fichiers
sont servis depuis `public/` via une réécriture.

Cette réécriture est en **`beforeFiles`**, et pas sous la forme courte : une
réécriture simple s'applique *après* les routes, si bien que `app/page.js`
l'emportait sur `/` et le dossier n'était jamais servi (mesuré : 5 545 octets
au lieu de 164 763).

`app/page.js` reste en place comme filet — il n'est atteint que si la
réécriture cesse de s'appliquer, et pointe alors vers les deux documents.

⚠ Ne pas ajouter TypeScript : Next installe automatiquement **TypeScript 7**
(portage Go, en préversion) et le build échoue sur
`The "id" argument must be of type string`.

## Historique

Ce dépôt a été remis à zéro le **2026-08-27**. L'état antérieur — dashboard
Next.js avec KYC, `legal/`, `contracts/`, et 192 commits — est conservé dans le
dépôt **privé** `Erok-gg/lowi-th-archive` (copie vérifiée fichier par fichier :
569/569 avant suppression).

```
gh repo clone Erok-gg/lowi-th-archive
```

## Déploiement

Vercel, projet `lowi-dashboard`, branche `main`, **Root Directory vide**,
préréglage **Next.js**.
