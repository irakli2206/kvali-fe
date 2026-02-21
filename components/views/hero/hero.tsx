"use client";

import { useState, useEffect } from "react";
import SplashCursor from "@/components/animations/splash-cursor";
import { motion } from "motion/react";
import { Logo23andMe, LogoMyHeritage, LogoAncestry } from "@/components/shared/logos";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import DitherWaves from "@/components/shared/dither-waves";
import HowItWorksDialog from "@/components/views/hero/how-it-works-dialog";

const springTransition = {
  type: "spring" as const,
  stiffness: 260,
  damping: 20,
};

const MotionButton = motion.create(Button)


function Hero({ v2 }: { v2?: boolean }) {
  const [howItWorksOpen, setHowItWorksOpen] = useState(false);
  const [backgroundReady, setBackgroundReady] = useState(false);
  // v2: show content after short delay so background can paint first. !v2: DitherWaves calls onReady after first frame; fallback if it never fires
  useEffect(() => {
    if (v2) {
      const t = setTimeout(() => setBackgroundReady(true), 100);
      return () => clearTimeout(t);
    }
    const fallback = setTimeout(() => setBackgroundReady(true), 800);
    return () => clearTimeout(fallback);
  }, [v2]);
  return (
    <section>
      <div className="w-full h-full">
        <div className={cn("absolute inset-0 z-0 pointer-events-none", v2 ? "bg-neutral-200" : "bg-[#f5f5f5]")}>
          {!v2 && (
            <DitherWaves
              enableMouseInteraction={false}
              dither={false}
              className="opacity-50"
              onReady={() => setBackgroundReady(true)}
            />
          )}
          {v2 && <SplashCursor
            SIM_RESOLUTION={128}
            DYE_RESOLUTION={1440}
            DENSITY_DISSIPATION={3.5}
            VELOCITY_DISSIPATION={2}
            PRESSURE={0.1}
            CURL={3}
            SPLAT_RADIUS={0.2}
            SPLAT_FORCE={6000}
            COLOR_UPDATE_SPEED={10}
          />}
        </div>
        <motion.div
          initial={{ opacity: 0, filter: "blur(10px)" }}
          animate={
            backgroundReady
              ? { opacity: 1, filter: "blur(0px)" }
              : { opacity: 0, filter: "blur(10px)" }
          }
          transition={{ ...springTransition }}
          className="relative w-full pt-0 md:pt-0 pb-6 md:pb-10">
          <div className="container mx-auto relative z-10 ">
            <div className="flex flex-col max-w-5xl mx-auto gap-8">
              <div className="relative flex flex-col text-center items-center sm:gap-4 gap-2">
                <motion.h1
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: backgroundReady ? 1 : 0, y: backgroundReady ? 0 : 12 }}
                  transition={{ ...springTransition, delay: 0 }}
                  className="lg:text-[80px] md:text-7xl text-5xl font-semibold text-foreground/90 leading-14 md:leading-20"
                >
                  Exploring DNA <br />
                  made simple
                </motion.h1>
                <motion.p
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: backgroundReady ? 1 : 0, y: backgroundReady ? 0 : 12 }}
                  transition={{ ...springTransition, delay: 0.1 }}
                  className="text-lg font-normal max-w-2xl text-muted-foreground"
                >
                  The world's ancient genomes, centralized. Map migrations, calculate genetic distances, and explore human history with precision.
                </motion.p>
              </div>
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: backgroundReady ? 1 : 0, y: backgroundReady ? 0 : 12 }}
                transition={{ ...springTransition, delay: 0.2 }}
                className="flex items-center flex-col md:flex-row justify-center gap-8"
              >
                <MotionButton
                  whileTap={{ scale: 0.95 }}
                  asChild
                  size="cta"
                  variant='cta'
                  className={cn(
                    "group rounded-full ",

                  )}
                >
                  <Link href="/app" className=" inline-flex items-center gap-1 overflow-hidden">
                    <div className="z-0  border-3 cursor-default  group-hover:-inset-1  absolute duration-200 inset-0 rounded-full  border-blue-300/60"></div>
                    Start Exploring
                    <ArrowRight className="size-4 group-hover:translate-x-0.5 transition-all duration-200" />
                  </Link>
                </MotionButton>

                <Button
                  size="cta"
                  variant="light"
                  className="rounded-full text-base hover:bg-primary/20 text-primary hover:text-primary"
                  onClick={() => setHowItWorksOpen(true)}
                >
                  How It Works
                </Button>
                <HowItWorksDialog open={howItWorksOpen} onOpenChange={setHowItWorksOpen} />
                {/* <div className="flex items-center sm:gap-7 gap-3">
                  <div className="gap-1 flex flex-col items-start">
                    <div className="flex gap-1">
                      <Badge variant="secondary" className="bg-green-100/75 border-green-300 text-green-700 dark:bg-green-950 dark:text-green-300">
                        <span className="relative flex items-center justify-center size-3">
                          <span className="absolute inline-flex size-2.5 animate-ping rounded-full bg-green-400 opacity-75" />
                          <span className="relative inline-flex size-1.5 rounded-full bg-green-500" />
                        </span>
                        Database Live
                      </Badge>
                    </div>
                    <p className="sm:text-sm text-xs font-normal text-muted-foreground">
                      7000+ ancient genomes indexed
                    </p>
                  </div>
                </div> */}
              </motion.div>
              <footer className="mt-20 flex flex-col items-center justify-center text-muted-foreground gap-4">
                <p className="text-sm font-normal sm:px-2 px-10 text-center">
                  Compatible with major DNA providers
                </p>
                <div className="flex items-center gap-8 grayscale-100 brightness-150 opacity-75 contrast-50">
                  <Logo23andMe className="h-12 w-auto" />
                  <LogoMyHeritage className="h-8 w-auto" />
                  <LogoAncestry className="h-6 w-auto" />
                </div>
              </footer>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

export default Hero;
