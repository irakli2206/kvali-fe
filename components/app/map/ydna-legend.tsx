import { Button } from '@/components/ui/button';
import { Dna, X } from 'lucide-react';
import React from 'react'

const YDNALegend = ({ onClose }: { onClose: () => void }) => {
    // This should match the colors we defined in your YDNAColors array
    const legendItems = [
        // --- West Eurasian ---
        { label: 'R1b', color: '#ef4444', desc: 'Western Europe / Italo-Celtic' },
        { label: 'R1a', color: '#3b82f6', desc: 'Eastern Europe / Indo-Iranian' },
        { label: 'I', color: '#10b981', desc: 'Mesolithic European Hunter-Gatherer' },
        { label: 'J', color: '#8b5cf6', desc: 'Near Eastern / Caucasian / Semitic' },
        { label: 'G', color: '#06b6d4', desc: 'Early Anatolian Farmers / Caucasus' },
        { label: 'T', color: '#f59e0b', desc: 'East African / Middle Eastern' },
        { label: 'L', color: '#10b981', desc: 'South Asian / West Asian' },

        // --- East Eurasian & Amerindian ---
        { label: 'N', color: '#84cc16', desc: 'Uralic / Siberian' },
        { label: 'Q', color: '#f43f5e', desc: 'Siberian / Native American' },
        { label: 'O', color: '#16a34a', desc: 'East Asian / Austronesian' },
        { label: 'C', color: '#ec4899', desc: 'East Asian / Oceanian / Central Asian' },
        { label: 'D', color: '#a21caf', desc: 'Tibetan / Japanese / Andamanese' },

        // --- African ---
        { label: 'E', color: '#78350f', desc: 'African / Mediterranean' },
        { label: 'A/B', color: '#27272a', desc: 'Basal African Lineages' },

        // --- South Asian / Other ---
        { label: 'H', color: '#fbbf24', desc: 'South Asian (Dravidian)' },
        { label: 'R', color: '#60a5fa', desc: 'General R (Basal/Pre-split)' },
    ];


    return (
        <div className="absolute top-2 left-2 w-64 bg-white backdrop-blur-md border border-stone-200 rounded-md  p-4 animate-in fade-in slide-in-from-bottom-2">
            <div className="flex items-center justify-between mb-3 border-b pb-2">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                    <Dna className="w-4 h-4 text-primary" />
                    Y-DNA Haplogroups
                </h3>
                <Button variant="ghost" size="icon-sm" onClick={onClose}>
                    <X className="w-3 h-3" />
                </Button>
            </div>
            <div className="grid grid-cols-1 gap-2 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
                {legendItems.map((item) => (
                    <div key={item.label} className="flex items-center gap-3">
                        <div
                            className="w-3 h-3 rounded-full shrink-0 border border-black/10"
                            style={{ backgroundColor: item.color }}
                        />
                        <div className="flex flex-col">
                            <span className="text-xs font-bold leading-none">{item.label}</span>
                            {/* <span className="text-[10px] text-muted-foreground leading-tight">{item.desc}</span> */}
                        </div>
                    </div>
                ))}
                <div className="flex items-center gap-3 pt-1 border-t mt-1">
                    <div className="w-3 h-3 rounded-full shrink-0 bg-[#e7e5e4] border border-black/10" />
                    <span className="text-xs text-muted-foreground">Other</span>
                </div>
            </div>
        </div>
    );
};


export default YDNALegend