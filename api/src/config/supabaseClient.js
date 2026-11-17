import { createClient } from "@supabase/supabase-js";
import "dotenv/config";

// Satu koneksi Supabase dipakai bersama oleh semua model.
// Nama lain diterima karena integrasi Supabase di Vercel mengisi SUPABASE_ANON_KEY.
const supabase = createClient(
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_PUBLISHABLE_KEY
);

export default supabase;
