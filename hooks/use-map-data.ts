import { useMemo, useState, useEffect } from 'react'
import { FeatureCollection, Geometry, GeoJsonProperties } from 'geojson'
import { csvToGeoJSON } from '@/lib/map-utils'
import { useMapStore } from '@/store/use-map-store'
import { Sample } from '@/types'
import { calculateDistances, calculateDistancesFromVector, getSampleDetails } from '@/lib/api/samples'
import { useMapSamples } from './use-map-samples'

const USER_SAMPLE: Partial<Sample> = {
    id: 'user',
    object_id: 'You',
    culture: 'Your DNA',
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
        setDemoSampleId,
        selectedCulture,
        setSelectedCulture,
        userG25Vector,
        setUserG25Vector,
        demoSampleId,
        sampleFilter,
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

            const bp = parseFloat(props.mean_bp)
            const isAncient = !isNaN(bp) && bp > 0
            if (sampleFilter === 'ancient' && !isAncient) return false
            if (sampleFilter === 'modern' && isAncient) return false

            const yearCE = isAncient ? 1950 - bp : NaN
            const isWithinTime = isNaN(yearCE) || (yearCE >= minYear && yearCE <= maxYear)
            if (!isWithinTime) return false

            if (mapMode === 'ydna') {
                const yHaplo = props.y_haplo
                const isValidY = yHaplo && !yHaplo.toLowerCase().startsWith('n/a') && !['null', 'unknown', '', 'None', '..'].includes(yHaplo)
                if (!isValidY) return false

                if (selectedYDNA?.length > 0) {
                    const group = yHaplo.slice(0, 2)
                    return selectedYDNA.includes(group)
                }
            }

            return true
        })

        return { ...baseGeoJSON, features: filteredFeatures } as FeatureCollection<Geometry, GeoJsonProperties>
    }, [mapData, timeWindow, mapMode, selectedYDNA, sampleFilter])

    useEffect(() => {
        if (!demoSampleId) return
        const id = demoSampleId
        setDemoSampleId(null)
        const run = async () => {
            const res = await getSampleDetails(id)
            if (!res.data) return
            setSelectedCulture(null)
            setTargetSample(res.data)
            const topMatches = await calculateDistances(res.data)
            const DISTANCE_NO_MATCH = 1000
            if (!topMatches?.length) return
            const visibleIds = new Set(
                geojsonData.features.map((f) => f.properties?.id).filter(Boolean) as string[]
            )
            const filteredMatches = topMatches.filter((m) => m.id && visibleIds.has(m.id))
            const distanceMap = new Map(filteredMatches.map((item) => [item.id!, item.distance!]))
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
    }, [demoSampleId])

    useEffect(() => {
        const vector = userG25Vector
        if (!vector?.length) return

        setUserG25Vector(null)

        const visibleIds = new Set(
            geojsonData.features.map((f) => f.properties?.id).filter(Boolean) as string[]
        )

        const run = async () => {
            const topMatches: Partial<Sample & { distance: number }>[] = await calculateDistancesFromVector(vector)
            const DISTANCE_NO_MATCH = 1000
            if (!topMatches) return

            setSelectedCulture(null)
            setTargetSample({ ...USER_SAMPLE, g25_string: vector.join(',') } as Sample)

            const filteredMatches = topMatches.filter((m) => m.id && visibleIds.has(m.id))
            const distanceMap = new Map(filteredMatches.map((item) => [item.id!, item.distance!]))
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
    }, [userG25Vector, setUserG25Vector, setSelectedCulture, setTargetSample, setMapMode, initialData, geojsonData])

    const handleCalculateDists = async (target: Sample) => {
        const topMatches: Partial<Sample & { distance: number }>[] = await calculateDistances(target)
        const DISTANCE_NO_MATCH = 1000
        if (!topMatches) return

        setSelectedCulture(null)
        setTargetSample(target)

        const visibleIds = new Set(
            geojsonData.features.map((f) => f.properties?.id).filter(Boolean) as string[]
        )
        const filteredMatches = topMatches.filter((m) => m.id && visibleIds.has(m.id))
        const distanceMap = new Map(filteredMatches.map((item) => [item.id!, item.distance!]))
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
