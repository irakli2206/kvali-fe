import { useState, useEffect } from "react";

const STORAGE_KEY = "kvali-user-dna";

type StoredDNA = {
    g25String: string;
    k36Results?: Record<string, number>;
    storedAt: number;
};

type UploadState = {
    loading: boolean;
    error: string | null;
    k36Results: Record<string, number> | null;
    g25String: string | null;
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
    const [state, setState] = useState<UploadState>({
        loading: false,
        error: null,
        k36Results: null,
        g25String: null,
    });

    useEffect(() => {
        const stored = loadStoredDNA();
        if (stored) {
            setState((prev) => ({
                ...prev,
                g25String: stored.g25String,
                k36Results: stored.k36Results ?? null,
            }));
        }
    }, []);

    const upload = async (file: File) => {
        setState({ loading: true, error: null, k36Results: null, g25String: null });
        const formData = new FormData();
        formData.append('file', file);

        try {
            const g25response = await fetch('http://127.0.0.1:8000/raw-to-g25', {
                method: 'POST',
                body: formData,
            });

            const g25data = await g25response.json();

            if (g25data.status === "success") {
                const g25String = g25data.vahaduo_format;
                const k36Results = g25data.k36_results ?? null;
                setState((prev) => ({ ...prev, g25String, k36Results }));

                saveStoredDNA({
                    g25String,
                    k36Results: k36Results ?? undefined,
                    storedAt: Date.now(),
                });
            } else {
                setState((prev) => ({ ...prev, error: g25data.error ?? "G25 conversion failed" }));
            }
        } catch (error) {
            console.error("Kvali Engine connection error:", error);
            setState((prev) => ({
                ...prev,
                loading: false,
                error: error instanceof Error ? error.message : "Connection failed",
            }));
        } finally {
            setState((prev) => ({ ...prev, loading: false }));
        }
    };

    const reset = () => {
        clearStoredDNA();
        setState({ loading: false, error: null, k36Results: null, g25String: null });
    };

    return { ...state, upload, reset };
}

export { loadStoredDNA, clearStoredDNA };