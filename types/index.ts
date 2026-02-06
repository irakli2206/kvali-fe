import z from "zod";
import { signinSchema, signupSchema } from "./schemas";

export type SignupValues = z.infer<typeof signupSchema>

export type SigninValues = z.infer<typeof signinSchema>