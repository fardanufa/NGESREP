import { createClient } from "@supabase/supabase-js";

export function requestAuth() {
  const key = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY;
  if (!key) return null;
  // Never store a user's session in the shared catalog client.
  return createClient(process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL, key, {
    auth: { persistSession: false, autoRefreshToken: false, flowType: "pkce" },
  }).auth;
}

export function readCredentials(body, minPasswordLength = 1) {
  const { email, password } = body || {};
  if (typeof email !== "string" || email.length > 254 || !/^[^\s@]+@[^\s@]+$/.test(email.trim()) ||
      typeof password !== "string" || password.length > 256 || password.length < minPasswordLength) return null;
  return { email: email.trim(), password };
}

export function failAuth(res, error, message, status = 401) {
  if (error?.status === 429) return res.status(429).json({ error: "Terlalu banyak percobaan. Coba lagi nanti." });
  if (error && (!error.status || error.status >= 500)) {
    console.error("Layanan auth gagal", error.status, error.code);
    return res.status(503).json({ error: "Layanan akun belum tersedia. Coba lagi nanti." });
  }
  return res.status(status).json({ error: message });
}
