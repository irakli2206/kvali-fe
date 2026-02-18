import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import { Sample } from '@/types';
import { useMapStore } from '@/store/use-map-store';

const PING_HTML = `
    <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-stone-500 opacity-75"></span>
    <span class="relative inline-flex rounded-full h-3 w-3 border-2 border-white"></span>
`;

const parseCoords = (val: string | number) =>
    typeof val === 'string' ? parseFloat(val.replace(',', '.')) : val;

export function useMapMarkers(mapRef: React.RefObject<mapboxgl.Map | null>, geojsonData: any) {
    const { selectedSample, selectedCulture, setSelectedSample } = useMapStore()

    const [popupContainer, setPopupContainer] = useState<HTMLDivElement | null>(null);
    const pingRef = useRef<mapboxgl.Marker | null>(null);
    const popupRef = useRef<mapboxgl.Popup | null>(null);

    useEffect(() => {
        const map = mapRef.current;
        if (!selectedSample || !map) return;

        const lat = parseCoords(selectedSample["Latitude"]!);
        const lng = parseCoords(selectedSample["Longitude"]!);
        if (isNaN(lat) || isNaN(lng)) return;

        // 1. Handle Marker (The Ping)
        if (pingRef.current) pingRef.current.remove();
        const el = document.createElement('div');
        el.className = 'relative flex h-8 w-8 items-center justify-center';
        el.innerHTML = PING_HTML;
        pingRef.current = new mapboxgl.Marker(el).setLngLat([lng, lat]).addTo(map);

        // 2. Handle Camera
        map.flyTo({ center: [lng, lat - 0], zoom: map.getZoom() < 5 ? 5 : map.getZoom(), essential: true, });

        // 3. Handle Popup
        if (popupRef.current) {
            // This is where the error was. Mapbox requires the function reference.
            // If we don't have it, we can just remove the popup, 
            // but the 'close' event might still fire. 
            // To be safe, we'll manually remove the popup and null out the ref first.
            const oldPopup = popupRef.current;
            popupRef.current = null;
            oldPopup.remove();
        }

        const container = document.createElement('div');
        setPopupContainer(container);

        const popup = new mapboxgl.Popup({ offset: 5, closeButton: false, anchor: 'top' })
            .setLngLat([lng, lat])
            .setDOMContent(container)
            .addTo(map);

        popupRef.current = popup;

        popup.on('close', () => {
            setPopupContainer(null);

            // Mapbox popups have an .isOpen() method. 
            // If the popup is closed manually by the user, we remove the ping.
            // If we are just swapping samples, our code handles the marker removal separately.
            if (pingRef.current && popupRef.current && !popupRef.current.isOpen()) {
                pingRef.current.remove();
                pingRef.current = null;
            }
        });
    }, [selectedSample, mapRef]);


    useEffect(() => {
        const map = mapRef.current;
        if (!map) return;
        const handlePointClick = (e: any) => {
            const feature = e.features?.[0];
            if (feature) {
                setSelectedSample(feature.properties);
            }
        };
        map.on('click', 'ancient-points', handlePointClick);
        return () => { map.off('click', 'ancient-points', handlePointClick); };
    }, [mapRef]);

    useEffect(() => {
        const map = mapRef.current;
        if (!map || !selectedCulture || !geojsonData) return;

        // Find the first sample that belongs to this culture
        const firstMatch = geojsonData.features.find(
            (f: any) => f.properties?.Simplified_Culture === selectedCulture
        );

        if (firstMatch) {
            const [lng, lat] = firstMatch.geometry.coordinates;
            map.flyTo({
                center: [lng, lat],
                zoom: 4, // Zoom out a bit to see the "group"
                essential: true
            });
        }
    }, [selectedCulture, geojsonData, mapRef]);

    const closePopup = () => {
        if (popupRef.current) {
            popupRef.current.remove();
            setSelectedSample(null);
        }
    };

    return { popupContainer, closePopup };
}