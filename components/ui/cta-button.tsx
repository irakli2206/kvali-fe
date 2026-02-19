"use client"

import React from "react"
import Link from "next/link"
import { ArrowRight, ArrowUpRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "./button"
import { motion } from "motion/react"

const MotionButton = motion.create(Button)

/**
 * One clear CTA: solid background, clear hover, optional arrow.
 * Minimal and confident – no gradients or animation.
 */
export default function CTAButton({ className }: { className?: string }) {
    return (
        <MotionButton
            whileTap={{ scale: 0.95 }}
            asChild
            size="lg"
            className={cn(
                "relative group  ring-0 rounded-full ring-primary/50 duration-200",
                className
            )}
        >

            <Link href="/app" className=" inline-flex items-center gap-1 overflow-hidden">
                <div className="z-0  border-3 group-hover:inset-0  absolute duration-300 inset-0 rounded-full  border-blue-300/60"></div>
                Look Around
                <ArrowRight className="size-4 group-hover:translate-x-0.5 transition-all duration-300" />
            </Link>
        </MotionButton>
    )
}
