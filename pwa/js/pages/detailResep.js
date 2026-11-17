import { getRecipe } from "../api.js";
import { esc, imgTag, rupiah, stateBox, retryButton } from "../ui.js";
import { isFavorite, toggleFavorite } from "../favorites.js";

const backLink = `<a href="#/beranda" class="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-primary text-on-primary font-label-lg shadow-sm hover:opacity-90 active:scale-95 transition-all">
  <span class="material-symbols-outlined text-[20px]">arrow_back</span>Kembali ke Beranda</a>`;

function ingredientItem(text) {
  return `
  <label class="ingredient-item flex items-center gap-3 p-3 rounded-2xl bg-surface-container-lowest shadow-sm cursor-pointer select-none transition-all active:scale-[0.99]">
    <input class="ingredient-checkbox hidden" type="checkbox">
    <div class="checkbox-indicator w-6 h-6 rounded-lg bg-surface-container-high flex items-center justify-center text-transparent transition-all shrink-0">
      <span class="material-symbols-outlined text-[16px] font-bold">check</span>
    </div>
    <span class="ingredient-text font-body-md text-body-md text-on-surface flex-1">${esc(text)}</span>
    <span class="material-symbols-outlined text-surface-dim text-[18px]">restaurant</span>
  </label>`;
}

