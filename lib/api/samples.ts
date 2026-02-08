"use server"

import { createClient } from '@/lib/supabase/server'
import { Tables } from '@/types/database.types'

export type AdnaRow = Tables<'adna'>

/**
 * THIN FETCH: Only get essential map data.
 * Standalone async function for Next.js compatibility.
 */
export async function getMapSamples() {
    try {
        const supabase = await createClient()
        const { data, error } = await supabase
            .from('adna')
            .select(`
                id, 
                "Object-ID",
                Latitude, 
                Longitude,
                Simplified_Culture,
                g25_string,
                "Y-Symbol",
                Mean
            `)
            .not('g25_string', 'is', null)

        if (error) {
            console.error("Map Fetch Error:", error.message)
            return { data: null, error: error.message }
        }

        const cleanedData = data.map(item => ({
            ...item,
            Latitude: item.Latitude ? parseFloat(item.Latitude.replace(',', '.')) : 0,
            Longitude: item.Longitude ? parseFloat(item.Longitude.replace(',', '.')) : 0,
        }))

        return { data: cleanedData, error: null }
    } catch (err) {
        return { data: null, error: "Connection failed" }
    }
}

/**
 * DEEP FETCH: Full row details.
 */
export async function getSampleDetails(id: string) {
    try {
        const supabase = await createClient()
        const { data, error } = await supabase
            .from('adna')
            .select('*')
            .eq('id', id)
            .single()

        if (error) {
            console.error("Detail Fetch Error:", error.message)
            return { data: null, error: error.message }
        }

        return { data: data as AdnaRow, error: null }
    } catch (err) {
        return { data: null, error: "Critical server error" }
    }
}