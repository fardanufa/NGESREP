import supabase from "../config/supabaseClient.js";

export function findAll({ search } = {}) {
  let query = supabase.from("tips").select("*").order("created_at", { ascending: false });

  if (search) query = query.ilike("title", `%${search}%`);

  return query;
}

export function findById(id) {
  return supabase.from("tips").select("*").eq("id", id).maybeSingle();
}

export function create(payload) {
  return supabase.from("tips").insert(payload).select().single();
}

export function update(id, payload) {
  return supabase.from("tips").update(payload).eq("id", id).select().maybeSingle();
}

export function remove(id) {
  return supabase.from("tips").delete().eq("id", id).select("id").maybeSingle();
}
