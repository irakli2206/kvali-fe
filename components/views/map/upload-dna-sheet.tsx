'use client'

import React, { useRef, useEffect } from 'react'
import Link from 'next/link'
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
import { Label } from '@/components/ui/label'
import { useUploadPipeline } from '@/hooks/use-dna-upload'
import { useMapStore } from '@/store/use-map-store'
import { useDnaEntitlement } from '@/hooks/use-dna-entitlement'
import { parseG25ToVector } from '@/lib/g25-utils'
import { Dna, Loader2, Sparkles } from 'lucide-react'
import type { UploadStep } from '@/hooks/use-dna-upload'

const STEP_ORDER: UploadStep[] = ['reading', 'uploading', 'processing', 'done']

type UploadDNASheetProps = {
    trigger?: React.ReactNode
}

export default function UploadDNASheet({ trigger }: UploadDNASheetProps) {
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [open, setOpen] = React.useState(false)
    const { entitled, signedIn, isLoading: entitlementLoading, refetch: refetchEntitlement } = useDnaEntitlement({ enabled: open })
    const { loading, step, stepLabel, stepProgress, error, g25String, upload, reset } = useUploadPipeline()
    const setUserG25Vector = useMapStore((s) => s.setUserG25Vector)
    const [purchaseLoading, setPurchaseLoading] = React.useState(false)

    useEffect(() => {
        if (open) refetchEntitlement()
    }, [open, refetchEntitlement])

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) upload(file)
        e.target.value = ''
    }

    const handlePurchase = async () => {
        setPurchaseLoading(true)
        try {
            const res = await fetch('/api/dodo/checkout', { method: 'POST', credentials: 'include' })
            const data = await res.json()
            if (!res.ok) {
                throw new Error(data?.error ?? 'Checkout failed')
            }
            if (data?.url) {
                window.location.href = data.url
                return
            }
            throw new Error('No checkout URL')
        } catch (err) {
            console.error(err)
            setPurchaseLoading(false)
        }
    }

    const showPaywall = !entitled
    const showUpload = entitled && !entitlementLoading

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                {trigger ?? (
                    <Button >
                        <Dna className="size-4" />
                        Compare my DNA
                    </Button>
                )}
            </SheetTrigger>
            <SheetContent side="right" className="sm:max-w-md overflow-y-auto">
                <SheetHeader>
                    <SheetTitle>Upload Raw DNA</SheetTitle>
                    <SheetDescription>
                        Upload your raw DNA file from 23andMe, Ancestry, MyHeritage, or FTDNA to compare with ancient genomes.
                    </SheetDescription>
                </SheetHeader>

                <div className="flex flex-col gap-6 p-4">
                    {entitlementLoading && (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="size-8 animate-spin text-muted-foreground" />
                        </div>
                    )}

                    {showPaywall && !entitlementLoading && (
                        <div className="space-y-4 py-4">
                            <div className="rounded-lg border bg-muted/30 p-4 text-center space-y-3">
                                <Sparkles className="size-10 stroke-1  mx-auto text-primary" />
                                <h3 className="font-semibold">Put yourself on the map</h3>
                                <p className="text-sm text-muted-foreground">
                                    One-time purchase. Upload your raw DNA, get your G25 coordinates, and see yourself alongside ancient genomes.
                                </p>
                                {!signedIn ? (
                                    <>
                                        <p className="text-xs text-muted-foreground">Sign in to purchase and unlock upload.</p>
                                        <Button asChild variant="primary" className="w-full">
                                            <Link href="/signin">Sign in</Link>
                                        </Button>
                                    </>
                                ) : (
                                    <Button
                                        variant="primary"
                                        className="w-full"
                                        onClick={handlePurchase}
                                        disabled={purchaseLoading}
                                    >
                                        {purchaseLoading ? (
                                            <>
                                                <Loader2 className="size-4 animate-spin" />
                                                Redirecting to checkout…
                                            </>
                                        ) : (
                                            'Purchase & unlock upload'
                                        )}
                                    </Button>
                                )}
                            </div>
                        </div>
                    )}

                    {showUpload && (
                        <>
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
                        </>
                    )}
                </div>

                {showUpload && (
                    <SheetFooter className="flex-row justify-start sm:justify-start">
                        <Button variant="destructive" onClick={() => reset()}>
                            Start over
                        </Button>
                    </SheetFooter>
                )}
            </SheetContent>
        </Sheet>
    )
}
