import React from 'react'
import { Button } from './button';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'motion/react';

const MotionButton = motion.create(Button)

const CTAButton = ({ className }: { className?: string }) => {
    return (
        <MotionButton
            whileTap={{ scale: 0.95 }}
            asChild
            className={cn("relative rounded-full h-10 p-0 group  w-fit", className)}>
            <Link href="/app" className={cn("relative  flex text-sm font-medium rounded-full h-10 p-1 ps-4 pe-12 group transition-all duration-500 hover:ps-12 hover:pe-4 w-fit", className)}>
                <span className="relative z-10 transition-all duration-200 h-fit my-auto">
                    Look Around
                </span>
                <div className="absolute z-10 right-1 w-8 h-8 bg-background text-foreground rounded-full flex items-center justify-center transition-all duration-500 group-hover:right-[calc(100%-36px)] group-hover:rotate-45">
                    <ArrowUpRight size={16} className='text-primary' />
                </div>
                {/* 
                <motion.div
                    className="absolute inset-0 rounded-full z-0 pointer-events-none"
                    initial={{
                        boxShadow: "0 0 0 0px rgba(59, 130, 246, 1)",
                        opacity: 1
                    }}
                    animate={{
                        // We use spread radius (the 4th number) to grow the ring uniformly
                        boxShadow: [
                            "0 0 0 0px rgba(59, 130, 246, 1)",  // Start tight
                            "0 0 0 10px rgba(59, 130, 246, 0)",   // Finish 12px out, invisible
                            "0 0 0 50px rgba(59, 130, 246, 0)"     // Reset invisible
                        ],
                    }}
                    transition={{
                        duration: 2, 
                        repeat: Infinity,
                        repeatDelay: 0.5,
                        ease: "easeInOut",
                        times: [0, 0.7, 1]
                    }}
                /> */}
            </Link>


        </MotionButton>
    );
}

export default CTAButton