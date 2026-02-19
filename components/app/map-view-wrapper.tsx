'use client'

import MapView from '@/components/app/map/map-view'
import { useMapSamples } from '@/hooks/use-map-samples'

export default function MapViewWrapper() {
    const { data: samples, isLoading, error } = useMapSamples()

    if (isLoading) {
        return (
            <div className="flex h-full items-center justify-center p-8">
                <p className="text-muted-foreground">Loading map...</p>
            </div>
        )
    }

    if (error) {
        return (
            <div className="flex h-full items-center justify-center p-8">
                <p className="text-destructive">Failed to load map data: {error.message}</p>
            </div>
        )
    }

    if (!samples?.length) {
        return (
            <div className="flex h-full items-center justify-center p-8">
                <p className="text-muted-foreground">No samples available.</p>
            </div>
        )
    }

    return (
        <div className="w-full h-full relative overflow-hidden">
            <MapView />
        </div>
    )
}
