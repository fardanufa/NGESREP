import express from "express";
import { fileURLToPath } from "node:url";
import cors from "cors";
import categoryRoutes from "./routes/categoryRoutes.js";
import recipeRoutes from "./routes/recipeRoutes.js";
import tipRoutes from "./routes/tipRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import { requireAdmin } from "./middleware/requireAdmin.js";

const app = express();

// CORS dan parser JSON harus dipasang sebelum route.
app.use("/api/auth", authRoutes);
app.use(cors());
app.use("/api", (req, res, next) => {
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) return next();
  requireAdmin(req, res, next);
});
app.use(express.json());
app.use("/api", (req, res, next) => {
  if (["POST", "PUT"].includes(req.method) &&
      (!req.body || typeof req.body !== "object" || Array.isArray(req.body))) {
    return res.status(400).json({ error: "Body harus berupa objek JSON" });
  }
  next();
});

app.use("/api/categories", categoryRoutes);
app.use("/api/recipes", recipeRoutes);
app.use("/api/tips", tipRoutes);
app.use("/api", (req, res) => res.status(404).json({ error: "Endpoint tidak ditemukan" }));
if (!process.env.VERCEL) {
  app.use(express.static(fileURLToPath(new URL("../../pwa/", import.meta.url))));
}
app.get("/", (req, res) => res.json({ message: "API NGESREP berjalan" }));

app.use((err, req, res, next) => {
  if (res.headersSent) return next(err);
  const status = err.status || 500;
  if (status >= 500) console.error(err);
  res.status(status).json({ error: status < 500 ? "Permintaan tidak valid" : "Terjadi kesalahan server" });
});

export default app;

// Di Vercel, server dijalankan oleh platform (bukan app.listen).
if (!process.env.VERCEL) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => console.log(`API NGESREP jalan di http://localhost:${PORT}`));
}
