import MapView from '@/components/app/map/map-view'
import { getMapSamples } from '@/lib/api/samples'
import { createClient } from '@/lib/supabase/server'
import React from 'react'

const App = async () => {


    const { data, error } = await getMapSamples()


    return (
        <div className='w-full h-full relative overflow-hidden'>
            <MapView data={data ?? []} />
        </div>
    )
}

export default App