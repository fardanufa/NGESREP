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
  let signedIn = false;
  t.mock.method(globalThis, "fetch", async (url) => {
    if (url.endsWith("/api/admin/session")) {
      return signedIn ? Response.json({ email: "admin@example.test" }) : Response.json({}, { status: 401 });
    }
    return Response.json(url.endsWith("/api/recipes") ? [{ id: "recipe", name: "Nasi" }] : []);
  });
  for (const admin of [false, true]) {
    signedIn = admin;
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

test("admin upload is same-origin and sends the image without a bearer key", async (t) => {
  const photo = new Blob(["data"], { type: "image/png" });
  t.mock.method(globalThis, "fetch", async (url, options) => {
    assert.equal(url, "/api/admin/upload");
    assert.deepEqual(options.headers, { "Content-Type": "image/png" });
    assert.equal(options.body, photo);
    assert.equal(options.method, "POST");
    return Response.json({ error: "Sesi berakhir" }, { status: 401 });
  });
  await assert.rejects(adminRequest("upload", { method: "POST", body: photo }), {
    status: 401, message: "Sesi berakhir",
  });
});
