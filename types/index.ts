import z from "zod";
import { signinSchema, signupSchema } from "./schemas";
import { Database, Tables } from "./database.types";

export type SignupValues = z.infer<typeof signupSchema>

export type SigninValues = z.infer<typeof signinSchema>

export type Sample = Tables<'adna'>

/** Samples returned by getMapSamples – coords parsed to numbers */
export type MapSample = Omit<Sample, 'Latitude' | 'Longitude' | 'Mean'> & {
    Latitude: number
    Longitude: number
    Mean: number
}

export type MapMode = 'neutral' | 'ydna' | 'distance'

export type MapTheme = 'Standard' | 'Light-V11' | 'Dark-V11'