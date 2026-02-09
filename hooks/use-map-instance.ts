import { useEffect, useRef, useState } from 'react'
import mapboxgl from 'mapbox-gl'
import { MapTheme } from '@/types'

mapboxgl.accessToken = 'pk.eyJ1IjoiaXJha2xpMjIwNiIsImEiOiJja3dkZzl3dDgwa2FyMnBwbjEybjd0dmxpIn0.-XNJzlRbWG0zH2Q1MRpmOA';


export function useMapInstance() {
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<mapboxgl.Map | null>(null);
    const [activeTheme, setActiveTheme] = useState<MapTheme>('Light-V11');

    useEffect(() => {
        // Prevent double initialization in Strict Mode
        if (!mapContainerRef.current || mapRef.current) return;

        const map = new mapboxgl.Map({
            container: mapContainerRef.current,
            style: `mapbox://styles/mapbox/${activeTheme.toLowerCase()}`,
            center: [20, 45],
            zoom: 5,
        });

        mapRef.current = map;

        // Function to ensure the source and layer exist
        // Mapbox wipes these every time the style changes, so we need this "infrastructure" check
        const ensureInfrastructure = () => {
            if (!map.getSource('ancient-samples')) {
                map.addSource('ancient-samples', {
                    type: 'geojson',
                    data: { type: 'FeatureCollection', features: [] }
                });

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
                // Trigger a re-render or custom event if you need the component 
                // to know the "pipes" are installed, but usually setData handles it.
            }
        };

        map.on('load', ensureInfrastructure);
        map.on('styledata', ensureInfrastructure);

        return () => {
            map.remove();
            mapRef.current = null;
        };
    }, []);

    // Explicitly handle theme changes separately to avoid re-initializing the whole map instance
    useEffect(() => {
        const map = mapRef.current;
        if (map) {
            map.setStyle('mapbox://styles/mapbox/' + activeTheme.toLowerCase());
        }
    }, [activeTheme]);

    return {
        mapRef,
        mapContainerRef,
        activeTheme,
        setActiveTheme,
    };
}