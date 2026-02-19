/**
 * Convert the semicolon-delimited AADR+G25 CSV to a clean comma-delimited CSV
 * that Supabase can import without column misalignment.
 *
 * Usage: node scripts/convert-aadr-csv.mjs <input.csv> [output.csv]
 */

import fs from 'fs';
import path from 'path';
import Papa from 'papaparse';

const inputPath = process.argv[2];
const outputPath = process.argv[3] || inputPath.replace(/\.\w+$/, '-clean.csv');

if (!inputPath) {
    console.error('Usage: node scripts/convert-aadr-csv.mjs <input.csv> [output.csv]');
    process.exit(1);
}

console.log('Reading:', inputPath);
const raw = fs.readFileSync(inputPath, 'utf8');

const result = Papa.parse(raw, {
    header: true,
    delimiter: ';',
    skipEmptyLines: true,
});

console.log('Parsed rows:', result.data.length);
console.log('Columns:', result.meta.fields.length);

if (result.errors.length > 0) {
    console.warn('Parse warnings:', result.errors.slice(0, 5));
}

// Rename columns to snake_case to match the DB schema
const COL_MAP = {
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
    'g25_string': 'g25_string',
    'g25_match_method': 'g25_match_method',
    'Data type': 'data_type',
    'No. Libraries': 'num_libraries',
    'Libraries': 'libraries',
    'Pulldown Strategy': 'pulldown_strategy',
    'Skeletal code': 'skeletal_code',
    'Skeletal element': 'skeletal_element',
};

// For long truncated AADR columns, match by prefix
const COL_PREFIX_MAP = {
    'Genetic ID': 'genetic_id',
    'Year data from this individual': 'year_published',
    'doi for publication': 'doi',
    'Link to the most permanent': 'data_link',
    'Method for Determining Date': 'date_method',
    'Date mean in BP': 'mean_bp',
    'Date standard deviation': 'date_sd_bp',
    'Full Date One of two formats': 'full_date',
    'Age at death': 'age_sex',
    'SNPs hit on autosomal targets (Computed using easystats on 1240': 'snps_1240k',
    'SNPs hit on autosomal targets (Computed using easystats on HO': 'snps_ho',
    'Sum total of ROH segments >4': 'roh_gt4cm',
    'Sum total of ROH segments >20': 'roh_gt20cm',
    'Y haplogroup in terminal mutation': 'y_symbol',
    'Y haplogroup  in ISOGG': 'y_haplo',
    'Y haplogroup manually': 'y_manual',
    'mtDNA haplogroup': 'mt_haplo',
    'mtDNA coverage': 'mtdna_coverage',
    'mtDNA match to consensus': 'mtdna_match',
    'Damage rate in first': 'damage_rate',
    'Sex ratio': 'sex_ratio',
    'ANGSD MOM': 'angsd_mom',
    'hapConX': 'hapconx',
    'Library type': 'library_type',
    'endogenous by library': 'endogenous',
    'Suffices': 'suffices',
};

function renameColumn(original) {
    if (COL_MAP[original]) return COL_MAP[original];
    for (const [prefix, newName] of Object.entries(COL_PREFIX_MAP)) {
        if (original.startsWith(prefix)) return newName;
    }
    // Fallback: snake_case the original
    return original
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_|_$/g, '');
}

const oldFields = result.meta.fields;
const newFields = oldFields.map(renameColumn);

console.log('\nColumn mapping:');
oldFields.forEach((old, i) => {
    if (old !== newFields[i]) {
        console.log(`  ${old.slice(0, 55)} → ${newFields[i]}`);
    }
});

// Replace ".." (AADR's null marker) with empty string
const mappedRows = result.data.map(row => {
    const newRow = {};
    oldFields.forEach((oldKey, i) => {
        let val = row[oldKey];
        if (val === '..' || val === 'n/a') val = '';
        newRow[newFields[i]] = val ?? '';
    });
    return newRow;
});

const csv = Papa.unparse(mappedRows, { columns: newFields });
fs.writeFileSync(outputPath, csv, 'utf8');

console.log('\nOutput:', outputPath);
console.log('Rows:', mappedRows.length);

// Quick sanity check
const sample = mappedRows.find(r => r.y_symbol && r.y_symbol !== '');
if (sample) {
    console.log('\nSample with Y-DNA:', {
        object_id: sample.object_id,
        culture: sample.culture,
        y_symbol: sample.y_symbol,
        latitude: sample.latitude,
        longitude: sample.longitude,
    });
}
