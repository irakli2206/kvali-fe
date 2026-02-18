"use client"

import { createPortal } from 'react-dom'
import 'mapbox-gl/dist/mapbox-gl.css'
import { useMapStore } from '@/store/use-map-store'
import { Button } from '@/components/ui/button'
import { Map, Settings } from 'lucide-react'
import { MapMode, MapTheme, Sample } from '@/types'
import {
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenu,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
} from '@/components/ui/dropdown-menu'
import MapPopup from './popup'
import TimeWindowController from './time-window-controller'
import { YDNAFilter } from './ydna-filter'
import { useMapInstance } from '@/hooks/use-map-instance'
import { useMapData } from '@/hooks/use-map-data'
import { useMapMarkers } from '@/hooks/use-map-markers'
import { useMapSync } from '@/hooks/use-map-sync'
import { DistanceLegend } from './distances-legend'

export default function MapView() {
    const { mapRef, mapContainerRef, activeTheme, setActiveTheme, isMapReady } = useMapInstance()
    const { geojsonData, handleCalculateDists, resetData } = useMapData()
    const {
        selectedSample,
        setSelectedSample,
        targetSample,
        mapMode,
        setMapMode,
        selectedCulture,
        hoveredId,
    } = useMapStore()

    useMapSync({
        mapRef,
        geojsonData: geojsonData as any,
        mapMode,
        targetSample,
        selectedCulture,
        activeTheme,
        hoveredId,
    })
    const { popupContainer, closePopup } = useMapMarkers(mapRef, geojsonData)

    return (
        <div className="relative w-full h-full bg-[#f8f8f8] overflow-hidden">
            <div ref={mapContainerRef} className="absolute inset-0 w-full h-full" />

            {isMapReady && mapMode === 'distance' && (
                <DistanceLegend
                    mapRef={mapRef}
                    mapData={geojsonData.features.map((f) => ({
                        ...(f.properties as Sample),
                        distance: f.properties?.distance,
                    }))}
                />
            )}

            <div className="absolute right-2 top-2 flex flex-col gap-2">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline">
                            <Settings />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-40">
                        <DropdownMenuLabel>Map Mode</DropdownMenuLabel>
                        <DropdownMenuRadioGroup
                            value={mapMode}
                            onValueChange={(v) => (v === 'neutral' ? resetData() : setMapMode(v as MapMode))}
                        >
                            <DropdownMenuRadioItem value="neutral">Neutral</DropdownMenuRadioItem>
                            <DropdownMenuRadioItem value="ydna">Y-DNA</DropdownMenuRadioItem>
                        </DropdownMenuRadioGroup>
                    </DropdownMenuContent>
                </DropdownMenu>

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline">
                            <Map />
                        </Button>
                    </DropdownMenuTrigger>
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

            {mapMode === 'ydna' && (
                <div className="absolute top-2 left-2 w-fit">
                    <YDNAFilter />
                </div>
            )}
            <TimeWindowController />

            {popupContainer &&
                selectedSample &&
                createPortal(
                    <MapPopup sample={selectedSample} handleCalculateDists={handleCalculateDists} onClose={closePopup} />,
                    popupContainer
                )}
        </div>
    )
}
