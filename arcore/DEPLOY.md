# Arcore — Deploy em produção

Guia passo a passo para colocar o PWA no ar com **Supabase Auth** (magic link) e HTTPS.

---

## Pré-requisitos

- Conta [Supabase](https://supabase.com) (grátis)
- Conta [Netlify](https://netlify.com) ou [Vercel](https://vercel.com) (grátis)
- Git (recomendado)

---

## 1. Banco de dados (Supabase)

1. Crie um projeto em **supabase.com**.
2. **SQL Editor** → cole e rode **`supabase/schema.sql`** (tabelas + seed + storage).
3. Rode **`supabase/schema-auth.sql`** (profiles + RLS de produção).
4. **Authentication → URL Configuration**:
   - **Site URL**: `https://SEU-DOMINIO.netlify.app` (ou localhost para testes)
   - **Redirect URLs**: adicione a mesma URL + `http://localhost:8000`
5. **Authentication → Providers → Email**: deixe **Enable Email** ligado (magic link).

### Convidar usuários

No **Dashboard → Authentication → Users → Invite user**, use **User Metadata**:

**Aluno** (vincula ao registro em `members`):

```json
{ "role": "member", "member_id": "m_joao" }
```

**Professor**:

```json
{ "role": "coach" }
```

Ou após o primeiro login:

```sql
update profiles set role = 'coach' where email = 'professor@academia.com';
update profiles set member_id = 'm_joao' where email = 'joao@email.com';
```

---

## 2. Config local (teste antes do deploy)

Copie o exemplo e preencha:

```bash
cd arcore
cp config.example.js config.js
# Edite config.js: url, anonKey do Supabase (Settings → API)
```

Suba localmente:

```bash
python3 -m http.server 8000
# Abra http://localhost:8000
```

Com Supabase configurado, o app exige login por e-mail (não mostra mais o seletor demo).

Para **modo demo local** sem auth: deixe `url`/`anonKey` vazios, ou `auth.enabled: false`.

---

## 3. Deploy — Netlify (recomendado)

1. Suba o repo no GitHub (pasta `arcore/` como root do site, ou aponte o Netlify para `arcore/`).
2. **Netlify → Add new site → Import from Git**.
3. **Base directory**: `arcore`
4. **Build command**: `node scripts/inject-config.mjs`
5. **Publish directory**: `.` (dentro de arcore)
6. **Environment variables** (Site settings → Environment):

| Variável | Valor |
|----------|--------|
| `SUPABASE_URL` | `https://xxxx.supabase.co` |
| `SUPABASE_ANON_KEY` | `eyJhbGciOi...` |
| `AUTH_REDIRECT_URL` | `https://seu-site.netlify.app/` |

7. Deploy. O build gera `config.js` com as chaves (não commitado).

---

## 4. Deploy — Vercel

1. Importe o repo na Vercel.
2. **Root Directory**: `arcore`
3. Framework: **Other**
4. Build: `node scripts/inject-config.mjs`
5. Output: `.`
6. Adicione as mesmas env vars (`SUPABASE_URL`, `SUPABASE_ANON_KEY`, `AUTH_REDIRECT_URL`).

---

## 5. Deploy — manual (drag & drop)

```bash
cd arcore
export SUPABASE_URL=https://xxxx.supabase.co
export SUPABASE_ANON_KEY=eyJ...
node scripts/inject-config.mjs
# Faça upload da pasta arcore/ no Netlify Drop ou Cloudflare Pages
```

---

## 6. PWA / HTTPS

- Netlify e Vercel já servem **HTTPS** — obrigatório para gravação de voz e instalação.
- No celular: abra o site → **Instalar app** / **Adicionar à Tela de Início**.

---

## 7. Checklist pós-deploy

- [ ] Magic link chega no e-mail e abre o app logado
- [ ] Aluno vê feed, check-in, progresso (dados do `member_id` vinculado)
- [ ] Professor vê CRM, posta técnica, dá selos
- [ ] Recado de voz sobe pro bucket `voicenotes`
- [ ] Site URL e Redirect URLs no Supabase batem com o domínio final

---

## Segurança

- **Nunca** commite `config.js` com chaves reais (está no `.gitignore`).
- A **anon key** é pública no front-end — a proteção vem das **RLS policies** em `schema-auth.sql`.
- Só convide e-mails reais; professors via metadata `role: coach`.

---

## Troubleshooting

| Problema | Solução |
|----------|---------|
| Link mágico não loga | Confira Redirect URLs no Supabase |
| "Conta sem aluno vinculado" | `update profiles set member_id = 'm_...'` |
| Erro 401 nas queries | Rode `schema-auth.sql`; usuário precisa estar logado |
| Gravação de voz falha | Precisa HTTPS (não funciona em `file://`) |
