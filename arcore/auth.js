/* =========================================================================
   Arcore — autenticação (Supabase Auth)
   Aluno: convite → criar senha. Professor: login e-mail/senha.
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
    inviteMode: false,
    inviteToken: null,
    inviteData: null,
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
    const base = (CFG.auth && CFG.auth.redirectUrl) ||
      window.location.origin + window.location.pathname;
    if (auth.inviteToken) {
      const sep = base.includes('?') ? '&' : '?';
      return base + sep + 'invite=' + encodeURIComponent(auth.inviteToken);
    }
    return base;
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

  function parseUrlAuth() {
    const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''));
    const q = new URLSearchParams(window.location.search);
    if (hash.get('type') === 'recovery') auth.recoveryMode = true;
    if (hash.get('type') === 'invite') auth.inviteMode = true;
    const tok = q.get('invite');
    if (tok) {
      auth.inviteToken = tok;
      auth.inviteMode = true;
    }
  }

  auth.loadInvite = async function (token) {
    if (!auth.client || !token) return null;
    const { data, error } = await auth.client.rpc('get_invite_public', { p_token: token });
    if (error || !data || !data.valid) return null;
    auth.inviteData = data;
    auth.inviteToken = token;
    return data;
  };

  auth.init = async function () {
    if (!auth.isEnabled()) { auth.ready = true; return auth; }

    if (!window.supabase) {
      await loadScript('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2');
    }

    parseUrlAuth();

    const sc = CFG.supabase;
    auth.client = window.supabase.createClient(sc.url, sc.anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: 'pkce',
      },
    });

    if (auth.inviteToken && !auth.inviteData) {
      await auth.loadInvite(auth.inviteToken);
    }

    const { data: { session } } = await auth.client.auth.getSession();
    auth.session = session;
    if (session) await auth.loadProfile();

    auth.client.auth.onAuthStateChange(async (event, session) => {
      auth.session = session;
      if (event === 'PASSWORD_RECOVERY') auth.recoveryMode = true;
      if (event === 'USER_UPDATED' && session) auth.inviteMode = false;
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
      .select('id, member_id, role, email, display_name, phone, marketing_email, marketing_whatsapp')
      .eq('id', uid)
      .single();

    if (error || !data) {
      auth.profile = {
        id: uid,
        member_id: auth.session.user.user_metadata && auth.session.user.user_metadata.member_id,
        role: (auth.session.user.user_metadata && auth.session.user.user_metadata.role) || 'member',
        email: auth.session.user.email,
        display_name: auth.session.user.email && auth.session.user.email.split('@')[0],
        phone: auth.session.user.user_metadata && auth.session.user.user_metadata.phone,
        marketing_email: true,
        marketing_whatsapp: true,
      };
      return auth.profile;
    }
    auth.profile = data;
    return auth.profile;
  };

  auth.signUpInvite = async function (opts) {
    if (!auth.client) throw new Error('Auth não configurado');
    const email = opts.email.trim().toLowerCase();
    const { data, error } = await auth.client.auth.signUp({
      email,
      password: opts.password,
      options: {
        emailRedirectTo: auth.redirectTo(),
        data: {
          role: 'member',
          member_id: opts.member_id,
          display_name: opts.name,
          phone: opts.phone,
          marketing_email: opts.marketing_email,
          marketing_whatsapp: opts.marketing_whatsapp,
        },
      },
    });
    if (error) throw error;
    if (opts.member_id) {
      await auth.client.from('members').update({
        phone: opts.phone,
        marketing_email: opts.marketing_email,
        marketing_whatsapp: opts.marketing_whatsapp,
      }).eq('id', opts.member_id);
    }
    if (auth.inviteToken && data.user) {
      await auth.client.rpc('accept_invitation', { p_token: auth.inviteToken }).catch(() => {});
    }
    return data;
  };

  auth.completeInvitePassword = async function (password, extras) {
    if (!auth.client) throw new Error('Auth não configurado');
    const patch = { password };
    if (extras) {
      patch.data = {
        phone: extras.phone,
        marketing_email: extras.marketing_email,
        marketing_whatsapp: extras.marketing_whatsapp,
      };
    }
    const { data, error } = await auth.client.auth.updateUser(patch);
    if (error) throw error;
    if (auth.inviteToken) {
      await auth.client.rpc('accept_invitation', { p_token: auth.inviteToken });
    }
    if (extras && auth.profile && auth.profile.member_id) {
      await auth.client.from('members').update({
        phone: extras.phone,
        marketing_email: extras.marketing_email,
        marketing_whatsapp: extras.marketing_whatsapp,
      }).eq('id', auth.profile.member_id);
    }
    auth.inviteMode = false;
    if (window.location.search.includes('invite=')) {
      const u = new URL(window.location.href);
      u.searchParams.delete('invite');
      history.replaceState(null, '', u.pathname + u.search + u.hash);
    }
    return data;
  };

  auth.signInCoach = async function (password) {
    const email = (CFG.coach && CFG.coach.email) || 'professor@arcore.com';
    return auth.signInPassword(email, password, 'coach');
  };

  auth.signInPassword = async function (email, password, expectRole) {
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
    await auth.loadProfile();
    if (expectRole === 'coach' && (!auth.profile || auth.profile.role !== 'coach')) {
      await auth.client.auth.signOut();
      auth.profile = null;
      auth.session = null;
      const e = new Error('Esta conta não é de professor.');
      e.code = 'not_coach';
      throw e;
    }
    if (expectRole === 'member' && auth.profile && auth.profile.role === 'coach') {
      await auth.client.auth.signOut();
      auth.profile = null;
      auth.session = null;
      const e = new Error('Use a entrada de Professor.');
      e.code = 'is_coach';
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
    auth.inviteMode = false;
    localStorage.removeItem('arcore.session');
    emit();
  };

  auth.getClient = function () { return auth.client; };
})(window.Arcore);
