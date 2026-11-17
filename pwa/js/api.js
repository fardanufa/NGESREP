import { API_BASE_URL } from "./config.js";
import { toast } from "./ui.js";

// Semua permintaan ke API lewat helper ini.

const CACHE_PREFIX = "ngesrep_cache";

async function request(path) {
  try {
    const res = await fetch(`${API_BASE_URL}${path}`);
    const body = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw Object.assign(new Error(body.error || "Gagal memuat data"), { status: res.status });
    }

    localStorage.setItem(CACHE_PREFIX + path, JSON.stringify(body));
    return body;
  } catch (err) {
    // Hanya kegagalan jaringan (bukan 404/500) yang memakai data tersimpan.
    const saved = localStorage.getItem(CACHE_PREFIX + path);
    if (err.status === undefined && saved) {
      toast("Kamu sedang offline. Menampilkan data tersimpan.");
      return JSON.parse(saved);
    }
    throw err;
  }
}

export const getCategories = () => request("/api/categories");
export const getRecipes = () => request("/api/recipes");
export const getRecipe = (id) => request(`/api/recipes/${encodeURIComponent(id)}`);
export const getTips = () => request("/api/tips");
export const getTip = (id) => request(`/api/tips/${encodeURIComponent(id)}`);
