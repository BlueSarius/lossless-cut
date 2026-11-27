#!/usr/bin/env bash
# Re-export fork/changes/*/NN-*.patch from the commits on the current branch.
# Usage: fork/export-patches.sh <upstream-base>
#   <upstream-base> = the upstream commit/tag the current branch was rebuilt on.
# Every commit in <upstream-base>..HEAD carrying a "Fork-Change: <id>" trailer is exported into fork/changes/<id>/.
# Commits without the trailer (fork-owned files, yarn.lock, merges) are skipped.
set -euo pipefail
base=${1:?usage: fork/export-patches.sh <upstream-base>}
root=$(git rev-parse --show-toplevel)
cd "$root"

declare -A count=()
commits=$(git rev-list --reverse --no-merges "$base"..HEAD)

# remove old patches only for changes that are about to be re-exported
for c in $commits; do
  id=$(git log -1 --format='%(trailers:key=Fork-Change,valueonly)' "$c" | head -1 | tr -d '[:space:]')
  [ -n "$id" ] && [ -d "fork/changes/$id" ] && rm -f "fork/changes/$id"/*.patch
done

for c in $commits; do
  id=$(git log -1 --format='%(trailers:key=Fork-Change,valueonly)' "$c" | head -1 | tr -d '[:space:]')
  [ -z "$id" ] && continue
  mkdir -p "fork/changes/$id"
  n=$(( ${count[$id]:-0} + 1 )); count[$id]=$n
  name=$(printf '%02d-%s.patch' "$n" "$(git log -1 --format=%f "$c" | cut -c1-60)")
  git format-patch -1 --stdout --zero-commit --no-signature "$c" -- . ':!yarn.lock' > "fork/changes/$id/$name"
  echo "exported $id/$name"
done
