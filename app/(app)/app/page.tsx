// app/(app)/app/page.tsx
import MapView from '@/components/app/map/map-view'
import { getMapSamples } from '@/lib/api/samples'
import React from 'react'

const App = async () => {
    const { data, error } = await getMapSamples()

    if (error) {
        return (
            <div className="flex h-full items-center justify-center p-8">
                <p className="text-destructive">Failed to load map data: {error}</p>
            </div>
        )
    }

    if (!data?.length) {
        return (
            <div className="flex h-full items-center justify-center p-8">
                <p className="text-muted-foreground">No samples available.</p>
            </div>
        )
    }

    return (
        <div className="w-full h-full relative overflow-hidden">
            <MapView data={data} />
        </div>
    )
}

export default App