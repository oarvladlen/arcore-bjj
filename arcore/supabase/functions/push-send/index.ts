// Arcore — push-send edge function
// Sends Web Push to stored subscriptions. Coach-only (verifies caller role).
// Secrets required: VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT
//   (SUPABASE_URL / SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY are auto.)
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';
import webpush from 'npm:web-push@3.6.7';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  try {
    const url = Deno.env.get('SUPABASE_URL')!;
    const anon = Deno.env.get('SUPABASE_ANON_KEY')!;
    const service = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const VAPID_PUBLIC = Deno.env.get('VAPID_PUBLIC_KEY')!;
    const VAPID_PRIVATE = Deno.env.get('VAPID_PRIVATE_KEY')!;
    const VAPID_SUBJECT = Deno.env.get('VAPID_SUBJECT') || 'mailto:professor@arcore.com';

    // Only a coach may broadcast.
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return json({ error: 'Unauthorized' }, 401);
    const userClient = createClient(url, anon, { global: { headers: { Authorization: authHeader } } });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return json({ error: 'Unauthorized' }, 401);
    const admin = createClient(url, service);
    const { data: profile } = await admin.from('profiles').select('role').eq('id', user.id).single();
    if (!profile || profile.role !== 'coach') return json({ error: 'Forbidden' }, 403);

    const { audience, member_id, title, body: text, url: clickUrl, tag } = await req.json();

    webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC, VAPID_PRIVATE);

    let q = admin.from('push_subscriptions').select('*');
    if (audience === 'member' && member_id) q = q.eq('member_id', member_id);
    const { data: subs } = await q;

    const payload = JSON.stringify({ title: title || 'Arcore', body: text || '', url: clickUrl || './', tag });
    let sent = 0, removed = 0;
    await Promise.all((subs || []).map(async (s: any) => {
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          payload,
        );
        sent++;
      } catch (e: any) {
        const code = e && (e.statusCode || e.status);
        if (code === 404 || code === 410) {
          await admin.from('push_subscriptions').delete().eq('endpoint', s.endpoint);
          removed++;
        }
      }
    }));

    return json({ ok: true, sent, removed, total: (subs || []).length });
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { ...cors, 'Content-Type': 'application/json' } });
}
