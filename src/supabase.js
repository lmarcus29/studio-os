import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://tznwwthdpcdoomdvamvk.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR6bnd3dGhkcGNkb29tZHZhbXZrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzNDY2NjEsImV4cCI6MjA4ODkyMjY2MX0.m6pBgQEbwMuSWVO_lVtMLG0mLhkPkGftfsGMRqznzzo'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)