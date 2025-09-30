import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Supabase URL or Service Role Key is not defined in .env');
}

// Client นี้มีสิทธิ์ระดับ Admin และต้องใช้บน Server เท่านั้น
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);