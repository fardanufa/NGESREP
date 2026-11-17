import supabase from "../config/supabaseClient.js";

// Resep selalu diambil bersama nama kategorinya.
const SELECT = "*, categories(name)";

export function findAll({ categoryId, search } = {}) {
  let query = supabase.from("recipes").select(SELECT).order("created_at", { ascending: false });

  if (categoryId) query = query.eq("category_id", categoryId);
  if (search) query = query.ilike("name", `%${search}%`);

  return query;
}

export function findById(id) {
  return supabase.from("recipes").select(SELECT).eq("id", id).maybeSingle();
}

export function create(payload) {
  return supabase.from("recipes").insert(payload).select(SELECT).single();
}

export function update(id, payload) {
  return supabase.from("recipes").update(payload).eq("id", id).select(SELECT).maybeSingle();
}

export function remove(id) {
  return supabase.from("recipes").delete().eq("id", id).select("id").maybeSingle();
}
