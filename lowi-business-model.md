# LOWI — Business Model & Structure Juridique

## Contexte

Plateforme d'investissement immobilier fractionné via NFT sur blockchain Sui.
Marché cible : expatriés européens, investisseurs retail, Asie du Sud-Est.
Premier projet : Chalok Baan Kao Pool Villa, Ko Phangan, Thaïlande.

---

## Structure juridique — SPV à Singapour

### Cas 1 : SPV non encore constituée

Flow souscription :
```
1. KYC investisseur (obligatoire, préalable à tout)
2. Signature lettre d'intention + conditions suspensives
3. Consignation des fonds sur compte séquestre LOWI SG
   → Bonus early bird 1% pour les 15 % premiers souscripteurs
4. Constitution SPV (Private Limited Company, SG) — ~6-8 semaines
5. Transfert fonds séquestre → compte SPV
6. Signature contrat de bail + documents investisseurs
7. Mint NFT → livraison parts on-chain
```

**Risques à couvrir :**
- Que se passe-t-il si la levée échoue ? → remboursement intégral depuis séquestre
- Délai de constitution SPV → investisseurs attendent 6-8 semaines sans NFT
- Régulation SG sur collecte de fonds pré-constitution → consulter avocat MAS

### Cas 2 : SPV déjà constituée

Flow simplifié :
```
1. KYC investisseur
2. Signature contrat de souscription direct (SPV existante)
3. Virement fonds → compte SPV
4. Mint NFT immédiat (ou J+2 ouvré)
```

---

## Bonus Early Bird

- **Qui** : les souscripteurs représentant les 15 premiers % du capital (ex. 19 parts sur 128)
- **Quoi** : -1 % sur le prix par part (ex. 99 000 THB au lieu de 100 000)
- **Mécanisme** : la différence est répercutée sur les souscripteurs suivants
  - 19 parts × 1 000 THB de remise = 19 000 THB à répartir sur 109 parts restantes
  - Surcoût par part restante : **+174 THB** (0,17 % — négligeable)
- **À coder** : flag `early_bird` dans la Collection NFT + prix dynamique dans `mint()`

---

## Structure de coûts SPV (5 projets / SPV)

### Coûts de constitution (one-time)
| Poste | Estimation |
|---|---|
| Constitution Pte Ltd SG | 1 500 – 3 000 SGD |
| Avocat (docs investisseurs, bail) | 5 000 – 10 000 SGD |
| Compte bancaire corporate SG | 0 – 500 SGD |
| Enregistrement Land Office TH (par projet) | 500 – 1 500 SGD |
| **Total constitution** | **~10 000 – 15 000 SGD** |

### Répartition sur 5 projets
- Constitution / projet : **2 000 – 3 000 SGD**
- À intégrer dans le prix d'acquisition de chaque projet

### Coûts annuels récurrents (par SPV)
| Poste | Estimation / an |
|---|---|
| Corporate secretary SG (obligatoire) | 1 200 – 2 000 SGD |
| Audit (si requis) | 2 000 – 5 000 SGD |
| Compliance + filing ACRA | 500 SGD |
| Comptabilité | 1 500 – 3 000 SGD |
| **Total annuel / SPV** | **~5 000 – 10 000 SGD** |

- Réparti sur 5 projets : **1 000 – 2 000 SGD/projet/an**
- Sur 20 ans de bail : **20 000 – 40 000 SGD/projet total**
- Par part (128 parts) : **156 – 312 SGD/part** sur la durée → **~780 – 1 560 THB/part** à provisionner

---

## Structure de frais LOWI (à valider)

### Frais d'entrée (acquisition)
Prélevés une fois à la souscription, inclus dans le prix de la part.

| Poste | % du capital |
|---|---|
| Constitution SPV proratisée | ~0,5 % |
| Due diligence + sourcing | ~1,0 % |
| Frais juridiques / part | ~0,5 % |
| Marge LOWI acquisition | ~2,0 – 3,0 % |
| **Total frais entrée** | **~4,0 – 5,0 %** |

Exemple Chalok : 12 800 000 THB × 4,5 % = **576 000 THB** de frais d'entrée

### Frais de gestion annuels
Prélevés sur les revenus locatifs bruts avant distribution.

| Poste | % des revenus bruts |
|---|---|
| Property management | 10 % |
| Frais plateforme Airbnb/Booking | 6 % |
| LOWI management fee | 3 – 5 % |
| **Total charges** | **~19 – 21 %** |

Revenus nets investisseurs : **79 – 81 % des revenus bruts**

### Frais de sortie
- Fin de bail normale : 0 %
- Revente secondaire de parts : **1,5 % du montant** (à coder dans `transfer_share`)

---

## Modèle de pricing consolidé — Chalok exemple

```
Prix bien                    : 12 800 000 THB
+ Frais LOWI entrée (4,5%)  :    576 000 THB
─────────────────────────────────────────────
Prix levée total             : 13 376 000 THB
÷ 128 parts                  =    104 500 THB / part
(arrondi commercial)         =    105 000 THB / part

Early bird (15% = 19 parts)  =    103 950 THB / part (-1%)
Parts standard               =    105 170 THB / part (surcoût +0,16%)
```

---

## Questions ouvertes / risques critiques

### Juridique
- [ ] La collecte de fonds pré-SPV est-elle légale en SG ? → MAS consultation
- [ ] Le séquestre doit-il être hébergé chez un avocat agréé ?
- [ ] Les NFT sont-ils considérés comme des valeurs mobilières par MAS / AMF ?
- [ ] Structure optimale : SPV détient le bail ou les investisseurs directement ?

### Commercial
- [ ] 5 projets/SPV : comment gérer si un projet sous-performe et impacte la SPV ?
  → Envisager 1 SPV / projet malgré le coût, mutualisé via holding LOWI SG
- [ ] Prix par part à 105 000 THB : concurrence vs autres plateformes (Brickken, RealT) ?
- [ ] Liquidité secondaire : pas de marché secondaire organisé = risque investisseur

### Financier
- [ ] Provisions SPV à 20 ans intégrées dans le prix → TRI réel recalculé
- [ ] Qui supporte les travaux imprévus ? → provision maintenance (~1%/an recommandé)
- [ ] Change THB/EUR : risque non couvert, à mentionner explicitement aux investisseurs

---

## Benchmarks concurrents

| Plateforme | Marché | Frais entrée | Frais gestion | Min. ticket |
|---|---|---|---|---|
| RealT | US | 0 % | 10 % loyers | ~50 $ |
| Brickken | EU | 2 – 5 % | 1 – 2 %/an | 100 € |
| Blocksquare | EU | 5 % | 0,5 %/an | variable |
| Lofty.ai | US | 0 % | 8 % loyers | 50 $ |
| **LOWI (cible)** | **Asie** | **4,5 %** | **3-5 % loyers** | **105k THB** |

---

## Prochaines décisions à prendre

1. **1 SPV / projet** vs **1 SPV / 5 projets** — impacte tout le reste
2. **Séquestre** : compte LOWI ou avocat tiers ?
3. **Pricing final** : intégrer ou pas les frais SPV dans le prix affiché ?
4. **Early bird** : mécanisme on-chain ou off-chain uniquement ?
5. **MAS consultation** : obligatoire avant tout lancement réel
