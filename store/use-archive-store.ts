import { Sample } from '@/types';
import { create } from 'zustand'

// Define the shape of your Sample based on your CSV keys


interface ArchiveState {
    selectedSample: Sample | null;
    setSelectedSample: (sample: Sample | null) => void;
}

export const useArchiveStore = create<ArchiveState>((set) => ({
    selectedSample: null,
    setSelectedSample: (sample) => set({ selectedSample: sample }),
}))