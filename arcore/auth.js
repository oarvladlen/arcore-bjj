/* =========================================================================
   Arcore — autenticação (Supabase Auth)
   E-mail + senha com confirmação por e-mail. Perfil em `profiles`.
   Serviço: Supabase Auth (e-mails via Supabase ou SMTP customizado).
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
    recoveryMode: false,
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

  auth.redirectTo = function () {
    return (CFG.auth && CFG.auth.redirectUrl) ||
      window.location.origin + window.location.pathname;
  };

  auth.isEmailConfirmed = function () {
    return !!(auth.session && auth.session.user && auth.session.user.email_confirmed_at);
  };

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

  function detectRecovery() {
    const hash = window.location.hash.replace(/^#/, '');
    const q = new URLSearchParams(hash);
    if (q.get('type') === 'recovery') auth.recoveryMode = true;
  }

  auth.init = async function () {
    if (!auth.isEnabled()) { auth.ready = true; return auth; }

    if (!window.supabase) {
      await loadScript('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2');
    }

    detectRecovery();

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

    auth.client.auth.onAuthStateChange(async (event, session) => {
      auth.session = session;
      if (event === 'PASSWORD_RECOVERY') auth.recoveryMode = true;
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

  auth.signUp = async function (email, password) {
    if (!auth.client) throw new Error('Auth não configurado');
    const { data, error } = await auth.client.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: {
        emailRedirectTo: auth.redirectTo(),
        data: { role: 'member' },
      },
    });
    if (error) throw error;
    return data;
  };

  auth.signInPassword = async function (email, password) {
    if (!auth.client) throw new Error('Auth não configurado');
    const { data, error } = await auth.client.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });
    if (error) {
      const msg = (error.message || '').toLowerCase();
      if (error.code === 'email_not_confirmed' || msg.includes('email not confirmed')) {
        const e = new Error('Confirme seu e-mail antes de entrar.');
        e.code = 'email_not_confirmed';
        e.email = email.trim().toLowerCase();
        throw e;
      }
      throw error;
    }
    if (data.user && !data.user.email_confirmed_at) {
      await auth.client.auth.signOut();
      const e = new Error('Confirme seu e-mail antes de entrar.');
      e.code = 'email_not_confirmed';
      e.email = email.trim().toLowerCase();
      throw e;
    }
    return data;
  };

  auth.resendConfirmation = async function (email) {
    if (!auth.client) throw new Error('Auth não configurado');
    const { error } = await auth.client.auth.resend({
      type: 'signup',
      email: email.trim().toLowerCase(),
      options: { emailRedirectTo: auth.redirectTo() },
    });
    if (error) throw error;
  };

  auth.resetPasswordRequest = async function (email) {
    if (!auth.client) throw new Error('Auth não configurado');
    const { error } = await auth.client.auth.resetPasswordForEmail(
      email.trim().toLowerCase(),
      { redirectTo: auth.redirectTo() }
    );
    if (error) throw error;
  };

  auth.updatePassword = async function (password) {
    if (!auth.client) throw new Error('Auth não configurado');
    const { data, error } = await auth.client.auth.updateUser({ password });
    if (error) throw error;
    auth.recoveryMode = false;
    if (window.location.hash) {
      history.replaceState(null, '', window.location.pathname + window.location.search);
    }
    return data;
  };

  auth.signOut = async function () {
    if (auth.client) await auth.client.auth.signOut();
    auth.session = null;
    auth.profile = null;
    auth.recoveryMode = false;
    localStorage.removeItem('arcore.session');
    emit();
  };

  auth.getClient = function () { return auth.client; };
})(window.Arcore);
