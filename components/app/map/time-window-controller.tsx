import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { formatYear } from '@/lib/utils'
import { useMapStore } from '@/store/use-map-store'
import React from 'react'

const TimeWindowController = () => {
    const { timeWindow, setTimeWindow } = useMapStore((state) => state)


    return (
        <div className="mx-auto grid w-full max-w-3xl bg-white border px-4 py-2 rounded-sm gap-3">
            <div className="flex items-center justify-between gap-2">
                <Label htmlFor="slider-demo-temperature">Time Range</Label>
                <span className="text-muted-foreground text-sm">
                    {formatYear(timeWindow[0])} — {formatYear(timeWindow[1])}
                </span>
            </div>
            <Slider
                id="slider-demo-temperature"
                value={timeWindow}
                onValueChange={setTimeWindow}
                min={-50000}
                max={2000}
                step={500}
            />
        </div>
    )
}

export default TimeWindowController