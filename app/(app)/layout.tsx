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

export default function AppLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {

    const [mapData, setMapData] = useState()

    useEffect(() => {
        const getData = async () => {
            const { data, error } = await getMapSamples()
            setMapData(data)
        }
        getData()
    }, [])

    const queryClient = new QueryClient()



    return (
        <QueryClientProvider client={queryClient}>
            {/* 1. Add 'flex flex-col' to stack the header and card vertically */}
            <main className="w-full h-screen bg-white p-4 flex flex-col gap-4 overflow-hidden">

                <AppHeader samples={mapData} />

                {/* 2. Change 'h-full' to 'flex-1' so it grows to fill the remaining space */}
                <div className="relative flex-1 w-full bg-white rounded-md drop-shadow-xs border border-zinc-200 overflow-hidden">
                    {children}
                </div>

            </main>
        </QueryClientProvider>
    );
}
