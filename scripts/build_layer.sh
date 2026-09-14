#!/usr/bin/env bash
# build_layer.sh — Build the NeighborNode PDF Lambda Layer
# Creates layer/python/ with reportlab + markdown2, zipped as layer.zip
#
# Run from project root:
#   bash scripts/build_layer.sh
#
# Then deploy with:
#   sam deploy (template.yaml includes the layer automatically)

set -euo pipefail

LAYER_DIR="layer/python"
LAYER_ZIP="layer/layer.zip"

echo "[build_layer] Cleaning previous build..."
rm -rf layer/
mkdir -p "$LAYER_DIR"

echo "[build_layer] Installing PDF dependencies into $LAYER_DIR..."
pip install reportlab markdown2 --target "$LAYER_DIR" --quiet

echo "[build_layer] Zipping layer..."
(cd layer && zip -r layer.zip python/ -q)

echo "[build_layer] Done. Layer zip: $LAYER_ZIP"
echo "[build_layer] Upload to S3 or run 'sam deploy' to include the layer."
