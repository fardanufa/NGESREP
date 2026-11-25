import { adminRequest } from "../admin.js";
import { forgetCatalogCache } from "../api.js";
import { esc, imgTag, loadingBox, toast } from "../ui.js";

const catalog = {
  recipes: ["Resep", "name", [
    ["name", "Nama resep"], ["description", "Deskripsi", "textarea"],
    ["ingredients", "Bahan (satu per baris)", "textarea"], ["steps", "Langkah (satu per baris)", "textarea"],
    ["cost_estimate", "Biaya per porsi (Rp)", "number"], ["cook_time", "Waktu masak (menit)", "number"],
    ["category_id", "Kategori", "select"],
  ]],
  tips: ["Tips", "title", [
    ["title", "Judul tips"], ["content", "Isi tips (pisahkan paragraf dengan baris kosong)", "textarea"],
    ["highlight", "Catatan hemat", "textarea"],
  ]],
  categories: ["Kategori", "name", [["name", "Nama kategori"]]],
};
const button = "min-h-11 rounded-full px-4 py-2 text-sm font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-50";
const primary = `${button} bg-primary text-on-primary hover:opacity-90`;
const secondary = `${button} bg-surface-container-low text-on-surface hover:bg-surface-container-high`;
const field = "block w-full rounded-xl border border-outline bg-surface px-3 py-2 min-h-11 focus:outline-primary";

function fieldHTML([name, label, type], row, required, categories) {
  const value = row[name] ?? "";
  const attrs = `class="${field}" id="catalog-${name}" name="${name}"`;
  const control = type === "select"
    ? `<select ${attrs}><option value="">Tanpa kategori</option>${categories.map(({ id, name }) =>
      `<option value="${esc(id)}"${id === value ? " selected" : ""}>${esc(name)}</option>`).join("")}</select>`
    : type === "textarea" ? `<textarea ${attrs} rows="3">${esc(value ? `\n${value}` : "")}</textarea>`
    : `<input ${attrs} type="${type || "text"}" value="${esc(value)}" ${required ? "required" : ""} ${type === "number" ? 'min="0" max="2147483647" step="1" placeholder="0"' : ""}>`;
  return `<div><label for="catalog-${name}" class="block mb-1 font-semibold text-sm">${label}</label>${control}</div>`;
}

export function catalogPayload(values, fields) {
  return Object.fromEntries(fields.map(([name, , type]) => {
    const value = values.get(name).trim();
    return [name, type === "number" ? Number(value) : value || null];
  }));
}

