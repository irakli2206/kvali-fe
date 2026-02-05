import React from 'react'
import { Button } from './button';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { cn } from '@/lib/utils';

const CTAButton = ({ className }: { className?: string }) => {
    return (
        <Button className={cn("relative rounded-full h-10 p-0  group transition-all duration-500  w-fit", className)}>
            <Link href="/signup" className={cn("relative flex text-sm font-medium rounded-full h-10 p-1 ps-4 pe-12 group transition-all duration-500 hover:ps-12 hover:pe-4 w-fit overflow-hidden", className)}>
                <span className="relative z-10 transition-all duration-500 h-fit my-auto">
                    Get Started
                </span>
                <div className="absolute right-1 w-8 h-8 bg-background text-foreground rounded-full flex items-center justify-center transition-all duration-500 group-hover:right-[calc(100%-36px)] group-hover:rotate-45">
                    <ArrowUpRight size={16} />
                </div>
            </Link>
        </Button>
    );
}

export default CTAButton