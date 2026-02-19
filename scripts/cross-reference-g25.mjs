/**
 * Cross-reference G25 coordinates (G25.csv) with ancient DNA metadata (all-ancient-dna.csv).
 * all-ancient-dna Object-ID should match (approx) G25 Column2 (Object-ID). We try exact, .SG variants,
 * suffix-after-colon, stripped _/\. suffixes, and ID-like tokens from Colloquial-Skeletal.
 *
 * Usage (from project root):
 *   node scripts/cross-reference-g25.mjs <path-to-G25.csv> <path-to-all-ancient-dna.csv> [output.csv]
 */

import fs from 'fs';
import path from 'path';
import Papa from 'papaparse';
const parse = Papa.parse;

const SEP = ';';

function normalizeId(id) {
  if (id == null || typeof id !== 'string') return '';
  return id.trim();
}

/** Base form: strip trailing _suffix and .suffix (approx match to G25 Column2) */
function baseId(id) {
  const k = normalizeId(id);
  if (!k) return '';
  return k.replace(/\_[^_]+$/, '').replace(/\.[A-Za-z0-9]+$/, '');
}

/** G25 Object-ID variants for indexing: 19651_noUDG.SG -> [19651_noUDG.SG, 19651_noUDG, 19651] so Quiles "19651" can match */
function g25IndexKeys(objectId) {
  const k = normalizeId(objectId);
  if (!k) return [];
  const keys = [k];
  const noSg = k.replace(/\.SG$/i, '');
  if (noSg !== k) keys.push(noSg);
  const noUdg = k.replace(/_noUDG\.?SG?$/i, '');
  if (noUdg !== k) keys.push(noUdg);
  const noUdgNoSg = noUdg.replace(/\.SG$/i, '');
  if (noUdgNoSg !== noUdg) keys.push(noUdgNoSg);
  return [...new Set(keys)];
}

/** Keys we can use to look up G25: exact, .SG variants, suffix-after-colon, base (no _/. suffix) */
function lookupKeys(objectId) {
  const k = normalizeId(objectId);
  if (!k) return [];
  const keys = [k];
  const noSg = k.replace(/\.SG$/i, '');
  if (noSg !== k) keys.push(noSg);
  else keys.push(k + '.SG');
  if (k.includes(':')) keys.push(k.split(':').pop().trim());
  const base = baseId(k);
  if (base && base !== k) keys.push(base, base + '.SG');
  return [...new Set(keys)];
}

/** Extract ID-like tokens from text (e.g. I10871, R10760.SG, I10871_published) for fallback match */
function extractSampleIdTokens(text) {
  if (text == null || typeof text !== 'string') return [];
  const tokens = [];
  const re = /\b([IR][A-Za-z0-9]+(?:\.[A-Za-z0-9]+)?)(?:_[a-zA-Z]+|\.DG)?/g;
  let m;
  while ((m = re.exec(text)) !== null) {
    const t = m[1];
    if (/^[IR]\d+(\.[A-Za-z0-9]+)?$/i.test(t) && t.length >= 4) tokens.push(t);
  }
  return [...new Set(tokens)];
}

function parseG25(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8');
  const lines = raw.split(/\r?\n/).filter((l) => l.length > 0);
  if (lines.length < 4) throw new Error(`G25 file too short: ${filePath}`);

  // Row 2 (index 1) = real headers: ID, Object-ID, Column2..Column26, G25-Coordinates
  const headerRow = parse(lines[1], { delimiter: SEP, quoteChar: '"' }).data;
  const headers = Array.isArray(headerRow[0]) ? headerRow[0] : headerRow;
  const objIdIdx = headers.findIndex((h) => h && h.trim() === 'Object-ID');
  const idIdx = headers.findIndex((h) => h && h.trim() === 'ID');
  if (objIdIdx === -1) throw new Error('G25: Object-ID column not found');

  // PC1..PC25 = Column2..Column26 (indices 2..26)
  const pcIndices = [];
  for (let i = 2; i <= 26 && i < headers.length; i++) pcIndices.push(i);

  const g25ByObjectId = new Map();
  const duplicateObjectIds = new Set();
  const g25OriginalObjectIds = new Set();

  for (let r = 3; r < lines.length; r++) {
    const parsedRow = parse(lines[r], { delimiter: SEP, quoteChar: '"' }).data;
    const row = Array.isArray(parsedRow[0]) ? parsedRow[0] : parsedRow;
    if (!row || row.length <= objIdIdx) continue;

    const objectId = normalizeId(row[objIdIdx]);
    if (!objectId) continue;

    // Build G25 string from PC1..PC25 (most reliable)
    const parts = [];
    for (const i of pcIndices) {
      const v = row[i];
      if (v != null && v !== '') parts.push(String(v).trim());
    }
    const g25String = parts.length === 25 ? parts.join(',') : null;

    const data = { g25_string: g25String, id: idIdx >= 0 ? row[idIdx] : '', objectId };
    if (g25ByObjectId.has(objectId)) {
      duplicateObjectIds.add(objectId);
    } else {
      for (const key of g25IndexKeys(objectId)) {
        if (!g25ByObjectId.has(key)) g25ByObjectId.set(key, data);
      }
    }
    g25OriginalObjectIds.add(objectId);
  }

  return { g25ByObjectId, duplicateObjectIds, g25OriginalObjectIds };
}

