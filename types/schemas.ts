import { z } from 'zod'

export const signinSchema = z.object({
    email: z.email({ message: "Must be a valid email address" }),
    password: z
        .string()
        .min(1, { message: "Password is required" }),
})

export const signupSchema = z.object({
    email: z.email("Please enter a valid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(8, "Please confirm your password"),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
})