'use client'

import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter, Google_Sans_Flex } from "next/font/google";
import Header, { NavigationSection } from "@/components/shared/header";
import AuthHeader from "@/components/auth/auth-header";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app/app-sidebar";
import AppHeader from "@/components/app/app-header";
import { createClient } from "@/lib/supabase/server";
import { getMapSamples } from "@/lib/api/samples";
import {
    QueryClient,
    QueryClientProvider,
    useQuery,
} from '@tanstack/react-query'
import { useEffect, useState } from "react";
import { Sample } from "@/types";
import Banner from "@/components/shared/banner";

export default function AppLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {

    const [mapData, setMapData] = useState<Partial<Sample>[] | null>()

    useEffect(() => {
        const getData = async () => {
            const { data, error } = await getMapSamples()
            //@ts-ignore
            setMapData(data)
        }
        getData()
    }, [])

    const queryClient = new QueryClient()



    return (
        <QueryClientProvider client={queryClient}>
            {/* 1. Add 'flex flex-col' to stack the header and card vertically */}
            <>
                <Banner >Under active development. Some samples have duplicating coordinates.</Banner>
                <main className="w-full h-[100dvh] bg-white p-4 pt-12 flex flex-col gap-4 overflow-hidden">

                    <AppHeader samples={mapData} />

                    {/* flex-1 tells this div to take up 100% of the REMAINING space.
   Because the parent is exactly 100dvh, this div cannot bleed out.
*/}
                    <div className="relative flex-1 w-full bg-white rounded-md drop-shadow-xs border border-zinc-200 overflow-hidden">
                        {children}
                    </div>

                </main>
            </>
        </QueryClientProvider>
    );
}
