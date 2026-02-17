// lib/map-utils.ts

import { parseG25 } from "./g25-utils";
import mapboxgl from 'mapbox-gl';

export const getCultureBounds = (cultureName: string, allSamples: any[]) => {
    const cultureSamples = allSamples.filter(s => s.Simplified_Culture === cultureName);
    if (cultureSamples.length === 0) return null;

    const bounds = new mapboxgl.LngLatBounds();
    cultureSamples.forEach(s => {
        const ln = parseFloat(s.Longitude?.toString().replace(',', '.'));
        const lt = parseFloat(s.Latitude?.toString().replace(',', '.'));
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
        features: rows.filter(r => r.Latitude && r.Longitude).map((row, index) => {
            let lng = typeof row.Longitude === 'string' ? parseFloat(row.Longitude.replace(',', '.')) : row.Longitude;
            let lat = typeof row.Latitude === 'string' ? parseFloat(row.Latitude.replace(',', '.')) : row.Latitude;

            const coordKey = `${lng.toFixed(5)}|${lat.toFixed(5)}`;
            const count = coordCounts.get(coordKey) || 0;
            coordCounts.set(coordKey, count + 1);

            // Store originals before we mutate
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
                    // We override the properties so the rest of the app "just works"
                    Latitude: lat,
                    Longitude: lng,
                    original_lat: originalLat,
                    original_lng: originalLng
                }
            };
        })
    };
}

// export const runComparisonLogic = (targetId: string, allPoints: any[], targetG25Raw: string) => {
//     // 1. Parse the target coordinates into an array of numbers
//     // This handles both "ID, 0.1, 0.2" and "0.1, 0.2"
//     const targetParts = targetG25Raw.split(',');
//     const targetCoords = targetParts
//         .map(Number)
//         .filter(n => !isNaN(n));

//     if (targetCoords.length === 0) {
//         console.error("Invalid Target Coordinates");
//         return allPoints;
//     }

//     // 2. Map through all points and calculate distance directly
//     return allPoints.map(point => {
//         if (!point.g25_string) return { ...point, distance: 999 };

//         // Parse point coords (assuming g25_string is "0.123,0.456...")
//         const pointCoords = point.g25_string.split(',').map(Number);

//         // 3. Euclidean Distance Calculation
//         const sumSq = targetCoords.reduce((sum, val, i) => {
//             const pVal = pointCoords[i] || 0;
//             return sum + Math.pow(val - pVal, 2);
//         }, 0);

//         const dist = Math.sqrt(sumSq);

//         return {
//             ...point,
//             distance: dist
//         };
//     });
// };


export const YDNAColors = [
    'match',
    ['get', 'Y-Symbol'],

    // 1. NULL / JUNK (Transparent)
    ['', ' ', 'null', 'undefined', 'N/A', 'unknown'], 'rgba(0,0,0,0)',

    // 2. WEST EURASIAN / PRIMARY
    'R1b', '#ef4444', // Red
    'R1a', '#3b82f6', // Blue
    'I', '#10b981', // Emerald
    'J', '#8b5cf6', // Violet
    'G', '#06b6d4', // Cyan
    'T', '#f59e0b', // Amber
    'L', '#10b981', // Emerald (Shared with I for proximity)

    // 3. AFRICAN LINEAGES
    'A', '#000000', // Black
    'A0', '#27272a', // Zinc-900
    'B', '#44403c', // Stone-700
    'E', '#78350f', // Warm Brown

    // 4. EAST EURASIAN / SIBERIAN / AMERINDIAN
    'C', '#ec4899', // Pink (East Asian/Oceanian)
    'D', '#a21caf', // Fuchsia (Tibetan/Japanese)
    'N', '#84cc16', // Lime (Uralic/Siberian)
    'O', '#16a34a', // Green (East Asian)
    'Q', '#f43f5e', // Rose (Amerindian/Siberian)

    // 5. OTHER SPECIFICS
    'H', '#fbbf24', // Yellow (South Asian)
    'K', '#94a3b8', // Slate
    'M', '#64748b', // Blue-Slate
    'S', '#475569', // Dark Slate
    'P', '#fb7185', // Soft Rose
    'R', '#60a5fa', // Light Blue
    'F', '#d1d5db', // Light Grey
    'Z', '#ffffff', // White (Rare/Mystery)

    // 6. FALLBACK (For anything missed like 'BT', 'CT', etc.)
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


//Commenting out unimportant and unusual ones
export type YDNAHaplogroup =
    | 'A'
    | 'A0'
    | 'B'
    //   | 'BT'
    | 'C'
    //   | 'CF'
    //   | 'CT'
    | 'D'
    //   | 'DE'
    | 'E'
    | 'F'
    | 'G'
    //   | 'GHIJK'
    | 'H'
    //   | 'HIJK'
    | 'I'
    | 'J'
    | 'K'
    | 'L'
    | 'M'
    | 'N'
    | 'O'
    | 'P'
    | 'Q'
    | 'R'
    | 'R1a'
    | 'R1b'
    | 'S'
    | 'T'
    | 'Z';







export const getUniqueCultures = (data: any[]) => {
    if (!data || data.length === 0) return [];

    const cultures = data
        .map(item => item.Simplified_Culture) // Adjust key name to match your CSV header
        .filter(Boolean) // Removes null, undefined, or empty strings
        .map(c => c.trim()); // Cleans up any stray whitespace

    // Use Set to remove duplicates, then sort alphabetically
    return Array.from(new Set(cultures)).sort();
};