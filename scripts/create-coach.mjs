#!/usr/bin/env node
/** Create professor account. Requires SUPABASE_SERVICE_ROLE_KEY or manual steps. */
const PROJECT_REF = 'acoilxssyjmwmmbaoytp';
const email = process.argv[2];
const password = process.argv[3];
const name = process.argv[4] || 'Mestre Ricardo';
const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
const url = process.env.SUPABASE_URL || `https://${PROJECT_REF}.supabase.co`;

if (!email || !password) {
  console.error('Usage: SUPABASE_SERVICE_ROLE_KEY=... node scripts/create-coach.mjs email password [name]');
  process.exit(1);
}

if (!service) {
  console.log(`Create professor manually in Supabase Dashboard:

Authentication → Users → Add user
  Email: ${email}
  Password: ${password}
  Auto Confirm User: ON
  User Metadata: {"role":"coach","display_name":"${name}"}
`);
  process.exit(0);
}

const res = await fetch(`${url}/auth/v1/admin/users`, {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${service}`,
    apikey: service,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    email,
    password,
    email_confirm: true,
    user_metadata: { role: 'coach', display_name: name },
  }),
});
const body = await res.text();
if (!res.ok) { console.error(body); process.exit(1); }
console.log('Professor criado:', email);
