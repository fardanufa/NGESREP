import { API_BASE_URL } from "./config.js";
import { toast } from "./ui.js";

// Semua permintaan ke API lewat helper ini.

const CACHE_PREFIX = "ngesrep_cache";

async function request(path, id, signal) {
  const key = CACHE_PREFIX + path;
  const label = path.startsWith("/api/tips") ? "title" : "name";
  const row = (item) => typeof item?.id === "string" && typeof item[label] === "string";
  const valid = (data) => id === undefined ? Array.isArray(data) && data.every(row) : row(data) && data.id.toLowerCase() === id.toLowerCase();
  let res;
  try {
    res = await fetch(`${API_BASE_URL}${path}`, { signal });
  } catch (err) {
    if (signal?.aborted) throw err;
    try {
      const cached = JSON.parse(localStorage.getItem(key));
      if (valid(cached)) {
        toast("Kamu sedang offline. Menampilkan data tersimpan.");
        return cached;
      }
    } catch {
      // Penyimpanan tidak tersedia atau isinya rusak.
    }
    throw err;
  }
  if (!res.ok) {
    if ([404, 410].includes(res.status)) {
      try { localStorage.removeItem(key); } catch { /* Penyimpanan opsional. */ }
    }
    throw Object.assign(new Error("Gagal memuat data"), { status: res.status });
  }
  const body = await res.json();
  if (!valid(body)) throw new Error("Format data API tidak valid");
  signal?.throwIfAborted();
  try { localStorage.setItem(key, JSON.stringify(body)); } catch { /* Data tetap tersedia online. */ }
  return body;
}

export const getCategories = () => request("/api/categories");
export const getRecipes = () => request("/api/recipes");
export const getRecipe = (id, signal) => request(`/api/recipes/${encodeURIComponent(id)}`, id, signal);
export const getTips = (signal) => request("/api/tips", undefined, signal);
export const getTip = (id, signal) => request(`/api/tips/${encodeURIComponent(id)}`, id, signal);
