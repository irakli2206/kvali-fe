"use server"

import { createClient } from '@/lib/supabase/server'
import { Sample } from '@/types'
import { Tables } from '@/types/database.types'
import Papa from 'papaparse';


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
                "Y-Symbol",
                Mean
            `)
            .not('g25_string', 'is', null)
            .csv()

        //@ts-ignore
        const sizeBytes = new Blob([data]).size
        console.log('getMapSamples response:', (sizeBytes / 1024).toFixed(1), 'KB')

        if (error) {
            console.error("Map Fetch Error:", error.message)
            return { data: null, error: error.message }
        }

        const parsed: Papa.ParseResult<Sample> = Papa.parse(data, {
            header: true,
            dynamicTyping: false, // Turn this OFF to keep everything as strings for cleaning
            skipEmptyLines: true
        });


        const cleanedData = parsed.data.map((item) => {
            // Helper to handle comma vs dot and force to number
            const parseCoord = (val: string) => {
                if (!val) return 0;
                const normalized = String(val).replace(',', '.');
                return parseFloat(normalized) || 0;
            };

            return {
                ...item,
                Latitude: parseCoord(item.Latitude as string),
                Longitude: parseCoord(item.Longitude as string),
                Mean: parseCoord(item.Mean as string) // Fix Mean while you're at it
            };
        });

        return { data: cleanedData, error: null }
    } catch (err) {
        console.error("Critical Parse Error:", err);
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

        const sizeBytes = new Blob([data]).size
        console.log('getSampleDetails response:', (sizeBytes / 1024).toFixed(1), 'KB')

        if (error) {
            console.error("Detail Fetch Error:", error.message)
            return { data: null, error: error.message }
        }

        return { data: data as AdnaRow, error: null }
    } catch (err) {
        return { data: null, error: "Critical server error" }
    }
}

export async function calculateDistances(sample: Sample) {
    const supabase = await createClient()
    const { data, error } = await supabase.rpc('calculate_distances', {
        //@ts-ignore
        target_vector: sample.g25_vector
    });

    const sizeBytes = new Blob([data]).size
    console.log('calculateDistances response:', (sizeBytes / 1024).toFixed(1), 'KB')

    console.log('error', error)
    return data
}

export async function calculateDistancesFromVector(vector: number[]) {
    const supabase = await createClient()
    const { data, error } = await supabase.rpc('calculate_distances', {
        //@ts-ignore
        target_vector: vector
    });
    const sizeBytes = new Blob([data]).size
    console.log('calculateDistancesFromVector response:', (sizeBytes / 1024).toFixed(1), 'KB')

    if (error) console.error('calculateDistancesFromVector error:', error)
    return data
}