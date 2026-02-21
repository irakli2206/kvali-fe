/**
 * Export map samples from Supabase to public/data/map-samples.json.
 * Used at build time (Option A) so the deployed app serves this file (no Supabase egress per user).
 *
 * Loads .env.local if present (local dev); on Vercel env vars are injected, so no file needed.
 * Usage: node scripts/export-map-samples.mjs   (or npm run export-map-samples)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

// Load .env.local into process.env when present (local dev); Vercel has env in process.env already
const envPath = path.join(ROOT, '.env.local');
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf8');
  for (const line of content.split('\n')) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (m) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '').trim();
  }
}
const OUT_DIR = path.join(ROOT, 'public', 'data');
const OUT_FILE = path.join(OUT_DIR, 'map-samples.json');

const TABLE = 'dna';
const MAP_SAMPLES_LIMIT = 20_000;
const SELECT = `
  id,
  object_id,
  latitude,
  longitude,
  culture,
  country,
  y_haplo,
  mean_bp
`.replace(/\s+/g, ' ').trim();

function parseCoord(val) {
  if (val === null || val === undefined) return 0;
  return parseFloat(String(val).replace(',', '.')) || 0;
}

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) {
    console.error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (set in .env.local or Vercel env).');
    process.exit(1);
  }

  const supabase = createClient(url, key);
  const { data: rows, error } = await supabase
    .from(TABLE)
    .select(SELECT)
    .not('g25_string', 'is', null)
    .limit(MAP_SAMPLES_LIMIT);

  if (error) {
    console.error('Supabase error:', error.message);
    process.exit(1);
  }

  const cleaned = (rows || []).map((r) => ({
    id: r.id,
    object_id: r.object_id,
    latitude: typeof r.latitude === 'number' ? r.latitude : parseCoord(r.latitude),
    longitude: typeof r.longitude === 'number' ? r.longitude : parseCoord(r.longitude),
    culture: r.culture ?? '',
    country: r.country ?? null,
    y_haplo: r.y_haplo ?? '',
    mean_bp: typeof r.mean_bp === 'number' ? r.mean_bp : parseCoord(r.mean_bp),
  }));

  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(OUT_FILE, JSON.stringify(cleaned), 'utf8');
  const sizeKB = (fs.statSync(OUT_FILE).size / 1024).toFixed(1);
  console.log(`Wrote ${cleaned.length} samples to public/data/map-samples.json (${sizeKB} KB)`);
}

main();
