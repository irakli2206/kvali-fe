"use client"

import { useEffect, useRef, useState } from 'react'
import mapboxgl from 'mapbox-gl'
import { MapTheme } from '@/types'
import { useMapStore } from '@/store/use-map-store'

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN

export function useMapInstance() {
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<mapboxgl.Map | null>(null);
    const [isMapReady, setIsMapReady] = useState(false);
    const { activeTheme, setActiveTheme } = useMapStore((state) => state)

    useEffect(() => {
        if (!mapContainerRef.current || mapRef.current) return;

        const map = new mapboxgl.Map({
            container: mapContainerRef.current,
            style: `mapbox://styles/mapbox/${activeTheme.toLowerCase()}`,
            center: [20, 45],
            zoom: 5,
        });

        mapRef.current = map;
        setIsMapReady(true);
        return () => {
            map.remove();
            mapRef.current = null;
            setIsMapReady(false);
        };
    }, []);

    // Handle theme changes
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
        isMapReady,
    };
}