import { createClient } from "@supabase/supabase-js";
import "dotenv/config";

// Satu koneksi Supabase dipakai bersama oleh semua model.
// API memerlukan service role untuk operasi tulis; kunci ini hanya ada di server.
const supabase = createClient(
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY
);

export default supabase;
