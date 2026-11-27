import { adminRequest } from "../admin.js";
import { forgetCatalogCache, getCategories, getRecipes } from "../api.js";
import { catalogPayload, recipeForm, saveRecipe } from "../recipeEditor.js";
import { esc, imgTag, rupiah, skeletonList, stateBox, retryButton, toast } from "../ui.js";

const adminButton = "min-h-11 rounded-full px-4 py-2 text-sm font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-50";

function card(recipe, priority, isAdmin, locked) {
  return `
  <article class="overflow-hidden rounded-2xl bg-surface-container-lowest shadow-sm transition-shadow hover:shadow-md">
  <a href="#/resep/${esc(recipe.id)}" class="block focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary">
    <div class="relative w-full aspect-[16/10] overflow-hidden bg-surface-container">
      ${imgTag(recipe.image_url, recipe.name, "w-full h-full object-cover", priority ? "eager" : "lazy")}
      <div class="absolute top-3 left-3">
        <span class="bg-secondary-fixed/90 backdrop-blur-md text-on-secondary-fixed font-label-sm text-label-sm px-2.5 py-1 rounded-full font-bold shadow-sm">${rupiah(recipe.cost_estimate)} / porsi</span>
      </div>
    </div>
    <div class="p-space-md flex flex-col gap-2">
      <div class="flex items-center gap-1 text-on-surface-variant font-label-md text-label-md">
        <span aria-hidden="true" class="material-symbols-outlined text-[16px] text-primary">timer</span>${Number(recipe.cook_time) || 0} menit
      </div>
      <h2 class="font-headline-sm text-headline-sm text-on-surface font-bold">${esc(recipe.name)}</h2>
      <p class="font-body-sm text-body-sm text-on-surface-variant line-clamp-2 leading-relaxed">${esc(recipe.description || "")}</p>
      <div class="pt-1 flex items-center justify-end">
        <span class="inline-flex items-center bg-primary text-on-primary px-4 py-1.5 rounded-full font-label-md text-label-md font-semibold shadow-sm">Lihat Resep</span>
      </div>
    </div>
  </a>
  ${isAdmin ? `<div class="flex justify-end gap-2 border-t border-outline-variant px-space-md py-2">
    <button type="button" data-edit="${esc(recipe.id)}" aria-label="Ubah ${esc(recipe.name)}" ${locked ? "disabled" : ""} class="${adminButton} bg-surface-container-low hover:bg-surface-container-high">Ubah</button>
    <button type="button" data-remove="${esc(recipe.id)}" aria-label="Hapus ${esc(recipe.name)}" ${locked ? "disabled" : ""} class="${adminButton} text-error hover:bg-error-container">Hapus</button>
  </div>` : ""}
  </article>`;
}

function chipLabel(id, label, active) {
  const style = active
    ? "bg-primary text-on-primary"
    : "bg-surface-container-lowest text-on-surface";
  const icon = id === "all" ? `<span aria-hidden="true" class="material-symbols-outlined text-[16px]">local_fire_department</span>` : "";
  return `<button type="button" data-category="${esc(id)}" aria-pressed="${active}" class="${style} min-h-11 min-w-11 px-space-md py-2 rounded-full font-label-lg text-label-lg whitespace-nowrap shadow-sm shrink-0 flex items-center gap-1 transition-transform active:scale-95">${icon}${esc(label)}</button>`;
}

