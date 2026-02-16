import { Skeleton } from "@/components/ui/skeleton"
import { getSampleDetails } from "@/lib/api/samples"
import { Sample } from "@/types"
import { useQuery } from "@tanstack/react-query"
import { X, Star, Clock, ClockFading, Dna, Grid2X2X, Link, VenusAndMars, LucideIcon } from "lucide-react"
import CoverageBadge from "@/components/shared/coverage-badge"
import { Button } from "@/components/ui/button"
import { ReactNode } from "react"
import { formatYear } from "@/lib/utils"

const PopupSkeleton = () => (
    <div className="w-md rounded-md min-h-[300px] bg-white border p-4 space-y-4">
        <div className="space-y-2">
            <Skeleton className="h-6 w-[200px]" /> {/* Title */}
            <Skeleton className="h-4 w-[150px]" /> {/* Location */}
        </div>
        <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex gap-2">
                    <Skeleton className="h-4 w-4 rounded-full" />
                    <Skeleton className="h-4 flex-1" />
                </div>
            ))}
        </div>
        <Skeleton className="h-10 w-full mt-4" /> {/* Button */}
    </div>
)

// --- Sub-Component: Popup ---
export default function MapPopup({ sample, handleCalculateDists, onClose }: { sample: Sample, handleCalculateDists: (sample: Sample) => void, onClose: () => void }) {
    // isLoading and data are managed for you
    const { data, isLoading } = useQuery({
        queryKey: ['sample', sample.id],
        queryFn: () => getSampleDetails(sample.id).then(res => res.data),
        // This prevents the UI from flickering if you click the same dot twice
        staleTime: 1000 * 60 * 5,
    })

    if (isLoading) return <PopupSkeleton />
    if (!data) return null


    if (!data) return <></>

    const dateNum = Number(data.Mean)
    const parsedDate = dateNum > 0 ? `${Math.abs(dateNum)} CE` : `${Math.abs(dateNum)} BCE`
    const content = getPopupContent(data)

    return (
        <div className="w-md min-h-[300px] bg-white border rounded-md drop-shadow-xs flex flex-col">
            <header className='flex w-full   p-1 items-center justify-between border-b'>
                <Button variant="ghost" size="icon-sm" onClick={onClose}>
                    <X className='' />
                </Button>
                <div className="flex ">
                    <Button variant="ghost" size="icon-sm">
                        <Star className='w-4' />
                    </Button>
                </div>
            </header>

            <main className="flex flex-col p-4 gap-4">
                <div className="">
                    <h6 className="font-medium text-lg">{data['Simplified_Culture']} ({data['Object-ID']})</h6>
                    <span className='text-muted-foreground'>{data.Location}, {data.Country}</span>
                </div>
                <dl className='flex flex-col gap-1'>
                    {
                        content.map(r => <MapPopupRow key={r.label} {...r} />)
                    }
                </dl>

                <aside className="flex flex-col gap-2 ">
                    {data['Kinship-Notes'] &&
                        <div className='px-3 py-2 bg-muted rounded-sm'>
                            <p className='mb-0 '>Additional Information</p>
                            <p className="text-muted-foreground text-xs">{data['Kinship-Notes']}</p>
                        </div>
                    }
                </aside>
            </main>

            <footer className="flex flex-col gap-2 p-4 pt-0">
                <Button variant='secondary' onClick={() => handleCalculateDists(data)} >Calculate Distances</Button>
            </footer>

        </div>
    );
}





const getPopupContent = (data: Sample) => {
    const dateNum = data.Mean
    const parsedDate = formatYear(dateNum)

    return [
        {
            icon: Clock,
            label: 'Date',
            value: parsedDate
        },
        {
            icon: ClockFading,
            label: 'Dating Method',
            value: data['Method-Date']
        },
        {
            icon: VenusAndMars,
            label: 'Sex',
            value: data.Sex
        },
        {
            icon: Dna,
            label: 'Y-DNA',
            // If data.YFull is missing, value becomes null, triggering N/A
            value: data.YFull ? (
                <a href={data['Y-YFull'] as string} target='_blank' className='flex items-center gap-1 text-blue-500 hover:underline'>
                    {data.YFull} <Link className='w-2.5' />
                </a>
            ) : null
        },
        {
            icon: Dna,
            label: 'mtDNA',
            value: data.mtree ? (
                <a href={data['mt-YFull'] as string} target='_blank' className='flex items-center gap-1 text-blue-500 hover:underline'>
                    {data.mtree} <Link className='w-2.5' />
                </a>
            ) : null
        },
        {
            icon: Grid2X2X,
            label: 'Autosomal Coverage',
            // Ensure coverage isn't an empty string/null
            value: data['Autosomal-Coverage'] ? (
                <CoverageBadge coverage={data['Autosomal-Coverage']} />
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
    // Determine if the value is truly empty
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

