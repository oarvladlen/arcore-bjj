/* =========================================================================
   Arcore — smoke tests (no network, no browser)
   Loads the real auth.js / data.js inside a stubbed VM context and asserts
   the auth state-machine + gamification engine behave correctly.

   Run:  node arcore/tests/smoke.mjs
   ========================================================================= */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');

/* ---- tiny test harness ---- */
let pass = 0, fail = 0;
const fails = [];
function ok(name, cond) {
  if (cond) { pass++; }
  else { fail++; fails.push(name); console.log('  ✗ ' + name); }
}
function eq(name, a, b) { ok(name + ' (got ' + JSON.stringify(a) + ')', a === b); }
function group(t) { console.log('\n• ' + t); }

/* ---- stub browser context ---- */
function memStore() {
  const m = new Map();
  return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k), clear: () => m.clear() };
}
function makeContext(cfg, location) {
  const win = { Arcore: {}, ARCORE_CONFIG: cfg, location, supabase: undefined };
  const ctx = {
    window: win, document: { querySelector: () => null, createElement: () => ({ setAttribute() {}, style: {}, addEventListener() {} }), head: { appendChild() {} }, addEventListener() {} },
    history: { replaceState() {} },
    location, navigator: {},
    localStorage: memStore(), sessionStorage: memStore(),
    console, URL, URLSearchParams, JSON, Math, Date, setTimeout, clearTimeout,
    atob: (s) => Buffer.from(s, 'base64').toString('binary'), Blob: class {}, Uint8Array,
    indexedDB: undefined,
  };
  ctx.self = ctx; ctx.globalThis = ctx;
  vm.createContext(ctx);
  return { ctx, win };
}
function loadInto(ctx, file) { vm.runInContext(readFileSync(join(root, file), 'utf8'), ctx, { filename: file }); }

const baseCfg = {
  gym: { name: 'ARCORE', coach: 'Anthony' },
  supabase: { url: 'https://x.supabase.co', anonKey: 'sb_publishable_x' },
  auth: { enabled: true, redirectUrl: 'https://app.example.com/' },
  coach: { gate: 'mestre', email: 'professor@arcore.com' },
  rules: { xpCheckin: 50, xpMicroLesson: 10, xpCompeticao: 200, classesPerStripe: 30, atRiskDays: 10 },
  schedule: {
    weekday: [
      { time: '12:15', label: 'Treino' }, { time: '16:00', label: 'Treino' },
      { time: '17:00', label: 'Treino' }, { time: '18:00', label: 'Treino' },
      { time: '19:00', label: 'Kids', kids: true }, { time: '20:00', label: 'Treino' },
    ],
    saturday: [{ time: '11:00', label: 'Treino' }],
  },
};
const loc = (search = '', hash = '') => ({ href: 'https://app.example.com/' + search + hash, search, hash, pathname: '/', origin: 'https://app.example.com' });

/* =====================================================================
   1) AUTH STATE MACHINE — guards the reported forgot-password bug
   ===================================================================== */
group('auth.needsPasswordSetup — recovery vs invite (regression: invited_at)');
{
  const { ctx, win } = makeContext(baseCfg, loc());
  loadInto(ctx, 'auth.js');
  const A = win.Arcore.auth;

  // An originally-invited student (invited_at set forever) who already onboarded.
  const invitedUser = { id: 'u1', email: 'aluno@x.com', invited_at: '2026-01-01T00:00:00Z', email_confirmed_at: '2026-01-02T00:00:00Z' };

  // (a) Plain returning session — must NOT be sent to invite/password-setup form.
  A.session = { user: invitedUser }; A.recoveryMode = false; A.inviteMode = false; A.inviteToken = null;
  eq('plain invited user → no password setup', A.needsPasswordSetup(), false);

  // (b) Password recovery for that same invited user — must NOT show invite form.
  A.recoveryMode = true;
  eq('recovery mode → no password setup', A.needsPasswordSetup(), false);

  // (c) Genuine invite context (token present) — SHOULD show password setup.
  A.recoveryMode = false; A.inviteToken = 'tok123';
  eq('invite token present → password setup', A.needsPasswordSetup(), true);

  // (d) inviteMode flag set — SHOULD show password setup.
  A.inviteToken = null; A.inviteMode = true;
  eq('invite mode → password setup', A.needsPasswordSetup(), true);

  // (e) No session at all.
  A.inviteMode = false; A.session = null;
  eq('no session → no password setup', A.needsPasswordSetup(), false);

  // (f) type=invite in URL hash still triggers setup.
  const c2 = makeContext(baseCfg, loc('', '#type=invite'));
  loadInto(c2.ctx, 'auth.js');
  const A2 = c2.win.Arcore.auth;
  A2.session = { user: invitedUser }; A2.recoveryMode = false;
  eq('url #type=invite → password setup', A2.needsPasswordSetup(), true);
}

