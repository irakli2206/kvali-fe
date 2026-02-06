"use client"

import React, { useEffect, useRef, useMemo, useState } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { csvToGeoJSON, runComparisonLogic } from '@/lib/map-utils'

mapboxgl.accessToken = 'pk.eyJ1IjoiaXJha2xpMjIwNiIsImEiOiJja3dkZzl3dDgwa2FyMnBwbjEybjd0dmxpIn0.-XNJzlRbWG0zH2Q1MRpmOA'

type Props = {
    data: any[] // This is the initial data from all-ancient-dna.csv
}

export default function MapView({ data }: Props) {
    // We maintain mapData locally so we can inject 'distance' properties
    const [mapData, setMapData] = useState(data)
    const [activeTargetId, setActiveTargetId] = useState<string | null>(null);

    const mapContainerRef = useRef<HTMLDivElement>(null)
    const mapRef = useRef<mapboxgl.Map | null>(null)

    // Memoize the GeoJSON so we don't rebuild it on every render
    const geojsonData = useMemo(() => csvToGeoJSON(mapData), [mapData])

    // The Bridge: Listen for the click from the raw HTML popup
    useEffect(() => {
        const handleEvent = (e: any) => {
            const idFromMap = e.detail;
            const targetItem = mapData.find(item => item.id === idFromMap);

            if (targetItem && targetItem.g25_string) {
                // We pass the raw g25_string. The logic above will extract the numbers.
                const updated = runComparisonLogic(
                    idFromMap,
                    mapData,
                    targetItem.g25_string
                );
                console.log('updated', updated)
                setMapData(updated);
                setActiveTargetId(idFromMap);
            }
        };

        window.addEventListener('set-g25-target', handleEvent);
        return () => window.removeEventListener('set-g25-target', handleEvent);
    }, [mapData]);

    // Initial Map Setup
    useEffect(() => {
        if (!mapContainerRef.current || mapRef.current) return

        mapRef.current = new mapboxgl.Map({
            container: mapContainerRef.current,
            style: 'mapbox://styles/mapbox/light-v11',
            center: [20, 45],
            zoom: 3,
            antialias: true
        });

        const map = mapRef.current;

        map.on('load', () => {
            map.addSource('ancient-samples', {
                type: 'geojson',
                data: geojsonData
            });

            map.addLayer({
                id: 'ancient-points',
                type: 'circle',
                source: 'ancient-samples',
                paint: {
                    'circle-color': '#000', // Default
                    'circle-radius': 4,
                    'circle-stroke-width': 1,
                    'circle-stroke-color': '#fff'
                }
            });

            // POPUP LOGIC
            map.on('click', 'ancient-points', (e) => {
                const feature = e.features?.[0];
                if (!feature) return;

                const coordinates = (feature.geometry as any).coordinates.slice();
                const { culture, id } = feature.properties as any;

                new mapboxgl.Popup({ offset: 15, closeButton: false })
                    .setLngLat(coordinates)
                    .setHTML(`
                        <div class="p-4 bg-white text-black border border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                            <h3 class="font-bold text-xs uppercase tracking-tighter mb-1">${culture}</h3>
                            <p class="text-[10px] text-zinc-400 font-mono mb-3 uppercase">ID: ${id}</p>
                            <button 
                                onclick="window.dispatchEvent(new CustomEvent('set-g25-target', { detail: '${id}' }))"
                                class="w-full text-center py-2 bg-black text-white text-[9px] font-bold uppercase tracking-widest hover:bg-zinc-800 transition-all"
                            >
                                Set as Target
                            </button>
                        </div>
                    `)
                    .addTo(map);
            });

            map.on('mouseenter', 'ancient-points', () => map.getCanvas().style.cursor = 'pointer');
            map.on('mouseleave', 'ancient-points', () => map.getCanvas().style.cursor = '');
        });

        return () => { mapRef.current?.remove(); mapRef.current = null; }
    }, []);

    // UPDATE MAP WHEN DATA CHANGES
    useEffect(() => {
        const map = mapRef.current;
        if (!map || !map.isStyleLoaded()) return;

        const source = map.getSource('ancient-samples') as mapboxgl.GeoJSONSource;
        if (source) {
            source.setData(geojsonData);
        }

        if (map.getLayer('ancient-points')) {
            // Apply the B&W Interpolation logic
            map.setPaintProperty('ancient-points', 'circle-color', [
                'interpolate',
                ['linear'],
                ['get', 'distance'],
                0, '#eff821',      // Hot (Neon Yellow)
                0.02, '#f48849',   // Warm (Orange)
                0.04, '#cf448b',   // Mid (Magenta)
                0.08, '#7201a8',   // Cool (Deep Purple)
                0.15, '#0d0887'    // Cold (Midnight Blue)
            ]);


        }
    }, [geojsonData]);

    return (
        <div className="relative w-full h-screen bg-[#f8f8f8]">
            <div ref={mapContainerRef} className="absolute inset-0 w-full h-full" />


        </div>
    )
}