export async function kelola(main, _id, signal) {
  const request = (path, options) => adminRequest(path, { signal: AbortSignal.any([signal, AbortSignal.timeout(20000)]), ...options });
  main.innerHTML = `<section class="w-full max-w-3xl mx-auto px-gutter py-space-lg space-y-4">
    <h1 class="font-headline-lg text-headline-lg">Kelola Katalog</h1>
    <p role="alert" class="hidden rounded-xl bg-error-container text-on-error-container px-4 py-3"></p>
    <div data-panel>${loadingBox("Memeriksa sesi admin…")}</div>
  </section>`;
  const panel = main.querySelector("[data-panel]");
  const alert = main.querySelector("[role=alert]");
  const showError = (message = "") => {
    alert.textContent = message;
    alert.classList.toggle("hidden", !message);
  };
  let entity = "recipes";

  function login(message) {
    panel.innerHTML = `<form class="max-w-md rounded-2xl bg-surface-container-lowest p-4 space-y-4">
      <p class="text-on-surface-variant">Masuk sebagai admin untuk menambah, mengubah, atau menghapus isi katalog.</p>
      <label for="catalog-key" class="block font-semibold text-sm">Kunci admin</label>
      <input id="catalog-key" class="${field}" type="password" autocomplete="off" required>
      <button class="${primary}">Masuk</button>
    </form>`;
    showError(message);
    const form = panel.querySelector("form");
    const key = form.querySelector("input");
    form.onsubmit = async (event) => {
      event.preventDefault();
      const body = { key: key.value };
      key.value = "";
      await action(form.querySelector("button"), async () => {
        await request("session", { method: "POST", body });
        await load();
      }, false);
    };
    if (message) key.focus();
  }

  async function action(control, run, handleSession = true) {
    control.disabled = true;
    showError();
    try {
      await run();
    } catch (error) {
      if (signal.aborted) return;
      const message = error.status ? error.message : "Tidak dapat menghubungi layanan admin. Periksa koneksi lalu coba lagi.";
      if (handleSession && error.status === 401) login(message);
      else showError(message);
    } finally {
      control.disabled = false;
    }
  }

  async function load() {
    if (signal.aborted) return;
    panel.innerHTML = `<div class="flex flex-wrap items-end justify-between gap-3">
      <label class="space-y-1 font-semibold text-sm">Jenis konten
        <select data-entity class="${field}">${Object.entries(catalog).map(([id, [label]]) =>
          `<option value="${id}"${id === entity ? " selected" : ""}>${label}</option>`).join("")}</select>
      </label>
      <button type="button" data-logout class="${secondary}">Keluar admin</button>
    </div><div data-list class="mt-4">${loadingBox("Memuat katalog…")}</div>`;
    const select = panel.querySelector("[data-entity]");
    select.onchange = () => {
      entity = select.value;
      void load();
      panel.querySelector("[data-entity]")?.focus();
    };
    const logout = panel.querySelector("[data-logout]");
    logout.onclick = () => action(logout, async () => {
      await request("session", { method: "DELETE" });
      if (!signal.aborted) login("Anda sudah keluar dari sesi admin.");
    });
    const list = panel.querySelector("[data-list]");
    const current = entity;
    showError();
    try {
      const [rows, categories] = await Promise.all([
        request(current), current === "recipes" ? request("categories") : [],
      ]);
      if (!signal.aborted && panel.contains(list)) renderList(list, current, rows, categories);
    } catch (error) {
      if (signal.aborted || !panel.contains(list)) return;
      if (error.status === 401) return login(error.message);
      list.innerHTML = `<button type="button" class="${secondary}">Coba lagi</button>`;
      list.querySelector("button").onclick = load;
      showError(error.status ? error.message : "Katalog tidak dapat dimuat. Periksa koneksi lalu coba lagi.");
    }
  }

  function renderList(list, current, rows, categories) {
    const [label, title, fields] = catalog[current];
    list.innerHTML = `<div class="flex items-center justify-between gap-3 mb-3">
      <h2 tabindex="-1" class="font-headline-sm text-headline-sm">Daftar ${label} <span class="text-sm font-normal text-on-surface-variant">(${rows.length})</span></h2>
      <button data-add type="button" class="${primary}">Tambah ${label}</button>
    </div>
    <div data-editor></div>
    ${rows.length ? `<ul class="divide-y divide-outline-variant border-y border-outline-variant">${rows.map((row, index) => `
      <li class="flex flex-wrap items-center justify-between gap-2 py-2">
        <span class="min-w-0 break-words flex-1">${esc(row[title])}</span>
        <div class="flex gap-1">
          <button type="button" data-edit="${index}" aria-label="Ubah ${esc(row[title])}" class="${secondary}">Ubah</button>
          <button type="button" data-remove="${index}" aria-label="Hapus ${esc(row[title])}" class="${button} text-error hover:bg-error-container">Hapus</button>
        </div>
      </li>`).join("")}</ul>` : `<p class="py-4 text-on-surface-variant">Belum ada ${label.toLowerCase()}. Gunakan tombol Tambah untuk membuatnya.</p>`}`;
    const editor = list.querySelector("[data-editor]");
    const add = list.querySelector("[data-add]");
    const setListLocked = (locked) => {
      for (const control of list.querySelectorAll("[data-add], [data-edit], [data-remove]")) control.disabled = locked;
    };
    const lockNavigation = (locked) => {
      for (const control of panel.querySelectorAll("[data-entity], [data-logout]")) control.disabled = locked;
    };
    const afterWrite = async (id, message) => {
      forgetCatalogCache(current, id);
      if (signal.aborted || !panel.contains(list)) return;
      toast(message);
      await load();
      panel.querySelector("h2")?.focus();
    };

    function edit(row, trigger) {
      showError();
      const hasImage = current !== "categories";
      editor.innerHTML = `<form class="rounded-2xl bg-surface-container-lowest p-4 mb-4">
        <fieldset class="space-y-4 min-w-0 disabled:opacity-75">
          <legend class="font-semibold mb-3">${row.id ? "Ubah" : "Tambah"} ${label}</legend>
          ${fields.map((entry) => fieldHTML(entry, row, entry[0] === title, categories)).join("")}
          ${hasImage ? `<div class="space-y-2">
            ${row.image_url ? imgTag(row.image_url, `Foto ${row[title]}`, "w-24 h-16 object-cover rounded-lg") : ""}
            <label for="catalog-photo" class="block font-semibold text-sm">${row.image_url ? "Ganti foto" : "Foto (opsional)"}</label>
            <input id="catalog-photo" class="${field}" type="file" accept="image/jpeg,image/png,image/webp" aria-describedby="catalog-photo-hint">
            <p id="catalog-photo-hint" class="text-sm text-on-surface-variant">JPEG, PNG, atau WebP, maksimal 2 MB.</p>
          </div>` : ""}
          <div class="flex gap-2"><button class="${primary}">Simpan</button>
          <button type="button" data-cancel class="${secondary}">Batal</button></div>
        </fieldset>
      </form>`;
      const form = editor.querySelector("form");
      setListLocked(true);
      form.querySelector("input").focus();
      form.querySelector("[data-cancel]").onclick = () => {
        editor.replaceChildren();
        setListLocked(false);
        showError();
        trigger.focus();
      };
      let uploadedFile;
      let imageUrl;
      form.onsubmit = async (event) => {
        event.preventDefault();
        const data = catalogPayload(new FormData(form), fields);
        const file = form.querySelector("[type=file]")?.files[0];
        if (!data[title]) return showError(`Isi ${label.toLowerCase()} terlebih dahulu.`);
        if (file && (!["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 2 * 1024 * 1024)) {
          return showError("Pilih JPEG, PNG, atau WebP dengan ukuran maksimal 2 MB.");
        }
        lockNavigation(true);
        await action(form.querySelector("fieldset"), async () => {
          if (file) {
            if (file !== uploadedFile) {
              ({ image_url: imageUrl } = await request("upload", { method: "POST", body: file }));
              uploadedFile = file;
            }
            data.image_url = imageUrl;
          }
          await request(row.id ? `${current}/${encodeURIComponent(row.id)}` : current, {
            method: row.id ? "PUT" : "POST", body: data,
          });
          await afterWrite(row.id, `${label} ${row.id ? "diperbarui" : "ditambahkan"}.`);
        });
        lockNavigation(false);
      };
    }

    add.onclick = () => edit({}, add);
    for (const control of list.querySelectorAll("[data-edit]")) {
      control.onclick = () => edit(rows[control.dataset.edit], control);
    }
    for (const control of list.querySelectorAll("[data-remove]")) {
      control.onclick = async () => {
        const row = rows[control.dataset.remove];
        const note = current === "categories" ? " Resep terkait tetap ada, tetapi tidak lagi memiliki kategori ini." : "";
        if (!confirm(`Hapus ${label.toLowerCase()} “${row[title]}”?${note}`)) return;
        setListLocked(true);
        lockNavigation(true);
        await action(control, async () => {
          await request(`${current}/${encodeURIComponent(row.id)}`, { method: "DELETE" });
          await afterWrite(row.id, `${label} dihapus.`);
        });
        setListLocked(false);
        lockNavigation(false);
      };
    }
  }

  try {
    await request("session");
    await load();
  } catch (error) {
    if (!signal.aborted) login(error.status === 401 ? "" : error.message);
  }
}
