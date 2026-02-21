"use server"

import { createClient } from '@/lib/supabase/server'
import { Sample } from '@/types'
import Papa from 'papaparse';

const TABLE = 'dna'
const MAP_SAMPLES_LIMIT = 20_000

function bpToCE(bp: string | null | undefined): number {
    if (!bp) return 0
    const num = parseFloat(String(bp).replace(',', '.'))
    if (isNaN(num)) return 0
    return Math.round(1950 - num)
}

/**
 * THIN FETCH: All map data once (capped). Cached client-side; no refetch on pan/zoom.
 * Optimal for cost + performance + UX at this dataset size.
 */
export async function getMapSamples() {
    try {
        const supabase = await createClient()
        const { data, error } = await supabase
            .from(TABLE)
            .select(`
                id, 
                object_id,
                latitude, 
                longitude,
                culture,
                country,
                y_haplo,
                mean_bp
            `)
            .not('g25_string', 'is', null)
            .limit(MAP_SAMPLES_LIMIT)
            .csv()

        if (error) {
            console.error("Map Fetch Error:", error.message, error)
            return { data: null, error: error.message }
        }

        if (process.env.NODE_ENV === 'development') {
            //@ts-ignore
            const sizeBytes = new Blob([data]).size
            console.log('getMapSamples response:', (sizeBytes / 1024).toFixed(1), 'KB')
        }

        type MapRow = {
            id: string
            object_id: string
            latitude: string
            longitude: string
            culture: string
            country: string | null
            y_haplo: string
            mean_bp: string
        }

        const parsed: Papa.ParseResult<MapRow> = Papa.parse(data, {
            header: true,
            dynamicTyping: false,
            skipEmptyLines: true
        });

        const parseCoord = (val: string) => {
            if (!val) return 0;
            return parseFloat(String(val).replace(',', '.')) || 0;
        };

        const cleanedData = parsed.data.map((item) => ({
            ...item,
            latitude: parseCoord(item.latitude),
            longitude: parseCoord(item.longitude),
            mean_bp: parseCoord(item.mean_bp),
        }));

        return { data: cleanedData, error: null }
    } catch (err) {
        console.error("Critical Parse Error:", err);
        return { data: null, error: "Connection failed" }
    }
}

/** Columns needed for popup, distance calc, and map jump – avoids select('*') egress */
const SAMPLE_DETAIL_COLUMNS = 'id, object_id, culture, location, country, latitude, longitude, source, doi, mean_bp, date_method, sex, y_haplo, y_symbol, mt_haplo, snps_1240k, g25_string'

/**
 * Fetch sample details for popup/detail view. Selects only needed columns to reduce egress.
 */
export async function getSampleDetails(id: string) {
    try {
        const supabase = await createClient()
        const { data, error } = await supabase
            .from(TABLE)
            .select(SAMPLE_DETAIL_COLUMNS)
            .eq('id', id)
            .single()

        if (error) {
            console.error("Detail Fetch Error:", error.message)
            return { data: null, error: error.message }
        }

        return { data: data as Sample, error: null }
    } catch (err) {
        return { data: null, error: "Critical server error" }
    }
}

export async function calculateDistances(sample: Sample) {
    const supabase = await createClient()
    const { data, error } = await supabase.rpc('calculate_distances', {
        //@ts-ignore
        target_vector: sample.g25_string
    });

    if (error) console.error('calculateDistances error:', error)
    return data
}

export async function calculateDistancesFromVector(vector: number[]) {
    const supabase = await createClient()
    const { data, error } = await supabase.rpc('calculate_distances', {
        //@ts-ignore
        target_vector: vector
    });

    if (error) console.error('calculateDistancesFromVector error:', error)
    return data
}
