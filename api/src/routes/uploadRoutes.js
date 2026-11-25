import { Router, raw } from "express";
import { randomUUID } from "node:crypto";
import supabase from "../config/supabaseClient.js";

const router = Router();

const bucket = "resep";
const images = {
  "image/jpeg": ["jpg", (bytes) => bytes.subarray(0, 3).equals(Buffer.from([255, 216, 255]))],
  "image/png": ["png", (bytes) => bytes.subarray(0, 8).equals(Buffer.from("89504e470d0a1a0a", "hex"))],
  "image/webp": ["webp", (bytes) => bytes.toString("ascii", 0, 4) === "RIFF" && bytes.toString("ascii", 8, 12) === "WEBP"],
};

router.post("/", raw({ type: Object.keys(images), limit: "2mb", inflate: false }), async (req, res) => {
  const type = Object.keys(images).find((mime) => req.is(mime));
  if (!type) return res.status(415).json({ error: "Gunakan gambar JPEG, PNG, atau WebP." });
  const [extension, validHeader] = images[type];
  if (!Buffer.isBuffer(req.body) || !validHeader(req.body)) {
    return res.status(400).json({ error: "Isi file tidak cocok dengan format gambar." });
  }
  const storage = supabase.storage.from(bucket);
  const path = `katalog/${randomUUID()}.${extension}`;
  const { error } = await storage.upload(path, req.body, { contentType: type, upsert: false });
  if (error) {
    console.error("Gagal unggah gambar katalog", error.statusCode);
    return res.status(502).json({ error: "Penyimpanan gambar belum tersedia. Coba lagi nanti." });
  }
  res.status(201).json({ image_url: storage.getPublicUrl(path).data.publicUrl });
});

export default router;
