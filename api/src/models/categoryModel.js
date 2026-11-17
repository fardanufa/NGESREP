import supabase from "../config/supabaseClient.js";

// Model hanya memanggil Supabase dan mengembalikan { data, error }.

export function findAll() {
  return supabase.from("categories").select("*").order("name");
}

export function findById(id) {
  return supabase.from("categories").select("*").eq("id", id).maybeSingle();
}

export function create(payload) {
  return supabase.from("categories").insert(payload).select().single();
}

export function update(id, payload) {
  return supabase.from("categories").update(payload).eq("id", id).select().maybeSingle();
}

export function remove(id) {
  return supabase.from("categories").delete().eq("id", id).select("id").maybeSingle();
}
