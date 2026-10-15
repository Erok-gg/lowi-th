# Pourquoi nous mesurons : ce que les données publiques de prix disent, et ne disent pas

> Brouillon, 15 octobre 2026. Chaque affirmation est étiquetée : **source** (citée de
> l'éditeur), **déduit** (notre raisonnement à partir de la source) ou **à vérifier** (pas
> encore confronté à un document primaire).

## En bref

La Thaïlande publie des prix immobiliers **en agrégat**. Aucune source publique ne donne le
prix auquel un lot donné, dans un immeuble donné, a réellement changé de mains. Pour savoir
si un lot est bon marché, il faut le comparer aux lots qui l'entourent. C'est ce que fait la
plateforme LOWI.

## 1. L'indice de la Banque de Thaïlande : une expertise, pas un prix de vente

La Banque de Thaïlande (BoT) publie chaque mois un indice des prix résidentiels (RPPI), avec
un sous-indice condominium pour Bangkok et sa périphérie.

| | |
|---|---|
| **Données** | Les contrats de crédit immobilier déclarés chaque mois par les banques commerciales et les institutions financières spécialisées. *(source : BoT)* |
| **Prix utilisé** | Le **prix d'expertise** de la banque (terrain et bâti), utilisé « comme indicateur du prix de vente ». *(source : BoT)* |
| **La réserve de la BoT elle-même** | « Le prix d'expertise ne correspond pas toujours au prix de transaction réel et peut différer d'un établissement à l'autre. » *(source : BoT, 2026)* |
| **Couverture** | Environ 61 % des transactions résidentielles, en nombre. *(source : BoT)* |
| **Qui manque** | Les achats sans crédit. *(déduit : l'indice n'est construit qu'à partir de contrats de prêt.)* Les acheteurs étrangers paient le plus souvent comptant, faute d'accès au crédit thaï : le segment du quota étranger est donc mal couvert. *(déduit)* |
| **Méthode** | Régression hédonique à variables temporelles. Elle contrôle la surface, l'âge, le nombre d'étages, le promoteur et la localisation (distance au BTS/MRT, au CBD, à des repères). *(source : BoT)* |
| **Résultat** | Un indice d'**évolution des prix**. Il ne donne aucun niveau de prix pour un immeuble ou un lot. *(source : méthode BoT)* |
| **Couverture condo** | Bangkok et périphérie uniquement. *(source : BoT)* |

La BoT a aussi étudié d'autres sources : les prix affichés en ligne d'un fournisseur de
données (Baania), les enquêtes semestrielles d'agents (AREA, CBRE) et les valeurs
d'expertise officielles du cadastre. Elle a retenu les expertises des dossiers de prêt.
*(source : BoT, 2026)*

**Ce que nous en retenons.** L'indice de la BoT est la meilleure mesure publique de la
**tendance**. C'est pourquoi notre scénario d'appréciation l'utilise (indice condo, environ
+3,1 % par an). Il ne dit pas si un lot précis est affiché 25 % au-dessus ou en dessous de
ses voisins.

## 2. Les autres sources publiques : agrégées elles aussi

| Source | Ce qu'elle publie | Limite pour le prix d'un lot |
|---|---|---|
| **Cadastre (Land Department)** | Enregistre chaque transfert. | Les droits de mutation sont calculés sur la valeur d'expertise officielle, et le prix déclaré s'y aligne souvent. Les prix ne sont pas publiés lot par lot. *(à vérifier)* |
| **REIC** (Real Estate Information Center, agence publique) | Indice trimestriel des prix des condos **neufs** mis en vente, et volumes de transferts. *(source : publications REIC citées par le Bangkok Post)* | Couvre le neuf, pas la revente. Agrégé par zone. |

## 3. Ce que cela implique pour nos calculs

1. **Nous comparons à l'intérieur de l'immeuble.** Un lot est comparé aux lots comparables
   du même immeuble (surface, étage, vue, état). La localisation, le promoteur et l'âge sont
   alors identiques par construction, là où le modèle de la BoT doit les approcher
   statistiquement.
2. **Nous mesurons les prix affichés en continu.** Le suivi de 123 345 annonces actives, mis à
   jour chaque jour, montre la dispersion des prix dans chaque immeuble. Dans un même
   immeuble, des lots de même plan affichent 25 à 42 % d'écart.
3. **Nous n'utilisons les indices publics que pour la tendance.** Les scénarios
   d'appréciation reposent sur l'indice condo de la BoT, jamais sur nos propres prix
   affichés.
4. **Un prix affiché n'est pas un prix de transaction.** La plateforme mesure la dispersion
   des prix affichés. La décote réellement obtenue est fixée par le prix convenu dans le
   contrat d'achat, comparé à la médiane de l'immeuble.

## Sources

- Banque de Thaïlande, *Statistical article: Residential Property Price Index*, décembre 2023 —
  https://www.bot.or.th/th/research-and-publications/articles-and-publications/articles/statistical-articles/Stat_Article_01dec23.html
- K. Samritpiam & P. Chongprasoplarp (Banque de Thaïlande), *The development of the Bank of
  Thailand's RPPI*, International Conference on Real Estate Statistics, Tokyo, février 2026 —
  https://cures.hias.hit-u.ac.jp/wp-content/uploads/2026/02/BOT_RPPI_Final.pdf
- Bangkok Post, *Bangkok condo price index up 3.4 %* (indice REIC des condos neufs, T1 2025).
