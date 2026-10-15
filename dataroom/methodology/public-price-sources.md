# Why we measure: what Thailand's public price data can and cannot tell you

> Draft, 15 October 2026. Every statement is labelled: **source** (quoted from the
> publisher), **inferred** (our reasoning from the source), or **to verify** (not yet
> checked against a primary document).

## The short version

Thailand publishes property prices **in aggregate**. No public source gives the price
at which a given unit, in a given building, actually changed hands. To know whether a
unit is cheap, you have to compare it with the units around it. That comparison is
what the LOWI platform does.

## 1. The Bank of Thailand index: an appraisal, not a sale price

The Bank of Thailand (BOT) publishes a monthly Residential Property Price Index
(RPPI), with a condominium sub-index for Bangkok and its vicinity.

| | |
|---|---|
| **Data** | Mortgage loan contracts reported monthly by commercial banks and specialised financial institutions. *(source: BOT)* |
| **Price used** | The bank's **appraisal price** (land and building), used "as a proxy for the selling price". *(source: BOT)* |
| **The BOT's own caveat** | "Appraisal price does not always correspond to actual transaction price and may differ across institutions." *(source: BOT, 2026)* |
| **Coverage** | About 61 % of residential transactions by count. *(source: BOT)* |
| **Who is missing** | Purchases without a mortgage. *(inferred: the index is built only from loan contracts.)* Foreign buyers usually pay cash, since Thai mortgages are rarely available to them, so the foreign-quota segment is thinly covered. *(inferred)* |
| **Method** | Time-dummy hedonic regression. It controls for size, building age, floor count, developer, and location (distance to BTS/MRT, CBD, landmarks). *(source: BOT)* |
| **Output** | An index of **price change over time**. It gives no price level for a building or a unit. *(source: BOT method)* |
| **Condo coverage** | Bangkok and vicinity only. *(source: BOT)* |

The BOT also evaluated other sources. It assessed online asking prices from a data
vendor (Baania), half-yearly agent surveys (AREA, CBRE) and Land Department official
appraisal values, then retained the mortgage appraisal data. *(source: BOT, 2026)*

**What we take from it.** The BOT index is the best public measure of the **trend**.
That is why our appreciation scenario uses it (condo index, about +3.1 % a year). It
cannot tell you whether a specific unit is priced 25 % above or below its neighbours.

## 2. The other public sources: also aggregated

| Source | What it publishes | Limit for unit-level pricing |
|---|---|---|
| **Land Department** | Records every registered transfer. | Transfer fees are assessed on the official appraisal value, and the registered price is often aligned with it. Prices are not published unit by unit. *(to verify)* |
| **REIC** (Real Estate Information Center, a public agency) | Quarterly price index for **new** condominiums offered for sale, plus transfer volumes. *(source: REIC releases as reported by the Bangkok Post)* | Covers new supply, not resale. Aggregated by zone. |

## 3. What this means for our maths

1. **We compare within the building.** A unit is benchmarked against comparable units of
   the same building (size, floor, view, condition). Location, developer and building
   age are then held constant by construction, which is what the BOT model has to
   approximate statistically.
2. **We measure asking prices continuously.** Tracking 123,345 active listings, updated
   daily, shows the spread of prices in each building. Within one building, units of
   the same layout show gaps of 25–42 %.
3. **We use public indices for the trend only.** Appreciation scenarios rest on the BOT
   condo index. They never rest on our own asking-price data.
4. **Asking prices are not transaction prices.** The platform measures the spread of
   asking prices. The discount actually obtained is set by the price agreed in the
   purchase contract, compared with the building median.

## Sources

- Bank of Thailand, *Statistical article: Residential Property Price Index*, December 2023 —
  https://www.bot.or.th/th/research-and-publications/articles-and-publications/articles/statistical-articles/Stat_Article_01dec23.html
- K. Samritpiam & P. Chongprasoplarp (Bank of Thailand), *The development of the Bank of
  Thailand's RPPI*, International Conference on Real Estate Statistics, Tokyo, February
  2026 — https://cures.hias.hit-u.ac.jp/wp-content/uploads/2026/02/BOT_RPPI_Final.pdf
- Bangkok Post, *Bangkok condo price index up 3.4 %* (REIC new-condo index, Q1 2025).
