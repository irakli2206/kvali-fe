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
import YDNALegend from './ydna-legend'
import { YDNAFilter } from './ydna-filter'

mapboxgl.accessToken = 'pk.eyJ1IjoiaXJha2xpMjIwNiIsImEiOiJja3dkZzl3dDgwa2FyMnBwbjEybjd0dmxpIn0.-XNJzlRbWG0zH2Q1MRpmOA';

// --- Utilities ---
const parseCoords = (val: string | number) =>
    typeof val === 'string' ? parseFloat(val.replace(',', '.')) : val;

const PING_HTML = `
    <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-stone-500 opacity-75"></span>
    <span class="relative inline-flex rounded-full h-3 w-3  border-2 border-white"></span>
`;

export default function MapView({ data }: { data: any[] }) {
    const [mapData, setMapData] = useState(data);
    const { selectedSample, setSelectedSample, targetSample, setTargetSample, mapMode, setMapMode, timeWindow, selectedYDNA } = useMapStore();

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

        // 1. Get both the Time and Y-DNA selection from the store
        const [minYear, maxYear] = timeWindow || [-10000, 2026];
        // Assuming you added selectedYDNA to your useMapStore
        const { selectedYDNA } = useMapStore.getState();

        // 2. Filter the data
        let filteredFeatures = geojsonData.features.filter(feature => {
            const props = feature.properties;
            if (!props) return false;

            // --- Temporal Filter ---
            const year = parseFloat(props.Mean);
            const isWithinTime = !isNaN(year) && year >= minYear && year <= maxYear;
            if (!isWithinTime) return false;

            // --- Y-DNA Filter (The new part) ---
            if (mapMode === 'ydna') {
                const sampleY = props['Y-Symbol'];

                // If user hasn't selected any specific groups, show all valid ones
                if (!selectedYDNA || selectedYDNA.length === 0) {
                    return sampleY && !['null', 'unknown', 'N/A', ''].includes(sampleY);
                }

                // If user has selected groups, check if this sample starts with any of them
                // Using .startsWith handles sub-clades (e.g., selecting "R1b" shows "R1b1a")
                return selectedYDNA.some(group => sampleY?.startsWith(group));
            }

            return true;
        });

        const displayData = {
            ...geojsonData,
            features: filteredFeatures
        } as FeatureCollection<Geometry, GeoJsonProperties>;

        // 3. Update Mapbox Source
        const source = map.getSource('ancient-samples') as mapboxgl.GeoJSONSource;
        if (source) {
            source.setData(displayData);
        }

        // 4. Update Colors
        let color = (mapMode === 'ydna') ? YDNAColors :
            (mapMode === 'distance' && targetSample) ? distanceColors :
                '#78716c';

        map.setPaintProperty('ancient-points', 'circle-color', color as mapboxgl.ExpressionSpecification);
        map.setPaintProperty('ancient-points', 'circle-stroke-opacity', 1);

        // IMPORTANT: Add selectedYDNA to the dependencies so the map re-renders on change
    }, [mapMode, targetSample, geojsonData, timeWindow, selectedYDNA]);


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

    useEffect(() => {
        if (!selectedSample || !mapRef.current) return

        const lat = parseCoords(selectedSample["Latitude"]);
        const lng = parseCoords(selectedSample["Longitude"]);
        if (isNaN(lat) || isNaN(lng)) return;

        if (pingRef.current) pingRef.current.remove();
        const el = document.createElement('div');
        el.className = 'relative flex h-8 w-8 items-center justify-center';
        el.innerHTML = PING_HTML;
        pingRef.current = new mapboxgl.Marker(el).setLngLat([lng, lat]).addTo(mapRef.current);

        mapRef.current.flyTo({ center: [lng, lat - 1], zoom: 5, essential: true });

        if (popupRef.current) popupRef.current.remove();

        const container = document.createElement('div');
        setPopupContainer(container); // This triggers the Portal

        const popup = new mapboxgl.Popup({ offset: 10, closeButton: false, anchor: 'top' })
            .setLngLat([lng, lat])
            .setDOMContent(container)
            .addTo(mapRef.current);

        popupRef.current = popup;

        popup.on('close', () => {
            setPopupContainer(null)
            pingRef.current.remove();

        });

    }, [selectedSample]);


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


            {/* <YDNALegend onClose={() => { }} /> */}
            <div className='absolute top-2 left-2 w-fit'>
                <YDNAFilter />
            </div>


            <div className='absolute bottom-4 w-full'>
                <TimeWindowController />
            </div>


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





