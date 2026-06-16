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

## Why `/rest/v1/` is not enough

The URL `https://acoilxssyjmwmmbaoytp.supabase.co/rest/v1/` is **PostgREST** — it only reads/writes **existing** tables (`GET /members`, `POST /checkins`, etc.).

It **cannot** run migrations (`CREATE TABLE`, RLS policies, triggers). Hitting the root returns:

```json
{ "message": "Secret API key required" }
```

That endpoint is the OpenAPI schema browser, not an admin console.

| Credential | Can create tables? | What you gave |
|------------|-------------------|---------------|
| Publishable key `sb_publishable_...` | No — client API only | Yes |
| REST `/rest/v1/` | No — needs tables first | — |
| Database password + `psql` | **Yes** | Placeholder only `[YOUR-PASSWORD]` |
| Access token `sbp_...` + Management API | **Yes** | Not provided |
| `supabase login` + `db push` | **Yes** | Not logged in on this machine |

To let automation apply schema, provide **one** of:

1. **Access token** — https://supabase.com/dashboard/account/tokens → then:
   ```bash
   export SUPABASE_ACCESS_TOKEN=sbp_...
   node scripts/apply-schema-api.mjs
   ```
2. **Database password** — Dashboard → Settings → Database:
   ```bash
   export PGPASSWORD='...'
   psql "postgresql://postgres@db.acoilxssyjmwmmbaoytp.supabase.co:5432/postgres" -f arcore/supabase/schema.sql
   psql "postgresql://postgres@db.acoilxssyjmwmmbaoytp.supabase.co:5432/postgres" -f arcore/supabase/schema-auth.sql
   ```

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

> **Status:** Schema applied via Management API. Auth redirect URLs set to `https://oarvladlen.github.io/arcore-bjj/**`.

---

## Auth (e-mail + senha + confirmação)

**Serviço:** [Supabase Auth](https://supabase.com/docs/guides/auth) — sem custo extra. E-mails de confirmação saem pelo mailer do Supabase (limite grátis) ou **SMTP customizado** (recomendado em produção: Resend, SendGrid, etc.) em **Authentication → Email Templates → SMTP**.

**Dashboard → Authentication → URL Configuration**

| Setting | Value |
|---------|--------|
| Site URL | `https://oarvladlen.github.io/arcore-bjj/` |
| Redirect URLs | `https://oarvladlen.github.io/arcore-bjj/**` |
| | `http://localhost:8000/**` (local dev) |

**Confirm email:** Dashboard → Authentication → Providers → Email → **Confirm email** ON  
(or run `SUPABASE_ACCESS_TOKEN=sbp_... node scripts/configure-supabase-auth.mjs`)

### Fluxo no app

**Professor**
1. Link secreto (não aparece no login público): `https://oarvladlen.github.io/arcore-bjj/?password=SUA_SENHA`
2. Abre o link → entra automaticamente (e-mail oculto: `professor@arcore.com`)
3. **Alunos → Adicionar aluno** → nome, e-mail, celular (WhatsApp)
4. Aluno recebe e-mail de convite + professor pode enviar link no WhatsApp

**Aluno**
1. Login normal: e-mail + senha (sem aba de professor)
2. Primeira vez: clica no link do convite (`?invite=TOKEN`)
3. Confirma celular → cria senha → aceita avisos WA/e-mail
4. Confirma e-mail → entra no app

**Serviço de e-mail:** Supabase Auth (grátis) ou SMTP customizado (Resend, SendGrid) para marketing em escala.

### Criar conta do professor

Dashboard → **Authentication → Users → Add user**:
- Auto Confirm: **ON**
- Metadata: `{ "role": "coach", "display_name": "Mestre Ricardo" }`

Ou: `SUPABASE_SERVICE_ROLE_KEY=... node scripts/create-coach.mjs professor@academia.com Senha123`

### Edge Function (convite por e-mail)

Deploy once:

```bash
cd arcore
supabase functions deploy invite-student --project-ref acoilxssyjmwmmbaoytp
```

Set secrets: `APP_URL=https://oarvladlen.github.io/arcore-bjj/`

### Convidar aluno (legado manual)

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

- [x] Schema + auth SQL applied  
- [x] Auth redirect URLs configured  
- [x] GitHub secrets set (no secrets in git)  
- [ ] Secret key (`sb_secret_...`) only on server — never in `config.js`  
- [ ] Database password only in password manager / CI, not in repo  
- [ ] Rotate any access tokens shared in chat
