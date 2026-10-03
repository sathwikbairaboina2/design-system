#!/usr/bin/env bash
# Builds the pinned Playwright image and compares (or with --update, rewrites) the committed visual baselines.
set -euo pipefail
root="$(cd "$(dirname "$0")/.." && pwd)"
mount_root="$(cd "$root" && (pwd -W 2>/dev/null || pwd))"
mkdir -p "$root/tests/visual/__screenshots__" "$root/tests/visual/results"
docker build -f "$root/docker/visual.Dockerfile" -t design-system-visual "$root"
extra=()
if [ "${1:-}" = "--update" ]; then extra+=(--update-snapshots); fi
MSYS_NO_PATHCONV=1 docker run --rm --name design-system-visual --ipc=host \
  -v "$mount_root/tests/visual/__screenshots__:/work/tests/visual/__screenshots__" \
  -v "$mount_root/tests/visual/results:/work/tests/visual/results" \
  design-system-visual "${extra[@]}"