function view(recipe) {
  const category = recipe.categories?.name || "";
  const ingredients = String(recipe.ingredients || "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  const steps = String(recipe.steps || "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  return `
  <div class="flex flex-col w-full pb-space-lg md:max-w-5xl md:mx-auto">
    <div class="relative w-full px-space-md pt-space-xs md:px-8">
      <div class="relative w-full aspect-[4/3] rounded-3xl overflow-hidden shadow-lg bg-surface-container">
        ${imgTag(recipe.image_url, recipe.name, "w-full h-full object-cover")}
        <div class="absolute inset-0 bg-gradient-to-t from-inverse-surface/80 via-transparent to-black/20"></div>

        <div class="absolute top-3 right-3 z-10">
          <button type="button" data-fav aria-label="Simpan ke favorit" class="w-11 h-11 rounded-full bg-surface-container-lowest/90 backdrop-blur-md flex items-center justify-center shadow-md active:scale-95 transition-all">
            <span class="material-symbols-outlined text-[22px]">favorite</span>
          </button>
        </div>

        ${
          category
            ? `<div class="absolute bottom-3 left-3 right-3">
                <span class="inline-flex items-center gap-1.5 px-3 py-1 bg-inverse-surface/60 backdrop-blur-md rounded-full text-on-primary font-label-sm text-label-sm">
                  <span class="material-symbols-outlined text-[15px] text-secondary-fixed">outdoor_grill</span>${esc(category)}
                </span>
              </div>`
            : ""
        }
      </div>
    </div>

    <div class="relative flex flex-col w-full -mt-4 bg-surface rounded-t-3xl px-space-md pt-5 z-20 md:px-8 md:pt-8">
      <div class="w-12 h-1 bg-surface-variant rounded-full mx-auto mb-4"></div>

      <div class="flex flex-col gap-1 mb-4">
        <h2 class="font-headline-lg text-headline-lg text-on-surface tracking-tight">${esc(recipe.name)}</h2>
        <p class="font-body-md text-body-md text-on-surface-variant leading-relaxed">${esc(recipe.description || "")}</p>
      </div>

      <div class="flex flex-wrap items-center gap-2 mb-6">
        <div class="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-secondary-container text-on-secondary-container font-label-md text-label-md">
          <span class="material-symbols-outlined text-[16px]">payments</span>
          <span>${rupiah(recipe.cost_estimate)} / porsi</span>
        </div>
        <div class="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface-container-high text-on-surface-variant font-label-md text-label-md">
          <span class="material-symbols-outlined text-[16px] text-primary">schedule</span>
          <span>${Number(recipe.cook_time) || 0} menit</span>
        </div>
      </div>

      <div class="flex flex-col mb-8">
        <div class="flex items-center justify-between mb-3">
          <div class="flex items-center gap-2">
            <span class="w-2.5 h-2.5 rounded-full bg-primary"></span>
            <h3 class="font-headline-sm text-headline-sm text-on-surface">Bahan-Bahan</h3>
          </div>
          <span data-counter class="font-label-md text-label-md text-on-surface-variant bg-surface-container px-2.5 py-0.5 rounded-full">0 / ${ingredients.length} siap</span>
        </div>
        <div class="flex flex-col gap-2.5">${ingredients.map(ingredientItem).join("")}</div>
      </div>

      <div class="flex flex-col mb-6">
        <div class="flex items-center gap-2 mb-4">
          <span class="w-2.5 h-2.5 rounded-full bg-primary-container"></span>
          <h3 class="font-headline-sm text-headline-sm text-on-surface">Langkah Memasak</h3>
        </div>
        <div class="flex flex-col gap-3.5">
          ${steps
            .map(
              (step, index) => `
            <div class="flex items-start gap-3.5 p-4 rounded-2xl bg-surface-container-lowest shadow-sm">
              <div class="w-7 h-7 rounded-full bg-primary text-on-primary font-headline-sm text-[15px] flex items-center justify-center shrink-0 mt-0.5">${index + 1}</div>
              <p class="font-body-md text-body-md text-on-surface leading-relaxed flex-1">${esc(step)}</p>
            </div>`
            )
            .join("")}
        </div>
      </div>
    </div>
  </div>`;
}

function mount(main, recipe) {
  const checkboxes = main.querySelectorAll(".ingredient-checkbox");
  const counter = main.querySelector("[data-counter]");

  checkboxes.forEach((checkbox) => {
    checkbox.addEventListener("change", () => {
      const item = checkbox.closest(".ingredient-item");
      const indicator = item.querySelector(".checkbox-indicator");
      const text = item.querySelector(".ingredient-text");

      indicator.classList.toggle("bg-secondary", checkbox.checked);
      indicator.classList.toggle("text-on-secondary", checkbox.checked);
      indicator.classList.toggle("bg-surface-container-high", !checkbox.checked);
      indicator.classList.toggle("text-transparent", !checkbox.checked);
      text.classList.toggle("line-through", checkbox.checked);
      text.classList.toggle("opacity-60", checkbox.checked);

      const ready = main.querySelectorAll(".ingredient-checkbox:checked").length;
      counter.textContent = `${ready} / ${checkboxes.length} siap`;
    });
  });

  const favButton = main.querySelector("[data-fav]");
  const icon = favButton.querySelector(".material-symbols-outlined");

  function paint(active) {
    icon.style.fontVariationSettings = `'FILL' ${active ? 1 : 0}`;
    icon.classList.toggle("text-primary", active);
    icon.classList.toggle("text-on-surface-variant", !active);
    favButton.setAttribute("aria-label", active ? "Hapus dari favorit" : "Simpan ke favorit");
  }

  paint(isFavorite(recipe.id));
  favButton.addEventListener("click", () => {
    toggleFavorite(recipe);
    paint(isFavorite(recipe.id));
  });
}

export async function detailResep(main, id) {
  try {
    const recipe = await getRecipe(id);
    main.innerHTML = view(recipe);
    mount(main, recipe);
  } catch (err) {
    if (err.status === 404) {
      main.innerHTML = `<div class="px-gutter pt-space-md">${stateBox(
        "ramen_dining",
        "Resep tidak ditemukan",
        "Resep ini mungkin sudah dihapus atau alamatnya salah.",
        backLink
      )}</div>`;
      return;
    }

    main.innerHTML = `<div class="px-gutter pt-space-md">${stateBox(
      "cloud_off",
      "Gagal memuat resep",
      "Periksa koneksi internet lalu coba lagi.",
      retryButton()
    )}</div>`;
    main.querySelector("[data-retry]").onclick = () => detailResep(main, id);
  }
}
