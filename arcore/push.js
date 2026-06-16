/* =========================================================================
   Arcore — Web Push (PWA notifications)
   Subscribes the device and stores the subscription in Supabase. Sending is
   done server-side by the `push-send` edge function (holds the VAPID private
   key). Only works in production (Supabase mode) on HTTPS/localhost.
   ========================================================================= */
window.Arcore = window.Arcore || {};
(function (A) {
  'use strict';
  const CFG = window.ARCORE_CONFIG;
  const push = (A.push = {});

  push.supported = function () {
    return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
  };
  push.vapid = function () { return (CFG.push && CFG.push.vapidPublic) || ''; };
  push.permission = function () { return push.supported() ? Notification.permission : 'unsupported'; };
  // Show the opt-in only when it can actually work: supported + VAPID key +
  // Supabase auth (we need a session to store the subscription).
  push.available = function () {
    return push.supported() && !!push.vapid() &&
      !!(A.auth && A.auth.isEnabled && A.auth.isEnabled());
  };

  function urlB64ToUint8Array(base64) {
    const pad = '='.repeat((4 - (base64.length % 4)) % 4);
    const b64 = (base64 + pad).replace(/-/g, '+').replace(/_/g, '/');
    const raw = atob(b64);
    const arr = new Uint8Array(raw.length);
    for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
    return arr;
  }

  push.getSubscription = async function () {
    if (!push.supported()) return null;
    try { const reg = await navigator.serviceWorker.ready; return await reg.pushManager.getSubscription(); }
    catch (e) { return null; }
  };
  push.isSubscribed = async function () { return !!(await push.getSubscription()); };

  push.enable = async function () {
    if (!push.supported()) return { ok: false, reason: 'unsupported' };
    if (!push.vapid()) return { ok: false, reason: 'no_vapid' };
    const perm = await Notification.requestPermission();
    if (perm !== 'granted') return { ok: false, reason: perm };
    const reg = await navigator.serviceWorker.ready;
    let sub = await reg.pushManager.getSubscription();
    if (!sub) {
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlB64ToUint8Array(push.vapid()),
      });
    }
    await push.save(sub);
    return { ok: true };
  };

  push.save = async function (sub) {
    const client = A.auth && A.auth.getClient && A.auth.getClient();
    const profile = A.auth && A.auth.profile;
    if (!client || !profile) return;
    const j = sub.toJSON();
    await client.from('push_subscriptions').upsert({
      endpoint: sub.endpoint,
      p256dh: j.keys && j.keys.p256dh,
      auth: j.keys && j.keys.auth,
      member_id: profile.member_id || null,
      user_id: profile.id,
    }, { onConflict: 'endpoint' });
  };

  push.disable = async function () {
    const sub = await push.getSubscription();
    if (!sub) return;
    const client = A.auth && A.auth.getClient && A.auth.getClient();
    if (client) { try { await client.from('push_subscriptions').delete().eq('endpoint', sub.endpoint); } catch (e) { /* ignore */ } }
    try { await sub.unsubscribe(); } catch (e) { /* ignore */ }
  };
})(window.Arcore);
