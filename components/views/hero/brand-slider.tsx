"use client";
import { Marquee } from "@/components/animations/marquee";
import { motion } from "motion/react";

export interface BrandList {
    image: string;
    name: string;
    lightimg: string;
}

function BrandSlider({ brandList }: { brandList: BrandList[] }) {
    return (
        <section>
            <div className="py-6 md:py-10">
                <div className="container mx-auto max-w-6xl">
                    <motion.div
                        viewport={{ once: true }}
                        initial={{ opacity: 0, y: 12 }} // Reduced distance from 32 to 12
                        animate={{ opacity: 1, y: 0 }}
                        transition={{
                            type: "spring",
                            stiffness: 260,
                            damping: 20,
                            delay: 0.6
                        }}
                        className="flex flex-col gap-3"
                    >
                        <div className="flex justify-center text-center py-3 md:py-4 relative">
                            <div className="flex items-center justify-center gap-4">
                                <div className="hidden md:block h-0.5 w-40 bg-linear-to-l from-muted-foreground to-white dark:from-muted-foreground dark:to-transparent opacity-20" />
                                <p className="text-sm font-normal sm:px-2 px-10 text-muted-foreground text-center">
                                    Compatible with all major DNA providers
                                </p>
                                <div className="hidden md:block h-0.5 w-40 bg-linear-to-r from-muted-foreground to-white dark:from-muted-foreground dark:to-transparent opacity-20" />
                            </div>
                        </div>
                        {brandList && brandList.length > 0 && (
                            <div className="py-4">
                                <div className="[mask-image:linear-gradient(to_right,transparent,black_20%,black_80%,transparent)]">
                                    <Marquee pauseOnHover className="[--duration:20s] p-0">
                                        {brandList.map((brand, index) => (
                                            <div key={index}>
                                                <img
                                                    src={brand.image}
                                                    alt={brand.name}
                                                    className="w-36 h-8 mr-6 lg:mr-20 dark:hidden"
                                                />
                                                <img
                                                    src={brand.lightimg}
                                                    alt={brand.name}
                                                    className="hidden dark:block w-36 h-8 mr-12 lg:mr-20"
                                                />
                                            </div>
                                        ))}
                                    </Marquee>
                                </div>
                            </div>
                        )}
                    </motion.div>
                </div>
            </div>
        </section>
    );
}

export default BrandSlider;
