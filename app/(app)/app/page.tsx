import MapView from '@/components/app/journey/map-view'
import { getMapSamples } from '@/lib/api/samples'
import { createClient } from '@/lib/supabase/server'
import React from 'react'

const App = async () => {


    const { data, error } = await getMapSamples()

    console.log("Data count:", data?.length)

    return (
        <div className='w-full h-full relative overflow-hidden'>
            <MapView data={data ?? []} />
        </div>
    )
}

export default App