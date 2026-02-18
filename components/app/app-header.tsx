'use client'

import Image from 'next/image'
import React from 'react'
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
import { LargeSampleSearch } from './map/large-sample-search'
import { useMapStore } from "@/store/use-map-store"
import Link from 'next/link'
import { DropdownMenuTrigger, DropdownMenuContent, DropdownMenuGroup, DropdownMenuLabel, DropdownMenuCheckboxItem, DropdownMenu } from '../ui/dropdown-menu'
import { CultureSearch } from './map/culture-search'
import { signout } from '@/app/(auth)/actions'
import KvaliLogo from '@/assets/logo'
import UploadDNASheet from '../views/map/upload-dna-sheet'
import { useMapSamples } from '@/hooks/use-map-samples'

export default function AppHeader() {
    const { data: samples = [] } = useMapSamples()
    const [open, setOpen] = React.useState(false)
    const { resetData } = useMapStore((state) => state);




    return (
        <div className='w-full flex justify-between gap-4 min-h-8'>
            <section>
                <Link href="/">
                    <KvaliLogo className="h-8 w-auto" />
                </Link>
            </section>

            <section className='w-1/3 max-w-1/3 flex gap-2'>
                <LargeSampleSearch samples={samples} />
                <CultureSearch samples={samples} />
            </section>

            <section className='flex gap-2'>
                <Button variant='secondary' onClick={() => { resetData() }}>Reset Map</Button>
                <UploadDNASheet />
                {/* <Button variant='secondary' onClick={() => { signout() }}>Sign Out</Button> */}
            </section>
        </div>
    )
}

