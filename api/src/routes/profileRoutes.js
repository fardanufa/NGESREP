import { Router, json } from "express";
import supabase from "../config/supabaseClient.js";

const router = Router();
const fields = "display_name,nim,avatar";

function validAvatar(value) {
  if (typeof value !== "string" || value.length > 64000 || !value.startsWith("data:image/jpeg;base64,")) return false;
  const encoded = value.slice("data:image/jpeg;base64,".length);
  const bytes = Buffer.from(encoded, "base64");
  return bytes.length > 4 && bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255 &&
    bytes.at(-2) === 255 && bytes.at(-1) === 217 && bytes.toString("base64") === encoded;
}

function sendProfile(res, { data, error }) {
  if (error) {
    console.error("Gagal mengakses profil", error.code);
    return res.status(503).json({ error: "Profil belum tersedia. Coba lagi nanti." });
  }
  const { id, email } = res.locals.user;
  res.json({ id, email, display_name: data?.display_name ?? "", nim: data?.nim ?? "", avatar: data?.avatar ?? null });
}

router.get("/", async (_req, res) => {
  sendProfile(res, await supabase.from("profiles").select(fields)
    .eq("user_id", res.locals.user.id).maybeSingle());
});

router.put("/", json({ limit: "66kb", inflate: false }), async (req, res) => {
  if (!req.is("application/json")) return res.status(415).json({ error: "Gunakan application/json." });
  const { id, display_name, nim, avatar } = req.body || {};
  if (id !== res.locals.user.id) {
    return res.status(409).json({ error: "Akun sudah berganti. Buka ulang halaman Profil." });
  }
  const name = typeof display_name === "string" ? display_name.trim() : "";
  if (!name || name.length > 60) return res.status(400).json({ error: "Nama tampilan harus berisi 1–60 karakter." });
  if (nim !== undefined && (typeof nim !== "string" || !/^[0-9]{0,30}$/.test(nim.trim()))) {
    return res.status(400).json({ error: "NIM hanya boleh berisi angka, maksimal 30 digit." });
  }
  if (avatar !== undefined && !validAvatar(avatar)) {
    return res.status(400).json({ error: "Foto profil tidak valid. Pilih foto lain." });
  }
  sendProfile(res, await supabase.from("profiles").upsert({
    user_id: res.locals.user.id, display_name: name,
    ...(nim !== undefined && { nim: nim.trim() || null }), ...(avatar !== undefined && { avatar }),
  }).select(fields).single());
});

export default router;
