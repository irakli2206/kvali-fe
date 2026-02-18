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
import { getCultureBounds, getUniqueCultures } from "@/lib/map-utils"
import { MapSample } from "@/types"

export function CultureSearch({ samples = [] }: { samples: MapSample[] }) {
    const [open, setOpen] = React.useState(false)
    const [search, setSearch] = React.useState("")

    const { selectedSample, setSelectedSample, selectedCulture, setSelectedCulture } = useMapStore((state) => state)

    const cultureOptions = React.useMemo(() => {
        const uniqueCultures = getUniqueCultures(samples);

        // Returning objects makes it easier for Shadcn Command/Select components
        return uniqueCultures.map(culture => ({
            label: culture,
            value: culture.toLowerCase().replace(/\s+/g, '-'), // URL/ID friendly version
            original: culture
        }));
    }, [samples]);


    // 1. Guard against undefined samples during filtering
    const filteredSamples = React.useMemo(() => {
        if (!cultureOptions || !Array.isArray(cultureOptions)) return []
        if (!search) return cultureOptions

        const s = search.toLowerCase()
        return cultureOptions.filter(item => item.original.toLowerCase().includes(s))
    }, [search, cultureOptions])

    // 2. Early return if samples haven't loaded yet
    if (!cultureOptions) {
        return <Button variant="outline" className="w-[300px]" disabled>Loading samples...</Button>
    }

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    className="w-[300px] justify-between font-normal"
                >
                    {selectedCulture ? selectedCulture : <span className="text-muted-foreground">Select culture</span>}
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
                        {/* 3. Safety check on the length property */}
                        {(filteredSamples?.length ?? 0) === 0 && (
                            <CommandEmpty>No samples found.</CommandEmpty>
                        )}
                        <CommandGroup>
                            <Virtuoso
                                style={{ height: "400px" }}
                                data={filteredSamples}
                                itemContent={(index, sample) => (
                                    <CommandItem
                                        key={sample.value}
                                        value={sample.value}
                                        onSelect={(currentValue) => {
                                            const selectedObj = cultureOptions.find(c => c.value === currentValue);
                                            if (selectedObj) {
                                                // Just tell the store which culture was picked
                                                setSelectedCulture(selectedObj.original);
                                                // Clear the individual sample if one was selected
                                                setSelectedSample(null);
                                            }
                                            setOpen(false);
                                        }}
                                        className="flex flex-col items-start py-3"
                                    >
                                        <span className="font-medium text-sm">{sample.label}</span>

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