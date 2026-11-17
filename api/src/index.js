import express from "express";
import cors from "cors";
import categoryRoutes from "./routes/categoryRoutes.js";
import recipeRoutes from "./routes/recipeRoutes.js";
import tipRoutes from "./routes/tipRoutes.js";

const app = express();

// CORS dan parser JSON harus dipasang sebelum route.
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ message: "API NGESREP berjalan" });
});

app.use("/api/categories", categoryRoutes);
app.use("/api/recipes", recipeRoutes);
app.use("/api/tips", tipRoutes);

export default app;

// Di Vercel, server dijalankan oleh platform (bukan app.listen).
if (!process.env.VERCEL) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => console.log(`API NGESREP jalan di http://localhost:${PORT}`));
}
