#!/usr/bin/env node
/** Enable email confirmation on Supabase Auth (mailer_autoconfirm = false). */
const PROJECT_REF = 'acoilxssyjmwmmbaoytp';
const token = process.env.SUPABASE_ACCESS_TOKEN;
if (!token) {
  console.error('Set SUPABASE_ACCESS_TOKEN');
  process.exit(1);
}

const body = {
  site_url: process.env.AUTH_REDIRECT_URL || 'https://oarvladlen.github.io/arcore-bjj/',
  uri_allow_list: 'https://oarvladlen.github.io/arcore-bjj/**,http://localhost:8000/**',
  mailer_autoconfirm: false,
  enable_signup: true,
};

const res = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/config/auth`, {
  method: 'PATCH',
  headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
});
const text = await res.text();
if (!res.ok) throw new Error(`HTTP ${res.status}: ${text}`);
console.log('Auth config updated: email confirmation required, signup enabled');
console.log(text.slice(0, 300));
