// Favorit disimpan di localStorage supaya halaman Favorit tetap tampil saat offline.

const KEY = "ngesrep_favorites";

export function getFavorites() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) || [];
  } catch {
    return [];
  }
}

function save(list) {
  localStorage.setItem(KEY, JSON.stringify(list));
}

export function isFavorite(id) {
  return getFavorites().some((item) => item.id === id);
}

// Mengembalikan true jika resep sekarang tersimpan.
export function toggleFavorite(recipe) {
  const list = getFavorites();
  const index = list.findIndex((item) => item.id === recipe.id);

  if (index >= 0) {
    list.splice(index, 1);
  } else {
    list.unshift({
      id: recipe.id,
      name: recipe.name,
      image_url: recipe.image_url,
      cook_time: recipe.cook_time,
      cost_estimate: recipe.cost_estimate,
    });
  }

  save(list);
  return index < 0;
}

export function removeFavorite(id) {
  save(getFavorites().filter((item) => item.id !== id));
}
