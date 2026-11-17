import { createClient } from "@supabase/supabase-js";
import "dotenv/config";

// Satu koneksi Supabase dipakai bersama oleh semua model.
// Kunci service role dipakai karena RLS aktif dan API ini yang menangani tulis (key hanya di server).
// Nama lain diterima karena integrasi Supabase di Vercel mengisi variabel-variabel tersebut.
const supabase = createClient(
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.SUPABASE_PUBLISHABLE_KEY
);

export default supabase;
