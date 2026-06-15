# Arcore — Supabase connection

Project linked to GitHub repo: [oarvladlen/arcore-bjj](https://github.com/oarvladlen/arcore-bjj)

Live app: **https://oarvladlen.github.io/arcore-bjj/**

---

## Project identifiers

| Field | Value |
|-------|--------|
| **Project ref** | `acoilxssyjmwmmbaoytp` |
| **Project URL** | `https://acoilxssyjmwmmbaoytp.supabase.co` |
| **Publishable key** | `sb_publishable_9DN3os-p4-usvpeGyAHbpg_4ZU7QaS9` |
| **Dashboard** | https://supabase.com/dashboard/project/acoilxssyjmwmmbaoytp |

> The publishable key is safe in the browser (same role as legacy `anon` JWT).  
> **Never** commit secret keys (`sb_secret_...`) or the database password.

---

## PostgreSQL (direct)

```
postgresql://postgres:[YOUR-PASSWORD]@db.acoilxssyjmwmmbaoytp.supabase.co:5432/postgres
```

Password: **Supabase Dashboard → Project Settings → Database → Database password**  
(Reset there if you don’t have it.)

Pooler (IPv4 / serverless):

```
postgresql://postgres.acoilxssyjmwmmbaoytp:[YOUR-PASSWORD]@aws-0-sa-east-1.pooler.supabase.com:6543/postgres
```

Region may differ — confirm under **Database → Connection string**.

---

## Apply database schema (required once)

Tables are **not** created until you run the SQL. Choose one method:

### A — SQL Editor (fastest)

1. Open https://supabase.com/dashboard/project/acoilxssyjmwmmbaoytp/sql/new  
2. Paste and **Run** `supabase/schema.sql`  
3. Paste and **Run** `supabase/schema-auth.sql`

### B — Supabase CLI

```bash
cd arcore
supabase login
supabase link --project-ref acoilxssyjmwmmbaoytp
supabase db push
```

Migrations live in `supabase/migrations/` (same content as the two SQL files above).

### C — psql

```bash
export PGPASSWORD='your-db-password'
psql "postgresql://postgres@db.acoilxssyjmwmmbaoytp.supabase.co:5432/postgres" \
  -f supabase/schema.sql
psql "postgresql://postgres@db.acoilxssyjmwmmbaoytp.supabase.co:5432/postgres" \
  -f supabase/schema-auth.sql
```

**Verify:** in SQL Editor run `select count(*) from members;` — should return `10`.

---

## Auth (magic link)

**Dashboard → Authentication → URL Configuration**

| Setting | Value |
|---------|--------|
| Site URL | `https://oarvladlen.github.io/arcore-bjj/` |
| Redirect URLs | `https://oarvladlen.github.io/arcore-bjj/**` |
| | `http://localhost:8000/**` (local dev) |

**Providers → Email:** enabled (magic link).

### Invite users

**Authentication → Users → Invite**, with metadata:

Aluno:

```json
{ "role": "member", "member_id": "m_joao" }
```

Professor:

```json
{ "role": "coach" }
```

Or after signup:

```sql
update profiles set member_id = 'm_joao' where email = 'aluno@email.com';
update profiles set role = 'coach' where email = 'professor@email.com';
```

Demo member IDs: `m_joao`, `m_pedro`, `m_ana`, … (see seed in `schema.sql`).

---

## Local development

```bash
cd arcore
export SUPABASE_URL=https://acoilxssyjmwmmbaoytp.supabase.co
export SUPABASE_PUBLISHABLE_KEY=sb_publishable_9DN3os-p4-usvpeGyAHbpg_4ZU7QaS9
export AUTH_REDIRECT_URL=http://localhost:8000/
node scripts/inject-config.mjs   # writes config.js (gitignored)
python3 -m http.server 8000
```

Open http://localhost:8000 — login screen asks for **email** (not demo role picker).

---

## GitHub Actions (production deploy)

Secrets on **https://github.com/oarvladlen/arcore-bjj/settings/secrets/actions**:

| Secret | Value |
|--------|--------|
| `SUPABASE_URL` | `https://acoilxssyjmwmmbaoytp.supabase.co` |
| `SUPABASE_ANON_KEY` | `sb_publishable_9DN3os-p4-usvpeGyAHbpg_4ZU7QaS9` |
| `AUTH_REDIRECT_URL` | `https://oarvladlen.github.io/arcore-bjj/` |

After changing secrets: **Actions → Deploy Arcore → Run workflow**.

The app uses `SUPABASE_ANON_KEY` for the publishable key (same client slot as legacy anon JWT).

---

## App config mapping

In `config.js` (generated, not committed):

```js
supabase: {
  url: 'https://acoilxssyjmwmmbaoytp.supabase.co',
  anonKey: 'sb_publishable_9DN3os-p4-usvpeGyAHbpg_4ZU7QaS9',
},
auth: {
  enabled: true,
  redirectUrl: 'https://oarvladlen.github.io/arcore-bjj/',
},
```

---

## CLI quick reference

```bash
supabase login
cd arcore && supabase link --project-ref acoilxssyjmwmmbaoytp
supabase db push                    # apply migrations
supabase db diff                    # schema diff
supabase projects api-keys --project-ref acoilxssyjmwmmbaoytp
```

---

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| `Could not find table 'members'` | Run schema SQL (section above) |
| Magic link doesn’t log in | Match Redirect URLs exactly |
| “Conta sem aluno vinculado” | Set `member_id` on `profiles` |
| 401 on REST | Use publishable key in `apikey` header |
| Demo mode on live site | Re-run deploy workflow after GitHub secrets are set |

---

## Security checklist

- [ ] Schema + auth SQL applied  
- [ ] Auth redirect URLs configured  
- [ ] GitHub secrets set (no secrets in git)  
- [ ] Secret key (`sb_secret_...`) only on server — never in `config.js`  
- [ ] Database password only in password manager / CI, not in repo
