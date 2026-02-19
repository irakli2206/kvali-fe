/**
 * Cross-reference AADR anno file with G25 coordinates.
 * Matches AADR "Master ID" and "Genetic ID" against G25 "Object-ID" (Column2).
 * Outputs a clean comma-delimited CSV with snake_case headers ready for Supabase import.
 *
 * Usage:
 *   node scripts/cross-reference-aadr-g25.mjs <anno-file> <G25.csv> [output.csv]
 */

import fs from 'fs';
import path from 'path';
import Papa from 'papaparse';

const G25_SEP = ';';

function normalizeId(id) {
  if (id == null || typeof id !== 'string') return '';
  return id.trim();
}

function stripSuffixes(id) {
  return id
    .replace(/\.(AG|SG|DG|HO)$/i, '')
    .replace(/_noUDG$/i, '')
    .replace(/_published$/i, '')
    .replace(/_contam$/i, '')
    .replace(/_lc$/i, '')
    .replace(/_all$/i, '');
}

function indexKeys(objectId) {
  const k = normalizeId(objectId);
  if (!k) return [];
  const keys = [k];
  const stripped = stripSuffixes(k);
  if (stripped !== k) keys.push(stripped);
  const doubleStripped = stripSuffixes(stripped);
  if (doubleStripped !== stripped) keys.push(doubleStripped);
  return [...new Set(keys)];
}

// ---- Parse G25 ----
function parseG25(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8');
  const lines = raw.split(/\r?\n/).filter((l) => l.length > 0);
  if (lines.length < 4) throw new Error('G25 file too short');

  const parse = Papa.parse;
  const headerRow = parse(lines[1], { delimiter: G25_SEP, quoteChar: '"' }).data;
  const headers = Array.isArray(headerRow[0]) ? headerRow[0] : headerRow;
  const objIdIdx = headers.findIndex((h) => h && h.trim() === 'Object-ID');
  const idIdx = headers.findIndex((h) => h && h.trim() === 'ID');
  if (objIdIdx === -1) throw new Error('G25: Object-ID column not found');

  const pcIndices = [];
  for (let i = 2; i <= 26 && i < headers.length; i++) pcIndices.push(i);

  const g25Map = new Map();
  let dupes = 0;

  for (let r = 3; r < lines.length; r++) {
    const parsedRow = parse(lines[r], { delimiter: G25_SEP, quoteChar: '"' }).data;
    const row = Array.isArray(parsedRow[0]) ? parsedRow[0] : parsedRow;
    if (!row || row.length <= objIdIdx) continue;

    const objectId = normalizeId(row[objIdIdx]);
    if (!objectId) continue;

    const parts = [];
    for (const i of pcIndices) {
      const v = row[i];
      if (v != null && v !== '') parts.push(String(v).trim());
    }
    const g25String = parts.length === 25 ? parts.join(',') : null;
    const fullId = idIdx >= 0 ? normalizeId(row[idIdx]) : '';

    const data = { g25_string: g25String, objectId, fullId };

    if (g25Map.has(objectId)) {
      dupes++;
    } else {
      for (const key of indexKeys(objectId)) {
        if (!g25Map.has(key)) g25Map.set(key, data);
      }
    }
  }

  console.log('G25 unique Object-IDs:', lines.length - 3);
  console.log('G25 index entries (incl variants):', g25Map.size);
  if (dupes) console.log('G25 duplicate Object-IDs:', dupes);
  return g25Map;
}

// ---- Parse AADR anno ----
function parseAnno(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8');
  const lines = raw.split(/\r?\n/);
  if (lines.length < 2) throw new Error('Anno file too short');
  const headers = lines[0].split('\t');
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    const cols = lines[i].split('\t');
    const row = {};
    for (let c = 0; c < headers.length; c++) {
      row[headers[c]] = cols[c] ?? '';
    }
    rows.push(row);
  }
  return { headers, rows };
}

// ---- Lookup ----
function findG25(g25Map, geneticId, masterId, skeletalCode) {
  const candidates = [masterId, geneticId, skeletalCode];
  for (const raw of candidates) {
    for (const key of indexKeys(raw)) {
      const g = g25Map.get(key);
      if (g) return g;
    }
  }
  return null;
}

// ---- Column rename map (AADR header → snake_case DB column) ----
const COL_EXACT = {
  'Master ID': 'object_id',
  'Lat.': 'latitude',
  'Long.': 'longitude',
  'Group ID': 'culture',
  'Molecular Sex': 'sex',
  'Locality': 'location',
  'Political Entity': 'country',
  'Publication abbreviation': 'source',
  'ASSESSMENT': 'assessment',
  'ASSESSMENT WARNING': 'assessment_warning',
  'Data type': 'data_type',
  'No. Libraries': 'num_libraries',
  'Libraries': 'libraries',
  'Pulldown Strategy': 'pulldown_strategy',
  'Skeletal code': 'skeletal_code',
  'Skeletal element': 'skeletal_element',
};

