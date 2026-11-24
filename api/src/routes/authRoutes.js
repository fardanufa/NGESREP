import { Router } from "express";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY
);

const router = Router();

router.post("/login", async (req, res) => {
  const { email, password } = req.body || {};

  if (!email || !password) {
    return res.status(400).json({ error: "Email dan password wajib diisi" });
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return res.status(401).json({ error: error.message });
  }

  res.json({
    access_token: data.session.access_token,
    refresh_token: data.session.refresh_token,
    user: data.user,
  });
});

router.post("/register", async (req, res) => {
  const { email, password } = req.body || {};

  if (!email || !password) {
    return res.status(400).json({ error: "Email dan password wajib diisi" });
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) {
    return res.status(400).json({ error: error.message });
  }

  res.status(201).json({
    message: "Registrasi berhasil. Silakan cek email untuk verifikasi.",
    user: data.user,
  });
});

router.post("/refresh", async (req, res) => {
  const { refresh_token } = req.body || {};

  if (!refresh_token) {
    return res.status(400).json({ error: "Refresh token diperlukan" });
  }

  const { data, error } = await supabase.auth.refreshSession({
    refresh_token,
  });

  if (error) {
    return res.status(401).json({ error: error.message });
  }

  res.json({
    access_token: data.session.access_token,
    refresh_token: data.session.refresh_token,
    user: data.user,
  });
});

export default router;