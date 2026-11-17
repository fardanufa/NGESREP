import test from "node:test";
import assert from "node:assert/strict";
import { requireAdmin } from "../src/middleware/requireAdmin.js";
import { isNonNegativeInteger } from "../src/validation.js";

process.env.SUPABASE_URL = "https://example.supabase.co";
process.env.SUPABASE_SERVICE_ROLE_KEY = "test-key";

const [routes, { create }] = await Promise.all([
  Promise.all([
    import("../src/routes/categoryRoutes.js"),
    import("../src/routes/recipeRoutes.js"),
    import("../src/routes/tipRoutes.js"),
  ]),
  import("../src/controllers/recipeController.js"),
]);

function checkAuth(key, authorization) {
  const previous = process.env.ADMIN_API_KEY;
  if (key === undefined) delete process.env.ADMIN_API_KEY;
  else process.env.ADMIN_API_KEY = key;

  let statusCode = 200;
  let body;
  let calledNext = false;
  const res = {
    status(code) {
      statusCode = code;
      return this;
    },
    json(value) {
      body = value;
      return this;
    },
  };

  requireAdmin({ get: () => authorization }, res, () => (calledNext = true));
  if (previous === undefined) delete process.env.ADMIN_API_KEY;
  else process.env.ADMIN_API_KEY = previous;
  return { statusCode, body, calledNext };
}

test("write routes require admin auth", () => {
  for (const { default: router } of routes) {
    const writes = router.stack.filter((layer) => layer.route && /^(post|put|delete)$/.test(Object.keys(layer.route.methods)[0]));
    assert.equal(writes.length, 3);
    for (const layer of writes) assert.equal(layer.route.stack[0].handle, requireAdmin);
  }
});

test("admin auth fails closed and accepts only the configured bearer key", () => {
  assert.equal(checkAuth(undefined, "Bearer secret").statusCode, 503);
  assert.equal(checkAuth("secret", undefined).statusCode, 401);
  assert.equal(checkAuth("secret", "Bearer wrong").statusCode, 401);
  assert.equal(checkAuth("secret", "Bearer secret").calledNext, true);
});

test("recipe numeric fields accept only non-negative PostgreSQL integers", () => {
  assert.equal(isNonNegativeInteger(0), true);
  assert.equal(isNonNegativeInteger(2147483647), true);
  assert.equal(isNonNegativeInteger(-1), false);
  assert.equal(isNonNegativeInteger(1.5), false);
  assert.equal(isNonNegativeInteger("4"), false);
  assert.equal(isNonNegativeInteger(2147483648), false);
});

test("recipe create rejects invalid numeric fields before writing", async () => {
  let statusCode;
  const res = {
    status(code) {
      statusCode = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
  };
  await create({ body: { name: "Nasi", cost_estimate: -1 } }, res);
  assert.equal(statusCode, 400);
  assert.match(res.body.error, /cost_estimate/);
});