const COL_PREFIX = [
  ['Genetic ID', 'genetic_id'],
  ['Year data from this individual', 'year_published'],
  ['doi for publication', 'doi'],
  ['Link to the most permanent', 'data_link'],
  ['Method for Determining Date', 'date_method'],
  ['Date mean in BP', 'mean_bp'],
  ['Date standard deviation', 'date_sd_bp'],
  ['Full Date One of two formats', 'full_date'],
  ['Age at death', 'age_sex'],
  ['SNPs hit on autosomal targets (Computed using easystats on 1240', 'snps_1240k'],
  ['SNPs hit on autosomal targets (Computed using easystats on HO', 'snps_ho'],
  ['Sum total of ROH segments >4', 'roh_gt4cm'],
  ['Sum total of ROH segments >20', 'roh_gt20cm'],
  ['Y haplogroup in terminal mutation', 'y_symbol'],
  ['Y haplogroup  in ISOGG', 'y_haplo'],
  ['Y haplogroup manually', 'y_manual'],
  ['mtDNA haplogroup', 'mt_haplo'],
  ['mtDNA coverage', 'mtdna_coverage'],
  ['mtDNA match to consensus', 'mtdna_match'],
  ['Damage rate in first', 'damage_rate'],
  ['Sex ratio', 'sex_ratio'],
  ['ANGSD MOM', 'angsd_mom'],
  ['hapConX', 'hapconx'],
  ['Library type', 'library_type'],
  ['endogenous by library', 'endogenous'],
  ['Suffices', 'suffices'],
];

function renameCol(original) {
  if (COL_EXACT[original]) return COL_EXACT[original];
  for (const [prefix, name] of COL_PREFIX) {
    if (original.startsWith(prefix)) return name;
  }
  return original.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
}

// ---- Main ----
const args = process.argv.slice(2);
const annoPath = args[0];
const g25Path = args[1];
const outputPath = args[2] || path.join(path.dirname(annoPath), 'aadr-with-g25-clean.csv');

if (!annoPath || !g25Path) {
  console.error('Usage: node scripts/cross-reference-aadr-g25.mjs <anno-file> <G25.csv> [output.csv]');
  process.exit(1);
}

console.log('Reading G25...');
const g25Map = parseG25(g25Path);

console.log('\nReading AADR anno...');
const { headers: annoHeaders, rows: annoRows } = parseAnno(annoPath);
console.log('AADR rows:', annoRows.length);

const geneticIdCol = annoHeaders.find((h) => h.startsWith('Genetic ID'));
const masterIdCol = 'Master ID';
const skeletalCol = 'Skeletal code';

let matched = 0;
let matchedVia = { masterId: 0, geneticId: 0, skeletalCode: 0 };
const matchedG25Ids = new Set();

const outHeaders = [...annoHeaders, 'g25_string', 'g25_match_method'];

const outRows = annoRows.map((row) => {
  const geneticId = normalizeId(row[geneticIdCol]);
  const masterId = normalizeId(row[masterIdCol]);
  const skeletalCode = normalizeId(row[skeletalCol]);
  const newRow = { ...row };

  let g25 = null;
  let method = '';

  for (const key of indexKeys(masterId)) {
    g25 = g25Map.get(key);
    if (g25) { method = 'Master ID'; matchedVia.masterId++; break; }
  }
  if (!g25) {
    for (const key of indexKeys(geneticId)) {
      g25 = g25Map.get(key);
      if (g25) { method = 'Genetic ID'; matchedVia.geneticId++; break; }
    }
  }
  if (!g25) {
    for (const key of indexKeys(skeletalCode)) {
      g25 = g25Map.get(key);
      if (g25) { method = 'Skeletal code'; matchedVia.skeletalCode++; break; }
    }
  }

  if (g25) {
    newRow.g25_string = g25.g25_string ?? '';
    newRow.g25_match_method = method;
    matchedG25Ids.add(g25.objectId);
    matched++;
  } else {
    newRow.g25_string = '';
    newRow.g25_match_method = '';
  }
  return newRow;
});

// Rename headers to snake_case and clean null markers
const snakeHeaders = outHeaders.map(renameCol);

const cleanRows = outRows.map((row) => {
  const clean = {};
  outHeaders.forEach((h, i) => {
    let val = row[h];
    if (val === '..' || val === 'n/a') val = '';
    clean[snakeHeaders[i]] = val ?? '';
  });
  return clean;
});

const csvOut = Papa.unparse(cleanRows, { columns: snakeHeaders });
fs.writeFileSync(outputPath, csvOut, 'utf8');

const unmatched = annoRows.length - matched;
console.log('\n--- Report ---');
console.log('Matched:', matched);
console.log('  via Master ID:', matchedVia.masterId);
console.log('  via Genetic ID:', matchedVia.geneticId);
console.log('  via Skeletal code:', matchedVia.skeletalCode);
console.log('Unmatched AADR rows:', unmatched);
console.log('G25 samples used:', matchedG25Ids.size, '/', g25Map.size, '(index entries)');
console.log('Output:', outputPath);
console.log('Columns:', snakeHeaders.join(', '));
