// Debug script to test Supabase connection
import { supabase } from './lib/supabase';

console.log('=== Supabase Debug Info ===');
console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL);
console.log('Supabase Key (first 20 chars):', import.meta.env.VITE_SUPABASE_ANON_KEY?.substring(0, 20));
console.log('Supabase client initialized:', !!supabase);

// Test connection
async function testSupabase() {
  try {
    const { data, error } = await supabase.auth.getSession();
    console.log('Session check:', { hasSession: !!data.session, error });
  } catch (err) {
    console.error('Connection test failed:', err);
  }
}

testSupabase();
