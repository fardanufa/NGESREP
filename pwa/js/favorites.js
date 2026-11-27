// Favorit disimpan di localStorage supaya halaman Favorit tetap tampil saat offline.

import { cachedRecipes } from "./api.js";
import { account } from "./account.js";

const KEY = "ngesrep_favorites";
export const FAVORITE_ACCOUNT_KEY = "ngesrep_account_favorites";
let volatileAccount = null;

function readAccount() {
  try {
    return JSON.parse(localStorage.getItem(FAVORITE_ACCOUNT_KEY)) ?? volatileAccount;
  } catch {
    return volatileAccount;
  }
}

function writeAccount(value) {
  try {
    if (value) localStorage.setItem(FAVORITE_ACCOUNT_KEY, JSON.stringify(value));
    else localStorage.removeItem(FAVORITE_ACCOUNT_KEY);
    volatileAccount = null;
  } catch {
    volatileAccount = value;
  }
}

export function setFavoriteAccount(id) {
  if (!id) writeAccount(null);
  else if (readAccount()?.id !== id) {
    writeAccount(null);
    writeAccount({ id, items: [] });
  }
}

function readList() {
  const raw = localStorage.getItem(KEY);
  try {
    const list = JSON.parse(raw);
    return Array.isArray(list) ? list.filter((item) => typeof item?.id === "string" && typeof item.name === "string") : [];
  } catch {
    return [];
  }
}

export function getFavorites() {
  try {
    const list = readAccount()?.items ?? readList();
    const latest = new Map(cachedRecipes().map((recipe) => [recipe.id, recipe]));
    for (const item of list) {
      const fresh = latest.get(item.id);
      if (!fresh) continue;
      for (const field of ["name", "image_url", "cook_time", "cost_estimate"]) {
        if (fresh[field] !== undefined) item[field] = fresh[field];
      }
    }
    return list;
  } catch {
    return [];
  }
}

export function withFavoritesLock(run) {
  // Web Locks hanya ada di secure context; tanpa itu simpan langsung.
  return globalThis.navigator?.locks?.request
    ? navigator.locks.request(KEY, run)
    : Promise.resolve().then(run);
}

export function refreshFavorites(signal) {
  if (globalThis.navigator?.onLine === false) return Promise.resolve();
  return withFavoritesLock(async () => {
    let data;
    try {
      data = await account("favorites", signal);
    } catch (error) {
      if (error.status !== 401) throw error;
      try {
        const user = await account("refresh", signal, {});
        setFavoriteAccount(user.id);
      } catch (refreshError) {
        if (refreshError.status !== 401) throw refreshError;
        setFavoriteAccount();
        return;
      }
      data = await account("favorites", signal);
    }
    signal?.throwIfAborted();
    setFavoriteAccount(data.userId);
    writeAccount({ id: data.userId, items: data.favorites });
    let guest;
    try { guest = readList(); } catch { return; }
    if (!guest.length) return;
    for (const item of guest) {
      try {
        await account(`favorites/${encodeURIComponent(item.id)}`, signal, undefined, "PUT", data.userId);
      } catch (error) {
        if (error.status !== 404) throw error;
      }
    }
    localStorage.removeItem(KEY);
    const merged = await account("favorites", signal);
    signal?.throwIfAborted();
    writeAccount({ id: merged.userId, items: merged.favorites });
  });
}

export function isFavorite(id) {
  return getFavorites().some((item) => item.id === id);
}

export function saveFavorite(recipe) {
  return changeFavorite(recipe.id, recipe);
}

export function removeFavorite(id) {
  return changeFavorite(id);
}

function changeFavorite(id, recipe) {
  return withFavoritesLock(async () => {
    const user = readAccount();
    const list = (user?.items ?? readList()).filter((item) => item.id !== id);
    if (recipe) {
      const { name, image_url, cook_time, cost_estimate } = recipe;
      list.unshift({ id, name, image_url, cook_time, cost_estimate });
    }
    if (!user?.id) {
      localStorage.setItem(KEY, JSON.stringify(list));
      return;
    }
    const path = `favorites/${encodeURIComponent(id)}`;
    const method = recipe ? "PUT" : "DELETE";
    try {
      await account(path, undefined, undefined, method, user.id);
    } catch (error) {
      if (error.status !== 401) throw error;
      await account("refresh", undefined, {});
      await account(path, undefined, undefined, method, user.id);
    }
    if (readAccount()?.id === user.id) writeAccount({ id: user.id, items: list });
  });
}
