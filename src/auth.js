// ============================================
// Authentication Logic
// ============================================

import { supabase, isSupabaseConfigured } from './supabase.js'

/**
 * Sign up a new user with email and password.
 */
export async function signUp(email, password) {
    if (!isSupabaseConfigured()) {
        return { error: { message: 'Supabase is not configured. Please add your credentials to src/supabase.js' } }
    }
    const { data, error } = await supabase.auth.signUp({ email, password })
    return { data, error }
}

/**
 * Sign in with email and password.
 */
export async function signIn(email, password) {
    if (!isSupabaseConfigured()) {
        return { error: { message: 'Supabase is not configured. Please add your credentials to src/supabase.js' } }
    }
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    return { data, error }
}

/**
 * Sign out the current user.
 */
export async function signOut() {
    if (!isSupabaseConfigured()) {
        window.location.href = import.meta.env.BASE_URL + 'login.html'
        return
    }
    await supabase.auth.signOut()
    window.location.href = import.meta.env.BASE_URL + 'login.html'
}

/**
 * Get the current session.
 */
export async function getSession() {
    if (!isSupabaseConfigured()) return null
    const { data: { session } } = await supabase.auth.getSession()
    return session
}

/**
 * Get current user.
 */
export async function getUser() {
    const session = await getSession()
    return session?.user || null
}

/**
 * Redirect to dashboard if already logged in.
 * Call this on login/signup pages.
 */
export async function redirectIfLoggedIn() {
    const session = await getSession()
    if (session) {
        window.location.href = import.meta.env.BASE_URL
    }
}

/**
 * Redirect to login if NOT logged in.
 * Call this on protected pages (dashboard).
 */
export async function requireAuth() {
    if (!isSupabaseConfigured()) return null // Allow access without auth if not configured
    const session = await getSession()
    if (!session) {
        window.location.href = import.meta.env.BASE_URL + 'login.html'
        return null
    }
    return session.user
}
