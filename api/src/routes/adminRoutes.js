import { Router, json } from "express";
import { createHmac, randomUUID } from "node:crypto";
import { failAuth, readCredentials, requestAuth } from "../auth.js";
import { matchesSecret } from "../middleware/requireAdmin.js";
import categoryRoutes from "./categoryRoutes.js";
import recipeRoutes from "./recipeRoutes.js";
import tipRoutes from "./tipRoutes.js";
import uploadRoutes from "./uploadRoutes.js";

const router = Router();
const lifetime = 60 * 60 * 1000;
const cookie = "ngesrep_admin";
const cookieOptions = (req) => ({
  httpOnly: true, sameSite: "strict", secure: Boolean(process.env.VERCEL) || req.secure, path: "/api/admin",
});
const signature = (value, key) => createHmac("sha256", key).update(`ngesrep-admin-account:${value}`).digest("base64url");

router.use((req, res, next) => {
  res.set("Cache-Control", "no-store");
  const origin = req.get("origin");
  const allowed = (process.env.ADMIN_ORIGIN || (process.env.VERCEL
    ? "https://ngesrep.vercel.app,https://ngesrep-pwa.vercel.app"
    : `http://localhost:${process.env.PORT || 3000}`)).split(",").map((s) => s.trim());
  if (["POST", "PUT", "DELETE"].includes(req.method) && !allowed.includes(origin)) {
    return res.status(403).json({ error: "Buka Kelola Katalog dari alamat NGESREP yang resmi." });
  }
  const key = process.env.ADMIN_API_KEY;
  if (!key?.trim()) return res.status(503).json({ error: "Akses admin belum dikonfigurasi." });
  res.locals.adminKey = key;
  next();
});

const jsonBody = json({ limit: "32kb" });
router.post("/session", jsonBody, async (req, res) => {
  if (!req.is("application/json")) return res.status(415).json({ error: "Gunakan application/json" });
  const credentials = readCredentials(req.body);
  if (!credentials) return res.status(400).json({ error: "Periksa email dan password." });
  const auth = requestAuth();
  if (!auth) return res.status(503).json({ error: "Layanan akun belum dikonfigurasi." });
  const { data, error } = await auth.signInWithPassword(credentials);
  if (error) return failAuth(res, error, error.code === "email_not_confirmed"
    ? "Konfirmasi email sebelum masuk." : "Email atau password salah.");
  const user = data.user;
  if (!data.session || !user?.id || !user.email_confirmed_at || user.app_metadata?.role !== "admin") {
    return res.status(401).json({ error: "Akun ini tidak memiliki akses admin." });
  }
  const key = res.locals.adminKey;
  // shortcut: role checked at login; check it per request if immediate revocation is required.
  const identity = Buffer.from(JSON.stringify({ id: user.id, email: user.email })).toString("base64url");
  const value = `${Date.now() + lifetime}.${randomUUID()}.${identity}`;
  res.cookie(cookie, `${value}.${signature(value, key)}`, { ...cookieOptions(req), maxAge: lifetime });
  res.sendStatus(204);
});

router.delete("/session", (req, res) => res.clearCookie(cookie, cookieOptions(req)).sendStatus(204));

router.use((req, res, next) => {
  const token = (req.get("cookie") || "").split(";").map((part) => part.trim())
    .find((part) => part.startsWith(`${cookie}=`))?.slice(cookie.length + 1);
  const [expires, nonce, identity, mac, extra] = token?.split(".") || [];
  if (!/^\d{13}$/.test(expires) || Number(expires) <= Date.now() || !nonce || !identity || extra !== undefined ||
      !matchesSecret(mac, signature(`${expires}.${nonce}.${identity}`, res.locals.adminKey))) {
    return res.status(401).json({ error: "Sesi admin berakhir. Masuk kembali." });
  }
  res.locals.admin = JSON.parse(Buffer.from(identity, "base64url").toString());
  next();
});

router.get("/session", (_req, res) => res.json({ email: res.locals.admin.email }));
router.use("/upload", uploadRoutes);
router.use(jsonBody, (req, res, next) => {
  if (["POST", "PUT"].includes(req.method) &&
      (!req.body || typeof req.body !== "object" || Array.isArray(req.body))) {
    return res.status(400).json({ error: "Body harus berupa objek JSON" });
  }
  next();
});
router.use("/categories", categoryRoutes);
router.use("/recipes", recipeRoutes);
router.use("/tips", tipRoutes);
router.use((_req, res) => res.status(404).json({ error: "Endpoint tidak ditemukan" }));
router.use((err, _req, res, next) => {
  if (err.status === 413) return res.status(413).json({ error: "Ukuran unggahan maksimal 2 MB (data formulir maksimal 32 KB)." });
  next(err);
});

export default router;
