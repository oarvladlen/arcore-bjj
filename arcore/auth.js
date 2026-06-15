/* =========================================================================
   Arcore — autenticação (Supabase Auth)
   Magic link por e-mail. Perfil (role + member_id) vem da tabela profiles.
   ========================================================================= */
window.Arcore = window.Arcore || {};
(function (A) {
  'use strict';
  const CFG = window.ARCORE_CONFIG;

  const auth = (A.auth = {
    client: null,
    session: null,
    profile: null,
    ready: false,
    listeners: [],
  });

  function emit() {
    auth.listeners.forEach((fn) => { try { fn(auth); } catch (e) { console.error(e); } });
  }

  auth.onChange = function (fn) {
    auth.listeners.push(fn);
    return () => { auth.listeners = auth.listeners.filter((f) => f !== fn); };
  };

  auth.isEnabled = function () {
    const sc = CFG.supabase;
    if (!(sc && sc.url && sc.anonKey)) return false;
    if (CFG.auth && CFG.auth.enabled === false) return false;
    return true;
  };

  auth.isCoach = function () { return auth.profile && auth.profile.role === 'coach'; };
  auth.getMemberId = function () { return auth.profile && auth.profile.member_id; };

  function loadScript(src) {
    return new Promise((res, rej) => {
      if (document.querySelector('script[src="' + src + '"]')) { res(); return; }
      const s = document.createElement('script');
      s.src = src;
      s.onload = res;
      s.onerror = rej;
      document.head.appendChild(s);
    });
  }

  auth.init = async function () {
    if (!auth.isEnabled()) { auth.ready = true; return auth; }

    if (!window.supabase) {
      await loadScript('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2');
    }

    const sc = CFG.supabase;
    auth.client = window.supabase.createClient(sc.url, sc.anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: 'pkce',
      },
    });

    const { data: { session } } = await auth.client.auth.getSession();
    auth.session = session;
    if (session) await auth.loadProfile();

    auth.client.auth.onAuthStateChange(async (_event, session) => {
      auth.session = session;
      if (session) await auth.loadProfile();
      else auth.profile = null;
      auth.ready = true;
      emit();
    });

    auth.ready = true;
    return auth;
  };

  auth.loadProfile = async function () {
    if (!auth.client || !auth.session) { auth.profile = null; return null; }
    const uid = auth.session.user.id;
    const { data, error } = await auth.client
      .from('profiles')
      .select('id, member_id, role, email, display_name')
      .eq('id', uid)
      .single();

    if (error || !data) {
      // Fallback: profile ainda não criou (trigger delay) — monta mínimo da sessão
      auth.profile = {
        id: uid,
        member_id: auth.session.user.user_metadata && auth.session.user.user_metadata.member_id,
        role: (auth.session.user.user_metadata && auth.session.user.user_metadata.role) || 'member',
        email: auth.session.user.email,
        display_name: auth.session.user.email && auth.session.user.email.split('@')[0],
      };
      return auth.profile;
    }
    auth.profile = data;
    return auth.profile;
  };

  auth.signIn = async function (email) {
    if (!auth.client) throw new Error('Auth não configurado');
    const redirectTo = CFG.auth.redirectUrl || window.location.origin + window.location.pathname;
    const { error } = await auth.client.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: { emailRedirectTo: redirectTo },
    });
    if (error) throw error;
    return true;
  };

  auth.signOut = async function () {
    if (auth.client) await auth.client.auth.signOut();
    auth.session = null;
    auth.profile = null;
    localStorage.removeItem('arcore.session');
    emit();
  };

  auth.getClient = function () { return auth.client; };
})(window.Arcore);