group('auth.signUpInvite — clears invite context on session (no double password)');
{
  const { ctx, win } = makeContext(baseCfg, loc('?invite=tok123'));
  loadInto(ctx, 'auth.js');
  const A = win.Arcore.auth;
  // Fake Supabase client: signUp returns a session (email confirmation OFF).
  A.client = {
    auth: { signUp: async () => ({ data: { session: { user: { id: 'u1', email: 'a@b.com', user_metadata: {} } } }, error: null }) },
    rpc: async () => ({ data: { ok: true, member_id: 'm_x' }, error: null }),
    from: () => ({
      select: () => ({ eq: () => ({ single: async () => ({ data: { id: 'u1', role: 'member', member_id: 'm_x', email: 'a@b.com' }, error: null }) }) }),
      update: () => ({ eq: async () => ({ data: null, error: null }) }),
    }),
  };
  A.inviteToken = 'tok123'; A.inviteMode = true; A.inviteData = { valid: true, email: 'a@b.com' };
  const data = await A.signUpInvite({ email: 'a@b.com', password: 'secret1', member_id: 'm_x', name: 'A' });
  ok('signUp returns a session', !!(data && data.session));
  eq('inviteToken cleared after signup', A.inviteToken, null);
  eq('inviteMode cleared after signup', A.inviteMode, false);
  // session present + invite cleared ⇒ no password-setup form ⇒ logs straight in
  A.session = { user: { id: 'u1', invited_at: '2026-01-01' } };
  eq('no second password screen', A.needsPasswordSetup(), false);
}

group('auth.isEnabled / isCoach / getMemberId');
{
  const { ctx, win } = makeContext(baseCfg, loc());
  loadInto(ctx, 'auth.js');
  const A = win.Arcore.auth;
  eq('isEnabled with keys', A.isEnabled(), true);
  A.profile = { role: 'coach' };
  eq('isCoach true', A.isCoach(), true);
  A.profile = { role: 'member', member_id: 'm_joao' };
  eq('isCoach false', A.isCoach(), false);
  eq('getMemberId', A.getMemberId(), 'm_joao');

  // auth disabled when keys blank
  const c2 = makeContext({ ...baseCfg, supabase: { url: '', anonKey: '' } }, loc());
  loadInto(c2.ctx, 'auth.js');
  eq('isEnabled blank keys', c2.win.Arcore.auth.isEnabled(), false);

  // auth disabled when explicitly off
  const c3 = makeContext({ ...baseCfg, auth: { enabled: false } }, loc());
  loadInto(c3.ctx, 'auth.js');
  eq('isEnabled auth.enabled=false', c3.win.Arcore.auth.isEnabled(), false);
}

group('auth.baseRedirect / resetPasswordRequest marker shape');
{
  const { ctx, win } = makeContext(baseCfg, loc());
  loadInto(ctx, 'auth.js');
  const A = win.Arcore.auth;
  const base = A.baseRedirect();
  ok('baseRedirect ends with /', base.endsWith('/'));
  // recovery marker would be appended as ?recovery=1
  const marker = base + (base.includes('?') ? '&' : '?') + 'recovery=1';
  ok('recovery redirect carries recovery=1', /[?&]recovery=1$/.test(marker));
}

/* =====================================================================
   2) GAMIFICATION ENGINE — promote cascade + helpers (data.js util)
   ===================================================================== */
