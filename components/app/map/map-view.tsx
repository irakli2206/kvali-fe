"use client"

import React, { useEffect } from 'react'
import { createPortal } from 'react-dom'
import 'mapbox-gl/dist/mapbox-gl.css'
import { useMapStore } from '@/store/use-map-store'
import { Button } from '@/components/ui/button'
import { Map, Settings } from 'lucide-react'
import { MapMode, MapTheme, Sample } from '@/types'
import { DropdownMenuTrigger, DropdownMenuContent, DropdownMenuLabel, DropdownMenu, DropdownMenuRadioGroup, DropdownMenuRadioItem } from '@/components/ui/dropdown-menu'
import MapPopup from './popup'
import TimeWindowController from './time-window-controller'
import { YDNAFilter } from './ydna-filter'

// Hooks
import { useMapInstance } from '@/hooks/use-map-instance'
import { useMapData } from '@/hooks/use-map-data'
import { useMapMarkers } from '@/hooks/use-map-markers'
import { useMapSync } from '@/hooks/use-map-sync'
import { DistanceLegend } from './distances-legend'

export default function MapView({ data }: { data: any[] }) {
    const { mapRef, mapContainerRef, activeTheme, setActiveTheme } = useMapInstance();
    const { geojsonData, handleCalculateDists, resetData } = useMapData(data);
    const {
        selectedSample, setSelectedSample, targetSample,
        mapMode, setMapMode, selectedCulture
    } = useMapStore();

    // The logic is now fully encapsulated in these three hooks
    useMapSync({ mapRef, geojsonData, mapMode, targetSample, selectedCulture, activeTheme });
    const { popupContainer } = useMapMarkers(mapRef, geojsonData);

    // Only one side-effect left: the click listener
    useEffect(() => {
        const map = mapRef.current;
        if (!map) return;
        const handlePointClick = (e: any) => {
            const feature = e.features?.[0];
            if (feature) setSelectedSample(feature.properties);
        };
        map.on('click', 'ancient-points', handlePointClick);
        return () => { map.off('click', 'ancient-points', handlePointClick); };
    }, [setSelectedSample, mapRef]);

    return (
        <div className="relative w-full h-full bg-[#f8f8f8] overflow-hidden">
            <div ref={mapContainerRef} className="absolute inset-0 w-full h-full" />

            {mapRef && <DistanceLegend mapRef={mapRef} mapData={geojsonData.features.map(f => ({
                ...(f.properties as Sample),     // 1. Bring back all Sample fields
                distance: f.properties?.distance // 2. Add the distance field
            }))} />}

            <div className="absolute right-2 top-2 flex flex-col gap-2">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild><Button variant="outline"><Settings /></Button></DropdownMenuTrigger>
                    <DropdownMenuContent className="w-40">
                        <DropdownMenuLabel>Map Mode</DropdownMenuLabel>
                        <DropdownMenuRadioGroup value={mapMode} onValueChange={(v) => v === 'neutral' ? resetData() : setMapMode(v as MapMode)}>
                            <DropdownMenuRadioItem value="neutral">Neutral</DropdownMenuRadioItem>
                            {/* <DropdownMenuRadioItem value="distance">Distances</DropdownMenuRadioItem> */}
                            <DropdownMenuRadioItem value="ydna">Y-DNA</DropdownMenuRadioItem>
                        </DropdownMenuRadioGroup>
                    </DropdownMenuContent>
                </DropdownMenu>

                <DropdownMenu>
                    <DropdownMenuTrigger asChild><Button variant="outline"><Map /></Button></DropdownMenuTrigger>
                    <DropdownMenuContent className="w-40">
                        <DropdownMenuLabel>Map Theme</DropdownMenuLabel>
                        <DropdownMenuRadioGroup value={activeTheme} onValueChange={(v) => setActiveTheme(v as MapTheme)}>
                            <DropdownMenuRadioItem value="Light-V11">Light</DropdownMenuRadioItem>
                            <DropdownMenuRadioItem value="Dark-V11">Dark</DropdownMenuRadioItem>
                            <DropdownMenuRadioItem value="Standard">Standard</DropdownMenuRadioItem>
                        </DropdownMenuRadioGroup>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            {mapMode === 'ydna' && <div className='absolute top-2 left-2 w-fit'><YDNAFilter /></div>}
            <div className='absolute bottom-4 w-full'><TimeWindowController /></div>

            {popupContainer && selectedSample && createPortal(
                <MapPopup sample={selectedSample} handleCalculateDists={handleCalculateDists} />,
                popupContainer
            )}
        </div>
    );
}