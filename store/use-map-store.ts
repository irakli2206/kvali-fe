import { Sample } from '@/types';
import { create } from 'zustand'

// Define the shape of your Sample based on your CSV keys


interface MapState {
    selectedSample: Sample | null;
    setSelectedSample: (sample: Sample | null) => void;
    targetSample: Sample | null;
    setTargetSample: (sample: Sample | null) => void;
}

export const useArchiveStore = create<MapState>((set) => ({
    selectedSample: null,
    setSelectedSample: (sample) => set({ selectedSample: sample }),
    targetSample: null,
    setTargetSample: (sample) => set({ targetSample: sample }),
}))