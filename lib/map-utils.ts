// lib/map-utils.ts

import { parseG25 } from "./g25-utils";
import mapboxgl from 'mapbox-gl';

export const getCultureBounds = (cultureName: string, allSamples: any[]) => {
    const cultureSamples = allSamples.filter(s => s.culture === cultureName);
    if (cultureSamples.length === 0) return null;

    const bounds = new mapboxgl.LngLatBounds();
    cultureSamples.forEach(s => {
        const ln = parseFloat(s.longitude?.toString().replace(',', '.'));
        const lt = parseFloat(s.latitude?.toString().replace(',', '.'));
        if (!isNaN(ln) && !isNaN(lt)) {
            bounds.extend([ln, lt]);
        }
    });
    return bounds;
};


export function csvToGeoJSON(rows: any[]) {
    if (!rows || rows.length === 0) return { type: 'FeatureCollection', features: [] };

    const JITTER_FACTOR = 0.01; 
    const coordCounts = new Map<string, number>();

    return {
        type: 'FeatureCollection',
        features: rows.filter(r => r.latitude && r.longitude).map((row, index) => {
            let lng = typeof row.longitude === 'string' ? parseFloat(row.longitude.replace(',', '.')) : row.longitude;
            let lat = typeof row.latitude === 'string' ? parseFloat(row.latitude.replace(',', '.')) : row.latitude;

            const coordKey = `${lng.toFixed(5)}|${lat.toFixed(5)}`;
            const count = coordCounts.get(coordKey) || 0;
            coordCounts.set(coordKey, count + 1);

            const originalLat = lat;
            const originalLng = lng;

            if (count > 0) {
                const angle = count * 2.4; 
                const radius = JITTER_FACTOR * Math.sqrt(count);
                lng += Math.cos(angle) * radius;
                lat += Math.sin(angle) * radius;
            }

            return {
                type: 'Feature',
                id: row.id,
                geometry: { type: 'Point', coordinates: [lng, lat] },
                properties: {
                    ...row,
                    latitude: lat,
                    longitude: lng,
                    original_lat: originalLat,
                    original_lng: originalLng
                }
            };
        })
    };
}

export const YDNA_GROUP_COLORS: Record<string, string> = {
    'R1': '#ef4444', // Red – R1a/R1b
    'R2': '#f87171', // Light Red – South Asian R2
    'I1': '#10b981', // Emerald – Nordic
    'I2': '#34d399', // Light Emerald – Balkan
    'J1': '#8b5cf6', // Violet – Semitic
    'J2': '#a78bfa', // Light Violet – Mediterranean
    'G2': '#06b6d4', // Cyan – Caucasus
    'G1': '#22d3ee', // Light Cyan
    'E1': '#78350f', // Warm Brown – African/Mediterranean
    'E2': '#92400e', // Light Brown
    'N1': '#84cc16', // Lime – Uralic/Siberian
    'N2': '#a3e635', // Light Lime
    'Q1': '#f43f5e', // Rose – Amerindian/Siberian
    'Q2': '#fb7185', // Light Rose
    'C1': '#ec4899', // Pink – Oceanian
    'C2': '#f472b6', // Light Pink – East Asian
    'O1': '#16a34a', // Green – East Asian
    'O2': '#4ade80', // Light Green
    'D1': '#a21caf', // Fuchsia – Tibetan/Japanese
    'D2': '#c026d3', // Light Fuchsia
    'T1': '#f59e0b', // Amber
    'L1': '#0d9488', // Teal – South Asian
    'H1': '#fbbf24', // Yellow – South Asian
    'H2': '#fcd34d', // Light Yellow
    'H3': '#fde68a', // Pale Yellow
    'A0': '#27272a', // Zinc-900 – Deep African
    'A1': '#3f3f46', // Zinc-700
    'B2': '#44403c', // Stone-700 – African
    'K1': '#94a3b8', // Slate
    'K2': '#64748b', // Blue-Slate
    'CT': '#d1d5db', // Light Grey – Basal
    'CF': '#d1d5db', // Light Grey – Basal
    'BT': '#a8a29e', // Stone – Basal
};

export const YDNAColors = [
    'match',
    ['slice', ['coalesce', ['get', 'y_haplo'], ''], 0, 2],

    ...Object.entries(YDNA_GROUP_COLORS).flatMap(([group, color]) => [group, color]),

    // Fallback for unrecognized groups
    '#e7e5e4'
];


export const distanceColors = [
    'interpolate',
    ['linear'],
    ['get', 'distance'],
    0, '#1d4ed8',      
    0.02, '#1d4ed8', 
    0.04, '#2563eb',
    0.06, '#3b82f6',   
    0.08, '#93c5fd', 
    0.1, '#d6d3d1' 
];


export type YDNAHaplogroup = keyof typeof YDNA_GROUP_COLORS;


export const getUniqueCultures = (data: any[]) => {
    if (!data || data.length === 0) return [];

    const cultures = data
        .map(item => item.culture)
        .filter(Boolean)
        .map(c => c.trim());

    return Array.from(new Set(cultures)).sort();
};
