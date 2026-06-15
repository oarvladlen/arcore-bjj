/* =========================================================================
   Arcore — app (telas do aluno + CRM do professor, num só PWA)
   ========================================================================= */
(function (A) {
  'use strict';
  const CFG = window.ARCORE_CONFIG;
  const U = A.util;
  const COACH = { name: (CFG.gym && CFG.gym.coach) || 'Mestre Ricardo', avatar: 'R' };

  /* ------------------------------- icons -------------------------------- */
  const ICONS = {
    flame:'<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>',
    check:'<path d="M20 6 9 17l-5-5"/>',
    play:'<polygon points="6 3 20 12 6 21 6 3"/>',
    pause:'<rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/>',
    bookmark:'<path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/>',
    bookmarkcheck:'<path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h7"/><path d="m14 7 2 2 4-4"/>',
    heart:'<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>',
    trophy:'<path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/>',
    target:'<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>',
    plus:'<path d="M5 12h14"/><path d="M12 5v14"/>',
    home:'<path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>',
    'trending-up':'<polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/>',
    lock:'<rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
    clock:'<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
    award:'<circle cx="12" cy="8" r="6"/><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/>',
    crown:'<path d="M11.562 3.266a.5.5 0 0 1 .876 0L15.39 8.87a1 1 0 0 0 1.516.294L21.183 5.5a.5.5 0 0 1 .798.519l-2.834 10.246a1 1 0 0 1-.956.734H5.81a1 1 0 0 1-.957-.734L2.02 6.02a.5.5 0 0 1 .798-.519l4.276 3.664a1 1 0 0 0 1.516-.294z"/>',
    zap:'<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>',
    users:'<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
    user:'<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
    clipboard:'<rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>',
    mic:'<path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/>',
    square:'<rect width="14" height="14" x="5" y="5" rx="2"/>',
    send:'<path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/>',
    x:'<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
    search:'<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
    'chevron-right':'<path d="m9 18 6-6-6-6"/>',
    'chevron-left':'<path d="m15 18-6-6 6-6"/>',
    bell:'<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>',
    mail:'<rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>',
    'log-out':'<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/>',
    alert:'<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/>',
    'message-circle':'<path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/>',
    video:'<path d="m22 8-6 4 6 4V8Z"/><rect width="14" height="12" x="2" y="6" rx="2" ry="2"/>',
    refresh:'<path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/>',
    sparkles:'<path d="M9.94 14.5A2 2 0 0 0 8.5 13.06l-5.6-1.45a.5.5 0 0 1 0-.96L8.5 9.2A2 2 0 0 0 9.94 7.76l1.45-5.6a.5.5 0 0 1 .96 0l1.45 5.6A2 2 0 0 0 15.24 9.2l5.6 1.45a.5.5 0 0 1 0 .96l-5.6 1.45a2 2 0 0 0-1.44 1.44l-1.45 5.6a.5.5 0 0 1-.96 0z"/>',
    download:'<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/>',
  };
  function icon(name, size) {
    const s = size || 20;
    return '<svg width="' + s + '" height="' + s + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
      'stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + (ICONS[name] || '') + '</svg>';
  }
  A.icon = icon;

  /* ----------------------------- helpers -------------------------------- */
  const $ = (sel, root) => (root || document).querySelector(sel);
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const firstName = (n) => String(n || '').trim().split(/\s+/)[0] || '';
  const noAccent = (s) => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '');
  const hourLabel = (iso) => { const d = new Date(iso); return d.getHours() + 'h' + String(d.getMinutes()).padStart(2, '0'); };
  const BELT_ORDER = ['branca', 'azul', 'roxa', 'marrom', 'preta'];

  let state = { db: null, session: null, screen: 'inicio', memberId: 'm_joao', member: null, deferredPrompt: null, authPending: false, authSent: false };
  let coachFilter = { q: '', seg: 'todos' };
  let rec = { mr: null, chunks: [], stream: null, timer: null, sec: 0, dataUrl: null };

  /* ------------------------------- toast -------------------------------- */
  let toastT;
  function toast(msg, ic) {
    const t = $('#toast');
    t.innerHTML = icon(ic || 'zap', 15) + '<span>' + esc(msg) + '</span>';
    t.classList.add('show'); clearTimeout(toastT);
    toastT = setTimeout(() => t.classList.remove('show'), 2400);
  }

  /* ------------------------------- sheet -------------------------------- */
  function openSheet(html) {
    const root = $('#scrim-root');
    root.innerHTML = '<div class="scrim"><div class="sheet" role="dialog" aria-modal="true">' +
      '<div class="grip"></div>' + html + '</div></div>';
    const scrim = $('.scrim', root);
    requestAnimationFrame(() => scrim.classList.add('show'));
    scrim.addEventListener('click', (e) => { if (e.target === scrim) closeSheet(); });
    return root;
  }
  function closeSheet() {
    const scrim = $('.scrim'); if (!scrim) return;
    scrim.classList.remove('show');
    setTimeout(() => { const r = $('#scrim-root'); if (r) r.innerHTML = ''; }, 250);
  }
  A.closeSheet = closeSheet;

  function waLink(m, text) {
    const digits = String(m.phone || '').replace(/\D/g, '');
    return 'https://wa.me/' + digits + '?text=' + encodeURIComponent(text);
  }

  /* =====================================================================
     MEMBER VIEWS
     ===================================================================== */
  async function viewInicio() {
    const db = state.db, m = state.member;
    const [cls, posts, awards, saved] = await Promise.all([db.todayClass(), db.listPosts(), db.listAwards(), db.listSaved(m.id)]);
    const checked = cls ? await db.isCheckedInToday(m.id, cls.id) : false;
    const st = U.stripe(m);

    let h = '<section class="screen">';
    h += '<p class="hello">Olá, <b>' + esc(firstName(m.name)) + '</b> — bom te ver no tatame.</p>';
    h += '<div class="grau"><div class="lab">Próximo grau</div>' +
      '<div class="big">' + (st.remaining || 0) + '<em>aulas</em></div>' +
      '<div class="sub">' + esc(m.beltLabel) + ' · ' + m.stripes + 'º para ' + (m.stripes + 1) + 'º grau</div>' +
      '<div class="bar"><i style="width:' + st.pct + '%"></i></div></div>';

    if (cls) {
      h += '<div class="eyebrow">' + icon('clock', 13) + ' Aula de hoje</div>';
      h += '<div class="card checkin"><div class="ci"><div class="t">' + esc(cls.title) + '</div>' +
        '<div class="d">' + icon('clock', 13) + ' Hoje, ' + hourLabel(cls.datetime) + ' · ' + esc(cls.coach) + '</div></div>' +
        '<button class="btn ' + (checked ? 'done' : '') + '" data-act="checkin">' +
        icon('check', 18) + ' ' + (checked ? 'Check-in feito' : 'Fazer check-in') + '</button></div>';
    }
    if (state.deferredPrompt) {
      h += '<div class="installbar">' + icon('download', 18) +
        '<div class="g"><b>Instale o app</b> na tela inicial</div>' +
        '<button class="btn sm" data-act="install">Instalar</button></div>';
    }

    h += '<div class="eyebrow">' + icon('play', 13) + ' No tatame · sessões' +
      (saved.length ? '<span class="more" data-act="saved">Salvos (' + saved.length + ')</span>' : '') + '</div>';
    h += posts.map((p) => techCard(p, saved.some((s) => s.id === p.id))).join('');

    h += '<div class="eyebrow">' + icon('award', 13) + ' Mural da academia</div>';
    h += awards.map((a) => awardCard(a, m.id)).join('');
    h += '</section>';
    return h;
  }

  function techCard(p, isSaved) {
    const tags = (p.tags || []).map((t) => '<span class="t">#' + esc(t) + '</span>').join('');
    const slot = p.video_url
      ? '<div class="videoslot" data-url="' + esc(p.video_url) + '"><div class="thumb" data-act="playvid">' +
        '<span class="tag">' + esc(p.position) + '</span><div class="play">' + icon('play', 22) + '</div></div></div>'
      : '';
    return '<div class="card tech">' + slot +
      '<h3>' + esc(p.title) + '</h3>' +
      '<p>' + esc(p.desc) + '</p>' +
      (p.voice_note ? voiceNote(p) : '') +
      (tags ? '<div class="tagrow">' + tags + '</div>' : '') +
      '<div class="techfoot">' +
      (p.video_url ? '<button class="ghost" data-act="playvid">' + icon('play', 15) + ' Ver vídeo</button>' : '') +
      '<button class="iconbtn ' + (isSaved ? 'on' : '') + '" data-act="save:' + p.id + '" aria-label="Salvar">' +
      icon(isSaved ? 'bookmarkcheck' : 'bookmark', 19) + '</button></div>' +
      '<div class="posted">' + icon('user', 13) + ' ' + esc(p.coach) + ' · ' + U.fmtAgo(p.at) + '</div></div>';
  }

  function voiceNote(p) {
    const bars = Array.from({ length: 16 }, () => '<i></i>').join('');
    return '<div class="vn"><button data-act="voice" aria-label="Ouvir recado">' + icon('play', 16) + '</button>' +
      '<div class="wave">' + bars + '</div><div class="lab">Recado do professor</div>' +
      '<audio preload="none" src="' + esc(p.voice_note) + '"></audio></div>';
  }

  function awardCard(a, myId) {
    const b = a.badge || {};
    const mine = a.member_id === myId;
    const sealIcon = icon(b.icon || 'award', mine ? 22 : 20);
    let txt;
    if (mine) {
      txt = '<b>' + esc(a.by) + '</b> te deu o selo <b style="color:var(--gold)">' + esc(b.name) + '</b> 🥋' +
        '<div class="metaline">' + U.fmtAgo(a.at) + ' · todo mundo viu isso</div>' +
        '<button class="react ' + ((a.reacted_by || []).includes(myId) ? 'on' : '') + '" data-act="react:' + a.id + '">' +
        icon('heart', 14) + ' <span>' + a.reactions + '</span> oss</button>';
    } else {
      txt = '<span class="who">' + esc(a.member_name || '') + '</span> ganhou <b>' + esc(b.name) + '</b>.' +
        '<div class="metaline">' + U.fmtAgo(a.at) + '</div>';
    }
    return '<div class="badgefeed ' + (mine ? 'mine' : '') + '">' +
      '<div class="seal ' + (mine ? '' : 'plain') + '">' + sealIcon + '</div><div class="txt">' + txt + '</div></div>';
  }

  async function viewProgresso() {
    const db = state.db, m = state.member;
    const [goals, badges] = await Promise.all([db.listGoals(m.id), db.earnedBadges(m.id)]);
    const idx = BELT_ORDER.indexOf(m.belt);
    const st = U.stripe(m);

    let segs = BELT_ORDER.map((b, i) => {
      const reached = i <= idx;
      let graus = '';
      if (i === idx) {
        graus = '<div class="graus">' + Array.from({ length: 4 }, (_, k) => '<i class="' + (k < m.stripes ? 'f' : '') + '"></i>').join('') + '</div>';
      }
      return '<div class="seg ' + (reached ? 'reached' : '') + '" style="background:' + U.beltColor(b) + '">' + graus + '</div>';
    }).join('');
    let labels = BELT_ORDER.map((b, i) => '<span class="' + (i === idx ? 'cur' : '') + '">' + U.belt[b].short + '</span>').join('');

    let h = '<section class="screen">';
    h += '<div class="eyebrow" style="margin-top:14px">' + icon('award', 13) + ' Sua jornada</div>';
    h += '<div class="card"><div class="belt-title"><div class="n">' + esc(m.beltLabel.toUpperCase()) + '</div>' +
      '<div class="g">' + m.stripes + ' graus · ' + (m.stripes >= 4 ? 'pronto pra próxima faixa' : 'falta ' + (st.remaining || 0) + ' aula(s) pro próximo') + '</div></div>' +
      '<div class="belt">' + segs + '</div><div class="beltlabels">' + labels + '</div></div>';

    h += '<div class="stats">' +
      stat(m.total_classes, '', 'Aulas no total') +
      stat(Math.round(m.mat_hours), 'h', 'Horas no tatame') +
      stat(m.streak_weeks, ' sem', 'Sequência atual') +
      stat(m.best_streak, ' sem', 'Recorde') + '</div>';

    h += '<div class="eyebrow">' + icon('target', 13) + ' Suas metas</div><div class="card">';
    h += goals.map(goalRow).join('') || '<div class="empty">Sem metas ainda.</div>';
    h += '<button class="addmeta" data-act="newgoal">' + icon('plus', 16) + ' Criar nova meta</button></div>';

    h += '<div class="eyebrow">' + icon('trophy', 13) + ' Conquistas</div><div class="tg">';
    h += badges.map((b) => '<div class="tro ' + (b.earned ? 'earned' : 'lock') + '">' +
      (b.rarity === 'raro' || b.rarity === 'lendário' ? '<span class="rare">' + (b.rarity === 'lendário' ? 'LENDÁRIO' : 'RARO') + '</span>' : '') +
      '<div class="em">' + icon(b.earned ? b.icon : 'lock', b.earned ? 20 : 18) + '</div><div class="nm">' + esc(b.name) + '</div></div>').join('');
    h += '</div></section>';
    return h;
  }
  function stat(v, em, k) { return '<div class="stat"><div class="v">' + v + (em ? '<em>' + em + '</em>' : '') + '</div><div class="k">' + k + '</div></div>'; }
  function goalRow(g) {
    let prog;
    if (g.target <= 6) {
      prog = '<div class="pips">' + Array.from({ length: g.target }, (_, i) => '<i class="' + (i < g.progress ? 'f' : '') + '"></i>').join('') + '</div>';
    } else {
      prog = '<div class="pips"></div>';
    }
    const sub = g.target <= 6 ? (g.progress + ' de ' + g.target + ' nesta ' + g.period) : (g.progress + ' / ' + g.target + ' · ' + g.period);
    return '<div class="meta-row"><div class="ic">' + icon(g.icon || 'target', 18) + '</div>' +
      '<div class="g"><div class="t">' + esc(g.title) + '</div><div class="s">' + sub + '</div></div>' + prog + '</div>';
  }

  async function viewRanking() {
    const db = state.db, m = state.member;
    const board = await db.leaderboard();
    const league = (U.belt[m.league] || U.belt.roxa).short.toUpperCase();
    let h = '<section class="screen">';
    h += '<div class="eyebrow" style="margin-top:14px">' + icon('trophy', 13) + ' Liga semanal</div>';
    h += '<div class="league"><div class="ic">' + icon('crown', 24) + '</div><div><div class="t">LIGA ' + league + '</div>' +
      '<div class="s">Termina domingo · top 3 sobem de liga</div></div></div>';
    h += board.map((p) => {
      const you = p.id === m.id;
      const top = p.pos <= 3 ? 'top' : '';
      return '<div class="rank ' + (you ? 'you' : '') + '"><div class="pos ' + top + '">' + p.pos + 'º</div>' +
        '<div class="av" style="background:' + p.beltColor + ';' + (p.belt === 'branca' ? 'color:#3a2e1c' : '') + '">' + esc(p.avatar) + '</div>' +
        '<div class="nm">' + esc(firstName(p.name)) + '<small>' + esc(p.beltLabel) + (you ? ' · você' : '') + '</small></div>' +
        '<div class="xp">' + p.week_xp + '<em>XP</em></div></div>';
    }).join('');
    h += '<p class="optin">A liga é opcional e zera toda semana.<br/>Quem prefere treinar sem ranking, joga no modo silencioso.</p>';
    h += '</section>';
    return h;
  }

  /* =====================================================================
     COACH / CRM VIEWS
     ===================================================================== */
  async function viewPainel() {
    const db = state.db;
    const [s, atRisk, cls] = await Promise.all([db.coachStats(), db.atRiskMembers(), db.todayClass()]);
    let h = '<section class="screen">';
    h += '<p class="hello">Olá, <b>' + esc(firstName(COACH.name)) + '</b> — sua academia hoje.</p>';
    h += '<div class="statgrid">' +
      statcard(s.ativos, 'Alunos ativos', 'ok', 'users') +
      statcard(s.experimentais, 'Experimentais', 'gold', 'sparkles') +
      statcard(s.emRisco, 'Em risco', 'risk', 'alert') +
      statcard(s.checkinsHoje, 'Check-ins hoje', '', 'check') + '</div>';
    h += '<div class="quickrow"><button class="btn" data-act="nav:postar">' + icon('video', 17) + ' Postar técnica</button>' +
      '<button class="btn gold" data-act="nav:selos">' + icon('award', 17) + ' Dar selo</button></div>';

    h += '<div class="eyebrow">' + icon('alert', 13) + ' Recuperar (win-back)<span class="more">' + atRisk.length + ' aluno(s)</span></div>';
    h += atRisk.length ? atRisk.map(winRow).join('') : '<div class="empty">Ninguém em risco. 🔥<br/>Todos treinando em dia.</div>';

    if (cls) {
      h += '<div class="eyebrow">' + icon('flame', 13) + ' Hoje no tatame</div>';
      h += '<div class="card"><div class="ci"><div class="t">' + esc(cls.title) + '</div>' +
        '<div class="d">' + icon('clock', 13) + ' Hoje, ' + hourLabel(cls.datetime) + ' · ' + s.checkinsHoje + ' check-in(s)</div></div>' +
        '<button class="btn sec sm" data-act="nav:alunos" style="margin-top:12px">' + icon('users', 16) + ' Marcar presença</button></div>';
    }
    h += '</section>';
    return h;
  }
  function statcard(v, k, cls, ic) {
    return '<div class="statcard ' + (cls || '') + '"><div class="ic">' + icon(ic || 'users', 18) + '</div>' +
      '<div class="v">' + v + '</div><div class="k">' + k + '</div></div>';
  }
  function winRow(m) {
    const contacted = !!m.winback_contacted_at;
    return '<div class="winrow ' + (contacted ? '' : 'warn') + '">' +
      '<div class="av" style="background:' + m.beltColor + ';' + (m.belt === 'branca' ? 'color:#3a2e1c' : '') + '">' + esc(m.avatar) + '</div>' +
      '<div class="g"><b>' + esc(firstName(m.name)) + '</b>' +
      '<div class="s ' + (contacted ? 'done' : '') + '">' + (contacted ? 'Contatado ' + U.fmtAgo(m.winback_contacted_at) : m.days + ' dias sem treinar') + '</div></div>' +
      '<button class="ghost" data-act="wa:' + m.id + '" aria-label="WhatsApp">' + icon('message-circle', 17) + '</button>' +
      (contacted ? '' : '<button class="ghost" data-act="winback:' + m.id + '" aria-label="Marcar contatado">' + icon('check', 17) + '</button>') + '</div>';
  }

  async function viewAlunos() {
    const all = await state.db.listMembers();
    const segs = [['todos', 'Todos'], ['ativo', 'Ativos'], ['experimental', 'Exp.'], ['risco', 'Em risco']];
    let h = '<section class="screen">';
    h += '<div class="searchbar">' + icon('search', 18) + '<input id="q" placeholder="Buscar aluno..." value="' + esc(coachFilter.q) + '"></div>';
    h += '<div class="seg-ctl">' + segs.map((s) => '<button class="' + (coachFilter.seg === s[0] ? 'on' : '') + '" data-act="seg:' + s[0] + '">' + s[1] + '</button>').join('') + '</div>';
    h += '<div class="roster" id="rosterlist">' + rosterHtml(all) + '</div></section>';
    return h;
  }
  function rosterHtml(all) {
    const q = coachFilter.q.toLowerCase().trim();
    let list = all.filter((m) => {
      if (coachFilter.seg === 'ativo') return m.status === 'ativo' && !m.risk;
      if (coachFilter.seg === 'experimental') return m.status === 'experimental';
      if (coachFilter.seg === 'risco') return m.risk;
      return true;
    });
    if (q) list = list.filter((m) => m.name.toLowerCase().includes(q));
    if (!list.length) return '<div class="empty">Nenhum aluno encontrado.</div>';
    return list.map((m) => {
      const chipCls = m.risk ? 'em_risco' : m.status;
      const chipLab = m.risk ? 'Em risco' : (m.status === 'experimental' ? 'Experimental' : m.status === 'ativo' ? 'Ativo' : 'Inativo');
      return '<button class="ritem" data-act="member:' + m.id + '">' +
        '<div class="av" style="background:' + m.beltColor + ';' + (m.belt === 'branca' ? 'color:#3a2e1c' : '') + '">' + esc(m.avatar) + '</div>' +
        '<div class="nm"><b>' + esc(m.name) + '</b><div class="meta"><span class="chip ' + chipCls + '">' + chipLab + '</span>' +
        '<span>' + esc(m.beltShort) + ' · ' + m.stripes + 'º</span><span>treinou ' + U.fmtAgo(m.last_class_at) + '</span></div></div>' +
        '<div class="go">' + icon('chevron-right', 18) + '</div></button>';
    }).join('');
  }

  async function viewAluno() {
    const db = state.db, m = await db.getMember(state.memberId);
    if (!m) return '<section class="screen"><div class="empty">Aluno não encontrado.</div></section>';
    const checks = await db.memberCheckins(m.id);
    const classes = await db.listClasses();
    const clsTitle = (id) => { const c = classes.find((x) => x.id === id); return c ? c.title : 'Aula'; };
    const st = U.stripe(m);
    const chipCls = m.risk ? 'em_risco' : m.status;
    const chipLab = m.risk ? 'Em risco' : (m.status === 'experimental' ? 'Experimental' : m.status === 'ativo' ? 'Ativo' : 'Inativo');

    let h = '<section class="screen">';
    h += '<button class="ghost" data-act="nav:alunos" style="margin:8px 0 16px">' + icon('chevron-left', 16) + ' Alunos</button>';
    h += '<div class="mdhead"><div class="av" style="background:' + m.beltColor + ';' + (m.belt === 'branca' ? 'color:#3a2e1c' : '') + '">' + esc(m.avatar) + '</div>' +
      '<div><div class="nm">' + esc(m.name) + '</div><div class="sub"><span class="chip ' + chipCls + '">' + chipLab + '</span> ' +
      esc(m.beltLabel) + ' · ' + m.stripes + 'º grau</div></div></div>';
    h += '<div class="stats">' +
      stat(m.total_classes, '', 'Aulas') + stat(Math.round(m.mat_hours), 'h', 'Horas') +
      stat(m.streak_weeks, ' sem', 'Sequência') + stat(m.week_xp, '', 'XP na semana') + '</div>';

    h += '<div class="eyebrow">' + icon('award', 13) + ' Próximo grau</div>';
    h += '<div class="grau"><div class="lab">Faltam</div><div class="big">' + (st.remaining || 0) + '<em>aulas</em></div>' +
      '<div class="sub">' + esc(m.beltLabel) + ' · rumo ao ' + (m.stripes + 1) + 'º grau</div><div class="bar"><i style="width:' + st.pct + '%"></i></div></div>';

    h += '<div class="quickrow"><button class="btn gold" data-act="awardfor:' + m.id + '">' + icon('award', 16) + ' Dar selo</button>' +
      '<button class="btn sec" data-act="present:' + m.id + '">' + icon('check', 16) + ' Marcar presença</button></div>';
    h += '<button class="btn risk full" data-act="wa:' + m.id + '" style="margin-top:10px">' + icon('message-circle', 16) + ' Mensagem no WhatsApp</button>';

    h += '<div class="eyebrow">' + icon('clock', 13) + ' Presenças recentes</div><div class="card attn">';
    h += checks.length ? checks.slice(0, 8).map((c) => '<div class="a"><span class="dot"></span> <b>' + esc(clsTitle(c.class_id)) + '</b> · ' + U.fmtAgo(c.at) + '</div>').join('')
      : '<div class="empty">Sem presenças registradas.</div>';
    h += '</div></section>';
    return h;
  }

  async function viewPostar() {
    const tipos = ['Gi', 'No-Gi', 'Drilling', 'Competição'];
    let h = '<section class="screen">';
    h += '<div class="eyebrow" style="margin-top:14px">' + icon('video', 13) + ' Postar o que foi treinado</div>';
    h += '<p class="hello">Quem faltou não perde. Cole o link do vídeo (YouTube, Instagram, Vimeo) e mande um recado.</p>';
    h += '<form id="postform">';
    h += field('Título da técnica', '<input class="input" name="title" required placeholder="Ex.: Armlock pela guarda fechada">');
    h += field('Posição / categoria', '<input class="input" name="position" placeholder="Ex.: Guarda · Finalização">');
    h += field('Tipo', '<div class="chips" id="tipos">' + tipos.map((t) => '<button type="button" class="opt" data-tipo="' + t + '">' + t + '</button>').join('') + '</div>');
    h += field('Tags', '<input class="input" name="tags" placeholder="guarda, finalização, gi">');
    h += field('Link do vídeo', '<input class="input" name="video" inputmode="url" placeholder="https://youtube.com/...">' +
      '<div class="hint">Não guardamos o vídeo — só o link. Cole de YouTube, Vimeo ou Instagram.</div><div id="videopreview"></div>');
    h += field('Descrição', '<textarea class="input" name="desc" placeholder="Detalhes do treino, pontos-chave..."></textarea>');
    h += field('Recado de voz (opcional)',
      '<div class="recorder"><button type="button" class="recbtn" data-act="rec">' + icon('mic', 22) + '</button>' +
      '<div class="info"><b id="recstate">Gravar recado</b><div class="s" id="rectime">toque para gravar um áudio curto</div></div>' +
      '<button type="button" class="ghost" id="recclear" hidden>' + icon('x', 16) + '</button></div>' +
      '<audio id="recplayback" controls hidden style="width:100%;margin-top:10px"></audio>');
    h += '<button class="btn full" type="submit" style="margin-top:6px">' + icon('send', 17) + ' Publicar pro feed</button>';
    h += '</form></section>';
    return h;
  }
  function field(label, inner) { return '<div class="field"><label>' + label + '</label>' + inner + '</div>'; }

  async function viewSelos() {
    const badges = await state.db.listBadges();
    let h = '<section class="screen">';
    h += '<div class="eyebrow" style="margin-top:14px">' + icon('award', 13) + ' Dar um selo</div>';
    h += '<p class="hello">O reconhecimento do professor vale ouro. Escolha o selo — depois o aluno.</p>';
    h += '<div class="badgegrid">' + badges.map((b) => '<button class="badgecard" data-act="pickmember:' + b.id + '">' +
      '<div class="seal">' + icon(b.icon, 20) + '</div><div><div class="bn">' + esc(b.name) + '</div>' +
      '<div class="br ' + noAccent(b.rarity) + '">' + esc(b.rarity) + '</div></div></button>').join('');
    h += '</div></section>';
    return h;
  }

  /* =====================================================================
     CHROME (header + nav) + ROUTER
     ===================================================================== */
  const MEMBER_TABS = [['inicio', 'Início', 'home'], ['progresso', 'Progresso', 'trending-up'], ['ranking', 'Ranking', 'trophy']];
  const COACH_TABS = [['painel', 'Painel', 'clipboard'], ['alunos', 'Alunos', 'users'], ['postar', 'Postar', 'video'], ['selos', 'Selos', 'award']];

  function renderChrome() {
    const hdr = $('#hdr'), nav = $('#nav');
    if (!state.session) { hdr.style.display = 'none'; nav.style.display = 'none'; return; }
    hdr.style.display = ''; nav.style.display = '';
    const isCoach = state.session.role === 'coach';
    const brand = '<div class="brand">AR<span>CO</span>RE<small>' + esc(CFG.gym.tagline || '') + '</small></div>';
    let right = '<div class="hdr-right">';
    if (!isCoach && state.member) {
      right += '<div class="streakchip">' + icon('flame', 15) + ' ' + state.member.streak_weeks + ' sem</div>';
    }
    const av = isCoach ? COACH.avatar : (state.member ? state.member.avatar : '?');
    const avColor = isCoach ? 'var(--gold)' : (state.member ? state.member.beltColor : 'var(--ember)');
    const name = isCoach ? COACH.name : (state.member ? firstName(state.member.name) : '');
    right += '<button class="persona" data-act="persona"><div class="av" style="background:' + avColor + '">' + esc(av) + '</div>' +
      '<div class="lab">' + esc(name) + '<small>' + (isCoach ? 'Professor' : 'Aluno') + '</small></div></button></div>';
    hdr.innerHTML = brand + right;

    const tabs = isCoach ? COACH_TABS : MEMBER_TABS;
    const active = (isCoach && state.screen === 'aluno') ? 'alunos' : state.screen;
    nav.innerHTML = tabs.map((t) => '<button class="' + (active === t[0] ? 'on' : '') + '" data-act="nav:' + t[0] + '">' +
      icon(t[2], 21) + ' ' + t[1] + '</button>').join('');
  }

  async function render() {
    renderChrome();
    const view = $('#view');
    if (!state.session) { view.innerHTML = viewLogin(); return; }
    if (state.session.role === 'member') state.member = await state.db.getMember(state.memberId);
    let html = '';
    try {
      switch (state.screen) {
        case 'inicio': html = await viewInicio(); break;
        case 'progresso': html = await viewProgresso(); break;
        case 'ranking': html = await viewRanking(); break;
        case 'painel': html = await viewPainel(); break;
        case 'alunos': html = await viewAlunos(); break;
        case 'aluno': html = await viewAluno(); break;
        case 'postar': html = await viewPostar(); break;
        case 'selos': html = await viewSelos(); break;
        default: html = '<section class="screen"><div class="empty">…</div></section>';
      }
    } catch (e) { console.error(e); html = '<section class="screen"><div class="empty">Erro ao carregar.</div></section>'; }
    view.innerHTML = html;
    view.scrollTop = 0;
    afterRender();
  }

  function setScreen(s) {
    if (state.screen === 'postar' && s !== 'postar') stopRecording(true);
    state.screen = s; render();
  }

  function afterRender() {
    if (state.screen === 'alunos') {
      const q = $('#q');
      if (q) q.addEventListener('input', (e) => { coachFilter.q = e.target.value; const l = $('#rosterlist'); if (l) state.db.listMembers().then((all) => { l.innerHTML = rosterHtml(all); }); });
    }
    if (state.screen === 'postar') bindPostar();
    if (!state.session) bindAuthForm();
  }

  function bindAuthForm() {
    const form = $('#authform');
    if (!form) return;
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = form.email.value.trim();
      if (!email) return;
      state.authPending = true;
      render();
      try {
        await A.auth.signIn(email);
        state.authSent = true;
        toast('Link enviado! Confira seu e-mail', 'mail');
      } catch (err) {
        toast(err.message || 'Erro ao enviar link', 'alert');
      } finally {
        state.authPending = false;
        render();
      }
    });
  }

  function authEnabled() { return A.auth && A.auth.isEnabled && A.auth.isEnabled(); }

  function viewLogin() {
    const mode = A.mode === 'supabase'
      ? (authEnabled() ? 'Nuvem · login seguro' : 'Conectado à nuvem (Supabase)')
      : 'Modo local · dados de demonstração neste aparelho';

    if (authEnabled()) {
      if (state.authSent) {
        return '<div class="login"><div class="logo">AR<span>CO</span>RE</div><div class="tl">' + esc(CFG.gym.tagline || '') + '</div>' +
          '<div class="authcard"><div class="authicon">' + icon('mail', 28) + '</div>' +
          '<h2>Confira seu e-mail</h2>' +
          '<p class="authtxt">Enviamos um link mágico. Toque nele neste aparelho para entrar.</p>' +
          '<button class="btn sec full" data-act="auth-back">' + icon('chevron-left', 16) + ' Usar outro e-mail</button></div>' +
          '<div class="modeline">' + icon('lock', 12) + ' ' + mode + '</div></div>';
      }
      return '<div class="login"><div class="logo">AR<span>CO</span>RE</div><div class="tl">' + esc(CFG.gym.tagline || '') + '</div>' +
        '<h2>Entrar na academia</h2>' +
        '<form id="authform" class="authcard">' +
        '<label class="authlabel">Seu e-mail</label>' +
        '<input class="input" name="email" type="email" required autocomplete="email" placeholder="voce@email.com" inputmode="email">' +
        '<button class="btn full" type="submit" ' + (state.authPending ? 'disabled' : '') + '>' +
        icon('send', 17) + ' ' + (state.authPending ? 'Enviando...' : 'Enviar link de acesso') + '</button>' +
        '<p class="authtxt">Sem senha — você recebe um link seguro por e-mail.</p></form>' +
        '<div class="modeline">' + icon('lock', 12) + ' ' + mode + '</div></div>';
    }

    return '<div class="login"><div class="logo">AR<span>CO</span>RE</div><div class="tl">' + esc(CFG.gym.tagline || '') + '</div>' +
      '<h2>Quem está entrando?</h2>' +
      '<button class="rolebtn member" data-act="login-member"><div class="ic">' + icon('user', 24) + '</div>' +
      '<div><div class="t">Sou Aluno</div><div class="d">Feed, progressão, selos e ranking</div></div></button>' +
      '<button class="rolebtn coach" data-act="login-coach"><div class="ic">' + icon('crown', 24) + '</div>' +
      '<div><div class="t">Sou Professor</div><div class="d">CRM, postar técnicas e dar selos</div></div></button>' +
      '<div class="modeline">' + icon('refresh', 12) + ' ' + mode + '</div></div>';
  }

  /* =====================================================================
     ACTIONS (delegated)
     ===================================================================== */
  async function onClick(e) {
    const t = e.target.closest('[data-act]'); if (!t) return;
    const raw = t.dataset.act; const i = raw.indexOf(':');
    const act = i < 0 ? raw : raw.slice(0, i);
    const arg = i < 0 ? null : raw.slice(i + 1);

    switch (act) {
      case 'nav': setScreen(arg); break;
      case 'login-member': await setSession('member', state.memberId); break;
      case 'login-coach': await setSession('coach', null); break;
      case 'auth-back': state.authSent = false; render(); break;
      case 'persona': openPersona(); break;
      case 'switchto': if (!authEnabled()) { closeSheet(); await setSession(arg, state.memberId); } break;
      case 'logout': closeSheet(); await doLogout(); break;
      case 'resetdemo': closeSheet(); await state.db.reset(); toast('Demonstração reiniciada', 'refresh'); render(); break;
      case 'install': doInstall(); break;

      case 'checkin': await doCheckin(); break;
      case 'save': await doSave(arg, t); break;
      case 'react': await doReact(arg, t); break;
      case 'playvid': doPlayVid(t); break;
      case 'voice': doVoice(t); break;
      case 'saved': await openSaved(); break;
      case 'newgoal': openGoalSheet(); break;

      case 'member': state.memberId = arg; setScreen('aluno'); break;
      case 'seg': coachFilter.seg = arg; render(); break;
      case 'wa': await doWhatsApp(arg); break;
      case 'winback': await state.db.markWinBack(arg); toast('Marcado como contatado', 'check'); render(); break;
      case 'present': await doPresent(arg); break;
      case 'awardfor': openMemberAward(arg); break;
      case 'pickmember': openPickMember(arg); break;
      case 'awardgo': await doAward(arg, t); break;
      case 'rec': toggleRecording(); break;
      default: break;
    }
  }

  async function doCheckin() {
    const cls = await state.db.todayClass(); if (!cls) return;
    const r = await state.db.checkIn(state.member.id, cls.id);
    if (r.already) { toast('Você já fez check-in hoje', 'check'); }
    else { toast('Check-in feito · +' + r.xp + ' XP', 'zap'); }
    render();
  }
  async function doSave(postId, btn) {
    const saved = await state.db.toggleSave(state.member.id, postId);
    btn.classList.toggle('on', saved);
    btn.innerHTML = icon(saved ? 'bookmarkcheck' : 'bookmark', 19);
    toast(saved ? 'Salvo na sua biblioteca' : 'Removido dos salvos', 'bookmark');
  }
  async function doReact(awardId, btn) {
    const r = await state.db.toggleAwardReaction(awardId, state.member.id);
    btn.classList.toggle('on', r.reacted);
    btn.innerHTML = icon('heart', 14) + ' <span>' + r.count + '</span> oss';
  }
  function doPlayVid(t) {
    const card = t.closest('.tech'); if (!card) return;
    const slot = card.querySelector('.videoslot'); if (!slot) return;
    slot.innerHTML = U.embedHtml(slot.dataset.url);
  }
  function doVoice(t) {
    const vn = t.closest('.vn'); const audio = vn.querySelector('audio');
    const wave = vn.querySelector('.wave');
    if (audio.paused) {
      document.querySelectorAll('.vn audio').forEach((a) => { if (a !== audio) a.pause(); });
      audio.play().then(() => {
        t.innerHTML = icon('pause', 16);
        vn._anim = setInterval(() => { wave.querySelectorAll('i').forEach((b) => b.style.height = (20 + Math.random() * 80) + '%'); }, 120);
      }).catch(() => toast('Não consegui tocar o áudio'));
      audio.onended = audio.onpause = () => { t.innerHTML = icon('play', 16); clearInterval(vn._anim); wave.querySelectorAll('i').forEach((b) => b.style.height = '30%'); };
    } else { audio.pause(); }
  }
  async function openSaved() {
    const saved = await state.db.listSaved(state.member.id);
    let h = '<h3>Salvos</h3><div class="sub">Sua biblioteca de técnicas</div>';
    h += saved.length ? saved.map((p) => '<div class="card" style="margin-bottom:10px"><h3 style="font-size:15px">' + esc(p.title) + '</h3>' +
      '<p style="color:var(--muted);font-size:12.5px;margin-top:4px">' + esc(p.position) + '</p>' +
      (p.video_url ? '<a class="vidlink" href="' + esc(p.video_url) + '" target="_blank" rel="noopener">Ver vídeo ↗</a>' : '') + '</div>').join('')
      : '<div class="empty">Nada salvo ainda. Toque no marcador 🔖 numa técnica.</div>';
    openSheet(h);
  }

  async function doWhatsApp(id) {
    const m = await state.db.getMember(id); if (!m) return;
    const cls = await state.db.todayClass();
    const txt = 'Oi ' + firstName(m.name) + '! Senti sua falta no tatame 🥋 Bora marcar um treino essa semana?' +
      (cls ? ' Tem aula hoje ' + hourLabel(cls.datetime) + '.' : '') + ' — ' + COACH.name + ' / ' + CFG.gym.name;
    window.open(waLink(m, txt), '_blank');
  }
  async function doPresent(id) {
    const cls = await state.db.todayClass(); if (!cls) return;
    const r = await state.db.checkIn(id, cls.id);
    toast(r.already ? 'Já estava presente hoje' : 'Presença registrada · +' + r.xp + ' XP', 'check');
    render();
  }

  /* ----- award flows ----- */
  async function openMemberAward(memberId) {
    const badges = await state.db.listBadges();
    const m = await state.db.getMember(memberId);
    let h = '<h3>Dar selo a ' + esc(firstName(m.name)) + '</h3><div class="sub">Escolha o reconhecimento</div><div class="badgegrid">';
    h += badges.map((b) => '<button class="badgecard" data-act="awardgo:' + memberId + '|' + b.id + '">' +
      '<div class="seal">' + icon(b.icon, 20) + '</div><div><div class="bn">' + esc(b.name) + '</div>' +
      '<div class="br ' + noAccent(b.rarity) + '">' + esc(b.rarity) + '</div></div></button>').join('');
    h += '</div>';
    openSheet(h);
  }
  async function openPickMember(badgeId) {
    const all = await state.db.listMembers();
    const badges = await state.db.listBadges();
    const b = badges.find((x) => x.id === badgeId) || {};
    let h = '<h3>' + esc(b.name) + '</h3><div class="sub">Para qual aluno?</div><div class="roster">';
    h += all.map((m) => '<button class="ritem" data-act="awardgo:' + m.id + '|' + badgeId + '">' +
      '<div class="av" style="background:' + m.beltColor + ';' + (m.belt === 'branca' ? 'color:#3a2e1c' : '') + '">' + esc(m.avatar) + '</div>' +
      '<div class="nm"><b>' + esc(m.name) + '</b><div class="meta"><span>' + esc(m.beltShort) + ' · ' + m.stripes + 'º</span></div></div></button>').join('');
    h += '</div>';
    openSheet(h);
  }
  async function doAward(arg) {
    const [memberId, badgeId] = arg.split('|');
    await state.db.awardBadge(memberId, badgeId, COACH.name);
    const m = await state.db.getMember(memberId);
    const badges = await state.db.listBadges();
    const b = badges.find((x) => x.id === badgeId) || {};
    closeSheet();
    toast(firstName(m.name) + ' ganhou "' + b.name + '" 🥋', 'award');
    render();
  }

  /* ----- goal ----- */
  function openGoalSheet() {
    const h = '<h3>Nova meta</h3><div class="sub">Você no controle do seu progresso</div>' +
      '<form id="goalform">' +
      field('Meta', '<input class="input" name="title" required placeholder="Ex.: Treinar 3x por semana">') +
      field('Alvo (número)', '<input class="input" name="target" type="number" min="1" value="3">') +
      field('Período', '<select class="input" name="period"><option value="semana">por semana</option><option value="mês">por mês</option><option value="ano">no ano</option></select>') +
      '<button class="btn full" type="submit">' + icon('check', 17) + ' Criar meta</button></form>';
    openSheet(h);
    $('#goalform').addEventListener('submit', async (e) => {
      e.preventDefault();
      const f = e.target;
      await state.db.createGoal(state.member.id, { title: f.title.value.trim(), target: parseInt(f.target.value, 10) || 1, period: f.period.value });
      closeSheet(); toast('Meta criada 🎯', 'target'); render();
    });
  }

  /* ----- persona menu ----- */
  function openPersona() {
    const isCoach = state.session.role === 'coach';
    const mode = authEnabled() ? 'Produção' : (A.mode === 'supabase' ? 'Nuvem (Supabase)' : 'Local');
    let h = '<h3>' + (isCoach ? esc(COACH.name) : esc(state.member ? state.member.name : '')) + '</h3>' +
      '<div class="sub">' + (isCoach ? 'Professor' : 'Aluno') + ' · ' + mode + '</div><div class="menulist">';
    if (!authEnabled()) {
      if (isCoach) h += '<button class="menuitem" data-act="switchto:member">' + icon('user', 20) + ' Ver como aluno</button>';
      else h += '<button class="menuitem" data-act="switchto:coach">' + icon('crown', 20) + ' Entrar como professor</button>';
    }
    h += '<button class="menuitem" data-act="logout">' + icon('log-out', 20) + ' Sair</button>';
    if (A.mode !== 'supabase') h += '<button class="menuitem danger" data-act="resetdemo">' + icon('refresh', 20) + ' Reiniciar demonstração</button>';
    h += '</div>';
    openSheet(h);
  }

  /* =====================================================================
     POST FORM + VOICE RECORDING
     ===================================================================== */
  function bindPostar() {
    const form = $('#postform'); if (!form) return;
    const tipos = $('#tipos');
    if (tipos) tipos.addEventListener('click', (e) => { const b = e.target.closest('[data-tipo]'); if (!b) return; b.classList.toggle('on'); });
    const vinput = form.video;
    const prev = $('#videopreview');
    vinput.addEventListener('input', () => {
      const url = vinput.value.trim();
      prev.innerHTML = url && (U.ytId(url) || U.vimeoId(url)) ? '<div style="margin-top:10px">' + U.embedHtml(url) + '</div>' : '';
    });
    $('#recclear').addEventListener('click', () => { rec.dataUrl = null; const pb = $('#recplayback'); pb.hidden = true; pb.removeAttribute('src'); $('#recstate').textContent = 'Gravar recado'; $('#rectime').textContent = 'toque para gravar um áudio curto'; $('#recclear').hidden = true; });
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const tipoTags = Array.from(document.querySelectorAll('#tipos .opt.on')).map((b) => b.dataset.tipo.toLowerCase());
      const tags = (form.tags.value || '').split(',').map((s) => s.trim()).filter(Boolean);
      const allTags = Array.from(new Set([...tipoTags, ...tags]));
      const data = {
        title: form.title.value.trim(), position: form.position.value.trim() || 'Técnica',
        tags: allTags, desc: form.desc.value.trim(), video_url: form.video.value.trim(),
        voice_note: rec.dataUrl, coach: COACH.name, class_id: 'c_today',
      };
      if (!data.title) { toast('Dê um título à técnica'); return; }
      await state.db.createPost(data);
      stopRecording(true);
      toast('Publicado! Os alunos já veem 🥋', 'send');
      setScreen('painel');
    });
  }

  function toggleRecording() {
    if (rec.mr && rec.mr.state === 'recording') stopRecording();
    else startRecording();
  }
  async function startRecording() {
    if (!navigator.mediaDevices || !window.MediaRecorder) { toast('Gravação indisponível neste navegador'); return; }
    try {
      rec.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (err) { toast('Permita o microfone para gravar'); return; }
    rec.chunks = []; rec.sec = 0;
    rec.mr = new MediaRecorder(rec.stream);
    rec.mr.ondataavailable = (e) => { if (e.data.size) rec.chunks.push(e.data); };
    rec.mr.onstop = () => {
      const blob = new Blob(rec.chunks, { type: rec.mr.mimeType || 'audio/webm' });
      const reader = new FileReader();
      reader.onload = () => {
        rec.dataUrl = reader.result;
        const pb = $('#recplayback'); if (pb) { pb.src = rec.dataUrl; pb.hidden = false; }
        const rc = $('#recclear'); if (rc) rc.hidden = false;
      };
      reader.readAsDataURL(blob);
    };
    rec.mr.start();
    const btn = $('.recbtn'); if (btn) { btn.classList.add('recording'); btn.innerHTML = icon('square', 20); }
    const stEl = $('#recstate'); if (stEl) stEl.textContent = 'Gravando...';
    rec.timer = setInterval(() => { rec.sec++; const tEl = $('#rectime'); if (tEl) tEl.textContent = rec.sec + 's · toque para parar'; }, 1000);
  }
  function stopRecording(silent) {
    if (rec.timer) { clearInterval(rec.timer); rec.timer = null; }
    if (rec.mr && rec.mr.state === 'recording') rec.mr.stop();
    if (rec.stream) { rec.stream.getTracks().forEach((t) => t.stop()); rec.stream = null; }
    if (!silent) {
      const btn = $('.recbtn'); if (btn) { btn.classList.remove('recording'); btn.innerHTML = icon('mic', 22); }
      const stEl = $('#recstate'); if (stEl) stEl.textContent = 'Recado gravado';
    }
    if (silent) rec.mr = null;
  }

  /* =====================================================================
     SESSION + BOOT
     ===================================================================== */
  async function setSession(role, memberId) {
    state.session = { role, memberId: memberId || state.memberId };
    if (role === 'member') { state.memberId = state.session.memberId; state.screen = 'inicio'; }
    else state.screen = 'painel';
    if (!authEnabled()) localStorage.setItem('arcore.session', JSON.stringify(state.session));
    render();
  }

  async function applyAuthSession() {
    const p = A.auth.profile;
    if (!p) return false;
    const role = p.role === 'coach' ? 'coach' : 'member';
    if (role === 'member') {
      if (!p.member_id) {
        toast('Conta sem aluno vinculado — fale com o professor', 'alert');
        return false;
      }
      state.memberId = p.member_id;
    }
    state.session = { role, memberId: p.member_id, userId: p.id, email: p.email };
    state.screen = role === 'coach' ? 'painel' : 'inicio';
    state.authSent = false;
    return true;
  }

  async function doLogout() {
    if (authEnabled()) await A.auth.signOut();
    state.session = null;
    state.authSent = false;
    localStorage.removeItem('arcore.session');
    render();
  }

  function doInstall() {
    if (!state.deferredPrompt) { toast('Use o menu do navegador → Instalar'); return; }
    state.deferredPrompt.prompt();
    state.deferredPrompt.userChoice.finally(() => { state.deferredPrompt = null; render(); });
  }

  async function boot() {
    document.addEventListener('click', (e) => { onClick(e).catch((err) => console.error(err)); });
    window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); state.deferredPrompt = e; if (state.screen === 'inicio') render(); });

    if (A.auth) await A.auth.init();

    if (authEnabled()) {
      A.auth.onChange(async () => {
        if (A.auth.session && A.auth.profile) {
          const ok = await applyAuthSession();
          if (ok) {
            state.db = await A.createDB();
            await render();
          }
        } else if (!A.auth.session) {
          state.session = null;
          await render();
        }
      });
      if (A.auth.session) await applyAuthSession();
    } else {
      try {
        const saved = JSON.parse(localStorage.getItem('arcore.session') || 'null');
        if (saved && saved.role) { state.session = saved; if (saved.memberId) state.memberId = saved.memberId; }
      } catch (e) { /* ignore */ }
    }

    state.db = await A.createDB();
    if (state.session) state.screen = state.session.role === 'coach' ? 'painel' : 'inicio';
    await render();

    if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
      navigator.serviceWorker.register('sw.js').catch(() => {});
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})(window.Arcore);
