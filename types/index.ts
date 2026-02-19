import z from "zod";
import { signinSchema, signupSchema } from "./schemas";
import { Tables } from "./database.types";

export type SignupValues = z.infer<typeof signupSchema>

export type SigninValues = z.infer<typeof signinSchema>

export type Sample = Tables<'dna'>

/** Samples returned by getMapSamples – coords parsed to numbers */
export type MapSample = Omit<Sample, 'latitude' | 'longitude' | 'mean_bp'> & {
    latitude: number
    longitude: number
    mean_bp: number
}

export type MapMode = 'neutral' | 'ydna' | 'distance'

export type SampleFilter = 'all' | 'ancient' | 'modern'

export type MapTheme = 'Standard' | 'Light-V11' | 'Dark-V11'
