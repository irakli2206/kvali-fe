import { MapMode, MapTheme, Sample, SampleFilter } from '@/types';
import { create } from 'zustand'

interface MapState {
    selectedSample: Sample | null;
    setSelectedSample: (sample: Sample | null) => void;
    targetSample: Sample | null;
    setTargetSample: (sample: Sample | null) => void;
    /** Trigger distance calc with user's G25 vector. Set to run, then cleared by consumer. */
    userG25Vector: number[] | null;
    setUserG25Vector: (v: number[] | null) => void;
    /** Run distance for this sample id (e.g. on session restore). Cleared after run. */
    demoSampleId: string | null;
    setDemoSampleId: (id: string | null) => void;
    mapMode: MapMode;
    setMapMode: (mapMode: MapMode) => void
    timeWindow: [number, number]
    setTimeWindow: (timeWindow: [number, number]) => void
    selectedYDNA: string[]
    setSelectedYDNA: (groups: string[]) => void,
    selectedCulture: string | null
    setSelectedCulture: (culture: string | null) => void
    hoveredId: string | null
    setHoveredId: (id: string | null) => void
    sampleFilter: SampleFilter
    setSampleFilter: (filter: SampleFilter) => void
    activeTheme: MapTheme
    setActiveTheme: (theme: MapTheme) => void
    /** For share URL: map center [lng, lat] and zoom. Updated on map moveend. */
    mapCenter: [number, number] | null;
    mapZoom: number | null;
    setMapView: (center: [number, number], zoom: number) => void;
    /** Set by restore session; MapView flies here and then clears. */
    restorePendingView: { center: [number, number]; zoom: number } | null;
    setRestorePendingView: (v: { center: [number, number]; zoom: number } | null) => void;
    resetData: () => void
}

export const useMapStore = create<MapState>((set) => ({
    selectedSample: null,
    setSelectedSample: (sample) => set({ selectedSample: sample }),
    targetSample: null,
    setTargetSample: (sample) => set({ targetSample: sample }),
    userG25Vector: null,
    setUserG25Vector: (v) => set({ userG25Vector: v }),
    demoSampleId: null,
    setDemoSampleId: (id) => set({ demoSampleId: id }),
    mapMode: 'neutral',
    setMapMode: (mapMode) => set({ mapMode: mapMode }),
    timeWindow: [-50000, 2000],
    setTimeWindow: (timeWindow) => set({ timeWindow: timeWindow }),
    selectedYDNA: [],
    setSelectedYDNA: (ydna) => set({ selectedYDNA: ydna }),
    selectedCulture: null,
    setSelectedCulture: (culture) => set({ selectedCulture: culture }),
    hoveredId: null,
    setHoveredId: (id) => set({ hoveredId: id }),
    sampleFilter: 'ancient',
    setSampleFilter: (filter) => set({ sampleFilter: filter }),
    activeTheme: 'Light-V11',
    setActiveTheme: (theme) => set({ activeTheme: theme }),
    mapCenter: null,
    mapZoom: null,
    setMapView: (center, zoom) => set({ mapCenter: center, mapZoom: zoom }),
    restorePendingView: null,
    setRestorePendingView: (v) => set({ restorePendingView: v }),
    resetData: () => set({
        selectedSample: null,
        targetSample: null,
        demoSampleId: null,
        mapMode: 'neutral',
        timeWindow: [-50000, 2000],
        selectedYDNA: [],
        selectedCulture: null,
        hoveredId: null,
        sampleFilter: 'ancient',
        activeTheme: 'Light-V11',
        restorePendingView: null,
    })
}))