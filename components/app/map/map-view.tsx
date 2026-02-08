"use client"

import React, { useEffect, useRef, useMemo, useState, JSX, ReactNode } from 'react'
import { createPortal } from 'react-dom'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { FeatureCollection, Geometry, GeoJsonProperties } from 'geojson';
import { csvToGeoJSON, distanceColors, runComparisonLogic, YDNAColors } from '@/lib/map-utils'
import { useMapStore } from '@/store/use-map-store'
import { Button } from '@/components/ui/button'
import { ArrowLeftIcon, Clock, ClockFading, Cross, Dna, Grid2X2X, Link, List, LucideIcon, Map, Settings, Star, VenusAndMars, X } from 'lucide-react'
import { MapMode, MapTheme, Sample } from '@/types'
import { Badge } from '@/components/ui/badge'
import CoverageBadge from '@/components/shared/coverage-badge'
import { calculateDistances } from '@/lib/g25-utils'
import { getSampleDetails } from '@/lib/api/samples'
import { useQuery } from '@tanstack/react-query'
import { Skeleton } from '@/components/ui/skeleton'
import { ButtonGroup } from '@/components/ui/button-group'
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { DropdownMenuTrigger, DropdownMenuContent, DropdownMenuGroup, DropdownMenuLabel, DropdownMenuCheckboxItem, DropdownMenu, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/dropdown-menu'
import MapPopup from './popup'
import { SliderControl } from '@base-ui/react'
import TimeWindowController from './time-window-controller'

mapboxgl.accessToken = 'pk.eyJ1IjoiaXJha2xpMjIwNiIsImEiOiJja3dkZzl3dDgwa2FyMnBwbjEybjd0dmxpIn0.-XNJzlRbWG0zH2Q1MRpmOA';

// --- Utilities ---
const parseCoords = (val: string | number) =>
    typeof val === 'string' ? parseFloat(val.replace(',', '.')) : val;

const PING_HTML = `
    <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-stone-500 opacity-75"></span>
    <span class="relative inline-flex rounded-full h-3 w-3 bg-stone-900 border-2 border-white"></span>
`;

export default function MapView({ data }: { data: any[] }) {
    const [mapData, setMapData] = useState(data);
    const { selectedSample, setSelectedSample, targetSample, setTargetSample, mapMode, setMapMode, timeWindow } = useMapStore();

    const [showMatchesList, setShowMatchesList] = useState<boolean>(false)

    const [activeTheme, setActiveTheme] = useState<MapTheme>('Light-V11')
    const isYdnaColorized = mapMode === 'ydna'


    // Refs for Mapbox instance management
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<mapboxgl.Map | null>(null);
    const pingRef = useRef<mapboxgl.Marker | null>(null);
    const popupRef = useRef<mapboxgl.Popup | null>(null);
    const [popupContainer, setPopupContainer] = useState<HTMLDivElement | null>(null);



    const geojsonData = useMemo(() => csvToGeoJSON(mapData), [mapData]);
    const nearestMatches = useMemo(() => {
        if (!targetSample) return [];

        return [...geojsonData.features]
            .map(f => f.properties)
            .filter(p => p.distance != null && p.id !== targetSample.id)
            .sort((a, b) => a.distance - b.distance)
            .slice(0, 10);
    }, [geojsonData, targetSample]);

    console.log('nearestMatches', nearestMatches)

    const handleCalculateDists = (target: Sample) => {

        const updated = runComparisonLogic(target.id, mapData, target.g25_string!);
        setTargetSample(target!)
        setMapData(updated);
        setMapMode('distance');
        setShowMatchesList(true)
    };




    useEffect(() => {
        const map = mapRef.current;
        if (!map) return;

        // 1. Change the style
        map.setStyle('mapbox://styles/mapbox/' + activeTheme.toLowerCase());

        const handleStyleData = () => {
            // 1. Check if the source already exists. If it does, don't try to add it again.
            if (!map.getSource('ancient-samples')) {
                map.addSource('ancient-samples', {
                    type: 'geojson',
                    data: geojsonData,
                });
            }

            // 2. Check if the layer already exists.
            if (!map.getLayer('ancient-points')) {
                // Decide color logic
                const circleColor = isYdnaColorized
                    ? YDNAColors
                    : (targetSample ? distanceColors : '#78716c');

                map.addLayer({
                    id: 'ancient-points',
                    type: 'circle',
                    source: 'ancient-samples',
                    paint: {
                        'circle-radius': 4,
                        'circle-stroke-width': 1,
                        'circle-stroke-color': '#fff',
                        'circle-color': circleColor,
                    },
                });
            }
        };

        map.on('styledata', handleStyleData);

        return () => {
            map.off('styledata', handleStyleData);
        };
    }, [activeTheme, geojsonData, targetSample]);


    useEffect(() => {
        const map = mapRef.current;
        if (!map || !geojsonData) return;

        // 1. Get the time window from your store (assuming useMapStore provides this)
        // If your store uses a different name, just update 'timeWindow' here.
        const [minYear, maxYear] = timeWindow || [-10000, 2026];

        // 2. Filter the data based on BOTH mode and time
        let filteredFeatures = geojsonData.features.filter(feature => {
            const props = feature.properties;
            if (!props) return false;

            // --- Temporal Filtering ---
            // Parse 'Mean' safely. Since it's a string, parseFloat handles leading numbers.
            const year = parseFloat(props.Mean);
            const isWithinTime = !isNaN(year) && year >= minYear && year <= maxYear;

            if (!isWithinTime) return false;

            // --- Mode Specific Filtering ---
            if (mapMode === 'ydna') {
                const ydna = props['Y-Symbol'];
                return ydna &&
                    ydna !== '' &&
                    ydna !== 'null' &&
                    ydna !== 'unknown' &&
                    ydna !== 'N/A';
            }

            return true;
        });

        const displayData = {
            ...geojsonData,
            features: filteredFeatures
        } as FeatureCollection<Geometry, GeoJsonProperties>;

        // 3. Update the Source
        const source = map.getSource('ancient-samples') as mapboxgl.GeoJSONSource;
        if (source) {
            source.setData(displayData);
        }

        // 4. Update the Colors
        let color = (mapMode === 'ydna') ? YDNAColors :
            (mapMode === 'distance' && targetSample) ? distanceColors :
                '#78716c';

        map.setPaintProperty('ancient-points', 'circle-color', color as mapboxgl.ExpressionSpecification);
        map.setPaintProperty('ancient-points', 'circle-stroke-opacity', 1);

        // Dependency array: make sure to add timeWindow here!
    }, [mapMode, targetSample, geojsonData, timeWindow]);


    useEffect(() => {
        if (!mapContainerRef.current || mapRef.current) return;

        const map = new mapboxgl.Map({
            container: mapContainerRef.current,
            style: 'mapbox://styles/mapbox/light-v11',
            center: [20, 45],
            zoom: 5,
        });

        // Add zoom and rotation controls (Built-in)
        // map.addControl(new mapboxgl.NavigationControl(), 'bottom-right');



        mapRef.current = map;

        map.on('load', () => {
            map.addSource('ancient-samples', {
                type: 'geojson',
                data: geojsonData,
            });

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

            map.on('click', 'ancient-points', (e) => {
                const feature = e.features?.[0];
                if (!feature) return;

                const sample = feature.properties as any;
                const coordinates = (feature.geometry as any).coordinates.slice();

                const container = document.createElement('div');
                // Note: Check if your CSV property is 'culture' or 'Simplified_Culture'
                setSelectedSample(sample);
                setPopupContainer(container);

                const popup = new mapboxgl.Popup({ offset: 10, closeButton: false, anchor: 'top' })
                    .setLngLat(coordinates)
                    .setDOMContent(container)
                    .addTo(map);

                popupRef.current = popup;
            });

            // Change cursor on hover
            map.on('mouseenter', 'ancient-points', () => {
                map.getCanvas().style.cursor = 'pointer';
            });
            map.on('mouseleave', 'ancient-points', () => {
                map.getCanvas().style.cursor = '';
            });
            // ------------------------
        });

        return () => {
            map.remove();
            mapRef.current = null;
        };
    }, []);

    // --- Effect: React to Selection (Zustand) ---
    useEffect(() => {
        if (!selectedSample || !mapRef.current) return;

        const lat = parseCoords(selectedSample["Latitude"]);
        const lng = parseCoords(selectedSample["Longitude"]);
        if (isNaN(lat) || isNaN(lng)) return;

        // 1. Handle Ping Marker
        if (pingRef.current) pingRef.current.remove();
        const el = document.createElement('div');
        el.className = 'relative flex h-8 w-8 items-center justify-center';
        el.innerHTML = PING_HTML;
        pingRef.current = new mapboxgl.Marker(el).setLngLat([lng, lat]).addTo(mapRef.current);

        // 2. Handle Flying
        mapRef.current.flyTo({ center: [lng, lat - 1], zoom: 5, essential: true });

        // 3. FORCE POPUP OPEN (The change you needed)
        // Clear existing popup if any
        if (popupRef.current) popupRef.current.remove();

        const container = document.createElement('div');
        setPopupContainer(container); // This triggers the Portal

        const popup = new mapboxgl.Popup({ offset: 10, closeButton: false, anchor: 'top' })
            .setLngLat([lng, lat])
            .setDOMContent(container)
            .addTo(mapRef.current);

        popupRef.current = popup;

        // Optional: Reset popupContainer when popup is closed via Mapbox X or similar
        popup.on('close', () => setPopupContainer(null));

    }, [selectedSample]);

    console.log('sel', selectedSample)

    const closePopup = () => {
        if (popupRef.current) popupRef.current.remove();
        setPopupContainer(null);
    };

    console.log('geojsonData', geojsonData)

    return (
        <div className="relative w-full h-full bg-[#f8f8f8] overflow-hidden">
            <div ref={mapContainerRef} className="absolute inset-0 w-full h-full" />

            {/* <div className="bg-white/30 backdrop-blur border rounded-sm w-fit h-20 absolute inset-2 p-2">
                <h1 className="font-semibold text-sm">Kvali Engine</h1>
                <p className="text-muted-foreground text-xs font-light">{data.length} samples loaded</p>
            </div> */}


            <DropdownMenu >
                <DropdownMenuTrigger asChild className="w-fit h-fit absolute right-2 top-2">
                    <Button variant="outline">
                        <Settings />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-40">
                    <DropdownMenuGroup>
                        <DropdownMenuLabel>Map Mode</DropdownMenuLabel>
                        <DropdownMenuRadioGroup value={mapMode} onValueChange={(val) => { setMapMode(val as MapMode) }}>
                            <DropdownMenuRadioItem value="neutral">Neutral</DropdownMenuRadioItem>
                            <DropdownMenuRadioItem value="distances">Distances</DropdownMenuRadioItem>
                            <DropdownMenuRadioItem value="ydna">Y-DNA</DropdownMenuRadioItem>
                        </DropdownMenuRadioGroup>

                    </DropdownMenuGroup>
                </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu >
                <DropdownMenuTrigger asChild className="w-fit h-fit absolute right-2 top-12">
                    <Button variant="outline">
                        <Map />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-40">
                    <DropdownMenuGroup>
                        <DropdownMenuLabel>Map Theme</DropdownMenuLabel>
                        <DropdownMenuRadioGroup value={activeTheme} onValueChange={(val) => { setActiveTheme(val as MapTheme) }}>
                            <DropdownMenuRadioItem value="Light-V11">Light</DropdownMenuRadioItem>
                            <DropdownMenuRadioItem value="Dark-V11">Dark</DropdownMenuRadioItem>
                            <DropdownMenuRadioItem value="Standard">Standard</DropdownMenuRadioItem>
                        </DropdownMenuRadioGroup>

                    </DropdownMenuGroup>
                </DropdownMenuContent>
            </DropdownMenu>

            {/* <ButtonGroup className="w-fit h-fit absolute right-2 top-2 gap-4" orientation={'vertical'}>
                <Button variant="outline" size="icon" aria-label="Change theme">
                    <Map />
                </Button>

            </ButtonGroup> */}
            {/* <ToggleGroup className="w-fit h-fit absolute right-2 top-12 gap-4 bg-white" variant="outline" size='sm'  type="multiple">
                <ToggleGroupItem value="bold">
                    <List />
                </ToggleGroupItem>

            </ToggleGroup> */}
            {/* 
            {showMatchesList &&
                <div className="bg-white backdrop-blur border rounded-sm w-fit h-fit absolute right-12 top-2 p-2">
                    <h1 className="font-semibold text-sm">Nearest matches</h1>
                    <div className="flex flex-col text-sm gap-0.5">
                        {nearestMatches &&
                            nearestMatches.map(match => {
                                return (
                                    <p className='flex justify-between gap-20 cursor-pointer'
                                        onClick={() => setSelectedSample(match)}
                                    ><span>{match['Simplified_Culture']}:{match['Object-ID']}</span> <Badge variant={'outline'}>{match.distance.toFixed(3)}</Badge></p>
                                )
                            })
                        }

                    </div>
                </div>
            } */}
            {

                <div className='absolute bottom-4 w-full'>
                    <TimeWindowController />
                </div>
            }

            {popupContainer && selectedSample && createPortal(
                <MapPopup
                    sample={selectedSample}
                    handleCalculateDists={handleCalculateDists}
                />,
                popupContainer
            )}
        </div>
    );
}





const YDNALegend = ({ onClose }: { onClose: () => void }) => {
    // This should match the colors we defined in your YDNAColors array
    const legendItems = [
        { label: 'R1b', color: '#ef4444', desc: 'Western Europe' },
        { label: 'R1a', color: '#3b82f6', desc: 'Eastern Europe/Central Asia' },
        { label: 'I', color: '#10b981', desc: 'European Hunter-Gatherer' },
        { label: 'J', color: '#8b5cf6', desc: 'Near Eastern/Caucasian' },
        { label: 'G', color: '#06b6d4', desc: 'Early Anatolian Farmers' },
        { label: 'E', color: '#78350f', desc: 'African/Mediterranean' },
        { label: 'N', color: '#84cc16', desc: 'Uralic/Siberian' },
        { label: 'Q', color: '#f43f5e', desc: 'Siberian/Amerindian' },
    ];

    return (
        <div className="absolute bottom-6 right-2 w-64 bg-white/90 backdrop-blur-md border border-stone-200 rounded-lg shadow-xl p-4 animate-in fade-in slide-in-from-bottom-2">
            <div className="flex items-center justify-between mb-3 border-b pb-2">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                    <Dna className="w-4 h-4 text-primary" />
                    Y-DNA Haplogroups
                </h3>
                <Button variant="ghost" size="icon-sm" onClick={onClose}>
                    <X className="w-3 h-3" />
                </Button>
            </div>
            <div className="grid grid-cols-1 gap-2 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                {legendItems.map((item) => (
                    <div key={item.label} className="flex items-center gap-3">
                        <div
                            className="w-3 h-3 rounded-full shrink-0 border border-black/10"
                            style={{ backgroundColor: item.color }}
                        />
                        <div className="flex flex-col">
                            <span className="text-xs font-bold leading-none">{item.label}</span>
                            <span className="text-[10px] text-muted-foreground leading-tight">{item.desc}</span>
                        </div>
                    </div>
                ))}
                <div className="flex items-center gap-3 pt-1 border-t mt-1">
                    <div className="w-3 h-3 rounded-full shrink-0 bg-[#e7e5e4] border border-black/10" />
                    <span className="text-xs text-muted-foreground">Other / Macro groups</span>
                </div>
            </div>
        </div>
    );
};