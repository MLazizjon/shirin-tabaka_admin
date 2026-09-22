import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://nysrqiamcvmnenwvrote.supabase.co';
const supabaseKey = 'sb_publishable_srp45e1YO8g1jQ2K7IR4Ww_l908Cjej';

export const supabase = createClient(supabaseUrl, supabaseKey);