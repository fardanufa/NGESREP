import test from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { once } from "node:events";
import { isNonNegativeInteger } from "../src/validation.js";

test("HTTP reads, write authorization and input validation", async (t) => {
  const calls = [];
  const authCalls = [];
  async function listen(server) {
    server.listen(0, "127.0.0.1");
    await once(server, "listening");
    t.after(() => new Promise((resolve) => server.close(resolve)));
    return `http://127.0.0.1:${server.address().port}`;
  }
  process.env.SUPABASE_URL = await listen(createServer(async (req, res) => {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const payload = JSON.parse(Buffer.concat(chunks).toString() || "{}");
    if (req.url.startsWith("/auth/v1/")) {
      authCalls.push([req.url, req.headers.apikey]);
      const user = { id: "fixture", email: "tester@example.test" };
      let data = { access_token: "reader-token", refresh_token: "refresh-token", expires_in: 3600, user };
      let status = 200;
      if (req.url.startsWith("/auth/v1/signup")) data = user;
      if (req.url === "/auth/v1/user") data = user;
      if (req.url.includes("grant_type=password") && payload.password !== "test-password") {
        status = payload.password === "limited" ? 429 : 400;
        data = { msg: "upstream detail" };
      }
      if (req.url.startsWith("/auth/v1/logout")) {
        assert.equal(req.headers.authorization, "Bearer reader-token");
        assert.match(req.url, /scope=local/);
        res.writeHead(204);
        return res.end();
      }
      res.writeHead(status, { "Content-Type": "application/json" });
      return res.end(JSON.stringify(data));
    }
    calls.push([req.method, req.url, req.headers.apikey]);
    if (req.url.includes("boom")) {
      res.writeHead(500, { "Content-Type": "application/json" });
      return res.end('{"message":"secret internals"}');
    }
    const missingCategory = payload.category_id === "00000000-0000-4000-8000-000000000002";
    res.writeHead(missingCategory ? 409 : 200, { "Content-Type": "application/json" });
    res.end(missingCategory ? '{"code":"23503"}' : req.method === "POST" ? '{"name":"Nasi"}' : '[{"name":"Nasi"}]');
  }));
  process.env.VERCEL = "1";
  process.env.SUPABASE_KEY = "legacy-fixture";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "service-fixture";
  process.env.SUPABASE_PUBLISHABLE_KEY = "public-fixture";
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
  assert.equal(calls.length, 3);
  assert.ok(calls.every(([method,, apiKey]) => method === "GET" && apiKey === "service-fixture"));
  assert.equal((await request("GET", "recipes?category_id=abc")).status, 400);
  for (const [method, path] of [["POST", "recipes"], ["PUT", `recipes/${id}`]]) {
    const result = await request(method, path, { name: "Nasi", category_id: "abc" }, key);
    assert.equal(result.status, 400);
    assert.deepEqual(await result.json(), { error: "category_id tidak valid" });
  }
  assert.equal(calls.length, 3);
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

  const credentials = { email: "tester@example.test", password: "test-password" };
  assert.equal((await request("POST", "auth/login", { email: {}, password: "test-password" })).status, 400);
  assert.equal((await request("POST", "auth/login", { ...credentials, password: "wrong" })).status, 401);
  assert.equal((await request("POST", "auth/login", { ...credentials, password: "limited" })).status, 429);
  const register = await request("POST", "auth/register", credentials);
  assert.equal(register.status, 201);
  assert.deepEqual(await register.json(), { needsConfirmation: true });
  assert.equal(register.headers.get("set-cookie"), null);
  const login = await request("POST", "auth/login", credentials);
  assert.equal(login.status, 200);
  assert.deepEqual(await login.json(), { email: credentials.email });
  assert.equal(login.headers.get("cache-control"), "no-store");
  const cookies = login.headers.getSetCookie();
  assert.equal(cookies.length, 2);
  assert.ok(cookies.every(cookie => ["Path=/api/auth", "HttpOnly", "Secure", "SameSite=Strict"]
    .every(attribute => cookie.split("; ").includes(attribute))));
  const cookie = cookies.map(value => value.split(";")[0]).join("; ");
  const count = calls.length;
  const authCount = authCalls.length;
  assert.equal((await request("POST", "recipes", { name: "Nasi" }, "reader-token")).status, 401);
  assert.equal((await fetch(`${url}/api/recipes`, { method: "POST", headers: { cookie, "Content-Type": "application/json" }, body: '{"name":"Nasi"}' })).status, 401);
  assert.equal(calls.length, count);
  assert.equal(authCalls.length, authCount);
  const me = await fetch(`${url}/api/auth/me`, { headers: { cookie } });
  assert.deepEqual(await me.json(), { email: credentials.email });
  const renew = await fetch(`${url}/api/auth/refresh`, { method: "POST", headers: { cookie, "Content-Type": "application/json" }, body: "{}" });
  assert.equal(renew.status, 200);
  const logout = await fetch(`${url}/api/auth/logout`, { method: "POST", headers: { cookie, "Content-Type": "application/json" }, body: "{}" });
  assert.equal(logout.status, 204);
  assert.equal(logout.headers.getSetCookie().length, 2);
  assert.ok(authCalls.every(([, apiKey]) => apiKey === "public-fixture"));

  const failed = await request("GET", "recipes?search=boom");
  assert.equal(failed.status, 500);
  assert.deepEqual(await failed.json(), { error: "Terjadi kesalahan server" });
  assert.equal((await request("GET", `recipes?search=${"a".repeat(101)}`)).status, 400);
  assert.equal((await request("GET", `tips?search=${"a".repeat(101)}`)).status, 400);
  const unknown = await request("GET", "tidak-ada");
  assert.equal(unknown.status, 404);
  assert.deepEqual(await unknown.json(), { error: "Endpoint tidak ditemukan" });
});

test("PostgreSQL integer bounds for prices and times", () => {
  for (const value of [0, 2147483647]) assert.ok(isNonNegativeInteger(value));
  for (const value of [-1, 1.5, "4", 2147483648]) assert.ok(!isNonNegativeInteger(value));
});
