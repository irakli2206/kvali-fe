import { MapMode, Sample } from '@/types';
import { create } from 'zustand'

// Define the shape of your Sample based on your CSV keys


interface MapState {
    selectedSample: Sample | null;
    setSelectedSample: (sample: Sample | null) => void;
    targetSample: Sample | null;
    setTargetSample: (sample: Sample | null) => void;
    mapMode: MapMode;
    setMapMode: (mapMode: MapMode) => void;
    timeWindow: [number, number]
    setTimeWindow: (timeWindow: [number, number]) => void
    selectedYDNA: string[],
    setSelectedYDNA: (groups: string[]) => void,
    selectedCulture: string | null
    setSelectedCulture: (culture: string | null) => void
}

export const useMapStore = create<MapState>((set) => ({
    selectedSample: null,
    setSelectedSample: (sample) => set({ selectedSample: sample }),
    targetSample: null,
    setTargetSample: (sample) => set({ targetSample: sample }),
    mapMode: 'neutral',
    setMapMode: (mapMode) => set({ mapMode: mapMode }),
    timeWindow: [-50000, 2000],
    setTimeWindow: (timeWindow) => set({ timeWindow: timeWindow }),
    selectedYDNA: [],
    setSelectedYDNA: (ydna) => set({ selectedYDNA: ydna }),
    selectedCulture: null,
    setSelectedCulture: (culture) => set({ selectedCulture: culture })
}))