import { Router } from "express";
import { failAuth as fail, readCredentials, requestAuth } from "../auth.js";
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
  res.locals.auth = requestAuth();
  if (!res.locals.auth) return res.status(503).json({ error: "Layanan akun belum dikonfigurasi." });
  next();
});

for (const action of ["login", "register"]) {
  router.post(`/${action}`, async (req, res) => {
    const registering = action === "register";
    const credentials = readCredentials(req.body, registering ? 6 : 1);
    if (!credentials) return res.status(400).json({ error: "Periksa email dan password." });
    const auth = res.locals.auth;
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
