// apps/dashboard/src/lib/supabase.ts
// Secure Supabase Client Initialization for AURIX Dashboard PWA

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://widxmdxquqzkkbpmwtrg.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndpZHhtZHhxdXF6a2ticG13dHJnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY2Nzk2NzIsImV4cCI6MjA2MjI1NTY3Mn0.XfP_Q2pY9c7T3pL_4Pq1m8N5w2E_Z9X0R4Y7Q6P8M3I';

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('[AURIX Critical Error] Missing Supabase Client Environment Variables.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
