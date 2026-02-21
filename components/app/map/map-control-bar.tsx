"use client"

import { AnimatePresence, motion } from 'motion/react'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { formatYear } from '@/lib/utils'
import { useMapStore } from '@/store/use-map-store'
import { MapMode, MapTheme, SampleFilter } from '@/types'
import { Map, RotateCcw, Share2 } from 'lucide-react'
import { buildShareMapParams, shareMapParamsToQuery } from '@/lib/share-map-url'
import { toast } from 'sonner'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { YDNAFilter } from './ydna-filter'
import { cn } from '@/lib/utils'

const SAMPLE_OPTIONS: { value: SampleFilter; label: string }[] = [
    { value: 'ancient', label: 'Ancient' },
    { value: 'modern', label: 'Modern' },
    { value: 'all', label: 'Both' },
]

const THEME_OPTIONS: { value: MapTheme; label: string }[] = [
    { value: 'Light-V11', label: 'Light' },
    { value: 'Dark-V11', label: 'Dark' },
    { value: 'Standard', label: 'Standard' },
]

interface MapControlBarProps {
    /** Called when Reset or Neutral is selected. If not provided, uses store resetData. */
    onReset?: () => void
}

export function MapControlBar({ onReset }: MapControlBarProps) {
    const {
        sampleFilter,
        setSampleFilter,
        timeWindow,
        setTimeWindow,
        mapMode,
        setMapMode,
        activeTheme,
        setActiveTheme,
        resetData,
        selectedSample,
        targetSample,
        mapCenter,
        mapZoom,
    } = useMapStore()

    const handleReset = () => (onReset ?? resetData)()

    const handleShare = async () => {
        const params = buildShareMapParams({
            timeWindow,
            sampleFilter,
            mapMode,
            selectedYDNA: useMapStore.getState().selectedYDNA,
            selectedSampleId: selectedSample?.id ?? null,
            targetSampleId: targetSample?.id ?? null,
            mapCenter,
            mapZoom,
        })
        const query = shareMapParamsToQuery(params)
        const url = typeof window !== 'undefined' ? `${window.location.origin}/app${query}` : ''
        try {
            await navigator.clipboard.writeText(url)
            toast.success('Link copied to clipboard')
        } catch {
            toast.error('Could not copy link')
        }
    }

    const showTimeSlider = sampleFilter !== 'modern'

    const handleModeChange = (v: string) => {
        if (v === 'neutral') {
            handleReset()
        } else {
            setMapMode(v as MapMode)
        }
    }

    return (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex flex-col gap-2  ">
            {/* Y-DNA haplogroup filter row when Y-DNA mode is active */}
            <AnimatePresence initial={false}>
                {mapMode === 'ydna' && (
                    <motion.div
                        key="ydna-row"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        transition={{ duration: 0.2, ease: 'easeOut' }}
                        className={cn(
                            'flex items-center px-4 py-2 rounded-lg border shadow-sm',
                            'bg-background/90 backdrop-blur-sm'
                        )}
                    >
                        <span className="text-xs text-muted-foreground mr-2 shrink-0">Haplogroups:</span>
                        <YDNAFilter />
                    </motion.div>
                )}
            </AnimatePresence>


            <div
                className={cn(
                    'flex flex-col gap-3 px-4 py-2.5 rounded-lg border shadow-xs',
                    'bg-background/80 backdrop-blur-sm',
                    'sm:flex-row sm:flex-nowrap sm:items-center sm:gap-3'
                )}
            >
                {/* Sample type: Ancient | Modern | Both */}
                <div className="flex rounded-sm border bg-muted/50 p-0.5 w-fit" role="group" aria-label="Sample type">
                    {SAMPLE_OPTIONS.map((opt) => (
                        <button
                            key={opt.value}
                            type="button"
                            onClick={() => setSampleFilter(opt.value)}
                            className={cn(
                                'px-3 py-1.5 text-xs font-medium rounded transition-colors',
                                sampleFilter === opt.value
                                    ? 'bg-background text-foreground shadow-sm'
                                    : 'text-muted-foreground hover:text-foreground'
                            )}
                        >
                            {opt.label}
                        </button>
                    ))}
                </div>

                {/* Time slider (hidden when Modern) — full width on small screens, fixed width on sm+ */}
                {showTimeSlider && (
                    <div className="flex flex-col gap-1.5 lg:w-sm sm:shrink-0">
                        <span className="text-xs text-muted-foreground">Time range</span>
                        <Slider
                            value={timeWindow}
                            onValueChange={(v) => setTimeWindow(v as [number, number])}
                            min={-50000}
                            max={2000}
                            step={500}
                            className="w-full [&_[data-slot=slider-thumb]]:size-3 [&_[data-slot=slider-track]]:h-1.5"
                        />
                        <span className="text-xs text-muted-foreground tabular-nums whitespace-nowrap">
                            {formatYear(timeWindow[0])} — {formatYear(timeWindow[1])}
                        </span>
                    </div>
                )}

                {/* Spacer only in row layout so right group stays right */}
                <div className="hidden flex-1 min-w-0 sm:block" aria-hidden />

                {/* Right group: mode, theme, reset */}
                <div className="flex items-center justify-end gap-2 shrink-0 sm:justify-start">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="gap-1.5 ">
                                {mapMode === 'ydna' ? 'Y-DNA' : 'Neutral'}
                                <span className="opacity-60">▾</span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-36">
                            <DropdownMenuLabel>Map mode</DropdownMenuLabel>
                            <DropdownMenuRadioGroup defaultValue={'neutral'} value={mapMode} onValueChange={handleModeChange}>
                                <DropdownMenuRadioItem value="neutral">Neutral</DropdownMenuRadioItem>
                                <DropdownMenuRadioItem value="ydna">Y-DNA</DropdownMenuRadioItem>
                            </DropdownMenuRadioGroup>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <TooltipProvider delayDuration={300}>
                        <Tooltip>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <TooltipTrigger asChild>
                                        <Button variant="outline" size="icon" className="shrink-0" aria-label="Map theme">
                                            <Map className="h-4 w-4" />
                                        </Button>
                                    </TooltipTrigger>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-36">
                                    <DropdownMenuLabel>Map theme</DropdownMenuLabel>
                                    <DropdownMenuRadioGroup value={activeTheme} onValueChange={(v) => setActiveTheme(v as MapTheme)}>
                                        {THEME_OPTIONS.map((opt) => (
                                            <DropdownMenuRadioItem key={opt.value} value={opt.value}>
                                                {opt.label}
                                            </DropdownMenuRadioItem>
                                        ))}
                                    </DropdownMenuRadioGroup>
                                </DropdownMenuContent>
                            </DropdownMenu>
                            <TooltipContent side="top" sideOffset={6}>Map theme</TooltipContent>
                        </Tooltip>

                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="shrink-0"
                                    aria-label="Share this view"
                                    onClick={handleShare}
                                >
                                    <Share2 className="h-4 w-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent side="top" sideOffset={6}>Share this view</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="shrink-0"
                                    aria-label="Reset map"
                                    onClick={handleReset}
                                >
                                    <RotateCcw className="h-4 w-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent side="top" sideOffset={6}>Reset map</TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </div>
            </div>


        </div>
    )
}
