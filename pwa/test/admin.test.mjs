import test from "node:test";
import assert from "node:assert/strict";
import { adminRequest } from "../js/admin.js";
import { catalogPayload } from "../js/pages/kelola.js";

test("catalog forms preserve multiline text and send numbers and nullable fields", () => {
  const values = new FormData();
  values.set("ingredients", "Telur\nGaram");
  values.set("cost_estimate", "1500");
  values.set("category_id", "");
  assert.deepEqual(catalogPayload(values, [["ingredients"], ["cost_estimate", "", "number"], ["category_id"]]), {
    ingredients: "Telur\nGaram", cost_estimate: 1500, category_id: null,
  });
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
