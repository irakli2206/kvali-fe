import { Skeleton } from "@/components/ui/skeleton"
import { getSampleDetails } from "@/lib/api/samples"
import { Sample } from "@/types"
import { useQuery } from "@tanstack/react-query"
import { X, Clock, ClockFading, Dna, Grid2X2X, VenusAndMars, LucideIcon } from "lucide-react"
import CoverageBadge from "@/components/shared/coverage-badge"
import { Button } from "@/components/ui/button"
import { ReactNode } from "react"
import { formatYear } from "@/lib/utils"

const PopupSkeleton = () => (
    <div className="w-md rounded-md min-h-[300px] bg-white border p-4 space-y-4">
        <div className="space-y-2">
            <Skeleton className="h-6 w-[200px]" />
            <Skeleton className="h-4 w-[150px]" />
        </div>
        <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex gap-2">
                    <Skeleton className="h-4 w-4 rounded-full" />
                    <Skeleton className="h-4 flex-1" />
                </div>
            ))}
        </div>
        <Skeleton className="h-10 w-full mt-4" />
    </div>
)

export default function MapPopup({ sample, handleCalculateDists, onClose }: { sample: Sample, handleCalculateDists: (sample: Sample) => void, onClose: () => void }) {
    const { data, isLoading } = useQuery({
        queryKey: ['sample', sample.id],
        queryFn: () => getSampleDetails(sample.id).then(res => res.data),
        staleTime: 1000 * 60 * 5,
    })

    if (isLoading) return <PopupSkeleton />
    if (!data) return null

    const content = getPopupContent(data)

    return (
        <div className="w-md min-h-[300px] bg-white border rounded-md drop-shadow-xs flex flex-col">
            <header className='flex w-full p-1 items-center justify-between border-b'>
                <Button variant="ghost" size="icon-sm" onClick={onClose}>
                    <X className='' />
                </Button>
            </header>

            <main className="flex flex-col p-4 gap-4">
                <div className="">
                    <h6 className="font-medium text-lg">{data.culture} ({data.object_id})</h6>
                    <span className='text-muted-foreground'>{[data.location, data.country].filter(Boolean).join(', ') || 'Unknown location'}</span>
                </div>
                <dl className='flex flex-col gap-1'>
                    {content.map(r => <MapPopupRow key={r.label} {...r} />)}
                </dl>

                <aside className="flex flex-col gap-2">
                    {data.source &&
                        <div className='px-3 py-2 bg-muted rounded-sm'>
                            <p className='mb-0'>Publication</p>
                            <p className="text-muted-foreground text-xs">{data.source}</p>
                        </div>
                    }
                </aside>
            </main>

            <footer className="flex flex-col gap-2 p-4 pt-0">
                <Button variant='default' onClick={() => handleCalculateDists(data)}>Calculate Distances</Button>
            </footer>
        </div>
    );
}

function bpToCEString(bp: string | null): string {
    if (!bp) return 'Unknown'
    const num = parseFloat(String(bp).replace(',', '.'))
    if (isNaN(num)) return 'Unknown'
    const ce = Math.round(1950 - num)
    return formatYear(ce)
}

const getPopupContent = (data: Sample) => {
    return [
        {
            icon: Clock,
            label: 'Date',
            value: bpToCEString(data.mean_bp)
        },
        {
            icon: ClockFading,
            label: 'Dating Method',
            value: data.date_method
        },
        {
            icon: VenusAndMars,
            label: 'Sex',
            value: data.sex
        },
        {
            icon: Dna,
            label: 'Y-DNA',
            value: data.y_haplo ?? null
        },
        {
            icon: Dna,
            label: 'mtDNA',
            value: data.mt_haplo ?? null
        },
        {
            icon: Grid2X2X,
            label: 'SNPs (1240K)',
            value: data.snps_1240k ? (
                <CoverageBadge coverage={String(data.snps_1240k)} />
            ) : null
        },
    ]
}

type MapPopupRowProps = {
    icon: LucideIcon
    label: string
    value: ReactNode | string
}

const MapPopupRow = ({ icon: Icon, label, value }: MapPopupRowProps) => {
    const displayValue = (value === null || value === undefined || value === "")
        ? <span className="text-muted-foreground/50 italic">N/A</span>
        : value;

    return (
        <div className='flex items-start gap-2'>
            <dt className="flex-1 flex gap-2 items-center text-muted-foreground">
                <Icon className="w-3 h-3 text-zinc-400 stroke-[2.5px]" />
                <span className="font-medium">{label}</span>
            </dt>
            <dd className="flex-1">
                {displayValue}
            </dd>
        </div>
    )
}
