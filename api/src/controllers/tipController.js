import * as model from "../models/tipModel.js";
import { pick } from "../validation.js";

const FIELDS = ["title", "content", "highlight", "image_url"];

// Field opsional tetap boleh null untuk mengosongkan nilai.
function invalidTextField(payload) {
  return FIELDS.slice(1).find(
    (field) => payload[field] !== undefined && payload[field] !== null && typeof payload[field] !== "string"
  );
}

export async function list(req, res) {
  if (req.query.search !== undefined && (typeof req.query.search !== "string" || req.query.search.length > 100)) {
    return res.status(400).json({ error: "search tidak valid" });
  }
  const { data, error } = await model.findAll({ search: req.query.search });
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
  if (!data) return res.status(404).json({ error: "Tips tidak ditemukan" });
  res.json(data);
}

export async function create(req, res) {
  const payload = pick(req.body, FIELDS);
  if (typeof payload.title !== "string" || !payload.title.trim()) {
    return res.status(400).json({ error: "Field title wajib diisi" });
  }
  const invalid = invalidTextField(payload);
  if (invalid) return res.status(400).json({ error: `Field ${invalid} harus berupa teks` });

  const { data, error } = await model.create(payload);
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
  if (payload.title !== undefined && (typeof payload.title !== "string" || !payload.title.trim())) {
    return res.status(400).json({ error: "Field title tidak boleh kosong" });
  }
  const invalid = invalidTextField(payload);
  if (invalid) return res.status(400).json({ error: `Field ${invalid} harus berupa teks` });

  const { data, error } = await model.update(req.params.id, payload);
  if (error) {
    console.error(error);
    return res.status(500).json({ error: "Terjadi kesalahan server" });
  }
  if (!data) return res.status(404).json({ error: "Tips tidak ditemukan" });
  res.json(data);
}

export async function remove(req, res) {
  const { data, error } = await model.remove(req.params.id);
  if (error) {
    console.error(error);
    return res.status(500).json({ error: "Terjadi kesalahan server" });
  }
  if (!data) return res.status(404).json({ error: "Tips tidak ditemukan" });
  res.json({ message: "dihapus" });
}
