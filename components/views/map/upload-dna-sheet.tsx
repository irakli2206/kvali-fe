'use client'

import React, { useRef } from 'react'
import {
    Sheet,
    SheetTrigger,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
    SheetFooter,
    SheetClose,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { useUploadPipeline } from '@/hooks/use-dna-upload'
import { useMapStore } from '@/store/use-map-store'
import { parseG25ToVector } from '@/lib/g25-utils'
import { Dna } from 'lucide-react'
import type { UploadStep } from '@/hooks/use-dna-upload'

const STEP_ORDER: UploadStep[] = ['reading', 'uploading', 'processing', 'done']

type UploadDNASheetProps = {
    trigger?: React.ReactNode
}

export default function UploadDNASheet({ trigger }: UploadDNASheetProps) {
    const fileInputRef = useRef<HTMLInputElement>(null)
    const { loading, step, stepLabel, stepProgress, error, k36Results, g25String, upload, reset } = useUploadPipeline()
    const setUserG25Vector = useMapStore((s) => s.setUserG25Vector)

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) upload(file)
        e.target.value = ''
    }

    return (
        <Sheet>
            <SheetTrigger asChild>
                {trigger ?? (
                    <Button variant="primary" >
                        <Dna className="size-4" />
                        Compare my DNA
                    </Button>
                )}
            </SheetTrigger>
            <SheetContent side="right" className="sm:max-w-md  overflow-y-auto">
                <SheetHeader>
                    <SheetTitle>Upload Raw DNA</SheetTitle>
                    <SheetDescription>
                        Upload your raw DNA file from 23andMe, Ancestry, MyHeritage, or FTDNA to compare with ancient genomes.
                    </SheetDescription>
                </SheetHeader>

                <div className="flex flex-col gap-6 p-4">
                    <div className="space-y-2">
                        <Label htmlFor="dna-file">Raw DNA file</Label>
                        <Input
                            ref={fileInputRef}
                            id="dna-file"
                            type="file"
                            accept=".txt,.zip"
                            onChange={handleFileChange}
                            disabled={loading}
                            className="cursor-pointer"
                        />
                    </div>

                    {loading && (
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <p className="text-sm text-muted-foreground">{stepLabel}</p>
                                <span className="text-xs text-muted-foreground tabular-nums">{stepProgress}%</span>
                            </div>
                            <Progress value={stepProgress} className="h-2" />
                            <div className="flex gap-1.5 pt-1">
                                {(['reading', 'uploading', 'processing', 'done'] as const).map((s) => (
                                    <div
                                        key={s}
                                        className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
                                            STEP_ORDER.indexOf(step) >= STEP_ORDER.indexOf(s)
                                                ? 'bg-primary'
                                                : 'bg-muted'
                                        }`}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {error && (
                        <div className="rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                            {error}
                        </div>
                    )}

                    {/* {k36Results && (
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-base">Population Composition</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {Object.entries(k36Results).map(([population, percentage]) => (
                                    <div key={population} className="space-y-1.5">
                                        <div className="flex justify-between text-sm">
                                            <span className="font-medium">{population}</span>
                                            <span className="text-muted-foreground">{percentage}%</span>
                                        </div>
                                        <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                                            <div
                                                className="h-full bg-primary transition-all duration-500 rounded-full"
                                                style={{ width: `${percentage}%` }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    )} */}

                    {g25String && (
                        <div className="rounded-md border bg-muted/50 px-4 py-3">
                            <p className="text-xs font-medium text-muted-foreground mb-1">G25 coordinates ready</p>
                            <p className="text-xs font-mono truncate" title={g25String}>
                                {g25String.slice(0, 60)}…
                            </p>
                            <SheetClose asChild>
                                <Button
                                    variant="default"
                                    size="sm"
                                    className="mt-3 w-full"
                                    onClick={() => {
                                        const vector = parseG25ToVector(g25String)
                                        if (vector.length >= 25) {
                                            setUserG25Vector(vector)
                                        }
                                    }}
                                >
                                    View on map
                                </Button>
                            </SheetClose>
                        </div>
                    )}
                </div>

                <SheetFooter className="flex-row justify-start sm:justify-start">
                    <Button variant="destructive" onClick={() => reset()}>
                        Start over
                    </Button>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    )
}
