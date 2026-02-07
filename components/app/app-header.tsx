'use client'

import Image from 'next/image'
import React from 'react'
import Logo from '@/assets/kvali logo.png'
import { Field, FieldLabel } from "@/components/ui/field"
import {
    InputGroup,
    InputGroupAddon,
    InputGroupInput,
    InputGroupText,
} from "@/components/ui/input-group"

import { Input } from "@/components/ui/input"
import { GlobeIcon, Search } from 'lucide-react'
import {
    Combobox,
    ComboboxCollection,
    ComboboxContent,
    ComboboxEmpty,
    ComboboxGroup,
    ComboboxInput,
    ComboboxItem,
    ComboboxLabel,
    ComboboxList,
    ComboboxSeparator,
} from "@/components/ui/combobox"
import {
    Item,
    ItemContent,
    ItemDescription,
    ItemTitle,
} from "@/components/ui/item"
import { Virtuoso } from "react-virtuoso"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandInput, CommandEmpty, CommandList, CommandItem } from "@/components/ui/command"
import { Button } from '../ui/button'
import { LargeSampleSearch } from './large-sample-search'
import { useArchiveStore } from "@/store/use-map-store"
import Link from 'next/link'

const AppHeader = ({ samples }: any) => {
    const [open, setOpen] = React.useState(false)
    const { setTargetSample } = useArchiveStore((state) => state);

    const resetTargetSample = () => {
        setTargetSample(null)
    }

    return (
        <div className='w-full flex justify-between gap-4 min-h-8'>
            <section>
                <Link href="/">
                    <Image src={Logo} alt='' width={128} height={128} className='h-8 w-fit' />
                </Link>
            </section>

            <section className='w-1/3'>
                <LargeSampleSearch samples={samples} />
            </section>

            <section>
                <Button variant='secondary' onClick={() => { resetTargetSample() }}>Reset Map</Button>
            </section>
        </div>
    )
}

export default AppHeader

