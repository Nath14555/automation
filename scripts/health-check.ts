#!/usr/bin/env tsx
/**
 * louna-agent — Health check for all external integrations
 *
 * Pings each configured service and prints a green/red summary.
 * Exits 0 if all required services are healthy, 1 otherwise.
 *
 * Usage:
 *   npm run health-check
 *   tsx scripts/health-check.ts
 */

import { loadEnv } from '../src/utils/config.js';

interface CheckResult {
  name: string;
  ok: boolean;
  detail?: string;
  required: boolean;
  ms: number;
}

const env = loadEnv();

async function timed<T>(fn: () => Promise<T>): Promise<{ value: T; ms: number }> {
  const start = Date.now();
  const value = await fn();
  return { value, ms: Date.now() - start };
}

async function check(
  name: string,
  required: boolean,
  fn: () => Promise<{ ok: boolean; detail?: string }>,
): Promise<CheckResult> {
  try {
    const { value, ms } = await timed(fn);
    return { name, required, ms, ...value };
  } catch (err) {
    return {
      name,
      required,
      ok: false,
      ms: 0,
      detail: err instanceof Error ? err.message : String(err),
    };
  }
}

async function checkAnthropic(): Promise<{ ok: boolean; detail?: string }> {
  const res = await fetch('https://api.anthropic.com/v1/models', {
    headers: {
      'x-api-key': env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
  });
  return { ok: res.ok, detail: res.ok ? `${res.status}` : `HTTP ${res.status}` };
}

async function checkOpenAI(): Promise<{ ok: boolean; detail?: string }> {
  const res = await fetch('https://api.openai.com/v1/models', {
    headers: { Authorization: `Bearer ${env.OPENAI_API_KEY}` },
  });
  return { ok: res.ok, detail: res.ok ? `${res.status}` : `HTTP ${res.status}` };
}

async function checkBrevo(): Promise<{ ok: boolean; detail?: string }> {
  if (!env.BREVO_API_KEY) return { ok: false, detail: 'not configured' };
  const res = await fetch('https://api.brevo.com/v3/account', {
    headers: { 'api-key': env.BREVO_API_KEY },
  });
  return { ok: res.ok, detail: res.ok ? `${res.status}` : `HTTP ${res.status}` };
}

async function checkHubSpot(): Promise<{ ok: boolean; detail?: string }> {
  if (!env.HUBSPOT_PRIVATE_APP_TOKEN) return { ok: false, detail: 'not configured' };
  const res = await fetch('https://api.hubapi.com/crm/v3/objects/contacts?limit=1', {
    headers: { Authorization: `Bearer ${env.HUBSPOT_PRIVATE_APP_TOKEN}` },
  });
  return { ok: res.ok, detail: res.ok ? `${res.status}` : `HTTP ${res.status}` };
}

async function checkQdrant(): Promise<{ ok: boolean; detail?: string }> {
  const url = `http://${env.QDRANT_HOST}:${String(env.QDRANT_PORT)}/livez`;
  const res = await fetch(url, {
    headers: env.QDRANT_API_KEY ? { 'api-key': env.QDRANT_API_KEY } : {},
  });
  return { ok: res.ok, detail: `HTTP ${res.status}` };
}

async function checkN8n(): Promise<{ ok: boolean; detail?: string }> {
  const url = `${env.N8N_PROTOCOL}://${env.N8N_HOST}/healthz`;
  const res = await fetch(url);
  return { ok: res.ok, detail: `HTTP ${res.status}` };
}

async function main(): Promise<void> {
  const results = await Promise.all([
    check('Anthropic', true, checkAnthropic),
    check('OpenAI', true, checkOpenAI),
    check('n8n', true, checkN8n),
    check('Qdrant', true, checkQdrant),
    check('Brevo', false, checkBrevo),
    check('HubSpot', false, checkHubSpot),
  ]);

  const pad = (s: string, n: number) => s.padEnd(n);
  console.log('');
  console.log(pad('Service', 14), pad('Status', 10), pad('Required', 10), 'Detail');
  console.log('-'.repeat(60));
  let failures = 0;
  for (const r of results) {
    const status = r.ok ? '\x1b[32m✓ OK\x1b[0m' : '\x1b[31m✗ FAIL\x1b[0m';
    const required = r.required ? 'yes' : 'no';
    console.log(pad(r.name, 14), pad(status, 10), pad(required, 10), `${String(r.ms)}ms ${r.detail ?? ''}`);
    if (r.required && !r.ok) failures++;
  }
  console.log('');
  if (failures > 0) {
    console.error(`\x1b[31m${String(failures)} required service(s) unhealthy.\x1b[0m`);
    process.exit(1);
  }
  console.log('\x1b[32mAll required services are healthy.\x1b[0m');
}

main().catch((err: unknown) => {
  console.error('Health check crashed:', err);
  process.exit(1);
});
