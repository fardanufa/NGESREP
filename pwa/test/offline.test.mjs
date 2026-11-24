import test from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";
import { readFile } from "node:fs/promises";
import { getRecipe, getRecipes } from "../js/api.js";
import { getFavorites, saveFavorite, removeFavorite } from "../js/favorites.js";
import { detailTips } from "../js/pages/detailTips.js";
import { tips } from "../js/pages/tips.js";

test("only good data survives offline; a confirmed deletion removes it", async (t) => {
  const data = new Map();
  t.mock.method(globalThis, "fetch", async () => Response.json([{ id: "r", name: "Nasi" }]));
  Object.defineProperty(globalThis, "localStorage", { configurable: true, value: {
    getItem: k => data.get(k) ?? null, setItem: (k, v) => data.set(k, v), removeItem: k => data.delete(k),
  } });
  const status = { replaceChildren(el) { this.message = el.textContent; } };
  globalThis.document = { createElement: () => ({}), getElementById: id => id === "app-status" && status };
  t.mock.method(globalThis, "setTimeout", () => 0);
  const good = await getRecipes();
  for (const res of [new Response("maintenance"), Response.json({}), Response.json([{}]), new Response(null, { status: 503 })]) {
    fetch.mock.mockImplementation(async () => res);
    await assert.rejects(getRecipes());
  }
  const offline = async () => { throw new Error("offline"); };
  fetch.mock.mockImplementation(offline);
  assert.deepEqual(await getRecipes(), good);
  assert.match(status.message, /offline/);
  for (const status of [404, 410]) {
    fetch.mock.mockImplementation(async () => Response.json(good[0]));
    await getRecipe("R");
    fetch.mock.mockImplementation(async () => new Response(null, { status }));
    await assert.rejects(getRecipe("r"), { status });
    fetch.mock.mockImplementation(offline);
    await assert.rejects(getRecipe("R"), /offline/);
  }

  for (const stale of [Response.json([{ id: "r", name: "Old" }]), new Response(null, { status: 404 })]) {
    let finish;
    const visit = new AbortController();
    fetch.mock.mockImplementation(() => new Promise(resolve => { finish = resolve; }));
    const pending = getRecipes(visit.signal);
    visit.abort();
    fetch.mock.mockImplementation(async () => Response.json(good));
    await getRecipes();
    finish(stale);
    await assert.rejects(pending, { name: "AbortError" });
    fetch.mock.mockImplementation(offline);
    assert.deepEqual(await getRecipes(), good);
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
  await saveFavorite(recipe);
  await saveFavorite(recipe);
  assert.deepEqual(getFavorites(), [recipe]);
  full = true;
  await assert.rejects(removeFavorite("r"), /quota/);
  assert.deepEqual(getFavorites(), [recipe]);
  full = false;
  await removeFavorite("r");
  assert.deepEqual(getFavorites(), []);
});

test("typing before tips load does not replace the retry button", async (t) => {
  t.mock.method(globalThis, "fetch", async () => new Response(null, { status: 503 }));
  const list = { querySelector: () => ({}) };
  const input = { value: "nasi", addEventListener(type, handler) { this[type] = handler; } };
  const clear = { classList: { toggle() {} }, addEventListener() {} };
  const nodes = { "#tips-list": list, "#tips-search": input, "#tips-clear": clear };
  await tips({ querySelector: selector => nodes[selector] }, undefined, new AbortController().signal);
  input.input();
  assert.match(list.innerHTML, /data-retry/);
});

test("detail Back uses app history only when the previous entry is an app route", async () => {
  let back;
  const header = { querySelector: () => ({ addEventListener: (_type, fn) => { back = fn; } }) };
  const main = { querySelector: () => ({}) };
  const nav = { classList: { toggle() {} }, querySelectorAll: () => [] };
  globalThis.document = { getElementById: id => ({ "app-header": header, app: main, "bottom-nav": nav })[id] };
  globalThis.location = { origin: "https://example.test", pathname: "/", hash: "#/resep/r" };
  let historyCalls = 0;
  globalThis.history = { back() { historyCalls++; } };
  globalThis.window = { scrollTo() {} };
  const { renderRoute } = await import("../js/router.js");
  const fetchBefore = globalThis.fetch;
  globalThis.fetch = async () => new Response(null, { status: 404 });
  try {
    await renderRoute();
    for (const url of [undefined, "https://other.test/#/favorit", "https://example.test/other#/favorit", "https://example.test/#/favorit"]) {
      location.hash = "#/resep/r";
      window.navigation = url && { currentEntry: { index: 1 }, entries: () => [{ url }] };
      back();
      assert.equal(location.hash, url === "https://example.test/#/favorit" ? "#/resep/r" : "#/beranda");
    }
    assert.equal(historyCalls, 1);
  } finally {
    globalThis.fetch = fetchBefore;
  }
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

test("favorites still save when Web Locks is unavailable", async () => {
  let saved = null;
  Object.defineProperty(globalThis, "localStorage", { configurable: true, value: {
    getItem: () => saved, setItem: (_key, value) => { saved = value; },
  } });
  Object.defineProperty(globalThis, "navigator", { configurable: true, value: {} });
  const recipe = { id: "r", name: "Nasi" };
  await saveFavorite(recipe);
  assert.deepEqual(getFavorites(), [recipe]);
  await removeFavorite("r");
  assert.deepEqual(getFavorites(), []);
});

test("a slow API falls back to the cached copy after the timeout", async (t) => {
  const data = new Map([["ngesrep_cache/api/recipes", JSON.stringify([{ id: "r", name: "Nasi" }])]]);
  Object.defineProperty(globalThis, "localStorage", { configurable: true, value: {
    getItem: key => data.get(key) ?? null, setItem: (key, value) => data.set(key, value),
  } });
  const status = { replaceChildren(el) { this.message = el.textContent; } };
  globalThis.document = { createElement: () => ({}), getElementById: id => id === "app-status" && status };
  t.mock.timers.enable({ apis: ["setTimeout"] });
  t.mock.method(globalThis, "fetch", (_url, options) => new Promise((_, reject) => {
    options.signal.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")));
  }));
  const pending = getRecipes();
  t.mock.timers.tick(12000);
  assert.deepEqual(await pending, [{ id: "r", name: "Nasi" }]);
  assert.match(status.message, /lambat/);
});
