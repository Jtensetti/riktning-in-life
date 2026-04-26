#!/usr/bin/env bash
# Copy-tone guard. Fails if any blocked phrase appears in user-facing
# copy (Swedish strings inside double-quoted literals or JSX text).
# Internal identifiers like StreakRing/StreakCounts are intentionally
# allowed — only the visible Swedish phrases are policed.

set -euo pipefail

# Phrases must match the BLOCKED_PHRASES constant in src/lib/tone.ts.
PHRASES=(
  '"[^"]*streak[^"]*"'        # "streak" inside a double-quoted string
  "perfekt dag"
  "optimera"
  "missat mål"
  "du borde"
)

SCAN_PATHS=("src" "supabase/functions")
EXCLUDES=(
  "--glob=!src/lib/tone.ts"
  "--glob=!src/lib/streaks.ts"
  "--glob=!src/lib/todayLayout.ts"
  "--glob=!src/components/StreakRing.tsx"
  "--glob=!src/pages/Today.tsx"
  "--glob=!src/test/**"
  "--glob=!scripts/**"
)

violations=0
for phrase in "${PHRASES[@]}"; do
  if rg -n -i --no-heading "${EXCLUDES[@]}" -- "$phrase" "${SCAN_PATHS[@]}" 2>/dev/null; then
    echo "  ↑ blocked phrase pattern: $phrase"
    violations=$((violations + 1))
  fi
done

if [ "$violations" -gt 0 ]; then
  echo ""
  echo "✗ Tone guard failed: $violations blocked pattern(s) found."
  exit 1
fi

echo "✓ Tone guard: no blocked user-facing phrases."
