import { useMemo, useState, useEffect } from 'react'; // Added useEffect
import { FeatureCollection, Geometry, GeoJsonProperties } from 'geojson';
import { csvToGeoJSON } from '@/lib/map-utils';
import { useMapStore } from '@/store/use-map-store';
import { Sample } from '@/types';
import { calculateDistances } from '@/lib/api/samples';

export function useMapData(initialData: any[]) {
    const [mapData, setMapData] = useState(initialData);
    const {
        timeWindow,
        mapMode,
        setMapMode,
        selectedYDNA,
        targetSample,
        setTargetSample,
        selectedCulture,   // Pull this from store
        setSelectedCulture
    } = useMapStore();

    // Sync local state if initialData arrives late (e.g. from an async fetch)
    useEffect(() => {
        if (initialData?.length > 0) {
            setMapData(initialData);
        }
    }, [initialData]);

    // Kill distance mode if a culture is selected
    useEffect(() => {
        if (selectedCulture && mapMode === 'distance') {
            setMapMode('neutral');
            setTargetSample(null);
            setMapData(initialData);
        }
    }, [selectedCulture, setMapMode, setTargetSample, initialData]);

    const geojsonData = useMemo(() => {
        const baseGeoJSON = csvToGeoJSON(mapData);
        if (!baseGeoJSON.features.length) return baseGeoJSON;

        // Ensure we have numbers, not undefined/null
        const minYear = timeWindow?.[0] ?? -10000;
        const maxYear = timeWindow?.[1] ?? 2026;

        const filteredFeatures = baseGeoJSON.features.filter(feature => {
            const props = feature.properties;
            if (!props) return false;

            const year = parseFloat(props.Mean);

            // If the sample doesn't have a year, decide if you want to show it
            // Usually, we want to show it in 'neutral' mode anyway
            const isWithinTime = isNaN(year) || (year >= minYear && year <= maxYear);
            if (!isWithinTime) return false;

            // 3. Mode Specific Filters
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

        console.log(`Filtered from ${baseGeoJSON.features.length} to ${filteredFeatures.length} points`);
        return { ...baseGeoJSON, features: filteredFeatures } as FeatureCollection<Geometry, GeoJsonProperties>;
    }, [mapData, timeWindow, mapMode, selectedYDNA, targetSample]);

    const handleCalculateDists = async (target: Sample) => {
        // 1. Get the Top 200 from the DB (Fast! ~100-150ms)
        const topMatches: Partial<Sample & { distance: number }>[] = await calculateDistances(target);

        if (!topMatches) return;

        setSelectedCulture(null);
        setTargetSample(target);

        // 2. Create a Map of the distances for O(1) lookup
        const distanceMap = new Map(topMatches.map(item => [item.id, item.distance]));

        // 3. Merge: Keep all initialData, but add distance to the matches
        const mergedData = initialData.map(originalSample => {
            // If this sample is in our Top 200, give it the real distance
            if (distanceMap.has(originalSample.id)) {
                return {
                    ...originalSample,
                    distance: distanceMap.get(originalSample.id)
                };
            }
            // Otherwise, it stays in the dataset but gets 0 (or undefined)
            return {
                ...originalSample,
                distance: 10
            };
        });

        setMapData(mergedData);
        setMapMode('distance');
    };

    const resetData = () => {
        setMapData(initialData);
        setTargetSample(null);
        setSelectedCulture(null);
        setMapMode('neutral');
    };

    return {
        geojsonData,
        handleCalculateDists,
        resetData,
        mapData
    };
}