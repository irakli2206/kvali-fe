'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

import { createClient } from '@/lib/supabase/server'
import { SigninValues, SignupValues } from '@/types'

export async function signin({ email, password }: SigninValues) {
    const supabase = await createClient()

    // type-casting here for convenience
    // in practice, you should validate your inputs
    const data = {
        email: email,
        password: password,
    }

    const { error } = await supabase.auth.signInWithPassword(data)

    if (error) {
        return { error: error.message }
    }

    return { success: true }
}

export async function signup({ email, password }: SignupValues) {
    const supabase = await createClient()

    const { data, error } = await supabase.auth.signUp({
        email: email,
        password: password,
        options: {
            // Use an environment variable or origin header for safety
            emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
        },
    })

    console.log(data)
    console.log(error)
    if (error) {
        return { error: error.message }
    }


    return { success: true }
}

export async function signout() {
    const supabase = await createClient()

    const { error } = await supabase.auth.signOut()

    if (error) {
        console.error('Error signing out:', error.message)
        // You could handle this more gracefully, but usually, 
        // we want to clear the local session anyway.
    }

    // Teleport them back to the landing page
    redirect('/')
}