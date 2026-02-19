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

        const lat = parseCoords(selectedSample.latitude!);
        const lng = parseCoords(selectedSample.longitude!);
        if (isNaN(lat) || isNaN(lng)) return;

        if (pingRef.current) pingRef.current.remove();
        const el = document.createElement('div');
        el.className = 'relative flex h-8 w-8 items-center justify-center';
        el.innerHTML = PING_HTML;
        pingRef.current = new mapboxgl.Marker(el).setLngLat([lng, lat]).addTo(map);

        map.flyTo({ center: [lng, lat], zoom: map.getZoom() < 5 ? 5 : map.getZoom(), essential: true });

        if (popupRef.current) {
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

        const firstMatch = geojsonData.features.find(
            (f: any) => f.properties?.culture === selectedCulture
        );

        if (firstMatch) {
            const [lng, lat] = firstMatch.geometry.coordinates;
            map.flyTo({
                center: [lng, lat],
                zoom: 4,
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
