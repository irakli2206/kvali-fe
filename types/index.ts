import z from "zod";
import { signinSchema, signupSchema } from "./schemas";
import { Database, Tables } from "./database.types";

export type SignupValues = z.infer<typeof signupSchema>

export type SigninValues = z.infer<typeof signinSchema>

export type Sample = Tables<'adna'>