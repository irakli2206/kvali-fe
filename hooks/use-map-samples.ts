import { useQuery } from '@tanstack/react-query'
import { getMapSamples } from '@/lib/api/samples'

const STATIC_URL = '/data/map-samples.json'

export function useMapSamples() {
    return useQuery({
        queryKey: ['mapSamples'],
        queryFn: async () => {
            // Try static file first (present when built with Option A; 404 in dev without export)
            const res = await fetch(STATIC_URL)
            if (res.ok) return res.json()
            const result = await getMapSamples()
            if (result.error) throw new Error(result.error)
            return result.data ?? []
        },
        staleTime: 1000 * 60 * 60 * 24, // 24h
        gcTime: 1000 * 60 * 60 * 24,
    })
}
