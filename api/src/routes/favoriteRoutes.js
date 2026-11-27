import { Router } from "express";
import supabase from "../config/supabaseClient.js";
import { validateId } from "../validation.js";

const router = Router();
router.param("id", validateId);

function unavailable(res, error) {
  console.error("Gagal mengakses favorit", error.code);
  return res.status(503).json({ error: "Favorit akun belum tersedia. Coba lagi nanti." });
}

router.get("/", async (_req, res) => {
  const userId = res.locals.user.id;
  const { data, error } = await supabase.from("favorites")
    .select("recipes(id,name,image_url,cook_time,cost_estimate)")
    .eq("user_id", userId).order("created_at", { ascending: false });
  if (error) return unavailable(res, error);
  res.json({ userId, favorites: data.map(({ recipes }) => recipes).filter(Boolean) });
});

router.use("/:id", (req, res, next) => {
  // Mencegah tab lama menulis ke akun lain setelah akun pada perangkat berganti.
  if (req.get("x-favorites-user") !== res.locals.user.id) {
    return res.status(409).json({ error: "Akun sudah berganti. Buka ulang halaman ini." });
  }
  next();
});

router.put("/:id", async (req, res) => {
  const { error } = await supabase.from("favorites").upsert(
    { user_id: res.locals.user.id, recipe_id: req.params.id },
    { onConflict: "user_id,recipe_id", ignoreDuplicates: true },
  );
  if (error?.code === "23503") return res.status(404).json({ error: "Resep tidak ditemukan." });
  if (error) return unavailable(res, error);
  res.sendStatus(204);
});

router.delete("/:id", async (req, res) => {
  const { error } = await supabase.from("favorites").delete()
    .eq("user_id", res.locals.user.id).eq("recipe_id", req.params.id);
  if (error) return unavailable(res, error);
  res.sendStatus(204);
});

export default router;
