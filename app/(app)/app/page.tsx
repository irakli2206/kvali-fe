import MapView from '@/components/app/journey/map-view'
import { createClient } from '@/lib/supabase/server'
import React from 'react'

const App = async () => {
    const supabase = await createClient()
    // const { data, error } = await supabase // Capture 'error' here
    //     .from('ancient_samples')
    //     .select('id, Latitude, Longitude, Simplified_Culture')
    //     .limit(20000) // Set this higher than your total count

    const { data, error } = await supabase // Capture 'error' here
        .from('adna')
        .select('*')
        .not('g25_string', 'is', null) // Fetches only rows where g25_string has data

    if (error) {
        console.error("Supabase Error Details:", error.message, error.hint)
    }

    console.log("Data count:", data?.length)

    return (
        <div className='w-full h-full relative overflow-hidden'>
            <MapView data={data ?? []} />
        </div>
    )
}

export default App