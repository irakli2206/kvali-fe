import { useState, useEffect, useCallback } from "react";
import { useMutation } from "@tanstack/react-query";

const STORAGE_KEY = "kvali-user-dna";

type StoredDNA = {
    g25String: string;
    k36Results?: Record<string, number>;
    storedAt: number;
};

export type UploadStep = 'idle' | 'reading' | 'uploading' | 'processing' | 'done';

const STEP_LABELS: Record<UploadStep, string> = {
    idle: '',
    reading: 'Reading file…',
    uploading: 'Uploading to engine…',
    processing: 'Computing G25 coordinates…',
    done: 'Done!',
};

const STEP_PROGRESS: Record<UploadStep, number> = {
    idle: 0,
    reading: 10,
    uploading: 30,
    processing: 65,
    done: 100,
};

type UploadResult = {
    g25String: string;
    k36Results: Record<string, number> | null;
};

function loadStoredDNA(): StoredDNA | null {
    if (typeof window === "undefined") return null;
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw) as StoredDNA;
        if (!parsed.g25String) return null;
        return parsed;
    } catch {
        return null;
    }
}

function saveStoredDNA(data: StoredDNA) {
    if (typeof window === "undefined") return;
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
        console.warn("Failed to save DNA to localStorage:", e);
    }
}

function clearStoredDNA() {
    if (typeof window === "undefined") return;
    try {
        localStorage.removeItem(STORAGE_KEY);
    } catch {
        // noop
    }
}

export function useUploadPipeline() {
    const [step, setStep] = useState<UploadStep>('idle');
    const [stored, setStored] = useState<UploadResult | null>(null);

    useEffect(() => {
        const data = loadStoredDNA();
        if (data) {
            setStored({ g25String: data.g25String, k36Results: data.k36Results ?? null });
            setStep('done');
        }
    }, []);

    const mutation = useMutation<UploadResult, Error, File>({
        onMutate: () => {
            setStored(null);
        },
        mutationFn: async (file) => {
            setStep('reading');

            const formData = new FormData();
            formData.append('file', file);

            setStep('uploading');

            const response = await fetch('http://127.0.0.1:8000/raw-to-g25', {
                method: 'POST',
                body: formData,
            });

            setStep('processing');

            const data = await response.json();

            if (data.status !== "success") {
                throw new Error(data.error ?? "G25 conversion failed");
            }

            return {
                g25String: data.vahaduo_format as string,
                k36Results: (data.k36_results as Record<string, number>) ?? null,
            };
        },
        onSuccess: (result) => {
            setStep('done');
            setStored(result);
            saveStoredDNA({
                g25String: result.g25String,
                k36Results: result.k36Results ?? undefined,
                storedAt: Date.now(),
            });
        },
        onError: () => {
            setStep('idle');
        },
    });

    const upload = useCallback((file: File) => mutation.mutate(file), [mutation]);

    const reset = useCallback(() => {
        clearStoredDNA();
        mutation.reset();
        setStored(null);
        setStep('idle');
    }, [mutation]);

    const g25String = stored?.g25String ?? mutation.data?.g25String ?? null;
    const k36Results = stored?.k36Results ?? mutation.data?.k36Results ?? null;

    return {
        loading: mutation.isPending,
        step,
        stepLabel: STEP_LABELS[step],
        stepProgress: STEP_PROGRESS[step],
        error: mutation.error?.message ?? null,
        g25String,
        k36Results,
        upload,
        reset,
    };
}

export { loadStoredDNA, clearStoredDNA };
