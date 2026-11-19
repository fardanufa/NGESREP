import { getFavorites, removeFavorite } from "../favorites.js";
import { esc, imgTag, rupiah, stateBox, toast } from "../ui.js";

const emptyState = stateBox(
  "soup_kitchen",
  "Belum ada resep favorit",
  "Tekan ikon hati pada resep untuk menyimpannya",
  `<a href="#/beranda" class="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-primary text-on-primary font-label-lg shadow-sm hover:opacity-90 active:scale-95 transition-all">
    <span class="material-symbols-outlined text-[20px]">search</span>Cari Resep</a>`
);

function card(item) {
  return `
  <a href="#/resep/${esc(item.id)}" class="min-w-0 bg-surface-container-lowest rounded-2xl p-3 shadow-sm flex items-center justify-between gap-3 active:scale-[0.99] transition-transform">
    <div class="flex items-center gap-3 min-w-0 flex-1">
      <div class="w-[76px] h-[76px] rounded-xl overflow-hidden bg-surface-container shrink-0">
        ${imgTag(item.image_url, item.name, "w-full h-full object-cover")}
      </div>
      <div class="flex flex-col min-w-0 flex-1 gap-1">
        <span class="font-headline-sm text-headline-sm text-on-surface truncate">${esc(item.name)}</span>
        <div class="flex flex-wrap items-center gap-2 text-on-surface-variant font-body-sm text-body-sm">
          <span class="flex items-center gap-0.5">
            <span class="material-symbols-outlined text-[14px]">schedule</span>${Number(item.cook_time) || 0} mnt
          </span>
          <span class="text-outline-variant">&bull;</span>
          <span class="bg-secondary/10 text-secondary font-label-sm text-label-sm px-2 py-0.5 rounded-full font-semibold">${rupiah(item.cost_estimate)}</span>
        </div>
      </div>
    </div>
    <button type="button" data-remove="${esc(item.id)}" aria-label="Hapus dari favorit"
      class="w-11 h-11 rounded-full flex items-center justify-center text-primary hover:bg-surface-container-high transition-colors shrink-0">
      <span class="material-symbols-outlined text-[24px]" style="font-variation-settings: 'FILL' 1;">favorite</span>
    </button>
  </a>`;
}

export async function favorit(main) {
  main.innerHTML = `
  <div class="px-gutter pt-space-md flex flex-col gap-space-md pb-space-lg">
    <section class="flex items-center justify-between">
      <div>
        <h1 class="font-headline-lg text-headline-lg text-on-surface">Resep Favorit</h1>
        <p class="font-body-md text-body-md text-on-surface-variant">Koleksi resep andalan yang sudah kamu simpan</p>
      </div>
      <div class="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-primary shadow-sm shrink-0">
        <span class="material-symbols-outlined text-[22px]" style="font-variation-settings: 'FILL' 1;">favorite</span>
      </div>
    </section>
    <div id="favorites-list" class="grid gap-space-sm md:grid-cols-2"></div>
  </div>`;

  const container = main.querySelector("#favorites-list");

  function draw() {
    const favorites = getFavorites();

    if (!favorites.length) {
      container.innerHTML = emptyState;
      return;
    }

    container.innerHTML = favorites.map(card).join("");

    container.querySelectorAll("[data-remove]").forEach((button) => {
      button.addEventListener("click", async (event) => {
        event.preventDefault();
        event.stopPropagation();
        try {
          await removeFavorite(button.dataset.remove);
          draw();
        } catch {
          toast("Perubahan favorit tidak tersimpan.");
        }
      });
    });
  }

  draw();
}
