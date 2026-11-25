import * as model from "../models/recipeModel.js";
import { isId, isNonNegativeInteger, pick } from "../validation.js";

// Field yang boleh diisi lewat POST/PUT.
const FIELDS = [
  "name",
  "description",
  "ingredients",
  "steps",
  "image_url",
  "cost_estimate",
  "cook_time",
  "category_id",
];

function invalidNumberField(payload) {
  return ["cost_estimate", "cook_time"].find(
    (field) => payload[field] !== undefined && !isNonNegativeInteger(payload[field])
  );
}

export async function list(req, res) {
  if (req.query.category_id !== undefined && !isId(req.query.category_id)) {
    return res.status(400).json({ error: "category_id tidak valid" });
  }
  if (req.query.search !== undefined && (typeof req.query.search !== "string" || req.query.search.length > 100)) {
    return res.status(400).json({ error: "search tidak valid" });
  }
  const { data, error } = await model.findAll({
    categoryId: req.query.category_id,
    search: req.query.search,
  });
  if (error) {
    console.error(error);
    return res.status(500).json({ error: "Terjadi kesalahan server" });
  }
  res.json(data);
}

export async function detail(req, res) {
  const { data, error } = await model.findById(req.params.id);
  if (error) {
    console.error(error);
    return res.status(500).json({ error: "Terjadi kesalahan server" });
  }
  if (!data) return res.status(404).json({ error: "Resep tidak ditemukan" });
  res.json(data);
}

export async function create(req, res) {
  const payload = pick(req.body, FIELDS);
  if (typeof payload.name !== "string" || !payload.name.trim()) {
    return res.status(400).json({ error: "Field name wajib diisi" });
  }
  const invalid = invalidNumberField(payload);
  if (invalid) return res.status(400).json({ error: `Field ${invalid} harus bilangan bulat 0 atau lebih` });
  if (payload.category_id != null && !isId(payload.category_id)) {
    return res.status(400).json({ error: "category_id tidak valid" });
  }

  const { data, error } = await model.create(payload);
  if (error?.code === "23503") return res.status(400).json({ error: "Kategori tidak ditemukan" });
  if (error) {
    console.error(error);
    return res.status(500).json({ error: "Terjadi kesalahan server" });
  }
  res.status(201).json(data);
}

export async function update(req, res) {
  const payload = pick(req.body, FIELDS);
  if (!Object.keys(payload).length) {
    return res.status(400).json({ error: "Tidak ada field yang diperbarui" });
  }
  if (payload.name !== undefined && (typeof payload.name !== "string" || !payload.name.trim())) {
    return res.status(400).json({ error: "Field name tidak boleh kosong" });
  }
  const invalid = invalidNumberField(payload);
  if (invalid) return res.status(400).json({ error: `Field ${invalid} harus bilangan bulat 0 atau lebih` });
  if (payload.category_id != null && !isId(payload.category_id)) {
    return res.status(400).json({ error: "category_id tidak valid" });
  }

  const { data, error } = await model.update(req.params.id, payload);
  if (error?.code === "23503") return res.status(400).json({ error: "Kategori tidak ditemukan" });
  if (error) {
    console.error(error);
    return res.status(500).json({ error: "Terjadi kesalahan server" });
  }
  if (!data) return res.status(404).json({ error: "Resep tidak ditemukan" });
  res.json(data);
}

export async function remove(req, res) {
  const { data, error } = await model.remove(req.params.id);
  if (error) {
    console.error(error);
    return res.status(500).json({ error: "Terjadi kesalahan server" });
  }
  if (!data) return res.status(404).json({ error: "Resep tidak ditemukan" });
  res.json({ message: "dihapus" });
}
