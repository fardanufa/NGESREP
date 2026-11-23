export function isNonNegativeInteger(value) {
  return Number.isInteger(value) && value >= 0 && value <= 2147483647;
}

export function isId(value) {
  return typeof value === "string" && /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(value);
}

export function validateId(req, res, next, id) {
  if (!isId(id)) {
    return res.status(404).json({ error: "Data tidak ditemukan" });
  }
  next();
}
