import React, { useState } from 'react';
import { useMapStore } from '@/store/use-map-store';
import { Card } from '@/components/ui/card';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sample } from '@/types';
import { cn } from '@/lib/utils'; // Assuming you have a cn utility for classes
import { Map } from 'mapbox-gl';

interface DistanceLegendProps {
  mapRef: React.RefObject<Map | null>
  mapData: Array<Sample & { distance: number }>;
}

export function DistanceLegend({ mapRef, mapData }: DistanceLegendProps) {
  const { mapMode, targetSample, setMapMode, setTargetSample, setSelectedSample } = useMapStore();
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  if (mapMode !== 'distance' || !targetSample) return null;

  console.log('mapData', mapData)
  const topMatches = [...mapData]
    .filter(s => s['id'] !== targetSample['id'] && s.distance !== undefined)
    .sort((a, b) => (a.distance) - (b.distance))
    .slice(0, 10);

  const handleMouseEnter = (id: string) => {
    setHoveredId(id);
    const map = mapRef?.current;

    // 1. Check if map exists
    // 2. Check if the 'samples-source' actually exists in the current style
    if (map && map.getSource('samples-source')) {
      map.setFeatureState(
        { source: 'samples-source', id: id },
        { hover: true }
      );
    }
  };

  const handleMouseLeave = (id: string) => {
    setHoveredId(null);
    const map = mapRef?.current;

    if (map && map.getSource('samples-source')) {
      map.setFeatureState(
        { source: 'samples-source', id: id },
        { hover: false }
      );
    }
  };

  const handleJumpTo = (sample: Sample) => {
    // Use optional chaining to safely check if mapRef exists, then if current exists
    const map = mapRef?.current;

    if (map && sample.Longitude && sample.Latitude) {
      map.flyTo({
        center: [Number(sample.Longitude), Number(sample.Latitude)],
        zoom: 7,
        speed: 1.2,
        curve: 1.1,
        essential: true
      });
      setSelectedSample(sample)
    } else {
      console.warn("Map reference not found or coordinates missing", { mapRef, sample });
    }
  };

  return (
    <Card className="absolute top-2 left-2 p-3 w-64 bg-white rounded-md border shadow-none animate-in slide-in-from-right-5 flex flex-col gap-3">
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-muted-foreground">
            Genetic Distance
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="h-4 w-4 text-stone-400 hover:text-stone-600"
            onClick={() => { setMapMode('neutral'); setTargetSample(null); }}
          >
            <X size={12} />
          </Button>
        </div>

        <div className="text-[11px] font-medium text-stone-800 truncate px-2 border-l-2 border-blue-950">
          Ref: {targetSample.Simplified_Culture} ({targetSample['Object-ID']})
        </div>

        <div className="mt-3">
          <div className="h-1.5 w-full rounded-full bg-gradient-to-r from-[#172554] via-[#3b82f6] to-[#dbeafe]" />
          <div className="flex justify-between text-[9px] font-mono text-stone-500 mt-1">
            <span>0.00</span>
            <span>0.05</span>
            <span>0.10+</span>
          </div>
        </div>
      </div>

      {topMatches.length > 0 && (
        <div className="space-y-2 pt-2 border-t border-stone-100">
          <span className="text-[10px] font-semibold text-muted-foreground ">
            Closest Matches
          </span>
          <div className="flex flex-col gap-1.5">
            {topMatches.map((sample) => {
              console.log('sample', sample)
              const itemId = sample['id'];
              const isSelected = hoveredId === itemId;
              const isDimmed = hoveredId !== null && !isSelected;

              return (
                <div
                  key={itemId}
                  onMouseEnter={() => handleMouseEnter(itemId as string)}
                  onMouseLeave={() => handleMouseLeave(itemId as string)}
                  onClick={() => handleJumpTo(sample)}
                  className={cn(
                    "flex items-center justify-between text-[10px] cursor-pointer transition-all duration-200 ease-in-out",
                    isDimmed ? "opacity-30 scale-[0.98]" : "opacity-100 scale-100"
                  )}
                >
                  <div className="flex items-center gap-2 truncate">
                    <div className={cn(
                      "shrink-0 w-1.5 h-1.5 mx-1 rounded-full transition-colors",
                      isSelected ? "bg-blue-600 scale-125" : "bg-[#172554]"
                    )} />
                    <span className={cn(
                      "truncate font-medium  transition-colors",
                      isSelected ? "text-blue-600" : "text-stone-700"
                    )}>
                      {`${sample.Simplified_Culture} (${sample['Object-ID']})`}
                    </span>
                  </div>
                  <span className={cn(
                    "font-mono font-bold px-1 rounded transition-colors",
                    isSelected ? "bg-blue-600 text-white" : "text-blue-600 bg-blue-50"
                  )}>
                    {sample.distance?.toFixed(4)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="pt-1">
        <p className="text-[9px] leading-tight text-stone-400 italic">
          Lower values indicate closer genetic proximity to the target.
        </p>
      </div>
    </Card>
  );
}