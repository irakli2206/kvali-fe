"use client"

import React, { useEffect, useRef, useMemo, useState, JSX, ReactNode } from 'react'
import { createPortal } from 'react-dom'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'

import { csvToGeoJSON, runComparisonLogic } from '@/lib/map-utils'
import { useArchiveStore } from '@/store/use-map-store'
import { Button } from '@/components/ui/button'
import { Clock, ClockFading, Cross, Dna, Grid2X2X, Link, LucideIcon, Star, VenusAndMars, X } from 'lucide-react'
import { Sample } from '@/types'
import { Badge } from '@/components/ui/badge'
import CoverageBadge from '@/components/shared/coverage-badge'
import { calculateDistances } from '@/lib/g25-utils'
import { getSampleDetails } from '@/lib/api/samples'
import { useQuery } from '@tanstack/react-query'
import { Skeleton } from '@/components/ui/skeleton'


mapboxgl.accessToken = 'pk.eyJ1IjoiaXJha2xpMjIwNiIsImEiOiJja3dkZzl3dDgwa2FyMnBwbjEybjd0dmxpIn0.-XNJzlRbWG0zH2Q1MRpmOA';

// --- Utilities ---
const parseCoords = (val: string | number) =>
    typeof val === 'string' ? parseFloat(val.replace(',', '.')) : val;

const PING_HTML = `
    <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-500 opacity-75"></span>
    <span class="relative inline-flex rounded-full h-3 w-3 bg-blue-700 border-2 border-white"></span>
`;

export default function MapView({ data }: { data: any[] }) {
    const [mapData, setMapData] = useState(data);
    const { selectedSample, setSelectedSample, targetSample, setTargetSample } = useArchiveStore();

    // Refs for Mapbox instance management
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<mapboxgl.Map | null>(null);
    const pingRef = useRef<mapboxgl.Marker | null>(null);
    const popupRef = useRef<mapboxgl.Popup | null>(null);

    // Portal State
    const [popupContainer, setPopupContainer] = useState<HTMLDivElement | null>(null);

    const geojsonData = useMemo(() => csvToGeoJSON(mapData), [mapData]);
    const handleCalculateDists = (target?: Sample | null) => {

        const updated = runComparisonLogic(target.id, mapData, target.g25_string!);
        setTargetSample(target!)
        setMapData(updated);
    };




    // --- Effect: Sync Map Data (Distance Visuals) ---
    useEffect(() => {
        const map = mapRef.current;
        if (!map?.isStyleLoaded()) return;

        const source = map.getSource('ancient-samples') as mapboxgl.GeoJSONSource;
        if (source) source.setData(geojsonData);


        if (map.getLayer('ancient-points')) {
            if (targetSample) {
                // 1. CALCULATED STATE: Color by genetic distance
                map.setPaintProperty('ancient-points', 'circle-color', [
                    'interpolate', ['linear'], ['get', 'distance'],
                    0, '#1d4ed8', 0.02, '#1d4ed8', 0.04, '#3b82f6', 0.08, '#93c5fd', 0.15, '#d6d3d1'
                ]);
            } else {
                // 2. RESET STATE: Back to original stone color
                map.setPaintProperty('ancient-points', 'circle-color', '#78716c');


            }
        }
    }, [geojsonData, targetSample]);



    useEffect(() => {
        if (!mapContainerRef.current || mapRef.current) return;

        const map = new mapboxgl.Map({
            container: mapContainerRef.current,
            style: 'mapbox://styles/mapbox/light-v11',
            center: [20, 45],
            zoom: 5,
        });

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

        if (pingRef.current) pingRef.current.remove();

        const el = document.createElement('div');
        el.className = 'relative flex h-8 w-8 items-center justify-center';
        el.innerHTML = PING_HTML;

        pingRef.current = new mapboxgl.Marker(el).setLngLat([lng, lat]).addTo(mapRef.current);
        mapRef.current.flyTo({ center: [lng, lat - 1], zoom: 5, essential: true });
    }, [selectedSample]);



    const closePopup = () => {
        if (popupRef.current) popupRef.current.remove();
        setPopupContainer(null);
    };

    return (
        <div className="relative w-full h-screen bg-[#f8f8f8]">
            <div ref={mapContainerRef} className="absolute inset-0 w-full h-full" />

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

const PopupSkeleton = () => (
    <div className="w-md rounded-md min-h-[300px] bg-white border p-4 space-y-4">
        <div className="space-y-2">
            <Skeleton className="h-6 w-[200px]" /> {/* Title */}
            <Skeleton className="h-4 w-[150px]" /> {/* Location */}
        </div>
        <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex gap-2">
                    <Skeleton className="h-4 w-4 rounded-full" />
                    <Skeleton className="h-4 flex-1" />
                </div>
            ))}
        </div>
        <Skeleton className="h-10 w-full mt-4" /> {/* Button */}
    </div>
)

