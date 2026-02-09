import React from 'react';
import { useMapStore } from '@/store/use-map-store';
import { Card } from '@/components/ui/card';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function DistanceLegend() {
  const { mapMode, targetSample, setMapMode, setTargetSample } = useMapStore();

  if (mapMode !== 'distance' || !targetSample) return null;

  return (
    <Card className="absolute top-2 left-2 p-3 w-64 bg-white rounded-md border shadow-none animate-in slide-in-from-right-5 gap-2">
      <div className="flex items-center  mb-2">
        <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500">
          Genetic Distance
        </span>
        {/* <Button
          onClick={() => { setMapMode('neutral'); setTargetSample(null); }}
          size='icon-sm'
          variant='ghost'
        >
          <X size={14} />
        </Button> */}
      </div>

      <div className="">
        <div className="text-[11px] font-medium text-stone-800 truncate">
          Ref: {targetSample.Simplified_Culture} ({targetSample['Object-ID']})
        </div>

        {/* The Gradient Bar */}
        <div className="h-1.5 w-full  my-0.5  rounded-full bg-gradient-to-r from-blue-950 via-blue-500 via-blue-300 to-stone-300" />


        <div className="flex justify-between text-[9px] font-mono text-stone-500">
          <span>0.00</span>
          <span>0.05</span>
          <span>0.10+</span>
        </div>
      </div>

      <div className="pt-2 border-t border-stone-100">
        <p className="text-[9px] leading-tight text-stone-400 italic">
          Lower values indicate closer genetic proximity to the target.
        </p>
      </div>
    </Card>
  );
}