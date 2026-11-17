import { timingSafeEqual } from "node:crypto";

export function requireAdmin(req, res, next) {
  const key = process.env.ADMIN_API_KEY;
  if (!key?.trim()) return res.status(503).json({ error: "Akses tulis API belum dikonfigurasi" });

  const authorization = req.get("authorization") || "";
  const supplied = Buffer.from(authorization.startsWith("Bearer ") ? authorization.slice(7) : "");
  const expected = Buffer.from(key);

  if (supplied.length !== expected.length || !timingSafeEqual(supplied, expected)) {
    return res.status(401).json({ error: "Otorisasi admin diperlukan" });
  }

  next();
}
