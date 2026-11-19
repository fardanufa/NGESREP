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
  process.env.SUPABASE_URL = await listen(createServer((req, res) => {
    calls.push([req.method, req.url, req.headers.apikey]);
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(req.method === "GET" ? "[]" : '{"name":"Nasi"}');
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
  assert.equal((await request("POST", "recipes", {}, key)).status, 503);
  process.env.ADMIN_API_KEY = key;
  for (const resource of ["categories", "recipes", "tips"]) {
    assert.equal((await request("GET", resource)).status, 200);
    assert.equal((await request("GET", `${resource}/bad-id`)).status, 404);
    for (const method of ["POST", "PUT", "DELETE"]) {
      const path = method === "POST" ? resource : `${resource}/${id}`;
      assert.equal((await request(method, path)).status, 401);
      assert.equal((await request(method, path, {}, "bad")).status, 401);
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
  assert.equal(calls.length, 3);
  assert.ok(calls.every(([method,, apiKey]) => method === "GET" && apiKey === "service-fixture"));
  assert.equal((await request("POST", "recipes", { name: "Nasi", cost_estimate: 0 }, key)).status, 201);
  assert.equal(calls.at(-1)[0], "POST");
});

test("PostgreSQL integer bounds for prices and times", () => {
  for (const value of [0, 2147483647]) assert.ok(isNonNegativeInteger(value));
  for (const value of [-1, 1.5, "4", 2147483648]) assert.ok(!isNonNegativeInteger(value));
});