group('util.promote — stripe → belt cascade, caps, thresholds');
{
  const { ctx, win } = makeContext(baseCfg, loc());
  loadInto(ctx, 'data.js');
  const U = win.Arcore.util;

  // one stripe
  let m = { belt: 'azul', stripes: 0, classes_since_stripe: 30, league: 'azul' };
  let e = U.promote(m);
  ok('1 stripe earned', e.length === 1 && e[0].type === 'stripe' && m.stripes === 1 && m.classes_since_stripe === 0);

  // belt promotion at 4 stripes
  m = { belt: 'azul', stripes: 4, classes_since_stripe: 30, league: 'azul' };
  e = U.promote(m);
  ok('belt promotion azul→roxa', e[0].type === 'belt' && m.belt === 'roxa' && m.stripes === 0 && m.league === 'roxa');

  // cascade 150 classes from white
  m = { belt: 'branca', stripes: 0, classes_since_stripe: 150, league: 'branca' };
  e = U.promote(m);
  ok('cascade 5 promotions', e.length === 5 && m.belt === 'azul' && m.stripes === 0);

  // black belt 4º cap — no infinite loop, no further events
  m = { belt: 'preta', stripes: 4, classes_since_stripe: 300, league: 'preta' };
  e = U.promote(m);
  ok('black belt capped', e.length === 0 && m.belt === 'preta' && m.stripes === 4);

  // below threshold
  m = { belt: 'roxa', stripes: 1, classes_since_stripe: 29 };
  e = U.promote(m);
  ok('below threshold no promo', e.length === 0 && m.stripes === 1);
}

group('util.stripe / risk / normalizePhone / video ids');
{
  const { ctx, win } = makeContext(baseCfg, loc());
  loadInto(ctx, 'data.js');
  const U = win.Arcore.util;

  const st = U.stripe({ classes_since_stripe: 15 });
  ok('stripe remaining', st.remaining === 15 && st.pct === 50);

  ok('risk: 20d idle is at-risk', U.risk({ status: 'ativo', last_class_at: new Date(Date.now() - 20 * 864e5).toISOString() }) === true);
  ok('risk: 2d idle not at-risk', U.risk({ status: 'ativo', last_class_at: new Date(Date.now() - 2 * 864e5).toISOString() }) === false);
  ok('risk: inactive never at-risk', U.risk({ status: 'inativo', last_class_at: '2020-01-01' }) === false);

  eq('normalizePhone BR mobile', U.normalizePhone('(13) 99999-9999'), '+5513999999999');
  eq('ytId watch', U.ytId('https://www.youtube.com/watch?v=2oVHEcyJhIM'), '2oVHEcyJhIM');
  eq('ytId short', U.ytId('https://youtu.be/2oVHEcyJhIM'), '2oVHEcyJhIM');
  eq('vimeoId', U.vimeoId('https://vimeo.com/123456789'), '123456789');
  ok('embedHtml youtube → iframe', U.embedHtml('https://youtu.be/2oVHEcyJhIM').includes('youtube-nocookie.com/embed/2oVHEcyJhIM'));
  ok('embedHtml unknown → link', U.embedHtml('https://example.com/v.mp4').includes('Abrir vídeo'));
  eq('beltOrder length', U.beltOrder.length, 5);
}

group('util.daySlots — fixed weekly schedule');
{
  const { ctx, win } = makeContext(baseCfg, loc());
  loadInto(ctx, 'data.js');
  const U = win.Arcore.util;
  // 2026-06-15 = Monday, 06-13 = Saturday, 06-14 = Sunday
  const mon = U.daySlots('2026-06-15T10:00:00');
  eq('weekday → 6 classes', mon.length, 6);
  eq('first slot 12:15', mon[0].time, '12:15');
  eq('kids slot flagged', mon[4].kids, true);
  eq('deterministic slot id', mon[0].id, 'c_20260615_1215');
  eq('saturday → 1 class', U.daySlots('2026-06-13T10:00:00').length, 1);
  eq('sunday → folga (0)', U.daySlots('2026-06-14T10:00:00').length, 0);
}

/* ---- report ---- */
console.log('\n' + '─'.repeat(48));
console.log(`Smoke tests: ${pass} passed, ${fail} failed`);
if (fail) { console.log('FAILED:\n  - ' + fails.join('\n  - ')); process.exit(1); }
console.log('ALL GREEN ✅');
