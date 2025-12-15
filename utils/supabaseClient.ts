import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://drtryrfmqzkipvajwnhu.supabase.co';
// API Key provided by user (Note: In production, ensure RLS is strictly configured)
const supabaseKey = 'sb_publishable_AmtY9dAJk8FSqrMDsYV1jw_CTkC2Oy1';

export const supabaseClient = createClient(supabaseUrl, supabaseKey);