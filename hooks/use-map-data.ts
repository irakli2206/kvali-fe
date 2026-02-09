import { useMemo, useState } from 'react';
import { FeatureCollection, Geometry, GeoJsonProperties } from 'geojson';
import { csvToGeoJSON, runComparisonLogic } from '@/lib/map-utils';
import { useMapStore } from '@/store/use-map-store';
import { Sample } from '@/types';

export function useMapData(initialData: any[]) {
    const [mapData, setMapData] = useState(initialData);
    const {
        timeWindow,
        mapMode,
        setMapMode,
        selectedYDNA,
        targetSample,
        setTargetSample
    } = useMapStore();

    const geojsonData = useMemo(() => {
        const baseGeoJSON = csvToGeoJSON(mapData);
        const [minYear, maxYear] = timeWindow || [-10000, 2026];

        const filteredFeatures = baseGeoJSON.features.filter(feature => {
            const props = feature.properties;
            if (!props) return false;

            const year = parseFloat(props.Mean);
            const isWithinTime = !isNaN(year) && year >= minYear && year <= maxYear;
            const isTarget = targetSample && props.id === targetSample.id;

            if (!isWithinTime && !isTarget) return false;

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

        return { ...baseGeoJSON, features: filteredFeatures } as FeatureCollection<Geometry, GeoJsonProperties>;
    }, [mapData, timeWindow, mapMode, selectedYDNA, targetSample]);

    const handleCalculateDists = (target: Sample) => {
        const updated = runComparisonLogic(target.id, mapData, target.g25_string!);
        setTargetSample(target);
        setMapData(updated);
        setMapMode('distance');
    };

    const resetData = () => {
        setMapData(initialData);
        setTargetSample(null);
        setMapMode('neutral');
    };

    return {
        geojsonData,
        handleCalculateDists,
        resetData,
        mapData // Exporting this in case you need raw counts elsewhere
    };
}