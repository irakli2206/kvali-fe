/**
 * Add modern G25 coordinates to existing AADR CSV.
 * Matches AADR rows (that lack g25_string) against modern G25 file entries.
 *
 * Usage:
 *   node scripts/add-modern-g25.mjs <aadr-csv> <modern-g25-txt> [output.csv]
 */

import fs from 'fs';
import path from 'path';
import Papa from 'papaparse';

function stripSuffixes(id) {
  if (!id) return '';
  return id.trim()
    .replace(/\.(AG|SG|DG|HO)$/i, '')
    .replace(/_noUDG$/i, '')
    .replace(/_published$/i, '')
    .replace(/_contam$/i, '')
    .replace(/_lc$/i, '')
    .replace(/_all$/i, '');
}

function indexKeys(id) {
  if (!id) return [];
  const k = id.trim();
  if (!k) return [];
  const keys = [k];
  const stripped = stripSuffixes(k);
  if (stripped !== k) keys.push(stripped);
  return [...new Set(keys)];
}

// ---- Parse modern G25 ----
function parseModernG25(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8');
  const lines = raw.split(/\r?\n/).filter(l => l.trim().length > 0);

  const g25Map = new Map();
  let skipped = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.startsWith(',PC') || line.startsWith('PC')) continue;

    const parts = line.split(',');
    const label = parts[0]?.trim();
    if (!label) continue;

    const coords = parts.slice(1).map(v => v.trim());
    if (coords.length !== 25) { skipped++; continue; }

    const g25String = coords.join(',');
    const sampleId = label.includes(':') ? label.split(':').pop().trim() : label;
    const population = label.includes(':') ? label.split(':')[0].trim() : '';

    const data = { g25_string: g25String, label, population, sampleId };

    for (const key of indexKeys(sampleId)) {
      if (!g25Map.has(key)) g25Map.set(key, data);
    }
    for (const key of indexKeys(label)) {
      if (!g25Map.has(key)) g25Map.set(key, data);
    }
  }

  console.log('Modern G25 entries loaded:', g25Map.size, '(index keys)');
  if (skipped) console.log('Skipped (bad dimension count):', skipped);
  return g25Map;
}

// ---- Main ----
const args = process.argv.slice(2);
const aadrPath = args[0];
const modernG25Path = args[1];
const outputPath = args[2] || aadrPath;

if (!aadrPath || !modernG25Path) {
  console.error('Usage: node scripts/add-modern-g25.mjs <aadr-csv> <modern-g25-txt> [output.csv]');
  process.exit(1);
}

console.log('Reading modern G25...');
const g25Map = parseModernG25(modernG25Path);

console.log('\nReading AADR CSV...');
const raw = fs.readFileSync(aadrPath, 'utf8');
const parsed = Papa.parse(raw, { header: true, skipEmptyLines: true });
const rows = parsed.data;
const headers = parsed.meta.fields;
console.log('AADR rows:', rows.length);

const g25Col = 'g25_string';
const methodCol = 'g25_match_method';

let alreadyHad = 0;
let newMatches = 0;
let matchedVia = { objectId: 0, geneticId: 0, label: 0 };

for (const row of rows) {
  if (row[g25Col] && row[g25Col].trim()) {
    alreadyHad++;
    continue;
  }

  const objectId = (row.object_id || '').trim();
  const geneticId = (row.genetic_id || '').trim();

  let g25 = null;
  let method = '';

  for (const key of indexKeys(objectId)) {
    g25 = g25Map.get(key);
    if (g25) { method = 'Modern G25 (object_id)'; matchedVia.objectId++; break; }
  }
  if (!g25) {
    for (const key of indexKeys(geneticId)) {
      g25 = g25Map.get(key);
      if (g25) { method = 'Modern G25 (genetic_id)'; matchedVia.geneticId++; break; }
    }
  }

  if (g25) {
    row[g25Col] = g25.g25_string;
    row[methodCol] = method;
    newMatches++;
  }
}

const csvOut = Papa.unparse(rows, { columns: headers });
fs.writeFileSync(outputPath, csvOut, 'utf8');

console.log('\n--- Report ---');
console.log('Already had G25:', alreadyHad);
console.log('New modern matches:', newMatches);
console.log('  via object_id:', matchedVia.objectId);
console.log('  via genetic_id:', matchedVia.geneticId);
console.log('Still unmatched:', rows.length - alreadyHad - newMatches);
console.log('Output:', outputPath);
