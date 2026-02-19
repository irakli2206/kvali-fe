import React from 'react';
import { useMapStore } from '@/store/use-map-store';
import { Card } from '@/components/ui/card';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sample } from '@/types';
import { cn } from '@/lib/utils';
import { Map } from 'mapbox-gl';

interface DistanceLegendProps {
  mapRef: React.RefObject<Map | null>
  mapData: Array<Sample & { distance: number }>;
}

const getDistanceBlue = (distance: number) => {
  if (distance === undefined) return '#d6d3d1'; 
  if (distance <= 0.02) return '#1d4ed8';
  if (distance <= 0.04) return '#1d4ed8';
  if (distance <= 0.06) return '#2563eb';
  if (distance <= 0.08) return '#3b82f6';
  if (distance <= 0.10) return '#93c5fd';
  return '#d6d3d1';
};

export function DistanceLegend({ mapRef, mapData }: DistanceLegendProps) {
  const { 
    mapMode, 
    targetSample, 
    setMapMode, 
    setTargetSample, 
    setSelectedSample,
    hoveredId,      
    setHoveredId    
  } = useMapStore();

  if (mapMode !== 'distance' || !targetSample) return null;

  const topMatches = [...mapData]
    .filter(s => s.id !== targetSample.id && s.distance !== undefined)
    .sort((a, b) => (a.distance) - (b.distance))
    .slice(0, 20);

  const handleMouseEnter = (id: string) => {
    setHoveredId(id);
  };

  const handleMouseLeave = () => {
    setHoveredId(null);
  };

  const handleJumpTo = (sample: Sample) => {
    const map = mapRef?.current;
    if (map && sample.longitude && sample.latitude) {
      map.flyTo({
        center: [Number(sample.longitude), Number(sample.latitude)],
        zoom: 7,
        speed: 1.2,
        essential: true
      });
      setSelectedSample(sample);
    }
  };

  return (
    <Card className="absolute max-h-full top-2 left-2 p-3 w-64 bg-white rounded-md border shadow-none animate-in slide-in-from-right-5 flex flex-col gap-3 z-10">
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-muted-foreground">
            Genetic Distance
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="h-4 w-4 text-stone-400 hover:text-stone-600"
            onClick={() => { 
              setMapMode('neutral'); 
              setTargetSample(null); 
              setHoveredId(null); 
            }}
          >
            <X size={12} />
          </Button>
        </div>

        <div className="text-[11px] font-medium text-stone-800 truncate px-2 border-l-2 border-blue-950">
          Ref: {targetSample.culture} ({targetSample.object_id})
        </div>

        <div className="mt-3">
          <div className="h-1.5 w-full rounded-full bg-gradient-to-r from-[#1d4ed8] via-[#3b82f6] to-[#dbeafe]" />
          <div className="flex justify-between text-[9px] font-mono text-stone-500 mt-1">
            <span>0.00</span>
            <span>0.05</span>
            <span>0.10+</span>
          </div>
        </div>
      </div>

      {topMatches.length > 0 && (
        <div className="space-y-2 pt-2 border-t border-stone-100">
          <span className="text-[10px] font-semibold text-muted-foreground">
            Closest Matches
          </span>
          <div className="flex flex-col gap-0">
            {topMatches.map((sample) => {
              const itemId = sample.id as string;
              const isSelected = hoveredId === itemId;
              const isDimmed = hoveredId !== null && !isSelected;
              const currentHue = getDistanceBlue(sample.distance);

              return (
                <div
                  key={itemId}
                  onMouseEnter={() => handleMouseEnter(itemId)}
                  onMouseLeave={handleMouseLeave}
                  onClick={() => handleJumpTo(sample)}
                  className={cn(
                    "flex items-center justify-between text-[10px] cursor-pointer transition-all duration-200 py-1 px-1 rounded-sm",
                    isDimmed ? "opacity-30 scale-[0.98]" : "opacity-100 scale-100",
                    isSelected ? "bg-stone-50" : ""
                  )}
                >
                  <div className="flex items-center gap-2 truncate">
                    <div 
                      className={cn(
                        "shrink-0 w-1.5 h-1.5 mx-1 rounded-full transition-all",
                        isSelected && "scale-125"
                      )} 
                      style={{ backgroundColor: currentHue }}
                    />
                    <span className={cn(
                      "truncate font-medium transition-colors",
                      isSelected ? "text-blue-600" : "text-stone-700"
                    )}>
                      {`${sample.culture} (${sample.object_id})`}
                    </span>
                  </div>
                  <span 
                    className={cn(
                        "font-mono font-bold px-1 rounded transition-colors",
                        isSelected ? "text-white" : ""
                    )}
                    style={{ 
                        backgroundColor: isSelected ? currentHue : `${currentHue}15`,
                        color: isSelected ? 'white' : currentHue
                    }}
                  >
                    {sample.distance < 20 ? sample.distance?.toFixed(4) : 'N/A'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <span className='text-muted-foreground text-[10px] italic'>Lower values indicated closer genetic proximity to the reference sample</span>
    </Card>
  );
}