// --- Sub-Component: Popup ---
function MapPopup({ sample, handleCalculateDists }: { sample: Sample, handleCalculateDists: (sample: Sample) => void }) {
    // isLoading and data are managed for you
    const { data, isLoading } = useQuery({
        queryKey: ['sample', sample.id],
        queryFn: () => getSampleDetails(sample.id).then(res => res.data),
        // This prevents the UI from flickering if you click the same dot twice
        staleTime: 1000 * 60 * 5,
    })

    if (isLoading) return <PopupSkeleton />
    if (!data) return null


    if (!data) return <></>

    const dateNum = Number(data.Mean)
    const parsedDate = dateNum > 0 ? `${Math.abs(dateNum)} CE` : `${Math.abs(dateNum)} BCE`
    const content = getPopupContent(data)

    return (
        <div className="w-md min-h-[300px] bg-white border rounded-md drop-shadow-xs flex flex-col">
            <header className='flex w-full   p-1 items-center justify-between border-b'>
                <Button variant="ghost" size="icon-sm">
                    <X className='' />
                </Button>
                <div className="flex ">
                    <Button variant="ghost" size="icon-sm">
                        <Star className='w-4' />
                    </Button>
                </div>
            </header>

            <main className="flex flex-col p-4 gap-4">
                <div className="">
                    <h6 className="font-medium text-lg">{data['Simplified_Culture']} ({data['Object-ID']})</h6>
                    <span className='text-muted-foreground'>{data.Location}, {data.Country}</span>
                </div>
                <dl className='flex flex-col gap-1'>
                    {
                        content.map(r => <MapPopupRow key={r.label} {...r} />)
                    }
                </dl>

                <aside className="flex flex-col gap-2 ">
                    {data['Kinship-Notes'] &&
                        <div className='px-3 py-2 bg-muted rounded-sm'>
                            <p className='mb-0 '>Additional Information</p>
                            <p className="text-muted-foreground text-xs">{data['Kinship-Notes']}</p>
                        </div>
                    }
                </aside>
            </main>

            <footer className="flex flex-col gap-2 p-4 pt-0">
                <Button variant='secondary' onClick={() => handleCalculateDists(data)} >Calculate Distances</Button>
            </footer>

        </div>
    );
}



type MapPopupRowProps = {
    icon: LucideIcon
    label: string
    value: ReactNode | string
}

export const MapPopupRow = ({ icon: Icon, label, value }: MapPopupRowProps) => {
    // Determine if the value is truly empty
    const displayValue = (value === null || value === undefined || value === "")
        ? <span className="text-muted-foreground/50 italic">N/A</span>
        : value;

    return (
        <div className='flex items-start gap-2'>
            <dt className="flex-1 flex gap-2 items-center text-muted-foreground">
                <Icon className="w-3 h-3 text-zinc-400 stroke-[2.5px]" />
                <span className="font-medium">{label}</span>
            </dt>
            <dd className="flex-1">
                {displayValue}
            </dd>
        </div>
    )
}



const getPopupContent = (data: Sample) => {
    const dateNum = Number(data.Mean)
    const parsedDate = dateNum > 0 ? `${Math.abs(dateNum)} CE` : `${Math.abs(dateNum)} BCE`

    return [
        {
            icon: Clock,
            label: 'Date',
            value: parsedDate
        },
        {
            icon: ClockFading,
            label: 'Dating Method',
            value: data['Method-Date']
        },
        {
            icon: VenusAndMars,
            label: 'Sex',
            value: data.Sex
        },
        {
            icon: Dna,
            label: 'Y-DNA',
            // If data.YFull is missing, value becomes null, triggering N/A
            value: data.YFull ? (
                <a href={data['Y-YFull']} target='_blank' className='flex items-center gap-1 text-blue-500 hover:underline'>
                    {data.YFull} <Link className='w-2.5' />
                </a>
            ) : null
        },
        {
            icon: Dna,
            label: 'mtDNA',
            value: data.mtree ? (
                <a href={data['mt-YFull']} target='_blank' className='flex items-center gap-1 text-blue-500 hover:underline'>
                    {data.mtree} <Link className='w-2.5' />
                </a>
            ) : null
        },
        {
            icon: Grid2X2X,
            label: 'Autosomal Coverage',
            // Ensure coverage isn't an empty string/null
            value: data['Autosomal-Coverage'] ? (
                <CoverageBadge coverage={data['Autosomal-Coverage']} />
            ) : null
        },
    ]
}