import test from "node:test";
import assert from "node:assert/strict";
import { adminRequest } from "../js/admin.js";
import { beranda } from "../js/pages/beranda.js";
import { catalogPayload, saveRecipe } from "../js/recipeEditor.js";

test("catalog forms preserve multiline text and send numbers and nullable fields", () => {
  const values = new FormData();
  values.set("ingredients", "Telur\nGaram");
  values.set("cost_estimate", "1500");
  values.set("category_id", "");
  assert.deepEqual(catalogPayload(values), {
    name: null, description: null, ingredients: "Telur\nGaram", steps: null,
    cost_estimate: 1500, cook_time: 0, category_id: null,
  });
});

test("recipe create skips upload and recipe edit uploads a selected photo first", async () => {
  const photo = new Blob(["photo"], { type: "image/webp" });
  const data = { name: "Nasi" };
  const calls = [];
  const request = async (...args) => {
    calls.push(args);
    return { image_url: "https://example.test/photo.webp" };
  };
  await assert.rejects(saveRecipe(request, {}, data, new Blob(["photo"], { type: "text/plain" })), /JPEG/);
  await saveRecipe(request, {}, data);
  await saveRecipe(request, { id: "recipe" }, data, photo);
  assert.deepEqual(calls, [
    ["recipes", { method: "POST", body: data }],
    ["upload", { method: "POST", body: photo }],
    ["recipes/recipe", { method: "PUT", body: { ...data, image_url: "https://example.test/photo.webp" } }],
  ]);
});

test("Beranda puts recipe controls outside the detail link only for an admin session", async (t) => {
  let sessionStatus = 401;
  let canRefresh = false;
  t.mock.method(globalThis, "fetch", async (url) => {
    if (url.endsWith("/api/auth/admin/session")) {
      return sessionStatus === 204 ? new Response(null, { status: 204 }) : Response.json({}, { status: sessionStatus });
    }
    if (url.endsWith("/api/auth/refresh")) {
      if (!canRefresh) return Response.json({}, { status: 401 });
      sessionStatus = 204;
      return Response.json({ id: "admin" });
    }
    return Response.json(url.endsWith("/api/recipes") ? [{ id: "recipe", name: "Nasi" }] : []);
  });
  for (const [status, refreshable] of [[401, false], [403, false], [204, false], [401, true]]) {
    sessionStatus = status;
    canRefresh = refreshable;
    const admin = status === 204 || refreshable;
    const node = () => ({ innerHTML: "", hidden: true, addEventListener() {} });
    const nodes = Object.fromEntries(
      ["#recipe-list", "#category-chips", "#recipe-search", "[data-admin-controls]", "[data-editor]", "h1", "[data-count]"]
        .map((selector) => [selector, node()]),
    );
    await beranda({ querySelector: (selector) => nodes[selector] }, undefined, new AbortController().signal);
    assert.equal(nodes["[data-admin-controls]"].innerHTML.includes("Tambah Resep"), admin);
    const cards = nodes["#recipe-list"].innerHTML;
    assert.match(cards, /href="#\/resep\/recipe"/);
    assert.equal(cards.includes("data-remove"), admin);
    if (admin) assert.match(cards, /<\/a>[\s\S]*data-edit="recipe"/);
  }
});

test("Beranda retries an expired recipe save once and keeps the draft if sign-in is needed", async (t) => {
  let refreshAllowed = false;
  let writes = 0;
  let refreshes = 0;
  t.mock.method(globalThis, "fetch", async (url, options) => {
    if (url === "/api/auth/admin/session") return new Response(null, { status: 204 });
    if (url === "/api/auth/refresh") {
      refreshes++;
      return refreshAllowed ? Response.json({ id: "admin" }) : Response.json({}, { status: 401 });
    }
    if (url === "/api/auth/admin/recipes") {
      assert.equal(JSON.parse(options.body).name, "Nasi telur");
      return ++writes === 3 ? Response.json({ id: "recipe" }, { status: 201 }) : Response.json({}, { status: 401 });
    }
    return Response.json([]);
  });
  const values = new FormData();
  values.set("name", "Nasi telur");
  t.mock.method(globalThis, "FormData", function () { return values; });
  const node = () => ({
    innerHTML: "", hidden: true, addEventListener(type, fn) { this[type] = fn; },
    replaceChildren() { this.innerHTML = ""; }, focus() {}, classList: { toggle() {} },
  });
  const nodes = Object.fromEntries(
    ["#recipe-list", "#category-chips", "#recipe-search", "[data-admin-controls]", "[data-editor]", "h1", "[data-count]"]
      .map((selector) => [selector, node()]),
  );
  const editor = nodes["[data-editor]"];
  const fields = {
    fieldset: node(), "[role=alert]": node(), "[type=submit]": node(),
    "[data-cancel]": node(), "[type=file]": { files: [] },
  };
  const form = { querySelector: (selector) => fields[selector], elements: { namedItem: node } };
  editor.querySelector = () => form;
  editor.contains = () => !editor.hidden;
  const main = { querySelector: (selector) => nodes[selector], querySelectorAll: () => [] };
  const toasts = [];
  globalThis.document = {
    getElementById: () => ({ replaceChildren: (el) => toasts.push(el.textContent) }),
    createElement: () => ({ remove() {} }),
  };
  t.after(() => { delete globalThis.document; });
  await beranda(main, undefined, new AbortController().signal);
  nodes["[data-admin-controls]"].click({ target: { closest: node } });
  const submit = () => form.onsubmit({ preventDefault() {} });
  await submit();
  assert.equal(editor.hidden, false);
  assert.match(fields["[role=alert]"].textContent, /masuk/i);
  assert.equal(refreshes, 1);
  refreshAllowed = true;
  await submit();
  assert.equal(refreshes, 2);
  assert.equal(writes, 3);
  assert.equal(editor.hidden, true);
  assert.deepEqual(toasts, ["Resep ditambahkan."]);
});

test("admin upload is same-origin and sends the image without a bearer key", async (t) => {
  const photo = new Blob(["data"], { type: "image/png" });
  t.mock.method(globalThis, "fetch", async (url, options) => {
    assert.equal(url, "/api/auth/admin/upload");
    assert.deepEqual(options.headers, { "Content-Type": "image/png" });
    assert.equal(options.body, photo);
    assert.equal(options.method, "POST");
    return Response.json({ error: "Sesi berakhir" }, { status: 401 });
  });
  await assert.rejects(adminRequest("upload", { method: "POST", body: photo }), {
    status: 401, message: "Sesi berakhir",
  });
});
