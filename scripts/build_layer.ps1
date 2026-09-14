# build_layer.ps1 — Build the NeighborNode PDF Lambda Layer (Windows)
# Run from project root:
#   powershell -ExecutionPolicy Bypass -File scripts\build_layer.ps1

$ErrorActionPreference = "Stop"

$LayerDir = "layer\python"
$LayerZip = "layer\layer.zip"

Write-Host "[build_layer] Cleaning previous build..."
if (Test-Path "layer") { Remove-Item -Recurse -Force "layer" }
New-Item -ItemType Directory -Force -Path $LayerDir | Out-Null

Write-Host "[build_layer] Installing PDF dependencies..."
pip install reportlab markdown2 --target $LayerDir --quiet

Write-Host "[build_layer] Zipping layer..."
Compress-Archive -Path "layer\python" -DestinationPath $LayerZip -Force

Write-Host "[build_layer] Done. Layer zip: $LayerZip"
Write-Host "[build_layer] Run 'sam deploy' to include the layer in your stack."
