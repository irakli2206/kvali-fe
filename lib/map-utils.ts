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
    'R1b', '#ef4444',
    'R1a', '#3b82f6',
    'I', '#10b981',
    'J', '#8b5cf6',
    'G', '#06b6d4',
    '#78716c' // Fallback for everything else
];

export const distanceColors = [
    'interpolate', ['linear'], ['get', 'distance'],
    0, '#1d4ed8', 0.02, '#1d4ed8', 0.04, '#3b82f6', 0.08, '#93c5fd', 0.15, '#d6d3d1'
];