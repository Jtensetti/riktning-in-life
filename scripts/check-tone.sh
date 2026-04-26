#!/usr/bin/env bash
# Copy-tone guard. Fails CI if any blocked phrase reappears in src/ or
# supabase edge functions. Phrases come from src/lib/tone.ts
# (BLOCKED_PHRASES). Keep this script in sync with that constant.

set -euo pipefail

PHRASES=(
  "streak"
  "perfekt dag"
  "optimera"
  "missat mål"
  "du borde"
)

# Restrict to user-facing source (skip tests + tone.ts itself which
# legitimately contains the blocked words as data).
SCAN_PATHS=("src" "supabase/functions")
EXCLUDES=(
  "--glob=!src/lib/tone.ts"
  "--glob=!src/test/**"
  "--glob=!scripts/**"
)

violations=0
for phrase in "${PHRASES[@]}"; do
  if rg -n -i --no-heading "${EXCLUDES[@]}" -- "$phrase" "${SCAN_PATHS[@]}" 2>/dev/null; then
    echo "  ↑ blocked phrase: \"$phrase\""
    violations=$((violations + 1))
  fi
done

if [ "$violations" -gt 0 ]; then
  echo ""
  echo "✗ Tone guard failed: $violations blocked phrase(s) found."
  exit 1
fi

echo "✓ Tone guard: no blocked phrases."
