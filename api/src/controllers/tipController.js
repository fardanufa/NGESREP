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
  const { data, error } = await model.findAll({ search: req.query.search });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
}

export async function detail(req, res) {
  const { data, error } = await model.findById(req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  if (!data) return res.status(404).json({ error: "Tips tidak ditemukan" });
  res.json(data);
}

export async function create(req, res) {
  const payload = pickFields(req.body);
  if (typeof payload.title !== "string" || !payload.title.trim()) {
    return res.status(400).json({ error: "Field title wajib diisi" });
  }

  const { data, error } = await model.create(payload);
  if (error) return res.status(500).json({ error: error.message });
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
  if (error) return res.status(500).json({ error: error.message });
  if (!data) return res.status(404).json({ error: "Tips tidak ditemukan" });
  res.json(data);
}

export async function remove(req, res) {
  const { data, error } = await model.remove(req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  if (!data) return res.status(404).json({ error: "Tips tidak ditemukan" });
  res.json({ message: "dihapus" });
}
