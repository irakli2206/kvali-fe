
import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter, Google_Sans_Flex } from "next/font/google";
import Header, { NavigationSection } from "@/components/shared/header";
import AuthHeader from "@/components/auth/auth-header";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app/app-sidebar";
import AppHeader from "@/components/app/app-header";
import { createClient } from "@/lib/supabase/server";


export default async function AppLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    const supabase = await createClient()
    // const { data, error } = await supabase // Capture 'error' here
    //     .from('ancient_samples')
    //     .select('id, Latitude, Longitude, Simplified_Culture')
    //     .limit(20000) // Set this higher than your total count

    const { data, error } = await supabase // Capture 'error' here
        .from('adna')
        .select('*')
        .not('g25_string', 'is', null) // Fetches only rows where g25_string has data

    if (error) {
        console.error("Supabase Error Details:", error.message, error.hint)
    }

    console.log("Data count:", data?.length)



    return (
        <>
            {/* 1. Add 'flex flex-col' to stack the header and card vertically */}
            <main className="w-full h-screen bg-zinc-50 p-4 flex flex-col gap-4 overflow-hidden">

                <AppHeader samples={data} />

                {/* 2. Change 'h-full' to 'flex-1' so it grows to fill the remaining space */}
                <div className="relative flex-1 w-full bg-white rounded-md drop-shadow-xs border border-zinc-200 overflow-hidden">
                    {children}
                </div>

            </main>
        </>
    );
}
