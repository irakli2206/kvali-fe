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

        const csvSize = Buffer.byteLength(data);

        console.log(`CSV size: ${(csvSize / 1024).toFixed(2)} KB`);

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
        target_g25: sample.g25_string
    });
    console.log('error', error)
    return data
}