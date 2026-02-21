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
    selectedSampleId: string | null;
}

export function useMapSync({
    mapRef,
    geojsonData,
    mapMode,
    targetSample,
    selectedCulture,
    activeTheme,
    hoveredId,
    selectedSampleId
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
            const safeSelectedId = selectedSampleId || "NON_EXISTENT_ID";
            const isAnyHovered = hoveredId !== null;

            if (!map.getLayer('ancient-points')) {
                map.addLayer({
                    id: 'ancient-points',
                    type: 'circle',
                    source: 'ancient-samples',
                    layout: {
                        'circle-sort-key': [
                            'case',
                            ['==', ['get', 'id'], safeSelectedId], 4,
                            ['==', ['get', 'id'], safeHoverId], 3,
                            1
                        ]
                    },
                    paint: {
                        'circle-stroke-width': 1,
                        'circle-stroke-color': '#fff',
                        'circle-color-transition': { duration: 300 },
                        'circle-opacity-transition': { duration: 200 }
                    }
                });
            }

            const baseColor = selectedCulture
                ? ['case', ['==', ['get', 'culture'], selectedCulture], '#3b82f6', '#d1d5db']
                : (mapMode === 'distance' && targetSample)
                    ? distanceColors
                    : (mapMode === 'ydna' ? YDNAColors : '#78716c');

            map.setPaintProperty('ancient-points', 'circle-color', [
                'case',
                ['==', ['get', 'id'], safeSelectedId], '#2563eb',
                ['==', ['get', 'id'], safeHoverId], '#2563eb',
                baseColor as any
            ]);

            map.setPaintProperty('ancient-points', 'circle-opacity', [
                'case',
                ['==', ['get', 'id'], safeSelectedId], 1.0,
                ['==', ['get', 'id'], safeHoverId], 1.0,
                isAnyHovered ? 0.3 : 1
            ]);

            const sortKeyLogic = [
                'case',
                ['==', ['get', 'id'], safeSelectedId], 4,
                ['==', ['get', 'id'], safeHoverId], 3,
                ['all',
                    ['==', mapMode, 'distance'],
                    ['has', 'distance'],
                    ['<', ['get', 'distance'], 1000]
                ], 2,
                ['all',
                    ['==', mapMode, 'ydna'],
                    ['has', 'y_haplo'],
                    ['!=', ['get', 'y_haplo'], '']
                ], 2,
                1
            ];

            map.setLayoutProperty('ancient-points', 'circle-sort-key', sortKeyLogic as any);

            map.setPaintProperty('ancient-points', 'circle-radius', [
                'case',
                ['==', ['get', 'id'], safeSelectedId], 6,
                ['==', ['get', 'id'], safeHoverId], 6,
                4
            ]);
        };

        const attemptSync = () => {
            if (map.isStyleLoaded() && map.getStyle()) {
                syncMap();
            }
        };

        if (map.isStyleLoaded()) {
            attemptSync();
        }

        map.on('idle', attemptSync);

        return () => {
            map.off('idle', attemptSync);
        };
    }, [geojsonData, mapMode, targetSample, selectedCulture, activeTheme, hoveredId, selectedSampleId, mapRef]);
}
