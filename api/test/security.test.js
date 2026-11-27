import test from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { once } from "node:events";
import { isNonNegativeInteger } from "../src/validation.js";

test("HTTP reads, write authorization and input validation", async (t) => {
  const calls = [];
  const authCalls = [];
  const uploads = [];
  const favoriteRows = new Set();
  let logoutStatus = 204;
  let adminRole = "admin";
  async function listen(server) {
    server.listen(0, "127.0.0.1");
    await once(server, "listening");
    t.after(() => new Promise((resolve) => server.close(resolve)));
    return `http://127.0.0.1:${server.address().port}`;
  }
  process.env.SUPABASE_URL = await listen(createServer(async (req, res) => {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const raw = Buffer.concat(chunks);
    if (req.url.startsWith("/storage/v1/object/")) {
      uploads.push([req.method, req.url, req.headers.apikey, req.headers["content-type"], raw]);
      res.writeHead(200, { "Content-Type": "application/json" });
      return res.end('{"Key":"resep/katalog/photo.png"}');
    }
    const payload = JSON.parse(raw.toString() || "{}");
    if (req.url.startsWith("/auth/v1/")) {
      authCalls.push([req.url, req.headers.apikey]);
      const user = { id: "fixture", email: "tester@example.test", user_metadata: { role: "admin" } };
      const adminIdentity = payload.email === "admin@example.test" || req.headers.authorization === "Bearer admin-token";
      if (adminIdentity) {
        user.id = "admin-fixture";
        user.email = "admin@example.test";
        user.app_metadata = { role: adminRole };
        user.email_confirmed_at = "2026-01-01T00:00:00Z";
      }
      let data = { access_token: adminIdentity ? "admin-token" : "reader-token", refresh_token: "refresh-token", expires_in: 3600, user };
      let status = 200;
      if (req.url.startsWith("/auth/v1/signup")) data = user;
      if (req.url === "/auth/v1/user") {
        data = req.headers.authorization === "Bearer other-token" ? { ...user, id: "other" } : user;
        if (req.headers.authorization === "Bearer invalid-token") {
          status = 401;
          data = { msg: "Invalid token" };
        }
      }
      if (req.url.includes("grant_type=password") && payload.password !== "test-password") {
        status = payload.password === "limited" ? 429 : 400;
        data = { msg: "upstream detail" };
      }
      if (req.url.startsWith("/auth/v1/logout")) {
        assert.equal(req.headers.authorization, "Bearer reader-token");
        assert.match(req.url, /scope=local/);
        res.writeHead(logoutStatus);
        return res.end();
      }
      res.writeHead(status, { "Content-Type": "application/json" });
      return res.end(JSON.stringify(data));
    }
    calls.push([req.method, req.url, req.headers.apikey]);
    if (req.url.startsWith("/rest/v1/favorites")) {
      const query = new URL(req.url, "http://localhost").searchParams;
      const owner = query.get("user_id")?.slice(3);
      res.setHeader("Content-Type", "application/json");
      if (req.method === "POST") {
        assert.equal(query.get("on_conflict"), "user_id,recipe_id");
        assert.match(req.headers.prefer, /resolution=ignore-duplicates/);
        favoriteRows.add(`${payload.user_id}/${payload.recipe_id}`);
        return res.end("[]");
      }
      if (req.method === "DELETE") {
        favoriteRows.delete(`${owner}/${query.get("recipe_id")?.slice(3)}`);
        return res.end("[]");
      }
      return res.end(JSON.stringify([...favoriteRows].filter((row) => row.startsWith(`${owner}/`))
        .map((row) => ({ recipes: { id: row.split("/")[1], name: "Nasi" } }))));
    }
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
  assert.deepEqual(await login.json(), { id: "fixture", email: credentials.email });
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
  assert.deepEqual(await me.json(), { id: "fixture", email: credentials.email });
  const favorites = (method, recipeId = "", session = cookie, owner = "fixture", body) =>
    fetch(`${url}/api/auth/favorites${recipeId ? `/${recipeId}` : ""}`, {
      method, headers: { Cookie: session, "X-Favorites-User": owner, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  assert.equal((await favorites("GET", "", "")).status, 401);
  assert.equal((await favorites("PUT", "bad-uuid")).status, 404);
  assert.equal((await favorites("PUT", id, cookie, "other")).status, 409);
  for (let i = 0; i < 2; i++) {
    assert.equal((await favorites("PUT", id, cookie, "fixture", { user_id: "other" })).status, 204);
  }
  const ownFavorites = await favorites("GET");
  assert.equal(ownFavorites.headers.get("cache-control"), "no-store");
  assert.deepEqual(await ownFavorites.json(), { userId: "fixture", favorites: [{ id, name: "Nasi" }] });
  const otherCookie = "ngesrep_access=other-token";
  assert.deepEqual(await (await favorites("GET", "", otherCookie)).json(), { userId: "other", favorites: [] });
  assert.equal((await favorites("DELETE", id, otherCookie, "other")).status, 204);
  assert.equal(favoriteRows.size, 1);
  assert.equal((await favorites("DELETE", id)).status, 204);
  assert.equal(favoriteRows.size, 0);
  const renew = await fetch(`${url}/api/auth/refresh`, { method: "POST", headers: { cookie, "Content-Type": "application/json" }, body: "{}" });
  assert.equal(renew.status, 200);
  const logout = await fetch(`${url}/api/auth/logout`, { method: "POST", headers: { cookie, "Content-Type": "application/json" }, body: "{}" });
  assert.equal(logout.status, 204);
  assert.equal(logout.headers.getSetCookie().length, 2);
  logoutStatus = 500;
  const forced = await fetch(`${url}/api/auth/logout`, { method: "POST", headers: { cookie, "Content-Type": "application/json" }, body: "{}" });
  assert.equal(forced.status, 204);
  assert.equal(forced.headers.getSetCookie().length, 2);
  assert.ok(authCalls.every(([, apiKey]) => apiKey === "public-fixture"));

  const failed = await request("GET", "recipes?search=boom");
  assert.equal(failed.status, 500);
  assert.deepEqual(await failed.json(), { error: "Terjadi kesalahan server" });
  assert.equal((await request("GET", `recipes?search=${"a".repeat(101)}`)).status, 400);
  assert.equal((await request("GET", `tips?search=${"a".repeat(101)}`)).status, 400);
  assert.equal((await request("GET", "recipes?search=a&search=b")).status, 400);
  assert.equal((await request("GET", "tips?search=a&search=b")).status, 400);
  assert.equal((await request("POST", "tips", { title: "Tips", content: {} }, key)).status, 400);
  const unknown = await request("GET", "tidak-ada");
  assert.equal(unknown.status, 404);
  assert.deepEqual(await unknown.json(), { error: "Endpoint tidak ditemukan" });

  process.env.ADMIN_ORIGIN = "https://ngesrep.example";
  const admin = (method, path, body, session = "", origin = process.env.ADMIN_ORIGIN, type = "application/json") =>
    fetch(`${url}/api/auth/admin/${path}`, {
      method, headers: { Origin: origin, Cookie: session, "Content-Type": type },
      body: type === "application/json" ? JSON.stringify(body) : body,
    });
  const adminCredentials = { ...credentials, email: "admin@example.test" };
  const beforeAdminLogin = authCalls.length;
  assert.equal((await admin("GET", "session")).status, 401);
  assert.equal((await admin("GET", "session", undefined, "ngesrep_admin=legacy-session")).status, 401);
  assert.equal((await admin("GET", "session", undefined, cookie)).status, 403);
  assert.equal((await admin("POST", "recipes", { name: "Nasi", role: "admin" }, cookie)).status, 403);
  const session = await request("POST", "auth/login", adminCredentials);
  assert.equal(session.status, 200);
  assert.deepEqual(await session.json(), { id: "admin-fixture", email: adminCredentials.email });
  const adminToken = session.headers.getSetCookie().map((value) => value.split(";")[0]).join("; ");
  assert.deepEqual(await (await favorites("GET", "", adminToken)).json(), { userId: "admin-fixture", favorites: [] });
  const who = await admin("GET", "session", undefined, adminToken);
  assert.equal(who.status, 204);
  assert.equal(who.headers.get("cache-control"), "no-store");
  assert.equal((await admin("POST", "session", adminCredentials, adminToken)).status, 404);
  assert.equal((await admin("GET", "session", undefined, "ngesrep_access=invalid-token")).status, 401);
  for (const resource of ["recipes", "tips", "categories"]) {
    const payload = resource === "tips" ? { title: "Tips" } : { name: "Nasi" };
    assert.equal((await admin("GET", resource, undefined, adminToken)).status, 200);
    assert.equal((await admin("POST", resource, payload, adminToken, "https://other.example")).status, 403);
    assert.equal((await admin("POST", resource, payload, adminToken)).status, 201);
    assert.equal((await admin("PUT", `${resource}/${id}`, payload, adminToken)).status, 200);
    assert.equal((await admin("DELETE", `${resource}/${id}`, undefined, adminToken)).status, 200);
  }
  const png = Buffer.from("89504e470d0a1a0a", "hex");
  assert.equal((await admin("POST", "upload", png, "", undefined, "image/png")).status, 401);
  assert.equal((await admin("POST", "upload", "<svg/>", adminToken, undefined, "image/svg+xml")).status, 415);
  assert.equal((await admin("POST", "upload", "not a png", adminToken, undefined, "image/png")).status, 400);
  assert.equal((await admin("POST", "upload", Buffer.alloc(2 * 1024 * 1024 + 1), adminToken, undefined, "image/png")).status, 413);
  assert.equal(uploads.length, 0);
  const uploaded = await admin("POST", "upload", png, adminToken, undefined, "image/png");
  assert.equal(uploaded.status, 201);
  const [[method, path, apiKey, type, body]] = uploads;
  assert.match(path, /^\/storage\/v1\/object\/resep\/katalog\/[\da-f-]+\.png$/);
  assert.deepEqual([method, apiKey, type, body], ["POST", "service-fixture", "image/png", png]);
  assert.deepEqual(await uploaded.json(), { image_url: `${process.env.SUPABASE_URL}${path.replace("/object/", "/object/public/")}` });
  adminRole = "reader";
  assert.equal((await admin("GET", "session", undefined, adminToken)).status, 403);
  assert.equal((await admin("DELETE", `recipes/${id}`, undefined, adminToken)).status, 403);
  assert.ok(authCalls.slice(beforeAdminLogin).every(([, apiKey]) => apiKey === "public-fixture"));
});

test("PostgreSQL integer bounds for prices and times", () => {
  for (const value of [0, 2147483647]) assert.ok(isNonNegativeInteger(value));
  for (const value of [-1, 1.5, "4", 2147483648]) assert.ok(!isNonNegativeInteger(value));
});
