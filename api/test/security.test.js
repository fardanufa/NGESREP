import test from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { once } from "node:events";
import { isNonNegativeInteger } from "../src/validation.js";

test("HTTP reads, write authorization and input validation", async (t) => {
  const calls = [];
  async function listen(server) {
    server.listen(0, "127.0.0.1");
    await once(server, "listening");
    t.after(() => new Promise((resolve) => server.close(resolve)));
    return `http://127.0.0.1:${server.address().port}`;
  }
  process.env.SUPABASE_URL = await listen(createServer(async (req, res) => {
    calls.push([req.method, req.url, req.headers.apikey]);
    // Auth endpoints: return 401 for getUser to simulate invalid token
    if (req.url.includes("/auth/v1/user")) {
      res.writeHead(401, { "Content-Type": "application/json" });
      return res.end('{"message":"Invalid token"}');
    }
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const payload = JSON.parse(Buffer.concat(chunks).toString() || "{}");
    const missingCategory = payload.category_id === "00000000-0000-4000-8000-000000000002";
    res.writeHead(missingCategory ? 409 : 200, { "Content-Type": "application/json" });
    res.end(missingCategory ? '{"code":"23503"}' : req.method === "POST" ? '{"name":"Nasi"}' : '[{"name":"Nasi"}]');
  }));
  process.env.VERCEL = "1";
  process.env.SUPABASE_KEY = "legacy-fixture";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "service-fixture";
  const { default: app } = await import("../src/index.js");
  const url = await listen(createServer(app));
  const id = "00000000-0000-4000-8000-000000000001";
  const request = (method, path, body, key) => fetch(`${url}/api/${path}`, {
    method,
    headers: { "Content-Type": "application/json", ...(key && { Authorization: `Bearer ${key}` }) },
    body: JSON.stringify(body),
  });
  const key = "test-only";
  delete process.env.ADMIN_API_KEY;
  // Tanpa Authorization header agar optionalAuth tidak mengisi req.user
  assert.equal((await request("POST", "recipes", { name: "Nasi" })).status, 503);
  process.env.ADMIN_API_KEY = key;
  for (const resource of ["categories", "recipes", "tips"]) {
    assert.equal((await request("GET", resource)).status, 200);
    assert.equal((await request("GET", `${resource}/bad-id`)).status, 404);
    for (const method of ["POST", "PUT", "DELETE"]) {
      const path = method === "POST" ? resource : `${resource}/${id}`;
      const validBody = resource === "tips" ? { title: "Tips" } : { name: "Nasi" };
      assert.equal((await request(method, path, validBody)).status, 401);
      assert.equal((await request(method, path, validBody, "bad")).status, 401);
      if (method === "DELETE") continue;
      for (const body of [undefined, [], resource === "tips" ? { title: null } : { name: null }]) {
        assert.equal((await request(method, path, body, key)).status, 400);
      }
      if (resource === "recipes") {
        for (const field of ["cost_estimate", "cook_time"]) {
          assert.equal((await request(method, path, { name: "Nasi", [field]: -1 }, key)).status, 400);
        }
      }
    }
  }
  // Hanya hitung panggilan ke database (bukan auth) - minimal 3 GET
  const dbCalls = calls.filter(([, url]) => !url.includes("/auth/v1/user"));
  assert.ok(dbCalls.length >= 3);
  assert.ok(dbCalls.every(([method,, apiKey]) => method === "GET" && apiKey === "service-fixture"));
  assert.equal((await request("GET", "recipes?category_id=abc")).status, 400);
  for (const [method, path] of [["POST", "recipes"], ["PUT", `recipes/${id}`]]) {
    const result = await request(method, path, { name: "Nasi", category_id: "abc" }, key);
    assert.equal(result.status, 400);
    assert.deepEqual(await result.json(), { error: "category_id tidak valid" });
  }
  // calls.length termasuk panggilan auth, jadi tidak dibandingkan exact
  for (const [method, path] of [["POST", "recipes"], ["PUT", `recipes/${id}`]]) {
    const result = await request(method, path, { name: "Nasi", category_id: "00000000-0000-4000-8000-000000000002" }, key);
    assert.equal(result.status, 400);
    assert.deepEqual(await result.json(), { error: "Kategori tidak ditemukan" });
  }
  assert.equal((await request("POST", "recipes", { name: "Nasi", cost_estimate: 0, category_id: null }, key)).status, 201);
  for (const [method, databaseMethod, body] of [["PUT", "PATCH", { name: "Nasi", category_id: null }], ["DELETE", "DELETE"]]) {
    for (const resource of ["recipes", "categories", "tips"]) {
      const payload = resource === "tips" && body ? { title: "Tips" } : body;
      assert.equal((await request(method, `${resource}/${id}`, payload, key)).status, 200);
      const [actualMethod, target] = calls.at(-1);
      assert.equal(actualMethod, databaseMethod);
      const url = new URL(target, "http://localhost");
      assert.equal(url.pathname, `/rest/v1/${resource}`);
      assert.deepEqual(url.searchParams.getAll("id"), [`eq.${id}`]);
    }
  }
});

test("PostgreSQL integer bounds for prices and times", () => {
  for (const value of [0, 2147483647]) assert.ok(isNonNegativeInteger(value));
  for (const value of [-1, 1.5, "4", 2147483648]) assert.ok(!isNonNegativeInteger(value));
});
