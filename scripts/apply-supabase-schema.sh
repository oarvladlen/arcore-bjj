#!/usr/bin/env bash
# Apply Arcore schema to linked Supabase project (requires: supabase login + link)
set -euo pipefail
cd "$(dirname "$0")/../arcore"
: "${SUPABASE_ACCESS_TOKEN:?Run supabase login first, or export SUPABASE_ACCESS_TOKEN}"

if [[ ! -f supabase/.temp/project-ref ]]; then
  supabase link --project-ref acoilxssyjmwmmbaoytp
fi

echo "Pushing migrations..."
supabase db push

echo "Done. Verify: select count(*) from members;"
