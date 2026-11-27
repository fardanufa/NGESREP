import test from "node:test";
import assert from "node:assert/strict";
import { getFavorites, refreshFavorites, removeFavorite, saveFavorite, setFavoriteAccount } from "../js/favorites.js";

test("guest favorites survive failed import, sync to an account, and stay out of guest mode on logout", async (t) => {
  const store = new Map();
  Object.defineProperty(globalThis, "localStorage", { configurable: true, value: {
    getItem: (key) => store.get(key) ?? null,
    setItem: (key, value) => store.set(key, value),
    removeItem: (key) => store.delete(key),
  } });
  const recipe = { id: "r", name: "Nasi" };
  const remote = new Map();
  let unavailable = true;
  t.mock.method(globalThis, "fetch", async (url, { method, headers }) => {
    if (method === "GET") return Response.json({ userId: "reader", favorites: [...remote.values()] });
    assert.equal(url, "/api/auth/favorites/r");
    assert.equal(headers["X-Favorites-User"], "reader");
    if (unavailable) return Response.json({ error: "Layanan belum tersedia" }, { status: 503 });
    if (method === "PUT") remote.set("r", recipe);
    else if (method === "DELETE") remote.delete("r");
    return new Response(null, { status: 204 });
  });

  await saveFavorite(recipe);
  assert.deepEqual(getFavorites(), [recipe]);
  await assert.rejects(refreshFavorites(), { status: 503 });
  assert.ok(store.has("ngesrep_favorites"));
  unavailable = false;
  await refreshFavorites();
  assert.equal(store.has("ngesrep_favorites"), false);
  assert.deepEqual(getFavorites(), [recipe]);
  unavailable = true;
  await assert.rejects(removeFavorite("r"), { status: 503 });
  assert.deepEqual(getFavorites(), [recipe]);
  unavailable = false;
  await removeFavorite("r");
  assert.deepEqual(getFavorites(), []);
  await saveFavorite(recipe);
  setFavoriteAccount();
  assert.deepEqual(getFavorites(), []);
  assert.equal(remote.size, 1);
  await refreshFavorites();
  assert.deepEqual(getFavorites(), [recipe]);
  setFavoriteAccount("other");
  assert.deepEqual(getFavorites(), []);
  setFavoriteAccount();
});
