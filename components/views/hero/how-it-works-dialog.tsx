"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Upload, Map, Dna, ArrowRight, SlidersHorizontal, Users, Ruler } from "lucide-react";

const STEPS = [
  {
    title: "Upload your raw DNA",
    description:
      "From 23andMe, Ancestry, MyHeritage, or FTDNA. One-time purchase — we convert your file into G25 coordinates, the same format used by researchers worldwide.",
    icon: Upload,
  },
  {
    title: "Get your G25 coordinates",
    description:
      "We process your raw data and return your G25 representation. You can use it on the map and in tools like Vahaduo.",
    icon: Dna,
  },
  {
    title: "Explore the map",
    description:
      "See yourself alongside thousands of ancient genomes. Compare populations, trace migrations, and explore genetic distances with precision.",
    icon: Map,
  },
  {
    title: "Filter by time & type",
    description:
      "Use the time range slider to focus on a specific era, and choose Ancient or Modern to show only the samples you care about.",
    icon: SlidersHorizontal,
  },
  {
    title: "Y-DNA haplogroups",
    description:
      "Switch to Y-DNA mode and filter by haplogroups to see paternal lineage distribution across the map.",
    icon: Users,
  },
  {
    title: "Calculate distances",
    description:
      "Click \"Calculate Distances\" on any sample. Distances are computed only among the samples currently visible (after your time range and filters), so you see who’s closest in your selected set.",
    icon: Ruler,
  },
];

type HowItWorksDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export default function HowItWorksDialog({ open, onOpenChange }: HowItWorksDialogProps) {
  const [step, setStep] = useState(0);
  const current = STEPS[step];
  const Icon = current.icon;
  const isFirst = step === 0;
  const isLast = step === STEPS.length - 1;

  const handleOpenChange = (next: boolean) => {
    if (!next) setStep(0);
    onOpenChange(next);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg" showCloseButton>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="flex size-9 items-center justify-center rounded-md bg-primary/10 text-primary">
              <Icon className="size-4" />
            </span>
            How it works
          </DialogTitle>
          <DialogDescription asChild>
            <p className="text-muted-foreground text-sm">
              Step {step + 1} of {STEPS.length}
            </p>
          </DialogDescription>
        </DialogHeader>

        <div className="py-2">
          <h3 className="font-semibold text-foreground">{current.title}</h3>
          <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
            {current.description}
          </p>
        </div>

        <div className="flex gap-1.5">
          {STEPS.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Go to step ${i + 1}`}
              onClick={() => setStep(i)}
              className={`h-1.5 flex-1 rounded-full transition-colors ${
                i === step ? "bg-primary" : "bg-muted"
              }`}
            />
          ))}
        </div>

        <DialogFooter className="w-full flex-row flex-nowrap justify-between gap-4">
          <div className="flex gap-2">
            {!isFirst && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setStep(step - 1)}
                className="gap-1"
              >
                <ChevronLeft className="size-4" />
                Back
              </Button>
            )}
            {!isLast && (
              <Button
                type="button"
                size="sm"
                onClick={() => setStep(step + 1)}
                className="gap-1"
              >
                Next
                <ChevronRight className="size-4" />
              </Button>
            )}
          </div>
          {isLast ? (
            <Button asChild size="sm" className="gap-1 shrink-0">
              <Link href="/app" onClick={() => handleOpenChange(false)}>
                Start Exploring
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          ) : null}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
