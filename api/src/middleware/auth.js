import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY
);

export async function requireAuth(req, res, next) {
  const authHeader = req.get("authorization") || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: "Token diperlukan" });
  }

  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) {
    return res.status(401).json({ error: "Token tidak valid atau sudah kadaluarsa" });
  }

  req.user = user;
  next();
}

export async function optionalAuth(req, res, next) {
  const authHeader = req.get("authorization") || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (token) {
    const { data: { user } } = await supabase.auth.getUser(token);
    if (user) req.user = user;
  }
  next();
}