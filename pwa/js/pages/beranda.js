import { getCategories, getRecipes } from "../api.js";
import { esc, imgTag, rupiah, skeletonList, stateBox, retryButton } from "../ui.js";

function card(recipe) {
  return `
  <a href="#/resep/${esc(recipe.id)}" class="block bg-surface-container-lowest rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200">
    <div class="relative w-full aspect-[16/10] overflow-hidden bg-surface-container">
      ${imgTag(recipe.image_url, recipe.name, "w-full h-full object-cover")}
      <div class="absolute top-3 left-3">
        <span class="bg-secondary-fixed/90 backdrop-blur-md text-on-secondary-fixed font-label-sm text-label-sm px-2.5 py-1 rounded-full font-bold shadow-sm">${rupiah(recipe.cost_estimate)} / porsi</span>
      </div>
    </div>
    <div class="p-space-md flex flex-col gap-2">
      <div class="flex items-center gap-1 text-on-surface-variant font-label-md text-label-md">
        <span class="material-symbols-outlined text-[16px] text-primary">timer</span>${Number(recipe.cook_time) || 0} menit
      </div>
      <h2 class="font-headline-sm text-headline-sm text-on-surface font-bold">${esc(recipe.name)}</h2>
      <p class="font-body-sm text-body-sm text-on-surface-variant line-clamp-2 leading-relaxed">${esc(recipe.description || "")}</p>
      <div class="pt-1 flex items-center justify-end">
        <span class="inline-flex items-center bg-primary text-on-primary px-4 py-1.5 rounded-full font-label-md text-label-md font-semibold shadow-sm">Lihat Resep</span>
      </div>
    </div>
  </a>`;
}

function chipLabel(id, label, active) {
  const style = active
    ? "bg-primary text-on-primary"
    : "bg-surface-container-lowest text-on-surface";
  const icon = id === "all" ? `<span aria-hidden="true" class="material-symbols-outlined text-[16px]">local_fire_department</span>` : "";
  return `<button type="button" data-category="${esc(id)}" aria-pressed="${active}" class="${style} min-h-11 min-w-11 px-space-md py-2 rounded-full font-label-lg text-label-lg whitespace-nowrap shadow-sm shrink-0 flex items-center gap-1 transition-transform active:scale-95">${icon}${esc(label)}</button>`;
}

export async function beranda(main) {
  main.innerHTML = `
  <section class="px-gutter pt-space-xs pb-space-sm">
    <div class="bg-gradient-to-br from-surface-container-low via-surface-container to-surface-container-highest rounded-2xl p-space-md shadow-sm">
      <p class="font-body-md text-body-md text-on-surface-variant leading-relaxed font-medium">Solusi masak lezat &amp; hemat ramah kantong mahasiswa kos.</p>
    </div>
  </section>

  <section class="px-gutter pb-space-sm">
    <div class="relative flex items-center w-full bg-surface-container-lowest rounded-full shadow-sm focus-within:outline focus-within:outline-2 focus-within:outline-primary">
      <span class="material-symbols-outlined text-outline ml-space-md text-[22px]">search</span>
      <input id="recipe-search" type="search" aria-label="Cari resep atau bahan" placeholder="Cari resep atau bahan..."
        class="w-full bg-transparent py-3 pl-space-xs pr-space-md text-on-surface placeholder:text-on-surface-variant font-body-md text-body-md focus:outline-none">
    </div>
  </section>

  <section class="w-full pb-space-md">
    <div id="category-chips" class="flex items-center gap-space-xs overflow-x-auto px-gutter no-scrollbar py-1"></div>
  </section>

  <section class="px-gutter flex flex-col gap-space-md pb-space-lg">
    <div>
      <h1 class="font-headline-sm text-headline-sm text-on-surface font-bold">Semua Resep</h1>
      <p class="font-body-sm text-body-sm text-on-surface-variant">Daftar resep praktis dan hemat untuk anak kos</p>
    </div>
    <div id="recipe-list" class="flex flex-col gap-space-md md:grid md:grid-cols-2 xl:grid-cols-3">${skeletonList(3)}</div>
  </section>`;

  const list = main.querySelector("#recipe-list");
  const chips = main.querySelector("#category-chips");
  const input = main.querySelector("#recipe-search");

  let recipes;
  let category = "all";
  let query = "";

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
    list.innerHTML = items.length
      ? items.map(card).join("")
      : stateBox("search_off", "Resep tidak ditemukan", "Coba kata kunci lain atau pilih kategori Semua.");
  }

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
    list.innerHTML = skeletonList(3);
    try {
      recipes = await getRecipes();
      draw();
    } catch {
      list.innerHTML = stateBox(
        "cloud_off",
        "Gagal memuat resep",
        "Periksa koneksi internet lalu coba lagi.",
        retryButton()
      );
      list.querySelector("[data-retry]").onclick = load;
    }
  }

  await Promise.all([load(), getCategories().then((categories) => {
    chips.innerHTML = chipLabel("all", "Semua", true) +
      categories.map((item) => chipLabel(item.id, item.name, false)).join("");
  }).catch(() => { /* Filter kategori tidak wajib. */ })]);
}
