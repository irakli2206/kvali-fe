"use client"

import * as React from 'react'
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
    Field as UIField,
    FieldDescription,
    FieldGroup,
    FieldLabel,
    FieldSeparator,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { useForm } from "@tanstack/react-form"
import { zodValidator } from '@tanstack/zod-form-adapter'
import { z } from 'zod'
import { toast } from "sonner"
import { signupSchema } from '@/types/schemas'
import { signup } from '@/app/(auth)/actions'
import { useRouter } from 'next/navigation'

export function SignupForm({
    className,
    ...props
}: React.ComponentProps<"div">) {
    const router = useRouter()


    const form = useForm({
        // 2. Add the adapter here so TanStack knows how to use Zod
        //@ts-ignore
        validatorAdapter: zodValidator(),
        defaultValues: {
            email: "",
            password: "",
            confirmPassword: "",
        },
        validators: {
            onChange: signupSchema, // Validates as they type
        },
        onSubmit: async ({ value }) => {
            try {
                const result = await signup(value)
                console.log(result)
                // If the action returns an error object (instead of redirecting)
                if (result?.error) {
                    toast.error(result.error)
                    return
                }

                if (result?.success) {
                    // This happens client-side, keeping the UI responsive
                    router.push('/app')
                    router.refresh() // Ensures the layout sees the new session
                }
            } catch (err) {
                // This catches unexpected network errors
                toast.error("Something went wrong. Please try again.")
            }
        },
    })

    return (
        <div className={cn("flex flex-col gap-6", className)} {...props}>
            <Card className="overflow-hidden p-0 shadow-none rounded-sm">
                <CardContent className="grid p-0 md:grid-cols-2">
                    <form
                        className="p-6 md:p-8"
                        onSubmit={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            form.handleSubmit()
                        }}
                    >
                        <FieldGroup>
                            <div className="flex flex-col items-center gap-2 text-center">
                                <h1 className="text-2xl font-medium">Create your account</h1>
                                <p className="text-muted-foreground text-sm text-balance">
                                    Enter your email below to create your account
                                </p>
                            </div>

                            {/* Email Field */}
                            <form.Field
                                name="email"
                                children={(field) => (
                                    <UIField className='gap-1'>
                                        <FieldLabel htmlFor={field.name}>Email</FieldLabel>
                                        <Input
                                            id={field.name}
                                            type="email"
                                            value={field.state.value}
                                            onBlur={field.handleBlur}
                                            onChange={(e) => field.handleChange(e.target.value)}
                                            placeholder="m@example.com"
                                        />
                                        {field.state.meta.isTouched && field.state.meta.errors.length ? (
                                            <p className="text-xs text-destructive">
                                                {field.state.meta.errors[0]?.message}
                                            </p>
                                        ) : null}
                                    </UIField>
                                )}
                            />

                            {/* Password Fields Row */}
                            <div className="grid grid-cols-2 gap-4">
                                <form.Field
                                    name="password"
                                    children={(field) => (
                                        <UIField className='gap-1'>
                                            <FieldLabel htmlFor={field.name}>Password</FieldLabel>
                                            <Input
                                                id={field.name}
                                                type="password"
                                                value={field.state.value}
                                                onBlur={field.handleBlur}
                                                onChange={(e) => field.handleChange(e.target.value)}
                                            />
                                            {field.state.meta.isTouched && field.state.meta.errors.length ? (
                                                <p className="text-xs text-destructive">
                                                    {field.state.meta.errors[0]?.message}
                                                </p>
                                            ) : null}
                                        </UIField>
                                    )}
                                />
                                <form.Field
                                    name="confirmPassword"
                                    children={(field) => (
                                        <UIField className='gap-1'>
                                            <FieldLabel htmlFor={field.name}>Confirm</FieldLabel>
                                            <Input
                                                id={field.name}
                                                type="password"
                                                value={field.state.value}
                                                onBlur={field.handleBlur}
                                                onChange={(e) => field.handleChange(e.target.value)}
                                            />
                                            {field.state.meta.isTouched && field.state.meta.errors.length ? (
                                                <p className="text-xs text-destructive">
                                                    {field.state.meta.errors[0]?.message}
                                                </p>
                                            ) : null}
                                        </UIField>
                                    )}
                                />
                            </div>

                            <form.Subscribe
                                selector={(state) => [state.canSubmit, state.isSubmitting]}
                                children={([canSubmit, isSubmitting]) => (
                                    <Button type="submit" className="w-full" disabled={!canSubmit}>
                                        {isSubmitting ? "Creating..." : "Create Account"}
                                    </Button>
                                )}
                            />

                            <FieldSeparator>Or continue with</FieldSeparator>

                            {/* ... Social buttons same as before ... */}
                            <div className="grid grid-cols-3 gap-4">
                                <Button variant="outline" type="button">Apple</Button>
                                <Button variant="outline" type="button">Google</Button>
                                <Button variant="outline" type="button">Meta</Button>
                            </div>

                            <FieldDescription className="text-center">
                                Already have an account? <a href="/signin" className="underline">Sign in</a>
                            </FieldDescription>
                        </FieldGroup>
                    </form>

                    <div className="bg-muted relative hidden md:block">
                        <img
                            src="https://img.freepik.com/premium-photo/png-long-coil-spring-shape-spiral-coil-white-background_53876-1096367.jpg?w=1480"
                            alt="Image"
                            className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
                        />
                    </div>
                </CardContent>
            </Card>
            <FieldDescription className="px-6 text-center">
                By clicking continue, you agree to our <a href="#">Terms of Service</a>{" "}
                and <a href="#">Privacy Policy</a>.
            </FieldDescription>
        </div>
    )
}