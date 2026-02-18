// ============================================
// Supabase Client Configuration
// ============================================
// Replace these with your Supabase project credentials.
// Get them from: https://supabase.com → Project Settings → API

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://bljgzzmnbcetnmojnqye.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJsamd6em1uYmNldG5tb2pucXllIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEzOTU0MjcsImV4cCI6MjA4Njk3MTQyN30.KNHWYgxLp4MgxtwNp2VsN0zx0G3hnGJD85DlrjPNnX8'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

/**
 * Check if Supabase is properly configured (not using placeholder values).
 */
export function isSupabaseConfigured() {
    return !SUPABASE_URL.includes('YOUR_PROJECT_ID') && !SUPABASE_ANON_KEY.includes('YOUR_ANON_KEY')
}
