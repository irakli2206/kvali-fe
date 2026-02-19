import { Check, ChevronsUpDown, X } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { useState } from "react"
import { useMapStore } from "@/store/use-map-store"
import { YDNA_GROUP_COLORS } from "@/lib/map-utils"

const YDNA_OPTIONS = Object.keys(YDNA_GROUP_COLORS);

export function YDNAFilter() {
    const [open, setOpen] = useState(false);
    const { selectedYDNA, setSelectedYDNA } = useMapStore();

    const handleUnselect = (item: string) => {
        setSelectedYDNA(selectedYDNA.filter((i) => i !== item));
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                {/* We use a div here instead of a Button component to avoid nested buttons */}
                <div
                    role="combobox"
                    aria-expanded={open}
                    className={cn(
                        buttonVariants({ variant: "outline" }),
                        "w-[250px] justify-between   cursor-pointer px-3 py-2"
                    )}
                >
                    <div className="flex flex-wrap gap-1">
                        {selectedYDNA.length > 0 ? (
                            selectedYDNA.map((item) => (
                                <Badge key={item} variant="secondary" className="flex items-center gap-1">
                                    {item}
                                    <span
                                        role="button"
                                        tabIndex={0}
                                        className="ml-1 rounded-full outline-none hover:bg-zinc-200"
                                        onClick={(e) => {
                                            e.stopPropagation(); // Prevents the popover from opening/closing
                                            handleUnselect(item);
                                        }}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                e.stopPropagation();
                                                handleUnselect(item);
                                            }
                                        }}
                                    >
                                        <X className="h-3 w-3" />
                                    </span>
                                </Badge>
                            ))
                        ) : (
                            <span className="text-muted-foreground">Filter Haplogroups...</span>
                        )}
                    </div>
                    <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50 ml-2" />
                </div>
            </PopoverTrigger>

            <PopoverContent className="w-[250px] p-0" align="start">
                <Command>
                    <CommandInput placeholder="Search haplogroups..." />
                    <CommandEmpty>No haplogroup found.</CommandEmpty>
                    <CommandGroup className="max-h-64 overflow-auto">
                        {YDNA_OPTIONS.map((option) => (
                            <CommandItem
                                key={option}
                                onSelect={() => {
                                    setSelectedYDNA(
                                        selectedYDNA.includes(option)
                                            ? selectedYDNA.filter((i) => i !== option)
                                            : [...selectedYDNA, option]
                                    );
                                }}
                            >
                                <Check className={cn("mr-2 h-4 w-4", selectedYDNA.includes(option) ? "opacity-100" : "opacity-0")} />
                                <span
                                    className="mr-2 h-3 w-3 rounded-full shrink-0"
                                    style={{ backgroundColor: YDNA_GROUP_COLORS[option] }}
                                />
                                {option}
                            </CommandItem>
                        ))}
                    </CommandGroup>
                </Command>
            </PopoverContent>
        </Popover>
    );
}