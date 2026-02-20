import { useState, useEffect, useCallback } from "react";
import { useMutation } from "@tanstack/react-query";
import { KVALI_ENGINE_URL } from "@/lib/constants";

const STORAGE_KEY = "kvali-user-dna";

/** DNA file vendor / source. Backend expects these exact values. */
export const DNA_VENDORS = [
    "23andme",
    "ancestry",
    "ftdna",
    "ftdna2",
    "wegene",
    "myheritage",
] as const;

export type DNAVendor = (typeof DNA_VENDORS)[number];

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

    const mutation = useMutation<UploadResult, Error, { file: File; vendor: DNAVendor }>({
        onMutate: () => {
            setStored(null);
        },
        mutationFn: async ({ file, vendor }) => {
            setStep('reading');

            const formData = new FormData();
            formData.append('file', file);
            formData.append('vendor', vendor);

            setStep('uploading');

            // Render free tier cold start can take 50–90s; use long timeout and retry once on 504/timeout
            const REQUEST_TIMEOUT_MS = 120_000;
            const tryFetch = async (): Promise<Response> => {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
                try {
                    return await fetch(`${KVALI_ENGINE_URL}/raw-to-g25`, {
                        method: 'POST',
                        body: formData,
                        signal: controller.signal,
                    });
                } finally {
                    clearTimeout(timeoutId);
                }
            };

            let response: Response;
            try {
                response = await tryFetch();
                if (response.status === 504) {
                    await new Promise((r) => setTimeout(r, 2000));
                    response = await tryFetch();
                }
            } catch (e) {
                const isTimeout = (e as Error)?.name === 'AbortError';
                if (isTimeout) {
                    await new Promise((r) => setTimeout(r, 2000));
                    response = await tryFetch();
                } else {
                    throw e;
                }
            }

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

    const upload = useCallback(
        (file: File, vendor: DNAVendor) => mutation.mutate({ file, vendor }),
        [mutation]
    );

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
