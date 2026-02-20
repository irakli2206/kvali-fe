import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter, Google_Sans_Flex } from "next/font/google";
import "../globals.css";
import Header, { NavigationSection } from "@/components/shared/header";


export default function AuthLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    const navigationData: NavigationSection[] = [
        {
            title: "About us",
            href: "#",
        },
        {
            title: "Services",
            href: "#",
        },
        {
            title: "Work",
            href: "#",
        },
        {
            title: "Team",
            href: "#",
        },
        {
            title: "Pricing",
            href: "#",
        },
        {
            title: "Awards",
            href: "#",
        },
    ];



    return (
        <>
            <main className="w-full flex  flex-col min-h-screen h-screen bg-neutral-50">
                <Header navigationData={navigationData} />
                {children}
            </main>
        </>
    );
}
