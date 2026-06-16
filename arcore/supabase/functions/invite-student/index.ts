import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

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
    const appUrl = Deno.env.get('APP_URL') || 'https://oarvladlen.github.io/arcore-bjj/';

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return json({ error: 'Unauthorized' }, 401);

    const userClient = createClient(url, anon, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userErr } = await userClient.auth.getUser();
    if (userErr || !user) return json({ error: 'Unauthorized' }, 401);

    const admin = createClient(url, service);
    const { data: profile } = await admin.from('profiles').select('role').eq('id', user.id).single();
    if (!profile || profile.role !== 'coach') return json({ error: 'Forbidden' }, 403);

    const body = await req.json();
    const name = String(body.name || '').trim();
    const email = String(body.email || '').trim().toLowerCase();
    const phone = String(body.phone || '').trim();
    const belt = String(body.belt || 'branca').trim();

    if (!name || !email || !phone) {
      return json({ error: 'name, email and phone required' }, 400);
    }

    const memberId = 'm_' + crypto.randomUUID().replace(/-/g, '').slice(0, 12);
    const token = crypto.randomUUID().replace(/-/g, '');
    const avatar = name.trim().charAt(0).toUpperCase();

    const { error: memErr } = await admin.from('members').insert({
      id: memberId,
      name,
      email,
      phone,
      belt,
      stripes: 0,
      status: 'experimental',
      avatar,
      marketing_email: true,
      marketing_whatsapp: true,
    });
    if (memErr) return json({ error: memErr.message }, 400);

    const { error: invErr } = await admin.from('invitations').insert({
      member_id: memberId,
      email,
      phone,
      token,
      invited_by: user.id,
    });
    if (invErr) return json({ error: invErr.message }, 400);

    const inviteLink = `${appUrl.replace(/\/$/, '')}/?invite=${token}`;

    // Link-only onboarding: the student opens the WhatsApp link, sets a password
    // on the signup screen, and is in. No e-mail dependency, no SMTP required.
    // We intentionally do NOT call inviteUserByEmail — it sends a throttled
    // e-mail and pre-creates a user that would dead-end the link on "check your
    // inbox". The signup-via-link flow (with email confirmation OFF) is instant.
    return json({
      ok: true,
      memberId,
      token,
      inviteLink,
      emailSent: false,
      whatsappText: `Oi ${name.split(' ')[0]}! 🥋 Bem-vindo à Arcore. Crie sua senha e entre no app: ${inviteLink}`,
    });
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json' },
  });
}
