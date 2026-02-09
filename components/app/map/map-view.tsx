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
    const { selectedSample, setSelectedSample, targetSample, setTargetSample, mapMode, setMapMode, timeWindow, selectedYDNA, selectedCulture } = useMapStore();

    const [showMatchesList, setShowMatchesList] = useState<boolean>(false)

    const [activeTheme, setActiveTheme] = useState<MapTheme>('Light-V11')
    const isYdnaColorized = mapMode === 'ydna'


    // Refs for Mapbox instance management
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<mapboxgl.Map | null>(null);
    const pingRef = useRef<mapboxgl.Marker | null>(null);
    const popupRef = useRef<mapboxgl.Popup | null>(null);
    const [popupContainer, setPopupContainer] = useState<HTMLDivElement | null>(null);



    const geojsonData = useMemo(() => {
        // 1. Convert the current mapData (which contains distances if calculated) to GeoJSON
        const baseGeoJSON = csvToGeoJSON(mapData);
        const [minYear, maxYear] = timeWindow || [-10000, 2026];

        // 2. Apply the filters here so the map ALWAYS receives the correct subset
        const filteredFeatures = baseGeoJSON.features.filter(feature => {
            const props = feature.properties;
            if (!props) return false;

            // Time Filter
            const year = parseFloat(props.Mean);
            const isWithinTime = !isNaN(year) && year >= minYear && year <= maxYear;
            const isTarget = targetSample && props.id === targetSample.id;
            if (!isWithinTime && !isTarget) return false;

            // Y-DNA Filter
            if (mapMode === 'ydna') {
                const sampleY = props['Y-Symbol'];
                const isValidY = sampleY && !['null', 'unknown', 'N/A', '', 'None'].includes(sampleY);
                if (!isValidY) return false;
                if (selectedYDNA?.length > 0) {
                    return selectedYDNA.some(group => sampleY?.startsWith(group));
                }
            }

            return true;
        });

        return {
            ...baseGeoJSON,
            features: filteredFeatures
        } as FeatureCollection<Geometry, GeoJsonProperties>;
    }, [mapData, timeWindow, mapMode, selectedYDNA, targetSample]);


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

        const [minYear, maxYear] = timeWindow || [-10000, 2026];
        const { selectedYDNA, selectedCulture, mapMode, targetSample } = useMapStore.getState();

        // --- 1. DATA FILTERING ---
        let filteredFeatures = geojsonData.features.filter(feature => {
            const props = feature.properties;
            if (!props) return false;

            // A. Time Filter (This is the "gatekeeper" for ALL modes)
            const year = parseFloat(props.Mean);
            const isWithinTime = !isNaN(year) && year >= minYear && year <= maxYear;

            // Allow the target sample to stay visible even if time slider moves past it
            const isTarget = targetSample && props.id === targetSample.id;

            if (!isWithinTime && !isTarget) return false;

            // B. Y-DNA Mode specific filtering (Removes females/non-matches)
            if (mapMode === 'ydna') {
                const sampleY = props['Y-Symbol'];
                const isValidY = sampleY && !['null', 'unknown', 'N/A', '', 'None'].includes(sampleY);

                if (!isValidY) return false;

                if (selectedYDNA && selectedYDNA.length > 0) {
                    return selectedYDNA.some(group => sampleY?.startsWith(group));
                }
            }

            return true;
        });

        const displayData = {
            ...geojsonData,
            features: filteredFeatures
        } as FeatureCollection<Geometry, GeoJsonProperties>;

        const source = map.getSource('ancient-samples') as mapboxgl.GeoJSONSource;
        if (source) {
            source.setData(displayData);
        }

        // --- 2. COLOR LOGIC ---
        let color: any;
        if (selectedCulture) {
            // Highlighting a culture
            color = [
                'case',
                ['==', ['get', 'Simplified_Culture'], selectedCulture],
                '#3b82f6',
                '#d1d5db'
            ];
        } else {
            // Standard coloring modes
            color = (mapMode === 'ydna') ? YDNAColors :
                (mapMode === 'distance' && targetSample) ? distanceColors :
                    '#78716c';
        }

        map.setPaintProperty('ancient-points', 'circle-color', color);

    }, [mapMode, targetSample, geojsonData, timeWindow, selectedYDNA, selectedCulture]);


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

    useEffect(() => {
        const map = mapRef.current;
        if (!map || !selectedCulture || !data) return;

        // 1. Find all samples for this culture
        const cultureSamples = data.filter(s => s.Simplified_Culture === selectedCulture);
        if (cultureSamples.length === 0) return;

        // 2. Create the bounding box
        const bounds = new mapboxgl.LngLatBounds();

        cultureSamples.forEach(s => {
            const ln = typeof s.Longitude === 'string' ? parseFloat(s.Longitude.replace(',', '.')) : s.Longitude;
            const lt = typeof s.Latitude === 'string' ? parseFloat(s.Latitude.replace(',', '.')) : s.Latitude;

            if (!isNaN(ln) && !isNaN(lt)) {
                bounds.extend([ln, lt]);
            }
        });

        // 3. Fly the map to fit those bounds
        map.fitBounds(bounds, {
            padding: 100, // Keeps dots from hitting the edges of the screen
            maxZoom: 7,   // Prevents zooming in too deep on a single point
            duration: 1500
        });

    }, [selectedCulture, data]); // Only runs when culture changes


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
                        <DropdownMenuRadioGroup
                            value={mapMode}
                            onValueChange={(val) => {
                                const mode = val as MapMode;
                                setMapMode(mode);

                                // If the user goes back to neutral, reset the map data to the original set
                                if (mode === 'neutral') {
                                    setMapData(data); // 'data' is the original prop passed to MapView
                                    setTargetSample(null); // Clear the target reference
                                }
                            }}
                        >
                            <DropdownMenuRadioItem value="neutral">Neutral</DropdownMenuRadioItem>
                            <DropdownMenuRadioItem value="distance">Distances</DropdownMenuRadioItem>
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
            {isYdnaColorized && <div className='absolute top-2 left-2 w-fit'>
                <YDNAFilter />
            </div>}


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





