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
}

export function useMapSync({
    mapRef,
    geojsonData,
    mapMode,
    targetSample,
    selectedCulture,
    activeTheme
}: UseMapSyncProps) {
    useEffect(() => {
        const map = mapRef.current;
        if (!map) return;

        const syncMap = () => {
            // 1. Handle Source
            let source = map.getSource('ancient-samples') as mapboxgl.GeoJSONSource;
            if (!source) {
                map.addSource('ancient-samples', { type: 'geojson', data: geojsonData });
            } else {
                source.setData(geojsonData);
            }

            // 2. Handle Layer
            if (!map.getLayer('ancient-points')) {
                map.addLayer({
                    id: 'ancient-points',
                    type: 'circle',
                    source: 'ancient-samples',
                    paint: {
                        'circle-radius': 4,
                        'circle-stroke-width': 1,
                        'circle-stroke-color': '#fff',
                        'circle-color': '#78716c',
                    },
                });
            }

            // 3. Handle Dynamic Styling (Colors)
            const color = selectedCulture
                ? ['case', ['==', ['get', 'Simplified_Culture'], selectedCulture], '#3b82f6', '#d1d5db']
                : (mapMode === 'ydna' ? YDNAColors : (mapMode === 'distance' && targetSample ? distanceColors : '#78716c'));

            map.setPaintProperty('ancient-points', 'circle-color', color);
        };

        // If the style is changing, wait for it to be ready before drawing
        if (!map.isStyleLoaded()) {
            map.once('idle', syncMap);
        } else {
            syncMap();
        }
    }, [geojsonData, selectedCulture, mapMode, targetSample, activeTheme, mapRef]);
}