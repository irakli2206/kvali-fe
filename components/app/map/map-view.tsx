"use client"

import { useEffect } from 'react'
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
import { useRestoreMapFromUrl } from '@/hooks/use-restore-map-from-url'
import { getSampleDetails } from '@/lib/api/samples'

export default function MapView() {
    const { mapRef, mapContainerRef, activeTheme, isMapReady } = useMapInstance()
    const { geojsonData, mapData, handleCalculateDists, resetData, samples } = useMapData()
    const { selectedSample, targetSample, mapMode, selectedCulture, hoveredId, setMapView, restorePendingView, setRestorePendingView } = useMapStore()

    useEffect(() => {
        if (!isMapReady || !restorePendingView || !mapRef?.current) return
        const { center, zoom } = restorePendingView
        mapRef.current.flyTo({ center, zoom, duration: 800 })
        setRestorePendingView(null)
    }, [isMapReady, restorePendingView, mapRef, setRestorePendingView])

    const onRestoreTargetId = async (id: string) => {
        const res = await getSampleDetails(id)
        if (res.data) handleCalculateDists(res.data)
    }
    useRestoreMapFromUrl({ mapRef, isMapReady, samples, onRestoreTargetId })

    useEffect(() => {
        const map = mapRef?.current
        if (!map || !isMapReady) return
        const onMoveEnd = () => {
            const c = map.getCenter()
            setMapView([c.lng, c.lat], map.getZoom())
        }
        map.on('moveend', onMoveEnd)
        onMoveEnd()
        return () => { map.off('moveend', onMoveEnd) }
    }, [mapRef, isMapReady, setMapView])

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
                    mapData={mapData as unknown as Array<Sample & { distance: number }>}
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
