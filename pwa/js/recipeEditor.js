import { esc, imgTag } from "./ui.js";

const fields = [
  ["name", "Nama resep"], ["description", "Deskripsi", "textarea"],
  ["ingredients", "Bahan (satu per baris)", "textarea"], ["steps", "Langkah (satu per baris)", "textarea"],
  ["cost_estimate", "Biaya per porsi (Rp)", "number"], ["cook_time", "Waktu masak (menit)", "number"],
  ["category_id", "Kategori", "select"],
];
const field = "block w-full rounded-xl border border-outline bg-surface px-3 py-2 min-h-11 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary";

function fieldHTML([name, label, type], row, categories) {
  const value = row[name] ?? "";
  const attrs = `class="${field}" id="catalog-${name}" name="${name}"`;
  const control = type === "select"
    ? `<select ${attrs}><option value="">Tanpa kategori</option>${value && !categories.some(({ id }) => id === value)
      ? `<option value="${esc(value)}" selected>Kategori saat ini</option>` : ""}${categories.map(({ id, name }) =>
      `<option value="${esc(id)}"${id === value ? " selected" : ""}>${esc(name)}</option>`).join("")}</select>`
    : type === "textarea" ? `<textarea ${attrs} rows="3">${esc(value ? `\n${value}` : "")}</textarea>`
    : `<input ${attrs} type="${type || "text"}" value="${esc(value)}" ${name === "name" ? "required" : ""} ${type === "number" ? 'min="0" max="2147483647" step="1" placeholder="0"' : ""}>`;
  return `<div><label for="catalog-${name}" class="mb-1 block text-sm font-semibold">${label}</label>${control}</div>`;
}

export function catalogPayload(values) {
  return Object.fromEntries(fields.map(([name, , type]) => {
    const value = String(values.get(name) ?? "").trim();
    return [name, type === "number" ? Number(value) : value || null];
  }));
}

export async function saveRecipe(request, row, data, file, upload = (body) => request("upload", { method: "POST", body })) {
  if (!data.name) throw new Error("Isi nama resep terlebih dahulu.");
  if (file && (!["image/jpeg", "image/png", "image/webp"].includes(file.type) || !file.size || file.size > 2 * 1024 * 1024)) {
    throw new Error("Pilih foto JPEG, PNG, atau WebP dengan ukuran maksimal 2 MB.");
  }
  const photo = file ? await upload(file) : {};
  return request(row.id ? `recipes/${encodeURIComponent(row.id)}` : "recipes", {
    method: row.id ? "PUT" : "POST", body: { ...data, ...photo },
  });
}

export function recipeForm(row, categories) {
  return `<form method="post" class="rounded-2xl bg-surface-container-lowest p-4 md:p-6">
    <fieldset class="min-w-0 space-y-4 disabled:opacity-75">
      <legend class="mb-3 font-headline-sm text-headline-sm">${row.id ? "Ubah resep" : "Tambah resep"}</legend>
      ${fields.map((entry) => fieldHTML(entry, row, categories)).join("")}
      <div class="space-y-2">
        ${row.image_url ? imgTag(row.image_url, `Foto ${row.name}`, "h-16 w-24 rounded-lg object-cover") : ""}
        <label for="catalog-photo" class="block text-sm font-semibold">${row.image_url ? "Ganti foto" : "Foto (opsional)"}</label>
        <input id="catalog-photo" class="${field}" type="file" accept="image/jpeg,image/png,image/webp" aria-describedby="catalog-photo-hint">
        <p id="catalog-photo-hint" class="text-sm text-on-surface-variant">JPEG, PNG, atau WebP, maksimal 2 MB.</p>
      </div>
      <p role="alert" class="hidden text-sm text-error"></p>
      <div class="flex gap-2">
        <button type="submit" class="min-h-11 rounded-full bg-primary px-4 py-2 font-semibold text-on-primary hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">Simpan</button>
        <button type="button" data-cancel class="min-h-11 rounded-full bg-surface-container px-4 py-2 font-semibold hover:bg-surface-container-high focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary">Batal</button>
      </div>
    </fieldset>
  </form>`;
}
