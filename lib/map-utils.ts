// lib/map-utils.ts

import { parseG25 } from "./g25-utils";

export function csvToGeoJSON(rows: any[]) {
    if (!rows || rows.length === 0) {
        return { type: 'FeatureCollection', features: [] };
    }

    return {
        type: 'FeatureCollection',
        features: rows
            .filter(row => row.Latitude && row.Longitude)
            .map(row => {
                const lng = typeof row.Longitude === 'string'
                    ? parseFloat(row.Longitude.replace(',', '.'))
                    : row.Longitude;

                const lat = typeof row.Latitude === 'string'
                    ? parseFloat(row.Latitude.replace(',', '.'))
                    : row.Latitude;

                return {
                    type: 'Feature',
                    id: row.id,
                    geometry: {
                        type: 'Point',
                        coordinates: [lng, lat]
                    },
                    properties: {
                        // Spread the whole row to keep all data accessible
                        ...row,
                        id: row.id,
                        culture: row.Simplified_Culture,
                        // CRITICAL: Mapbox needs this to be a number for interpolation
                        distance: typeof row.distance === 'number' ? row.distance : 1.0
                    }
                };
            })
    };
}

export const runComparisonLogic = (targetId: string, allPoints: any[], targetG25Raw: string) => {
    // 1. Parse the target coordinates into an array of numbers
    // This handles both "ID, 0.1, 0.2" and "0.1, 0.2"
    const targetParts = targetG25Raw.split(',');
    const targetCoords = targetParts
        .map(Number)
        .filter(n => !isNaN(n));

    if (targetCoords.length === 0) {
        console.error("Invalid Target Coordinates");
        return allPoints;
    }

    // 2. Map through all points and calculate distance directly
    return allPoints.map(point => {
        if (!point.g25_string) return { ...point, distance: 999 };

        // Parse point coords (assuming g25_string is "0.123,0.456...")
        const pointCoords = point.g25_string.split(',').map(Number);

        // 3. Euclidean Distance Calculation
        const sumSq = targetCoords.reduce((sum, val, i) => {
            const pVal = pointCoords[i] || 0;
            return sum + Math.pow(val - pVal, 2);
        }, 0);

        const dist = Math.sqrt(sumSq);

        return {
            ...point,
            distance: dist
        };
    });
};


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
    'interpolate', ['linear'], ['get', 'distance'],
    0, '#1d4ed8', 0.02, '#1d4ed8', 0.04, '#3b82f6', 0.08, '#93c5fd', 0.15, '#d6d3d1'
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