#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# LOWI — Chalok Villa NFT · Déploiement Sui Testnet
# 10 participants fantômes · 72 parts mintées / 128
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

echo "=== 1. Réseau testnet ==="
sui client switch --env testnet

echo "=== 2. Faucet ==="
sui client faucet && sleep 4

echo "=== 3. Build ==="
sui move build

echo "=== 4. Publish ==="
PUBLISH_OUTPUT=$(sui client publish --gas-budget 200000000 --json)
echo "$PUBLISH_OUTPUT" | jq .

PACKAGE_ID=$(   echo "$PUBLISH_OUTPUT" | jq -r '.objectChanges[] | select(.type=="published") | .packageId')
COLLECTION_ID=$(echo "$PUBLISH_OUTPUT" | jq -r '.objectChanges[] | select(.objectType | test("Collection"))  | .objectId')
ADMIN_CAP_ID=$( echo "$PUBLISH_OUTPUT" | jq -r '.objectChanges[] | select(.objectType | test("AdminCap"))   | .objectId')

echo ""
echo "Package    : $PACKAGE_ID"
echo "Collection : $COLLECTION_ID"
echo "AdminCap   : $ADMIN_CAP_ID"
echo ""

# ─────────────────────────────────────────────────────────────────────────────
# 10 participants fantômes
# Adresses Sui testnet générées — ne correspondent à aucun wallet réel
# FORMAT : "NOM|ADRESSE|PARTS"
# Total : 72 parts / 128  (56 encore disponibles)
# ─────────────────────────────────────────────────────────────────────────────
PARTICIPANTS=(
  "Sophie Marchand|0xa1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2|10"
  "Thomas Bergmann|0xb2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3|8"
  "Julien Rousseau|0xc3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4|10"
  "Marco Ferretti|0xd4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5|5"
  "Anna Kowalski|0xe5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6|7"
  "David Lefebvre|0xf6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7|8"
  "Pierre Vandenberg|0xa7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8|5"
  "Elena Dubois|0xb8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9|9"
  "Romain Petit|0xc9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0|6"
  "Nathalie Chen|0xd0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1|4"
)
# Note: Nathalie Chen a 4 parts — waiver du minimum accordé (investisseur early)

echo "=== 5. Mint 10 participants (72 parts) ==="
for ENTRY in "${PARTICIPANTS[@]}"; do
  IFS='|' read -r NAME ADDR PARTS <<< "$ENTRY"
  echo "→ Mint $PARTS part(s) pour $NAME ($ADDR)"
  NAME_HEX=$(echo -n "$NAME" | xxd -p | tr -d '\n')
  sui client call \
    --package  "$PACKAGE_ID" \
    --module   "chalok_villa_nft" \
    --function "mint" \
    --args     "$ADMIN_CAP_ID" "$COLLECTION_ID" "$PARTS" "0x${NAME_HEX}" "$ADDR" \
    --gas-budget 20000000
done

echo ""
echo "=== 6. Simulation : Q1 2026 — 117 nuits louées ==="
echo "    Revenu brut estimé : 936 000 THB"
echo "    Plafond 8% × 72 parts × 2 000 THB/trim = 144 000 THB"
echo "    → Distribué : 144 000 THB | Réserve : +792 000 THB"
sui client call \
  --package  "$PACKAGE_ID" \
  --module   "chalok_villa_nft" \
  --function "record_quarter_income" \
  --args     "$ADMIN_CAP_ID" "$COLLECTION_ID" 936000 \
  --gas-budget 10000000

echo ""
echo "=== 7. État de la collection ==="
sui client object "$COLLECTION_ID" --json | jq '.content.fields | {minted, quarter, distributed_thb, reserve_thb, finalized}'

echo ""
echo "=== Déploiement terminé ==="
echo "Explorer : https://suiscan.xyz/testnet/object/$PACKAGE_ID"
echo "Collection: https://suiscan.xyz/testnet/object/$COLLECTION_ID"
