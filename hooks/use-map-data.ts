import { useMemo, useState, useEffect } from 'react'
import { FeatureCollection, Geometry, GeoJsonProperties } from 'geojson'
import { csvToGeoJSON } from '@/lib/map-utils'
import { useMapStore } from '@/store/use-map-store'
import { Sample } from '@/types'
import { calculateDistances, calculateDistancesFromVector } from '@/lib/api/samples'
import { useMapSamples } from './use-map-samples'

const USER_SAMPLE: Partial<Sample> = {
    id: 'user',
    'Object-ID': 'You',
    Simplified_Culture: 'Your DNA',
}

export function useMapData() {
    const { data: rawData, isLoading, error } = useMapSamples()
    const initialData = rawData ?? []
    const [mapData, setMapData] = useState(initialData)

    const {
        timeWindow,
        mapMode,
        setMapMode,
        selectedYDNA,
        setTargetSample,
        selectedCulture,
        setSelectedCulture,
        userG25Vector,
        setUserG25Vector,
    } = useMapStore()

    useEffect(() => {
        if (initialData?.length > 0) {
            setMapData(initialData)
        }
    }, [initialData])

    useEffect(() => {
        if (selectedCulture && mapMode === 'distance') {
            setMapMode('neutral')
            setTargetSample(null)
            setMapData(initialData)
        }
    }, [selectedCulture, setMapMode, setTargetSample, initialData])

    const geojsonData = useMemo(() => {
        const baseGeoJSON = csvToGeoJSON(mapData)
        if (!baseGeoJSON.features.length) return baseGeoJSON

        const minYear = timeWindow?.[0] ?? -10000
        const maxYear = timeWindow?.[1] ?? 2026

        const filteredFeatures = baseGeoJSON.features.filter((feature) => {
            const props = feature.properties
            if (!props) return false

            const year = parseFloat(props.Mean)
            const isWithinTime = isNaN(year) || (year >= minYear && year <= maxYear)
            if (!isWithinTime) return false

            if (mapMode === 'ydna') {
                const sampleY = props['Y-Symbol']
                const isValidY = sampleY && !['null', 'unknown', 'N/A', '', 'None'].includes(sampleY)
                if (!isValidY) return false

                if (selectedYDNA?.length > 0) {
                    return selectedYDNA.some((group) => sampleY?.startsWith(group))
                }
            }

            return true
        })

        return { ...baseGeoJSON, features: filteredFeatures } as FeatureCollection<Geometry, GeoJsonProperties>
    }, [mapData, timeWindow, mapMode, selectedYDNA])

    useEffect(() => {
        const vector = userG25Vector
        if (!vector?.length) return

        setUserG25Vector(null)

        const run = async () => {
            const topMatches: Partial<Sample & { distance: number }>[] = await calculateDistancesFromVector(vector)
            const DISTANCE_NO_MATCH = 1000
            if (!topMatches) return

            setSelectedCulture(null)
            setTargetSample({ ...USER_SAMPLE, g25_vector: vector } as Sample)

            const distanceMap = new Map(topMatches.map((item) => [item.id, item.distance]))
            const mergedData = initialData.map((originalSample: any) => {
                if (distanceMap.has(originalSample.id)) {
                    return { ...originalSample, distance: distanceMap.get(originalSample.id) }
                }
                return { ...originalSample, distance: DISTANCE_NO_MATCH }
            })

            setMapData(mergedData)
            setMapMode('distance')
        }
        run()
    }, [userG25Vector, setUserG25Vector, setSelectedCulture, setTargetSample, setMapMode, initialData])

    const handleCalculateDists = async (target: Sample) => {
        const topMatches: Partial<Sample & { distance: number }>[] = await calculateDistances(target)
        const DISTANCE_NO_MATCH = 1000
        if (!topMatches) return

        setSelectedCulture(null)
        setTargetSample(target)

        const distanceMap = new Map(topMatches.map((item) => [item.id, item.distance]))
        const mergedData = initialData.map((originalSample: any) => {
            if (distanceMap.has(originalSample.id)) {
                return { ...originalSample, distance: distanceMap.get(originalSample.id) }
            }
            return { ...originalSample, distance: DISTANCE_NO_MATCH }
        })

        setMapData(mergedData)
        setMapMode('distance')
    }

    const resetData = () => {
        setMapData(initialData)
        setTargetSample(null)
        setSelectedCulture(null)
        setMapMode('neutral')
    }

    return {
        geojsonData,
        handleCalculateDists,
        resetData,
        mapData,
        isLoading,
        error: error?.message ?? null,
        samples: initialData,
    }
}
