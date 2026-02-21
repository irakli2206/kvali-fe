'use client'

import { Suspense } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import AppHeader from '@/components/app/app-header'
import Banner from '@/components/shared/banner'
import DnaPurchaseToast from '@/components/app/dna-purchase-toast'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'

const queryClient = new QueryClient()

export default function AppLayout({ children }: { children: React.ReactNode }) {
    return (
        <QueryClientProvider client={queryClient}>
            <Suspense fallback={null}>
                <DnaPurchaseToast />
            </Suspense>
            <Banner>Under active development</Banner>
            <main className="w-full h-[100dvh] bg-background p-4 pt-12 flex flex-col gap-4 overflow-hidden">
                <AppHeader />
                <div className="relative flex-1 w-full bg-background rounded-md drop-shadow-xs border  overflow-hidden">
                    {children}
                </div>
            </main>

            <ReactQueryDevtools initialIsOpen={false} />
        </QueryClientProvider>
    )
}