function parseAllAncientDna(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8');
  const parsed = parse(raw, { delimiter: SEP, quoteChar: '"', header: true });
  const rows = parsed.data;
  const meta = parsed.meta;
  if (!rows.length) throw new Error('all-ancient-dna: no rows');
  const headers = meta.fields || Object.keys(rows[0]);
  const objIdIdx = headers.indexOf('Object-ID');
  if (objIdIdx === -1) throw new Error('all-ancient-dna: Object-ID column not found');
  return { rows, headers };
}

function escapeCsvCell(value) {
  if (value == null) return '';
  const s = String(value);
  if (s.includes(SEP) || s.includes('"') || s.includes('\n') || s.includes('\r')) {
    return '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}

function writeCsv(filePath, headers, rows) {
  const headerLine = headers.map(escapeCsvCell).join(SEP);
  const dataLines = rows.map((row) => headers.map((h) => escapeCsvCell(row[h])).join(SEP));
  fs.writeFileSync(filePath, [headerLine, ...dataLines].join('\n'), 'utf8');
}

// ---------- main ----------
const args = process.argv.slice(2);
const g25Path = args[0];
const ancientPath = args[1];
const outputPath = args[2] || path.join(path.dirname(ancientPath), 'all-ancient-dna-with-g25.csv');

if (!g25Path || !ancientPath) {
  console.error('Usage: node scripts/cross-reference-g25.mjs <G25.csv> <all-ancient-dna.csv> [output.csv]');
  process.exit(1);
}

if (!fs.existsSync(g25Path)) {
  console.error('Not found:', g25Path);
  process.exit(1);
}
if (!fs.existsSync(ancientPath)) {
  console.error('Not found:', ancientPath);
  process.exit(1);
}

console.log('Reading G25...');
const { g25ByObjectId, duplicateObjectIds, g25OriginalObjectIds } = parseG25(g25Path);
console.log('G25 entries (by Object-ID):', g25ByObjectId.size);
if (duplicateObjectIds.size) {
  console.warn('G25 duplicate Object-IDs (first kept):', [...duplicateObjectIds].slice(0, 20).join(', '));
  if (duplicateObjectIds.size > 20) console.warn('... and', duplicateObjectIds.size - 20, 'more');
}

console.log('Reading all-ancient-dna...');
const { rows, headers } = parseAllAncientDna(ancientPath);
console.log('Ancient DNA rows:', rows.length);

let matched = 0;
let matchedViaColloquial = 0;
let unmatched = 0;
const unmatchedIds = [];
const matchedG25ObjectIds = new Set();

const outHeaders = [...headers];
if (!outHeaders.includes('g25_string')) outHeaders.push('g25_string');

function findG25(row) {
  const objectId = normalizeId(row['Object-ID']);
  for (const key of lookupKeys(objectId)) {
    const g = g25ByObjectId.get(key);
    if (g) return g;
  }
  const colloquial = row['Colloquial-Skeletal'];
  const tokens = extractSampleIdTokens(colloquial);
  if (tokens.length === 0) return null;
  let found = null;
  for (const t of tokens) {
    for (const key of lookupKeys(t)) {
      const g = g25ByObjectId.get(key);
      if (g) {
        if (found && found !== g) return null;
        found = g;
        break;
      }
    }
  }
  return found;
}

const outRows = rows.map((row) => {
  const objectId = normalizeId(row['Object-ID']);
  let g25 = null;
  for (const key of lookupKeys(objectId)) {
    g25 = g25ByObjectId.get(key);
    if (g25) break;
  }
  if (!g25) {
    g25 = findG25(row);
    if (g25) matchedViaColloquial++;
  }
  const newRow = { ...row };
  if (g25) {
    newRow.g25_string = g25.g25_string ?? '';
    if (g25.objectId) matchedG25ObjectIds.add(g25.objectId);
    matched++;
  } else {
    newRow.g25_string = '';
    unmatched++;
    if (objectId) unmatchedIds.push(objectId);
  }
  return newRow;
});

writeCsv(outputPath, outHeaders, outRows);

console.log('\n--- Report ---');
console.log('Matched:', matched);
if (matchedViaColloquial) console.log('  (via Colloquial-Skeletal):', matchedViaColloquial);
console.log('Unmatched:', unmatched);
console.log('Output:', outputPath);
if (unmatchedIds.length > 0 && unmatchedIds.length <= 50) {
  console.log('Unmatched Object-IDs:', unmatchedIds.join(', '));
} else if (unmatchedIds.length > 50) {
  console.log('First 50 unmatched Object-IDs:', unmatchedIds.slice(0, 50).join(', '));
  fs.writeFileSync(
    path.join(path.dirname(outputPath), 'cross-reference-unmatched.txt'),
    unmatchedIds.join('\n'),
    'utf8'
  );
  console.log('Full list written to cross-reference-unmatched.txt');
}

// G25 Object-IDs that have no row in all-ancient-dna (Quiles list)
const g25OnlyObjectIds = [...g25OriginalObjectIds].filter((id) => !matchedG25ObjectIds.has(id)).sort();
const g25OnlyPath = path.join(path.dirname(outputPath), 'cross-reference-g25-only.txt');
fs.writeFileSync(g25OnlyPath, g25OnlyObjectIds.join('\n'), 'utf8');
console.log('G25-only (not in Quiles list):', g25OnlyObjectIds.length);
console.log('  Full list:', g25OnlyPath);
if (g25OnlyObjectIds.length > 0) {
  const sample = g25OnlyObjectIds.slice(0, 40);
  console.log('  Examples:', sample.join(', '));
  if (g25OnlyObjectIds.length > 40) console.log('  ... and', g25OnlyObjectIds.length - 40, 'more');
}
