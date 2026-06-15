#!/usr/bin/env node
/* Gera config.js a partir de variáveis de ambiente (deploy CI/CD). */
import { writeFileSync, readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dir = dirname(fileURLToPath(import.meta.url));
const root = join(__dir, '..');
const example = join(root, 'config.example.js');
const out = join(root, 'config.js');

const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const key = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';
const redirect = process.env.AUTH_REDIRECT_URL || process.env.URL || '';

let base;
if (existsSync(example)) {
  base = readFileSync(example, 'utf8');
} else if (existsSync(out)) {
  base = readFileSync(out, 'utf8');
} else {
  console.error('config.example.js não encontrado');
  process.exit(1);
}

let cfg = base
  .replace(/url:\s*''/, "url: '" + url.replace(/'/g, "\\'") + "'")
  .replace(/anonKey:\s*''/, "anonKey: '" + key.replace(/'/g, "\\'") + "'");

if (redirect) {
  cfg = cfg.replace(/redirectUrl:\s*''/, "redirectUrl: '" + redirect.replace(/'/g, "\\'") + "'");
}

// Ativa auth quando há chaves Supabase
if (url && key) {
  cfg = cfg.replace(/(auth:\s*\{[\s\S]*?enabled:\s*)false/, '$1true');
}

writeFileSync(out, cfg);
console.log('config.js gerado' + (url ? ' (Supabase + auth)' : ' (modo local)'));
