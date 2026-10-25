#!/usr/bin/env bash
# PreToolUse (Bash): before any `git push`, run the checks CLAUDE.md requires
# and make sure CACHE_VERSION was bumped when precached files changed.
# Exit 2 blocks the push and shows stderr to Claude.
cmd=$(jq -r '.tool_input.command // empty')
echo "$cmd" | grep -qE '(^|[;&|[:space:]])(rtk[[:space:]]+)?git[[:space:]]+push' || exit 0

cd "$CLAUDE_PROJECT_DIR" || exit 0

if ! out=$(npm test 2>&1); then
  echo "Push bloqueado: npm test falla." >&2
  echo "$out" | tail -n 20 >&2
  exit 2
fi
if ! out=$(npm run validate 2>&1); then
  echo "Push bloqueado: npm run validate falla." >&2
  echo "$out" | tail -n 20 >&2
  exit 2
fi

# Commits about to be pushed: against the upstream, or origin/main for a new branch.
base=$(git rev-parse --abbrev-ref --symbolic-full-name '@{u}' 2>/dev/null || echo origin/main)
range="$(git merge-base "$base" HEAD)..HEAD"
changed=$(git diff --name-only "$range")
[ -n "$changed" ] || exit 0

# Precached files come from PRECACHE_URLS in service-worker.js ("./x" -> "x").
cached=$(grep -oE '"\./[^"]+"' service-worker.js | tr -d '"' | sed 's#^\./##' | grep -v '^$')
hit=$(printf '%s\n' "$changed" | grep -Fxf <(printf '%s\n' "$cached"))
if [ -n "$hit" ] && ! git diff "$range" -- service-worker.js | grep -qE '^\+.*CACHE_VERSION *='; then
  echo "Push bloqueado: cambiaron archivos cacheados y CACHE_VERSION no subió en service-worker.js:" >&2
  printf '  %s\n' $hit >&2
  exit 2
fi
exit 0
