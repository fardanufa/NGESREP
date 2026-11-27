import { Router } from "express";
import { createClient } from "@supabase/supabase-js";
import favoriteRoutes from "./favoriteRoutes.js";

const router = Router();
const path = "/api/auth";
const week = 7 * 24 * 60 * 60 * 1000;
const access = "ngesrep_access";
const refresh = "ngesrep_refresh";
const cookieOptions = (req) => ({
  path, httpOnly: true, secure: Boolean(process.env.VERCEL) || req.secure, sameSite: "strict",
});
const cookie = (req, name) => (req.get("cookie") || "").split(";")
  .map((part) => part.trim()).find((part) => part.startsWith(`${name}=`))?.slice(name.length + 1);

function fail(res, error, message, status = 401) {
  if (error?.status === 429) return res.status(429).json({ error: "Terlalu banyak percobaan. Coba lagi nanti." });
  if (error && (!error.status || error.status >= 500)) {
    console.error(error);
    return res.status(503).json({ error: "Layanan akun belum tersedia. Coba lagi nanti." });
  }
  return res.status(status).json({ error: message });
}

function sendSession(req, res, session, status = 200) {
  const options = cookieOptions(req);
  res.cookie(access, session.access_token, { ...options, maxAge: session.expires_in * 1000 });
  res.cookie(refresh, session.refresh_token, { ...options, maxAge: week });
  return res.status(status).json({ id: session.user.id, email: session.user.email });
}

router.use((req, res, next) => {
  res.set("Cache-Control", "no-store");
  if (req.method === "POST" && !req.is("application/json")) {
    return res.status(415).json({ error: "Gunakan application/json" });
  }
  const key = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY;
  if (!key) return res.status(503).json({ error: "Layanan akun belum dikonfigurasi." });
  // A request-scoped client keeps user sessions out of the shared catalog client.
  res.locals.auth = createClient(process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL, key, {
    auth: { persistSession: false, autoRefreshToken: false, flowType: "pkce" },
  }).auth;
  next();
});

for (const action of ["login", "register"]) {
  router.post(`/${action}`, async (req, res) => {
    const { email, password } = req.body || {};
    const registering = action === "register";
    if (typeof email !== "string" || email.length > 254 || !/^[^\s@]+@[^\s@]+$/.test(email.trim()) ||
        typeof password !== "string" || password.length > 256 || password.length < (registering ? 6 : 1)) {
      return res.status(400).json({ error: "Periksa email dan password." });
    }
    const auth = res.locals.auth;
    const credentials = { email: email.trim(), password };
    const { data, error } = await (registering ? auth.signUp(credentials) : auth.signInWithPassword(credentials));
    if (error) return fail(res, error, registering ? "Pendaftaran gagal. Periksa email dan password." :
      error.code === "email_not_confirmed" ? "Konfirmasi email sebelum masuk." : "Email atau password salah.", registering ? 400 : 401);
    if (data.session) return sendSession(req, res, data.session, registering ? 201 : 200);
    if (!registering) return fail(res, null, "Sesi tidak tersedia.");
    return res.status(201).json({ needsConfirmation: true });
  });
}

async function requireUser(req, res, next) {
  const token = cookie(req, access);
  if (!token) return fail(res, null, "Silakan masuk.");
  const { data, error } = await res.locals.auth.getUser(token);
  if (error || !data.user) return fail(res, error, "Sesi berakhir.");
  res.locals.user = data.user;
  next();
}

router.get("/me", requireUser, (_req, res) => {
  const { id, email } = res.locals.user;
  res.json({ id, email });
});
router.use("/favorites", requireUser, favoriteRoutes);

router.post("/refresh", async (req, res) => {
  const token = cookie(req, refresh);
  if (!token) return fail(res, null, "Silakan masuk.");
  const { data, error } = await res.locals.auth.refreshSession({ refresh_token: token });
  if (error || !data.session) return fail(res, error, "Sesi berakhir.");
  return sendSession(req, res, data.session);
});

router.post("/logout", async (req, res) => {
  const auth = res.locals.auth;
  const token = cookie(req, refresh);
  let jwt = cookie(req, access);
  if (!jwt && token) {
    const { data, error } = await auth.refreshSession({ refresh_token: token });
    if (error && ![400, 401, 403].includes(error.status)) console.error(error);
    jwt = data.session?.access_token;
  }
  if (jwt) {
    const { error } = await auth.admin.signOut(jwt, "local");
    if (error && ![401, 403, 404].includes(error.status)) console.error(error);
  }
  // Cookie tetap dibersihkan walau layanan akun gagal, supaya sesi lokal bisa diakhiri.
  res.clearCookie(access, cookieOptions(req));
  res.clearCookie(refresh, cookieOptions(req));
  res.sendStatus(204);
});

export default router;
