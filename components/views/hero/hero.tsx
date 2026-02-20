"use client";

import { Instrument_Serif } from "next/font/google";
import SplashCursor from "@/components/animations/splash-cursor";
import { Button } from "@/components/ui/button";
import { motion } from "motion/react";
import { ArrowUpRight, BadgeCheck } from "lucide-react";
import CTAButton from "@/components/ui/cta-button";
import { Logo23andMe, LogoFTDNA, LogoAncestry, LogoMyHeritage } from "@/components/shared/logos";
import { Badge } from "@/components/ui/badge";

const instrumentSerif = Instrument_Serif({
    subsets: ["latin"],
    weight: ["400"],
    style: ["italic"],
});

export type AvatarList = {
    image: string;
};

type HeroSectionProps = {
    avatarList: AvatarList[];
};

function Hero({ avatarList }: HeroSectionProps) {
    return (
        <section>
            <div className="w-full h-full relative">
                <div className="absolute inset-0 -z-1 pointer-events-none">
                    <SplashCursor
                        SIM_RESOLUTION={128}
                        DYE_RESOLUTION={1440}
                        DENSITY_DISSIPATION={3.5}
                        VELOCITY_DISSIPATION={2}
                        PRESSURE={0.1}
                        CURL={3}
                        SPLAT_RADIUS={0.2}
                        SPLAT_FORCE={6000}
                        COLOR_UPDATE_SPEED={10}
                    />
                </div>
                <div className="relative w-full pt-0 md:pt-20 pb-6 md:pb-10 before:absolute before:w-full before:h-full before:bg-linear-to-r before:from-blue-300/80 before:via-white before:to-violet-200/80 before:rounded-full before:top-24 before:blur-3xl before:-z-10 dark:before:from-slate-800 dark:before:via-black dark:before:to-stone-700 dark:before:rounded-full dark:before:blur-3xl dark:before:-z-10">
                    <div className="container mx-auto relative z-10">
                        <div className="flex flex-col max-w-5xl mx-auto gap-8">
                            <div className="relative flex flex-col text-center items-center sm:gap-4 gap-2">
                                {/* <motion.h1
                                    initial={{ opacity: 0, y: 12 }} // Reduced distance from 32 to 12
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{
                                        type: "spring",
                                        stiffness: 260,
                                        damping: 20,
                                        delay: 0
                                    }}
                                    className="lg:text-8xl md:text-7xl text-5xl font-medium leading-14 md:leading-20 lg:leading-24"
                                >
                                    Turning your raw DNA into {" "}
                                    <span
                                        className={`${instrumentSerif.className} tracking-tight`}
                                    >
                                        real historical journeys
                                    </span>
                                </motion.h1> */}
                                <motion.h1
                                    initial={{ opacity: 0, y: 12 }} // Reduced distance from 32 to 12
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{
                                        type: "spring",
                                        stiffness: 260,
                                        damping: 20,
                                        delay: 0
                                    }}
                                    className="lg:text-8xl md:text-7xl text-5xl font-medium leading-14 md:leading-20 lg:leading-24"
                                >
                                    Exploring DNA <br/>
                                    <span
                                        className={`${instrumentSerif.className} tracking-tight`}
                                    >
                                        made simple
                                    </span>
                                </motion.h1>
                                <motion.p
                                    initial={{ opacity: 0, y: 12 }} // Reduced distance from 32 to 12
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{
                                        type: "spring",
                                        stiffness: 260,
                                        damping: 20,
                                        delay: 0.1
                                    }}
                                    className="text-xs font-normal max-w-2xl text-muted-foreground"
                                >
                                    The world's ancient genomes, centralized. Map migrations, calculate genetic distances, and explore human history with precision.
                                </motion.p>
                            </div>
                            <motion.div
                                initial={{ opacity: 0, y: 12 }} // Reduced distance from 32 to 12
                                animate={{ opacity: 1, y: 0 }}
                                transition={{
                                    type: "spring",
                                    stiffness: 260,
                                    damping: 20,
                                    delay: 0.2
                                }}
                                className="flex items-center flex-col md:flex-row justify-center gap-8"
                            >
                                <CTAButton />
                                <div className="flex items-center sm:gap-7 gap-3">
                                    <ul className="avatar flex flex-row items-center">
                                        {avatarList.map((avatar, index) => (
                                            <li key={index} className="-mr-2 z-1 avatar-hover:ml-2">
                                                <img
                                                    src={avatar.image}
                                                    alt="Avatar"
                                                    width={40}
                                                    height={40}
                                                    className="rounded-full border-2 border-white"
                                                />
                                            </li>
                                        ))}
                                    </ul>
                                    <div className="gap-1 flex flex-col items-start">
                                        <div className="flex gap-1">
                                            <Badge variant="secondary" className="bg-green-100/75 border-green-300 text-green-700 dark:bg-green-950 dark:text-green-300">
                                                <span className="relative flex items-center justify-center size-3">
                                                    <span className="absolute inline-flex size-2.5 animate-ping rounded-full bg-green-400 opacity-75"></span>
                                                    <span className="relative inline-flex size-1.5 rounded-full bg-green-500"></span>
                                                </span>
                                                Database Live
                                            </Badge>
                                            {/* {Array.from({ length: 5 }).map((_, index) => (
                                                <img
                                                    key={index}
                                                    src="https://images.shadcnspace.com/assets/svgs/icon-star.svg"
                                                    alt="star"
                                                    className="h-4 w-4"
                                                />
                                            ))} */}
                                        </div>
                                        <p className="sm:text-sm text-xs font-normal text-muted-foreground">
                                            4500+ ancient genomes
                                        </p>
                                    </div>
                                </div>
                            </motion.div>

                            <footer className="mt-20 flex flex-col items-center justify-center text-muted-foreground gap-4">
                                <p className="text-sm font-normal sm:px-2 px-10  text-center">Compatible with major DNA providers</p>

                                <div className="flex items-center gap-8 grayscale-100 brightness-150 opacity-75 contrast-50">
                                    <Logo23andMe className="h-12 w-auto " />
                                    <LogoMyHeritage className="h-8 w-auto" />
                                    <LogoAncestry className="h-6 w-auto" />
                                </div>
                            </footer>
                        </div>
                    </div>

                </div>


            </div>


        </section>
    );
}

export default Hero;