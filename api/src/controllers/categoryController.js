import * as model from "../models/categoryModel.js";

// Controller memeriksa hasil model lalu mengirim response.

export async function list(req, res) {
  const { data, error } = await model.findAll();
  if (error) return res.status(500).json({ error: "Terjadi kesalahan server" });
  res.json(data);
}

export async function detail(req, res) {
  const { data, error } = await model.findById(req.params.id);
  if (error) return res.status(500).json({ error: "Terjadi kesalahan server" });
  if (!data) return res.status(404).json({ error: "Kategori tidak ditemukan" });
  res.json(data);
}

export async function create(req, res) {
  const name = typeof req.body.name === "string" && req.body.name.trim();
  if (!name) return res.status(400).json({ error: "Field name wajib diisi" });

  const { data, error } = await model.create({ name });
  if (error) return res.status(500).json({ error: "Terjadi kesalahan server" });
  res.status(201).json(data);
}

export async function update(req, res) {
  if (req.body.name === undefined) {
    return res.status(400).json({ error: "Tidak ada field yang diperbarui" });
  }

  const name = typeof req.body.name === "string" && req.body.name.trim();
  if (!name) return res.status(400).json({ error: "Field name tidak boleh kosong" });

  const { data, error } = await model.update(req.params.id, { name });
  if (error) return res.status(500).json({ error: "Terjadi kesalahan server" });
  if (!data) return res.status(404).json({ error: "Kategori tidak ditemukan" });
  res.json(data);
}

export async function remove(req, res) {
  const { data, error } = await model.remove(req.params.id);
  if (error) return res.status(500).json({ error: "Terjadi kesalahan server" });
  if (!data) return res.status(404).json({ error: "Kategori tidak ditemukan" });
  res.json({ message: "dihapus" });
}
