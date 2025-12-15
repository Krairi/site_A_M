import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://revavxhjqirfroqfezld.supabase.co';
// API Key provided by user (Note: In production, ensure RLS is strictly configured)
const supabaseKey = 'sb_publishable_Y0eubpFNKqe0_9mhxjVuqw_ALRsbPMe';

export const supabaseClient = createClient(supabaseUrl, supabaseKey);