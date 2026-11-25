import { timingSafeEqual } from "node:crypto";

export function matchesSecret(supplied, expected) {
  if (typeof supplied !== "string") return false;
  const input = Buffer.from(supplied);
  const secret = Buffer.from(expected);
  return input.length === secret.length && timingSafeEqual(input, secret);
}

export function requireAdmin(req, res, next) {
  const key = process.env.ADMIN_API_KEY;
  if (!key?.trim()) return res.status(503).json({ error: "Akses tulis API belum dikonfigurasi" });

  const authorization = req.get("authorization") || "";
  if (!authorization.startsWith("Bearer ") || !matchesSecret(authorization.slice(7), key)) {
    return res.status(401).json({ error: "Otorisasi admin diperlukan" });
  }

  next();
}
