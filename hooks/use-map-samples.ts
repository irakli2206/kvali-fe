import { useQuery } from '@tanstack/react-query'
import { getMapSamples } from '@/lib/api/samples'

export function useMapSamples() {
    return useQuery({
        queryKey: ['mapSamples'],
        queryFn: async () => {
            const result = await getMapSamples()
            if (result.error) throw new Error(result.error)
            return result.data ?? []
        },
        staleTime: 1000 * 60 * 60 * 2, // 2h
        gcTime: 1000 * 60 * 60 * 24, // 24h
    })
}
