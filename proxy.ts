import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/proxy'

export async function proxy(request: NextRequest) {
    // 1. Let the helper handle session refreshing first
    const response = await updateSession(request)

    // 2. Define our paths
    const { pathname } = request.nextUrl
    const isAuthPage = pathname === '/signin' || pathname === '/signup'
    const isAppPage = pathname.startsWith('/app')

    // 3. Identify if a user session exists via cookies
    // Note: Supabase cookies usually start with 'sb-'
    const supabaseCookie = request.cookies.getAll().find(c => c.name.includes('-auth-token'))
    const hasSession = !!supabaseCookie

    // LOGIC A: If logged in, don't let them see signin/signup
    // if (hasSession && isAuthPage) {
    //     return NextResponse.redirect(new URL('/app', request.url))
    // }

    // // LOGIC B: If NOT logged in, don't let them see the app
    // if (!hasSession && isAppPage) {
    //     return NextResponse.redirect(new URL('/signin', request.url))
    // }

    return response
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}