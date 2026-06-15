# Arcore — app da academia (PWA) + CRM do professor

Um único PWA, mobile-first, em **pt-BR**, para a academia de Jiu-Jítsu **Arcore (Santos)**.
Roda **100% funcional agora** (modo local) e pode ligar a um **backend real (Supabase)** trocando duas chaves.

- **Aluno**: feed das técnicas de cada aula (vídeo embutido + recado de voz do professor), check-in, progressão de faixa/grau, metas, selos e ranking semanal.
- **Professor**: CRM (lista de alunos, status, presença), fila de **win-back** (quem sumiu → WhatsApp em 1 toque), **postar técnica** (link de vídeo + gravar recado de voz) e **dar selos**.

É a Fase 2–3 do roadmap (retenção + gamificação) num app só, com "acesso professor".

---

## 1. Rodar agora (local, sem backend)

Precisa servir os arquivos por HTTP (o service worker e a gravação de áudio não funcionam abrindo o arquivo direto). Dentro da pasta `arcore/`:

```bash
# opção A — Python (já vem no Mac)
python3 -m http.server 8000

# opção B — Node
npx serve -l 8000
```

Abra **http://localhost:8000** no navegador (de preferência o celular na mesma rede, ou as ferramentas de dispositivo do Chrome).

Na tela de entrada escolha **Sou Aluno** ou **Sou Professor**. Os dados de demonstração já estão lá. Tudo que você faz (check-in, salvar técnica, postar, dar selo) é salvo **no próprio aparelho** (IndexedDB). Para zerar: menu do perfil (canto superior direito) → **Reiniciar demonstração**.

> Dica: você pode trocar de papel a qualquer momento pelo botão de perfil → "Ver como aluno" / "Entrar como professor".

---

## 2. Ligar no Supabase (dados reais, multi-aparelho)

1. Crie um projeto grátis em **supabase.com**.
2. Abra **SQL Editor**, cole o conteúdo de **`supabase/schema.sql`** e clique **RUN**. Isso cria as tabelas, os dados de demonstração, o bucket de áudio (`voicenotes`) e as policies.
3. Em **Project Settings → API**, copie **Project URL** e **anon public key**.
4. Cole em **`config.js`**:

   ```js
   supabase: {
     url: 'https://SEU-PROJETO.supabase.co',
     anonKey: 'eyJhbGciOi...',
   },
   ```

5. Recarregue o app. Pronto — agora lê e grava no Postgres, e os recados de voz vão pro Storage. (A tela de entrada mostra "Conectado à nuvem".)

Se as chaves estiverem em branco, o app volta sozinho para o modo local. Sem drama.

> **Segurança:** as policies do `schema.sql` são **abertas** (qualquer um com a anon key lê/escreve) só para o protótipo andar rápido. Para produção, rode também **`supabase/schema-auth.sql`** — ativa Supabase Auth (magic link) e policies por role. Veja **`DEPLOY.md`**.

---

## 2b. Auth de produção (magic link)

1. Rode **`supabase/schema-auth.sql`** depois do schema base.
2. Configure **Authentication → URL Configuration** no Supabase (Site URL + Redirect URLs).
3. Preencha `url` + `anonKey` em **`config.js`** (ou use env vars no deploy — ver **`DEPLOY.md`**).
4. Convide alunos/professor com metadata `{ "role": "member", "member_id": "m_joao" }` ou `{ "role": "coach" }`.
5. Recarregue — a tela de entrada pede **e-mail** em vez do seletor demo.

---

## 3. Vídeos e recados de voz

- **Vídeos**: o professor **cola um link** (YouTube, Vimeo ou Instagram) ao postar a técnica. O app **embute** o player — **nada de vídeo é enviado nem armazenado** por nós, só o link. (YouTube e Vimeo tocam dentro do app; outros viram um botão "Abrir vídeo ↗".)
- **Recado de voz**: gravado dentro do app (microfone). Exige **https** ou **localhost** (regra do navegador). No modo local fica no aparelho; no modo Supabase sobe pro bucket `voicenotes`.

---

## 4. Instalar como app (PWA)

- **Android / Chrome / Edge / desktop**: abra o site → menu → **Instalar app** (ou aparece um banner "Instalar" na tela inicial). Ícone, splash e modo tela cheia já configurados (`manifest.webmanifest`).
- **iPhone (Safari)**: Compartilhar → **Adicionar à Tela de Início**. O iOS não usa ícone SVG para o atalho; se quiser ícones PNG nítidos no iPhone, rode o gerador opcional:

  ```bash
  python3 tools/make-icons.py     # precisa de Pillow: pip install Pillow
  ```

  Ele cria `icon-192.png`, `icon-512.png` e `apple-touch-icon.png`. Depois é só apontar o `<link rel="apple-touch-icon">` e o manifest para os PNGs.

---

## 5. Publicar (deploy)

Site **estático** com build opcional para injetar chaves Supabase:

- **Netlify / Vercel**: conecte o repo, base `arcore/`, build `node scripts/inject-config.mjs`. Guia completo em **`DEPLOY.md`**.
- **Manual**: `node scripts/inject-config.mjs` com env vars, depois upload da pasta.

HTTPS é obrigatório (gravação de voz + PWA). Netlify/Vercel/Cloudflare Pages servem grátis.

---

## 6. Personalizar

Tudo no topo do **`config.js`**:

- `gym.name`, `gym.tagline` — nome e linha da academia (aparecem no header e na logo).
- `gym.ember`, `gym.gold` — cores da marca.
- `rules` — XP por check-in, aulas por grau, dias para virar "em risco" (gatilho do win-back), etc.

Cores e estilo finos: **`app.css`** (variáveis no `:root`).

---

## 7. Mapa dos arquivos

```
arcore/
├── index.html              # shell do app
├── app.css                 # design system (tema ember/ouro, dark)
├── config.js               # marca + regras + chaves (não commitar em prod)
├── config.example.js       # template para deploy
├── auth.js                 # Supabase Auth (magic link)
├── data.js                 # LocalDB + SupabaseDB
├── app.js                  # telas aluno + CRM professor
├── manifest.webmanifest    # PWA
├── sw.js                   # service worker
├── netlify.toml            # deploy Netlify
├── vercel.json             # deploy Vercel
├── DEPLOY.md               # guia de produção
├── CONNECTION.md           # credenciais + setup Supabase ← leia aqui
├── scripts/
│   └── inject-config.mjs   # gera config.js a partir de env vars
├── supabase/
│   ├── schema.sql          # tabelas + seed (protótipo)
│   └── schema-auth.sql     # auth + RLS produção ← rode em prod
└── tools/
    └── make-icons.py       # (opcional) PNGs p/ iOS
```

---

## 8. Próximos passos (do roadmap)

- **AI voice-note → ficha de técnica**: transcrever o recado e preencher nome/passos/tags sozinho.
- **Cobrança no Pix** (Asaas) e **automação WhatsApp** (n8n + WA Cloud API) puxando os mesmos check-ins (backend compartilhado).
- **Open mat hub** para captar grapplers de fora e fazer cross-sell.
- **White-label** por academia depois de provar a retenção na Arcore.

Feito para uma academia. Prova a retenção → vira produto.