export async function beranda(main, _id, signal) {
  main.innerHTML = `
  <section class="px-gutter pt-space-xs pb-space-sm">
    <div class="bg-gradient-to-br from-surface-container-low via-surface-container to-surface-container-highest rounded-2xl p-space-md shadow-sm">
      <p class="font-body-md text-body-md text-on-surface-variant leading-relaxed font-medium">Solusi masak lezat &amp; hemat ramah kantong mahasiswa kos.</p>
    </div>
  </section>

  <section class="px-gutter pb-space-sm">
    <div class="relative flex items-center w-full bg-surface-container-lowest rounded-full shadow-sm focus-within:outline focus-within:outline-2 focus-within:outline-primary">
      <span aria-hidden="true" class="material-symbols-outlined text-outline ml-space-md text-[22px]">search</span>
      <input id="recipe-search" type="search" aria-label="Cari resep atau bahan" placeholder="Cari resep atau bahan..."
        class="w-full bg-transparent py-3 pl-space-xs pr-space-md text-on-surface placeholder:text-on-surface-variant font-body-md text-body-md focus:outline-none">
    </div>
  </section>

  <section class="w-full pb-space-md">
    <div id="category-chips" class="flex items-center gap-space-xs overflow-x-auto px-gutter no-scrollbar py-1"></div>
  </section>

  <section class="px-gutter flex flex-col gap-space-md pb-space-lg">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 tabindex="-1" class="font-headline-lg text-headline-lg text-on-surface font-bold">Resep Anak Kos</h1>
        <p data-count aria-live="polite" class="font-body-sm text-body-sm text-on-surface-variant">Memuat resep…</p>
      </div>
      <div data-admin-controls class="flex flex-wrap gap-2"></div>
    </div>
    <div data-editor hidden></div>
    <div id="recipe-list" class="flex flex-col gap-space-md md:grid md:grid-cols-2 xl:grid-cols-3">${skeletonList(3)}</div>
  </section>`;

  const list = main.querySelector("#recipe-list");
  const chips = main.querySelector("#category-chips");
  const input = main.querySelector("#recipe-search");
  const toolbar = main.querySelector("[data-admin-controls]");
  const editor = main.querySelector("[data-editor]");
  const heading = main.querySelector("h1");
  const request = (path, options) => adminRequest(path, {
    ...options, signal: AbortSignal.any([signal, AbortSignal.timeout(20000)]),
  });

  let recipes;
  let categories = [];
  let category = "all";
  let query = "";
  let isAdmin = false;
  let busy = false;
  const locked = () => busy || !editor.hidden;

  function filtered() {
    const keyword = query.toLowerCase();
    return recipes.filter((recipe) => {
      const matchCategory = category === "all" || recipe.category_id === category;
      const matchSearch =
        !keyword ||
        (recipe.name || "").toLowerCase().includes(keyword) ||
        (recipe.ingredients || "").toLowerCase().includes(keyword);
      return matchCategory && matchSearch;
    });
  }

  function draw() {
    if (!recipes) return;
    const items = filtered();
    const count = main.querySelector("[data-count]");
    if (count) {
      count.textContent = items.length
        ? `${items.length} resep ${query || category !== "all" ? "ditemukan" : "praktis dan hemat"}`
        : "Tidak ada resep yang cocok";
    }
    list.innerHTML = items.length
      ? items.map((recipe, index) => card(recipe, index === 0, isAdmin, locked())).join("")
      : stateBox("search_off", "Resep tidak ditemukan", "Coba kata kunci lain atau pilih kategori Semua.");
  }

  function lockControls() {
    for (const button of main.querySelectorAll("[data-add], [data-edit], [data-remove], [data-logout]")) {
      button.disabled = locked();
    }
  }

  function closeEditor() {
    editor.hidden = true;
    editor.replaceChildren();
    lockControls();
  }

  function clearAdmin() {
    isAdmin = false;
    toolbar.replaceChildren();
    closeEditor();
    draw();
    heading.focus();
  }

  async function runAdmin(run, showError = toast) {
    busy = true;
    lockControls();
    try {
      await run();
    } catch (error) {
      if (signal.aborted) return;
      if (error.status === 401) {
        clearAdmin();
        toast("Sesi admin berakhir. Masuk lagi lewat Profil.");
      } else {
        showError(error instanceof TypeError || error.name === "TimeoutError"
          ? "Tidak dapat menghubungi layanan admin. Periksa koneksi lalu coba lagi." : error.message);
      }
    } finally {
      busy = false;
      if (!signal.aborted) lockControls();
    }
  }

  async function afterWrite(id, message) {
    forgetCatalogCache("recipes", id);
    if (signal.aborted) return;
    closeEditor();
    toast(message);
    await load();
    if (!signal.aborted) heading.focus();
  }

  function openEditor(row, trigger) {
    editor.innerHTML = recipeForm(row, categories);
    editor.hidden = false;
    lockControls();
    const form = editor.querySelector("form");
    const fields = form.querySelector("fieldset");
    const notice = form.querySelector("[role=alert]");
    const submit = form.querySelector("[type=submit]");
    const name = form.elements.namedItem("name");
    const showError = (message = "") => {
      notice.textContent = message;
      notice.classList.toggle("hidden", !message);
    };
    name.focus();
    form.querySelector("[data-cancel]").onclick = () => {
      closeEditor();
      if (trigger.isConnected) trigger.focus();
      else heading.focus();
    };
    let uploadedFile;
    let uploadedPhoto;
    form.onsubmit = async (event) => {
      event.preventDefault();
      if (busy) return;
      const data = catalogPayload(new FormData(form));
      const file = form.querySelector("[type=file]").files[0];
      showError();
      fields.disabled = true;
      submit.textContent = "Menyimpan…";
      await runAdmin(async () => {
        const saved = await saveRecipe(request, row, data, file, async (body) => {
          if (body !== uploadedFile) {
            uploadedPhoto = await request("upload", { method: "POST", body });
            uploadedFile = body;
          }
          return uploadedPhoto;
        });
        await afterWrite(row.id || saved.id, row.id ? "Resep diperbarui." : "Resep ditambahkan.");
      }, showError);
      fields.disabled = false;
      submit.textContent = "Simpan";
      if (!signal.aborted && editor.contains(form)) submit.focus();
    };
  }

  toolbar.addEventListener("click", (event) => {
    if (!isAdmin || locked()) return;
    const add = event.target.closest("[data-add]");
    if (add) return openEditor({}, add);
    if (event.target.closest("[data-logout]")) {
      void runAdmin(async () => {
        await request("session", { method: "DELETE" });
        if (signal.aborted) return;
        clearAdmin();
        toast("Anda sudah keluar dari sesi admin.");
      });
    }
  });

  list.addEventListener("click", (event) => {
    if (!isAdmin || locked()) return;
    const button = event.target.closest("[data-edit], [data-remove]");
    if (!button) return;
    const row = recipes?.find(({ id }) => id === (button.dataset.edit ?? button.dataset.remove));
    if (!row) return;
    if (button.dataset.edit) return openEditor(row, button);
    if (!confirm(`Hapus resep “${row.name}”?`)) return;
    void runAdmin(async () => {
      await request(`recipes/${encodeURIComponent(row.id)}`, { method: "DELETE" });
      await afterWrite(row.id, "Resep dihapus.");
    });
  });

  function paintChips() {
    chips.querySelectorAll("[data-category]").forEach((button) => {
      const active = button.dataset.category === category;
      button.setAttribute("aria-pressed", String(active));
      button.classList.toggle("bg-primary", active);
      button.classList.toggle("text-on-primary", active);
      button.classList.toggle("bg-surface-container-lowest", !active);
      button.classList.toggle("text-on-surface", !active);
    });
  }

  chips.addEventListener("click", (event) => {
    const button = event.target.closest("[data-category]");
    if (!button) return;
    category = button.dataset.category;
    paintChips();
    draw();
  });

  let timer;
  input.addEventListener("input", () => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      query = input.value.trim();
      draw();
    }, 200);
  });

  async function load() {
    recipes = undefined;
    list.innerHTML = skeletonList(3);
    try {
      recipes = await getRecipes(signal);
      if (signal.aborted) return;
      draw();
    } catch {
      if (signal.aborted) return;
      list.innerHTML = stateBox(
        "cloud_off",
        "Gagal memuat resep",
        "Periksa koneksi internet lalu coba lagi.",
        retryButton()
      );
      list.querySelector("[data-retry]").onclick = load;
    }
  }

  const categoryLoad = getCategories(signal).then((rows) => {
    if (signal.aborted) return;
    categories = rows;
    chips.innerHTML = chipLabel("all", "Semua", true) +
      categories.map((item) => chipLabel(item.id, item.name, false)).join("");
  }).catch(() => { /* Filter kategori tidak wajib. */ });
  const adminLoad = request("session").then(async () => {
    await categoryLoad;
    if (signal.aborted) return;
    isAdmin = true;
    toolbar.innerHTML = `<button type="button" data-add class="${adminButton} bg-primary text-on-primary hover:opacity-90">Tambah Resep</button>
      <button type="button" data-logout class="${adminButton} bg-surface-container-low hover:bg-surface-container-high">Keluar admin</button>`;
    draw();
  }).catch(() => { /* Beranda tetap publik dan dapat dipakai luring. */ });
  await Promise.all([load(), categoryLoad, adminLoad]);
}
