#!/usr/bin/env bash
# Arcore — create GitHub repo, push, create Supabase project, deploy Netlify
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ARCORE="$ROOT/arcore"
REPO_NAME="${REPO_NAME:-arcore-bjj}"
GITHUB_USER="${GITHUB_USER:-oarvladlen}"

: "${GH_TOKEN:?Set GH_TOKEN (GitHub PAT with repo scope)}"

export GH_TOKEN
cd "$ROOT"

# --- Git commit if needed ---
if ! git rev-parse HEAD >/dev/null 2>&1; then
  git add -A
  git commit -m "$(cat <<'EOF'
Initial production-ready Arcore PWA.

Supabase Auth, production RLS, Netlify/Vercel deploy config.
EOF
)"
fi

# --- GitHub repo ---
if ! git remote get-url origin >/dev/null 2>&1; then
  gh repo create "$GITHUB_USER/$REPO_NAME" --public --source=. --remote=origin --push
else
  git push -u origin HEAD
fi

REPO_URL="https://github.com/$GITHUB_USER/$REPO_NAME"
echo "Repo: $REPO_URL"

# --- Supabase (optional but required for prod) ---
if [[ -n "${SUPABASE_ACCESS_TOKEN:-}" ]]; then
  export SUPABASE_ACCESS_TOKEN
  PROJECT_REF="${SUPABASE_PROJECT_REF:-}"
  if [[ -z "$PROJECT_REF" ]]; then
    echo "Creating Supabase project..."
    PROJECT_REF=$(supabase projects create "$REPO_NAME" --org-id "${SUPABASE_ORG_ID:?Set SUPABASE_ORG_ID}" --db-password "${SUPABASE_DB_PASSWORD:?Set SUPABASE_DB_PASSWORD}" --region sa-east-1 -o json | python3 -c "import sys,json; print(json.load(sys.stdin)['id'])")
  fi
  supabase link --project-ref "$PROJECT_REF"
  supabase db push --file "$ARCORE/supabase/schema.sql" || true
  psql "$(supabase db url)" -f "$ARCORE/supabase/schema.sql" 2>/dev/null || \
    supabase db execute --file "$ARCORE/supabase/schema.sql"
  supabase db execute --file "$ARCORE/supabase/schema-auth.sql"

  SUPABASE_URL=$(supabase projects api-keys --project-ref "$PROJECT_REF" -o json | python3 -c "import sys,json; print(json.load(sys.stdin)[0]['api_url'])")
  SUPABASE_ANON_KEY=$(supabase projects api-keys --project-ref "$PROJECT_REF" -o json | python3 -c "import sys,json; [print(k['api_key']) for k in json.load(sys.stdin) if k['name']=='anon']")
  export SUPABASE_URL SUPABASE_ANON_KEY
fi

# --- Netlify deploy ---
if [[ -n "${NETLIFY_AUTH_TOKEN:-}" ]]; then
  cd "$ARCORE"
  export SUPABASE_URL="${SUPABASE_URL:-}"
  export SUPABASE_ANON_KEY="${SUPABASE_ANON_KEY:-}"
  node scripts/inject-config.mjs
  netlify deploy --prod --dir . --site-name "$REPO_NAME" --auth "$NETLIFY_AUTH_TOKEN" \
    --message "Arcore production deploy"
  echo "Netlify site: https://$REPO_NAME.netlify.app"
  if [[ -n "${SUPABASE_URL:-}" ]]; then
    echo "Update Supabase Auth redirect URLs to: https://$REPO_NAME.netlify.app/"
  fi
else
  echo "Skip Netlify (set NETLIFY_AUTH_TOKEN). Connect repo at netlify.com → Import from Git → base: arcore"
fi

echo "Done."
