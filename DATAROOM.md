# Data room LOWI — `/data-room`

Espace de due diligence privé, construit le 2026-10-14 dans ce dépôt
(routes Next.js) sur le projet Supabase **`lowi-dataroom`**
(`skjhebgrbwskdkbwguyt`, ap-southeast-1), séparé de Lowi_bkk.

## Parcours

1. **Demande** — l'investisseur remplit `/data-room` (nom, e-mail, société,
   message). Pot de miel anti-robot ; une seule demande en attente par adresse
   sur 24 h.
2. **Alerte** — tu reçois un e-mail « Data room access request — <nom> » avec
   un bouton *Review the request*. Le lien est **signé** (HMAC) : seul ce lien,
   ou ta session admin, peut trancher.
3. **Décision** — la page `/data-room/decide` montre la demande ; *Grant
   access* / *Decline* sont des boutons (POST), jamais un simple clic sur le
   lien : les antivirus de messagerie pré-ouvrent les liens et auraient validé
   à ta place.
4. **Invitation** — accordé : l'investisseur reçoit, dans sa langue, un lien
   personnel valable 72 h, à usage unique, qu'il consomme en cliquant
   *Enter the data room* (même raison : POST).
5. **Session** — cookie httpOnly signé, 7 jours. Le statut du membre est relu
   en base **à chaque requête** : une révocation coupe l'accès immédiatement.
   Pour revenir plus tard : « Already approved? » → nouveau lien valable 1 h
   (5 par heure maximum, réponse identique que l'adresse soit membre ou non).

## Ce que voit l'investisseur

Explorateur façon Drive au gabarit Ledger : dossiers à gauche (*Start here*,
*Pitch & dossier*, *Methodology & maths*, *Financial model*, *Legal &
structure*, *Deal pipeline*, *Platform & data*), README épinglé en carte,
documents clés (★, or) en tête, liste triable des fichiers. Chaque PDF est
**filigrané à l'ouverture** (nom, e-mail, heure UTC, en diagonale + pied de
page) et chaque ouverture est journalisée ; la page de lecture envoie un
battement toutes les 15 s tant que l'onglet est visible (temps de lecture).

## Ton tableau de bord — `/data-room/admin`

Connecte-toi par « Already approved? » avec l'adresse de
`DATAROOM_OWNER_EMAIL` (le compte propriétaire se crée à la première
demande). Tu y trouves : demandes (accorder / refuser), membres (dernière
visite, fichiers ouverts, temps de lecture, **révoquer / rétablir**), fichiers
(★ document clé, épingler le read-me), temps de lecture par document, journal
complet.

## Déposer des fichiers

Depuis ce poste, directement en base (pas de limite d'upload HTTP) :

```
npm run dataroom:upload -- chemin/vers/methodo.pdf --folder methodology --title "How the maths works" --key
npm run dataroom:upload -- dataroom/README.md --folder start --title "Read me first" --pin --key
npm run dataroom:upload -- dataroom/README.fr.md --folder start --name README.md --lang fr --title-fr "À lire en premier"
```

Redéposer le même nom dans le même dossier **remplace** le fichier (★ et
épingle conservés). Les dossiers sont en base (`dataroom.folders`) ; en
ajouter un = une ligne SQL.

## Bilingue

Interface entièrement traduite (`lib/dataroom/i18n.js`, bascule EN/FR en haut).
Contenus : titres et descriptions ont une colonne `_fr` ; un markdown a un
corps `body_md_fr` (option `--lang fr`) ; un PDF français = un fichier à part.
Sans version FR, l'anglais s'affiche.

## Mise en production — à faire

1. **Resend** : créer le compte, ajouter le domaine `lowi.asia`, poser les
   3 enregistrements DNS qu'il donne, créer une clé API.
2. **Variables Vercel** (projet du site lowi.asia, Production) — valeurs dans
   `.env.local` sur ce poste, sauf les deux dernières :
   `DATAROOM_DATABASE_URL`, `DATAROOM_SESSION_SECRET`,
   `DATAROOM_OWNER_EMAIL`, `DATAROOM_BASE_URL=https://lowi.asia`,
   `RESEND_API_KEY`, `DATAROOM_FROM=LOWI Data Room <dataroom@lowi.asia>`.
3. Déposer les vrais documents et marquer les clés (★).

Sans `RESEND_API_KEY`, aucun e-mail ne part : il est écrit dans les logs du
serveur (pratique en local, **bloquant en production**).

## Sécurité — choix et limites

- Base fermée : RLS activé sans policy, aucun droit pour `anon` /
  `authenticated` ; l'app passe par le rôle `dataroom_app` (mot de passe dans
  `.env.local` uniquement). Les 6 alertes Supabase `rls_enabled_no_policy`
  (INFO) sont **voulues**.
- Seul le SHA-256 des jetons de connexion est stocké.
- Le filigrane **dissuade et attribue**, il n'empêche ni capture d'écran ni
  impression : rien ne le peut dans un navigateur.
- PDF en `bytea` dans la base : simple et sans clé Storage, mais **Vercel
  limite une réponse à 4,5 Mo** — au-delà, le PDF filigrané ne sera pas
  servi. Le script d'upload prévient. Si des documents plus lourds arrivent,
  passer à Supabase Storage + URL signées.
- Quota gratuit Supabase : 500 Mo de base au total.

## Non fait

- Pas de refus notifié au demandeur (choix : tu reprends contact toi-même).
- Pas de droits par document ou par investisseur (tout membre voit tout).
- Pas d'upload depuis l'interface admin (script local uniquement).
- Les fichiers non-PDF (xlsx…) sont servis et journalisés, sans filigrane.
- Fuseau du journal en UTC.
