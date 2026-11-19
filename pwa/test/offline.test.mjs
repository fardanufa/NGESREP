import test from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";
import { readFile } from "node:fs/promises";
import { getRecipe, getRecipes } from "../js/api.js";
import { getFavorites, toggleFavorite, removeFavorite } from "../js/favorites.js";
import { detailTips } from "../js/pages/detailTips.js";

test("only good data survives offline; a confirmed deletion removes it", async (t) => {
  const data = new Map();
  t.mock.method(globalThis, "fetch", async () => Response.json([{ id: "r", name: "Nasi" }]));
  Object.defineProperty(globalThis, "localStorage", { configurable: true, value: {
    getItem: k => data.get(k) ?? null, setItem: (k, v) => data.set(k, v), removeItem: k => data.delete(k),
  } });
  globalThis.document = { createElement: () => ({}), body: { appendChild() {} } };
  t.mock.method(globalThis, "setTimeout", () => 0);
  const good = await getRecipes();
  for (const res of [new Response("maintenance"), Response.json({}), Response.json([{}]), new Response(null, { status: 503 })]) {
    fetch.mock.mockImplementation(async () => res);
    await assert.rejects(getRecipes());
  }
  const offline = async () => { throw new Error("offline"); };
  fetch.mock.mockImplementation(offline);
  assert.deepEqual(await getRecipes(), good);
  for (const status of [404, 410]) {
    fetch.mock.mockImplementation(async () => Response.json(good[0]));
    await getRecipe("r");
    fetch.mock.mockImplementation(async () => new Response(null, { status }));
    await assert.rejects(getRecipe("r"), { status });
    fetch.mock.mockImplementation(offline);
    await assert.rejects(getRecipe("r"), /offline/);
  }
});

test("worker activation preserves unrelated caches and leaves API data to the page", async () => {
  const source = await readFile(new URL("../sw.js", import.meta.url), "utf8");
  const events = {}, removed = [];
  const current = source.match(/const CACHE_VERSION = "([^"]+)"/)[1];
  vm.runInNewContext(source, { URL, self: { addEventListener: (k, fn) => events[k] = fn, clients: { claim() {} } },
    caches: { keys: async () => ["another-app", current, "ngesrep-v7"], delete: async key => removed.push(key) } });
  let activation;
  events.activate({ waitUntil: p => { activation = p; } });
  await activation;
  assert.deepEqual(removed, ["ngesrep-v7"]);
  events.fetch({ request: new Request("https://example.invalid/api/recipes") });
});

test("favorites recover from malformed entries and report a failed save", async () => {
  let saved = '[null,{"name":"missing id"}]';
  let full = false;
  Object.defineProperty(globalThis, "localStorage", { configurable: true, value: {
    getItem: () => saved,
    setItem: (_key, value) => { if (full) throw new Error("quota"); saved = value; },
  } });
  Object.defineProperty(globalThis, "navigator", { configurable: true, value: {
    locks: { request: async (key, edit) => { assert.equal(key, "ngesrep_favorites"); return edit(); } },
  } });
  const recipe = { id: "r", name: "Nasi" };
  assert.deepEqual(getFavorites(), []);
  assert.equal(await toggleFavorite(recipe), true);
  full = true;
  await assert.rejects(removeFavorite("r"), /quota/);
  assert.deepEqual(getFavorites(), [recipe]);
  full = false;
  await removeFavorite("r");
  assert.deepEqual(getFavorites(), []);
});

test("a late response from an earlier visit cannot replace the same tip", async (t) => {
  let finishOld;
  const old = new AbortController();
  const main = { innerHTML: "", querySelector: () => ({}) };
  t.mock.method(globalThis, "fetch", () => new Promise(resolve => { finishOld = resolve; }));
  const pending = detailTips(main, "a", old.signal);
  old.abort();
  fetch.mock.mockImplementation(async url => Response.json(url.endsWith("/tips") ? [] : { id: "a", title: "Fresh" }));
  await detailTips(main, "a", new AbortController().signal);
  finishOld(Response.json({ id: "a", title: "Old" }));
  await pending;
  assert.match(main.innerHTML, /Fresh/);
  assert.doesNotMatch(main.innerHTML, />Old</);
});
