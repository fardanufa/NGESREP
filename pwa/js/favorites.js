// Favorit disimpan di localStorage supaya halaman Favorit tetap tampil saat offline.

import { cachedRecipes } from "./api.js";

const KEY = "ngesrep_favorites";

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
    const list = readList();
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

function changeList(edit) {
  const run = () => {
    const list = readList();
    const result = edit(list);
    localStorage.setItem(KEY, JSON.stringify(list));
    return result;
  };
  // Web Locks hanya ada di secure context; tanpa itu simpan langsung.
  return globalThis.navigator?.locks?.request
    ? navigator.locks.request(KEY, run)
    : Promise.resolve().then(run);
}

export function isFavorite(id) {
  return getFavorites().some((item) => item.id === id);
}

export function saveFavorite(recipe) {
  return changeList((list) => {
    if (!list.some((item) => item.id === recipe.id)) {
      const { id, name, image_url, cook_time, cost_estimate } = recipe;
      list.unshift({ id, name, image_url, cook_time, cost_estimate });
    }
  });
}

export function removeFavorite(id) {
  return changeList((list) => {
    const index = list.findIndex((item) => item.id === id);
    if (index >= 0) list.splice(index, 1);
  });
}
