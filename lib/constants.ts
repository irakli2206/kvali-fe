// lib/constants.ts

/**
 * Supabase Configuration
 */
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://igobxrcwhrlhqkimopqf.supabase.co';
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || '';

/**
 * OAuth Configuration
 */
export const GOOGLE_OAUTH_ID = process.env.NEXT_SUPABASE_GOOGLE_OAUTH_ID || 'Kvali';
// Note: Secret should ideally stay on the server side only!
export const GOOGLE_OAUTH_SECRET = process.env.NEXT_SUPABASE_GOOGLE_OAUTH_SECRET || '';

/**
 * App Routing & Domain Configuration
 * * We use a fallback to localhost for development, but in production 
 * it will use your 'kvali.com' domain.
 */
export const APP_URL =
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : 'https://kvali.com');

/**
 * Auth Cookie Configuration
 * Used for cross-subdomain support if you switch later.
 */
export const COOKIE_DOMAIN = process.env.NEXT_PUBLIC_COOKIE_DOMAIN || '.kvali.com';