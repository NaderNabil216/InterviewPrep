#!/usr/bin/env bash
# Serve the prep site locally. The app fetches JSON content packs, which browsers
# block over file://, so it must run over http://localhost.
set -euo pipefail

PORT="${1:-8777}"
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

cd "$DIR"
exec python3 tools/serve.py "$PORT"
