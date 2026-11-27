import { Router, json } from "express";
import { requireUser } from "../auth.js";
import categoryRoutes from "./categoryRoutes.js";
import recipeRoutes from "./recipeRoutes.js";
import tipRoutes from "./tipRoutes.js";
import uploadRoutes from "./uploadRoutes.js";

const router = Router();

router.use((req, res, next) => {
  res.set("Cache-Control", "no-store");
  const origin = req.get("origin");
  const allowed = (process.env.ADMIN_ORIGIN || (process.env.VERCEL
    ? "https://ngesrep.vercel.app,https://ngesrep-pwa.vercel.app"
    : `http://localhost:${process.env.PORT || 3000}`)).split(",").map((s) => s.trim());
  if (!["GET", "HEAD", "OPTIONS"].includes(req.method) && !allowed.includes(origin)) {
    return res.status(403).json({ error: "Buka Beranda dari alamat NGESREP yang resmi." });
  }
  next();
});

router.use(requireUser, (_req, res, next) => {
  const user = res.locals.user;
  if (!user.email_confirmed_at || user.app_metadata?.role !== "admin") {
    return res.status(403).json({ error: "Akun ini tidak memiliki akses admin." });
  }
  next();
});

router.get("/session", (_req, res) => res.sendStatus(204));
router.use("/upload", uploadRoutes);
router.use(json({ limit: "32kb" }), (req, res, next) => {
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
