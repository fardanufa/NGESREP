import { API_BASE_URL } from "./config.js";
import { toast } from "./ui.js";

// Semua permintaan ke API lewat helper ini.

const CACHE_PREFIX = "ngesrep_cache";
const TOKEN_KEY = "ngesrep_access_token";
const REFRESH_KEY = "ngesrep_refresh_token";

function getAuthHeader() {
  const token = localStorage.getItem(TOKEN_KEY);
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function refreshAccessToken() {
  const refreshToken = localStorage.getItem(REFRESH_KEY);
  if (!refreshToken) throw new Error("Tidak ada refresh token");

  const res = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh_token: refreshToken }),
  });

  if (!res.ok) {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_KEY);
    throw new Error("Sesi berakhir, silakan masuk kembali");
  }

  const data = await res.json();
  localStorage.setItem(TOKEN_KEY, data.access_token);
  localStorage.setItem(REFRESH_KEY, data.refresh_token);
  return data.access_token;
}

async function request(path, id, signal) {
  const key = CACHE_PREFIX + path;
  const label = path.startsWith("/api/tips") ? "title" : "name";
  const row = (item) => typeof item?.id === "string" && typeof item[label] === "string";
  const valid = (data) => id === undefined ? Array.isArray(data) && data.every(row) : row(data) && data.id.toLowerCase() === id.toLowerCase();
  let res;
  let retried = false;

  async function doFetch() {
    return fetch(`${API_BASE_URL}${path}`, {
      signal,
      headers: getAuthHeader(),
    });
  }

  try {
    res = await doFetch();
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
  signal?.throwIfAborted();

  if (res.status === 401 && !retried) {
    retried = true;
    try {
      await refreshAccessToken();
      res = await doFetch();
    } catch {
      // Refresh gagal, lempar error asli
    }
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

export const getCategories = (signal) => request("/api/categories", undefined, signal);
export const getRecipes = (signal) => request("/api/recipes", undefined, signal);
export const getRecipe = (id, signal) => request(`/api/recipes/${encodeURIComponent(id.toLowerCase())}`, id, signal);
export const getTips = (signal) => request("/api/tips", undefined, signal);
export const getTip = (id, signal) => request(`/api/tips/${encodeURIComponent(id.toLowerCase())}`, id, signal);

export function clearAuth() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_KEY);
}

export function isLoggedIn() {
  return !!localStorage.getItem(TOKEN_KEY);
}
