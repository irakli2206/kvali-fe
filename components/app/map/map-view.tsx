"use client"

import { createPortal } from 'react-dom'
import 'mapbox-gl/dist/mapbox-gl.css'
import { useMapStore } from '@/store/use-map-store'
import { MapMode, Sample } from '@/types'
import MapPopup from './popup'
import { MapControlBar } from './map-control-bar'
import { useMapInstance } from '@/hooks/use-map-instance'
import { useMapData } from '@/hooks/use-map-data'
import { useMapMarkers } from '@/hooks/use-map-markers'
import { useMapSync } from '@/hooks/use-map-sync'
import { DistanceLegend } from './distances-legend'

export default function MapView() {
    const { mapRef, mapContainerRef, activeTheme, isMapReady } = useMapInstance()
    const { geojsonData, mapData, handleCalculateDists, resetData } = useMapData()
    const { selectedSample, targetSample, mapMode, selectedCulture, hoveredId } = useMapStore()

    useMapSync({
        mapRef,
        geojsonData: geojsonData as any,
        mapMode,
        targetSample,
        selectedCulture,
        activeTheme,
        hoveredId,
        selectedSampleId: selectedSample?.id ?? null,
    })
    const { popupContainer, closePopup } = useMapMarkers(mapRef, geojsonData)

    return (
        <div className="relative w-full h-full bg-[#f8f8f8] overflow-hidden">
            <div ref={mapContainerRef} className="absolute inset-0 w-full h-full" />

            {isMapReady && mapMode === 'distance' && (
                <DistanceLegend
                    mapRef={mapRef}
                    mapData={mapData as Array<Sample & { distance: number }>}
                />
            )}

            <MapControlBar
                onReset={() => {
                    useMapStore.getState().resetData()
                    resetData()
                }}
            />

            {popupContainer &&
                selectedSample &&
                createPortal(
                    <MapPopup sample={selectedSample} handleCalculateDists={handleCalculateDists} onClose={closePopup} />,
                    popupContainer
                )}
        </div>
    )
}
