'use client'

import React from 'react'
import { Button } from '../ui/button'
import { LargeSampleSearch } from './map/large-sample-search'
import Link from 'next/link'
import { CultureSearch } from './map/culture-search'
import UploadDNASheet from '../views/map/upload-dna-sheet'
import { useMapSamples } from '@/hooks/use-map-samples'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { LogoIcon } from '../shared/logo-icon'
import { useMapStore } from '@/store/use-map-store'
import { filterSamplesByMapFilters } from '@/lib/map-utils'
import { useSavedSession } from '@/hooks/use-saved-session'
import { Bookmark, BookmarkCheck } from 'lucide-react'
import { toast } from 'sonner'

export default function AppHeader() {
    const { data: allSamples = [] } = useMapSamples()
    const { timeWindow, sampleFilter, mapMode, selectedYDNA } = useMapStore()
    const { saveSession, restoreSession, hasSavedSession } = useSavedSession()
    const samples = React.useMemo(
        () =>
            filterSamplesByMapFilters(allSamples, {
                timeWindow,
                sampleFilter,
                mapMode,
                selectedYDNA,
            }),
        [allSamples, timeWindow, sampleFilter, mapMode, selectedYDNA]
    )

    return (
        <div className='w-full grid grid-cols-[1fr_auto_1fr] items-center gap-4'>
            <section className='flex justify-start'>
                <Link href="/">
                    <LogoIcon size={32} />
                </Link>
            </section>

            <section className='flex gap-2 justify-center min-w-0'>
                <LargeSampleSearch samples={samples} />
                <CultureSearch samples={samples} />
            </section>

            <section className='flex gap-2 items-center justify-end'>
                <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 shrink-0"
                    onClick={() => { saveSession(); toast.success('Session saved'); }}
                >
                    <Bookmark className="h-4 w-4" />
                    Save session
                </Button>
                {hasSavedSession && (
                    <Button
                        variant="outline"
                        size="sm"
                        className="gap-1.5 shrink-0"
                        onClick={() => { restoreSession(allSamples); toast.success('Session restored'); }}
                    >
                        <BookmarkCheck className="h-4 w-4" />
                        Restore
                    </Button>
                )}
                <ThemeToggle />
                <UploadDNASheet />
                {/* <Button variant='secondary' onClick={() => { signout() }}>Sign Out</Button> */}
            </section>
        </div>
    )
}

