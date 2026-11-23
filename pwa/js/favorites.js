// Favorit disimpan di localStorage supaya halaman Favorit tetap tampil saat offline.

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
    return readList();
  } catch {
    return [];
  }
}

function changeList(edit) {
  return navigator.locks.request(KEY, () => {
    const list = readList();
    const result = edit(list);
    localStorage.setItem(KEY, JSON.stringify(list));
    return result;
  });
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
