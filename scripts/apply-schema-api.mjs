#!/usr/bin/env node
/**
 * Apply Arcore SQL via Supabase Management API.
 * Requires SUPABASE_ACCESS_TOKEN (Dashboard → Account → Access Tokens, prefix sbp_)
 * NOT the publishable key — REST /rest/v1/ cannot run CREATE TABLE.
 */
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const PROJECT_REF = 'acoilxssyjmwmmbaoytp';
const token = process.env.SUPABASE_ACCESS_TOKEN;
if (!token) {
  console.error('Missing SUPABASE_ACCESS_TOKEN (sbp_... from supabase.com/dashboard/account/tokens)');
  process.exit(1);
}

const root = join(dirname(fileURLToPath(import.meta.url)), '..', 'arcore', 'supabase');
const files = ['schema.sql', 'schema-auth.sql', 'schema-invites.sql'];

async function runQuery(sql) {
  const res = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query: sql }),
  });
  const body = await res.text();
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${body}`);
  }
  return body;
}

for (const file of files) {
  const sql = readFileSync(join(root, file), 'utf8');
  console.log(`Running ${file}...`);
  const result = await runQuery(sql);
  console.log(result.slice(0, 200) || 'OK');
}

const check = await runQuery('select count(*)::int as members from members;');
console.log('Verify members:', check);
