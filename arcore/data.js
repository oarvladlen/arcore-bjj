/* =========================================================================
   Arcore — camada de dados
   Uma única interface (Arcore.db) com dois back-ends:
     • LocalDB    → IndexedDB no aparelho (modo padrão, offline, demo)
     • SupabaseDB → Postgres na nuvem (quando há chaves em config.js)
   As telas (app.js) não sabem qual está em uso.
   ========================================================================= */
window.Arcore = window.Arcore || {};
(function (A) {
  'use strict';
  const CFG = window.ARCORE_CONFIG;
  const R = CFG.rules;

  /* ----------------------------- util ----------------------------------- */
  const util = (A.util = {
    uid(p) { return (p || 'id') + '_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7); },
    nowISO() { return new Date().toISOString(); },
    clone(x) { return x == null ? x : JSON.parse(JSON.stringify(x)); },
    daysSince(iso) {
      if (!iso) return 9999;
      return Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
    },
    sameDay(iso, ref) {
      const a = new Date(iso), b = ref ? new Date(ref) : new Date();
      return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
    },
    fmtAgo(iso) {
      const ms = Date.now() - new Date(iso).getTime();
      const m = Math.floor(ms / 60000), h = Math.floor(ms / 3600000), d = Math.floor(ms / 86400000);
      if (m < 1) return 'agora';
      if (m < 60) return 'há ' + m + ' min';
      if (h < 24) return 'há ' + h + 'h';
      if (d === 1) return 'ontem';
      if (d < 7) return 'há ' + d + ' dias';
      return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
    },
    belt: {
      branca: { label: 'Faixa Branca', short: 'Branca', varc: '--white-belt' },
      azul:   { label: 'Faixa Azul',   short: 'Azul',   varc: '--blue-belt' },
      roxa:   { label: 'Faixa Roxa',   short: 'Roxa',   varc: '--purple-belt' },
      marrom: { label: 'Faixa Marrom', short: 'Marrom', varc: '--brown-belt' },
      preta:  { label: 'Faixa Preta',  short: 'Preta',  varc: '--black-belt' },
    },
    beltColor(b) { const v = (util.belt[b] || util.belt.branca).varc; return 'var(' + v + ')'; },
    risk(member) {
      if (!member || member.status === 'inativo') return false;
      // Never trained yet = new student in onboarding, not a lapsed "at-risk".
      if (!member.last_class_at) return false;
      return util.daysSince(member.last_class_at) >= R.atRiskDays;
    },
    stripe(member) {
      const per = R.classesPerStripe;
      const done = Math.min(per, member.classes_since_stripe || 0);
      return { remaining: Math.max(0, per - done), pct: Math.round((done / per) * 100), per, done };
    },
    beltOrder: ['branca', 'azul', 'roxa', 'marrom', 'preta'],
    /* Mutates member: cashes in classes_since_stripe for stripes/belt promotions.
       Returns an array of promotion events for the UI to celebrate. */
    promote(m) {
      const per = R.classesPerStripe;
      const events = [];
      let guard = 0;
      while ((m.classes_since_stripe || 0) >= per && guard++ < 50) {
        const i = util.beltOrder.indexOf(m.belt);
        const isBlackMax = m.belt === 'preta' && m.stripes >= 4;
        if (isBlackMax) { m.classes_since_stripe = per; break; }
        m.classes_since_stripe -= per;
        if (m.stripes < 4) {
          m.stripes += 1;
          events.push({ type: 'stripe', belt: m.belt, stripes: m.stripes });
        } else if (i >= 0 && i < util.beltOrder.length - 1) {
          m.belt = util.beltOrder[i + 1];
          m.stripes = 0;
          events.push({ type: 'belt', belt: m.belt, stripes: 0 });
        }
      }
      if (m.league && m.belt) m.league = m.belt;
      return events;
    },
    // ----- class schedule (grade horária fixa) -----
    ymd(d) {
      d = d || new Date();
      return '' + d.getFullYear() + String(d.getMonth() + 1).padStart(2, '0') + String(d.getDate()).padStart(2, '0');
    },
    /* Today's class slots from CFG.schedule. Sunday (0) = folga → []. */
    daySlots(ref) {
      const d = ref ? new Date(ref) : new Date();
      const dow = d.getDay(); // 0 Sun .. 6 Sat
      const sc = CFG.schedule || {};
      let defs = [];
      if (dow >= 1 && dow <= 5) defs = sc.weekday || [];
      else if (dow === 6) defs = sc.saturday || [];
      return (defs || []).map((s) => {
        const [h, m] = s.time.split(':').map(Number);
        const dt = new Date(d); dt.setHours(h, m || 0, 0, 0);
        return {
          id: 'c_' + util.ymd(d) + '_' + s.time.replace(':', ''),
          time: s.time, title: s.label || 'Treino',
          type: s.kids ? 'kids' : 'gi', kids: !!s.kids,
          datetime: dt.toISOString(), coach: (CFG.gym && CFG.gym.coach) || 'Professor',
        };
      });
    },
    // ----- video embed (YouTube / Vimeo / link) -----
    ytId(url) {
      const m = String(url).match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/|live\/))([A-Za-z0-9_-]{6,})/);
      return m ? m[1] : null;
    },
    vimeoId(url) { const m = String(url).match(/vimeo\.com\/(?:video\/)?(\d+)/); return m ? m[1] : null; },
    embedHtml(url) {
      if (!url) return '';
      const yt = util.ytId(url);
      if (yt) return '<iframe class="vid" src="https://www.youtube-nocookie.com/embed/' + yt +
        '?rel=0&modestbranding=1" title="vídeo" frameborder="0" loading="lazy" ' +
        'allow="accelerometer;autoplay;clipboard-write;encrypted-media;gyroscope;picture-in-picture" allowfullscreen></iframe>';
      const vm = util.vimeoId(url);
      if (vm) return '<iframe class="vid" src="https://player.vimeo.com/video/' + vm +
        '" title="vídeo" frameborder="0" loading="lazy" allow="autoplay;fullscreen;picture-in-picture" allowfullscreen></iframe>';
      const safe = String(url).replace(/"/g, '%22');
      return '<a class="vidlink" href="' + safe + '" target="_blank" rel="noopener">Abrir vídeo ↗</a>';
    },
    normalizePhone(phone) {
      let d = String(phone || '').replace(/\D/g, '');
      if (d.length >= 10 && d.length <= 11) d = '55' + d;
      if (d && d.charAt(0) !== '+') return '+' + d;
      return d ? (d.startsWith('+') ? d : '+' + d) : '';
    },
    dataURLtoBlob(dataURL) {
      const [head, b64] = String(dataURL).split(',');
      const mime = (head.match(/data:(.*?);base64/) || [, 'application/octet-stream'])[1];
      const bin = atob(b64); const arr = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
      return new Blob([arr], { type: mime });
    },
  });
  // short generated tone so the "ouvir recado" button makes sound in the demo
  const SAMPLE_VOICE = 'data:audio/wav;base64,UklGRiQFAABXQVZFZm10IBAAAAABAAEAQB8AAIA+AAACABAAZGF0YQAFAAAAACAAdwDnAEcBbAE5AZ8Arv+J/mr9kfw7/JD8mv1A/0UBVQMMBQ0GFgYKBf8COwAt/Vj6RPhe9+X33fkJ/e4A7gRYCIkKDwu5CacGRwJI/Xv4tvSr8sryJ/V3+RT/GAWDCmMO/w/6DmMLvgXr/gP4MvJ97pftwO+49L77twNUC0oRixR0FPAQewoTAhX5+vAo66fo/OkI7w33xgCgCvYSWBh8GW4WsA9dBv/7SfLU6tvmBedL6/nyy/wkB1EQzxaMGRUYqRIqCgAA1vVX7evndOYx6a/v3Pg1AwcNtRT7GCUZLBW3DQEEo/lQ8JLphOao583sGvUz/2wJGRLNF5YZKRftEOkHmP2r88brNee45mPqnfE1+5UFCw8IFmUZlRi5E58LmwFV93ruguhn5oLoeu5V95sBnwu5E5UYZRkIFgsPlQU1+53xY+q45jXnxuur85j96QftECkXlhnNFxkSbAkz/xr1zeyo54TmkulQ8KP5AQS3DSwVJRn7GLUUBw01A9z4r+8x6XTm6+dX7db1AAAqCqkSFRiMGc8WURAkB8v8+fJL6wXn2+bU6kny//tdBrAPbhZ8GVgYMxPmCs0AlPbn7TPoaubX6BPvF/hoAlUMOhTLGEgZnRVjDssEa/r18Pjpm+Zr50fsYfRl/qsIhhF+F5kZfheGEasIZf5h9Efsa+eb5vjp9fBr+ssEYw6dFUgZyxg6FFUMaAIX+BPv1+hq5jPo5+2U9s0A5gozE1gYfBluFrAPXQb/+0ny1Orb5gXnS+v58sv8JAdREM8WjBkVGKkSKgoAANb1V+3r53TmMemv79z4NQMHDbUU+xglGSwVtw0BBKP5UPCS6YTmqOfN7Br1M/9sCRkSzReWGSkX7RDpB5j9q/PG6zXnuOZj6p3xNfuVBQsPCBZlGZUYuROfC5sBVfd67oLoZ+aC6HruVfebAZ8LuROVGGUZCBYLD5UFNfud8WPquOY158brq/OY/ekH7RApF5YZzRcZEmwJM/8a9c3sqOeE5pLpUPCj+QEEtw0sFSUZ+xi1FAcNNQPc+K/vMel05uvnV+3W9QAAKgqpEhUYjBnPFlEQJAfL/PnyS+sF59vm1OpJ8v/7XQawD24WfBlYGDMT5grNAJT25+0z6Grm1+gT7xf4aAJVDDoUyxhIGZ0VYw7LBGv69fD46Zvma+dH7GH0Zf6rCIYRfheZGX4XhhGrCGX+YfRH7Gvnm+b46fXwa/rLBGMOnRVIGcsYOhRVDGgCF/gT79foauYz6OftlPbNAOYKMxNYGFMZJxZlDzUGH/zN8sHrHeht6Jbs3vMJ/Y8G4w6rFP4WhhWPEPUIAAAr9+jvYetJ6sLsVvIR+qUCqwrTECQUHRTOEM0KIAMR+/Hz5u667L7tuPH392r/1QYCDfUQEhI2EL4LcAVc/q33evKT72nv9PG99vL8hgNnCaINjg/nDtUL5gbxAPb67fWk8prx7/Jd9kn73QAsBloKwAwEDScLhQfBAqr9FPm89Sb0ifTG9nT67/51A0wH2Am2CtEJWgfEA6//x/uu+N/2m/bf92r6xv1gAaEEAwcsCPYHeAb9A/YA5/1Q+5b5+viH+Rr7Zv0AAHoCbgSRBb8F/QR3A3kBXP96/R78efua+278xv1g//QAQQIVA1gDCwNHAjkBFQAP/07+6/3s/UT+1/6C/yIAnQDiAO4AygCKAEUADwD4/w==';

  function isoAgo(days, h, min) {
    const d = new Date(); d.setDate(d.getDate() - days);
    if (h != null) d.setHours(h, min || 0, 0, 0);
    return d.toISOString();
  }
  function todayAt(h, m) { const d = new Date(); d.setHours(h, m || 0, 0, 0); return d.toISOString(); }
  function hoursAgo(h) { return new Date(Date.now() - h * 3600000).toISOString(); }

  function seedState() {
    const members = [
      mk('m_joao',  'João Vieira',    'roxa',   2, 'ativo',        0,  142, 213, 7100, 845, false, 'J'),
      mk('m_pedro', 'Pedro Alencar',  'roxa',   3, 'ativo',        1,  168, 250, 9200, 980, false, 'P'),
      mk('m_ana',   'Ana Beatriz',    'azul',   2, 'ativo',        2,   96, 140, 5400, 870, false, 'A'),
      mk('m_lucas', 'Lucas Moraes',   'azul',   1, 'ativo',        3,   72, 104, 4100, 790, false, 'L'),
      mk('m_bruna', 'Bruna Costa',    'branca', 2, 'experimental', 1,    8,  12,  600, 760, false, 'B'),
      mk('m_rafa',  'Rafael Tavares', 'marrom', 1, 'ativo',        4,  210, 320, 9800, 720, false, 'R'),
      mk('m_carlos','Carlos Henrique','branca', 3, 'ativo',       14,   34,  50, 2000, 220, false, 'C'),
      mk('m_marina','Marina Lopes',   'azul',   1, 'ativo',       12,   60,  88, 3300, 180, false, 'M'),
      mk('m_diego', 'Diego Santana',  'branca', 0, 'experimental', 9,    3,   4,  150,  90, false, 'D'),
      mk('m_juliana','Juliana Reis',  'branca', 1, 'ativo',        2,   22,  31, 1200, 540, true,  'J'),
    ];
    function mk(id, name, belt, stripes, status, lastDays, total, hours, xp, week_xp, silent, ini) {
      return {
        id, name, belt, stripes, status,
        joined_at: isoAgo(total * 3 + 20),
        last_class_at: isoAgo(lastDays, 19, 0),
        phone: '+55 13 9' + (8000 + Math.floor(Math.random() * 1999)) + '-' + (1000 + Math.floor(Math.random() * 8999)),
        avatar: ini, total_classes: total, mat_hours: hours,
        classes_since_stripe: Math.min(R.classesPerStripe, Math.round(R.classesPerStripe * (0.2 + Math.random() * 0.7))),
        xp, week_xp, league: 'roxa', silent_mode: silent,
        best_streak: 18, streak_weeks: status === 'experimental' ? 1 : Math.max(1, 12 - lastDays),
        winback_contacted_at: null,
      };
    }

    const badges = [
      { id: 'armlock_dia',  name: 'Armlock do Dia',     icon: 'crown',       rarity: 'raro',     stripe: true,  desc: 'Melhor finalização de braço do dia.' },
      { id: 'coracao_leao', name: 'Coração de Leão',     icon: 'flame',       rarity: 'incomum',  stripe: false, desc: 'Não bateu o treino inteiro.' },
      { id: 'melhor_treino',name: 'Melhor Treino do Dia',icon: 'trophy',      rarity: 'comum',    stripe: false, desc: 'Destaque do treino de hoje.' },
      { id: 'mais_evoluiu', name: 'Mais Evoluiu',        icon: 'trending-up', rarity: 'incomum',  stripe: false, desc: 'Maior evolução da semana.' },
      { id: 'madrugadeiro', name: 'Madrugadeiro',        icon: 'clock',       rarity: 'comum',    stripe: false, desc: 'Treinou no horário das 6h.' },
      { id: 'cem_aulas',    name: '100 Aulas',           icon: 'trophy',      rarity: 'raro',     stripe: true,  desc: 'Cravou 100 aulas na Arcore.' },
      { id: 'primeira_comp',name: '1ª Competição',       icon: 'award',       rarity: 'raro',     stripe: true,  desc: 'Competiu pela primeira vez.' },
      { id: 'escolha_mestre',name:'Escolha do Mestre',   icon: 'crown',       rarity: 'lendário', stripe: true,  desc: 'Escolha do mês do Mestre.' },
    ];

    const classes = [
      { id: 'c_today', title: 'Treino Gi · Fundamentos', type: 'gi',    datetime: todayAt(19, 0), coach: 'Mestre Ricardo' },
      { id: 'c_y1',    title: 'No-Gi · Passagem',        type: 'nogi',  datetime: isoAgo(1, 19, 0), coach: 'Mestre Ricardo' },
      { id: 'c_y2',    title: 'Treino Gi · Guarda',      type: 'gi',    datetime: isoAgo(3, 7, 0),  coach: 'Mestre Ricardo' },
    ];

    const posts = [
      { id: 'p1', title: 'Armlock pela guarda fechada', position: 'Guarda · Finalização',
        tags: ['guarda', 'finalização', 'gi'], class_id: 'c_today', coach: 'Mestre Ricardo', at: hoursAgo(2),
        desc: 'Quebra de postura, controle do braço e rotação de quadril para finalizar. Revisa antes do próximo treino — quem faltou, não perde.',
        video_url: 'https://www.youtube.com/watch?v=2oVHEcyJhIM', voice_note: SAMPLE_VOICE,
        likes: 23, liked_by: [], saved_by: [] },
      { id: 'p2', title: 'Raspagem de gancho (hook sweep)', position: 'Meia-guarda · Raspagem',
        tags: ['meia-guarda', 'raspagem', 'gi'], class_id: 'c_y1', coach: 'Mestre Ricardo', at: hoursAgo(26),
        desc: 'Underhook, gancho na coxa e leva o oponente pro outro lado. Detalhe: cabeça do lado de fora.',
        video_url: 'https://www.youtube.com/watch?v=VRYCMYJOn4g', voice_note: null,
        likes: 11, liked_by: [], saved_by: ['m_joao'] },
    ];

    const awards = [
      { id: 'a1', member_id: 'm_joao',  badge_id: 'armlock_dia',  by: 'Mestre Ricardo', at: hoursAgo(2), reactions: 23, reacted_by: [] },
      { id: 'a2', member_id: 'm_pedro', badge_id: 'coracao_leao', by: 'Mestre Ricardo', at: hoursAgo(26), reactions: 9,  reacted_by: [] },
      { id: 'a3', member_id: 'm_ana',   badge_id: 'cem_aulas',    by: 'Mestre Ricardo', at: hoursAgo(27), reactions: 14, reacted_by: [] },
    ];

    const goals = [
      { id: 'g1', member_id: 'm_joao', title: 'Treinar 3x por semana', target: 3, progress: 2, period: 'semana', icon: 'target', kind: 'treinos' },
      { id: 'g2', member_id: 'm_joao', title: 'Competir até dezembro',  target: 1, progress: 0, period: 'ano',    icon: 'trophy', kind: 'custom' },
    ];

    const checkins = [
      { id: 'ck1', member_id: 'm_pedro', class_id: 'c_y1', at: isoAgo(1, 19, 2) },
      { id: 'ck2', member_id: 'm_rafa',  class_id: 'c_y1', at: isoAgo(1, 19, 3) },
      { id: 'ck3', member_id: 'm_ana',   class_id: 'c_y1', at: isoAgo(1, 19, 1) },
      { id: 'ck4', member_id: 'm_joao',  class_id: 'c_y1', at: isoAgo(1, 19, 4) },
    ];

    // earned achievements per member (for the trophy grid)
    const earned = { m_joao: ['armlock_dia', 'coracao_leao', 'madrugadeiro', 'cem_aulas'] };

    return { v: 1, members, badges, classes, posts, awards, goals, checkins, earned };
  }

  /* --------------- shared compute (used by both back-ends) -------------- */
  function decorateMember(m) {
    const c = util.clone(m);
    c.risk = util.risk(c);
    c.beltShort = (util.belt[c.belt] || util.belt.branca).short;
    c.beltLabel = (util.belt[c.belt] || util.belt.branca).label;
    c.beltColor = util.beltColor(c.belt);
    return c;
  }

  /* ----------------------------- LocalDB -------------------------------- */
  function idbOpen() {
    return new Promise((res, rej) => {
      const r = indexedDB.open('arcore-db', 1);
      r.onupgradeneeded = () => r.result.createObjectStore('state');
      r.onsuccess = () => res(r.result);
      r.onerror = () => rej(r.error);
    });
  }
  function idbGet(k) {
    return idbOpen().then((db) => new Promise((res, rej) => {
      const t = db.transaction('state', 'readonly').objectStore('state').get(k);
      t.onsuccess = () => res(t.result); t.onerror = () => rej(t.error);
    }));
  }
  function idbPut(k, v) {
    return idbOpen().then((db) => new Promise((res, rej) => {
      const t = db.transaction('state', 'readwrite').objectStore('state').put(v, k);
      t.onsuccess = () => res(); t.onerror = () => rej(t.error);
    }));
  }

  function LocalDB() { this.S = null; this.mode = 'local'; }
  LocalDB.prototype.init = async function () {
    let s = await idbGet('db');
    if (!s) { s = seedState(); }
    // keep "aula de hoje" pointing at today
    const c = s.classes.find((x) => x.id === 'c_today');
    if (c) c.datetime = todayAt(19, 0);
    this.S = s;
    // materialize today's grade horária + seed a few check-ins so the demo
    // "Chamada" (roll call) isn't empty when the professor opens it.
    this._ensureSlots();
    const slots = util.daySlots();
    if (slots.length && !this.S.checkins.some((ck) => slots.some((sl) => sl.id === ck.class_id))) {
      const demo = ['m_pedro', 'm_rafa', 'm_ana', 'm_lucas', 'm_bruna'];
      const slot = slots[slots.length - 1]; // last adult class of the day
      demo.forEach((mid) => this.S.checkins.push({ id: util.uid('ck'), member_id: mid, class_id: slot.id, at: util.nowISO(), verified: null }));
    }
    await this._save(); return this;
  };
  LocalDB.prototype.reset = async function () { this.S = seedState(); await this._save(); return this; };
  LocalDB.prototype._save = function () { return idbPut('db', this.S); };

  LocalDB.prototype.listMembers = async function () { return this.S.members.map(decorateMember); };
  LocalDB.prototype.getMember = async function (id) { const m = this.S.members.find((x) => x.id === id); return m ? decorateMember(m) : null; };
  LocalDB.prototype.updateMember = async function (id, patch) {
    const m = this.S.members.find((x) => x.id === id); if (!m) return null;
    Object.assign(m, patch); await this._save(); return decorateMember(m);
  };

  LocalDB.prototype._ensureSlots = function () {
    util.daySlots().forEach((s) => {
      if (!this.S.classes.find((c) => c.id === s.id)) {
        this.S.classes.push({ id: s.id, title: s.title, type: s.type, datetime: s.datetime, coach: s.coach });
      }
    });
  };
  LocalDB.prototype.listTodayClasses = async function () {
    this._ensureSlots(); await this._save();
    return util.daySlots().map((s) => Object.assign({}, s,
      { checkins: this.S.checkins.filter((c) => c.class_id === s.id).length }));
  };
  LocalDB.prototype.todayClass = async function () {
    const s = util.daySlots(); return s.length ? Object.assign({}, s[0]) : null;
  };
  LocalDB.prototype.listClasses = async function () { return util.clone(this.S.classes); };
  LocalDB.prototype.classCheckins = async function (classId) {
    return this.S.checkins.filter((c) => c.class_id === classId)
      .sort((a, b) => a.at.localeCompare(b.at))
      .map((c) => { const m = this.S.members.find((x) => x.id === c.member_id); return Object.assign(util.clone(c), { member: m ? decorateMember(m) : null }); });
  };
  LocalDB.prototype._adjustCredit = function (m, sign) {
    m.total_classes = Math.max(0, (m.total_classes || 0) + sign);
    m.classes_since_stripe = Math.max(0, (m.classes_since_stripe || 0) + sign);
    m.mat_hours = Math.max(0, (m.mat_hours || 0) + sign * 1.5);
    m.xp = Math.max(0, (m.xp || 0) + sign * R.xpCheckin);
    m.week_xp = Math.max(0, (m.week_xp || 0) + sign * R.xpCheckin);
  };
  LocalDB.prototype.verifyCheckin = async function (checkinId, present) {
    const c = this.S.checkins.find((x) => x.id === checkinId); if (!c) return null;
    const wasCredited = c.verified !== false;
    c.verified = present;
    if (wasCredited !== present) {
      const m = this.S.members.find((x) => x.id === c.member_id);
      if (m) this._adjustCredit(m, present ? 1 : -1);
    }
    await this._save();
    return Object.assign(util.clone(c), { member: (function (S) { const m = S.members.find((x) => x.id === c.member_id); return m ? decorateMember(m) : null; })(this.S) });
  };

  LocalDB.prototype.isCheckedInToday = async function (memberId, classId) {
    return this.S.checkins.some((c) => c.member_id === memberId && c.class_id === classId && util.sameDay(c.at));
  };
  LocalDB.prototype.checkIn = async function (memberId, classId) {
    if (await this.isCheckedInToday(memberId, classId)) return { already: true, xp: 0 };
    this._ensureSlots();
    this.S.checkins.push({ id: util.uid('ck'), member_id: memberId, class_id: classId, at: util.nowISO(), verified: null });
    const m = this.S.members.find((x) => x.id === memberId);
    let promotions = [];
    let goalsAdvanced = 0;
    if (m) {
      m.total_classes += 1; m.classes_since_stripe += 1; m.mat_hours += 1.5;
      m.last_class_at = util.nowISO(); m.xp += R.xpCheckin; m.week_xp += R.xpCheckin;
      if (m.status === 'experimental') m.status = 'ativo';
      promotions = util.promote(m);
      this.S.goals.forEach((g) => {
        if (g.member_id === memberId && g.kind === 'treinos' && g.progress < g.target) {
          g.progress += 1; goalsAdvanced += 1;
        }
      });
    }
    await this._save();
    return { already: false, xp: R.xpCheckin, promotions, goalsAdvanced, member: m ? decorateMember(m) : null };
  };
  LocalDB.prototype.promoteMember = async function (memberId, dir) {
    const m = this.S.members.find((x) => x.id === memberId); if (!m) return null;
    const i = util.beltOrder.indexOf(m.belt);
    if (dir === 'down') {
      if (m.stripes > 0) m.stripes -= 1;
      else if (i > 0) { m.belt = util.beltOrder[i - 1]; m.stripes = 4; }
    } else {
      if (m.stripes < 4) m.stripes += 1;
      else if (i < util.beltOrder.length - 1) { m.belt = util.beltOrder[i + 1]; m.stripes = 0; }
    }
    m.classes_since_stripe = 0; m.league = m.belt;
    await this._save(); return decorateMember(m);
  };
  LocalDB.prototype.checkinsToday = async function (classId) {
    return this.S.checkins.filter((c) => util.sameDay(c.at) && (!classId || c.class_id === classId)).length;
  };
  LocalDB.prototype.memberCheckins = async function (memberId) {
    return this.S.checkins.filter((c) => c.member_id === memberId)
      .sort((a, b) => b.at.localeCompare(a.at)).map(util.clone);
  };

  LocalDB.prototype.listPosts = async function () {
    return this.S.posts.slice().sort((a, b) => b.at.localeCompare(a.at)).map(util.clone);
  };
  LocalDB.prototype.createPost = async function (data) {
    const p = Object.assign({
      id: util.uid('p'), at: util.nowISO(), coach: data.coach || CFG.gym.coach || 'Professor',
      likes: 0, liked_by: [], saved_by: [], tags: data.tags || [],
    }, data);
    this.S.posts.unshift(p); await this._save(); return util.clone(p);
  };
  LocalDB.prototype.toggleSave = async function (memberId, postId) {
    const p = this.S.posts.find((x) => x.id === postId); if (!p) return false;
    p.saved_by = p.saved_by || [];
    const i = p.saved_by.indexOf(memberId);
    if (i >= 0) p.saved_by.splice(i, 1); else p.saved_by.push(memberId);
    await this._save(); return p.saved_by.indexOf(memberId) >= 0;
  };
  LocalDB.prototype.listSaved = async function (memberId) {
    return this.S.posts.filter((p) => (p.saved_by || []).includes(memberId)).map(util.clone);
  };
  LocalDB.prototype.toggleLike = async function (postId, memberId) {
    const p = this.S.posts.find((x) => x.id === postId); if (!p) return { liked: false, likes: 0 };
    p.liked_by = p.liked_by || [];
    const i = p.liked_by.indexOf(memberId);
    if (i >= 0) { p.liked_by.splice(i, 1); p.likes -= 1; } else { p.liked_by.push(memberId); p.likes += 1; }
    await this._save(); return { liked: p.liked_by.includes(memberId), likes: p.likes };
  };

  LocalDB.prototype.listBadges = async function () { return util.clone(this.S.badges); };
  LocalDB.prototype.listAwards = async function () {
    return this.S.awards.slice().sort((a, b) => b.at.localeCompare(a.at)).map((a) => {
      const m = this.S.members.find((x) => x.id === a.member_id) || {};
      const b = this.S.badges.find((x) => x.id === a.badge_id) || {};
      return Object.assign(util.clone(a), { member_name: m.name, member_avatar: m.avatar, badge: util.clone(b) });
    });
  };
  LocalDB.prototype.awardBadge = async function (memberId, badgeId, by) {
    const aw = { id: util.uid('a'), member_id: memberId, badge_id: badgeId, by: by || 'Professor', at: util.nowISO(), reactions: 0, reacted_by: [] };
    this.S.awards.unshift(aw);
    this.S.earned = this.S.earned || {};
    this.S.earned[memberId] = Array.from(new Set([...(this.S.earned[memberId] || []), badgeId]));
    const m = this.S.members.find((x) => x.id === memberId); if (m) { m.xp += 100; m.week_xp += 100; }
    await this._save(); return util.clone(aw);
  };
  LocalDB.prototype.toggleAwardReaction = async function (awardId, memberId) {
    const a = this.S.awards.find((x) => x.id === awardId); if (!a) return { reacted: false, count: 0 };
    a.reacted_by = a.reacted_by || [];
    const i = a.reacted_by.indexOf(memberId);
    if (i >= 0) { a.reacted_by.splice(i, 1); a.reactions -= 1; } else { a.reacted_by.push(memberId); a.reactions += 1; }
    await this._save(); return { reacted: a.reacted_by.includes(memberId), count: a.reactions };
  };
  LocalDB.prototype.earnedBadges = async function (memberId) {
    const ids = (this.S.earned && this.S.earned[memberId]) || [];
    return this.S.badges.map((b) => Object.assign(util.clone(b), { earned: ids.includes(b.id) }));
  };

  LocalDB.prototype.listGoals = async function (memberId) {
    return this.S.goals.filter((g) => g.member_id === memberId).map(util.clone);
  };
  LocalDB.prototype.createGoal = async function (memberId, data) {
    const g = { id: util.uid('g'), member_id: memberId, title: data.title, target: data.target || 1, progress: 0, period: data.period || 'semana', icon: data.icon || 'target', kind: data.kind || 'custom' };
    this.S.goals.push(g); await this._save(); return util.clone(g);
  };
  LocalDB.prototype.advanceGoal = async function (goalId, delta) {
    const g = this.S.goals.find((x) => x.id === goalId); if (!g) return null;
    g.progress = Math.max(0, Math.min(g.target, g.progress + (delta || 1)));
    await this._save(); return util.clone(g);
  };
  LocalDB.prototype.deleteGoal = async function (goalId) {
    this.S.goals = this.S.goals.filter((x) => x.id !== goalId); await this._save(); return { ok: true };
  };
  LocalDB.prototype.deletePost = async function (postId) {
    this.S.posts = this.S.posts.filter((p) => p.id !== postId); await this._save(); return { ok: true };
  };
  LocalDB.prototype.createClass = async function (data) {
    const c = { id: util.uid('c'), title: data.title || 'Treino', type: data.type || 'gi', datetime: data.datetime || util.nowISO(), coach: data.coach || (CFG.gym.coach || 'Professor') };
    this.S.classes.unshift(c); await this._save(); return util.clone(c);
  };

  LocalDB.prototype.leaderboard = async function () {
    return this.S.members.filter((m) => !m.silent_mode)
      .sort((a, b) => b.week_xp - a.week_xp)
      .map((m, i) => Object.assign(decorateMember(m), { pos: i + 1 }));
  };
  LocalDB.prototype.coachStats = async function () {
    const ms = this.S.members.filter((m) => m.status !== 'inativo');
    const trial = ms.filter((m) => m.status === 'experimental');
    const atRisk = ms.filter((m) => util.risk(m));
    const ativos = ms.filter((m) => m.status === 'ativo' && !util.risk(m));
    return { total: ms.length, ativos: ativos.length, experimentais: trial.length, emRisco: atRisk.length, checkinsHoje: await this.checkinsToday() };
  };
  LocalDB.prototype.atRiskMembers = async function () {
    return this.S.members.filter((m) => util.risk(m))
      .sort((a, b) => util.daysSince(b.last_class_at) - util.daysSince(a.last_class_at))
      .map((m) => Object.assign(decorateMember(m), { days: util.daysSince(m.last_class_at) }));
  };
  LocalDB.prototype.markWinBack = async function (memberId) {
    const m = this.S.members.find((x) => x.id === memberId); if (!m) return null;
    m.winback_contacted_at = util.nowISO(); await this._save(); return decorateMember(m);
  };
  LocalDB.prototype.getInvitePublic = async function () { return null; };
  LocalDB.prototype.acceptInvitation = async function () { return { ok: true }; };
  LocalDB.prototype.inviteStudent = async function (p) {
    const id = util.uid('m');
    const member = {
      id, name: p.name, belt: p.belt || 'branca', stripes: 0, status: 'experimental',
      email: p.email, phone: util.normalizePhone(p.phone), avatar: p.name.charAt(0).toUpperCase(),
      marketing_email: true, marketing_whatsapp: true,
      joined_at: util.nowISO(), last_class_at: null,
      total_classes: 0, mat_hours: 0, classes_since_stripe: 0, xp: 0, week_xp: 0,
      league: p.belt || 'branca', silent_mode: false, best_streak: 0, streak_weeks: 0, winback_contacted_at: null,
    };
    this.S.members.push(member);
    await this._save();
    return { ok: true, memberId: id, inviteLink: '?invite=demo', emailSent: false, whatsappText: 'Demo invite' };
  };

  /* ---------------------------- SupabaseDB ------------------------------ */
  /* Mesma interface, sobre o cliente supabase-js. Ativada quando há chaves.
     Tabelas: members, classes, checkins, posts, saves, badges, awards, goals
     (ver supabase/schema.sql). Recados de voz vão pro bucket "voicenotes". */
  function SupabaseDB(client) { this.sb = client; this.mode = 'supabase'; }
  const SB = SupabaseDB.prototype;
  SB.init = async function () { return this; };
  SB.reset = async function () { return this; };

  SB.listMembers = async function () {
    const { data } = await this.sb.from('members').select('*').order('name');
    return (data || []).map(decorateMember);
  };
  SB.getMember = async function (id) {
    const { data } = await this.sb.from('members').select('*').eq('id', id).single();
    return data ? decorateMember(data) : null;
  };
  SB.updateMember = async function (id, patch) {
    const { data } = await this.sb.from('members').update(patch).eq('id', id).select().single();
    return data ? decorateMember(data) : null;
  };
  SB.todayClass = async function () {
    const s = util.daySlots(); return s.length ? Object.assign({}, s[0]) : null;
  };
  SB.listTodayClasses = async function () {
    const slots = util.daySlots();
    if (!slots.length) return [];
    const start = new Date(); start.setHours(0, 0, 0, 0);
    const { data } = await this.sb.from('checkins').select('class_id').gte('at', start.toISOString());
    const counts = {};
    (data || []).forEach((c) => { counts[c.class_id] = (counts[c.class_id] || 0) + 1; });
    return slots.map((s) => Object.assign({}, s, { checkins: counts[s.id] || 0 }));
  };
  SB.classCheckins = async function (classId) {
    const { data } = await this.sb.from('checkins').select('*, members(*)').eq('class_id', classId).order('at');
    return (data || []).map((c) => Object.assign({}, c, { member: c.members ? decorateMember(c.members) : null }));
  };
  SB.verifyCheckin = async function (checkinId, present) {
    const c = (await this.sb.from('checkins').select('member_id, verified').eq('id', checkinId).single()).data;
    if (!c) return null;
    const wasCredited = c.verified !== false;
    await this.sb.from('checkins').update({ verified: present }).eq('id', checkinId);
    if (wasCredited !== present) {
      const m = await this.getMember(c.member_id);
      if (m) {
        const sign = present ? 1 : -1;
        await this.updateMember(c.member_id, {
          total_classes: Math.max(0, m.total_classes + sign),
          classes_since_stripe: Math.max(0, m.classes_since_stripe + sign),
          mat_hours: Math.max(0, m.mat_hours + sign * 1.5),
          xp: Math.max(0, m.xp + sign * R.xpCheckin),
          week_xp: Math.max(0, m.week_xp + sign * R.xpCheckin),
        });
      }
    }
    return { id: checkinId, verified: present };
  };
  SB.listClasses = async function () { const { data } = await this.sb.from('classes').select('*').order('datetime', { ascending: false }); return data || []; };
  SB.isCheckedInToday = async function (memberId, classId) {
    const start = new Date(); start.setHours(0, 0, 0, 0);
    const { count } = await this.sb.from('checkins').select('*', { count: 'exact', head: true })
      .eq('member_id', memberId).eq('class_id', classId).gte('at', start.toISOString());
    return (count || 0) > 0;
  };
  SB.checkIn = async function (memberId, classId, slot) {
    if (await this.isCheckedInToday(memberId, classId)) return { already: true, xp: 0 };
    // Make sure the slot's class row exists (security-definer RPC; students
    // can't insert into classes directly). No-op if already materialized.
    if (slot) {
      try {
        await this.sb.rpc('ensure_class', { p_id: slot.id, p_title: slot.title, p_type: slot.type, p_datetime: slot.datetime });
      } catch (e) { console.warn('ensure_class', e); }
    }
    await this.sb.from('checkins').insert({ member_id: memberId, class_id: classId, at: util.nowISO(), verified: null });
    const m = await this.getMember(memberId);
    let promotions = [];
    let goalsAdvanced = 0;
    if (m) {
      m.total_classes += 1; m.classes_since_stripe += 1; m.mat_hours += 1.5;
      m.last_class_at = util.nowISO(); m.xp += R.xpCheckin; m.week_xp += R.xpCheckin;
      if (m.status === 'experimental') m.status = 'ativo';
      promotions = util.promote(m);
      await this.updateMember(memberId, {
        total_classes: m.total_classes, classes_since_stripe: m.classes_since_stripe,
        mat_hours: m.mat_hours, last_class_at: m.last_class_at, xp: m.xp, week_xp: m.week_xp,
        belt: m.belt, stripes: m.stripes, league: m.league, status: m.status,
      });
      const { data: gs } = await this.sb.from('goals').select('*').eq('member_id', memberId).eq('kind', 'treinos');
      for (const g of (gs || [])) {
        if (g.progress < g.target) {
          await this.sb.from('goals').update({ progress: g.progress + 1 }).eq('id', g.id);
          goalsAdvanced += 1;
        }
      }
    }
    return { already: false, xp: R.xpCheckin, promotions, goalsAdvanced, member: m };
  };
  SB.promoteMember = async function (memberId, dir) {
    const m = await this.getMember(memberId); if (!m) return null;
    const i = util.beltOrder.indexOf(m.belt);
    if (dir === 'down') {
      if (m.stripes > 0) m.stripes -= 1;
      else if (i > 0) { m.belt = util.beltOrder[i - 1]; m.stripes = 4; }
    } else {
      if (m.stripes < 4) m.stripes += 1;
      else if (i < util.beltOrder.length - 1) { m.belt = util.beltOrder[i + 1]; m.stripes = 0; }
    }
    return this.updateMember(memberId, { belt: m.belt, stripes: m.stripes, classes_since_stripe: 0, league: m.belt });
  };
  SB.deletePost = async function (postId) { await this.sb.from('posts').delete().eq('id', postId); return { ok: true }; };
  SB.createClass = async function (data) {
    const { data: ins } = await this.sb.from('classes').insert({
      id: util.uid('c'), title: data.title || 'Treino', type: data.type || 'gi',
      datetime: data.datetime || util.nowISO(), coach: data.coach || (CFG.gym.coach || 'Professor'),
    }).select().single();
    return ins;
  };
  SB.advanceGoal = async function (goalId, delta) {
    const g = (await this.sb.from('goals').select('*').eq('id', goalId).single()).data; if (!g) return null;
    const progress = Math.max(0, Math.min(g.target, g.progress + (delta || 1)));
    const { data } = await this.sb.from('goals').update({ progress }).eq('id', goalId).select().single();
    return data;
  };
  SB.deleteGoal = async function (goalId) { await this.sb.from('goals').delete().eq('id', goalId); return { ok: true }; };
  SB.checkinsToday = async function (classId) {
    const start = new Date(); start.setHours(0, 0, 0, 0);
    let q = this.sb.from('checkins').select('*', { count: 'exact', head: true }).gte('at', start.toISOString());
    if (classId) q = q.eq('class_id', classId);
    const { count } = await q; return count || 0;
  };
  SB.memberCheckins = async function (memberId) { const { data } = await this.sb.from('checkins').select('*').eq('member_id', memberId).order('at', { ascending: false }); return data || []; };
  SB.listPosts = async function () { const { data } = await this.sb.from('posts').select('*').order('at', { ascending: false }); return data || []; };
  SB.createPost = async function (data) {
    let voice = data.voice_note;
    if (voice && voice.startsWith('data:')) {
      const blob = util.dataURLtoBlob(voice);
      const path = 'vn_' + Date.now() + '.webm';
      const up = await this.sb.storage.from('voicenotes').upload(path, blob, { contentType: blob.type, upsert: true });
      if (!up.error) voice = this.sb.storage.from('voicenotes').getPublicUrl(path).data.publicUrl;
    }
    const row = Object.assign({}, data, { voice_note: voice, at: util.nowISO(), likes: 0, liked_by: [], saved_by: [] });
    const { data: ins } = await this.sb.from('posts').insert(row).select().single();
    this._push({ audience: 'members', title: 'Nova técnica no app 🥋', body: (ins && ins.title) || data.title || '', url: './', tag: 'tecnica' });
    return ins;
  };
  /* Fire-and-forget web push via the push-send edge function. Never blocks. */
  SB._push = function (body) {
    try { this.sb.functions.invoke('push-send', { body }).catch(() => {}); } catch (e) { /* ignore */ }
  };
  SB.toggleSave = async function (memberId, postId) {
    const p = (await this.sb.from('posts').select('saved_by').eq('id', postId).single()).data || { saved_by: [] };
    const arr = p.saved_by || []; const i = arr.indexOf(memberId);
    if (i >= 0) arr.splice(i, 1); else arr.push(memberId);
    await this.sb.from('posts').update({ saved_by: arr }).eq('id', postId);
    return arr.includes(memberId);
  };
  SB.listSaved = async function (memberId) { const { data } = await this.sb.from('posts').select('*').contains('saved_by', [memberId]); return data || []; };
  SB.toggleLike = async function (postId, memberId) {
    const p = (await this.sb.from('posts').select('likes,liked_by').eq('id', postId).single()).data || { likes: 0, liked_by: [] };
    const arr = p.liked_by || []; const i = arr.indexOf(memberId); let likes = p.likes;
    if (i >= 0) { arr.splice(i, 1); likes -= 1; } else { arr.push(memberId); likes += 1; }
    await this.sb.from('posts').update({ liked_by: arr, likes }).eq('id', postId);
    return { liked: arr.includes(memberId), likes };
  };
  SB.listBadges = async function () { const { data } = await this.sb.from('badges').select('*'); return data || []; };
  SB.listAwards = async function () {
    const { data } = await this.sb.from('awards').select('*, members(name,avatar), badges(*)').order('at', { ascending: false });
    return (data || []).map((a) => Object.assign({}, a, { member_name: a.members && a.members.name, member_avatar: a.members && a.members.avatar, badge: a.badges }));
  };
  SB.awardBadge = async function (memberId, badgeId, by) {
    const { data } = await this.sb.from('awards').insert({ member_id: memberId, badge_id: badgeId, by: by || 'Professor', at: util.nowISO(), reactions: 0, reacted_by: [] }).select().single();
    const m = await this.getMember(memberId); if (m) await this.updateMember(memberId, { xp: m.xp + 100, week_xp: m.week_xp + 100 });
    const b = (await this.sb.from('badges').select('name').eq('id', badgeId).single()).data;
    this._push({ audience: 'member', member_id: memberId, title: 'Novo selo! 🏅', body: (b && b.name) ? ('Você ganhou "' + b.name + '"') : 'Você foi reconhecido pelo professor', url: './', tag: 'selo' });
    return data;
  };
  SB.toggleAwardReaction = async function (awardId, memberId) {
    const a = (await this.sb.from('awards').select('reactions,reacted_by').eq('id', awardId).single()).data || { reactions: 0, reacted_by: [] };
    const arr = a.reacted_by || []; const i = arr.indexOf(memberId); let count = a.reactions;
    if (i >= 0) { arr.splice(i, 1); count -= 1; } else { arr.push(memberId); count += 1; }
    await this.sb.from('awards').update({ reacted_by: arr, reactions: count }).eq('id', awardId);
    return { reacted: arr.includes(memberId), count };
  };
  SB.earnedBadges = async function (memberId) {
    const all = await this.listBadges();
    const { data } = await this.sb.from('awards').select('badge_id').eq('member_id', memberId);
    const ids = (data || []).map((x) => x.badge_id);
    return all.map((b) => Object.assign({}, b, { earned: ids.includes(b.id) }));
  };
  SB.listGoals = async function (memberId) { const { data } = await this.sb.from('goals').select('*').eq('member_id', memberId); return data || []; };
  SB.createGoal = async function (memberId, d) {
    const { data } = await this.sb.from('goals').insert({ member_id: memberId, title: d.title, target: d.target || 1, progress: 0, period: d.period || 'semana', icon: d.icon || 'target', kind: d.kind || 'custom' }).select().single();
    return data;
  };
  SB.leaderboard = async function () {
    const { data } = await this.sb.from('members').select('*').eq('silent_mode', false).order('week_xp', { ascending: false });
    return (data || []).map((m, i) => Object.assign(decorateMember(m), { pos: i + 1 }));
  };
  SB.coachStats = async function () {
    const ms = await this.listMembers();
    const live = ms.filter((m) => m.status !== 'inativo');
    return {
      total: live.length,
      ativos: live.filter((m) => m.status === 'ativo' && !m.risk).length,
      experimentais: live.filter((m) => m.status === 'experimental').length,
      emRisco: live.filter((m) => m.risk).length,
      checkinsHoje: await this.checkinsToday(),
    };
  };
  SB.atRiskMembers = async function () {
    const ms = await this.listMembers();
    return ms.filter((m) => m.risk).map((m) => Object.assign(m, { days: util.daysSince(m.last_class_at) }))
      .sort((a, b) => b.days - a.days);
  };
  SB.markWinBack = async function (memberId) { return this.updateMember(memberId, { winback_contacted_at: util.nowISO() }); };

  SB.getInvitePublic = async function (token) {
    const { data, error } = await this.sb.rpc('get_invite_public', { p_token: token });
    if (error) throw error;
    return data;
  };
  SB.acceptInvitation = async function (token) {
    const { data, error } = await this.sb.rpc('accept_invitation', { p_token: token });
    if (error) throw error;
    return data;
  };
  SB.inviteStudent = async function (payload) {
    const { data, error } = await this.sb.functions.invoke('invite-student', { body: payload });
    if (error) throw error;
    if (data && data.error) throw new Error(data.error);
    return data;
  };

  /* ----------------------------- factory -------------------------------- */
  function loadScript(src) {
    return new Promise((res, rej) => {
      const s = document.createElement('script'); s.src = src; s.onload = res; s.onerror = rej; document.head.appendChild(s);
    });
  }
  A.createDB = async function () {
    const sc = CFG.supabase;
    const authOn = A.auth && A.auth.isEnabled && A.auth.isEnabled();
    if (sc && sc.url && sc.anonKey) {
      try {
        if (authOn) {
          if (!A.auth.client) await A.auth.init();
        } else if (!window.supabase) {
          await loadScript('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2');
        }
        const client = authOn ? A.auth.getClient() : window.supabase.createClient(sc.url, sc.anonKey);
        A.mode = 'supabase';
        return await new SupabaseDB(client).init();
      } catch (e) {
        console.warn('Supabase indisponível, usando modo local:', e);
      }
    }
    A.mode = 'local';
    return await new LocalDB().init();
  };
})(window.Arcore);
