"use client"

import { useEffect } from 'react';
import mapboxgl from 'mapbox-gl';
import { FeatureCollection, Geometry, GeoJsonProperties } from 'geojson';
import { distanceColors, YDNAColors } from '@/lib/map-utils';
import { MapMode, Sample } from '@/types';

interface UseMapSyncProps {
    mapRef: React.RefObject<mapboxgl.Map | null>;
    geojsonData: FeatureCollection<Geometry, GeoJsonProperties>;
    mapMode: MapMode;
    targetSample: Sample | null;
    selectedCulture: string | null;
    activeTheme: string;
    hoveredId: string | null;
}

export function useMapSync({
    mapRef,
    geojsonData,
    mapMode,
    targetSample,
    selectedCulture,
    activeTheme,
    hoveredId
}: UseMapSyncProps) {
    useEffect(() => {
        const map = mapRef.current;
        if (!map) return;

        const syncMap = () => {
            if (!map.isStyleLoaded() || !map.getStyle()) return;

            let source = map.getSource('ancient-samples') as mapboxgl.GeoJSONSource;
            if (!source) {
                map.addSource('ancient-samples', { type: 'geojson', data: geojsonData });
            } else {
                source.setData(geojsonData);
            }

            const safeHoverId = hoveredId || "NON_EXISTENT_ID";
            const isAnyHovered = hoveredId !== null;

            if (!map.getLayer('ancient-points')) {
                map.addLayer({
                    id: 'ancient-points',
                    type: 'circle',
                    source: 'ancient-samples',
                    layout: {
                        // This enables the sorting logic
                        'circle-sort-key': [
                            'case',
                            ['==', ['get', 'id'], safeHoverId], 2, // Hovered dot gets priority
                            1 // Everyone else stays at base level
                        ]
                    },
                    paint: {
                        'circle-stroke-width': 1,
                        'circle-stroke-color': '#fff',
                        // Add transitions so color/opacity changes feel smooth
                        'circle-color-transition': { duration: 300 },
                        'circle-opacity-transition': { duration: 200 }
                    }
                });
            }

            //Calculate Base Colors based on Mode
            const baseColor = selectedCulture
                ? ['case', ['==', ['get', 'Simplified_Culture'], selectedCulture], '#3b82f6', '#d1d5db']
                : (mapMode === 'distance' && targetSample)
                    ? distanceColors
                    : (mapMode === 'ydna' ? YDNAColors : '#78716c');


            //Apply Paint Properties
            map.setPaintProperty('ancient-points', 'circle-color', [
                'case',
                ['==', ['get', 'id'], safeHoverId], '#2563eb', // Highlight color
                baseColor as any
            ]);

            map.setPaintProperty('ancient-points', 'circle-opacity', [
                'case',
                ['==', ['get', 'id'], safeHoverId], 1.0,
                isAnyHovered ? 0.15 : 0.8
            ]);

            map.setLayoutProperty('ancient-points', 'circle-sort-key', [
                'case',
                ['==', ['get', 'id'], safeHoverId], 2,
                1
            ]);

            map.setPaintProperty('ancient-points', 'circle-radius', [
                'case',
                ['==', ['get', 'id'], safeHoverId], 6,
                4
            ]);
        };

        if (map.isStyleLoaded()) {
            syncMap();
        } else {
            map.once('idle', syncMap);
        }
    }, [geojsonData, mapMode, targetSample, selectedCulture, activeTheme, hoveredId, mapRef]);
}