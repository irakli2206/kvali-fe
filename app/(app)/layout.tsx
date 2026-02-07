
import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter, Google_Sans_Flex } from "next/font/google";
import Header, { NavigationSection } from "@/components/shared/header";
import AuthHeader from "@/components/auth/auth-header";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app/app-sidebar";
import AppHeader from "@/components/app/app-header";
import { createClient } from "@/lib/supabase/server";
import { getMapSamples } from "@/lib/api/samples";


export default async function AppLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {


    const { data, error } = await getMapSamples()




    return (
        <>
            {/* 1. Add 'flex flex-col' to stack the header and card vertically */}
            <main className="w-full h-screen bg-white p-4 flex flex-col gap-4 overflow-hidden">

                <AppHeader samples={data} />

                {/* 2. Change 'h-full' to 'flex-1' so it grows to fill the remaining space */}
                <div className="relative flex-1 w-full bg-white rounded-md drop-shadow-xs border border-zinc-200 overflow-hidden">
                    {children}
                </div>

            </main>
        </>
    );
}
