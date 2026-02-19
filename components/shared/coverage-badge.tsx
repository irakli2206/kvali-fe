import React from 'react'
import { Badge } from '../ui/badge'
import { cn } from '@/lib/utils'

type Props = {
    coverage: string | null
    greenThreshold?: number
    yellowThreshold?: number
    formatValue?: (v: number) => string
}

const CoverageBadge = ({
    coverage = 'N/A',
    greenThreshold = 5,
    yellowThreshold = 0.5,
    formatValue,
}: Props) => {
    const num = parseFloat(coverage?.replace(',', '.') as string)
    const getVariantStyles = () => {
        if (num > greenThreshold) return 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300 border-green-300/80';
        if (num > yellowThreshold) return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300 border-yellow-300/80';
        return 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300 border-red-300/80';
    }

    const display = formatValue && !isNaN(num) ? formatValue(num) : coverage

    return (
        <Badge
            className={cn(
                "",
                getVariantStyles()
            )}
        >
            {display}
        </Badge>)
}

export default CoverageBadge