import * as model from "../models/tipModel.js";

const FIELDS = ["title", "content", "highlight", "image_url"];

function pickFields(body) {
  const data = {};
  for (const key of FIELDS) {
    if (body[key] !== undefined) data[key] = body[key];
  }
  return data;
}

export async function list(req, res) {
  if (typeof req.query.search === "string" && req.query.search.length > 100) {
    return res.status(400).json({ error: "search maksimal 100 karakter" });
  }
  const { data, error } = await model.findAll({ search: req.query.search });
  if (error) return res.status(500).json({ error: "Terjadi kesalahan server" });
  res.json(data);
}

export async function detail(req, res) {
  const { data, error } = await model.findById(req.params.id);
  if (error) return res.status(500).json({ error: "Terjadi kesalahan server" });
  if (!data) return res.status(404).json({ error: "Tips tidak ditemukan" });
  res.json(data);
}

export async function create(req, res) {
  const payload = pickFields(req.body);
  if (typeof payload.title !== "string" || !payload.title.trim()) {
    return res.status(400).json({ error: "Field title wajib diisi" });
  }

  const { data, error } = await model.create(payload);
  if (error) return res.status(500).json({ error: "Terjadi kesalahan server" });
  res.status(201).json(data);
}

export async function update(req, res) {
  const payload = pickFields(req.body);
  if (!Object.keys(payload).length) {
    return res.status(400).json({ error: "Tidak ada field yang diperbarui" });
  }
  if (payload.title !== undefined && (typeof payload.title !== "string" || !payload.title.trim())) {
    return res.status(400).json({ error: "Field title tidak boleh kosong" });
  }

  const { data, error } = await model.update(req.params.id, payload);
  if (error) return res.status(500).json({ error: "Terjadi kesalahan server" });
  if (!data) return res.status(404).json({ error: "Tips tidak ditemukan" });
  res.json(data);
}

export async function remove(req, res) {
  const { data, error } = await model.remove(req.params.id);
  if (error) return res.status(500).json({ error: "Terjadi kesalahan server" });
  if (!data) return res.status(404).json({ error: "Tips tidak ditemukan" });
  res.json({ message: "dihapus" });
}
