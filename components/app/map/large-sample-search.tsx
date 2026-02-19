"use client"

import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"
import { Virtuoso } from "react-virtuoso"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { useMapStore } from "@/store/use-map-store"
import { getSampleDetails } from "@/lib/api/samples"
import { MapSample } from "@/types"

export function LargeSampleSearch({ samples = [] }: { samples: MapSample[] }) {
    const [open, setOpen] = React.useState(false)
    const [search, setSearch] = React.useState("")

    const { selectedSample, setSelectedSample } = useMapStore((state) => state)

    const filteredSamples = React.useMemo(() => {
        if (!samples || !Array.isArray(samples)) return []
        if (!search) return samples

        const s = search.toLowerCase()
        return samples.filter(item =>
            item.object_id?.toLowerCase().includes(s) ||
            item.culture?.toLowerCase().includes(s)
        )
    }, [search, samples])

    if (!samples) {
        return <Button variant="outline" className="w-[300px]" disabled>Loading samples...</Button>
    }

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    className="w-[300px] justify-between font-normal "
                >
                    {selectedSample ? selectedSample.object_id : <span className="text-muted-foreground">Select genetic sample</span> }
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[300px] p-0 shadow-2xl">
                <Command shouldFilter={false}>
                    <CommandInput
                        placeholder="Search ID or culture..."
                        value={search}
                        onValueChange={setSearch}
                    />
                    <CommandList className="max-h-none">
                        {(filteredSamples?.length ?? 0) === 0 && (
                            <CommandEmpty>No samples found.</CommandEmpty>
                        )}
                        <CommandGroup>
                            <Virtuoso
                                style={{ height: "400px" }}
                                data={filteredSamples}
                                itemContent={(index, sample) => (
                                    <CommandItem
                                        key={sample.id}
                                        value={sample.id}
                                        onSelect={async (currentValue) => {
                                            const sampleData = await getSampleDetails(currentValue)
                                            setSelectedSample(sampleData.data)
                                            setOpen(false)
                                        }}
                                        className="flex flex-col items-start py-3"
                                    >
                                        <span className="font-medium text-sm">{sample.object_id}</span>
                                        <span className="text-[10px] text-zinc-500 uppercase">
                                            {sample.culture}
                                        </span>
                                    </CommandItem>
                                )}
                            />
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    )
}
