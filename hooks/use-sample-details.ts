// hooks/use-sample-details.ts
import { useQuery } from '@tanstack/react-query'
import { getSampleDetails } from '@/lib/api/samples'

export function useSampleDetails(sampleId: string) {
    return useQuery({
        queryKey: ['sample', sampleId],
        queryFn: async () => {
            const { data, error } = await getSampleDetails(sampleId)
            if (error) throw error
            return data
        },
        staleTime: 1000 * 60 * 10, // 10 min
        gcTime: 1000 * 60 * 30, // 30 min
    })
}